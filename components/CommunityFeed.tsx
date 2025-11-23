import React, { useEffect, useState } from 'react';
import { User, MapPin, ShieldCheck, Leaf, Upload, Loader2, Heart, MessageCircle, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { fetchGlobalObservations, submitObservation, PhenotypeObservation, recordPeerValidation, postAnalysisNote } from '../services/communityService';

// NEW: Component for the Interactive Footer
const InteractiveFooter: React.FC<{
    observation: PhenotypeObservation;
    onValidate: (type: 'UPVOTE' | 'DOWNVOTE') => void;
    currentUserId: string; // Placeholder for logged-in user
}> = ({ observation, onValidate, currentUserId }) => {

    // Mock Counts (Replace with real RPC/Function call for production)
    const validationCount = 7;
    const commentCount = 2;

    return (
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-slate-500">
            {/* 1. Validation (Like/Upvote) Button */}
            <button
                onClick={() => onValidate('UPVOTE')}
                className="flex items-center gap-2 hover:text-emerald-600 transition-colors"
                title="Upvote/Validate"
            >
                <ThumbsUp className="w-5 h-5" />
                <span className="font-semibold text-sm">{validationCount} Validations</span>
            </button>

            {/* 2. Comments/Notes */}
            <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">{commentCount} Notes</span>
            </div>

            {/* 3. Share/Action */}
            <button className="p-1 hover:text-slate-800 transition-colors">
                <Share2 className="w-5 h-5" />
            </button>
        </div>
    );
};

export const CommunityFeed: React.FC = () => {
    const [observations, setObservations] = useState<PhenotypeObservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // 1. Load Data on Mount
    useEffect(() => {
        loadObservations();
    }, []);

    const loadObservations = async () => {
        const data = await fetchGlobalObservations();
        setObservations(data);
        setIsLoading(false);
    };

    // 2. Handle New Upload (Simulation for Demo)
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setIsUploading(true);

        // Hardcoded for demo speed (In real app, you'd use the form input)
        const success = await submitObservation(
            e.target.files[0],
            "Monstera Deliciosa",
            "Tropical",
            "Researcher_01"
        );

        if (success) {
            await loadObservations(); // Refresh feed
            alert("Observation submitted to the global network.");
        } else {
            alert("Upload failed. Check Supabase keys.");
        }
        setIsUploading(false);
    };

    const handleValidationClick = (observationId: string, type: 'UPVOTE' | 'DOWNVOTE') => {
        // NOTE: Replace 'Researcher_Demo_ID' with the actual logged-in user's UUID
        recordPeerValidation(observationId, "Researcher_Demo_ID", type);
        // You would typically refresh the observations here or update the local state count
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header & Upload Action */}
            <div className="flex justify-between items-end px-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Global Research</h2>
                    <p className="text-slate-500 text-sm">Live phenotype data from the network</p>
                </div>
                <div className="relative">
                    <input
                        type="file"
                        onChange={handleUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                    />
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Submit Data
                    </button>
                </div>
            </div>

            {/* The Feed */}
            {isLoading ? (
                <div className="py-20 text-center text-slate-400">Syncing with database...</div>
            ) : observations.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                    <p className="text-slate-400 mb-2">No observations yet.</p>
                    <p className="text-xs text-slate-300">Be the first to contribute scientific data.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {observations.map((obs) => (
                        <div key={obs.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                            {/* Header */}
                            <div className="p-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-emerald-700" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{obs.researcher_name || 'Anon Researcher'}</h4>
                                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                            {new Date(obs.created_at).toLocaleDateString()} • ID: {obs.id.slice(0, 6)}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-700">Verified Flora</span>
                                </div>
                            </div>

                            {/* Image */}
                            <div className="aspect-video bg-slate-100 relative">
                                <img src={obs.visual_evidence_url} alt="Evidence" className="w-full h-full object-cover" />
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-xs font-medium">{obs.geo_climate_zone} Zone</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Leaf className="w-4 h-4 text-emerald-600" />
                                    <h3 className="font-bold text-lg text-slate-900">{obs.specimen_taxonomy}</h3>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Specimen uploaded for phenotype analysis. Growth patterns appear consistent with regional expectations.
                                </p>
                            </div>

                            {/* NEW: Interactive Footer */}
                            <InteractiveFooter
                                observation={obs}
                                currentUserId="Researcher_Demo_ID"
                                onValidate={(type) => handleValidationClick(obs.id, type)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
