/**
 * Utility functions for handling plant images
 */

/**
 * Test if an image URL is accessible
 */
export const testImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!url || url.trim() === '') {
            resolve(false);
            return;
        }

        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
    });
};

/**
 * Get a fallback placeholder image URL
 */
export const getPlaceholderImageUrl = (plantName: string): string => {
    // Use a placeholder service or generate a colored gradient based on plant name
    const colors = [
        '4ade80', // emerald
        '22c55e', // green
        '10b981', // emerald-500
        '059669', // emerald-600
    ];
    const colorIndex = plantName.length % colors.length;
    const color = colors[colorIndex];
    
    // Use a simple placeholder service
    return `https://via.placeholder.com/400x300/${color}/ffffff?text=${encodeURIComponent(plantName)}`;
};

/**
 * Get image URL with fallback
 */
export const getImageUrlWithFallback = async (primaryUrl: string, plantName: string): Promise<string> => {
    if (!primaryUrl || primaryUrl.trim() === '') {
        return getPlaceholderImageUrl(plantName);
    }

    // Test if primary URL works
    const isValid = await testImageUrl(primaryUrl);
    if (isValid) {
        return primaryUrl;
    }

    // Return placeholder if primary fails
    console.warn(`Image URL failed for ${plantName}, using placeholder:`, primaryUrl);
    return getPlaceholderImageUrl(plantName);
};

