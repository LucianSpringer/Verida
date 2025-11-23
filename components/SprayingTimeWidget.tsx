import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Droplets, Wind, CloudRain, Thermometer, Info, Sun, Cloud, CloudLightning, Snowflake } from 'lucide-react';
import { ForecastData, ForecastDay, getWeatherDescription } from '../services/weatherService';

interface SprayingTimeWidgetProps {
    lat?: number;
    lon?: number;
    locationName: string;
}

interface SprayingCondition {
    hour: number;
    status: 'optimal' | 'moderate' | 'unfavourable';
    deltaT: number;
    rain: number;
    windSpeed: number;
    temperature: number;
    humidity: number;
}

export const SprayingTimeWidget: React.FC<SprayingTimeWidgetProps> = ({ lat, lon, locationName }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(false);
    const [sprayingConditions, setSprayingConditions] = useState<SprayingCondition[]>([]);

    // Calculate Delta T based on temperature and humidity
    const calculateDeltaT = (temp: number, humidity: number): number => {
        // Delta T = Temperature - (Temperature at which air is saturated at current humidity)
        // Simplified formula: Delta T ≈ temp - (dew point approximation)
        // Using a simplified calculation based on temperature and humidity relationship
        const dewPoint = temp - ((100 - humidity) / 5);
        return Math.max(0, temp - dewPoint);
    };

    // Determine spraying status based on conditions
    const getSprayingStatus = (deltaT: number, rain: number, windSpeed: number): 'optimal' | 'moderate' | 'unfavourable' => {
        let score = 0;

        // Delta T scoring (optimal: 2-8)
        if (deltaT >= 2 && deltaT <= 8) score += 2;
        else if (deltaT >= 0 && deltaT < 2) score += 1;
        else if (deltaT > 8 && deltaT <= 10) score += 1;
        else score -= 1;

        // Rain scoring (optimal: no rain)
        if (rain === 0) score += 2;
        else if (rain < 0.1) score += 1;
        else score -= 2;

        // Wind scoring (optimal: < 12 km/h)
        if (windSpeed < 12) score += 2;
        else if (windSpeed >= 12 && windSpeed <= 25) score += 1;
        else score -= 2;

        if (score >= 4) return 'optimal';
        if (score >= 2) return 'moderate';
        return 'unfavourable';
    };

    // Generate hourly spraying conditions for next 24 hours
    const generateSprayingConditions = (forecast: ForecastDay[]): SprayingCondition[] => {
        const conditions: SprayingCondition[] = [];
        const now = new Date();
        const currentHour = now.getHours();

        // Use today's forecast data to simulate hourly conditions
        const today = forecast[0];
        if (!today) return [];

        // Generate conditions for next 24 hours
        for (let i = 0; i < 24; i++) {
            const hour = (currentHour + i) % 24;
            // Simulate hourly variations (in real app, would use hourly forecast API)
            const tempVariation = (Math.sin((hour - 6) * Math.PI / 12) * 5); // Temperature varies throughout day
            const temperature = today.temperatureMax - Math.abs(tempVariation);
            const humidity = today.humidity + (Math.random() * 20 - 10); // Small variation
            const deltaT = calculateDeltaT(temperature, humidity);
            const rain = hour >= 20 || hour <= 6 ? today.precipitation / 8 : 0; // Assume rain at night
            const windSpeed = today.windSpeed + (Math.random() * 5 - 2.5); // Small variation

            conditions.push({
                hour,
                status: getSprayingStatus(deltaT, rain, windSpeed),
                deltaT: Math.round(deltaT * 10) / 10,
                rain: Math.round(rain * 100) / 100,
                windSpeed: Math.round(windSpeed * 10) / 10,
                temperature: Math.round(temperature),
                humidity: Math.round(humidity)
            });
        }

        return conditions;
    };

    useEffect(() => {
        if (isExpanded && lat && lon) {
            const loadForecast = async () => {
                setLoading(true);
                try {
                    const { fetchWeatherForecast } = await import('../services/weatherService');
                    const data = await fetchWeatherForecast(lat, lon);
                    setForecastData(data);
                    const conditions = generateSprayingConditions(data.forecast);
                    setSprayingConditions(conditions);
                } catch (error) {
                    console.error('Failed to load forecast:', error);
                } finally {
                    setLoading(false);
                }
            };
            loadForecast();
        }
    }, [isExpanded, lat, lon]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'optimal':
                return <div className="w-3 h-3 rounded-full bg-emerald-500"></div>;
            case 'moderate':
                return <div className="w-3 h-3 rounded-full bg-amber-500"></div>;
            default:
                return <div className="w-3 h-3 rounded-full bg-red-500"></div>;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'optimal':
                return 'Optimal';
            case 'moderate':
                return 'Moderate';
            default:
                return 'Unfavourable';
        }
    };

    if (!lat || !lon) {
        return null; // Don't show if location not set
    }

    return (
        <div className="bg-white rounded-[2rem] border border-emerald-100 overflow-hidden shadow-sm mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-full">
                        <Droplets className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-900">Spraying Time</h3>
                        <p className="text-xs text-slate-500">Best time to spray crops</p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2">
                    {loading ? (
                        <div className="py-8 text-center text-slate-400">Loading forecast...</div>
                    ) : forecastData ? (
                        <>
                            {/* Next 6 Days Forecast */}
                            <div>
                                <h4 className="font-bold text-slate-900 mb-3">Next 6 Days</h4>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {forecastData.forecast.map((day, index) => {
                                        const weatherInfo = getWeatherDescription(day.conditionCode);
                                        const date = new Date(day.date);
                                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                        
                                        return (
                                            <div key={index} className="flex-shrink-0 bg-slate-50 rounded-xl p-3 min-w-[80px] text-center">
                                                <p className="text-xs font-medium text-slate-600 mb-1">{dayName}</p>
                                                <div className="flex justify-center mb-1">
                                                    {weatherInfo.iconType === 'SUN' && <Sun className="w-6 h-6 text-amber-500" />}
                                                    {weatherInfo.iconType === 'CLOUD' && <Cloud className="w-6 h-6 text-slate-500" />}
                                                    {weatherInfo.iconType === 'RAIN' && <CloudRain className="w-6 h-6 text-blue-500" />}
                                                    {weatherInfo.iconType === 'STORM' && <CloudLightning className="w-6 h-6 text-purple-500" />}
                                                    {weatherInfo.iconType === 'SNOW' && <Snowflake className="w-6 h-6 text-cyan-500" />}
                                                </div>
                                                <p className="text-sm font-bold text-slate-900">{Math.round(day.temperatureMax)}°C</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Spraying Conditions */}
                            <div>
                                <h4 className="font-bold text-slate-900 mb-2">Spraying Conditions (Next 24h)</h4>
                                <p className="text-xs text-slate-500 mb-3">Based on temperature, humidity, rain, and wind</p>
                                
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {sprayingConditions.slice(0, 12).map((condition, index) => (
                                        <div key={index} className="flex-shrink-0 bg-slate-50 rounded-lg p-2 min-w-[70px] text-center">
                                            <p className="text-xs font-medium text-slate-600 mb-1">
                                                {condition.hour === new Date().getHours() ? 'Now' : `${condition.hour}:00`}
                                            </p>
                                            <div className="flex justify-center mb-1">
                                                {getStatusIcon(condition.status)}
                                            </div>
                                            <p className="text-[10px] text-slate-500">{getStatusLabel(condition.status)}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-slate-600">Optimal</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        <span className="text-slate-600">Moderate</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-slate-600">Unfavourable</span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                        <p className="text-xs text-blue-800">
                                            Optimal conditions: Delta T 2-8°C, no rain, wind &lt; 12 km/h. 
                                            Conditions calculated from temperature, humidity, precipitation, and wind speed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-center text-slate-400">Unable to load forecast data</div>
                    )}
                </div>
            )}
        </div>
    );
};

