
export interface RecommendedPlant {
    id: string;
    name: string;
    scientific: string;
    image: string; // High-quality Unsplash URLs
    type: 'Flower' | 'Foliage' | 'Succulent';
    // NEW DATA FIELDS:
    description: string;
    care: {
        hydrationHours: number;
        sunlight: 'LOW' | 'MEDIUM' | 'HIGH' | 'DIRECT';
        humidity: number;
        tempMin: number;
        tempMax: number;
        isToxic: boolean;
    }
}

// EXPANDED DATABASE (6 Items Per Zone)
const PLANT_DATABASE = {
    TROPICAL: [
        {
            id: 't1', name: 'Hibiscus', scientific: 'Hibiscus rosa-sinensis', type: 'Flower', image: 'https://images.unsplash.com/photo-1572952875150-13f56ca12130?w=400&q=80',
            description: "A vibrant tropical flower known for its large, colorful blooms. It thrives in warm, humid climates.",
            care: { hydrationHours: 48, sunlight: 'HIGH', humidity: 60, tempMin: 15, tempMax: 30, isToxic: false }
        },
        {
            id: 't2', name: 'Bird of Paradise', scientific: 'Strelitzia', type: 'Flower', image: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=400&q=80',
            description: "Famous for its unique flowers that resemble a brightly colored bird in flight.",
            care: { hydrationHours: 120, sunlight: 'DIRECT', humidity: 50, tempMin: 18, tempMax: 30, isToxic: true }
        },
        {
            id: 't3', name: 'Monstera', scientific: 'Monstera deliciosa', type: 'Foliage', image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&q=80',
            description: "The 'Swiss Cheese Plant' is loved for its large, perforated leaves and tropical jungle vibe.",
            care: { hydrationHours: 168, sunlight: 'MEDIUM', humidity: 60, tempMin: 18, tempMax: 30, isToxic: true }
        },
        {
            id: 't4', name: 'Frangipani', scientific: 'Plumeria', type: 'Flower', image: 'https://images.unsplash.com/photo-1596726665767-5f40c7989356?w=400&q=80',
            description: "Produces fragrant, waxy flowers often used in leis. It needs plenty of sun and warmth.",
            care: { hydrationHours: 96, sunlight: 'DIRECT', humidity: 40, tempMin: 20, tempMax: 35, isToxic: true }
        },
        {
            id: 't5', name: 'Orchid', scientific: 'Phalaenopsis', type: 'Flower', image: 'https://images.unsplash.com/photo-1566914536647-79c29c88241d?w=400&q=80',
            description: "Elegant and exotic, orchids are prized for their long-lasting blooms and diverse varieties.",
            care: { hydrationHours: 168, sunlight: 'MEDIUM', humidity: 70, tempMin: 18, tempMax: 28, isToxic: false }
        },
        {
            id: 't6', name: 'Jasmine', scientific: 'Jasminum', type: 'Flower', image: 'https://images.unsplash.com/photo-1590820204791-456030ce148d?w=400&q=80',
            description: "Renowned for its sweet, heady fragrance, especially in the evening. A climbing beauty.",
            care: { hydrationHours: 72, sunlight: 'HIGH', humidity: 50, tempMin: 15, tempMax: 28, isToxic: false }
        }
    ],
    TEMPERATE: [
        {
            id: 'tp1', name: 'Rose', scientific: 'Rosa', type: 'Flower', image: 'https://images.unsplash.com/photo-1496857239036-1fb137683000?w=400&q=80',
            description: "The classic symbol of love and beauty. Roses require regular pruning and nutrient-rich soil to flourish.",
            care: { hydrationHours: 72, sunlight: 'DIRECT', humidity: 50, tempMin: 10, tempMax: 25, isToxic: true }
        },
        {
            id: 'tp2', name: 'Lavender', scientific: 'Lavandula', type: 'Flower', image: 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=400&q=80',
            description: "Known for its calming fragrance. Lavender loves full sun and well-draining, sandy soil.",
            care: { hydrationHours: 168, sunlight: 'DIRECT', humidity: 30, tempMin: 15, tempMax: 30, isToxic: true }
        },
        {
            id: 'tp3', name: 'Tulip', scientific: 'Tulipa', type: 'Flower', image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&q=80',
            description: "Spring-blooming perennials that grow from bulbs. They need a cold dormancy period to bloom.",
            care: { hydrationHours: 96, sunlight: 'HIGH', humidity: 40, tempMin: 5, tempMax: 20, isToxic: true }
        },
        {
            id: 'tp4', name: 'Hydrangea', scientific: 'Hydrangea macrophylla', type: 'Flower', image: 'https://images.unsplash.com/photo-1501472312651-726afe119ff1?w=400&q=80',
            description: "Features large, showy flower heads. Soil pH can affect the flower color (blue in acid, pink in alkaline).",
            care: { hydrationHours: 48, sunlight: 'MEDIUM', humidity: 60, tempMin: 10, tempMax: 25, isToxic: true }
        },
        {
            id: 'tp5', name: 'Cherry Blossom', scientific: 'Prunus serrulata', type: 'Flower', image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80',
            description: "Symbolizes the transient nature of life. These trees produce clouds of pink or white blossoms in spring.",
            care: { hydrationHours: 120, sunlight: 'HIGH', humidity: 50, tempMin: 5, tempMax: 25, isToxic: true }
        },
        {
            id: 'tp6', name: 'Sunflower', scientific: 'Helianthus', type: 'Flower', image: 'https://images.unsplash.com/photo-1610878180933-123728745d22?w=400&q=80',
            description: "Tall, bright, and cheerful. Sunflowers track the sun across the sky and produce edible seeds.",
            care: { hydrationHours: 48, sunlight: 'DIRECT', humidity: 40, tempMin: 15, tempMax: 30, isToxic: false }
        }
    ],
    COLD: [
        {
            id: 'c1', name: 'Pine', scientific: 'Pinus', type: 'Foliage', image: 'https://images.unsplash.com/photo-1579969406560-9676747cb988?w=400&q=80',
            description: "Evergreen conifers with needle-like leaves. Highly resilient to cold and wind.",
            care: { hydrationHours: 336, sunlight: 'HIGH', humidity: 30, tempMin: -20, tempMax: 20, isToxic: false }
        },
        {
            id: 'c2', name: 'Snowdrop', scientific: 'Galanthus', type: 'Flower', image: 'https://images.unsplash.com/photo-1518709911915-712d59df4604?w=400&q=80',
            description: "One of the earliest spring flowers, often blooming through the snow. Delicate white bell-shaped flowers.",
            care: { hydrationHours: 120, sunlight: 'MEDIUM', humidity: 50, tempMin: -5, tempMax: 15, isToxic: true }
        },
        {
            id: 'c3', name: 'Blue Spruce', scientific: 'Picea pungens', type: 'Foliage', image: 'https://images.unsplash.com/photo-1542261777-4ad28b70e069?w=400&q=80',
            description: "Known for its silvery-blue needles and conical shape. A popular ornamental and Christmas tree.",
            care: { hydrationHours: 168, sunlight: 'HIGH', humidity: 40, tempMin: -30, tempMax: 20, isToxic: false }
        },
        {
            id: 'c4', name: 'Winterberry', scientific: 'Ilex verticillata', type: 'Foliage', image: 'https://images.unsplash.com/photo-1543158097-f50c05d7629a?w=400&q=80',
            description: "A deciduous holly that loses its leaves in winter to reveal bright red berries.",
            care: { hydrationHours: 96, sunlight: 'MEDIUM', humidity: 50, tempMin: -20, tempMax: 15, isToxic: true }
        },
        {
            id: 'c5', name: 'Fir', scientific: 'Abies', type: 'Foliage', image: 'https://images.unsplash.com/photo-1514332415176-6561f6874ba6?w=400&q=80',
            description: "Evergreen trees with flat needles and upright cones. Known for their fresh, woody scent.",
            care: { hydrationHours: 168, sunlight: 'MEDIUM', humidity: 50, tempMin: -20, tempMax: 20, isToxic: false }
        },
        {
            id: 'c6', name: 'Crocus', scientific: 'Crocus vernus', type: 'Flower', image: 'https://images.unsplash.com/photo-1552554013-43c2c10b7549?w=400&q=80',
            description: "Cup-shaped flowers that bloom in early spring or late autumn. Available in purple, yellow, and white.",
            care: { hydrationHours: 120, sunlight: 'HIGH', humidity: 40, tempMin: -5, tempMax: 15, isToxic: true }
        }
    ]
};

// 2. The Bioclimatic Logic Engine
export const getPlantsByGeo = (lat: number): RecommendedPlant[] => {
    const absLat = Math.abs(lat);

    // Logic: Map Latitude Bands to Climate Zones
    if (absLat < 23.5) {
        return PLANT_DATABASE.TROPICAL as RecommendedPlant[]; // Equator to Tropics
    } else if (absLat < 50) {
        return PLANT_DATABASE.TEMPERATE as RecommendedPlant[]; // Subtropics to Temperate
    } else {
        return PLANT_DATABASE.COLD as RecommendedPlant[]; // Northern/Southern Hemispheres
    }
};

// Helper to get climate zone from latitude
export const getClimateZoneFromLat = (lat: number): 'TROPICAL' | 'TEMPERATE' | 'COLD' => {
    const absLat = Math.abs(lat);
    if (absLat < 23.5) return 'TROPICAL';
    if (absLat < 50) return 'TEMPERATE';
    return 'COLD';
};