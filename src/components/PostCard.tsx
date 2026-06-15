import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, Globe, Heart, Hash, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight, Lock, RotateCw, Laptop, Smartphone, Wifi, Battery } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Comment } from '../types';
import CommentSection from './CommentSection';

const renderDescriptionWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const url = part.toLowerCase().startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#4f46e5] hover:underline break-all font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

interface PostCardProps {
  key?: string;
  post: Post;
  comments: Comment[];
  isSubmittingComment: boolean;
  onLike: (postId: string) => Promise<void>;
  onAddComment: (postId: string, text: string, authorName?: string) => Promise<void>;
  onDeleteComment?: (postId: string, commentId: string) => Promise<void>;
  viewerId: string;
  developerName: string;
  developerAvatar: string;
  isOwner?: boolean;
  onDeletePost?: (postId: string) => Promise<void>;
  onEditPost?: (postId: string, title: string, description: string, tags: string[], imageUrl?: string, imageUrls?: string[]) => Promise<void>;
}

export default function PostCard({
  post,
  comments,
  isSubmittingComment,
  onLike,
  onAddComment,
  onDeleteComment,
  viewerId,
  developerName,
  developerAvatar,
  isOwner = false,
  onDeletePost,
  onEditPost
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageAspect, setImageAspect] = useState<'landscape' | 'portrait'>('landscape');
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLightboxOpen) {
      const images = post.imageUrls && post.imageUrls.length > 0
        ? post.imageUrls
        : (post.imageUrl ? [post.imageUrl] : []);
      if (images.length === 0) return;
      
      setImageLoading(true);
      const currentUrl = images[lightboxIndex];
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth >= img.naturalHeight) {
          setImageAspect('landscape');
        } else {
          setImageAspect('portrait');
        }
        setImageLoading(false);
      };
      img.onerror = () => {
        setImageLoading(false);
      };
      img.src = currentUrl;
    }
  }, [isLightboxOpen, lightboxIndex, post.imageUrls, post.imageUrl]);

  // Swipe and zoom states for mobile lightbox
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [pinchStartDist, setPinchStartDist] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches.length === 2) {
      // Pinch gesture
      const dist = Math.hypot(
        e.targetTouches[0].clientX - e.targetTouches[1].clientX,
        e.targetTouches[0].clientY - e.targetTouches[1].clientY
      );
      setPinchStartDist(dist);
      setTouchStart(null);
    } else if (e.targetTouches.length === 1) {
      if (zoomScale > 1) {
        setDragStart({
          x: e.targetTouches[0].clientX - zoomOffset.x,
          y: e.targetTouches[0].clientY - zoomOffset.y
        });
      } else {
        setTouchStart(e.targetTouches[0].clientX);
        setTouchEnd(null);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches.length === 2 && pinchStartDist !== null) {
      const dist = Math.hypot(
        e.targetTouches[0].clientX - e.targetTouches[1].clientX,
        e.targetTouches[0].clientY - e.targetTouches[1].clientY
      );
      const ratio = dist / pinchStartDist;
      const nextScale = Math.min(Math.max(1, zoomScale * ratio), 4);
      setZoomScale(nextScale);
      setPinchStartDist(dist);
    } else if (e.targetTouches.length === 1) {
      if (zoomScale > 1 && dragStart !== null) {
        const dx = e.targetTouches[0].clientX - dragStart.x;
        const dy = e.targetTouches[0].clientY - dragStart.y;
        
        // constrain dragging margin bounds based on scale
        const maxOffset = (zoomScale - 1) * 200;
        const boundedX = Math.min(Math.max(-maxOffset, dx), maxOffset);
        const boundedY = Math.min(Math.max(-maxOffset * 1.5, dy), maxOffset * 1.5);
        setZoomOffset({ x: boundedX, y: boundedY });
      } else if (zoomScale === 1) {
        setTouchEnd(e.targetTouches[0].clientX);
      }
    }
  };

  const handleTouchEnd = (imagesLength: number) => {
    setPinchStartDist(null);
    setDragStart(null);

    if (zoomScale > 1) return;

    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> next image
      setLightboxIndex((prev) => {
        setZoomScale(1);
        setZoomOffset({ x: 0, y: 0 });
        return prev === imagesLength - 1 ? 0 : prev + 1;
      });
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> previous image
      setLightboxIndex((prev) => {
        setZoomScale(1);
        setZoomOffset({ x: 0, y: 0 });
        return prev === 0 ? imagesLength - 1 : prev - 1;
      });
    }
  };

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editDesc, setEditDesc] = useState(post.description);
  const [editTags, setEditTags] = useState(post.tags.join(', '));
  const [editImageUrls, setEditImageUrls] = useState<string[]>(post.imageUrls || (post.imageUrl ? [post.imageUrl] : []));
  const [editUrlInput, setEditUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditAddUrl = () => {
    if (!editUrlInput.trim()) return;
    const cleanUrl = editUrlInput.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
      alert('Please enter a valid URL starting with http://, https://, or /');
      return;
    }
    if (editImageUrls.length >= 10) {
      alert('You can add up to 10 images.');
      return;
    }
    setEditImageUrls([...editImageUrls, cleanUrl]);
    setEditUrlInput('');
  };

  const handleEditRemoveUrl = (indexToRemove: number) => {
    setEditImageUrls(editImageUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDesc.trim()) return;
    try {
      setIsSaving(true);
      const parsedTags = editTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      let finalUrls = [...editImageUrls];
      if (editUrlInput.trim()) {
        const cleanUrl = editUrlInput.trim();
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')) {
          if (!finalUrls.includes(cleanUrl)) {
            finalUrls.push(cleanUrl);
          }
        }
      }

      const firstImg = finalUrls.length > 0 ? finalUrls[0] : undefined;
      await onEditPost?.(post.id, editTitle.trim(), editDesc.trim(), parsedTags, firstImg, finalUrls);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasLiked = post.likedBy.includes(viewerId);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const formatPostTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow mb-4 text-gray-900" id={`post-${post.id}`}>
      {/* Post Top Bar: Author, Avatar, Public status */}
      <div className="p-4 flex justify-between items-start pb-2 font-sans">
        <div className="flex gap-2.5 items-center">
          <img
            src={developerAvatar}
            alt={developerName}
            className="w-10 h-10 rounded-full object-cover border border-gray-100"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-bold border-b border-transparent hover:border-gray-900 cursor-pointer text-[15px] flex items-center gap-1">
              {developerName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 font-normal">
              <span>{formatPostTime(post.createdAt)}</span>
              <span>•</span>
              <Globe className="w-3.5 h-3.5" title="Public" />
            </div>
          </div>
        </div>

        {/* Owner Controls: Edit / Delete */}
        {isOwner && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-blue-600 transition-colors ${isEditing ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Edit Post"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this project post? This action cannot be undone.')) {
                  onDeletePost?.(post.id);
                }
              }}
              className="p-1.5 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-550 transition-colors"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="px-4 pb-4 flex flex-col gap-3 font-sans border-t border-gray-100 pt-3 bg-gray-50/50">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <Edit2 className="w-3 h-3 text-[#4f46e5]" /> Editing Portfolio Post
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Project Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-1.5 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Project Details</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4f46e5] min-h-[110px] resize-none leading-relaxed text-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tech Stack (comma-separated)</label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Project Gallery ({editImageUrls.length}/10 images)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste Image URL (JPEG, PNG, /profile/my-image.jpg, etc.)..."
                value={editUrlInput}
                onChange={(e) => setEditUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditAddUrl();
                  }
                }}
                className="flex-grow bg-white border border-gray-300 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
              />
              <button
                type="button"
                onClick={handleEditAddUrl}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors border border-gray-200 whitespace-nowrap"
              >
                + Add Image
              </button>
            </div>
            {/* Horizontal preview strip */}
            {editImageUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-1.5 mt-1.5 scrollbar-thin scrollbar-thumb-gray-250">
                {editImageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-12 h-12 rounded border border-gray-200 overflow-hidden shrink-0 bg-gray-100">
                    <img src={url} alt={`Edit Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleEditRemoveUrl(idx)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-colors"
                      title="Remove Image"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setEditTitle(post.title);
                setEditDesc(post.description);
                setEditTags(post.tags.join(', '));
                setEditImageUrls(post.imageUrls || (post.imageUrl ? [post.imageUrl] : []));
                setEditUrlInput('');
                setIsEditing(false);
              }}
              className="px-3.5 py-1.5 hover:bg-gray-200 text-gray-600 bg-gray-100 font-semibold text-xs rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-[#4f46e5] hover:bg-indigo-700 font-semibold text-white text-xs rounded-md shadow-sm transition-all flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Post Body text */}
          <div className="px-4 pb-2 font-sans">
            <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1.5 hover:text-[#4f46e5] transition-colors cursor-pointer">
              {post.title}
            </h3>
            <p className="text-[14px] leading-relaxed text-gray-800 whitespace-pre-wrap">
              {renderDescriptionWithLinks(post.description)}
            </p>

            {/* Tech Stack HashTags / Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-xs font-semibold text-[#4f46e5] hover:underline cursor-pointer bg-indigo-50/50 px-2 py-0.5 rounded"
                >
                  #{tag.toLowerCase().replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>

          {/* Post Image Showcase: Facebook Multi-photo Grid Layout */}
          {(() => {
            const images = post.imageUrls && post.imageUrls.length > 0
              ? post.imageUrls
              : (post.imageUrl ? [post.imageUrl] : []);

            if (images.length === 0) return null;

            const handleImageClick = (index: number) => {
              setLightboxIndex(index);
              setIsLightboxOpen(true);
            };

            if (images.length === 1) {
              return (
                <div 
                  className="my-2 border-y border-gray-100 bg-gray-50 flex items-center justify-center max-h-[460px] w-full overflow-hidden select-none cursor-pointer"
                  onClick={() => handleImageClick(0)}
                >
                  <img
                    src={images[0]}
                    alt={post.title}
                    className="w-full max-h-[460px] object-contain hover:scale-[1.01] transition-transform duration-300 block"
                    referrerPolicy="no-referrer"
                  />
                </div>
              );
            }

            if (images.length === 2) {
              return (
                <div className="my-2 border-y border-gray-100 bg-gray-100 grid grid-cols-2 gap-1 h-[220px] sm:h-[300px] select-none">
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="w-full h-full overflow-hidden cursor-pointer bg-gray-50 relative group"
                      onClick={() => handleImageClick(idx)}
                    >
                      <img
                        src={img}
                        alt={`${post.title} showcase ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              );
            }

            if (images.length === 3) {
              // 1 large on left, 2 smaller stacked on right
              return (
                <div className="my-2 border-y border-gray-100 bg-gray-100 grid grid-cols-12 gap-1 h-[260px] sm:h-[340px] select-none">
                  <div 
                    className="col-span-8 h-full overflow-hidden cursor-pointer bg-gray-50 relative group"
                    onClick={() => handleImageClick(0)}
                  >
                    <img
                      src={images[0]}
                      alt={`${post.title} showcase 1`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="col-span-4 grid grid-rows-2 gap-1 h-full relative">
                    {images.slice(1, 3).map((img, idx) => (
                      <div 
                        key={idx} 
                        className="w-full h-full overflow-hidden cursor-pointer bg-gray-50 relative group"
                        onClick={() => handleImageClick(idx + 1)}
                      >
                        <img
                          src={img}
                          alt={`${post.title} showcase ${idx + 2}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (images.length === 4) {
              // 1 large top, 3 smaller on bottom
              return (
                <div className="my-2 border-y border-gray-100 bg-gray-100 flex flex-col gap-1 select-none h-[300px] sm:h-[400px]">
                  <div 
                    className="flex-1 overflow-hidden cursor-pointer bg-gray-50 relative group"
                    onClick={() => handleImageClick(0)}
                  >
                    <img
                      src={images[0]}
                      alt={`${post.title} showcase 1`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-101 transition-transform duration-300 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1 h-[90px] sm:h-[120px] relative">
                    {images.slice(1, 4).map((img, idx) => (
                      <div 
                        key={idx} 
                        className="w-full h-full overflow-hidden cursor-pointer bg-gray-50 relative group"
                        onClick={() => handleImageClick(idx + 1)}
                      >
                        <img
                          src={img}
                          alt={`${post.title} showcase ${idx + 2}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // 5 or more images
            const remainingCount = images.length - 5;
            return (
              <div className="my-2 border-y border-gray-100 bg-gray-100 flex flex-col gap-1 select-none h-[320px] sm:h-[400px]">
                {/* Top: 2 equal-width images */}
                <div className="grid grid-cols-2 gap-1 flex-grow relative">
                  {images.slice(0, 2).map((img, idx) => (
                    <div 
                      key={idx} 
                      className="w-full h-full overflow-hidden cursor-pointer bg-gray-50 relative group"
                      onClick={() => handleImageClick(idx)}
                    >
                      <img
                        src={img}
                        alt={`${post.title} showcase ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
                {/* Bottom: 3 equal-width images (the 3rd image has dynamic overlay if count > 5) */}
                <div className="grid grid-cols-3 gap-1 h-[90px] sm:h-[130px] relative">
                  {images.slice(2, 5).map((img, idx) => {
                    const actualIdx = idx + 2;
                    const isLastCell = idx === 2;
                    return (
                      <div 
                        key={idx} 
                        className="w-full h-full overflow-hidden cursor-pointer bg-gray-50 relative group"
                        onClick={() => handleImageClick(actualIdx)}
                      >
                        <img
                          src={img}
                          alt={`${post.title} showcase ${actualIdx + 1}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        {isLastCell && remainingCount > 0 && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white font-sans transition-colors group-hover:bg-black/50 z-10">
                            <span className="text-base sm:text-xl font-bold font-sans">+{remainingCount}</span>
                            <span className="text-[8px] sm:text-[10px] font-semibold tracking-wider uppercase opacity-90 hidden sm:inline">More</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Immersive Lightbox Modal */}
          <AnimatePresence>
            {isLightboxOpen && (() => {
              const images = post.imageUrls && post.imageUrls.length > 0
                ? post.imageUrls
                : (post.imageUrl ? [post.imageUrl] : []);

              if (images.length === 0) return null;

              const activeIndex = Math.min(Math.max(0, lightboxIndex), images.length - 1);

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/95 z-[9999] flex flex-col md:flex-row items-stretch select-none"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setZoomScale(1);
                    setZoomOffset({ x: 0, y: 0 });
                  }}
                >
                  {/* Main image viewer area */}
                  <div 
                    className="flex-grow flex items-center justify-center relative p-2 sm:p-4 h-[75vh] md:h-auto overflow-hidden animate-[fadeIn_0.2s_ease-out]" 
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => handleTouchEnd(images.length)}
                  >
                    {imageLoading ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest animate-pulse">
                          Rendering High-Fidelity Mockup...
                        </span>
                      </div>
                    ) : imageAspect === 'landscape' ? (
                      /* Landscape - Premium Mock Safari Browser Wrapper */
                      <div 
                        className="w-full max-w-[94vw] lg:max-w-6xl xl:max-w-7xl flex flex-col bg-slate-950 rounded-xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border border-white/10 mx-auto"
                        style={{
                          transform: `translate3d(${zoomOffset.x}px, ${zoomOffset.y}px, 0px) scale(${zoomScale})`,
                          transition: (dragStart !== null || pinchStartDist !== null) ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transformStyle: 'preserve-3d',
                          willChange: 'transform',
                          touchAction: zoomScale > 1 ? 'none' : 'pan-y',
                          cursor: zoomScale > 1 ? 'grab' : 'default'
                        }}
                      >
                        {/* Safari Header */}
                        <div className="h-10 sm:h-11 bg-slate-950 px-4 flex items-center justify-between border-b border-white/5 select-none shrink-0 border-t-0 border-l-0 border-r-0">
                          {/* Mac Window Controls */}
                          <div className="flex items-center gap-2 w-1/4">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                          </div>
                          
                          {/* URL Bar */}
                          <div className="flex-1 max-w-md bg-slate-900 border border-white/10 rounded-lg h-7 px-3 flex items-center justify-between text-slate-400 text-[11px] font-mono select-none">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Lock className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                              <span className="text-slate-300 tracking-wide font-medium">melmar.dev</span>
                              <span className="text-slate-600 font-sans">/</span>
                              <span className="text-slate-400 font-sans tracking-tight">workspace/media</span>
                            </div>
                            <RotateCw className="w-3 h-3 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors" />
                          </div>

                          {/* Window Controls Right */}
                          <div className="flex items-center justify-end gap-3 w-1/4">
                            <Laptop className="w-4 h-4 text-indigo-400" />
                            <div className="flex gap-1 font-sans">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-650" />
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-650" />
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-650" />
                            </div>
                          </div>
                        </div>

                        {/* Canvas Body */}
                        <div className="relative p-2 bg-slate-900/65 flex items-center justify-center overflow-hidden max-h-[82vh]">
                          <img 
                            src={images[activeIndex]} 
                            alt={`${post.title} full view ${activeIndex + 1}`}
                            className="max-w-full max-h-[78vh] object-contain rounded-md select-none shadow-inner"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Portrait - Premium Mobile/Smartphone Chassis */
                      <div 
                        className="relative mx-auto rounded-[24px] sm:rounded-[32px] border-4 sm:border-[6px] border-slate-800 bg-[#070913] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[78vh] max-w-[90vw] md:max-w-sm"
                        style={{
                          transform: `translate3d(${zoomOffset.x}px, ${zoomOffset.y}px, 0px) scale(${zoomScale})`,
                          transition: (dragStart !== null || pinchStartDist !== null) ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transformStyle: 'preserve-3d',
                          willChange: 'transform',
                          touchAction: zoomScale > 1 ? 'none' : 'pan-y',
                          cursor: zoomScale > 1 ? 'grab' : 'default'
                        }}
                      >
                        {/* Smartphone side button accents - subtle & thin */}
                        <div className="absolute -left-[4px] top-16 w-[2px] h-8 bg-slate-700/80 rounded-r" />
                        <div className="absolute -left-[4px] top-28 w-[2px] h-10 bg-slate-700/80 rounded-r" />
                        <div className="absolute -right-[4px] top-24 w-[2px] h-12 bg-slate-700/80 rounded-l" />

                        {/* Premium status bar */}
                        <div className="h-8 px-4 sm:px-5 flex items-center justify-between text-white/95 select-none text-[10px] font-semibold relative z-20 shrink-0 border-0">
                          <span className="font-sans leading-none">9:41</span>
                          
                          {/* Dynamic Island Notch */}
                          <div className="absolute top-1.5 w-14 h-3.5 bg-black rounded-full left-1/2 -translate-x-1/2 flex items-center justify-center border border-white/5 shadow-inner">
                            <div className="w-1 h-1 rounded-full bg-[#1c1d3a] absolute right-3" />
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-white/90">
                            <Wifi className="w-3 h-3" />
                            <Smartphone className="w-2.5 h-2.5 text-indigo-400" />
                            <Battery className="w-3.5 h-3.5 select-none stroke-[2]" />
                          </div>
                        </div>

                        {/* Content space */}
                        <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-950 p-1 sm:p-1.5">
                          <img 
                            src={images[activeIndex]} 
                            alt={`${post.title} full view ${activeIndex + 1}`}
                            className="max-h-[66vh] w-auto max-w-full object-contain rounded-xl sm:rounded-2xl select-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Indicator bottom line */}
                        <div className="h-4 relative z-20 flex justify-center items-center pointer-events-none select-none shrink-0">
                          <div className="h-0.5 w-20 bg-white/45 rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* Explicit Zoom Controller overlay */}
                    <div className="absolute top-4 left-4 flex gap-1.5 z-50">
                      <button
                        type="button"
                        onClick={() => setZoomScale(s => Math.min(s + 0.5, 4))}
                        className="px-2.5 py-1.5 bg-black/60 hover:bg-indigo-600 active:scale-95 text-white rounded-lg transition-all border border-white/10 text-[11px] font-semibold"
                        title="Zoom In"
                      >
                        Zoom +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setZoomScale(1);
                          setZoomOffset({ x: 0, y: 0 });
                        }}
                        className="px-2.5 py-1.5 bg-black/60 hover:bg-slate-700 active:scale-95 text-white rounded-lg transition-all border border-white/10 text-[11px] font-semibold"
                        title="Reset Zoom"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setZoomScale(s => {
                            const next = s - 0.5;
                            if (next <= 1) {
                              setZoomOffset({ x: 0, y: 0 });
                              return 1;
                            }
                            return next;
                          });
                        }}
                        className="px-2.5 py-1.5 bg-black/60 hover:bg-indigo-600 active:scale-95 text-white rounded-lg transition-all border border-white/10 text-[11px] font-semibold"
                        title="Zoom Out"
                      >
                        Zoom -
                      </button>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setIsLightboxOpen(false);
                        setZoomScale(1);
                        setZoomOffset({ x: 0, y: 0 });
                      }}
                      className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all border border-white/10 z-20 cursor-pointer"
                      aria-label="Close Lightbox"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Left Arrow Button */}
                    {images.length > 1 && (
                      <button
                        onClick={() => {
                          setZoomScale(1);
                          setZoomOffset({ x: 0, y: 0 });
                          setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                        }}
                        className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/5 backdrop-blur-sm z-20 cursor-pointer"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    )}

                    {/* Right Arrow Button */}
                    {images.length > 1 && (
                      <button
                        onClick={() => {
                          setZoomScale(1);
                          setZoomOffset({ x: 0, y: 0 });
                          setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/5 backdrop-blur-sm z-20 cursor-pointer"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    )}

                    {/* Counter Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 text-center z-10 font-sans">
                      <div className="inline-block px-3 py-1.5 bg-black/60 border border-white/10 rounded-full text-xs font-semibold text-white/95 backdrop-blur-md">
                        Image {activeIndex + 1} of {images.length}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Thumbnails Panel */}
                  {images.length > 1 && (
                    <div 
                      className="bg-black/40 border-t md:border-t-0 md:border-l border-white/10 w-full md:w-[200px] max-h-[30vh] md:max-h-full overflow-y-auto overflow-x-auto md:overflow-x-hidden p-4 shrink-0 flex md:flex-col gap-3 justify-center md:justify-start items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="hidden md:block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 w-full text-center md:text-left font-sans">
                        Project Gallery
                      </div>
                      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible w-full pb-1 md:pb-0">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setZoomScale(1);
                              setZoomOffset({ x: 0, y: 0 });
                              setLightboxIndex(idx);
                            }}
                            className={`relative w-14 h-14 md:w-full md:h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-350 cursor-pointer ${
                              idx === activeIndex
                                ? 'border-[#4f46e5] scale-[1.03] shadow-[0_0_12px_rgba(79,70,229,0.4)]'
                                : 'border-white/10 hover:border-white/30 brightness-75 hover:brightness-100'
                            }`}
                          >
                            <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
                            {idx === activeIndex && (
                              <div className="absolute inset-0 bg-blue-500/10 mix-blend-color-dodge" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </>
      )}

      {/* Post Feedback Statistics row */}
      <div className="px-4 py-2 flex items-center justify-between text-xs sm:text-sm text-gray-500 border-b border-gray-100 font-sans">
        <div className="flex items-center gap-1.5">
          {post.likesCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#4f46e5] hover:bg-indigo-700 shadow-sm cursor-pointer border border-white">
                <ThumbsUp className="w-3 h-3 text-white fill-white" />
              </span>
              <span className="font-medium cursor-pointer hover:underline">
                {hasLiked ? (
                  post.likesCount === 1 ? 'You liked this' : `You and ${post.likesCount - 1} other${post.likesCount - 1 > 1 ? 's' : ''}`
                ) : (
                  `${post.likesCount} reaction${post.likesCount > 1 ? 's' : ''}`
                )}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 font-normal font-sans">
          <button onClick={() => setShowComments(!showComments)} className="hover:underline">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </button>
          <span>•</span>
          <span>1 share</span>
        </div>
      </div>

      {/* Post Actions Button Dock */}
      <div className="px-1 py-1 flex items-center justify-between text-xs sm:text-[14px] text-gray-600 font-semibold border-b border-gray-100 font-sans">
        {/* Like Button with motion click animation */}
        <button
          onClick={() => onLike(post.id)}
          className={`flex-1 flex items-center justify-center gap-2 h-10 hover:bg-gray-100 rounded-md transition-all active:scale-[0.98] ${
            hasLiked ? 'text-[#4f46e5]' : 'text-gray-650'
          }`}
        >
          <motion.div
            animate={hasLiked ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.25 }}
          >
            <ThumbsUp className={`w-5 h-5 ${hasLiked ? 'fill-[#4f46e5]' : ''}`} />
          </motion.div>
          <span>Like</span>
        </button>

        {/* Comment button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 h-10 hover:bg-gray-100 rounded-md transition-colors ${
            showComments ? 'text-[#4f46e5] bg-indigo-50/40' : 'text-gray-650'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Comment</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 h-10 hover:bg-gray-100 text-gray-650 rounded-md transition-colors relative"
        >
          <Share2 className="w-5 h-5" />
          <span>{isCopied ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Expandable nested comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CommentSection
              comments={comments}
              isSubmitting={isSubmittingComment}
              onAddComment={(text, authorName) => onAddComment(post.id, text, authorName)}
              onDeleteComment={(commentId) => onDeleteComment?.(post.id, commentId)}
              visitorAvatar={developerAvatar}
              isOwner={isOwner}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
