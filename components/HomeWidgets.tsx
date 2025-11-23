// components/HomeWidgets.tsx
import React, { useState } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, MapPin, Loader2, Search, ArrowRight, X, ChevronRight, Leaf, ScanLine, FlaskConical, Camera, Image as ImageIcon } from 'lucide-react';
import { getWeatherDescription, WeatherData } from '../services/weatherService';

// Define Props: Widget now receives data & functions from Parent (App)
interface WeatherWidgetProps {
    weather: WeatherData | null;
    loading: boolean;
    error: string | null;
    locationLabel: string; // City name or "Local weather unavailable"
    onAutoLocate: () => void;
    onManualLocate: (city: string) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    weather,
    loading,
    error,
    locationLabel,
    onAutoLocate,
    onManualLocate
}) => {
    // Local state only for UI toggle (Input vs Buttons)
    const [isSearching, setIsSearching] = useState(false);
    const [cityInput, setCityInput] = useState('');

    const renderIcon = (type: string) => {
        switch (type) {
            case 'CLOUD': return <Cloud className="w-6 h-6 text-slate-500 fill-slate-200" />;
            case 'RAIN': return <CloudRain className="w-6 h-6 text-blue-500 fill-blue-200" />;
            case 'STORM': return <CloudLightning className="w-6 h-6 text-purple-500 fill-purple-200" />;
            case 'SNOW': return <Snowflake className="w-6 h-6 text-cyan-500 fill-cyan-100" />;
            default: return <Sun className="w-6 h-6 text-amber-500 fill-amber-500" />;
        }
    };

    const todayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const weatherInfo = weather ? getWeatherDescription(weather.conditionCode) : null;

    // FIX: Use a Form Submit handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Stop page reload
        if (cityInput.trim()) {
            onManualLocate(cityInput);
            setIsSearching(false);
            setCityInput('');
        }
    };

    return (
        <div className="bg-white rounded-[2rem] border border-amber-100 overflow-hidden shadow-sm mb-6 relative transition-all">
            <div className="p-6 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Today, {todayDate}</h2>
                    <div className="text-slate-500 text-sm mt-1 font-medium flex flex-col">
                        {loading ? (
                            <span className="flex items-center gap-1 text-amber-600"><Loader2 className="w-3 h-3 animate-spin" /> Updating...</span>
                        ) : error ? (
                            <span className="text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> {error}</span>
                        ) : (
                            <>
                                <span className="text-slate-900 font-bold">{locationLabel}</span>
                                <span className="text-xs">{weather ? weatherInfo?.label : "No data"}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-3xl font-light text-slate-800">
                        {weather ? `${Math.round(weather.temperature)}°C` : "--"}
                    </span>
                    <div className="bg-amber-50 p-2 rounded-full border border-amber-100">
                        {weather ? renderIcon(weatherInfo?.iconType || 'SUN') : <Sun className="w-6 h-6 text-slate-300" />}
                    </div>
                </div>
            </div>

            {/* ACTION BAR: Auto vs Manual Toggle */}
            <div className="bg-amber-50 px-6 py-3 border-t border-amber-100 min-h-[52px] flex items-center relative z-20"> {/* Added z-20 */}
                {isSearching ? (
                    // FORM WRAPPER FIXES THE ENTER KEY ISSUE
                    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <Search className="w-4 h-4 text-amber-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                            placeholder="Enter city (e.g. Tokyo)"
                            className="flex-1 bg-transparent outline-none text-sm font-bold text-amber-900 placeholder-amber-900/40 min-w-0"
                        />
                        {/* TYPE="SUBMIT" MAKES IT WORK */}
                        <button type="submit" className="p-1.5 bg-amber-200 text-amber-800 rounded-full hover:bg-amber-300 shrink-0">
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setIsSearching(false)} className="ml-1 text-amber-500 hover:text-amber-700 shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </form>
                ) : (
                    // DEFAULT MODE (OPTIONS)
                    <div className="flex w-full justify-between items-center animate-in fade-in">
                        <div className="flex items-center gap-2 text-amber-900/80">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wide">Set Location</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsSearching(true)}
                                className="text-amber-600 hover:text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                                Manual
                            </button>
                            <button
                                onClick={onAutoLocate}
                                className="bg-amber-200 hover:bg-amber-300 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                                Auto
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 2. Heal Crop Action Card ---
interface HealCropCardProps {
    onAction: () => void;
}

export const HealCropCard: React.FC<HealCropCardProps> = ({ onAction }) => {
    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-100 border border-slate-50 text-center space-y-8 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-0"></div>

            <h2 className="text-xl font-bold text-slate-900 text-left relative z-10">Heal your crop</h2>

            {/* 3-Step Process Visualization */}
            <div className="flex justify-between items-center px-2 sm:px-8 relative z-10">
                <StepItem icon={<Leaf className="w-6 h-6 text-emerald-600" />} label="Take a picture" />
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                <StepItem icon={<ScanLine className="w-6 h-6 text-slate-600" />} label="See diagnosis" />
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                <StepItem icon={<Search className="w-6 h-6 text-emerald-600" />} label="Identify" />
            </div>

            {/* Primary Action Button */}
            <button
                onClick={onAction}
                className="w-full py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95 relative z-10"
            >
                Take a picture
            </button>
        </div>
    );
};

const StepItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border-2 border-slate-100 shadow-sm">
            {icon}
        </div>
        <span className="text-xs font-bold text-slate-500 leading-tight max-w-[60px]">{label}</span>
    </div>
);

// --- 3. Source Selection Modal (The "Fork") ---
interface SourceSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onCamera: () => void;
    onGallery: () => void;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({ isOpen, onClose, onCamera, onGallery }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white w-full max-w-sm m-4 rounded-3xl p-6 space-y-4 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-900 text-lg">Select Image Source</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <button onClick={onCamera} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-50 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-200 transition-all group text-left">
                    <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 group-hover:bg-emerald-200 group-hover:scale-110 transition-all">
                        <Camera className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="block font-bold text-emerald-900">Take Photo</span>
                        <span className="text-xs text-emerald-600 font-medium">Use your camera</span>
                    </div>
                </button>

                <button onClick={onGallery} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-50 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-200 transition-all group text-left">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-200 group-hover:scale-110 transition-all">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="block font-bold text-blue-900">Upload Gallery</span>
                        <span className="text-xs text-blue-600 font-medium">Choose from files</span>
                    </div>
                </button>
            </div>
        </div>
    );
};
