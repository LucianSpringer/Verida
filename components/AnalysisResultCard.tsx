// components/AnalysisResultCard.tsx
import React from 'react';
import { RefreshCw, PlusCircle, MessageCircle, Activity, Droplets, Sun, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { PlantAnalysisArtifact } from '../types';
import { MetricHexagon } from './MetricHexagon';

interface AnalysisResultCardProps {
    artifact: PlantAnalysisArtifact;
    isSaved: boolean;
    onSave: () => void;
    onConsult: () => void;
    // Flexible header action: "Scan Again" for Identify tab, "Back" for History tab
    headerAction?: React.ReactNode;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
    artifact,
    isSaved,
    onSave,
    onConsult,
    headerAction
}) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative">
                {headerAction}

                <div className="flex flex-col md:flex-row gap-6 items-start mt-2">
                    <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden bg-emerald-100 relative group shadow-md">
                        <img
                            src={artifact.base64Imagery}
                            alt="Specimen"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-xs font-mono">CONFIDENCE: {(artifact.morphology.visualConfidenceScore * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wider uppercase">
                                    {artifact.morphology.familyClassification}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wider uppercase">
                                    IDX: {artifact.maintenanceComplexityIndex}/100
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                                {artifact.morphology.commonName}
                            </h2>
                            <p className="text-emerald-600 italic font-serif text-lg">
                                {artifact.morphology.scientificTaxonomy}
                            </p>
                        </div>

                        <p className="text-slate-600 leading-relaxed text-sm">
                            {artifact.rawDescription}
                        </p>

                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={onSave}
                                disabled={isSaved}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg ${isSaved ? 'bg-emerald-100 text-emerald-800 shadow-none cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                                    }`}
                            >
                                {isSaved ? <><CheckCircle className="w-5 h-5" /> Saved to Garden</> : <><PlusCircle className="w-5 h-5" /> Save to Garden</>}
                            </button>
                            <button
                                onClick={onConsult}
                                className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Consult AI Expert
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-100 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 to-teal-300"></div>
                    <h3 className="text-slate-900 font-semibold mb-6 w-full text-left flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Environmental Matrix
                    </h3>
                    <MetricHexagon data={artifact.careProtocol} />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-5 flex items-center gap-4 border border-blue-100">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <Droplets className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-blue-900 font-bold text-sm uppercase tracking-wide">Hydration Cycle</h4>
                            <p className="text-blue-700 font-medium">Every {Math.round(artifact.careProtocol.hydrationFrequencyHours / 24)} Days</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-5 flex items-center gap-4 border border-amber-100">
                        <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                            <Sun className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-amber-900 font-bold text-sm uppercase tracking-wide">Solar Flux</h4>
                            <p className="text-amber-700 font-medium">{artifact.careProtocol.photonicFluxRequirements} Exposure</p>
                        </div>
                    </div>

                    {(artifact.careProtocol.toxicityVector.canines || artifact.careProtocol.toxicityVector.felines) && (
                        <div className="bg-red-50 rounded-2xl p-5 flex items-center gap-4 border border-red-100 animate-pulse">
                            <div className="bg-red-100 p-3 rounded-full text-red-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-red-900 font-bold text-sm uppercase tracking-wide">Safety Warning</h4>
                                <p className="text-red-700 font-medium">Toxic to Pets</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
