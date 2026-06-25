import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY ?? "");

export const gerarDescricaoPonto = onCall(async (request) => {
  const { nome, lat, lng } = request.data;

  if (!nome) throw new HttpsError("invalid-argument", "nome obrigatório");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Você é um guia turístico de Manaus, AM. O usuário está correndo e acabou de chegar em "${nome}" (lat ${lat}, lng ${lng}). Escreva uma narração curta e animada de até 3 frases para ser lida em voz alta. Inclua um dado histórico ou cultural relevante. Responda APENAS com o texto da narração, sem saudações ou formatação.`;

    const result = await model.generateContent(prompt);
    const texto = result.response.text();

    return { descricao: texto };
  } catch (e) {
    console.error("Erro ao gerar descrição:", e);
    throw new HttpsError("internal", "Erro ao gerar descrição");
  }
});