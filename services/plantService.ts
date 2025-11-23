import { supabase } from './supabaseClient';
import { RecommendedPlant } from './plantRecommendationService';

/**
 * Fetch recommended plants from Supabase based on climate zone
 */
export const fetchRecommendedPlants = async (climateZone: 'TROPICAL' | 'TEMPERATE' | 'COLD'): Promise<RecommendedPlant[]> => {
    if (!supabase) {
        console.warn('Supabase not initialized, falling back to local database');
        // Fallback to local database if Supabase not available
        const { getPlantsByGeo } = await import('./plantRecommendationService');
        // Use a default latitude based on climate zone
        const defaultLat = climateZone === 'TROPICAL' ? 10 : climateZone === 'TEMPERATE' ? 35 : 60;
        return getPlantsByGeo(defaultLat);
    }

    try {
        console.log(`🔍 Fetching plants from Supabase for climate zone: ${climateZone}`);
        const { data, error } = await supabase
            .from('recommended_plants')
            .select('*')
            .eq('climate_zone', climateZone)
            .order('id', { ascending: true });

        if (error) {
            console.error('❌ Error fetching plants from Supabase:', error);
            console.log('🔄 Falling back to local database...');
            // Fallback to local database
            const { getPlantsByGeo } = await import('./plantRecommendationService');
            const defaultLat = climateZone === 'TROPICAL' ? 10 : climateZone === 'TEMPERATE' ? 35 : 60;
            return getPlantsByGeo(defaultLat);
        }

        if (!data || data.length === 0) {
            console.warn(`⚠️ No plants found in Supabase for ${climateZone} zone`);
            console.log('🔄 Falling back to local database...');
            // Fallback to local database if no data in Supabase
            const { getPlantsByGeo } = await import('./plantRecommendationService');
            const defaultLat = climateZone === 'TROPICAL' ? 10 : climateZone === 'TEMPERATE' ? 35 : 60;
            return getPlantsByGeo(defaultLat);
        }

        console.log(`✅ Fetched ${data.length} plants from Supabase for ${climateZone} zone`);
        
        // Transform Supabase data to RecommendedPlant format
        const plants = data.map((row: any) => {
            const plant = {
                id: row.id,
                name: row.name,
                scientific: row.scientific_name,
                image: row.image_url,
                type: row.type as 'Flower' | 'Foliage' | 'Succulent',
                description: row.description || '',
                care: {
                    hydrationHours: row.hydration_hours || 72,
                    sunlight: row.sunlight as 'LOW' | 'MEDIUM' | 'HIGH' | 'DIRECT',
                    humidity: row.humidity || 50,
                    tempMin: row.temp_min || 15,
                    tempMax: row.temp_max || 25,
                    isToxic: row.is_toxic || false
                }
            };
            // Log if image URL is missing or empty
            if (!plant.image || plant.image.trim() === '') {
                console.warn(`⚠️ Plant ${plant.name} (${plant.id}) has missing image URL`);
            }
            return plant;
        });
        
        return plants;
    } catch (err) {
        console.error('Error fetching recommended plants:', err);
        // Fallback to local database
        const { getPlantsByGeo } = await import('./plantRecommendationService');
        const defaultLat = climateZone === 'TROPICAL' ? 10 : climateZone === 'TEMPERATE' ? 35 : 60;
        return getPlantsByGeo(defaultLat);
    }
};

