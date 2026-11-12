import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysis, GeminiVote, AnalysisResult } from '../types';

const apiKey = process.env.API_KEY;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

// Helper to convert File to Base64 for Gemini
const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type
          }
        });
      } else {
        reject(new Error("Failed to process image file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeWithGemini = async (
  file: File,
  prediction: string, 
  confidence: number
): Promise<GeminiAnalysis> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const imagePart = await fileToPart(file);

  const prompt = `You are a secondary AI dermatologist validating a primary diagnosis.
  
The primary CNN model analyzed this image and predicted: "${prediction}" with ${confidence}% confidence.
The valid classes are: Melanoma (mel), Nevus (nv), Basal Cell Carcinoma (bcc).

Your Goal: Verify this prediction by visually analyzing the image yourself.

Tasks:
1. Analyze the image features (ABCD rule: Asymmetry, Border, Color, Diameter) to form your own independent diagnosis.
2. Compare your independent diagnosis with the CNN prediction ("${prediction}").
   - Vote "Agree" if your analysis matches the CNN prediction.
   - Vote "Disagree" if your analysis suggests a different condition.
   - Vote "Uncertain" if the image is low quality or ambiguous.
3. Explanation: Explain your reasoning.
4. Recommendation: Provide a standard medical recommendation.
5. Confidence: Estimate your OWN confidence score (0-100) based on the visual clarity and distinctness of features.
   - High (80-100): Clear features, classic presentation.
   - Medium (60-80): Typical but slightly ambiguous.
   - Low (0-60): Blurry, obscured, or conflicting features.
6. Do NOT simply vote based on the provided confidence score. Trust your visual analysis.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            vote: { 
              type: Type.STRING, 
              enum: [GeminiVote.Agree, GeminiVote.Uncertain, GeminiVote.Disagree] 
            },
            recommendation: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: "Gemini's own confidence score (0-100)" }
          },
          required: ["explanation", "vote", "recommendation", "confidence"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    const result = JSON.parse(text) as GeminiAnalysis;
    return result;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw new Error("Failed to get analysis from Gemini.");
  }
};

export const analyzeImageDirectly = async (file: File): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const imagePart = await fileToPart(file);
  
  const prompt = `Analyze this skin lesion image acting as a fallback diagnostic system.
The system supports ONLY these 3 conditions:
1. Melanoma (mel)
2. Nevus (nv)
3. Basal Cell Carcinoma (bcc)

Tasks:
1. Classify the image into one of the 3 codes (mel, nv, bcc).
2. Estimate a confidence score (0-100). 
   CRITICAL: Be extremely conservative. 
   - Default to 60-75% for typical cases.
   - Only give >90% if the image is high-resolution, perfectly clear, and undeniable.
   - If ambiguous, penalize heavily (below 60%).
3. Explain the condition.
4. Vote based on your own confidence (Agree >80%, Uncertain 60-80%, Disagree <60%).
5. Provide a recommendation.
6. Return the SAME confidence score in both 'cnnResult.confidence' and 'geminiResult.confidence'.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cnnResult: {
              type: Type.OBJECT,
              properties: {
                prediction: { type: Type.STRING, enum: ["mel", "nv", "bcc"] },
                confidence: { type: Type.NUMBER }
              },
              required: ["prediction", "confidence"]
            },
            geminiResult: {
              type: Type.OBJECT,
              properties: {
                explanation: { type: Type.STRING },
                vote: { 
                  type: Type.STRING, 
                  enum: [GeminiVote.Agree, GeminiVote.Uncertain, GeminiVote.Disagree] 
                },
                recommendation: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["explanation", "vote", "recommendation", "confidence"]
            }
          },
          required: ["cnnResult", "geminiResult"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini fallback analysis failed:", error);
    throw new Error("Failed to analyze image with Gemini fallback.");
  }
};