export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  nivelRequerido: number;
}

export const conquistasData: Conquista[] = [
  {
    id: "cq_nivel_1",        // desbloqueada ao criar conta
    titulo: "Bem-vindo, corredor!",
    descricao: "Você criou sua conta e deu o primeiro passo.",
    icone: "👟",
    nivelRequerido: 1,
  },
  {
    id: "primeira_corrida",  // ← ID que já existe no seu Firestore
    titulo: "Primeiros passos",
    descricao: "Completou sua primeira corrida.",
    icone: "🏃",
    nivelRequerido: 2,
  },
  {
    id: "primeiro_km",       // ← ID que já existe no seu Firestore
    titulo: "Primeiro quilômetro",
    descricao: "Correu seu primeiro km.",
    icone: "📍",
    nivelRequerido: 2,
  },
  {
    id: "cinco_km",          // ← ID que já existe no seu Firestore
    titulo: "5 km completos",
    descricao: "Você correu 5 km no total.",
    icone: "🔥",
    nivelRequerido: 3,
  },
  {
    id: "sequencia_3",       // ← ID que já existe no seu Firestore
    titulo: "Sequência de 3 dias",
    descricao: "Correu 3 dias seguidos.",
    icone: "📅",
    nivelRequerido: 3,
  },
  {
    id: "cq_nivel_5",
    titulo: "Corredor dedicado",
    descricao: "Metade do caminho percorrido.",
    icone: "⭐",
    nivelRequerido: 5,
  },
  {
    id: "cq_nivel_6",
    titulo: "Maratonista em formação",
    descricao: "Mais de 1000 XP acumulados.",
    icone: "🏅",
    nivelRequerido: 6,
  },
  {
    id: "cq_nivel_7",
    titulo: "Explorador da Amazônia",
    descricao: "Explorou as rotas de Manaus.",
    icone: "🌿",
    nivelRequerido: 7,
  },
  {
    id: "cq_nivel_8",
    titulo: "Atleta urbano",
    descricao: "Suas corridas marcam presença pelas ruas.",
    icone: "🏙️",
    nivelRequerido: 8,
  },
  {
    id: "cq_nivel_9",
    titulo: "Quase no topo",
    descricao: "Só falta um nível!",
    icone: "🚀",
    nivelRequerido: 9,
  },
  {
    id: "cq_nivel_10",
    titulo: "Lenda de Manaus",
    descricao: "Você chegou ao nível máximo.",
    icone: "🏆",
    nivelRequerido: 10,
  },
];

export function conquistaDoNivel(nivel: number): Conquista | null {
  return conquistasData.find((c) => c.nivelRequerido === nivel) ?? null;
}