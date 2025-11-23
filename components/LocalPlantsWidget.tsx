// components/LocalPlantsWidget.tsx
import React from 'react';
import { RecommendedPlant } from '../services/plantRecommendationService';

interface LocalPlantsWidgetProps {
    locationName: string;
    plants: RecommendedPlant[];
    onSelect: (plant: RecommendedPlant) => void;
}

export const LocalPlantsWidget: React.FC<LocalPlantsWidgetProps> = ({ locationName, plants, onSelect }) => {
    if (!plants || plants.length === 0) return null;

    return (
        <div className="space-y-4 mb-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-end px-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Native to {locationName}</h3>
                    <p className="text-xs text-slate-500">Curated based on your climate zone</p>
                </div>
            </div>

            {/* FIX: Ganti 'hide-scrollbar' dengan 'custom-x-scrollbar'.
               Hapus '-mx-2' agar scrollbar tidak terpotong margin negatif.
            */}
            <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x custom-x-scrollbar">
                {plants.map((plant) => (
                    <div
                        key={plant.id}
                        onClick={() => onSelect(plant)}
                        className="min-w-[140px] w-[140px] h-[200px] rounded-2xl relative overflow-hidden flex-shrink-0 snap-start shadow-md border border-slate-100 group cursor-pointer active:scale-95 transition-transform"
                    >
                        <img
                            src={plant.image}
                            alt={plant.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block mb-0.5">{plant.type}</span>
                            <h4 className="text-white font-bold leading-tight">{plant.name}</h4>
                            <p className="text-slate-300 text-[10px] italic truncate">{plant.scientific}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* FIX: CSS Baru untuk Scrollbar Horizontal Tipis */}
            <style>{`
                .custom-x-scrollbar::-webkit-scrollbar {
                    height: 6px; /* Tinggi scrollbar horizontal */
                }
                .custom-x-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-x-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0; /* Warna abu-abu muda */
                    border-radius: 20px;
                }
                .custom-x-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #cbd5e1; /* Lebih gelap saat di-hover */
                }
            `}</style>
        </div>
    );
};
