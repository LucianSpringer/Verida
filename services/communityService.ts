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
    researcher_name: string;
    specimen_taxonomy: string;
    visual_evidence_url: string;
    geo_climate_zone: string;
    created_at: string;
    verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    caption?: string;
}

export interface AnalysisNote {
    id: string;
    observation_id?: string;
    researcher_name: string;
    note_content: string;
    created_at: string;
}

// 3. High-Yield Fetch Logic
export const fetchGlobalObservations = async (): Promise<PhenotypeObservation[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('phenotype_observations')
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

// 4. Submission Logic
export const submitObservation = async (
    file: File,
    taxonomy: string,
    climate: string,
    username: string,
    caption: string
): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage
            .from('botanical_assets')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('botanical_assets')
            .getPublicUrl(fileName);

        const { error: dbError } = await supabase
            .from('phenotype_observations')
            .insert([{
                researcher_name: username,
                specimen_taxonomy: taxonomy,
                visual_evidence_url: urlData.publicUrl,
                geo_climate_zone: climate,
                verification_status: 'PENDING',
                caption: caption
            }]);

        if (dbError) throw dbError;
        return true;
    } catch (err) {
        console.error("Submission Protocol Failed:", err);
        return false;
    }
};

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

export const recordPeerValidation = async (
    observationId: string,
    researcherId: string,
    type: 'UPVOTE' | 'DOWNVOTE'
): Promise<boolean> => {
    if (!supabase) return false;
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

export const deleteObservation = async (observationId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('phenotype_observations')
            .delete()
            .eq('id', observationId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Delete failed:", err);
        return false;
    }
};

export const getValidationCount = async (observationId: string): Promise<number> => {
    if (!supabase) return 0;
    try {
        const { data, error } = await supabase
            .from('peer_validations')
            .select('id', { count: 'exact' })
            .eq('observation_id', observationId)
            .eq('validation_type', 'UPVOTE');

        if (error) throw error;
        return data?.length || 0;
    } catch (err) {
        return 0;
    }
};

export const getCommentCount = async (observationId: string): Promise<number> => {
    if (!supabase) return 0;
    try {
        const { data, error } = await supabase
            .from('analysis_notes')
            .select('id', { count: 'exact' })
            .eq('observation_id', observationId);

        if (error) throw error;
        return data?.length || 0;
    } catch (err) {
        return 0;
    }
};

export const fetchComments = async (observationId: string): Promise<AnalysisNote[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('analysis_notes')
            .select('*')
            .eq('observation_id', observationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Fetch comments failed:", err);
        return [];
    }
};

export const checkUserLiked = async (observationId: string, userId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { data, error } = await supabase
            .from('peer_validations')
            .select('id')
            .eq('observation_id', observationId)
            .eq('researcher_id', userId)
            .eq('validation_type', 'UPVOTE')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    } catch (err) {
        return false;
    }
};

export const removeLike = async (observationId: string, userId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('peer_validations')
            .delete()
            .eq('observation_id', observationId)
            .eq('researcher_id', userId)
            .eq('validation_type', 'UPVOTE');

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Remove like failed:", err);
        return false;
    }
};
