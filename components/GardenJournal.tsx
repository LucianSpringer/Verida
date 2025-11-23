
import React, { useState, useRef, ChangeEvent } from 'react';
import { SavedPlant, JournalEntry } from '../types';
import { Plus, Droplets, Calendar, Camera, AlertCircle, Clock, CheckCircle, ArrowLeft, RefreshCw, ScanLine, X, Trash2 } from 'lucide-react';

interface GardenJournalProps {
  plants: SavedPlant[];
  onUpdatePlant: (plant: SavedPlant) => void;
  onScanNew?: () => void;
  onDeletePlant?: (plantId: string) => void;
}

export const GardenJournal: React.FC<GardenJournalProps> = ({ plants, onUpdatePlant, onScanNew, onDeletePlant }) => {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [entryNote, setEntryNote] = useState('');
  const [entryType, setEntryType] = useState<JournalEntry['tags'][0]>('GROWTH');
  // High Entropy Naming: Buffer represents draft state before mutation
  const [botanicalAssetBuffer, setBotanicalAssetBuffer] = useState<string | null>(null);
  const [wateringState, setWateringState] = useState<'IDLE' | 'WATERING' | 'DONE'>('IDLE');
  const entryFileRef = useRef<HTMLInputElement>(null);

  const selectedPlant = plants.find(p => p.id === selectedPlantId);

  const getWateringStatus = (plant: SavedPlant) => {
    const nextWatering = plant.hydrationSchedule.lastWatered + (plant.hydrationSchedule.frequencyHours * 3600 * 1000);
    const now = Date.now();
    const hoursRemaining = (nextWatering - now) / (3600 * 1000);

    if (hoursRemaining < 0) return { status: 'OVERDUE', color: 'bg-red-100 text-red-700', label: 'Water Now!' };
    if (hoursRemaining < 24) return { status: 'SOON', color: 'bg-amber-100 text-amber-700', label: 'Due Today' };
    return { status: 'GOOD', color: 'bg-emerald-100 text-emerald-700', label: `${Math.ceil(hoursRemaining / 24)} days` };
  };

  const handleWater = (e: React.MouseEvent, plant: SavedPlant) => {
    e.stopPropagation(); // Prevent event bubbling

    if (wateringState !== 'IDLE') return;

    setWateringState('WATERING');

    setTimeout(() => {
      try {
        const updatedPlant = {
          ...plant,
          hydrationSchedule: {
            ...plant.hydrationSchedule,
            lastWatered: Date.now()
          }
        };

        onUpdatePlant(updatedPlant);
        setWateringState('DONE');

        // Reset state after showing success message
        setTimeout(() => {
          setWateringState('IDLE');
        }, 2000);
      } catch (error) {
        console.error("Watering failed:", error);
        setWateringState('IDLE');
      }
    }, 600); // Slight delay for UI feel
  };

  // Logic: Decoupled from mutation. Only updates the draft buffer (Staged Mutation Step 1).
  const updateAssetDraft = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBotanicalAssetBuffer(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Logic: The actual mutation trigger (Staged Mutation Step 2).
  const executeEntryMutation = () => {
    if (!selectedPlant) return;

    // Allow entry if there is text OR an image
    if (!entryNote.trim() && !botanicalAssetBuffer) return;

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      note: entryNote,
      tags: [entryType],
      imageUrl: botanicalAssetBuffer || undefined
    };

    onUpdatePlant({
      ...selectedPlant,
      journalEntries: [newEntry, ...selectedPlant.journalEntries]
    });

    // Reset form
    setIsAddingEntry(false);
    setEntryNote('');
    setBotanicalAssetBuffer(null);
  };

  const handleCancelEntry = () => {
    setIsAddingEntry(false);
    setEntryNote('');
    setBotanicalAssetBuffer(null);
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'ISSUE': return 'bg-red-100 text-red-700 border border-red-200';
      case 'TREATMENT': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'FLOWERING': return 'bg-pink-100 text-pink-700 border border-pink-200';
      case 'FERTILIZER': return 'bg-amber-100 text-amber-700 border border-amber-200';
      default: return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
  };

  // Detail View
  if (selectedPlant) {
    const status = getWateringStatus(selectedPlant);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 h-full flex flex-col animate-in slide-in-from-right-4">
        {/* Header */}
        <div className="p-6 border-b border-emerald-50 flex flex-col sm:flex-row justify-between items-start bg-emerald-50/30 rounded-t-2xl gap-4">
          <div className="flex gap-4">
            <img src={selectedPlant.thumbnailUrl} className="w-20 h-20 rounded-xl object-cover shadow-sm border border-white" alt="Thumbnail" />
            <div>
              <button
                onClick={() => setSelectedPlantId(null)}
                className="group flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 hover:text-emerald-800 transition-colors"
              >
                <div className="bg-emerald-100 p-1 rounded group-hover:bg-emerald-200 transition-colors">
                  <ArrowLeft className="w-3 h-3" />
                </div>
                Back to Garden
              </button>
              <h2 className="text-2xl font-bold text-emerald-950 leading-tight">{selectedPlant.nickname}</h2>
              <p className="text-emerald-700 italic font-medium">{selectedPlant.speciesName}</p>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-end gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${status.color}`}>
              {status.label}
            </div>

            <div className="flex gap-2">
              {onScanNew && (
                <button
                  onClick={onScanNew}
                  className="p-2.5 text-emerald-600 bg-white border border-emerald-100 hover:bg-emerald-50 rounded-lg transition-colors shadow-sm"
                  title="Scan New Plant"
                >
                  <ScanLine className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => handleWater(e, selectedPlant)}
                disabled={wateringState !== 'IDLE'}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all shadow-md font-medium min-w-[140px] justify-center ${wateringState === 'DONE'
                    ? 'bg-emerald-500 text-white shadow-emerald-200 scale-105'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5'
                  } disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {wateringState === 'DONE' ? <CheckCircle className="w-4 h-4" /> : <Droplets className={`w-4 h-4 ${wateringState === 'WATERING' ? 'animate-bounce' : ''}`} />}
                <span>{wateringState === 'DONE' ? 'Watered!' : wateringState === 'WATERING' ? 'Watering...' : 'Water Plant'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Entry Form */}
        <div className="p-6 border-b border-emerald-50">
          {!isAddingEntry ? (
            <button
              onClick={() => setIsAddingEntry(true)}
              className="w-full py-3 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-600 font-medium hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 hover:border-emerald-300"
            >
              <Plus className="w-5 h-5" /> Add Journal Entry
            </button>
          ) : (
            <div className="bg-emerald-50/50 p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 border border-emerald-100">
              <textarea
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
                placeholder="Notes on growth, leaves, or care..."
                className="w-full p-3 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-white"
                rows={3}
              />

              {/* Image Preview / Draft State */}
              {botanicalAssetBuffer && (
                <div className="relative inline-block group">
                  <img src={botanicalAssetBuffer} alt="Entry Draft" className="h-24 w-24 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                  <button
                    onClick={() => setBotanicalAssetBuffer(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600 transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto pb-1">
                {['GROWTH', 'FLOWERING', 'ISSUE', 'FERTILIZER'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setEntryType(tag as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${entryType === tag ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => entryFileRef.current?.click()}
                  className="text-emerald-600 flex items-center gap-2 text-sm font-medium hover:text-emerald-800 p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <Camera className="w-4 h-4" /> {botanicalAssetBuffer ? 'Change Photo' : 'Attach Photo'}
                </button>
                <div className="flex gap-2">
                  <button onClick={handleCancelEntry} className="px-4 py-2 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                  {/* Manual Trigger: Post */}
                  <button onClick={executeEntryMutation} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition-colors">Post</button>
                </div>
              </div>
              <input
                type="file"
                ref={entryFileRef}
                className="hidden"
                accept="image/*"
                onChange={updateAssetDraft}
              />
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {selectedPlant.journalEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center text-slate-400 py-12 gap-2">
              <div className="bg-slate-50 p-4 rounded-full">
                <Clock className="w-8 h-8 text-slate-300" />
              </div>
              <p>No journal entries yet.</p>
            </div>
          )}
          {selectedPlant.journalEntries.map(entry => (
            <div key={entry.id} className="flex gap-4 group">
              <div className="flex flex-col items-center pt-1">
                <div className={`w-3 h-3 rounded-full ring-4 ring-white ${entry.tags.includes('TREATMENT') ? 'bg-purple-400' : entry.tags.includes('ISSUE') ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                <div className="w-0.5 flex-1 bg-slate-100 group-last:bg-transparent my-1"></div>
              </div>
              <div className="pb-6 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-slate-400 uppercase font-medium">{new Date(entry.timestamp).toLocaleDateString()}</span>
                  {entry.tags.map(tag => (
                    <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${getTagStyle(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={`p-4 rounded-xl shadow-sm text-slate-700 text-sm ${entry.tags.includes('TREATMENT') ? 'bg-purple-50 border border-purple-100' : 'bg-white border border-slate-100'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{entry.note}</p>
                  {entry.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-200/50 shadow-sm inline-block">
                      <img src={entry.imageUrl} alt="Entry" className="max-w-xs max-h-48 object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="space-y-6">
      {/* Grid Header with Action */}
      {plants.length > 0 && (
        <div className="flex justify-end">
          {onScanNew && (
            <button
              onClick={onScanNew}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl font-medium transition-all shadow-sm"
            >
              <ScanLine className="w-4 h-4" />
              Scan New Plant
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        {plants.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-6 border-2 border-dashed border-emerald-100 rounded-3xl bg-emerald-50/30">
            <div className="bg-white p-4 rounded-full shadow-sm">
              <Calendar className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-emerald-900">Your Garden is Empty</h3>
              <p className="text-emerald-600 text-sm max-w-xs mx-auto">Start by identifying plants to track their care and growth.</p>
            </div>
            {onScanNew && (
              <button
                onClick={onScanNew}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
              >
                <ScanLine className="w-5 h-5" />
                Identify First Plant
              </button>
            )}
          </div>
        )}

        {plants.map(plant => {
          const watering = getWateringStatus(plant);
          return (
            <div
              key={plant.id}
              onClick={() => setSelectedPlantId(plant.id)}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group relative"
            >
              <div className="h-48 overflow-hidden relative bg-slate-100">
                <img src={plant.thumbnailUrl} alt={plant.nickname} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight truncate text-shadow">{plant.nickname}</h3>
                    <p className="text-xs text-emerald-100 font-medium truncate">{plant.speciesName}</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                  <Clock className="w-3 h-3 text-white" />
                  <span className="text-xs text-white font-medium">{watering.label}</span>
                </div>
                {onDeletePlant && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeletePlant(plant.id); }}
                    className="absolute top-3 left-3 bg-red-500/80 backdrop-blur-md hover:bg-red-600 text-white p-2 rounded-lg transition-all shadow-sm hover:scale-110 z-10"
                    title="Delete plant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-4 flex justify-between items-center bg-white">
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  {plant.journalEntries.length} Journal Entries
                </span>
                <button
                  onClick={(e) => handleWater(e, plant)}
                  className={`p-2.5 rounded-full transition-all z-10 relative shadow-sm hover:scale-110 active:scale-95 ${watering.status === 'OVERDUE'
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-2 ring-red-100 animate-pulse'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                    }`}
                  title="Quick Water"
                >
                  <Droplets className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
