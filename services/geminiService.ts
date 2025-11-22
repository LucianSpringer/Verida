
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BotanicalMorphology, CareProtocolMatrix, PestDiagnosis } from "../types";

// Using the specific preview model as requested for high-fidelity multimodal tasks
const TARGET_MODEL_VISION = 'gemini-3-pro-preview';
const TARGET_MODEL_CHAT = 'gemini-3-pro-preview';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PLANT_ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING },
    scientificTaxonomy: { type: Type.STRING },
    familyClassification: { type: Type.STRING },
    visualConfidenceScore: { type: Type.NUMBER, description: "Confidence between 0 and 1" },
    careRequirements: {
      type: Type.OBJECT,
      properties: {
        hydrationFrequencyDescription: { type: Type.STRING, description: "e.g., 'Every 3-4 days'" },
        photonicFluxRequirements: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'DIRECT'] },
        soilPhBalanceIdeal: { type: Type.NUMBER },
        atmosphericHumidityPercent: { type: Type.NUMBER },
        minTempCelsius: { type: Type.NUMBER },
        maxTempCelsius: { type: Type.NUMBER },
        toxicityToPets: { type: Type.BOOLEAN },
        toxicityToHumans: { type: Type.BOOLEAN }
      },
      required: ['hydrationFrequencyDescription', 'photonicFluxRequirements', 'minTempCelsius', 'maxTempCelsius']
    },
    detailedDescription: { type: Type.STRING }
  },
  required: ['commonName', 'scientificTaxonomy', 'careRequirements']
};

const PEST_ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    diagnosisName: { type: Type.STRING },
    confidenceScore: { type: Type.NUMBER },
    symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
    treatments: {
      type: Type.OBJECT,
      properties: {
        organic: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              instructions: { type: Type.STRING, description: "Application method and frequency" },
              dosage: { type: Type.STRING, description: "Specific amounts/concentration" },
              safety: { type: Type.STRING, description: "Safety precautions for humans/pets" },
              sideEffects: { type: Type.STRING, description: "Impact on beneficial insects/environment" }
            }
          } 
        },
        chemical: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              instructions: { type: Type.STRING, description: "Application method and frequency" },
              dosage: { type: Type.STRING, description: "Specific amounts/concentration" },
              safety: { type: Type.STRING, description: "Safety precautions for humans/pets" },
              sideEffects: { type: Type.STRING, description: "Impact on beneficial insects/environment" }
            }
          } 
        },
      }
    },
    treatmentComparison: {
      type: Type.OBJECT,
      properties: {
        organicSpeed: { type: Type.NUMBER, description: "Speed of results 1-10" },
        organicEffectiveness: { type: Type.NUMBER, description: "Long-term effectiveness 1-10" },
        chemicalSpeed: { type: Type.NUMBER, description: "Speed of results 1-10" },
        chemicalEffectiveness: { type: Type.NUMBER, description: "Long-term effectiveness 1-10" },
        description: { type: Type.STRING, description: "Brief comparison summary" }
      }
    },
    prevention: { type: Type.STRING }
  },
  required: ['diagnosisName', 'treatments', 'treatmentComparison', 'symptoms', 'prevention']
};

export const executeBotanicalIdentification = async (base64Image: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: TARGET_MODEL_VISION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze this botanical specimen. Identify the species with high precision. Return a strict JSON object containing taxonomy, care metrics, and environmental requirements."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: PLANT_ANALYSIS_SCHEMA,
        temperature: 0.2, // Low temperature for factual accuracy
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Neural network returned void response.");
    
    return JSON.parse(rawText);
  } catch (error) {
    console.error("Botanical Analysis Failure:", error);
    throw error;
  }
};

export const executePestDiagnosis = async (base64Image: string, context?: string): Promise<PestDiagnosis> => {
  try {
    const promptText = context 
      ? `Analyze this plant image for pests, diseases, or deficiencies. The user provided this context: "${context}". Identify the issue. Provide organic and chemical treatments including dosage and side effects. Compare the effectiveness of both approaches.`
      : "Analyze this plant image for pests, diseases, or deficiencies. Identify the issue. Provide organic and chemical treatments including dosage and side effects. Compare the effectiveness of both approaches.";

    const response = await ai.models.generateContent({
      model: TARGET_MODEL_VISION,
      contents: {
        parts: [
          {
            inlineData: { mimeType: 'image/jpeg', data: base64Image }
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: PEST_ANALYSIS_SCHEMA,
        temperature: 0.4,
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Diagnosis failed.");
    const data = JSON.parse(rawText);
    
    return {
      id: crypto.randomUUID(),
      diagnosisName: data.diagnosisName,
      confidenceScore: data.confidenceScore,
      symptoms: data.symptoms,
      treatments: data.treatments,
      treatmentComparison: data.treatmentComparison,
      prevention: data.prevention,
      rawAnalysis: rawText
    };
  } catch (error) {
    console.error("Pest Diagnosis Failure:", error);
    throw error;
  }
};

export const initiateBotanicalConsultation = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: TARGET_MODEL_CHAT,
      history: history,
      config: {
        systemInstruction: "You are Verida, an expert horticulturist and botanist. Provide concise, scientifically accurate, yet accessible gardening advice. Prioritize organic and sustainable practices.",
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I cannot articulate a response at this moment.";
  } catch (error) {
    console.error("Consultation Failure:", error);
    throw error;
  }
};
