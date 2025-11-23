
import React, { useState, useRef } from 'react';
import { executePestDiagnosis } from '../services/geminiService';
import { PestDiagnosis, TreatmentOption, SavedPlant, JournalEntry } from '../types';
import { AlertTriangle, Bug, Upload, Scan, Skull, Sprout, CloudSun, RefreshCw, ShieldCheck, AlertOctagon, Info, Beaker, Activity, ExternalLink, PlusCircle, Check, MessageCircle } from 'lucide-react';

interface PestDiagnoserProps {
  plants?: SavedPlant[];
  onUpdatePlant?: (plant: SavedPlant) => void;
  onOpenChat?: (context: string) => void;
}

export const PestDiagnoser: React.FC<PestDiagnoserProps> = ({ plants = [], onUpdatePlant, onOpenChat }) => {
  const [diagnosis, setDiagnosis] = useState<PestDiagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [envContext, setEnvContext] = useState('');
  const [isSelectingPlant, setIsSelectingPlant] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreviewUrl(reader.result as string);
      try {
        const result = await executePestDiagnosis(base64, envContext);
        setDiagnosis(result);
      } catch (e) {
        console.error(e);
        alert("Failed to diagnose");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setDiagnosis(null);
    setPreviewUrl(null);
    setEnvContext('');
    setIsSelectingPlant(false);
  };

  const handleTrackTreatment = (plantId: string) => {
    if (!diagnosis || !onUpdatePlant || !previewUrl) return;
    const plant = plants.find(p => p.id === plantId);
    if (!plant) return;

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      note: `Diagnosed with ${diagnosis.diagnosisName}. Started treatment plan. Symptoms: ${diagnosis.symptoms.join(', ')}`,
      tags: ['ISSUE', 'TREATMENT'],
      imageUrl: previewUrl
    };

    onUpdatePlant({
      ...plant,
      journalEntries: [newEntry, ...plant.journalEntries]
    });
    setIsSelectingPlant(false);
    alert(`Saved to ${plant.nickname}'s journal!`);
  };

  const generateSearchUrl = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 text-emerald-200 opacity-20 animate-pulse">
            <Bug className="w-full h-full" />
          </div>
          <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full">
            <div className="w-full h-2 bg-emerald-500/50 blur-sm absolute top-0 animate-scan-vertical shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-ping duration-1000" />
          <div className="absolute inset-4 border border-emerald-500/20 rounded-full animate-ping duration-1000 delay-150" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Analyzing Biological Vectors</h2>
          <p className="text-emerald-600 font-mono text-sm animate-pulse">
            Processing leaf patterns... checking pathology database...
          </p>
        </div>
        <style>{`
          @keyframes scan-vertical {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .animate-scan-vertical {
            animation: scan-vertical 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
      </div>
    );
  }

  if (diagnosis && previewUrl) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-8 pb-10 relative">
        {/* Track Treatment Modal Overlay */}
        {isSelectingPlant && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 animate-in fade-in">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Select Plant to Track</h3>
            {plants.length === 0 ? (
              <p className="text-slate-500">No plants in your garden yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl overflow-y-auto max-h-[60vh]">
                {plants.map(plant => (
                  <button
                    key={plant.id}
                    onClick={() => handleTrackTreatment(plant.id)}
                    className="flex items-center gap-4 p-4 bg-white border border-emerald-100 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all text-left group"
                  >
                    <img src={plant.thumbnailUrl} className="w-12 h-12 rounded-lg object-cover" alt={plant.nickname} />
                    <div>
                      <h4 className="font-bold text-emerald-900 group-hover:text-emerald-600">{plant.nickname}</h4>
                      <p className="text-xs text-slate-500">{plant.speciesName}</p>
                    </div>
                    <Check className="w-5 h-5 text-emerald-500 ml-auto opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setIsSelectingPlant(false)} className="mt-8 text-slate-500 hover:text-slate-800 font-medium">Cancel</button>
          </div>
        )}

        {/* Scan Again / Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500">
            <Bug className="w-5 h-5" />
            <span className="font-semibold">Diagnostic Result</span>
          </div>
          <div className="flex gap-2">
            {onUpdatePlant && (
              <button
                onClick={() => setIsSelectingPlant(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-medium transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Track Treatment
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-200 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              Scan Another
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-amber-100">
          {/* Diagnosis Header */}
          <div className="bg-gradient-to-r from-amber-900 to-amber-800 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-amber-500/20 p-1 rounded text-amber-200">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-amber-200 text-sm uppercase tracking-wider">Pathology Detected</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight">{diagnosis.diagnosisName}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1.5 w-24 bg-amber-950 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${diagnosis.confidenceScore * 100}%` }}></div>
                  </div>
                  <span className="text-amber-200 text-xs font-medium">{(diagnosis.confidenceScore * 100).toFixed(0)}% Confidence Match</span>
                </div>
              </div>
              <div className="w-full md:w-32 aspect-square rounded-xl overflow-hidden border-2 border-white/20 shadow-lg rotate-3">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Evidence" />
              </div>
            </div>
          </div>

          <div className="p-8 grid lg:grid-cols-5 gap-8">
            {/* Left Column: Stats & Symptoms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Comparison Chart */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Efficacy Comparison
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-700">Organic</span>
                      <div className="flex gap-3 text-[10px] text-slate-400 uppercase tracking-tighter">
                        <span>Speed</span>
                        <span>Potency</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="bg-emerald-400 rounded-l-full" style={{ flex: diagnosis.treatmentComparison.organicSpeed }} title="Speed"></div>
                      <div className="bg-emerald-600 rounded-r-full" style={{ flex: diagnosis.treatmentComparison.organicEffectiveness }} title="Effectiveness"></div>
                      <div className="bg-slate-200 rounded-full" style={{ flex: 20 - (diagnosis.treatmentComparison.organicSpeed + diagnosis.treatmentComparison.organicEffectiveness) }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-indigo-700">Chemical</span>
                      <div className="flex gap-3 text-[10px] text-slate-400 uppercase tracking-tighter">
                        <span>Speed</span>
                        <span>Potency</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="bg-indigo-400 rounded-l-full" style={{ flex: diagnosis.treatmentComparison.chemicalSpeed }} title="Speed"></div>
                      <div className="bg-indigo-600 rounded-r-full" style={{ flex: diagnosis.treatmentComparison.chemicalEffectiveness }} title="Effectiveness"></div>
                      <div className="bg-slate-200 rounded-full" style={{ flex: 20 - (diagnosis.treatmentComparison.chemicalSpeed + diagnosis.treatmentComparison.chemicalEffectiveness) }}></div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 italic mt-2 bg-white p-2 rounded border border-slate-100">{diagnosis.treatmentComparison.description}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Scan className="w-4 h-4" /> Symptom Analysis
                </h3>
                <ul className="space-y-3">
                  {diagnosis.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <AlertOctagon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5" /> Prevention Strategy
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed mb-3">{diagnosis.prevention}</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={generateSearchUrl(`${diagnosis.diagnosisName} prevention`)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-wide p-2 bg-white rounded border border-blue-100 justify-center hover:shadow-sm transition-all"
                  >
                    <ExternalLink className="w-3 h-3" /> External Resources
                  </a>
                  {onOpenChat && (
                    <button
                      onClick={() => onOpenChat(`How can I prevent ${diagnosis.diagnosisName} in the future?`)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 uppercase tracking-wide p-2 bg-white rounded border border-emerald-100 justify-center hover:shadow-sm transition-all"
                    >
                      <MessageCircle className="w-3 h-3" /> Ask Verida
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Treatments */}
            <div className="lg:col-span-3 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Sprout className="w-4 h-4" /> Recommended Protocols
              </h3>

              {/* Organic Treatments */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 mb-2">
                  <Sprout className="w-5 h-5" />
                  <span className="font-bold text-lg">Organic Solutions</span>
                </div>
                {diagnosis.treatments.organic.map((t, i) => (
                  <TreatmentCard key={i} treatment={t} type="organic" />
                ))}
              </div>

              <div className="w-full h-px bg-slate-100 my-4"></div>

              {/* Chemical Treatments */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Skull className="w-5 h-5" />
                  <span className="font-bold text-lg">Chemical Interventions</span>
                </div>
                {diagnosis.treatments.chemical.map((t, i) => (
                  <TreatmentCard key={i} treatment={t} type="chemical" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute -inset-8 bg-amber-100/50 rounded-full blur-2xl animate-pulse"></div>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-amber-100/50 relative z-10 border border-amber-50">
          <Bug className="w-16 h-16 text-amber-600" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-emerald-100 p-2 rounded-full border-2 border-white z-20">
          <Sprout className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Doctor Verida</h1>
        <p className="text-slate-500 text-lg leading-relaxed">
          Advanced pathology detection system. Identify pests, fungi, and deficiencies using Gemini 3 Vision.
        </p>
      </div>
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left space-y-3">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <CloudSun className="w-4 h-4 text-amber-500" />
          Environmental Context (Optional)
        </label>
        <textarea
          value={envContext}
          onChange={(e) => setEnvContext(e.target.value)}
          placeholder="e.g. It's been very humid lately, plant is near a drafty window, noticed spots 2 days ago..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm min-h-[80px]"
        />
      </div>
      <div className="flex gap-4 w-full sm:w-auto">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-amber-200 hover:-translate-y-1"
        >
          <Upload className="w-5 h-5" />
          Upload Specimen
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
};

const TreatmentCard: React.FC<{ treatment: TreatmentOption, type: 'organic' | 'chemical' }> = ({ treatment, type }) => {
  const isOrganic = type === 'organic';
  const bgColor = isOrganic ? 'bg-emerald-50' : 'bg-slate-50';
  const borderColor = isOrganic ? 'border-emerald-100' : 'border-slate-200';
  const textColor = isOrganic ? 'text-emerald-900' : 'text-slate-900';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-5 transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className={`font-bold ${textColor} text-lg`}>{treatment.name}</h4>
        {isOrganic && <span className="px-2 py-0.5 bg-white text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-100">Eco-Safe</span>}
      </div>

      <div className="space-y-3">
        <div className="flex gap-3 text-sm text-slate-600">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
          <div className="flex-1">
            <span className="font-bold text-xs uppercase text-slate-400 block mb-0.5">Instructions</span>
            {treatment.instructions}
          </div>
        </div>

        <div className="flex gap-3 text-sm text-slate-600 bg-white/50 p-2 rounded-lg border border-black/5">
          <Beaker className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
          <div className="flex-1">
            <span className="font-bold text-xs uppercase text-slate-400 block mb-0.5">Dosage</span>
            <span className="font-medium">{treatment.dosage}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex gap-2 text-xs text-slate-600">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <div>
              <span className="font-bold uppercase text-slate-400 block">Safety</span>
              {treatment.safety}
            </div>
          </div>
          <div className="flex gap-2 text-xs text-slate-600">
            <Bug className={`w-4 h-4 shrink-0 ${isOrganic ? 'text-emerald-500' : 'text-red-500'}`} />
            <div>
              <span className="font-bold uppercase text-slate-400 block">Side Effects</span>
              {treatment.sideEffects}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
