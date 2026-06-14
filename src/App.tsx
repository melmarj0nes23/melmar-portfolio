import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Post, Comment, UserProfile } from './types';
import Header from './components/Header';
import ProfileHeader from './components/ProfileHeader';
import IntroSidebar from './components/IntroSidebar';
import CreatePost from './components/CreatePost';
import PostCard from './components/PostCard';
import { Lock, Unlock, Key, ShieldCheck, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Enums and Interfaces required by Firebase Integration Skill for Error Diagnostics
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error Captured:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  // Visitor identity
  const [viewerId, setViewerId] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('Guest Developer');

  // User Developer Profile Settings (can be saved to localStorage)
  const [profile, setProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem('fb_portfolio_profile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Force upgrade the old default unsplash avatar to the user's uploaded melmar.jpg
        if (parsed.avatar && (parsed.avatar.includes('images.unsplash.com') || parsed.avatar.includes('photo-1519085360753'))) {
          parsed.avatar = '/profile/melmar.jpg';
          localStorage.setItem('fb_portfolio_profile', JSON.stringify(parsed));
        }
        return parsed;
      } catch {
        // use default
      }
    }
    return {
      name: 'Melmar Jones Velasco',
      role: 'Aspiring Full-Stack Developer',
      company: 'Hands-On Learning & AI Innovation',
      location: 'Alcala, Pangasinan, PH',
      bio: 'Aspiring full stack developer passionate about building clean, functional, and user-friendly web apps using AI as a fast development partner.',
      avatar: '/profile/melmar.jpg',
      coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      github: 'https://github.com/melmarj0nes23',
      linkedin: 'https://ph.linkedin.com/in/melmar-jones-velasco-5b795a340',
      facebook: 'https://facebook.com/melmarj0nes23',
      email: 'mailto:melmarjvelasco@gmail.com',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Node.js', 'PostgreSQL', 'Vite', 'Python', 'AI Prompting']
    };
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [visitorOrdinal, setVisitorOrdinal] = useState<number>(1);
  const [activeLightbox, setActiveLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  // Database cleanup to remove previously seeded/fake data
  useEffect(() => {
    const runCleanup = async () => {
      const alreadyCleaned = localStorage.getItem('fb_portfolio_cleaned_v3');
      if (alreadyCleaned === 'true') return;

      try {
        const projects = ['project-1', 'project-2', 'project-3'];
        for (const pid of projects) {
          const postRef = doc(db, 'posts', pid);
          await updateDoc(postRef, {
            likesCount: 0,
            likedBy: []
          }).catch(() => {});

          // Delete pre-seeded comments
          const idxs = [0, 1];
          for (const idx of idxs) {
            const commentRef = doc(db, 'posts', pid, 'comments', `seed-${pid}-${idx}`);
            await deleteDoc(commentRef).catch(() => {});
          }
        }
        localStorage.setItem('fb_portfolio_cleaned_v3', 'true');
      } catch (err) {
        console.warn("Cleanup warning: ", err);
      }
    };

    runCleanup();
  }, []);

  // Initialize identity and mock data watcher
  useEffect(() => {
    // Unique guest visitor key
    let vid = localStorage.getItem('fb_portfolio_viewer_id');
    if (!vid) {
      vid = 'visitor_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('fb_portfolio_viewer_id', vid);
    }
    setViewerId(vid);

    // Guest commenter nickname
    const cachedName = localStorage.getItem('fb_portfolio_guest_name');
    if (cachedName) {
      setGuestName(cachedName);
    } else {
      const names = ['CreativeCoder', 'CloudExplorer', 'GitMaster', 'CyberArchitect', 'StackSurfer', 'PixelArtisan'];
      const randomNick = names[Math.floor(Math.random() * names.length)] + '#' + Math.floor(100 + Math.random() * 900);
      setGuestName(randomNick);
      localStorage.setItem('fb_portfolio_guest_name', randomNick);
    }
  }, []);

  // Sync visitor profiles & count dynamically
  useEffect(() => {
    if (!viewerId) return;

    const visitorsRef = collection(db, 'visitors');
    const q = query(visitorsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let isIdRecorded = false;
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].id === viewerId) {
          isIdRecorded = true;
          setVisitorOrdinal(i + 1);
          break;
        }
      }

      setVisitorCount(snapshot.size || 1);

      if (!isIdRecorded) {
        try {
          const newVisitorRef = doc(db, 'visitors', viewerId);
          await setDoc(newVisitorRef, {
            name: guestName,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Error registering visitor profile snapshot:", err);
        }
      }
    }, (error) => {
      console.warn("Visitors listener snapshot caught restriction or offline:", error);
    });

    return () => unsubscribe();
  }, [viewerId, guestName]);

  // Owner mode state (Melmar admin access)
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(() => {
    return localStorage.getItem('fb_portfolio_owner_mode') === 'true';
  });
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [showPasscodeForm, setShowPasscodeForm] = useState<boolean>(false);

  // Real-time synchronization of the developer's profile from Firestore
  useEffect(() => {
    const profileRef = doc(db, 'profiles', 'melmar');
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const updatedProfile: UserProfile = {
          name: data.name || 'Melmar Jones Velasco',
          role: data.role || 'Aspiring Full-Stack Developer',
          company: data.company || 'Hands-On Learning & AI Innovation',
          location: data.location || 'Alcala, Pangasinan, PH',
          bio: data.bio || 'Aspiring full stack developer passionate about building clean, functional, and user-friendly web apps using AI as a fast development partner.',
          avatar: data.avatar || '/profile/melmar.jpg',
          coverPhoto: data.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          github: data.github || 'https://github.com/melmarj0nes23',
          linkedin: data.linkedin || 'https://ph.linkedin.com/in/melmar-jones-velasco-5b795a340',
          facebook: data.facebook || 'https://facebook.com/melmarj0nes23',
          email: data.email || 'mailto:melmarjvelasco@gmail.com',
          skills: data.skills || ['React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Node.js', 'PostgreSQL', 'Vite', 'Python', 'AI Prompting']
        };
        setProfile(updatedProfile);
        localStorage.setItem('fb_portfolio_profile', JSON.stringify(updatedProfile));
      } else {
        // Seed default profile to Firestore if not present yet
        const defaultProfile = {
          name: 'Melmar Jones Velasco',
          role: 'Aspiring Full-Stack Developer',
          company: 'Hands-On Learning & AI Innovation',
          location: 'Alcala, Pangasinan, PH',
          bio: 'Aspiring full stack developer passionate about building clean, functional, and user-friendly web apps using AI as a fast development partner.',
          avatar: '/profile/melmar.jpg',
          coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          github: 'https://github.com/melmarj0nes23',
          linkedin: 'https://ph.linkedin.com/in/melmar-jones-velasco-5b795a340',
          facebook: 'https://facebook.com/melmarj0nes23',
          email: 'mailto:melmarjvelasco@gmail.com',
          skills: ['React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Node.js', 'PostgreSQL', 'Vite', 'Python', 'AI Prompting']
        };
        setDoc(profileRef, defaultProfile).catch((err) => {
          console.warn("Could not seed default profile to Firestore:", err);
        });
      }
    }, (error) => {
      console.warn("Warning fetching profile snapshot from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  // Sync profile details across all devices using Firestore
  const handleUpdateBio = async (newBio: string) => {
    const updated = { ...profile, bio: newBio };
    setProfile(updated);
    localStorage.setItem('fb_portfolio_profile', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'profiles', 'melmar'), { bio: newBio }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'profiles/melmar');
    }
  };

  const handleUpdateName = async (newName: string) => {
    const updated = { ...profile, name: newName };
    setProfile(updated);
    localStorage.setItem('fb_portfolio_profile', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'profiles', 'melmar'), { name: newName }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'profiles/melmar');
    }
  };

  const handleUpdateAvatar = async (newAvatar: string) => {
    const updated = { ...profile, avatar: newAvatar };
    setProfile(updated);
    localStorage.setItem('fb_portfolio_profile', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'profiles', 'melmar'), { avatar: newAvatar }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'profiles/melmar');
    }
  };

  const handleUpdateCoverPhoto = async (newCover: string) => {
    const updated = { ...profile, coverPhoto: newCover };
    setProfile(updated);
    localStorage.setItem('fb_portfolio_profile', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'profiles', 'melmar'), { coverPhoto: newCover }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'profiles/melmar');
    }
  };

  // Main Posts Synchronization subscription
  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial 3 mock posts dynamically to satisfy target specs
        setIsLoading(true);
        try {
          await seedInitialMockData();
        } catch (err) {
          console.error("Seeding error:", err);
        }
        setIsLoading(false);
        return;
      }

      const loadedPosts: Post[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Post));

      setPosts(loadedPosts);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Nested comments listener per post
  useEffect(() => {
    if (posts.length === 0) return;

    const unsubs = posts.map(post => {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'));

      return onSnapshot(commentsQuery, (snapshot) => {
        const loadedComments: Comment[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Comment));

        setCommentsMap(prev => ({
          ...prev,
          [post.id]: loadedComments
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `posts/${post.id}/comments`);
      });
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [posts]);

  // Seeding initial portfolio content
  const seedInitialMockData = async () => {
    const mockPosts = [
      {
        id: 'project-1',
        title: 'DevForge Social — Open Source Dev Hub',
        description: 'Super excited to present my latest main project! DevForge Social is a high-fidelity collaboration hub built for open-source teams. Featuring dynamic commit feeds, visual progress bento-grids, and interactive task assignment pipelines, it matches active agile pipelines into a single beautiful feed.\n\nBackend scale configured with Redis caching and isolated SSE socket pools.',
        tags: ['React', 'TypeScript', 'Node.js', 'Redis', 'WebSockets'],
        likesCount: 0,
        likedBy: [],
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
        createdAt: serverTimestamp()
      },
      {
        id: 'project-2',
        title: 'NebulaDB — Low Latency Edge Data Engine',
        description: 'NebulaDB is a relational transactional cache engine optimized for resource-limited IoT nodes. Written with safety in Rust and compiled to WebAssembly, it can run directly within sandboxed workers or edge regions.\n\nSuccessfully clocked 450k upsert transactions per second under virtual thread loads.',
        tags: ['Rust', 'WebAssembly', 'EdgeComputing', 'IoT'],
        likesCount: 0,
        likedBy: [],
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80',
        createdAt: serverTimestamp()
      },
      {
        id: 'project-3',
        title: 'AuraSound — Aesthetic AI Ambient Wave Generator',
        description: 'Creating a highly polished frontend for focus. AuraSound hooks directly into ambient mood sensors to generate infinite non-repetitive synthesizer sounds matching your active background task. Utilizing React Motion loops, Web Audio APIs, and Gemini neural text analysis to curate appropriate visual theme decks.',
        tags: ['NextJS', 'TailwindCSS', 'WebAudio', 'Gemini'],
        likesCount: 0,
        likedBy: [],
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
        createdAt: serverTimestamp()
      }
    ];

    for (const mock of mockPosts) {
      const { id, ...postData } = mock;
      const docRef = doc(db, 'posts', id);
      await setDoc(docRef, postData);
    }
  };

  // Add a new project post
  const handleAddPost = async (title: string, description: string, tags: string[], imageUrl?: string, imageUrls?: string[]) => {
    const postsRef = collection(db, 'posts');
    const randomId = 'post_' + Math.random().toString(36).substring(2, 11);
    const newDocRef = doc(postsRef, randomId);

    const postPayload = {
      title,
      description,
      tags,
      likesCount: 0,
      likedBy: [],
      imageUrl: imageUrl || null,
      imageUrls: imageUrls || [],
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(newDocRef, postPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${randomId}`);
    }
  };

  // Like Toggle Handler
  const handleLike = async (postId: string) => {
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likedBy.includes(viewerId);
    const newLikedBy = isLiked
      ? post.likedBy.filter(id => id !== viewerId)
      : [...post.likedBy, viewerId];
    
    const newLikesCount = isLiked
      ? Math.max(0, post.likesCount - 1)
      : post.likesCount + 1;

    try {
      await updateDoc(postRef, {
        likedBy: newLikedBy,
        likesCount: newLikesCount
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  // Add Comment Handler
  const handleAddComment = async (postId: string, text: string, authorName?: string) => {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const randomId = 'comment_' + Math.random().toString(36).substring(2, 11);
    const commentRef = doc(commentsRef, randomId);

    const commentPayload = {
      author: authorName || 'Visitor',
      text,
      createdAt: serverTimestamp()
    };

    try {
      setIsSubmittingComment(true);
      await setDoc(commentRef, commentPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${postId}/comments/${randomId}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete a post
  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}/comments/${commentId}`);
    }
  };

  // Edit a post
  const handleEditPost = async (postId: string, title: string, description: string, tags: string[], imageUrl?: string, imageUrls?: string[]) => {
    const postRef = doc(db, 'posts', postId);
    try {
      await updateDoc(postRef, {
        title,
        description,
        tags,
        imageUrl: imageUrl || null,
        imageUrls: imageUrls || []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-10 selection:bg-blue-100 selection:text-blue-900">
      {/* Header bar */}
      <Header 
        userName={profile.name} 
        userAvatar={profile.avatar} 
        userBio={profile.bio}
        userRole={profile.role}
        userLocation={profile.location}
        userGithub={profile.github}
        userLinkedin={profile.linkedin}
        userFacebook={profile.facebook}
        userEmail={profile.email}
        visitorCount={visitorCount}
        visitorOrdinal={visitorOrdinal}
      />

      {/* Main Container */}
      <main className="pt-4 px-2 sm:px-4 max-w-5xl mx-auto flex flex-col gap-4 font-sans">
        
        {/* Profile Head */}
        <ProfileHeader
          profile={profile}
          isOwner={isOwnerMode}
          onUpdateBio={handleUpdateBio}
          onUpdateName={handleUpdateName}
          onUpdateAvatar={handleUpdateAvatar}
          onUpdateCoverPhoto={handleUpdateCoverPhoto}
        />

        {/* Owner Verification Console - Hidden by default, toggled via Node.js badge or shown active */}
        {(isOwnerMode || showPasscodeForm) && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-5xl mx-auto w-full shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOwnerMode ? 'bg-[#1877f2] animate-pulse' : 'bg-gray-400'}`}></span>
              <span className="text-gray-700 text-xs font-semibold uppercase tracking-wider">
                {isOwnerMode ? (
                  <span className="flex items-center gap-1.5 text-blue-700 font-bold font-sans">
                    <ShieldCheck className="w-4 h-4 text-[#1877f2]" /> Melmar Mode Active (Owner Account)
                  </span>
                ) : (
                  <span className="text-[12px] font-sans font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
                    Passcode Verification Required
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto sm:justify-end">
              {isOwnerMode ? (
                <div className="flex items-center gap-3 w-full justify-between sm:justify-end">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-150 font-bold flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5 text-green-600" /> Fully Authorized
                  </span>
                  <button
                    onClick={() => {
                      setIsOwnerMode(false);
                      localStorage.setItem('fb_portfolio_owner_mode', 'false');
                    }}
                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-xs font-semibold transition-all whitespace-nowrap"
                  >
                    Log Out Owner
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  {passcodeError && (
                    <span className="text-red-500 text-xs font-medium animate-pulse" id="passcode-error">
                      {passcodeError}
                    </span>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setPasscodeError(null);
                      const form = e.currentTarget;
                      const input = form.elements.namedItem('ownerPasscode') as HTMLInputElement;
                      const val = input.value;
                      if (!val) return;

                      let isValid = false;
                      const customPasscode = (import.meta as any).env?.VITE_OWNER_PASSCODE;

                      if (customPasscode) {
                        isValid = (val === customPasscode);
                      } else {
                        try {
                          const msgBuffer = new TextEncoder().encode(val);
                          const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                          const hashArray = Array.from(new Uint8Array(hashBuffer));
                          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                          // Matches 'A@11111a' anonymously
                          isValid = (hashHex === '81575fd9e7be6a8cfc797b84c72c19889164b80aae49426824e5829f5f598174');
                        } catch (err) {
                          // Standard fallback
                          isValid = false;
                        }
                      }

                      if (isValid) {
                        setIsOwnerMode(true);
                        localStorage.setItem('fb_portfolio_owner_mode', 'true');
                        setShowPasscodeForm(false);
                        input.value = '';
                      } else {
                        setPasscodeError('Invalid passcode!');
                      }
                    }}
                    className="flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    <Key className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                      name="ownerPasscode"
                      type="password"
                      id="passcode-input"
                      placeholder="Owner's passcode"
                      onChange={() => setPasscodeError(null)}
                      className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-700 focus:outline-[#1877f2] flex-grow sm:w-44"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded text-xs font-semibold shadow transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Verify Owner
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Two-Column Workspace Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-5xl w-full mx-auto">
          
          {/* Left Column: Intro Sidebar (Span 5) - Pinned Sticky on desktop only */}
          <div className="col-span-1 md:col-span-12 lg:col-span-5 lg:sticky lg:top-[72px] h-fit flex flex-col gap-4">
            <IntroSidebar 
              profile={profile} 
              posts={posts} 
              onPhotoClick={(index, photos) => setActiveLightbox({ urls: photos, index })}
              onSkillClick={(skill) => {
                if (skill === 'Node.js') {
                  setShowPasscodeForm(prev => !prev);
                }
              }}
            />
          </div>

          {/* Right Column: Newsfeed/Timeline (Span 7) */}
          <div className="col-span-1 md:col-span-12 lg:col-span-7 flex flex-col animate-[fadeIn_0.5s_ease-out]">
            


            {/* Conditional Composer / Create Post Card: Authorized Melmar Mode only */}
            {isOwnerMode && (
              <CreatePost
                userAvatar={profile.avatar}
                userName={profile.name}
                onAddPost={handleAddPost}
              />
            )}

            {/* Timeline Feed Stream */}
            <div className="flex flex-col">

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-[#1877f2] rounded-full animate-spin"></div>
                  <span className="text-gray-500 text-sm font-semibold">Synchronizing profile timeline...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-lg p-10 border text-center font-sans text-gray-500">
                  <p>No project posts exist. Be the first to add one above!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    comments={commentsMap[post.id] || []}
                    isSubmittingComment={isSubmittingComment}
                    onLike={handleLike}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    viewerId={viewerId}
                    developerName={profile.name}
                    developerAvatar={profile.avatar}
                    isOwner={isOwnerMode}
                    onDeletePost={handleDeletePost}
                    onEditPost={handleEditPost}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic Photo Lightbox Modal rendered at root level to prevent stacking context overlaps */}
      <AnimatePresence>
        {activeLightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center select-none"
            onClick={() => setActiveLightbox(null)}
          >
            <div className="relative w-full h-full max-w-4xl max-h-[85vh] flex items-center justify-center px-4" onClick={e => e.stopPropagation()}>
              <img 
                src={activeLightbox.urls[activeLightbox.index]} 
                alt={`Screenshot projection ${activeLightbox.index + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/5"
                referrerPolicy="no-referrer"
              />

              {/* Close Button */}
              <button
                onClick={() => setActiveLightbox(null)}
                className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/80 border border-white/10 text-white rounded-full transition-all cursor-pointer z-50 hover:scale-105 active:scale-95"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation Left */}
              {activeLightbox.urls.length > 1 && (
                <button
                  onClick={() => setActiveLightbox(prev => prev ? {
                    ...prev,
                    index: prev.index === 0 ? prev.urls.length - 1 : prev.index - 1
                  } : null)}
                  className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/5 backdrop-blur-sm cursor-pointer z-50"
                  title="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Navigation Right */}
              {activeLightbox.urls.length > 1 && (
                <button
                  onClick={() => setActiveLightbox(prev => prev ? {
                    ...prev,
                    index: prev.index === prev.urls.length - 1 ? 0 : prev.index + 1
                  } : null)}
                  className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/5 backdrop-blur-sm cursor-pointer z-50"
                  title="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Counter Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 border border-white/10 rounded-full text-xs font-semibold text-white/95 backdrop-blur-md">
                Project Image {activeLightbox.index + 1} of {activeLightbox.urls.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
