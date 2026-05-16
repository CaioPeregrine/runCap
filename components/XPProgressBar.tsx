/**
 * components/XPProgressBar.tsx
 *
 * Barra de XP reutilizável.
 *
 * Comportamento visual:
 *   - A barra vai de 0 a XP_POR_NIVEL (200) e RESETA a cada nível.
 *   - O contador exibe o XP acumulado total:
 *       Nível 2 → "200 / 400 XP"
 *       Nível 3 → "400 / 600 XP"
 *   - Quando xpAnteriorNaBarra é fornecido, anima da posição anterior
 *     até a nova (usado na tela de conclusão).
 *   - No nível máximo: barra cheia, texto "2000 / 2000 XP · Nível máximo 🏆".
 */

import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { XP_POR_NIVEL, NIVEL_MAXIMO, XP_MAXIMO } from "@/app/hooks/useXP";

interface XPProgressBarProps {
  /** XP acumulado total atual (0–2000). */
  xpTotal: number;
  /** XP acumulado total do início do nível atual. Ex: nível 3 → 400. */
  xpInicioNivel: number;
  /** XP acumulado total do fim do nível atual.   Ex: nível 3 → 600. */
  xpFimNivel: number;
  /** Nível atual (1–10). */
  nivel: number;
  /**
   * Posição da barra ANTES da corrida (0–200).
   * Quando fornecido, a barra anima desse valor até a posição atual.
   */
  xpNaBarraAnterior?: number;
  /** Duração da animação em ms. Padrão: 1200. */
  duracao?: number;
  /** Cor da barra preenchida. Padrão: #22C3A3. */
  corBarra?: string;
  /** Mostrar badge "+200 XP" (tela de conclusão). */
  mostrarGanho?: boolean;
  /** XP ganho nessa corrida (para o badge). */
  xpGanho?: number;
  /** Usuário no nível máximo. */
  nivelMaximo?: boolean;
}

export default function XPProgressBar({
  xpTotal,
  xpInicioNivel,
  xpFimNivel,
  nivel,
  xpNaBarraAnterior,
  duracao = 1200,
  corBarra = "#22C3A3",
  mostrarGanho = false,
  xpGanho = 0,
  nivelMaximo = false,
}: XPProgressBarProps) {

  // Posição visual dentro do nível (0–200)
  const xpNaBarra = nivelMaximo ? XP_POR_NIVEL : Math.min(xpTotal - xpInicioNivel, XP_POR_NIVEL);
  const inicio    = xpNaBarraAnterior ?? xpNaBarra;

  const pctInicio = (inicio    / XP_POR_NIVEL) * 100;
  const pctFinal  = (xpNaBarra / XP_POR_NIVEL) * 100;

  const animWidth = useRef(new Animated.Value(pctInicio)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(animWidth, {
        toValue:         pctFinal,
        duration:        duracao,
        useNativeDriver: false,
      }).start();
    }, 300);
    return () => clearTimeout(t);
  }, [pctFinal]);

  const larguraBarra = animWidth.interpolate({
    inputRange:  [0, 100],
    outputRange: ["0%", "100%"],
  });

  // Texto do contador: "200 / 400 XP" ou "2000 / 2000 XP"
  const textoContador = nivelMaximo
    ? `${XP_MAXIMO} / ${XP_MAXIMO} XP`
    : `${xpTotal.toLocaleString()} / ${xpFimNivel.toLocaleString()} XP`;

  // XP faltando para o próximo nível
  const faltando = nivelMaximo ? 0 : xpFimNivel - xpTotal;

  return (
    <View style={estilos.container}>

      {/* Topo: label + contador */}
      <View style={estilos.topo}>
        <Text style={estilos.label}>Progresso XP</Text>
        <View style={estilos.topoDir}>
          {mostrarGanho && xpGanho > 0 && (
            <Text style={[estilos.ganho, { color: corBarra }]}>
              +{xpGanho} XP
            </Text>
          )}
          <Text style={estilos.contador}>{textoContador}</Text>
        </View>
      </View>

      {/* Trilha + barra animada */}
      <View style={estilos.trilha}>
        <Animated.View
          style={[estilos.barra, { width: larguraBarra, backgroundColor: corBarra }]}
        />
      </View>

      {/* Rodapé: faltando + nível */}
      <View style={estilos.rodape}>
        {nivelMaximo ? (
          <Text style={estilos.faltando}>Nível máximo atingido 🏆</Text>
        ) : (
          <Text style={estilos.faltando}>
            Faltam {faltando} XP para o nível {nivel + 1}
          </Text>
        )}
        <Text style={[estilos.nivelLabel, nivelMaximo && { color: corBarra }]}>
          nível {nivel}{nivelMaximo ? " ★" : ""}
        </Text>
      </View>

      {/* Indicador de 10 bolinhas */}
      <NivelIndicador nivel={nivel} corBarra={corBarra} />
    </View>
  );
}

// ─── Bolinhas de nível ────────────────────────────────────────────────────────

function NivelIndicador({ nivel, corBarra }: { nivel: number; corBarra: string }) {
  return (
    <View style={estilos.bolinhasWrap}>
      {Array.from({ length: NIVEL_MAXIMO }, (_, i) => i + 1).map((n) => {
        const ativo  = n <= nivel;
        const atual  = n === nivel;
        return (
          <View
            key={n}
            style={[
              estilos.bolinha,
              { backgroundColor: ativo ? corBarra : "#E5E7EB" },
              atual && estilos.bolinhaAtual,
            ]}
          >
            {atual && <Text style={estilos.bolinhaNum}>{n}</Text>}
          </View>
        );
      })}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  topoDir: { alignItems: "flex-end" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.3,
  },
  ganho: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  contador: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  trilha: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  barra: {
    height: "100%",
    borderRadius: 999,
  },
  rodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 12,
  },
  faltando: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  nivelLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  bolinhasWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  bolinha: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  bolinhaAtual: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  bolinhaNum: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
