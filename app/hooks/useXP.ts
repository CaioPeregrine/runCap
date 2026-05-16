/**
 * hooks/useXP.ts
 *
 * ─── Regras do sistema ───────────────────────────────────────────────────────
 *
 * XP_POR_NIVEL  = 200   → cada nível exige 200 XP
 * NIVEL_MAXIMO  = 10    → máximo é nível 10 (2000 XP acumulados)
 * XP_POR_CORRIDA = 200  → só corridas de Rotas Sugeridas contabilizam
 *
 * Barra visual: reseta a cada nível (sempre 0–200 visualmente).
 * Contador exibido: XP acumulado total / próximo múltiplo de 200.
 *
 * Exemplo de progressão:
 *   Nível 1 → xpTotal 0,   barra 0/200,   falta 200 XP
 *   Nível 2 → xpTotal 200, barra 0/200,   falta 200 XP  (contador: 200/400)
 *   Nível 3 → xpTotal 400, barra 0/200,   falta 200 XP  (contador: 400/600)
 *   …
 *   Nível 10→ xpTotal 1800,barra 200/200, TRAVADO (contador: 2000/2000)
 *
 * No Firestore são salvos:
 *   xpTotal        → XP acumulado total (0–2000)
 *   nivel          → nível atual (1–10)
 *   xpNaBarraNivel → XP dentro do nível atual (0–200), para a barra visual
 *
 * ── Somente Rotas Sugeridas ──────────────────────────────────────────────────
 * adicionarXP é chamado APENAS pela tela CorridaConcluida quando a corrida
 * veio de uma Rota Sugerida. Passe `origem: "rota_sugerida"` no params da
 * tela de conclusão e só chame adicionarXP se essa flag estiver presente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { conquistaDoNivel } from "@/app/(drawer)/conquistas/conquistasData";

// ─── Constantes ───────────────────────────────────────────────────────────────

export const XP_POR_CORRIDA = 200;
export const XP_POR_NIVEL   = 200;
export const NIVEL_MAXIMO   = 10;
export const XP_MAXIMO      = NIVEL_MAXIMO * XP_POR_NIVEL; // 2000

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ResultadoXP {
  // Estado ANTES
  xpTotalAntes:    number; // 0–2000
  xpNaBarraAntes:  number; // 0–200 (posição visual da barra antes)
  nivelAntes:      number; // 1–10

  // Estado DEPOIS
  xpTotalDepois:   number; // 0–2000
  xpNaBarraDepois: number; // 0–200 (posição visual da barra depois)
  nivelDepois:     number; // 1–10

  // Para o contador "200/400"
  xpInicioNivel:   number; // xpTotal do início do nível atual (ex: 200 no nível 2)
  xpFimNivel:      number; // xpTotal do fim do nível atual    (ex: 400 no nível 2)

  xpGanho:         number; // sempre 200 (ou 0 se travado)
  subiuNivel:      boolean;
  nivelMaximo:     boolean;
  conquistasDesbloqueadas: string[]; // ids das conquistas ganhas
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** XP acumulado necessário para ESTAR no início do nível `n`. */
export function xpInicioDoNivel(nivel: number): number {
  return (nivel - 1) * XP_POR_NIVEL;
}

/** XP acumulado necessário para SAIR do nível `n` (= início do nível n+1). */
export function xpFimDoNivel(nivel: number): number {
  return nivel * XP_POR_NIVEL;
}

/** Calcula o nível a partir do xpTotal acumulado. */
export function nivelDeXP(xpTotal: number): number {
  if (xpTotal >= XP_MAXIMO) return NIVEL_MAXIMO;
  return Math.floor(xpTotal / XP_POR_NIVEL) + 1;
}

/** Posição da barra dentro do nível atual (0–200). */
export function xpNaBarra(xpTotal: number, nivel: number): number {
  if (xpTotal >= XP_MAXIMO) return XP_POR_NIVEL; // barra cheia travada
  return xpTotal - xpInicioDoNivel(nivel);
}

// ─── initUsuario ──────────────────────────────────────────────────────────────

/**
 * Chame LOGO APÓS o Firebase Auth confirmar o login/cadastro.
 *
 * Primeiro acesso → cria o documento com xpTotal=0, nivel=1
 *                   e desbloqueia a conquista do nível 1.
 * Acessos seguintes → não faz nada (idempotente).
 *
 * Retorna true se foi o primeiro acesso.
 */
export async function initUsuario(
  uid: string,
  dadosIniciais?: { nome?: string; email?: string; codigoId?: string }
): Promise<boolean> {
  const ref  = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return false; // já inicializado

  const cq1 = conquistaDoNivel(1);
  const conquistas = cq1 ? [cq1.id] : [];

  await setDoc(ref, {
    nome:              dadosIniciais?.nome     ?? "Corredor",
    email:             dadosIniciais?.email    ?? "",
    codigoId:          dadosIniciais?.codigoId ?? uid.slice(0, 8).toUpperCase(),
    // ── XP ──
    xpTotal:           0,          // XP acumulado total (0–2000)
    xpNaBarraNivel:    0,          // posição visual da barra (0–200)
    nivel:             1,
    // ── Conquistas ──
    conquistas,                    // ["cq_nivel_1"] imediato
    conquistaDestaque: cq1?.id ?? null,
    // ── Outros ──
    maiorSequencia:    0,
    totalCorridas:     0,
    criadoEm:          new Date().toISOString(),
  });

  return true; // primeiro acesso
}

// ─── adicionarXP ─────────────────────────────────────────────────────────────

/**
 * Adiciona 200 XP (apenas de Rotas Sugeridas).
 *
 * Chame assim na tela CorridaConcluida:
 *   const origem = params.origem; // "rota_sugerida" ou undefined
 *   if (origem === "rota_sugerida") {
 *     const res = await adicionarXP(uid);
 *   }
 */
export async function adicionarXP(uid: string): Promise<ResultadoXP> {
  const ref  = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);
  const data = snap.data() ?? {};

  // Lê estado atual — compatível com documentos antigos que usavam "xp"
  const xpTotalAntes = data.xpTotal ?? data.xp ?? 0;
  const nivelAntes   = data.nivel   ?? nivelDeXP(xpTotalAntes);
  const conquistasAtuais: string[] = data.conquistas ?? [];

  // Já no máximo: não faz nada
  if (xpTotalAntes >= XP_MAXIMO) {
    return {
      xpTotalAntes,
      xpNaBarraAntes:  XP_POR_NIVEL,
      nivelAntes:      NIVEL_MAXIMO,
      xpTotalDepois:   XP_MAXIMO,
      xpNaBarraDepois: XP_POR_NIVEL,
      nivelDepois:     NIVEL_MAXIMO,
      xpInicioNivel:   xpInicioDoNivel(NIVEL_MAXIMO),
      xpFimNivel:      XP_MAXIMO,
      xpGanho:         0,
      subiuNivel:      false,
      nivelMaximo:     true,
      conquistasDesbloqueadas: [],
    };
  }

  // Calcula novo xpTotal (trava no máximo)
  const xpTotalDepois = Math.min(xpTotalAntes + XP_POR_CORRIDA, XP_MAXIMO);
  const nivelDepois   = nivelDeXP(xpTotalDepois);
  const subiuNivel    = nivelDepois > nivelAntes;
  const nivelMaximo   = xpTotalDepois >= XP_MAXIMO;

  // Posições da barra (visual 0–200, reseta por nível)
  const xpNaBarraAntes  = xpNaBarra(xpTotalAntes,  nivelAntes);
  const xpNaBarraDepois = xpNaBarra(xpTotalDepois, nivelDepois);

  // Conquistas desbloqueadas
  const conquistasNovas: string[] = [];
  if (subiuNivel) {
    for (let n = nivelAntes + 1; n <= nivelDepois; n++) {
      const cq = conquistaDoNivel(n);
      if (cq && !conquistasAtuais.includes(cq.id)) {
        conquistasNovas.push(cq.id);
      }
    }
  }

  // Salva no Firestore
  const payload: Record<string, unknown> = {
    xpTotal:        xpTotalDepois,
    xpNaBarraNivel: xpNaBarraDepois,
    nivel:          nivelDepois,
  };
  if (conquistasNovas.length > 0) {
    payload.conquistas = arrayUnion(...conquistasNovas);
  }

  await updateDoc(ref, payload);

  return {
    xpTotalAntes,
    xpNaBarraAntes,
    nivelAntes,
    xpTotalDepois,
    xpNaBarraDepois,
    nivelDepois,
    xpInicioNivel: xpInicioDoNivel(nivelDepois),
    xpFimNivel:    nivelMaximo ? XP_MAXIMO : xpFimDoNivel(nivelDepois),
    xpGanho:       xpTotalDepois - xpTotalAntes,
    subiuNivel,
    nivelMaximo,
    conquistasDesbloqueadas: conquistasNovas,
  };
}
