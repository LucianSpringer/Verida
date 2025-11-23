
export enum EntityLifecycleState {
  IDLE = 'IDLE',
  ACQUIRING_OPTICAL_DATA = 'ACQUIRING_OPTICAL_DATA',
  PROCESSING_NEURAL_REQUEST = 'PROCESSING_NEURAL_REQUEST',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  ERROR_STATE = 'ERROR_STATE'
}

export interface BotanicalMorphology {
  commonName: string;
  scientificTaxonomy: string;
  familyClassification: string;
  estimatedAgeRange?: string;
  visualConfidenceScore: number;
}

export interface CareProtocolMatrix {
  hydrationFrequencyHours: number; // Computed from text
  photonicFluxRequirements: 'LOW' | 'MEDIUM' | 'HIGH' | 'DIRECT';
  soilPhBalanceIdeal: number;
  atmosphericHumidityPercent: number;
  toxicityVector: {
    canines: boolean;
    felines: boolean;
    humans: boolean;
  };
  temperatureRangeCelsius: {
    min: number;
    max: number;
  };
}

export interface PlantAnalysisArtifact {
  id: string;
  timestamp: number;
  morphology: BotanicalMorphology;
  careProtocol: CareProtocolMatrix;
  maintenanceComplexityIndex: number; // 0-100 calculated client-side
  rawDescription: string;
  base64Imagery: string;
}

export interface ConversationalNode {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

// --- New Features Types ---

export interface JournalEntry {
  id: string;
  timestamp: number;
  note: string;
  imageUrl?: string; // Base64
  tags: ('GROWTH' | 'FLOWERING' | 'ISSUE' | 'FERTILIZER' | 'TREATMENT')[];
}

export interface SavedPlant {
  id: string;
  nickname: string;
  speciesName: string;
  analysisId: string; // Ref to original analysis
  dateAdded: number;
  hydrationSchedule: {
    frequencyHours: number;
    lastWatered: number;
  };
  journalEntries: JournalEntry[];
  thumbnailUrl: string;
}

export interface TreatmentOption {
  name: string;
  instructions: string; // Frequency and method
  dosage: string; // Specific amounts
  safety: string; // Precautions
  sideEffects: string; // Impact on beneficial insects/environment
}

export interface TreatmentComparison {
  organicSpeed: number; // 1-10
  organicEffectiveness: number; // 1-10
  chemicalSpeed: number; // 1-10
  chemicalEffectiveness: number; // 1-10
  description: string;
}

export interface PestDiagnosis {
  id: string;
  diagnosisName: string;
  confidenceScore: number;
  symptoms: string[];
  treatments: {
    organic: TreatmentOption[];
    chemical: TreatmentOption[];
  };
  treatmentComparison: TreatmentComparison;
  prevention: string;
  rawAnalysis: string;
}

export interface UserProfile {
  name: string;
  country: string;
  bio?: string;
  avatarUrl: string | null;
  showcasePlantId: string | null;
}