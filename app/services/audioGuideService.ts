/**
 * audioGuideService.ts
 *
 * Serviço de guia turístico por áudio com:
 *  - Background tracking via expo-task-manager
 *  - Busca por proximidade no Firestore (sem geohash, compatível com sua coleção)
 *  - Geração de descrição por Gemini via Cloud Function com cache no Firestore
 *  - Narração via expo-speech (funciona no fone e alto-falante)
 */

import { Audio } from "expo-av";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import * as TaskManager from "expo-task-manager";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

// ─── Constantes ────────────────────────────────────────────────────────────────

const BACKGROUND_TASK = "AUDIO_GUIDE_LOCATION_TASK";
const RAIO_ATIVACAO_M = 100; // distância para narrar o ponto

// ─── Estado interno ────────────────────────────────────────────────────────────

const pontosNarrados = new Set<string>();
let servicoAtivo = false;

let onPontoDetectado: ((nome: string) => void) | null = null;

export function setPontoDetectadoCallback(cb: (nome: string) => void) {
    onPontoDetectado = cb;
}

// ─── Task de background ────────────────────────────────────────────────────────

TaskManager.defineTask(BACKGROUND_TASK, async ({ data, error }: any) => {
    if (error) {
        console.error("[AudioGuide] Erro na task:", error);
        return;
    }
    if (!servicoAtivo) return;

    const locations: Location.LocationObject[] = data?.locations ?? [];
    if (!locations.length) return;

    const { latitude, longitude } = locations[locations.length - 1].coords;
    await verificarPontosProximos(latitude, longitude);
});

// ─── Funções públicas ──────────────────────────────────────────────────────────

export async function startAudioGuide(): Promise<void> {
    servicoAtivo = true;
    pontosNarrados.clear();

    // Configura áudio para tocar no fone/alto-falante e com tela bloqueada
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
    });

    // Permissões de localização
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== "granted") {
        console.warn("[AudioGuide] Permissão de foreground negada.");
        return;
    }
    await Location.requestBackgroundPermissionsAsync();

    // Evita registrar a task duas vezes
    const jaRegistrada = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    if (jaRegistrada) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
    }

    // Inicia o tracking em background
    await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
        accuracy: Location.Accuracy.High,
        distanceInterval: 15,
        timeInterval: 10_000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
            notificationTitle: "runCap",
            notificationBody: "Guia de pontos turísticos ativo 🗺️",
            notificationColor: "#1a58e9",
        },
        pausesUpdatesAutomatically: false,
    });

    console.log("[AudioGuide] Iniciado.");
}

export async function stopAudioGuide(): Promise<void> {
    servicoAtivo = false;
    Speech.stop();

    const registrada = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    if (registrada) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
    }

    console.log("[AudioGuide] Parado.");
}

export function resetarPontosNarrados(): void {
    pontosNarrados.clear();
}

// ─── Cálculo de distância ──────────────────────────────────────────────────────

function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Lógica principal ──────────────────────────────────────────────────────────

async function verificarPontosProximos(lat: number, lng: number): Promise<void> {
    try {
        // Busca todos os pontos da coleção (compatível com sua estrutura atual)
        const snap = await getDocs(collection(db, "pontosTuristicos"));

        for (const docSnap of snap.docs) {
            if (pontosNarrados.has(docSnap.id)) continue;

            const ponto = docSnap.data();

            // Usa os campos "latitude" e "longitude" do seu Firestore
            const distM = haversineDistance(
                lat, lng,
                ponto.latitude,
                ponto.longitude
            );

            if (distM <= RAIO_ATIVACAO_M) {
                pontosNarrados.add(docSnap.id);
                onPontoDetectado?.(ponto.nome);

                const descricao = await obterOuGerarDescricao(
                    docSnap.id,
                    ponto.nome,
                    ponto.latitude,
                    ponto.longitude,
                    ponto.descricao ?? null
                );

                await narrar(ponto.nome, descricao);
            }
        }
    } catch (e) {
        console.error("[AudioGuide] Erro ao verificar pontos:", e);
    }
}

// ─── Cache de descrições ───────────────────────────────────────────────────────

async function obterOuGerarDescricao(
    id: string,
    nome: string,
    lat: number,
    lng: number,
    descricaoExistente: string | null
): Promise<string> {
    // Já tem descrição salva no Firestore → usa direto sem chamar a IA
    if (descricaoExistente && descricaoExistente.trim().length > 10) {
        console.log(`[AudioGuide] Usando descrição existente: "${nome}"`);
        return descricaoExistente;
    }

    // Gera com Gemini via Cloud Function
    console.log(`[AudioGuide] Gerando descrição para "${nome}"...`);
    const descricao = await gerarDescricaoComGemini(nome, lat, lng);

    // Salva no Firestore para não chamar a IA de novo
    await setDoc(
        doc(db, "pontosTuristicos", id),
        { descricao, descricaoGeradaEm: serverTimestamp() },
        { merge: true }
    );

    return descricao;
}

// ─── Gemini via Cloud Function ─────────────────────────────────────────────────

async function gerarDescricaoComGemini(
    nome: string,
    lat: number,
    lng: number
): Promise<string> {
    try {
        const functions = getFunctions();
        const gerarDescricao = httpsCallable(functions, "gerarDescricaoPonto");
        const result = (await gerarDescricao({ nome, lat, lng })) as any;
        return result.data.descricao ?? fallbackDescricao(nome);
    } catch (e) {
        console.warn("[AudioGuide] Falha na Cloud Function:", e);
        return fallbackDescricao(nome);
    }
}

function fallbackDescricao(nome: string): string {
    return `Você está passando por ${nome}, um ponto especial de Manaus. Continue correndo e explorando a cidade!`;
}

// ─── Narração via expo-speech ──────────────────────────────────────────────────

async function narrar(nome: string, descricao: string): Promise<void> {
    // Aguarda narração anterior terminar
    const falando = await Speech.isSpeakingAsync();
    if (falando) {
        await new Promise<void>((resolve) => {
            const intervalo = setInterval(async () => {
                if (!(await Speech.isSpeakingAsync())) {
                    clearInterval(intervalo);
                    resolve();
                }
            }, 500);
        });
    }

    Speech.speak(`${nome}. ${descricao}`, {
        language: "pt-BR",
        rate: 0.92,
        pitch: 1.0,
    });
}