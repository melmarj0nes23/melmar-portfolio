import React, { useState } from 'react';
import { 
  Search, Bell, MessageCircle, Menu, X, Sparkles, MapPin, 
  GraduationCap, Github, Linkedin, Facebook, Mail, ExternalLink, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  userName: string;
  userAvatar: string;
  userBio?: string;
  userRole?: string;
  userLocation?: string;
  userGithub?: string;
  userLinkedin?: string;
  userFacebook?: string;
  userEmail?: string;
  visitorCount?: number;
  visitorOrdinal?: number;
}

function getOrdinalSuffix(i: number) {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
}

export default function Header({ 
  userName, 
  userAvatar, 
  userBio, 
  userRole, 
  userLocation,
  userGithub = 'https://github.com/melmarj0nes23',
  userLinkedin = 'https://ph.linkedin.com/in/melmar-jones-velasco-5b795a340',
  userFacebook = 'https://facebook.com/melmarj0nes23',
  userEmail = 'mailto:melmarjvelasco@gmail.com',
  visitorCount = 1,
  visitorOrdinal = 1
}: HeaderProps) {
  const [showGreeting, setShowGreeting] = useState(false);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [isVisitorPopupOpen, setIsVisitorPopupOpen] = useState(false);

  // Close other overlays when opening one
  const handleToggleMessenger = () => {
    setIsMessengerOpen(!isMessengerOpen);
    setIsVisitorPopupOpen(false);
  };

  const handleToggleVisitor = () => {
    setIsVisitorPopupOpen(!isVisitorPopupOpen);
    setIsMessengerOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#1877f2] shadow-md z-50 flex items-center justify-between px-4" id="fb-header">
      {/* Left-most section: Profile Badge / Avatar */}
      <div className="flex items-center flex-shrink-0">
        <div 
          onClick={() => {
            setShowGreeting(true);
            setIsMessengerOpen(false);
            setIsVisitorPopupOpen(false);
          }}
          className="flex items-center gap-2 hover:bg-white/15 active:scale-98 px-2 py-1 rounded-full cursor-pointer transition-all text-white"
          title="About Melmar"
          id="header-user-badge"
        >
          <img
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 rounded-full border border-white/30 object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
          <span className="text-sm font-semibold hidden sm:inline whitespace-nowrap hover:underline select-none">
            {userName.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Center section: Search bar */}
      <div className="flex-grow flex justify-center max-w-[200px] xs:max-w-[260px] sm:max-w-[340px] md:max-w-[440px] mx-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search Projects"
            className="w-full h-9 pl-9 pr-4 bg-white/10 text-white placeholder-white/70 rounded-full focus:outline-none focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 text-sm transition-all border border-transparent focus:border-blue-300"
            disabled
          />
        </div>
      </div>

      {/* Right section: Utility Icons and Burger menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0">

        {/* 1. Messenger/Interactivity Hub Icon */}
        <div className="relative">
          <button 
            onClick={handleToggleMessenger}
            className={`w-9 h-9 text-white rounded-full flex items-center justify-center transition-all relative cursor-pointer ${isMessengerOpen ? 'bg-white/25 scale-95 shadow-inner' : 'bg-white/10 hover:bg-white/20'}`} 
            title="Messenger & Connect Options"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full font-bold shadow-sm">4</span>
          </button>

          {/* Social Links Dropdown */}
          <AnimatePresence>
            {isMessengerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-150 overflow-hidden z-50 text-gray-800"
              >
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Socials & Messages</span>
                  <span className="text-[10px] bg-blue-100 text-[#1877f2] px-2 py-0.5 rounded-full font-semibold">Active</span>
                </div>
                <div className="py-1.5 flex flex-col">
                  <a 
                    href={userGithub} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-sm font-semibold text-gray-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800">
                      <Github className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-grow flex flex-col">
                      <span>Follow on GitHub</span>
                      <span className="text-[10px] text-gray-400 font-normal">View repositories & contributions</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>

                  <a 
                    href={userLinkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-sm font-semibold text-gray-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0a66c2]">
                      <Linkedin className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-grow flex flex-col">
                      <span>Connect via LinkedIn</span>
                      <span className="text-[10px] text-gray-400 font-normal">Message professionally</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>

                  <a 
                    href={userFacebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-sm font-semibold text-gray-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50/70 flex items-center justify-center text-[#1877f2]">
                      <Facebook className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-grow flex flex-col">
                      <span>Follow on Facebook</span>
                      <span className="text-[10px] text-gray-400 font-normal">See personal creative posts</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>

                  <a 
                    href={userEmail}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-sm font-semibold text-gray-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-grow flex flex-col">
                      <span>Send Email Profile Inquiry</span>
                      <span className="text-[10px] text-gray-400 font-normal">Work proposals & chats</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Notifications/Visitor Counter Hub Icon */}
        <div className="relative">
          <button 
            onClick={handleToggleVisitor}
            className={`w-9 h-9 text-white rounded-full flex items-center justify-center transition-all relative cursor-pointer ${isVisitorPopupOpen ? 'bg-white/25 scale-95 shadow-inner' : 'bg-white/10 hover:bg-white/20'}`} 
            title="Notifications / Visitor Counter"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full font-bold shadow-sm">
              {visitorCount}
            </span>
          </button>

          {/* Visitor Counter Dropdown */}
          <AnimatePresence>
            {isVisitorPopupOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-150 overflow-hidden z-50 text-gray-800"
              >
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notifications</span>
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">New Visit</span>
                </div>
                <div className="p-4 flex flex-col gap-3.5">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-[#1877f2] relative">
                      <Award className="w-5 h-5 text-[#1877f2]" />
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-0.5 rounded-full border border-white text-xs">⭐</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-semibold leading-snug text-gray-800">
                        Thank you for dropping by to my portfolio! You are the <span className="text-[#1877f2] font-bold underline">{getOrdinalSuffix(visitorOrdinal)}</span> visitor so far.
                      </p>
                      <span className="text-[11px] text-gray-400 font-medium">Just now</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/30 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600">Live Visitor Counter</span>
                    </div>
                    <span className="text-lg font-black text-[#1877f2] bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-100">
                      #{visitorCount}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Burger / Menu Icon (Targeted: RIGHT MOST SIDE) */}
        <button 
          className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors relative cursor-pointer" 
          title="Sidebar Menu Trigger"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Greeting Modal Overlay */}
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowGreeting(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header colored banner */}
              <div className="h-28 bg-gradient-to-r from-[#1877f2] to-blue-600 relative flex items-end px-6 pb-4">
                {/* Sparkle icons for premium visual style */}
                <div className="absolute top-3 right-12 text-white/25">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="absolute top-8 left-12 text-white/20">
                  <Sparkles className="w-5 h-5" />
                </div>

                <button
                  onClick={() => setShowGreeting(false)}
                  className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-black/35 text-white/90 hover:text-white rounded-full transition-all cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar overlay */}
              <div className="absolute top-12 left-6">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Modal Body */}
              <div className="px-6 pt-14 pb-6 flex flex-col">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                    Hello! Welcome to my portfolio.
                  </h3>
                  <p className="text-sm font-semibold text-[#1877f2]">
                    My name is Melmar Jones Velasco.
                  </p>
                </div>

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-2.5 mb-5 border-y border-gray-100 py-3.5">
                  {userRole && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1877f2] rounded-full text-xs font-semibold">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{userRole}</span>
                    </div>
                  )}
                  {userLocation && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-amber-700 rounded-full text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{userLocation}</span>
                    </div>
                  )}
                </div>

                {/* Bio text section */}
                {userBio && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-150/60 leading-relaxed text-gray-700 text-sm font-medium relative italic">
                    <span className="text-2xl font-serif text-[#1877f2] absolute -top-1 left-2 opacity-15 select-none leading-none">“</span>
                    <p className="pl-4 pr-2">{userBio}</p>
                    <span className="text-2xl font-serif text-[#1877f2] absolute -bottom-5 right-3 opacity-15 select-none leading-none">”</span>
                  </div>
                )}

                {/* Bottom friendly closing button */}
                <button
                  type="button"
                  onClick={() => setShowGreeting(false)}
                  className="mt-6 w-full py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold text-sm rounded-lg shadow-md transition-colors"
                >
                  Nice to meet you!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
