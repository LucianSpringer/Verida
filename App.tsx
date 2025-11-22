
import React, { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, Sprout, Leaf, Droplets, Sun, AlertTriangle, MessageCircle, ScanLine, Home, Activity, Stethoscope, PlusCircle, RefreshCw, ArrowLeft, User, Trophy } from 'lucide-react';
import { EntityLifecycleState, PlantAnalysisArtifact, SavedPlant, UserProfile } from './types';
import { executeBotanicalIdentification } from './services/geminiService';
import { computeMaintenanceEntropy, parseHydrationToHours } from './utils/mathUtils';
import { MetricHexagon } from './components/MetricHexagon';
import { ChatModule } from './components/ChatModule';
import { GardenJournal } from './components/GardenJournal';
import { PestDiagnoser } from './components/PestDiagnoser';
import { UserProfileModal } from './components/UserProfileModal';

type ActiveView = 'IDENTIFY' | 'GARDEN' | 'DOCTOR';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('IDENTIFY');
  const [lifecycleState, setLifecycleState] = useState<EntityLifecycleState>(EntityLifecycleState.IDLE);
  const [analysisArtifact, setAnalysisArtifact] = useState<PlantAnalysisArtifact | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);
  
  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Gardener',
    country: '',
    avatarUrl: null,
    showcasePlantId: null
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Source-Specific Acquisition Refs (Pipeline Forking)
  const staticFileInputRef = useRef<HTMLInputElement>(null);
  const opticalSensorInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChat = (context?: string) => {
    setChatContext(context);
    setIsChatOpen(true);
  };

  // High-Entropy Naming: Ingestion Pipeline
  const executeIngestionPipeline = async (biologicalAsset: File) => {
    setLifecycleState(EntityLifecycleState.PROCESSING_NEURAL_REQUEST);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      
      try {
        const rawData = await executeBotanicalIdentification(base64String);
        
        const hydrationHours = parseHydrationToHours(rawData.careRequirements.hydrationFrequencyDescription);
        
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
          base64Imagery: reader.result as string,
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
        setLifecycleState(EntityLifecycleState.ANALYSIS_COMPLETE);
      } catch (e) {
        console.error(e);
        setLifecycleState(EntityLifecycleState.ERROR_STATE);
      }
    };
    reader.readAsDataURL(biologicalAsset);
  };

  // Handler for Optical Data Acquisition (Trigger Event)
  const handleOpticalDataAcquisition = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      // Immediate ingestion for ID pipeline (Standard for main flow, strictly decoupled in Journal)
      executeIngestionPipeline(e.target.files[0]);
    }
  };

  const handleSaveToGarden = () => {
    if (!analysisArtifact) return;
    
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
    
    // State-Driven Routing: Fixes the Dead End by automatically transitioning view
    setActiveView('GARDEN');
    
    setLifecycleState(EntityLifecycleState.IDLE);
    setAnalysisArtifact(null);
  };

  const handleScanAgain = () => {
    setLifecycleState(EntityLifecycleState.IDLE);
    setAnalysisArtifact(null);
    setActiveView('IDENTIFY');
  };

  const handleUpdatePlant = (updatedPlant: SavedPlant) => {
    setSavedPlants(prev => prev.map(p => p.id === updatedPlant.id ? updatedPlant : p));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800 cursor-pointer group" onClick={() => setActiveView('IDENTIFY')}>
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white group-hover:rotate-12 transition-transform">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">Verida</span>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-hidden">
          <button 
            onClick={() => setActiveView('IDENTIFY')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'IDENTIFY' ? 'bg-white shadow-sm text-emerald-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Identify
          </button>
          <button 
            onClick={() => setActiveView('GARDEN')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'GARDEN' ? 'bg-white shadow-sm text-emerald-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            My Garden
            {savedPlants.length > 0 && <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>}
          </button>
          <button 
            onClick={() => setActiveView('DOCTOR')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'DOCTOR' ? 'bg-white shadow-sm text-amber-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Doctor
          </button>
        </div>

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
      </header>

      <main className="max-w-5xl mx-auto p-6">
        
        {/* VIEW: IDENTIFY */}
        {activeView === 'IDENTIFY' && (
          <>
            {/* Hero / Empty State */}
            {lifecycleState === EntityLifecycleState.IDLE && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative">
                  <div className="absolute -inset-4 bg-emerald-200 rounded-full opacity-30 blur-xl animate-pulse"></div>
                  <Sprout className="w-24 h-24 text-emerald-600 relative z-10" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-slate-900">Botanical Identification</h1>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Utilize Gemini 3 Pro vision capabilities to analyze flora morphology and receive enterprise-grade care protocols.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-8">
                  {/* Button A: Source-Specific Acquisition (Static File) */}
                  <button
                    onClick={() => staticFileInputRef.current?.click()}
                    className="group relative overflow-hidden rounded-2xl bg-white border-2 border-emerald-100 p-6 hover:border-emerald-400 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-slate-900">Upload Photo</span>
                    </div>
                  </button>
                  
                  {/* Button B: Source-Specific Acquisition (Optical Sensor) */}
                  <button
                    onClick={() => opticalSensorInputRef.current?.click()}
                    className="group relative overflow-hidden rounded-2xl bg-emerald-600 p-6 hover:bg-emerald-700 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col items-center gap-3 text-white">
                      <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold">Camera</span>
                    </div>
                  </button>
                </div>
                
                {/* Hidden Inputs for Pipeline Forking */}
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
                  capture="environment" // Explicit Hardware Trigger
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

            {/* Results View */}
            {lifecycleState === EntityLifecycleState.ANALYSIS_COMPLETE && analysisArtifact && (
              <div className="space-y-8 animate-in fade-in duration-500">
                
                {/* Header Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative">
                  <button 
                    onClick={handleScanAgain}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Scan New Specimen
                  </button>

                  <div className="flex flex-col md:flex-row gap-6 items-start mt-2">
                    <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden bg-emerald-100 relative group shadow-md">
                      <img 
                        src={analysisArtifact.base64Imagery} 
                        alt="Specimen" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-xs font-mono">CONFIDENCE: {(analysisArtifact.morphology.visualConfidenceScore * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wider uppercase">
                            {analysisArtifact.morphology.familyClassification}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wider uppercase">
                            IDX: {analysisArtifact.maintenanceComplexityIndex}/100
                          </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                          {analysisArtifact.morphology.commonName}
                        </h2>
                        <p className="text-emerald-600 italic font-serif text-lg">
                          {analysisArtifact.morphology.scientificTaxonomy}
                        </p>
                      </div>

                      <p className="text-slate-600 leading-relaxed text-sm">
                        {analysisArtifact.rawDescription}
                      </p>

                      <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={handleSaveToGarden}
                          className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                        >
                          <PlusCircle className="w-5 h-5" />
                          Save to Garden
                        </button>
                        <button 
                          onClick={() => handleOpenChat(analysisArtifact.morphology.commonName)}
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
                  {/* Visual Metrics */}
                  <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-100 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 to-teal-300"></div>
                    <h3 className="text-slate-900 font-semibold mb-6 w-full text-left flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Environmental Matrix
                    </h3>
                    <MetricHexagon data={analysisArtifact.careProtocol} />
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-5 flex items-center gap-4 border border-blue-100">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                          <Droplets className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-blue-900 font-bold text-sm uppercase tracking-wide">Hydration Cycle</h4>
                          <p className="text-blue-700 font-medium">Every {Math.round(analysisArtifact.careProtocol.hydrationFrequencyHours / 24)} Days</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-5 flex items-center gap-4 border border-amber-100">
                        <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                          <Sun className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-amber-900 font-bold text-sm uppercase tracking-wide">Solar Flux</h4>
                          <p className="text-amber-700 font-medium">{analysisArtifact.careProtocol.photonicFluxRequirements} Exposure</p>
                        </div>
                    </div>

                    {(analysisArtifact.careProtocol.toxicityVector.canines || analysisArtifact.careProtocol.toxicityVector.felines) && (
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
            )}
          </>
        )}

        {/* VIEW: GARDEN */}
        {activeView === 'GARDEN' && (
          <GardenJournal 
            plants={savedPlants} 
            onUpdatePlant={handleUpdatePlant} 
            onScanNew={handleScanAgain} 
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

      </main>

      <ChatModule 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextContext={chatContext}
      />

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
    </div>
  );
};

export default App;
