import React, { useState, useRef, useEffect } from 'react';
import { Camera, Edit2, Check, X, ArrowUpRight, Facebook, Mail, ChevronDown, Github, Linkedin, MessageSquare, ExternalLink } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwner?: boolean;
  onUpdateBio: (newBio: string) => void;
  onUpdateName: (newName: string) => void;
  onUpdateAvatar?: (url: string) => void;
  onUpdateCoverPhoto?: (url: string) => void;
}

export default function ProfileHeader({
  profile,
  isOwner = false,
  onUpdateBio,
  onUpdateName,
  onUpdateAvatar,
  onUpdateCoverPhoto
}: ProfileHeaderProps) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(profile.bio);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);

  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState(profile.avatar);

  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState(profile.coverPhoto);

  const [isMessageMenuOpen, setIsMessageMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Synchronize local inputs when parent profile state changes from database sync
  useEffect(() => {
    setEditedBio(profile.bio);
  }, [profile.bio]);

  useEffect(() => {
    setEditedName(profile.name);
  }, [profile.name]);

  useEffect(() => {
    setAvatarUrlInput(profile.avatar);
  }, [profile.avatar]);

  useEffect(() => {
    setCoverUrlInput(profile.coverPhoto);
  }, [profile.coverPhoto]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMessageMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSaveBio = () => {
    onUpdateBio(editedBio);
    setIsEditingBio(false);
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdateName(editedName);
      setIsEditingName(false);
    }
  };

  const handleSaveAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarUrlInput.trim() && onUpdateAvatar) {
      onUpdateAvatar(avatarUrlInput.trim());
      setIsEditingAvatar(false);
    }
  };

  const handleSaveCover = (e: React.FormEvent) => {
    e.preventDefault();
    if (coverUrlInput.trim() && onUpdateCoverPhoto) {
      onUpdateCoverPhoto(coverUrlInput.trim());
      setIsEditingCover(false);
    }
  };

  return (
    <div className="bg-white shadow border border-gray-200 rounded-lg max-w-6xl mx-auto mt-14 relative" id="fb-profile-header">
      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 md:h-80 bg-gray-200 rounded-t-lg overflow-hidden" id="fb-cover-container">
        <img
          src={profile.coverPhoto}
          alt="Cover Backplate"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {isOwner && (
          <button
            onClick={() => setIsEditingCover(true)}
            className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded flex items-center gap-1.5 transition-colors shadow z-20"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Edit Cover Photo</span>
          </button>
        )}

        {/* Cover Photo Editor Popup */}
        {isEditingCover && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 z-40">
            <form onSubmit={handleSaveCover} className="bg-white rounded-lg p-4 font-sans max-w-md w-full shadow-2xl text-gray-900 border border-gray-300">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Change Cover Photo Link</h3>
              <input
                type="url"
                value={coverUrlInput}
                onChange={(e) => setCoverUrlInput(e.target.value)}
                className="w-full text-xs p-2 border border-gray-350 rounded mb-3 font-sans focus:outline-indigo-500 text-gray-900"
                placeholder="Paste Cover Image URL here..."
                required
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setCoverUrlInput(profile.coverPhoto); setIsEditingCover(false); }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#4f46e5] hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Save Cover
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Profile Details Container */}
      <div className="relative px-6 pb-4 pt-1 flex flex-col md:flex-row items-center md:items-end justify-between border-b border-gray-200">
        
        {/* Avatar and Name */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-24 md:-mt-16 z-10 w-full md:w-auto">
          {/* Circular Overlapping Profile Avatar */}
          <div className="relative w-40 h-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden group flex-shrink-0">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isOwner && (
              <div
                onClick={() => setIsEditingAvatar(true)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="text-white w-6 h-6 animate-pulse" />
              </div>
            )}

            {/* Avatar Photo Editor Popup */}
            {isEditingAvatar && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                <form onSubmit={handleSaveAvatar} className="bg-white rounded-lg p-4 font-sans max-w-sm w-full shadow-2xl border border-gray-300">
                  <h3 className="font-bold text-sm text-gray-850 mb-2">Change Profile Photo Link</h3>
                  <input
                    type="url"
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-350 rounded mb-3 font-sand focus:outline-indigo-500 text-gray-900"
                    placeholder="Paste Profile Avatar URL..."
                    required
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => { setAvatarUrlInput(profile.avatar); setIsEditingAvatar(false); }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#4f46e5] hover:bg-indigo-700 text-white rounded font-semibold"
                    >
                      Save Avatar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Name and Meta */}
          <div className="text-center md:text-left mb-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl md:text-3xl font-bold font-sans text-gray-900 border-b-2 border-[#4f46e5] focus:outline-none"
                    maxLength={30}
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditedName(profile.name); setIsEditingName(false); }} className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold font-sans text-gray-900 leading-tight">
                    {profile.name}
                  </h1>
                  {isOwner && (
                    <button onClick={() => setIsEditingName(true)} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors" title="Edit name">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="text-gray-500 font-medium text-sm mt-0.5">{profile.role} at {profile.company}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-xs text-gray-400 font-sans mt-1">
              <span>{profile.location}</span>
              <span>•</span>
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 text-indigo-600 font-medium">
                GitHub <ArrowUpRight className="w-3 h-3" />
              </a>
              <span>•</span>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 text-indigo-600 font-medium">
                LinkedIn <ArrowUpRight className="w-3 h-3" />
              </a>
              {profile.facebook && (
                <>
                  <span>•</span>
                  <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 text-indigo-600 font-medium">
                    Facebook <ArrowUpRight className="w-3 h-3" />
                  </a>
                </>
              )}
              {profile.email && (
                <>
                  <span>•</span>
                  <a href={profile.email} className="hover:underline flex items-center gap-0.5 text-indigo-600 font-medium">
                    Email <ArrowUpRight className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex items-center gap-2 mt-4 md:mt-0 z-30 relative" ref={menuRef}>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#4f46e5] hover:bg-indigo-700 text-white font-semibold text-sm rounded shadow transition-colors flex items-center gap-1.5"
            id="fb-connect-btn"
          >
            <span>Connect</span>
          </a>
          <div className="relative">
            <button
              onClick={() => setIsMessageMenuOpen(!isMessageMenuOpen)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm rounded transition-colors flex items-center gap-1.5"
              id="fb-message-btn"
              aria-haspopup="true"
              aria-expanded={isMessageMenuOpen}
            >
              <MessageSquare className="w-4 h-4 text-gray-650" />
              <span>Message</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 ml-0.5" />
            </button>

            {/* Message Options Hover/Click Facebook Dropdown Menu */}
            {isMessageMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5 mb-1 select-none">
                  Choose an action
                </div>
                
                {/* Follow on GitHub */}
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMessageMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Github className="w-4 h-4 text-gray-600" />
                    <span>Follow on GitHub</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                {/* Connect via LinkedIn */}
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMessageMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-4 h-4 text-gray-650" />
                    <span>Connect via LinkedIn</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                {/* Follow on Facebook */}
                <a
                  href={profile.facebook || "https://facebook.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMessageMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Facebook className="w-4 h-4 text-[#4f46e5]" />
                    <span>Follow on Facebook</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                {/* Send Email Profile Inquiry */}
                <a
                  href={profile.email ? (profile.email.startsWith('mailto:') ? profile.email : `mailto:${profile.email}`) : `mailto:melmarjvelasco@gmail.com`}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMessageMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <span>Send Email Profile Inquiry</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio / Short Intro Section underneath */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-grow max-w-3xl w-full text-center md:text-left">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 text-center md:text-left">Bio</h2>
          {isEditingBio ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="w-full text-sm text-gray-700 border border-gray-300 rounded p-2 focus:ring-1 focus:ring-[#4f46e5] focus:outline-none bg-white font-sans text-center md:text-left"
                rows={2}
                maxLength={200}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setEditedBio(profile.bio); setIsEditingBio(false); }}
                  className="px-2.5 py-1 text-xs text-gray-500 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  className="px-2.5 py-1 text-xs text-white bg-[#4f46e5] hover:bg-indigo-700 rounded transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center md:items-start md:justify-start gap-1 w-full">
              <p className="text-sm text-gray-700 italic font-sans leading-relaxed text-center md:text-left flex-grow">
                "{profile.bio}"
              </p>
              {isOwner && (
                <button onClick={() => setIsEditingBio(true)} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors flex-shrink-0" title="Edit bio">
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center md:justify-end items-center max-w-sm w-full md:w-auto">
          {profile.skills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="bg-indigo-50 text-[#4f46e5] border border-indigo-100 text-xs font-semibold px-2 py-0.5 rounded-full">
              {skill}
            </span>
          ))}
        </div>
      </div>


    </div>
  );
}
