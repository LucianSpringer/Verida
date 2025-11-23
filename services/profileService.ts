import { supabase } from './supabaseClient';

export interface UserProfile {
    id?: string;
    user_id: string;
    display_name: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
    garden_showcase?: any;
    created_at?: string;
    updated_at?: string;
}

/**
 * Fetch user profile from Supabase
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No profile found - this is OK for new users
                return null;
            }
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Error fetching user profile:', err);
        return null;
    }
};

/**
 * Save/Update user profile to Supabase
 */
export const saveUserProfile = async (profile: {
    user_id: string;
    display_name: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
    garden_showcase?: any;
}): Promise<boolean> => {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return false;
    }

    try {
        // Check if profile exists
        const existing = await fetchUserProfile(profile.user_id);

        if (existing) {
            // Update existing profile
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    display_name: profile.display_name,
                    bio: profile.bio,
                    location: profile.location,
                    avatar_url: profile.avatar_url,
                    garden_showcase: profile.garden_showcase,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', profile.user_id);

            if (error) throw error;
        } else {
            // Insert new profile
            const { error } = await supabase
                .from('user_profiles')
                .insert([{
                    user_id: profile.user_id,
                    display_name: profile.display_name,
                    bio: profile.bio,
                    location: profile.location,
                    avatar_url: profile.avatar_url,
                    garden_showcase: profile.garden_showcase
                }]);

            if (error) throw error;
        }

        return true;
    } catch (err) {
        console.error('Error saving user profile:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        return false;
    }
};

/**
 * Upload profile avatar to Supabase Storage
 */
export const uploadProfileAvatar = async (userId: string, file: File): Promise<string | null> => {
    if (!supabase) return null;

    try {
        const fileName = `${userId}_${Date.now()}.${file.name.split('.').pop()}`;

        const { error: uploadError } = await supabase.storage
            .from('botanical_assets')
            .upload(`avatars/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('botanical_assets')
            .getPublicUrl(`avatars/${fileName}`);

        return urlData.publicUrl;
    } catch (err) {
        console.error('Error uploading avatar:', err);
        return null;
    }
};
