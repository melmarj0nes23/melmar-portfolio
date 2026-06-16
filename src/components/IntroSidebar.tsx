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
  const [showAllPhotos, setShowAllPhotos] = React.useState(false);

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
    <div className="flex flex-col gap-4 lg:min-h-full lg:flex-1">
      {/* Box 1: Intro */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow" id="intro-card">
        <h3 className="text-xl font-bold font-sans text-gray-900 mb-2">About Me</h3>
        
        {/* Developer Mission Statement / Philosophy */}
        <div className="mb-4 pb-3 border-b border-gray-100 text-[13px] text-gray-600 font-sans leading-relaxed flex flex-col gap-2">
          <p>
            I enjoy turning ideas into real projects using modern web technologies while continuously expanding my knowledge through hands-on learning.
          </p>
          <div className="bg-indigo-50/70 border border-indigo-100 rounded p-2.5 text-xs text-indigo-900 mt-1">
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
              Portfolio URL: <a href="https://melmar-portfolio.pages.dev/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">melmar-portfolio.pages.dev</a>
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
              Joined Github in <strong className="text-gray-900">May 2025</strong>
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
              <Facebook className="w-4 h-4 text-[#4f46e5]" />
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

      {/* Box 1.5: Work Experience / Career Journey */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow" id="work-experience-card">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600 shrink-0 animate-[pulse_3s_infinite]" />
            <h3 className="text-base font-bold font-sans text-gray-900">Work Experience</h3>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Career Timeline
          </span>
        </div>

        {/* Professional Promotion track timeline */}
        <div className="relative pl-3.5 border-l-2 border-indigo-100 ml-1.5 flex flex-col gap-5">
          {[
            {
              role: "Freelance Web Developer & Digital Architect",
              company: "Self-Employed",
              period: "Jul 2024 - Present",
              desc: "• End-to-End Architecture: Conceptualize, wireframe, and design complete website layouts and user experiences (UX/UI) tailored to client specifications.\n• AI-Accelerated Development: Leverage advanced AI copilots and development tools for rapid code implementation, debugging, and content generation, significantly reducing project delivery timelines.\n• Content & Strategy: Oversee full content direction, structuring site copy and visual hierarchy to maximize user engagement and SEO performance."
            },
            {
              role: "Workforce Scheduler",
              company: "VXI Global Holdings, B. V. (PHILIPPINES)",
              period: "Dec 2022 - Jul 2024",
              desc: "Managed call volume forecasts, personnel rostering, and shift optimizations to ensure consistent SLA performance."
            },
            {
              role: "Workforce Real Time Analyst",
              company: "VXI Global Holdings, B. V. (PHILIPPINES)",
              period: "Oct 2018 - Dec 2022",
              desc: "Supervised live queues, audited agent states, managed service levels, and directed immediate intraday staffing adjustments."
            },
            {
              role: "Subject Matter Expert",
              company: "VXI Global Holdings, B. V. (PHILIPPINES)",
              period: "Jul 2018 - Oct 2018",
              desc: "Provided queue leadership, coached support agents on product details, and facilitated immediate escalation responses."
            },
            {
              role: "Customer Service Representative",
              company: "VXI Global Holdings, B. V. (PHILIPPINES)",
              period: "Apr 2017 - Jan 2018",
              desc: "Handled billing queries, addressed customer complaints, and sustained superior case quality resolution scores."
            },
            {
              role: "Technical Support Representative",
              company: "VXI Global Holdings, B. V. (PHILIPPINES)",
              period: "Apr 2015 - Apr 2017",
              desc: "Guided customers through structured technical diagnostics, internet connectivity, and network repair tasks."
            }
          ].map((exp, idx) => (
            <div key={idx} className="relative group">
              {/* Chronological Dot */}
              <div className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500 group-hover:bg-indigo-600 transition-colors" />
              
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  {exp.role}
                </span>
                <span className="text-[10px] text-indigo-700 font-extrabold tracking-wide mt-0.5">
                  {exp.company}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold mb-1 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                  {exp.period}
                </span>
                <p className="text-[11.5px] text-gray-600 leading-relaxed font-sans whitespace-pre-line select-text mt-1">
                  {exp.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Box 2: Photos Grid (Sourced dynamically from real project portfolios) */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow lg:sticky lg:top-[80px]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold font-sans text-gray-900 leading-tight">Photos</h3>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Project Screenshots</span>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">
            {projectPhotos.length} Total
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded overflow-hidden">
          {projectPhotos.map((url, index) => {
            const isHiddenOnMobile = !showAllPhotos && index >= 6;
            return (
              <div 
                key={index} 
                className={`aspect-square bg-gray-150 hover:brightness-95 overflow-hidden cursor-pointer relative group ${isHiddenOnMobile ? 'hidden lg:block' : ''}`}
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
            );
          })}
        </div>
        {projectPhotos.length > 6 && (
          <button 
            type="button" 
            onClick={() => setShowAllPhotos(!showAllPhotos)}
            className="w-full mt-2 py-1.5 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 bg-gray-50 border border-indigo-100 rounded transition-colors lg:hidden flex items-center justify-center gap-1 cursor-pointer"
          >
            {showAllPhotos ? 'Show Less' : `View All Photos (${projectPhotos.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
