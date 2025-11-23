import { createClient } from '@supabase/supabase-js';

// 1. Initialize Client (High-Performance Mode)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("🚨 Supabase Keys Missing! Check .env file.");
}

// Prevent crash if keys are missing (fallback to null, handle in functions)
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// 2. Scientific Data Types (High Entropy)
export interface PhenotypeObservation {
    id: string;
    researcher_name: string; // The user
    specimen_taxonomy: string; // Plant Name
    visual_evidence_url: string; // Photo
    geo_climate_zone: string; // E.g., "Tropical"
    created_at: string;
    verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

// NEW TYPE
export interface AnalysisNote {
    id: string;
    researcher_name: string;
    note_content: string;
    created_at: string;
}

// 3. High-Yield Fetch Logic
export const fetchGlobalObservations = async (): Promise<PhenotypeObservation[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('phenotype_observations') // <--- Custom Table Name
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Data Fetch Error:", err);
        return [];
    }
};

// 4. Submission Logic (The "Upload" function)
export const submitObservation = async (
    file: File,
    taxonomy: string,
    climate: string,
    username: string
): Promise<boolean> => {
    if (!supabase) return false;
    try {
        // A. Upload Image to Storage Bucket
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage
            .from('botanical_assets') // <--- Bucket Name
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // B. Get Public URL
        const { data: urlData } = supabase.storage
            .from('botanical_assets')
            .getPublicUrl(fileName);

        // C. Insert Data Row
        const { error: dbError } = await supabase
            .from('phenotype_observations')
            .insert([
                {
                    researcher_name: username,
                    specimen_taxonomy: taxonomy,
                    visual_evidence_url: urlData.publicUrl,
                    geo_climate_zone: climate,
                    verification_status: 'PENDING' // AI verification hook would go here
                }
            ]);

        if (dbError) throw dbError;
        return true;

    } catch (err) {
        console.error("Submission Protocol Failed:", err);
        return false;
    }
};

/**
 * 1. Post a new comment (Analysis Note)
 */
export const postAnalysisNote = async (
    observationId: string,
    content: string,
    researcherName: string
): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
        .from('analysis_notes')
        .insert([{ observation_id: observationId, note_content: content, researcher_name: researcherName }]);

    if (error) {
        console.error("Note submission failed:", error);
        return false;
    }
    return true;
};

/**
 * 2. Record a peer validation (Like/Upvote)
 */
export const recordPeerValidation = async (
    observationId: string,
    researcherId: string,
    type: 'UPVOTE' | 'DOWNVOTE'
): Promise<boolean> => {
    if (!supabase) return false;
    // NOTE: This simple version assumes the researcherId is known (logged in).
    // In the real Lumen app, you'd integrate Auth.
    const { error } = await supabase
        .from('peer_validations')
        .insert([{
            observation_id: observationId,
            researcher_id: researcherId,
            validation_type: type
        }]);

    if (error) {
        console.error("Validation record failed:", error);
        return false;
    }
    return true;
};
