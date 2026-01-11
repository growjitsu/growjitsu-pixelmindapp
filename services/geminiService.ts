
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, EnhancementConfig, AnimationConfig } from "../types";
import { getQuotaStatus, incrementUsage } from "./usageService";
import { supabase } from "../lib/supabase";

const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateImage = async (config: GenerationConfig): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuário não autenticado.");

  // Verificar Quota
  const quota = await getQuotaStatus(session.user.id, 'image');
  if (!quota.allowed) {
    throw new Error(`Limite diário atingido! Você já usou suas ${quota.limit} imagens de hoje. O limite reseta em 24h.`);
  }

  const ai = getGeminiClient();
  const stylePrompt = {
    realistic: "in a highly detailed realistic cinematic style, professional lighting",
    artistic: "in a beautiful artistic digital painting style, vibrant colors",
    anime: "in a modern high-quality anime style, clean lines, vibrant shading",
    cartoon: "in a playful 3D cartoon style, smooth textures, expressive characters",
    professional: "in a professional studio photography style, clean background, sharp focus"
  }[config.style];

  const fullPrompt = `${config.prompt}. ${stylePrompt}`;
  const apiAspectRatio = config.aspectRatio === '4:5' ? '3:4' : config.aspectRatio;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: apiAspectRatio as any,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        await incrementUsage(session.user.id, 'image');
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Dados de imagem não encontrados na resposta.");
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    throw new Error(error.message || "Falha ao gerar imagem.");
  }
};

export const enhanceImage = async (base64Image: string, mimeType: string, config: EnhancementConfig): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuário não autenticado.");

  // Melhorar conta como uso de imagem
  const quota = await getQuotaStatus(session.user.id, 'image');
  if (!quota.allowed) {
    throw new Error(`Limite diário atingido! Você não possui créditos de imagem para realizar melhorias hoje.`);
  }

  const ai = getGeminiClient();
  const enhancements = [];
  if (config.upscale) enhancements.push("increase resolution and reconstruct missing details for high definition");
  if (config.sharpen) enhancements.push("apply professional sharpening and clarify blurry edges");
  if (config.denoise) enhancements.push("remove digital noise, grain and compression artifacts");
  if (config.colorAdjust) enhancements.push("optimize dynamic range, vibrant colors and professional lighting balance");
  if (config.faceEnhance) enhancements.push("detect faces and restore skin texture, eyes and facial features with high fidelity");

  const enhancementPrompt = `Act as a professional high-end photo editor. Your task is to process the attached image applying exactly these enhancements: ${enhancements.join(", ")}. 
  YOU MUST RETURN THE MODIFIED IMAGE. Do not change the fundamental composition, only improve the quality according to the instructions.`;
  
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: enhancementPrompt }
        ]
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          await incrementUsage(session.user.id, 'image');
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("O modelo não retornou a imagem processada.");
  } catch (error: any) {
    console.error("Gemini Image Enhancement Error:", error);
    throw new Error(error.message || "Não foi possível melhorar a imagem agora.");
  }
};

export const animateImage = async (config: AnimationConfig, onProgress?: (msg: string) => void): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuário não autenticado.");

  // Verificar Quota de Vídeo
  const quota = await getQuotaStatus(session.user.id, 'video');
  if (!quota.allowed) {
    throw new Error(`Limite diário de vídeos atingido! Você já gerou ${quota.limit} vídeos hoje. Tente novamente amanhã.`);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = config.image.split(',')[1] || config.image;
  const finalPrompt = `${config.prompt}. The animation must be smooth and feel like it lasts exactly ${config.duration} seconds. Focus on cinematic realism.`;

  try {
    onProgress?.("Verificando créditos de animação...");
    
    let operation;
    try {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: finalPrompt,
        image: {
          imageBytes: base64Data,
          mimeType: config.mimeType || 'image/png'
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: config.aspectRatio
        }
      });
    } catch (e: any) {
      if (e.message?.includes("404") || e.message?.includes("not found")) {
        throw new Error("ENTITY_NOT_FOUND");
      }
      throw e;
    }

    onProgress?.("IA gerando sua animação...");

    let pollCount = 0;
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      pollCount++;
      operation = await ai.operations.getVideosOperation({ operation: operation });
      if (pollCount === 2) onProgress?.("Renderizando quadros de movimento...");
      if (pollCount === 5) onProgress?.(`Processando animação de ${config.duration}s...`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("O servidor não retornou um link de download.");

    onProgress?.("Download do vídeo final...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    
    await incrementUsage(session.user.id, 'video');

    return URL.createObjectURL(videoBlob);
  } catch (error: any) {
    if (error.message === "ENTITY_NOT_FOUND") {
      throw new Error("CHAVE_INVALIDA: O projeto desta chave não possui acesso ao modelo Veo.");
    }
    throw new Error(error.message || "Erro inesperado ao animar.");
  }
};
