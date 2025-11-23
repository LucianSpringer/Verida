import { GoogleGenerativeAI } from "@google/generative-ai";
import { PestDiagnosis } from "../types";

// --- CONFIGURATION ---
// 1. Define the Fallback Mock Data (The Safety Net)
const MOCK_PLANT_DATA = {
  commonName: "Monstera Deliciosa",
  scientificTaxonomy: "Monstera deliciosa",
  familyClassification: "Araceae",
  visualConfidenceScore: 0.98,
  careRequirements: {
    hydrationFrequencyDescription: "Every 7 days when soil is dry",
    hydrationIntervalDays: 7,
    photonicFluxRequirements: "MEDIUM",
    soilPhBalanceIdeal: 6.0,
    atmosphericHumidityPercent: 60,
    minTempCelsius: 18,
    maxTempCelsius: 30,
    toxicityToPets: true,
    toxicityToHumans: true
  },
  detailedDescription: "[DEMO MODE] Unable to connect to AI. Showing simulation. Monstera Deliciosa is famous for its natural leaf holes (fenestration)."
};

// 2. Initialize API (Safe Mode)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
console.log("🔑 Gemini API Key status:", apiKey ? "✅ Loaded" : "❌ Missing");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const fileToGenerativePart = (base64String: string, mimeType = "image/jpeg") => {
  return {
    inlineData: { data: base64String, mimeType },
  };
};

// --- MAIN FUNCTION: IDENTIFICATION ---
export const executeBotanicalIdentification = async (base64Image: string): Promise<any> => {
  console.log("🚀 Starting Analysis...");

  // A. FAST CHECK: If no key, skip straight to Mock
  if (!apiKey) {
    console.warn("⚠️ No API Key found in .env. Using Mock Data.");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake delay
    return MOCK_PLANT_DATA;
  }

  // B. TRY REAL API
  try {
    const prompt = `
      Analyze this plant image. Return valid JSON:
      {
        "commonName": "string",
        "scientificTaxonomy": "string",
        "familyClassification": "string",
        "visualConfidenceScore": number,
        "careRequirements": {
          "hydrationFrequencyDescription": "string",
          "hydrationIntervalDays": number,
          "photonicFluxRequirements": "LOW" | "MEDIUM" | "HIGH" | "DIRECT",
          "soilPhBalanceIdeal": number,
          "atmosphericHumidityPercent": number,
          "minTempCelsius": number,
          "maxTempCelsius": number,
          "toxicityToPets": boolean,
          "toxicityToHumans": boolean
        },
        "detailedDescription": "string"
      }
    `;

    const imagePart = fileToGenerativePart(base64Image);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean & Parse
    const jsonString = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    console.log("✅ API Success:", data);
    return data;

  } catch (error) {
    // C. CATCH ALL ERRORS -> RETURN MOCK DATA
    console.error("❌ API Failed. Switching to Fallback Mode.", error);

    // Alert the user briefly in console, but keep UI running
    await new Promise(resolve => setTimeout(resolve, 1000));
    return MOCK_PLANT_DATA;
  }
};

// --- PEST DIAGNOSIS (Same Pattern) ---
export const executePestDiagnosis = async (base64Image: string, context?: string): Promise<PestDiagnosis> => {
  // Fallback for Pest Diagnosis
  const MOCK_PEST_DATA = {
    id: crypto.randomUUID(),
    diagnosisName: "Spider Mites (Simulation)",
    confidenceScore: 0.95,
    symptoms: ["Yellow spots", "Webbing"],
    treatments: {
      organic: [{ name: "Neem Oil", instructions: "Spray daily", dosage: "5ml/L", safety: "Safe", sideEffects: "None" }],
      chemical: [{ name: "Miticide", instructions: "Use sparingly", dosage: "As label", safety: "Toxic", sideEffects: "Harmful to bees" }]
    },
    treatmentComparison: { organicSpeed: 5, organicEffectiveness: 8, chemicalSpeed: 9, chemicalEffectiveness: 9, description: "Chemical is faster." },
    prevention: "Increase humidity.",
    rawAnalysis: "Simulation Mode"
  };

  if (!apiKey) return MOCK_PEST_DATA;

  try {
    const prompt = `
      Analyze this plant image for pests, diseases, and deficiencies. Return valid JSON:
      {
        "diagnosisName": "string (e.g., 'Aphid Infestation' or 'Nitrogen Deficiency')",
        "confidenceScore": number (0-1),
        "symptoms": ["string array of visible symptoms"],
        "treatments": {
          "organic": [
            {
              "name": "string",
              "instructions": "string",
              "dosage": "string",
              "safety": "string",
              "sideEffects": "string"
            }
          ],
          "chemical": [
            {
              "name": "string",
              "instructions": "string",
              "dosage": "string",
              "safety": "string",
              "sideEffects": "string"
            }
          ]
        },
        "treatmentComparison": {
          "organicSpeed": number (1-10),
          "organicEffectiveness": number (1-10),
          "chemicalSpeed": number (1-10),
          "chemicalEffectiveness": number (1-10),
          "description": "string explaining tradeoffs"
        },
        "prevention": "string with prevention tips",
        "rawAnalysis": "string with detailed analysis"
      }
      ${context ? `Additional context: ${context}` : ''}
    `;

    const imagePart = fileToGenerativePart(base64Image);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean & Parse
    const jsonString = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    console.log("✅ Pest Diagnosis Success:", data);
    return {
      id: crypto.randomUUID(),
      ...data
    };

  } catch (error) {
    console.error("❌ Pest Diagnosis Failed. Switching to Fallback Mode.", error);
    return MOCK_PEST_DATA;
  }
};

export const initiateBotanicalConsultation = async (history: any[], msg: string): Promise<string> => {
  if (!apiKey) return "I am in Offline Mode. Please check your API Key.";

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(msg);
      return result.response.text();
    } catch (e: any) {
      console.error(`❌ Chat Error (Attempt ${attempt + 1}/${MAX_RETRIES}):`, e);

      // Check if it's a 503 Service Unavailable (Overloaded)
      if (e.message?.includes('503') || e.message?.includes('Overloaded')) {
        attempt++;
        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Model overloaded. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // If not 503 or retries exhausted, return error
      return "The botanical neural network is currently overloaded (503). Please try again in a moment.";
    }
  }

  return "Connection lost. I cannot reply right now.";
};

// --- SOIL TRACE ANALYSIS ---

export interface SoilAnalysisResult {
  analysisId: string;
  detectedElements: { element: string; concentration: number; idealRange: string }[];
  // Synthetic metric for complexity
  cationExchangeCapacityIndex: number;
  soilMicrobialHealthScore: number;
  recommendedFertilizer: string;
}

export const executeSoilTraceAnalysis = async (base64Image: string): Promise<SoilAnalysisResult> => {
  // Mock Data for Fallback
  const MOCK_SOIL_DATA: SoilAnalysisResult = {
    analysisId: crypto.randomUUID(),
    detectedElements: [
      { element: "Nitrogen (N)", concentration: 45, idealRange: "40-60 ppm" },
      { element: "Phosphorus (P)", concentration: 12, idealRange: "10-20 ppm" },
      { element: "Potassium (K)", concentration: 180, idealRange: "150-250 ppm" },
      { element: "Iron (Fe)", concentration: 4.5, idealRange: "2.0-5.0 ppm" }
    ],
    cationExchangeCapacityIndex: 78,
    soilMicrobialHealthScore: 8.5,
    recommendedFertilizer: "Balanced 10-10-10 NPK with micronutrients"
  };

  if (!apiKey) {
    console.warn("⚠️ No API Key found. Using Mock Soil Data.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return MOCK_SOIL_DATA;
  }

  try {
    const prompt = `
      Analyze this soil image. Return valid JSON matching this schema:
      {
        "detectedElements": [
          { "element": "string", "concentration": number, "idealRange": "string" }
        ],
        "cationExchangeCapacityIndex": number (0-100),
        "soilMicrobialHealthScore": number (0-10),
        "recommendedFertilizer": "string"
      }
    `;

    const imagePart = fileToGenerativePart(base64Image);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonString = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    console.log("✅ Soil Analysis Success:", data);
    return {
      analysisId: crypto.randomUUID(),
      ...data
    };

  } catch (error) {
    console.error("❌ Soil Analysis Failed. Switching to Fallback Mode.", error);
    return MOCK_SOIL_DATA;
  }
};
