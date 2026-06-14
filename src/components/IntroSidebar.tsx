import React, { useMemo } from 'react';
import { 
  Briefcase, MapPin, Globe, Heart, Clock, Github, 
  Linkedin, Facebook, Mail, Maximize2 
} from 'lucide-react';
import { UserProfile, Post } from '../types';

interface IntroSidebarProps {
  profile: UserProfile;
  posts: Post[];
  onPhotoClick?: (index: number, photos: string[]) => void;
  onSkillClick?: (skill: string) => void;
}

export default function IntroSidebar({ profile, posts, onPhotoClick, onSkillClick }: IntroSidebarProps) {
  // Extract all unique project images dynamically from standard posts/projects
  const projectPhotos = useMemo(() => {
    const images: string[] = [];
    posts.forEach(post => {
      // Collect multi-images format
      if (post.imageUrls && post.imageUrls.length > 0) {
        post.imageUrls.forEach(url => {
          if (url && typeof url === 'string' && url.trim() !== '') {
            images.push(url);
          }
        });
      } else if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim() !== '') {
        // Collect single fallback image
        images.push(post.imageUrl);
      }
    });

    // Clean unique array of real project files
    const unique = Array.from(new Set(images));

    // Fallbacks to keep the layout sturdy in case there's temporarily zero posts
    if (unique.length === 0) {
      return [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80"
      ];
    }
    return unique;
  }, [posts]);

  return (
    <div className="flex flex-col gap-4">
      {/* Box 1: Intro */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow" id="intro-card">
        <h3 className="text-xl font-bold font-sans text-gray-900 mb-2">Intro</h3>
        
        {/* Developer Mission Statement / Philosophy */}
        <div className="mb-4 pb-3 border-b border-gray-100 text-[13px] text-gray-600 font-sans leading-relaxed flex flex-col gap-2">
          <p>
            I enjoy turning ideas into real projects using modern web technologies while continuously expanding my knowledge through hands-on learning.
          </p>
          <div className="bg-blue-50/70 border border-blue-100 rounded p-2.5 text-xs text-blue-900 mt-1">
            <span className="font-semibold block mb-0.5">🧠 AI-Assisted Development:</span>
            I leverage AI as a development partner to accelerate learning, brainstorm solutions, debug code, and improve productivity.
          </div>
        </div>

        {/* Bio Details */}
        <div className="flex flex-col gap-3 text-[14px] text-gray-700">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-gray-500 shrink-0" />
            <span>
              {profile.role} at <strong className="text-gray-900">{profile.company}</strong>
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-500 shrink-0" />
            <span>
              Lives in <strong className="text-gray-900">{profile.location}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500 shrink-0" />
            <span>
              Portfolio URL: <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline">dev-fb-profile.app</a>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-gray-500 shrink-0" />
            <span>
              In a relationship with <strong className="text-gray-900">TypeScript</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500 shrink-0" />
            <span>
              Joined Github in <strong className="text-gray-900">May 2018</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Skills Tag List */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Core Tech Stack</h4>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill, index) => (
              <span 
                key={index} 
                onClick={() => onSkillClick?.(skill)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Links Widget */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded flex items-center justify-center gap-1.5 transition-colors"
          >
            <Github className="w-4 h-4 text-gray-700" />
            Follow on GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded flex items-center justify-center gap-1.5 transition-colors"
          >
            <Linkedin className="w-4 h-4 text-[#0077b5]" />
            Connect via LinkedIn
          </a>
          {profile.facebook && (
            <a
              href={profile.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Facebook className="w-4 h-4 text-[#1877f2]" />
              Follow on Facebook
            </a>
          )}
          {profile.email && (
            <a
              href={profile.email}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Mail className="w-4 h-4 text-red-500" />
              Send Email Profile Inquiry
            </a>
          )}
        </div>
      </div>

      {/* Box 2: Photos Grid (Sourced dynamically from real project portfolios) */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold font-sans text-gray-900 leading-tight">Photos</h3>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Project Screenshots</span>
          </div>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">
            {projectPhotos.length} Total
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded overflow-hidden">
          {projectPhotos.map((url, index) => (
            <div 
              key={index} 
              className="aspect-square bg-gray-150 hover:brightness-95 overflow-hidden cursor-pointer relative group"
              onClick={() => onPhotoClick?.(index, projectPhotos)}
            >
              <img 
                src={url} 
                alt={`Portfolio screenshot ${index + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
