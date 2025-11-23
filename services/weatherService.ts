
export interface WeatherData {
    temperature: number;
    conditionCode: number;
    isDay: boolean;
}

export const getWeatherDescription = (code: number): { label: string; iconType: 'SUN' | 'CLOUD' | 'RAIN' | 'STORM' | 'SNOW' } => {
    if (code === 0) return { label: 'Clear Sky', iconType: 'SUN' };
    if ([1, 2, 3].includes(code)) return { label: 'Partly Cloudy', iconType: 'CLOUD' };
    if ([45, 48].includes(code)) return { label: 'Foggy', iconType: 'CLOUD' };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: 'Rain', iconType: 'RAIN' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', iconType: 'SNOW' };
    if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', iconType: 'STORM' };
    return { label: 'Unknown', iconType: 'SUN' };
};

export const resolveCityToCoords = async (city: string): Promise<{ lat: number, lon: number, name: string }> => {
    try {
        console.log(`Searching for city: ${city}`); // DEBUG LOG
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error("City not found");
        }

        return {
            lat: data.results[0].latitude,
            lon: data.results[0].longitude,
            name: data.results[0].name
        };
    } catch (error) {
        console.error("Geocoding failed:", error);
        throw error;
    }
};

export const fetchLocalWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    try {
        console.log(`Fetching weather for: ${lat}, ${lon}`); // DEBUG LOG
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await response.json();

        return {
            temperature: data.current_weather.temperature,
            conditionCode: data.current_weather.weathercode,
            isDay: data.current_weather.is_day === 1
        };
    } catch (error) {
        console.error("Weather fetch failed:", error);
        throw error;
    }
};
