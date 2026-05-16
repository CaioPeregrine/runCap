/**
 * conquistasData.ts
 *
 * 10 conquistas — uma por nível (1 a 10).
 * Nível 1 → desbloqueada no primeiro login.
 * Níveis 2-10 → desbloqueadas ao completar corridas de Rotas Sugeridas.
 */

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  nivelRequerido: number;
}

export const conquistasData: Conquista[] = [
  {
    id: "cq_nivel_1",
    titulo: "Bem-vindo, corredor!",
    descricao: "Você criou sua conta e deu o primeiro passo na sua jornada.",
    icone: "👟",
    nivelRequerido: 1,
  },
  {
    id: "cq_nivel_2",
    titulo: "Primeiros passos",
    descricao: "Completou sua primeira corrida e ganhou 200 XP.",
    icone: "🏃",
    nivelRequerido: 2,
  },
  {
    id: "cq_nivel_3",
    titulo: "Ritmo constante",
    descricao: "Você está pegando o ritmo. Continue assim!",
    icone: "🔥",
    nivelRequerido: 3,
  },
  {
    id: "cq_nivel_4",
    titulo: "Na trilha certa",
    descricao: "Já acumulou 600 XP explorando Manaus.",
    icone: "🗺️",
    nivelRequerido: 4,
  },
  {
    id: "cq_nivel_5",
    titulo: "Corredor dedicado",
    descricao: "Metade do caminho percorrido. Você é dedicado!",
    icone: "⭐",
    nivelRequerido: 5,
  },
  {
    id: "cq_nivel_6",
    titulo: "Maratonista em formação",
    descricao: "Mais de 1000 XP acumulados. A maratona espera por você.",
    icone: "🏅",
    nivelRequerido: 6,
  },
  {
    id: "cq_nivel_7",
    titulo: "Explorador da Amazônia",
    descricao: "Você explorou as rotas de Manaus como um verdadeiro aventureiro.",
    icone: "🌿",
    nivelRequerido: 7,
  },
  {
    id: "cq_nivel_8",
    titulo: "Atleta urbano",
    descricao: "Suas corridas marcam presença pelas ruas de Manaus.",
    icone: "🏙️",
    nivelRequerido: 8,
  },
  {
    id: "cq_nivel_9",
    titulo: "Quase no topo",
    descricao: "Só falta um nível para a conquista máxima. Não pare agora!",
    icone: "🚀",
    nivelRequerido: 9,
  },
  {
    id: "cq_nivel_10",
    titulo: "Lenda de Manaus",
    descricao: "Você chegou ao nível máximo. Uma verdadeira lenda das corridas!",
    icone: "🏆",
    nivelRequerido: 10,
  },
];

/** Conquista de um nível específico (ou null). */
export function conquistaDoNivel(nivel: number): Conquista | null {
  return conquistasData.find((c) => c.nivelRequerido === nivel) ?? null;
}
