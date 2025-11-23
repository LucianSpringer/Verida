import { GoogleGenerativeAI } from "@google/generative-ai";
import { PestDiagnosis } from "../types";

// Initialize Gemini
// We use 'gemini-1.5-flash' because it is fast, cheap/free, and great at vision tasks.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Helper to convert Base64 to a format Gemini accepts
 */
const fileToGenerativePart = (base64String: string, mimeType = "image/jpeg") => {
  return {
    inlineData: {
      data: base64String,
      mimeType,
    },
  };
};

// --- 1. Real Botanical Identification ---
export const executeBotanicalIdentification = async (base64Image: string): Promise<any> => {
  try {
    const prompt = `
      Analyze this plant image. Identify the species strictly.
      Return a RAW JSON object (no markdown formatting) with this exact structure:
      {
        "commonName": "string",
        "scientificTaxonomy": "string",
        "familyClassification": "string",
        "visualConfidenceScore": number (0-1),
        "careRequirements": {
          "hydrationFrequencyDescription": "string (e.g. Every 3 days)",
          "photonicFluxRequirements": "string (ONLY use: LOW, MEDIUM, HIGH, or DIRECT)",
          "soilPhBalanceIdeal": number,
          "atmosphericHumidityPercent": number,
          "minTempCelsius": number,
          "maxTempCelsius": number,
          "toxicityToPets": boolean,
          "toxicityToHumans": boolean
        },
        "detailedDescription": "string (Short description)"
      }
    `;

    const imagePart = fileToGenerativePart(base64Image);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown if Gemini adds it (```json ... ```)
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Botanical ID Failed:", error);
    throw new Error("Failed to identify plant. Please try again.");
  }
};

// --- 2. Real Pest Diagnosis ---
export const executePestDiagnosis = async (base64Image: string, context?: string): Promise<PestDiagnosis> => {
  try {
    const prompt = `
      Analyze this plant leaf/stem for pests, disease, or deficiencies.
      Context from user: "${context || 'No context'}".
      
      If the plant looks healthy, return a diagnosis of "Healthy Plant".
      If sick, Identify the issue.
      
      Return a RAW JSON object (no markdown) with this exact structure:
      {
        "diagnosisName": "string",
        "confidenceScore": number (0-1),
        "symptoms": ["string", "string"],
        "treatments": {
          "organic": [
            { "name": "string", "instructions": "string", "dosage": "string", "safety": "string", "sideEffects": "string" }
          ],
          "chemical": [
             { "name": "string", "instructions": "string", "dosage": "string", "safety": "string", "sideEffects": "string" }
          ]
        },
        "treatmentComparison": {
          "organicSpeed": number (1-10),
          "organicEffectiveness": number (1-10),
          "chemicalSpeed": number (1-10),
          "chemicalEffectiveness": number (1-10),
          "description": "string"
        },
        "prevention": "string",
        "rawAnalysis": "string"
      }
    `;

    const imagePart = fileToGenerativePart(base64Image);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonString = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    // Add the ID manually since API doesn't generate UUIDs
    return {
      ...data,
      id: crypto.randomUUID()
    };

  } catch (error) {
    console.error("Pest Diagnosis Failed:", error);
    throw new Error("Failed to diagnose plant.");
  }
};

// --- 3. Real Chatbot ---
export const initiateBotanicalConsultation = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  try {
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const result = await chat.sendMessage(newMessage);
    return result.response.text();
  } catch (error) {
    console.error("Chat Failed:", error);
    return "I am having trouble connecting to the botanical database right now.";
  }
};
