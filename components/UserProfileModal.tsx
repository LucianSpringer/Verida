import React, { useRef, useState, useEffect } from 'react';
import { UserProfile, SavedPlant } from '../types';
import { X, Camera, MapPin, Trophy, User } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  plants: SavedPlant[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, profile, onUpdateProfile, plants }) => {
  const [localProfile, setLocalProfile] = useState(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile, isOpen]);

  const handleSave = () => {
    onUpdateProfile(localProfile);
    onClose();
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Gardener Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-emerald-100 bg-emerald-50 flex items-center justify-center">
                {localProfile.avatarUrl ? (
                  <img src={localProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-emerald-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white shadow-md border-2 border-white">
                 <Camera className="w-4 h-4" />
              </div>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
            />
            <div className="text-center">
               <p className="text-sm text-slate-400">Tap to update photo</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={localProfile.name}
                  onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-slate-800"
                  placeholder="e.g. Green Thumb"
                />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Country / Region</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={localProfile.country}
                    onChange={(e) => setLocalProfile({...localProfile, country: e.target.value})}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-slate-800"
                    placeholder="e.g. Kyoto, Japan"
                  />
                </div>
             </div>
          </div>

          {/* Showcase Section */}
          <div className="space-y-3">
             <div className="flex items-center justify-between">
               <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1 flex items-center gap-1">
                 <Trophy className="w-3 h-3 text-amber-500" /> Garden Showcase
               </label>
               {localProfile.showcasePlantId && (
                  <button 
                    onClick={() => setLocalProfile({...localProfile, showcasePlantId: null})}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear selection
                  </button>
               )}
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
                {plants.length === 0 ? (
                   <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
                     Identify plants to showcase them here.
                   </div>
                ) : (
                  plants.map(plant => (
                    <div 
                      key={plant.id}
                      onClick={() => setLocalProfile({...localProfile, showcasePlantId: plant.id})}
                      className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer transition-all ${localProfile.showcasePlantId === plant.id ? 'ring-4 ring-amber-400 ring-offset-2' : 'hover:opacity-80'}`}
                    >
                       <img src={plant.thumbnailUrl} alt={plant.nickname} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                          <span className="text-white text-xs font-bold truncate">{plant.nickname}</span>
                       </div>
                       {localProfile.showcasePlantId === plant.id && (
                         <div className="absolute top-2 right-2 bg-amber-500 text-white p-1 rounded-full shadow-sm">
                            <Trophy className="w-3 h-3" />
                         </div>
                       )}
                    </div>
                  ))
                )}
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={handleSave}
             className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
           >
             Save Profile
           </button>
        </div>
      </div>
    </div>
  );
};