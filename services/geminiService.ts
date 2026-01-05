
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, EnhancementConfig, AnimationConfig } from "../types";
import { logUsage } from "./usageService";
import { supabase } from "../lib/supabase";

/**
 * Nota TÃÂ©cnica: Sempre criamos uma nova instÃÂ¢ncia do cliente antes da chamada
 * para garantir o uso da API Key mais recente injetada pelo diÃÂ¡logo de seleÃÂ§ÃÂ£o.
 */
const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });
};

export const generateImage = async (config: GenerationConfig): Promise<string> => {
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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          logUsage(session.user.id, 'image_generation');
        }
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Dados de imagem nÃÂ£o encontrados na resposta.");
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    throw new Error(error.message || "Falha ao gerar imagem.");
  }
};

export const enhanceImage = async (base64Image: string, mimeType: string, config: EnhancementConfig): Promise<string> => {
  const ai = getGeminiClient();
  const enhancements = [];
  
  // Mapeamento de instruÃÂ§ÃÂµes detalhadas para o modelo
  if (config.upscale) enhancements.push("increase resolution and reconstruct missing details for high definition");
  if (config.sharpen) enhancements.push("apply professional sharpening and clarify blurry edges");
  if (config.denoise) enhancements.push("remove digital noise, grain and compression artifacts");
  if (config.colorAdjust) enhancements.push("optimize dynamic range, vibrant colors and professional lighting balance");
  if (config.faceEnhance) enhancements.push("detect faces and restore skin texture, eyes and facial features with high fidelity");

  // Prompt mais "autoritÃÂ¡rio" para forÃÂ§ar a ediÃÂ§ÃÂ£o da imagem
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

    // Procura especificamente por partes que contenham inlineData (a imagem editada)
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            logUsage(session.user.id, 'image_enhancement');
          }
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("O modelo nÃÂ£o retornou a imagem processada. Tente reduzir o nÃÂºmero de opÃÂ§ÃÂµes selecionadas.");
  } catch (error: any) {
    console.error("Gemini Image Enhancement Error:", error);
    throw new Error(error.message || "NÃÂ£o foi possÃÂ­vel melhorar a imagem agora.");
  }
};

export const animateImage = async (config: AnimationConfig, onProgress?: (msg: string) => void): Promise<string> => {
  // ObrigatÃÂ³rio: Novo cliente por chamada para capturar a chave ativa
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });
  const base64Data = config.image.split(',')[1] || config.image;
  
  // CustomizaÃÂ§ÃÂ£o do prompt para influenciar a duraÃÂ§ÃÂ£o e fluidez
  const finalPrompt = `${config.prompt}. The animation must be smooth and feel like it lasts exactly ${config.duration} seconds. Focus on cinematic realism.`;

  try {
    onProgress?.("Conectando ao PixelMind Veo Engine...");
    
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

    onProgress?.("IA analisando cena e texturas...");

    // Polling da operaÃÂ§ÃÂ£o com mensagens dinÃÂ¢micas
    let pollCount = 0;
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      pollCount++;
      
      try {
        operation = await ai.operations.getVideosOperation({ operation: operation });
        
        if (pollCount === 2) onProgress?.("Iniciando renderizaÃÂ§ÃÂ£o de quadros...");
        if (pollCount === 5) onProgress?.(`Processando animaÃÂ§ÃÂ£o de ${config.duration}s...`);
        if (pollCount > 8) onProgress?.("Otimizando compressÃÂ£o de vÃÂ­deo...");
      } catch (e: any) {
        if (e.message?.includes("404") || e.message?.includes("not found")) {
           throw new Error("ENTITY_NOT_FOUND");
        }
        throw e;
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("O servidor nÃÂ£o retornou um link de download vÃÂ¡lido.");

    onProgress?.("Finalizando arquivo MP4...");
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT'}`);
    if (!response.ok) throw new Error("Falha ao baixar vÃÂ­deo gerado.");
    
    const videoBlob = await response.blob();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      logUsage(session.user.id, 'video_generation');
    }

    return URL.createObjectURL(videoBlob);
  } catch (error: any) {
    console.error("Video Gen Error:", error);
    if (error.message === "ENTITY_NOT_FOUND") {
      throw new Error("CHAVE_INVALIDA: O projeto desta chave de API nÃÂ£o possui acesso ao modelo Veo ou o faturamento estÃÂ¡ inativo.");
    }
    throw new Error(error.message || "Erro inesperado ao animar.");
  }
};
