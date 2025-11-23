
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Camera, Upload, Sprout, Leaf, Droplets, Sun, AlertTriangle, MessageCircle, ScanLine, Home, Activity, Stethoscope, PlusCircle, CheckCircle, RefreshCw, ArrowLeft, User, Trophy, History, Clock, X, Trash2 } from 'lucide-react';
import { AnalysisResultCard } from './components/AnalysisResultCard';
import { WeatherWidget, HealCropCard, SourceSelector } from './components/HomeWidgets';
import { EntityLifecycleState, PlantAnalysisArtifact, SavedPlant, UserProfile } from './types';
import { executeBotanicalIdentification } from './services/geminiService';
import { fetchLocalWeather, resolveCityToCoords, WeatherData } from './services/weatherService';
import { getPlantsByGeo, RecommendedPlant } from './services/plantRecommendationService';
import { LocalPlantsWidget } from './components/LocalPlantsWidget';
import { computeMaintenanceEntropy, parseHydrationToHours } from './utils/mathUtils';
import { MetricHexagon } from './components/MetricHexagon';
import { ChatModule } from './components/ChatModule';
import { GardenJournal } from './components/GardenJournal';
import { PestDiagnoser } from './components/PestDiagnoser';
import { UserProfileModal } from './components/UserProfileModal';
import { CommunityFeed } from './components/CommunityFeed';
import { fetchUserProfile } from './services/profileService';
import { fetchSavedPlants, savePlantToGarden, deletePlantFromGarden, fetchScanHistory, recordScanHistory, deleteScanHistory } from './services/gardenService';

type ActiveView = 'IDENTIFY' | 'GARDEN' | 'DOCTOR' | 'HISTORY' | 'COMMUNITY';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('IDENTIFY');
  const [isSourceSelectOpen, setIsSourceSelectOpen] = useState(false);
  const [lifecycleState, setLifecycleState] = useState<EntityLifecycleState>(EntityLifecycleState.IDLE);
  const [analysisArtifact, setAnalysisArtifact] = useState<PlantAnalysisArtifact | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);

  // History State
  const [scanHistory, setScanHistory] = useState<PlantAnalysisArtifact[]>([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<PlantAnalysisArtifact | null>(null);

  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Gardener',
    country: '',
    bio: '',
    avatarUrl: null,
    showcasePlantId: null
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- NEW: WEATHER STATE LIFTED ---
  // This data persists even if you switch tabs!
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("Local weather unavailable");
  const [localPlants, setLocalPlants] = useState<RecommendedPlant[]>([]);

  // Load user profile from Supabase on mount
  useEffect(() => {
    const loadProfile = async () => {
      const CURRENT_USER_ID = "Researcher_Demo_ID"; // Same ID used everywhere
      const profile = await fetchUserProfile(CURRENT_USER_ID);

      if (profile) {
        setUserProfile({
          name: profile.display_name,
          country: profile.location || '',
          bio: profile.bio || '',
          avatarUrl: profile.avatar_url || null,
          showcasePlantId: null // You can extend this later
        });
      }
    };

    loadProfile();
  }, []);

  // Load Garden and History on mount
  useEffect(() => {
    const loadPersistenceData = async () => {
      const CURRENT_USER_ID = "Researcher_Demo_ID";
      const plants = await fetchSavedPlants(CURRENT_USER_ID);
      setSavedPlants(plants);

      const history = await fetchScanHistory(CURRENT_USER_ID);
      setScanHistory(history);
    };
    loadPersistenceData();
  }, []);

  // FIX 1: AUTO WEATHER HANDLER
  const handleAutoWeather = () => {
    setWeatherLoading(true);
    setWeatherError(null);

    if (!navigator.geolocation) {
      setWeatherError("GPS not supported");
      setWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchLocalWeather(pos.coords.latitude, pos.coords.longitude);
          setWeatherData(data);

          // B. Calculate Bioclimatic Plants (NEW)
          const plants = getPlantsByGeo(pos.coords.latitude);
          setLocalPlants(plants);

          setLocationName("Current Location");
        } catch (e) {
          setWeatherError("Network error");
        } finally {
          setWeatherLoading(false);
        }
      },
      (err) => {
        console.error("GPS Error:", err); // DEBUG LOG
        // Specific error messages help user debug
        if (err.code === 1) setWeatherError("Location blocked. Check browser settings.");
        else if (err.code === 2) setWeatherError("Position unavailable.");
        else if (err.code === 3) setWeatherError("GPS timeout.");
        else setWeatherError("GPS failed");

        setWeatherLoading(false);
      },
      { timeout: 10000, maximumAge: 0 } // Aggressive GPS settings
    );
  };

  // FIX 2: MANUAL WEATHER HANDLER
  const handleManualWeather = async (city: string) => {
    if (!city) return;

    setWeatherLoading(true);
    setWeatherError(null);
    console.log("Manual search started for:", city); // DEBUG LOG

    try {
      const coords = await resolveCityToCoords(city);
      const data = await fetchLocalWeather(coords.lat, coords.lon);

      // C. Calculate Bioclimatic Plants (NEW)
      const plants = getPlantsByGeo(coords.lat);
      setLocalPlants(plants);

      setWeatherData(data);
      setLocationName(coords.name);
    } catch (e) {
      console.error(e);
      setWeatherError("City not found. Try 'Jakarta'.");
    } finally {
      setWeatherLoading(false);
    }
  };

  // NEW FUNCTION: Converts Static Data into "Live Analysis"
  const handleSelectRecommendedPlant = (plant: RecommendedPlant) => {

    // 1. Construct the Artifact (Simulating an AI Scan Result)
    const simulatedArtifact: PlantAnalysisArtifact = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      base64Imagery: plant.image, // Use the Unsplash URL instead of Base64
      morphology: {
        commonName: plant.name,
        scientificTaxonomy: plant.scientific,
        familyClassification: plant.type,
        visualConfidenceScore: 1.0, // 100% confidence because it's our data
      },
      careProtocol: {
        hydrationFrequencyHours: plant.care.hydrationHours,
        photonicFluxRequirements: plant.care.sunlight,
        soilPhBalanceIdeal: 6.5, // Safe default
        atmosphericHumidityPercent: plant.care.humidity,
        toxicityVector: {
          canines: plant.care.isToxic,
          felines: plant.care.isToxic,
          humans: false,
        },
        temperatureRangeCelsius: {
          min: plant.care.tempMin,
          max: plant.care.tempMax,
        }
      },
      // Placeholder, calculated below
      maintenanceComplexityIndex: 0,
      rawDescription: plant.description
    };

    // Recalculate Complexity (This makes the Hexagon Graph dynamic)
    simulatedArtifact.maintenanceComplexityIndex = computeMaintenanceEntropy(simulatedArtifact.careProtocol);

    // 2. Set Application State
    setAnalysisArtifact(simulatedArtifact);
    setLifecycleState(EntityLifecycleState.ANALYSIS_COMPLETE); // Trigger transition to Result Page
    setActiveView('IDENTIFY'); // Ensure we are on the Home tab

    // Scroll to top so the user notices the view change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Source-Specific Acquisition Refs (Pipeline Forking)
  const staticFileInputRef = useRef<HTMLInputElement>(null);
  const opticalSensorInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChat = (context?: string) => {
    setChatContext(context);
    setIsChatOpen(true);
  };

  // High-Entropy Naming: Ingestion Pipeline
  const processBotanicalAnalysis = async (base64String: string, fullDataUrl: string) => {
    try {
      const rawData = await executeBotanicalIdentification(base64String);

      // Use structured data if available, otherwise fall back to parsing
      const hydrationHours = rawData.careRequirements.hydrationIntervalDays
        ? rawData.careRequirements.hydrationIntervalDays * 24
        : parseHydrationToHours(rawData.careRequirements.hydrationFrequencyDescription);

      const careProtocol = {
        hydrationFrequencyHours: hydrationHours,
        photonicFluxRequirements: rawData.careRequirements.photonicFluxRequirements,
        soilPhBalanceIdeal: rawData.careRequirements.soilPhBalanceIdeal || 7.0,
        atmosphericHumidityPercent: rawData.careRequirements.atmosphericHumidityPercent || 50,
        toxicityVector: {
          canines: rawData.careRequirements.toxicityToPets || false,
          felines: rawData.careRequirements.toxicityToPets || false,
          humans: rawData.careRequirements.toxicityToHumans || false,
        },
        temperatureRangeCelsius: {
          min: rawData.careRequirements.minTempCelsius || 15,
          max: rawData.careRequirements.maxTempCelsius || 25,
        }
      };

      const artifact: PlantAnalysisArtifact = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        base64Imagery: fullDataUrl,
        morphology: {
          commonName: rawData.commonName,
          scientificTaxonomy: rawData.scientificTaxonomy,
          familyClassification: rawData.familyClassification,
          visualConfidenceScore: rawData.visualConfidenceScore || 0.95,
        },
        careProtocol: careProtocol,
        maintenanceComplexityIndex: computeMaintenanceEntropy(careProtocol),
        rawDescription: rawData.detailedDescription
      };

      setAnalysisArtifact(artifact);
      setScanHistory(prev => [artifact, ...prev]);
      setLifecycleState(EntityLifecycleState.ANALYSIS_COMPLETE);

      // Persist History
      recordScanHistory(artifact, "Researcher_Demo_ID");
    } catch (e) {
      console.error(e);
      setLifecycleState(EntityLifecycleState.ERROR_STATE);
    }
  };

  const executeIngestionPipeline = async (biologicalAsset: File) => {
    setLifecycleState(EntityLifecycleState.PROCESSING_NEURAL_REQUEST);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      await processBotanicalAnalysis(base64String, reader.result as string);
    };
    reader.readAsDataURL(biologicalAsset);
  };

  // Camera Functions
  const startCamera = async () => {
    setIsSourceSelectOpen(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64String = dataUrl.split(',')[1];

        stopCamera();
        setLifecycleState(EntityLifecycleState.PROCESSING_NEURAL_REQUEST);
        processBotanicalAnalysis(base64String, dataUrl);
      }
    }
  };

  // Handler for Optical Data Acquisition (Trigger Event)
  const handleOpticalDataAcquisition = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      // Immediate ingestion for ID pipeline (Standard for main flow, strictly decoupled in Journal)
      executeIngestionPipeline(e.target.files[0]);
    }
  };

  // 1. Helper to check if current artifact is already saved
  const isArtifactSaved = (id?: string) => savedPlants.some(p => p.analysisId === id);

  const handleSaveToGarden = () => {
    if (!analysisArtifact) return;

    // Guard clause: Prevent duplicate saves
    if (isArtifactSaved(analysisArtifact.id)) return;

    const newPlant: SavedPlant = {
      id: crypto.randomUUID(),
      nickname: analysisArtifact.morphology.commonName,
      speciesName: analysisArtifact.morphology.scientificTaxonomy,
      analysisId: analysisArtifact.id,
      dateAdded: Date.now(),
      hydrationSchedule: {
        frequencyHours: analysisArtifact.careProtocol.hydrationFrequencyHours,
        lastWatered: Date.now()
      },
      journalEntries: [],
      thumbnailUrl: analysisArtifact.base64Imagery
    };

    setSavedPlants(prev => [...prev, newPlant]);

    // Persist to Supabase
    savePlantToGarden(newPlant, "Researcher_Demo_ID");
  };

  const handleScanAgain = () => {
    setLifecycleState(EntityLifecycleState.IDLE);
    setAnalysisArtifact(null);
    setActiveView('IDENTIFY');
  };

  const handleDeletePlant = async (plantId: string) => {
    if (confirm('Are you sure you want to remove this plant from your garden?')) {
      setSavedPlants(prev => prev.filter(p => p.id !== plantId));
      await deletePlantFromGarden(plantId);
    }
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Prevent opening the item
    if (confirm('Remove this scan from history?')) {
      setScanHistory(prev => prev.filter(h => h.id !== itemId));
      await deleteScanHistory(itemId);
      if (viewingHistoryItem?.id === itemId) {
        setViewingHistoryItem(null);
      }
    }
  };

  const handleUpdatePlant = (updatedPlant: SavedPlant) => {
    setSavedPlants(prev => prev.map(p => p.id === updatedPlant.id ? updatedPlant : p));
  };

  // Logic: We only want the "Narrow Mobile Look" when on the Home tab AND in the IDLE state.
  // Once we scan a plant (ANALYSIS_COMPLETE) or switch tabs, we want full width.
  const isDashboardMode = activeView === 'IDENTIFY' && lifecycleState === EntityLifecycleState.IDLE;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24" >

      {/* Header */}
      < header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm" >
        <div className="flex items-center gap-2 text-emerald-800 cursor-pointer group" onClick={() => setActiveView('IDENTIFY')}>
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white group-hover:rotate-12 transition-transform">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">Verida</span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-hidden" >
          <button
            onClick={() => setActiveView('IDENTIFY')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'IDENTIFY' ? 'bg-white shadow-sm text-emerald-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveView('HISTORY')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'HISTORY' ? 'bg-white shadow-sm text-emerald-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            History
          </button>
          <button
            onClick={() => setActiveView('GARDEN')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'GARDEN' ? 'bg-white shadow-sm text-emerald-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            My Garden
            {savedPlants.length > 0 && <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>}
          </button>
          <button
            onClick={() => setActiveView('COMMUNITY')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'COMMUNITY' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Community
          </button>
          <button
            onClick={() => setActiveView('DOCTOR')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'DOCTOR' ? 'bg-white shadow-sm text-amber-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Doctor
          </button>
        </div >

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="relative group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-100 bg-slate-100 flex items-center justify-center group-hover:border-emerald-400 transition-colors">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            {userProfile.showcasePlantId && (
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border-2 border-white">
                <Trophy className="w-3 h-3" />
              </div>
            )}
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button
            onClick={() => handleOpenChat()}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors relative hover:text-emerald-600"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
      </header >

      <main
        className={`mx-auto p-6 transition-all duration-500 ease-in-out ${isDashboardMode ? 'max-w-md' : 'max-w-5xl'
          }`}
      >

        {/* VIEW: IDENTIFY */}
        {activeView === 'IDENTIFY' && (
          <>
            {/* 1. Empty State / Dashboard Mode */}
            {lifecycleState === EntityLifecycleState.IDLE && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* NEW WIDGETS */}
                <WeatherWidget
                  weather={weatherData}
                  loading={weatherLoading}
                  error={weatherError}
                  locationLabel={locationName}
                  onAutoLocate={handleAutoWeather}
                  onManualLocate={handleManualWeather}
                />

                {/* 5. Render the Widget (Only if we have plants) */}
                {localPlants.length > 0 && (
                  <LocalPlantsWidget
                    locationName={locationName}
                    plants={localPlants}
                    onSelect={handleSelectRecommendedPlant}
                  />
                )}

                <HealCropCard onAction={() => setIsSourceSelectOpen(true)} />

                {/* HIDDEN INPUTS (Controlled by the Modal) */}
                <input
                  type="file"
                  ref={staticFileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleOpticalDataAcquisition}
                />
                <input
                  type="file"
                  ref={opticalSensorInputRef}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleOpticalDataAcquisition}
                />
              </div>
            )}

            {/* Loading State */}
            {lifecycleState === EntityLifecycleState.PROCESSING_NEURAL_REQUEST && (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <ScanLine className="w-16 h-16 text-emerald-500 animate-pulse" />
                <div className="flex flex-col items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">Processing Neural Request</h2>
                  <p className="text-sm text-emerald-600">Analyzing chlorophyll patterns and leaf structure...</p>
                </div>
                <div className="w-64 h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full animate-progress"></div>
                </div>
              </div>
            )}

            {/* --- INSERT THIS NEW BLOCK HERE --- */}
            {lifecycleState === EntityLifecycleState.ERROR_STATE && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in">
                <div className="bg-red-100 p-6 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
                <div className="max-w-xs mx-auto space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Analysis Failed</h2>
                  <p className="text-slate-500 text-sm">
                    We couldn't identify this plant. Please check your internet connection or API Key.
                  </p>
                </div>
                <button
                  onClick={() => setLifecycleState(EntityLifecycleState.IDLE)}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                >
                  Try Again
                </button>
              </div>
            )}
            {/* ---------------------------------- */}

            {/* Results View */}
            {lifecycleState === EntityLifecycleState.ANALYSIS_COMPLETE && analysisArtifact && (
              <AnalysisResultCard
                artifact={analysisArtifact}
                isSaved={isArtifactSaved(analysisArtifact.id)}
                onSave={handleSaveToGarden}
                onConsult={() => handleOpenChat(analysisArtifact.morphology.commonName)}
                headerAction={
                  <button
                    onClick={handleScanAgain}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                  >
                    <RefreshCw className="w-4 h-4" /> Scan New Specimen
                  </button>
                }
              />
            )}
          </>
        )}

        {/* VIEW: GARDEN */}
        {activeView === 'GARDEN' && (
          <GardenJournal
            plants={savedPlants}
            onUpdatePlant={handleUpdatePlant}
            onScanNew={handleScanAgain}
            onDeletePlant={handleDeletePlant}
          />
        )}

        {/* VIEW: DOCTOR */}
        {activeView === 'DOCTOR' && (
          <PestDiagnoser
            plants={savedPlants}
            onUpdatePlant={handleUpdatePlant}
            onOpenChat={handleOpenChat}
          />
        )}

        {/* VIEW: HISTORY */}
        {activeView === 'HISTORY' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {viewingHistoryItem ? (
              // DETAIL VIEW
              <AnalysisResultCard
                artifact={viewingHistoryItem}
                isSaved={isArtifactSaved(viewingHistoryItem.id)}
                onSave={() => {
                  if (isArtifactSaved(viewingHistoryItem.id)) return;
                  const newPlant: SavedPlant = {
                    id: crypto.randomUUID(),
                    nickname: viewingHistoryItem.morphology.commonName,
                    speciesName: viewingHistoryItem.morphology.scientificTaxonomy,
                    analysisId: viewingHistoryItem.id,
                    dateAdded: Date.now(),
                    hydrationSchedule: {
                      frequencyHours: viewingHistoryItem.careProtocol.hydrationFrequencyHours,
                      lastWatered: Date.now()
                    },
                    journalEntries: [],
                    thumbnailUrl: viewingHistoryItem.base64Imagery
                  };
                  setSavedPlants(prev => [...prev, newPlant]);
                }}
                onConsult={() => handleOpenChat(viewingHistoryItem.morphology.commonName)}
                headerAction={
                  <button
                    onClick={() => setViewingHistoryItem(null)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-emerald-600 flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to List
                  </button>
                }
              />
            ) : (
              // LIST VIEW
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-slate-400" /> Scan History
                </h2>

                {scanHistory.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    No scans yet. Start identifying plants!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scanHistory.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setViewingHistoryItem(item)}
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group relative"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-emerald-100 shrink-0">
                          <img src={item.base64Imagery} className="w-full h-full object-cover" alt="Thumb" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.morphology.commonName}</h3>
                          <p className="text-xs text-slate-500 italic">{item.morphology.scientificTaxonomy}</p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW: COMMUNITY */}
        {activeView === 'COMMUNITY' && (
          <CommunityFeed userProfile={userProfile} />
        )}

      </main>

      <SourceSelector
        isOpen={isSourceSelectOpen}
        onClose={() => setIsSourceSelectOpen(false)}
        onCamera={startCamera}
        onGallery={() => {
          setIsSourceSelectOpen(false);
          staticFileInputRef.current?.click();
        }}
      />

      <ChatModule
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        contextContext={chatContext}
      />

      {/* Camera View Overlay */}
      {
        showCamera && (
          <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="h-32 bg-black flex items-center justify-center gap-8 pb-8">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-white" />
              </button>
            </div>
          </div>
        )
      }

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onUpdateProfile={setUserProfile}
        plants={savedPlants}
      />

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div >
  );
};

export default App;
