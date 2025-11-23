
import React, { useState, useRef, ChangeEvent } from 'react';
import { SavedPlant, JournalEntry, PlantAnalysisArtifact } from '../types';
import { Plus, Droplets, Calendar, Camera, AlertCircle, Clock, CheckCircle, ArrowLeft, RefreshCw, ScanLine, X, Trash2, Thermometer, Sun, Droplet, Wind, Shield, Layers, Sprout, Flower2, HelpCircle, ChevronRight, MapPin, Bell } from 'lucide-react';

interface GardenJournalProps {
  plants: SavedPlant[];
  onUpdatePlant: (plant: SavedPlant) => void;
  onScanNew?: () => void;
  onDeletePlant?: (plantId: string) => void;
  scanHistory?: PlantAnalysisArtifact[];
}

export const GardenJournal: React.FC<GardenJournalProps> = ({ plants, onUpdatePlant, onScanNew, onDeletePlant, scanHistory = [] }) => {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [entryNote, setEntryNote] = useState('');
  const [entryType, setEntryType] = useState<JournalEntry['tags'][0]>('GROWTH');
  const [activeTab, setActiveTab] = useState<'journal' | 'care-profile' | 'care-condition' | 'how-tos'>('care-profile');
  // High Entropy Naming: Buffer represents draft state before mutation
  const [botanicalAssetBuffer, setBotanicalAssetBuffer] = useState<string | null>(null);
  const [wateringState, setWateringState] = useState<'IDLE' | 'WATERING' | 'DONE'>('IDLE');
  const entryFileRef = useRef<HTMLInputElement>(null);

  const selectedPlant = plants.find(p => p.id === selectedPlantId);
  const selectedPlantAnalysis = selectedPlant ? scanHistory.find(a => a.id === selectedPlant.analysisId) : null;

  const getWateringStatus = (plant: SavedPlant) => {
    const nextWatering = plant.hydrationSchedule.lastWatered + (plant.hydrationSchedule.frequencyHours * 3600 * 1000);
    const now = Date.now();
    const hoursRemaining = (nextWatering - now) / (3600 * 1000);

    if (hoursRemaining < 0) return { status: 'OVERDUE', color: 'bg-red-100 text-red-700', label: 'Water Now!' };
    if (hoursRemaining < 24) return { status: 'SOON', color: 'bg-amber-100 text-amber-700', label: 'Due Today' };
    return { status: 'GOOD', color: 'bg-emerald-100 text-emerald-700', label: `${Math.ceil(hoursRemaining / 24)} days` };
  };

  const isPlantInCooldown = (plant: SavedPlant): boolean => {
    const now = Date.now();
    const timeSinceLastWatered = now - plant.hydrationSchedule.lastWatered;
    const cooldownMs = plant.hydrationSchedule.frequencyHours * 3600 * 1000;
    return timeSinceLastWatered < cooldownMs;
  };

  const getCooldownRemaining = (plant: SavedPlant): string => {
    const timeSinceLastWatered = Date.now() - plant.hydrationSchedule.lastWatered;
    const cooldownMs = plant.hydrationSchedule.frequencyHours * 3600 * 1000;
    const remainingMs = Math.max(0, cooldownMs - timeSinceLastWatered);
    const remainingHours = Math.ceil(remainingMs / (3600 * 1000));
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    if (remainingHours >= 1) {
      return `${remainingHours} hour(s)`;
    } else {
      return `${remainingMinutes} minute(s)`;
    }
  };

  const handleWater = (e: React.MouseEvent, plant: SavedPlant) => {
    e.preventDefault(); // Prevent form submission/page refresh
    e.stopPropagation(); // Prevent event bubbling

    // Check if plant is in cooldown
    if (isPlantInCooldown(plant)) {
      const timeSinceLastWatered = Date.now() - plant.hydrationSchedule.lastWatered;
      const cooldownMs = plant.hydrationSchedule.frequencyHours * 3600 * 1000;
      const remainingMs = cooldownMs - timeSinceLastWatered;
      const remainingHours = Math.max(1, Math.ceil(remainingMs / (3600 * 1000)));
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

      if (remainingHours >= 1) {
        alert(`This plant was recently watered. Please wait ${remainingHours} hour(s) before watering again.`);
      } else {
        alert(`This plant was recently watered. Please wait ${remainingMinutes} minute(s) before watering again.`);
      }
      return;
    }

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

  const handleSetReminder = (plant: SavedPlant) => {
    // 1. Calculate next watering time
    const nextWatering = plant.hydrationSchedule.lastWatered + (plant.hydrationSchedule.frequencyHours * 3600 * 1000);
    const date = new Date(nextWatering);

    // 2. Request Browser Notification
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(`Watering Reminder: ${plant.nickname}`, {
            body: `It's time to water your ${plant.speciesName}!`,
            icon: plant.thumbnailUrl
          });
        }
      });
    }

    // 3. Create Google Calendar Link
    // Format: YYYYMMDDTHHMMSSZ
    const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const startTime = formatTime(date);
    const endTime = formatTime(new Date(date.getTime() + 30 * 60000)); // 30 min duration

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Water+${encodeURIComponent(plant.nickname)}&dates=${startTime}/${endTime}&details=Time+to+water+your+${encodeURIComponent(plant.speciesName)}!&location=Garden`;

    // 4. Open in new tab
    window.open(calendarUrl, '_blank');
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

  // Helper function to calculate difficulty from maintenance complexity
  const getDifficultyLevel = (complexity: number): { level: string; color: string } => {
    if (complexity < 30) return { level: 'Easy', color: 'text-emerald-600' };
    if (complexity < 60) return { level: 'Moderate', color: 'text-blue-600' };
    if (complexity < 80) return { level: 'Hard', color: 'text-amber-600' };
    return { level: 'Expert', color: 'text-red-600' };
  };

  // Helper function to calculate toughness from care requirements
  const getToughnessLevel = (care: any): { level: string; color: string } => {
    const tempRange = care.temperatureRangeCelsius.max - care.temperatureRangeCelsius.min;
    const hydrationDays = care.hydrationFrequencyHours / 24;

    if (tempRange > 30 && hydrationDays > 7) return { level: 'High', color: 'text-emerald-600' };
    if (tempRange > 20 && hydrationDays > 5) return { level: 'Medium', color: 'text-blue-600' };
    return { level: 'Low', color: 'text-amber-600' };
  };

  // Helper function to calculate maintenance level
  const getMaintenanceLevel = (care: any): { level: string; color: string } => {
    const hydrationDays = care.hydrationFrequencyHours / 24;
    const sunlightComplexity = care.photonicFluxRequirements === 'DIRECT' ? 1 : care.photonicFluxRequirements === 'HIGH' ? 2 : 3;

    const score = (hydrationDays < 3 ? 3 : hydrationDays < 7 ? 2 : 1) + sunlightComplexity;

    if (score <= 2) return { level: 'Low', color: 'text-emerald-600' };
    if (score <= 4) return { level: 'Medium', color: 'text-blue-600' };
    return { level: 'High', color: 'text-amber-600' };
  };

  // Helper function to get perks based on care data
  const getPlantPerks = (care: any): string[] => {
    const perks: string[] = [];
    const hydrationDays = care.hydrationFrequencyHours / 24;

    if (hydrationDays >= 7) perks.push('Drought tolerant');
    if (care.atmosphericHumidityPercent < 40) perks.push('Low humidity tolerant');
    if (care.temperatureRangeCelsius.min < 10) perks.push('Cold hardy');
    if (care.photonicFluxRequirements === 'LOW' || care.photonicFluxRequirements === 'MEDIUM') perks.push('Shade tolerant');
    if (!care.toxicityVector.humans && !care.toxicityVector.canines && !care.toxicityVector.felines) perks.push('Pet safe');
    if (care.atmosphericHumidityPercent > 50) perks.push('Air-purifying');

    return perks;
  };

  // Care Profile Section Component
  const CareProfileSection: React.FC<{ analysis: PlantAnalysisArtifact; plant: SavedPlant }> = ({ analysis, plant }) => {
    const difficulty = getDifficultyLevel(analysis.maintenanceComplexityIndex);
    const toughness = getToughnessLevel(analysis.careProtocol);
    const maintenance = getMaintenanceLevel(analysis.careProtocol);
    const perks = getPlantPerks(analysis.careProtocol);

    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
          {/* Difficulty */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className={`text-3xl font-bold ${difficulty.color} mb-1`}>{difficulty.level}</h3>
            <p className="text-sm text-slate-500">Difficulty</p>
          </div>

          {/* Toughness and Maintenance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-white rounded-xl p-4">
              <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className={`text-xl font-bold ${toughness.color} mb-1`}>{toughness.level}</p>
              <p className="text-xs text-slate-500">Toughness</p>
            </div>
            <div className="text-center bg-white rounded-xl p-4">
              <Sprout className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className={`text-xl font-bold ${maintenance.color} mb-1`}>{maintenance.level}</p>
              <p className="text-xs text-slate-500">Maintenance</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-slate-700 mb-2">
              {difficulty.level === 'Easy' && 'Beginner-friendly and low maintenance.'}
              {difficulty.level === 'Moderate' && 'Beginner-friendly but requires more commitment.'}
              {difficulty.level === 'Hard' && 'Requires experience and regular attention.'}
              {difficulty.level === 'Expert' && 'Challenging, best for experienced gardeners.'}
            </p>
          </div>

          {/* Perks */}
          {perks.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-3">Perks</h4>
              <div className="grid grid-cols-2 gap-2">
                {perks.map((perk, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-slate-700">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Care Condition Section Component
  const CareConditionSection: React.FC<{ analysis: PlantAnalysisArtifact }> = ({ analysis }) => {
    const care = analysis.careProtocol;
    const tempRange = `${care.temperatureRangeCelsius.min} - ${care.temperatureRangeCelsius.max}Â°C`;

    const getSunlightLabel = (level: string) => {
      switch (level) {
        case 'DIRECT': return 'Direct sun';
        case 'HIGH': return 'Bright indirect';
        case 'MEDIUM': return 'Partial sun';
        case 'LOW': return 'Low light';
        case 'FULL_SUN_TO_PART_SHADE': return 'Full Sun to Part Shade';
        default: return level.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      }
    };

    const getSoilType = (ph: number): string => {
      if (ph < 6.5) return 'Acidic (Sandy, Peat)';
      if (ph > 7.5) return 'Alkaline (Clay, Loam)';
      return 'Neutral (Loam, Well-draining)';
    };

    const getSuitableLocation = (care: any): string[] => {
      const locations: string[] = [];
      if (care.temperatureRangeCelsius.min >= 15) locations.push('Indoor');
      if (care.temperatureRangeCelsius.max <= 30 && care.photonicFluxRequirements !== 'LOW') locations.push('Outdoor');
      if (locations.length === 0) {
        locations.push('Indoor', 'Outdoor');
      }
      return locations;
    };

    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
        <div className="space-y-3">
          <div className="space-y-3">
            {/* Climate */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Thermometer className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Climate</h4>
                    <p className="text-sm text-slate-600">Temperature: {tempRange}</p>
                    <p className="text-xs text-slate-500">Hardiness: Zone {Math.floor((care.temperatureRangeCelsius.min + 10) / 10)}-{Math.ceil((care.temperatureRangeCelsius.max + 10) / 10)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sunlight */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Sun className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Sunlight</h4>
                    <p className="text-sm text-slate-600">{getSunlightLabel(care.photonicFluxRequirements)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Soil */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Layers className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Soil</h4>
                    <p className="text-sm text-slate-600">pH: {care.soilPhBalanceIdeal.toFixed(1)} - {getSoilType(care.soilPhBalanceIdeal)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Suitable Location */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Suitable Location</h4>
                    <p className="text-sm text-slate-600">{getSuitableLocation(care).join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // How-tos Section Component
  const HowTosSection: React.FC<{ analysis: PlantAnalysisArtifact; plant: SavedPlant }> = ({ analysis, plant }) => {
    const care = analysis.careProtocol;
    const hydrationDays = Math.round(care.hydrationFrequencyHours / 24);
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    const getFertilizerSchedule = (): string => {
      return 'Once in Spring, Summer';
    };

    const getPropagationMethod = (): string => {
      const methods = ['Division', 'Cuttings', 'Seeds', 'Offsets'];
      return methods[Math.floor(Math.random() * methods.length)];
    };

    const getRepottingSchedule = (): string => {
      return 'Early spring, Fall';
    };

    const popularQuestions = [
      `Why is ${care.soilPhBalanceIdeal < 6.5 ? 'acidic' : care.soilPhBalanceIdeal > 7.5 ? 'alkaline' : 'neutral'} soil good for ${plant.nickname}?`,
      `Can midday watering harm ${plant.nickname}?`,
      `How often should I fertilize ${plant.nickname}?`,
      `Is ${plant.nickname} safe for pets?`
    ];

    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {/* How-tos */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3">How-tos</h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Watering */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplet className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Water in {currentMonth}</p>
                    <p className="text-xs text-slate-600">Every {hydrationDays} day{hydrationDays !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fertilizer */}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flower2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Fertilizer</p>
                    <p className="text-xs text-slate-600">{getFertilizerSchedule()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Propagation */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3">Propagation</h4>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sprout className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-medium text-slate-900">{getPropagationMethod()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Repotting */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3">Repotting</h4>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-slate-900">{getRepottingSchedule()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Questions */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3">Popular Questions</h4>
          <div className="space-y-2">
            {popularQuestions.slice(0, 2).map((question, index) => (
              <a
                key={index}
                href={`https://www.google.com/search?q=${encodeURIComponent(question)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-slate-50 rounded-xl p-4 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-slate-400" />
                    <p className="text-sm text-slate-700">{question}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
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
              {isPlantInCooldown(selectedPlant) && (
                <button
                  onClick={() => handleSetReminder(selectedPlant)}
                  className="p-2.5 text-amber-600 bg-white border border-amber-100 hover:bg-amber-50 rounded-lg transition-colors shadow-sm"
                  title="Set Reminder"
                >
                  <Bell className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => handleWater(e, selectedPlant)}
                disabled={wateringState !== 'IDLE' || isPlantInCooldown(selectedPlant)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all shadow-md font-medium min-w-[140px] justify-center ${wateringState === 'DONE'
                  ? 'bg-emerald-500 text-white shadow-emerald-200 scale-105'
                  : isPlantInCooldown(selectedPlant)
                    ? 'bg-slate-300 text-slate-500 shadow-slate-200 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5'
                  } disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
                title={isPlantInCooldown(selectedPlant) ? `Recently watered. Wait ${getCooldownRemaining(selectedPlant)} before watering again.` : 'Water this plant'}
              >
                {wateringState === 'DONE' ? <CheckCircle className="w-4 h-4" /> : <Droplets className={`w-4 h-4 ${wateringState === 'WATERING' ? 'animate-bounce' : ''}`} />}
                <span>{wateringState === 'DONE' ? 'Watered!' : wateringState === 'WATERING' ? 'Watering...' : isPlantInCooldown(selectedPlant) ? 'In Cooldown' : 'Water Plant'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-emerald-50 bg-white">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('care-profile')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'care-profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Care Profile
            </button>
            <button
              onClick={() => setActiveTab('care-condition')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'care-condition'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Care Condition
            </button>
            <button
              onClick={() => setActiveTab('how-tos')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'how-tos'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              How-tos
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'journal'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Journal
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'journal' && (
          <>
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
          </>
        )}

        {/* Care Profile Tab */}
        {activeTab === 'care-profile' && selectedPlantAnalysis && (
          <CareProfileSection analysis={selectedPlantAnalysis} plant={selectedPlant} />
        )}

        {/* Care Condition Tab */}
        {activeTab === 'care-condition' && selectedPlantAnalysis && (
          <CareConditionSection analysis={selectedPlantAnalysis} />
        )}

        {/* How-tos Tab */}
        {activeTab === 'how-tos' && selectedPlantAnalysis && (
          <HowTosSection analysis={selectedPlantAnalysis} plant={selectedPlant} />
        )}
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
                  disabled={isPlantInCooldown(plant)}
                  className={`p-2.5 rounded-full transition-all z-10 relative shadow-sm hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${watering.status === 'OVERDUE'
                    ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-2 ring-red-100 animate-pulse'
                    : isPlantInCooldown(plant)
                      ? 'bg-slate-100 text-slate-400 border border-slate-200'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                    }`}
                  title={isPlantInCooldown(plant) ? `Recently watered. Wait ${getCooldownRemaining(plant)} before watering again.` : 'Quick Water'}
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
