import { supabase } from './supabaseClient';
import { SavedPlant, PlantAnalysisArtifact } from '../types';

// --- GARDEN PERSISTENCE ---

export const fetchSavedPlants = async (userId: string): Promise<SavedPlant[]> => {
    try {
        const { data, error } = await supabase
            .from('saved_plants')
            .select('*')
            .eq('user_id', userId)
            .order('date_added', { ascending: false });

        if (error) throw error;

        return data.map(row => ({
            id: row.id,
            nickname: row.nickname,
            speciesName: row.species_name,
            analysisId: row.analysis_id,
            dateAdded: row.date_added,
            hydrationSchedule: row.hydration_schedule,
            journalEntries: row.journal_entries || [],
            thumbnailUrl: row.thumbnail_url
        }));
    } catch (error) {
        console.error('Error fetching saved plants:', error);
        return [];
    }
};

export const savePlantToGarden = async (plant: SavedPlant, userId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('saved_plants')
            .insert({
                id: plant.id,
                user_id: userId,
                nickname: plant.nickname,
                species_name: plant.speciesName,
                analysis_id: plant.analysisId,
                date_added: plant.dateAdded,
                hydration_schedule: plant.hydrationSchedule,
                journal_entries: plant.journalEntries,
                thumbnail_url: plant.thumbnailUrl
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error saving plant to garden:', error);
        throw error;
    }
};

export const deletePlantFromGarden = async (plantId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('saved_plants')
            .delete()
            .eq('id', plantId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting plant from garden:', error);
        throw error;
    }
};

// --- HISTORY PERSISTENCE ---

export const fetchScanHistory = async (userId: string): Promise<PlantAnalysisArtifact[]> => {
    try {
        const { data, error } = await supabase
            .from('scan_history')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        return data.map(row => ({
            id: row.id,
            timestamp: row.timestamp,
            base64Imagery: row.base64_imagery,
            morphology: row.morphology,
            careProtocol: row.care_protocol,
            maintenanceComplexityIndex: row.maintenance_complexity_index,
            rawDescription: row.raw_description
        }));
    } catch (error) {
        console.error('Error fetching scan history:', error);
        return [];
    }
};

export const recordScanHistory = async (artifact: PlantAnalysisArtifact, userId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('scan_history')
            .insert({
                id: artifact.id,
                user_id: userId,
                timestamp: artifact.timestamp,
                base64_imagery: artifact.base64Imagery,
                morphology: artifact.morphology,
                care_protocol: artifact.careProtocol,
                maintenance_complexity_index: artifact.maintenanceComplexityIndex,
                raw_description: artifact.rawDescription
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error recording scan history:', error);
        // Don't throw here, failing to save history shouldn't block the user flow
    }
};

export const deleteScanHistory = async (scanId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('scan_history')
            .delete()
            .eq('id', scanId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting scan history:', error);
        throw error;
    }
};
