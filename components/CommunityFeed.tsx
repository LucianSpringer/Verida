import React, { useEffect, useState } from 'react';
import { MapPin, Leaf, Upload, Loader2, Heart, MessageCircle, Share2, Plus, X, Image as ImageIcon, Send, Trash2, MoreVertical } from 'lucide-react';
import { fetchGlobalObservations, submitObservation, PhenotypeObservation, recordPeerValidation, postAnalysisNote, deleteObservation, getValidationCount, getCommentCount, fetchComments, checkUserLiked, removeLike, AnalysisNote } from '../services/communityService';

const InteractiveFooter: React.FC<{
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    onValidate: () => void;
    onDiscussionClick: () => void;
    onShareClick: () => void;
}> = ({ likeCount, commentCount, isLiked, onValidate, onDiscussionClick, onShareClick }) => {
    return (
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-slate-500">
            <button
                onClick={onValidate}
                className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-emerald-600' : 'hover:text-emerald-600'}`}
                title={isLiked ? "Unlike" : "Like this post"}
            >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-emerald-600' : ''}`} />
                <span className="font-semibold text-sm">{likeCount} Likes</span>
            </button>

            <button onClick={onDiscussionClick} className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">{commentCount} Discussion</span>
            </button>

            <button onClick={onShareClick} className="p-1 hover:text-slate-800 transition-colors" title="Share post">
                <Share2 className="w-5 h-5" />
            </button>
        </div>
    );
};

export const CommunityFeed: React.FC<{ userProfile?: any }> = ({ userProfile }) => {
    const [observations, setObservations] = useState<PhenotypeObservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [caption, setCaption] = useState('');
    const [plantName, setPlantName] = useState('');
    const [climateZone, setClimateZone] = useState('Tropical');
    const [isUploading, setIsUploading] = useState(false);
    const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PhenotypeObservation | null>(null);
    const [commentText, setCommentText] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [postCounts, setPostCounts] = useState<{ [key: string]: { likes: number, comments: number } }>({});
    const [comments, setComments] = useState<AnalysisNote[]>([]);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [activeFilter, setActiveFilter] = useState('All');

    const CURRENT_USER_ID = "Researcher_Demo_ID";
    const displayName = userProfile?.name || "Researcher_01";

    useEffect(() => {
        loadObservations();
    }, []);

    const loadObservations = async () => {
        const data = await fetchGlobalObservations();
        setObservations(data);

        const counts: { [key: string]: { likes: number, comments: number } } = {};
        const likedPosts = new Set<string>();

        for (const obs of data) {
            const likes = await getValidationCount(obs.id);
            const commentsCount = await getCommentCount(obs.id);
            const isLiked = await checkUserLiked(obs.id, CURRENT_USER_ID);

            counts[obs.id] = { likes, comments: commentsCount };
            if (isLiked) likedPosts.add(obs.id);
        }

        setPostCounts(counts);
        setUserLikes(likedPosts);
        setIsLoading(false);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handlePostUpload = async () => {
        if (!selectedImage || !plantName) return;
        setIsUploading(true);

        const success = await submitObservation(selectedImage, plantName, climateZone, displayName, caption);

        if (success) {
            await loadObservations();
            setIsUploadModalOpen(false);
            setSelectedImage(null);
            setImagePreview('');
            setCaption('');
            setPlantName('');
            setClimateZone('Tropical');
        } else {
            alert("Upload failed. Check Supabase keys.");
        }
        setIsUploading(false);
    };

    const handleValidationClick = async (observationId: string, isCurrentlyLiked: boolean) => {
        const success = isCurrentlyLiked
            ? await removeLike(observationId, CURRENT_USER_ID)
            : await recordPeerValidation(observationId, CURRENT_USER_ID, 'UPVOTE');

        if (success) {
            setUserLikes(prev => {
                const updated = new Set(prev);
                isCurrentlyLiked ? updated.delete(observationId) : updated.add(observationId);
                return updated;
            });
            setPostCounts(prev => ({
                ...prev,
                [observationId]: {
                    ...prev[observationId],
                    likes: isCurrentlyLiked
                        ? Math.max(0, prev[observationId].likes - 1)
                        : prev[observationId].likes + 1
                }
            }));
        }
    };

    const handleDiscussionClick = async (obs: PhenotypeObservation) => {
        setSelectedPost(obs);
        setDiscussionModalOpen(true);
        const fetchedComments = await fetchComments(obs.id);
        setComments(fetchedComments);
    };

    const handleShareClick = (obs: PhenotypeObservation) => {
        const shareUrl = `${window.location.origin}/community/${obs.id}`;
        if (navigator.share) {
            navigator.share({
                title: obs.specimen_taxonomy,
                text: `Check out this ${obs.specimen_taxonomy} observation!`,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }
    };

    const handleDeletePost = async (observationId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        const success = await deleteObservation(observationId);
        if (success) {
            await loadObservations();
            setOpenMenuId(null);
        } else {
            alert('Failed to delete post');
        }
    };


    const handlePostComment = async () => {
        if (!selectedPost || !commentText.trim()) return;

        const success = await postAnalysisNote(selectedPost.id, commentText, displayName);

        if (success) {
            setCommentText('');
            const fetchedComments = await fetchComments(selectedPost.id);
            setComments(fetchedComments);
            await loadObservations();
        }
    };

    // Filter Logic
    const filteredObservations = observations.filter(obs => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Popular') return true; // Handled by sort
        return obs.geo_climate_zone === activeFilter;
    }).sort((a, b) => {
        if (activeFilter === 'Popular') {
            // Calculate popularity score: likes + comments
            const popularityA = (postCounts[a.id]?.likes || 0) + (postCounts[a.id]?.comments || 0);
            const popularityB = (postCounts[b.id]?.likes || 0) + (postCounts[b.id]?.comments || 0);
            return popularityB - popularityA;
        }
        return 0; // Default order (created_at desc from fetch)
    });

    const FilterButton = ({ label, filter }: { label: string, filter: string }) => (
        <button
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === filter
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200 flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search in Community" className="flex-1 outline-none text-slate-700 placeholder:text-slate-400" />
            </div>

            <div className="flex gap-2 overflow-x-auto custom-x-scrollbar pb-2">
                <FilterButton label="🌿 All Plants" filter="All" />
                <FilterButton label="🌱 Tropical" filter="Tropical" />
                <FilterButton label="🍃 Temperate" filter="Temperate" />
                <FilterButton label="🌵 Desert" filter="Desert" />
                <FilterButton label="⭐ Popular" filter="Popular" />
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-slate-400">Loading posts...</div>
            ) : filteredObservations.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                    <p className="text-slate-400 mb-2">No posts found.</p>
                    <p className="text-xs text-slate-300">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredObservations.map((obs) => (
                        <div key={obs.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {userProfile?.avatarUrl ? (
                                        <img src={userProfile.avatarUrl} alt={obs.researcher_name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {obs.researcher_name?.charAt(0) || 'A'}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{obs.researcher_name || 'Anonymous Researcher'}</h4>
                                        <span className="text-xs text-slate-400">
                                            {userProfile?.country && `${userProfile.country} • `}
                                            {new Date(obs.created_at).toLocaleDateString()} • {obs.geo_climate_zone}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button onClick={() => setOpenMenuId(openMenuId === obs.id ? null : obs.id)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                    {openMenuId === obs.id && (
                                        <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[120px] z-10">
                                            <button onClick={() => handleDeletePost(obs.id)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="aspect-video bg-slate-100 relative">
                                <img src={obs.visual_evidence_url} alt="Evidence" className="w-full h-full object-cover" />
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-xs font-medium">{obs.geo_climate_zone} Zone</span>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Leaf className="w-4 h-4 text-emerald-600" />
                                    <h3 className="font-bold text-lg text-slate-900">{obs.specimen_taxonomy}</h3>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {obs.caption || "Specimen uploaded for phenotype analysis. Growth patterns appear consistent with regional expectations."}
                                </p>
                            </div>

                            <InteractiveFooter
                                likeCount={postCounts[obs.id]?.likes || 0}
                                commentCount={postCounts[obs.id]?.comments || 0}
                                isLiked={userLikes.has(obs.id)}
                                onValidate={() => handleValidationClick(obs.id, userLikes.has(obs.id))}
                                onDiscussionClick={() => handleDiscussionClick(obs)}
                                onShareClick={() => handleShareClick(obs)}
                            />
                        </div>
                    ))}
                </div>
            )}

            <button onClick={() => setIsUploadModalOpen(true)} className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-all hover:scale-110 z-20">
                <Plus className="w-6 h-6" />
            </button>

            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-900">Create Post</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Plant Photo</label>
                                {!imagePreview ? (
                                    <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
                                        <ImageIcon className="w-12 h-12 text-slate-400 mb-2" />
                                        <span className="text-slate-600 font-medium">Upload a photo</span>
                                        <span className="text-xs text-slate-400 mt-1">Click to browse</span>
                                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                    </label>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden">
                                        <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                                        <button onClick={() => { setSelectedImage(null); setImagePreview(''); }} className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Plant Name</label>
                                <input type="text" value={plantName} onChange={(e) => setPlantName(e.target.value)} placeholder="e.g., Monstera Deliciosa" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Caption (Optional)</label>
                                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Share your observations..." rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Climate Zone</label>
                                <select value={climateZone} onChange={(e) => setClimateZone(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                                    <option value="Tropical">🌱 Tropical</option>
                                    <option value="Temperate">🍃 Temperate</option>
                                    <option value="Cold">❄️ Cold</option>
                                    <option value="Desert">🌵 Desert</option>
                                </select>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-3xl">
                            <button onClick={handlePostUpload} disabled={!selectedImage || !plantName || isUploading} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Post to Community
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {discussionModalOpen && selectedPost && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-900">Discussion</h3>
                            <button onClick={() => setDiscussionModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <img src={selectedPost.visual_evidence_url} alt="" className="w-16 h-16 object-cover rounded-xl" />
                                <div>
                                    <h4 className="font-bold text-slate-900">{selectedPost.specimen_taxonomy}</h4>
                                    <p className="text-xs text-slate-400">by {selectedPost.researcher_name}</p>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {comments.length === 0 ? (
                                    <p className="text-sm text-slate-500">No comments yet. Be the first to start the discussion!</p>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="bg-slate-50 p-3 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                {comment.researcher_name === displayName && userProfile?.avatarUrl ? (
                                                    <img
                                                        src={userProfile.avatarUrl}
                                                        alt={comment.researcher_name}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        {comment.researcher_name?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <span className="font-semibold text-sm">{comment.researcher_name}</span>
                                                <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 ml-8">{comment.note_content}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                                <button onClick={handlePostComment} disabled={!commentText.trim()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
