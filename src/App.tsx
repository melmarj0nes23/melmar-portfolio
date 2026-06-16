import React, { useState, useEffect, useRef } from 'react';
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
import AIChatBot from './components/AIChatBot';
import IntroSidebar from './components/IntroSidebar';
import CreatePost from './components/CreatePost';
import PostCard from './components/PostCard';
import { Lock, Unlock, Key, ShieldCheck, X, ChevronLeft, ChevronRight, ArrowUp, Sparkles, Code2, Wifi, Battery, RotateCw, Laptop, Smartphone } from 'lucide-react';
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
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Smooth progress animation up to 98%
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (showSplash) {
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 98) {
            if (!isLoading) {
              return 100;
            }
            return 98;
          }
          const increment = Math.floor(Math.random() * 4) + 1;
          const nextVal = prev + increment;
          return nextVal > 98 ? 98 : nextVal;
        });
      }, 35);
    }
    return () => clearInterval(progressInterval);
  }, [showSplash, isLoading]);

  useEffect(() => {
    if (!isLoading && showSplash) {
      const finishTimer = setTimeout(() => {
        setLoadingProgress(100);
        const hideTimer = setTimeout(() => {
          setShowSplash(false);
        }, 500);
        return () => {
          clearTimeout(hideTimer);
        };
      }, 400);
      return () => {
        clearTimeout(finishTimer);
      };
    }
  }, [isLoading, showSplash]);

  const getSplashText = (progress: number) => {
    if (progress < 25) return 'Establishing connection to portfolio...';
    if (progress < 55) return 'Syncing newsfeed posts & project cards...';
    if (progress < 75) return 'Loading high-fidelity portfolio media...';
    if (progress < 98) return 'Aligning dynamic layout modules...';
    if (progress < 100) return 'Finalizing secure handshake...';
    return 'Ready! Welcome to the workspace.';
  };

  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [visitorOrdinal, setVisitorOrdinal] = useState<number>(1);
  const [activeLightbox, setActiveLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const [imageAspect, setImageAspect] = useState<'landscape' | 'portrait'>('landscape');
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  useEffect(() => {
    if (activeLightbox) {
      setImageLoading(true);
      const currentUrl = activeLightbox.urls[activeLightbox.index];
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
  }, [activeLightbox?.index, activeLightbox?.urls]);

  // Mobile Floating Scroll to Top State & Effect
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Swipe and zoom states for mobile activeLightbox modal
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

  const handleTouchEnd = (urlsLength: number) => {
    setPinchStartDist(null);
    setDragStart(null);

    if (zoomScale > 1) return;

    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> next image
      setActiveLightbox(prev => {
        if (!prev) return null;
        setZoomScale(1);
        setZoomOffset({ x: 0, y: 0 });
        return {
          ...prev,
          index: prev.index === prev.urls.length - 1 ? 0 : prev.index + 1
        };
      });
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> previous image
      setActiveLightbox(prev => {
        if (!prev) return null;
        setZoomScale(1);
        setZoomOffset({ x: 0, y: 0 });
        return {
          ...prev,
          index: prev.index === 0 ? prev.urls.length - 1 : prev.index - 1
        };
      });
    }
  };

  // Database cleanup to remove previously seeded/fake data and make sure they never return
  useEffect(() => {
    const runCleanup = async () => {
      try {
        const projects = ['project-1', 'project-2', 'project-3'];
        for (const pid of projects) {
          const postRef = doc(db, 'posts', pid);
          await deleteDoc(postRef).catch(() => {});

          // Delete pre-seeded comments
          const idxs = [0, 1];
          for (const idx of idxs) {
            const commentRef = doc(db, 'posts', pid, 'comments', `seed-${pid}-${idx}`);
            await deleteDoc(commentRef).catch(() => {});
          }
        }
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

  // Keep latest profile in a ref to avoid stale closures in real-time callbacks
  const profileRefValue = useRef(profile);
  useEffect(() => {
    profileRefValue.current = profile;
  }, [profile]);

  // Real-time synchronization of the developer's profile from Firestore
  useEffect(() => {
    const profileRef = doc(db, 'profiles', 'melmar');
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const current = profileRefValue.current;
      if (snapshot.exists()) {
        const data = snapshot.data();
        const updatedProfile: UserProfile = {
          name: data.name || current.name || 'Melmar Jones Velasco',
          role: data.role || current.role || 'Aspiring Full-Stack Developer',
          company: data.company || current.company || 'Hands-On Learning & AI Innovation',
          location: data.location || current.location || 'Alcala, Pangasinan, PH',
          bio: data.bio || current.bio || 'Aspiring full stack developer passionate about building clean, functional, and user-friendly web apps using AI as a fast development partner.',
          avatar: data.avatar || current.avatar || '/profile/melmar.jpg',
          coverPhoto: data.coverPhoto || current.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          github: data.github || current.github || 'https://github.com/melmarj0nes23',
          linkedin: data.linkedin || current.linkedin || 'https://ph.linkedin.com/in/melmar-jones-velasco-5b795a340',
          facebook: data.facebook || current.facebook || 'https://facebook.com/melmarj0nes23',
          email: data.email || current.email || 'mailto:melmarjvelasco@gmail.com',
          skills: data.skills || current.skills || ['React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Node.js', 'PostgreSQL', 'Vite', 'Python', 'AI Prompting']
        };
        setProfile(updatedProfile);
        localStorage.setItem('fb_portfolio_profile', JSON.stringify(updatedProfile));
      } else {
        // Seed default profile to Firestore if not present yet, referencing existing local metadata
        const defaultProfile = {
          name: current.name || 'Melmar Jones Velasco',
          role: current.role || 'Aspiring Full-Stack Developer',
          company: current.company || 'Hands-On Learning & AI Innovation',
          location: current.location || 'Alcala, Pangasinan, PH',
          bio: current.bio || 'Aspiring full stack developer passionate about building clean, functional, and user-friendly web apps using AI as a fast development partner.',
          avatar: current.avatar || '/profile/melmar.jpg',
          coverPhoto: current.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          github: current.github || 'https://github.com/melmarj0nes23',
          linkedin: current.linkedin || 'https://ph.linkedin.com/in/melmar-jones-velasco-5b795a340',
          facebook: current.facebook || 'https://facebook.com/melmarj0nes23',
          email: current.email || 'mailto:melmarjvelasco@gmail.com',
          skills: current.skills || ['React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Node.js', 'PostgreSQL', 'Vite', 'Python', 'AI Prompting']
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
        setPosts([]);
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

  // Seeding initial portfolio content has been completely disabled to remove fake placeholders

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
      // Prioritize preventing re-seed before delete starts so the snapshot action is blocked from re-seeding
      localStorage.setItem('fb_portfolio_seeded', 'true');
      await setDoc(doc(db, 'profiles', 'melmar'), { seeded: true }, { merge: true }).catch(() => {});
      
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
    <div className="min-h-screen bg-[#f4f6fa] pb-10 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Premium Elegant Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="premium-splash-screen"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              y: -40,
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="fixed inset-0 bg-[#070913] z-[999999] flex flex-col items-center justify-center overflow-hidden font-sans select-none"
          >
            {/* Ambient Background Radial Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.18)_0%,transparent_65%)] pointer-events-none" />
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center justify-center max-w-md w-full px-6 text-center z-10">
              
              {/* Premium Logo Frame */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative mb-6"
              >
                {/* Dual glowing halo rings */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 blur-xl animate-pulse" />
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 opacity-30 animate-[spin_8s_linear_infinite]" />
                
                {/* Brand Badge */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Code2 className="w-8 h-8 sm:w-10 sm:h-10 text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-violet-400" />
                  <motion.div 
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-1 sm:gap-2"
              >
                <h1 className="text-xl sm:text-2xl font-bold tracking-[0.2em] uppercase text-white bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/70 font-sans">
                  Melmar Jones Velasco
                </h1>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-[0.3em] font-sans">
                  Aspiring Full-Stack Developer
                </p>
              </motion.div>

              {/* Loading Meter Console */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="w-full mt-12 bg-slate-900/60 border border-white/5 rounded-xl p-4 backdrop-blur-md"
              >
                {/* Progress Value Counter */}
                <div className="flex justify-between items-center mb-2.5 font-mono text-[11px]">
                  <span className="text-indigo-400 font-semibold uppercase tracking-wider">
                    {loadingProgress === 100 ? 'System Armed' : 'Booting Applet'}
                  </span>
                  <span className="text-white/60 font-medium">
                    {loadingProgress}%
                  </span>
                </div>

                {/* Progress Track */}
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]" 
                    style={{ width: `${loadingProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>

                {/* Micro Cues & Literal Logging Messages */}
                <div className="mt-3 text-left">
                  <p className="text-[10px] text-slate-400 h-4 font-mono select-none overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="text-indigo-500 mr-1.5">&gt;</span>
                    {getSplashText(loadingProgress)}
                  </p>
                </div>
              </motion.div>

              {/* Status footer credits (Clean and understated) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="absolute bottom-6 left-4 right-4 text-[10px] font-mono text-slate-500 tracking-wider font-medium uppercase"
              >
                Hands-On Learning &bull; Alcala, PH
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        posts={posts}
      />

      {/* Main Container */}
      <main className="pt-4 px-2 sm:px-4 max-w-6xl mx-auto flex flex-col gap-4 font-sans">
        
        {/* Profile Head */}
        <ProfileHeader
          profile={profile}
          isOwner={isOwnerMode}
          onUpdateBio={handleUpdateBio}
          onUpdateName={handleUpdateName}
          onUpdateAvatar={handleUpdateAvatar}
          onUpdateCoverPhoto={handleUpdateCoverPhoto}
          onOpenAIChat={() => window.dispatchEvent(new Event('open-ai-chat'))}
        />

        {/* Owner Verification Console - Hidden by default, toggled via Node.js badge or shown active */}
        {(isOwnerMode || showPasscodeForm) && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-6xl mx-auto w-full shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOwnerMode ? 'bg-[#4f46e5] animate-pulse' : 'bg-gray-400'}`}></span>
              <span className="text-gray-700 text-xs font-semibold uppercase tracking-wider">
                {isOwnerMode ? (
                  <span className="flex items-center gap-1.5 text-indigo-700 font-bold font-sans">
                    <ShieldCheck className="w-4 h-4 text-[#4f46e5]" /> Melmar Mode Active (Owner Account)
                  </span>
                ) : (
                  <span className="text-[12px] font-sans font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60 inline-flex items-center gap-1">
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
                      className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-700 focus:outline-[#4f46e5] flex-grow sm:w-44"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#4f46e5] hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow transition-colors whitespace-nowrap cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-6xl w-full mx-auto">
          
          {/* Left Column: Intro Sidebar (Span 4) */}
          <div className="col-span-1 md:col-span-12 lg:col-span-4 flex flex-col gap-4 lg:min-h-full">
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

          {/* Right Column: Newsfeed/Timeline (Span 8) */}
          <div className="col-span-1 md:col-span-12 lg:col-span-8 flex flex-col animate-[fadeIn_0.5s_ease-out]">
            


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
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
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

      {/* Visual Footer with Back to Top button */}
      <footer className="w-full bg-gray-100 border-t border-gray-200 py-8 px-4 mt-12 text-center text-xs text-gray-500 font-sans select-none flex flex-col items-center gap-2" id="portfolio-footer">
        <p className="font-semibold text-gray-650">Melmar Jones Velasco &copy; {new Date().getFullYear()}</p>
        <button
          onClick={scrollToTop}
          className="mt-2.5 flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-gray-50 border border-gray-250 text-gray-700 font-bold text-xs rounded-full transition-all active:scale-95 shadow-sm cursor-pointer hover:shadow"
          title="Return to the top of the page"
        >
          <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          Back to Top
        </button>
      </footer>

      {/* Dynamic Photo Lightbox Modal rendered at root level to prevent stacking context overlaps */}
      <AnimatePresence>
        {activeLightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center select-none"
            onClick={() => {
              setActiveLightbox(null);
              setZoomScale(1);
              setZoomOffset({ x: 0, y: 0 });
            }}
          >
            <div 
              className="relative w-full h-full max-w-[96vw] max-h-[94vh] flex flex-col items-center justify-center px-2 sm:px-4 overflow-hidden" 
              onClick={e => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(activeLightbox.urls.length)}
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
                    <div className="flex-1 max-w-md bg-slate-900 border border-white/10 rounded-lg h-7 px-2 sm:px-3 flex items-center justify-between text-slate-400 text-[10px] sm:text-[11px] font-mono select-none overflow-hidden mx-1.5 sm:mx-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-slate-500 min-w-0 overflow-hidden whitespace-nowrap">
                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500 stroke-[2.5] shrink-0" />
                        <span className="text-slate-300 tracking-wide font-medium truncate">melmar-portfolio.pages.dev</span>
                        <span className="text-slate-600 font-sans shrink-0">/</span>
                        <span className="text-slate-400 font-sans tracking-tight shrink-0">projects</span>
                      </div>
                      <RotateCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors shrink-0 ml-1.5" />
                    </div>

                    {/* Window Controls Right */}
                    <div className="flex items-center justify-end gap-3 w-1/4">
                      <Laptop className="w-4 h-4 text-indigo-400" />
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-650" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-650" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-650" />
                      </div>
                    </div>
                  </div>

                  {/* Canvas Body */}
                  <div className="relative p-2 bg-slate-900/65 flex items-center justify-center overflow-hidden max-h-[82vh]">
                    <img 
                      src={activeLightbox.urls[activeLightbox.index]} 
                      alt={`Screenshot projection ${activeLightbox.index + 1}`}
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
                  <div className="h-8 px-4 sm:px-5 flex items-center justify-between text-white/95 select-none text-[10px] font-semibold relative z-20 shrink-0">
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
                      src={activeLightbox.urls[activeLightbox.index]} 
                      alt={`Screenshot projection ${activeLightbox.index + 1}`}
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
                  setActiveLightbox(null);
                  setZoomScale(1);
                  setZoomOffset({ x: 0, y: 0 });
                }}
                className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/80 border border-white/10 text-white rounded-full transition-all cursor-pointer z-50 hover:scale-105 active:scale-95"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation Left */}
              {activeLightbox.urls.length > 1 && (
                <button
                  onClick={() => {
                    setZoomScale(1);
                    setZoomOffset({ x: 0, y: 0 });
                    setActiveLightbox(prev => prev ? {
                      ...prev,
                      index: prev.index === 0 ? prev.urls.length - 1 : prev.index - 1
                    } : null);
                  }}
                  className="hidden sm:flex absolute left-4 p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/5 backdrop-blur-sm cursor-pointer z-50 items-center justify-center"
                  title="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Navigation Right */}
              {activeLightbox.urls.length > 1 && (
                <button
                  onClick={() => {
                    setZoomScale(1);
                    setZoomOffset({ x: 0, y: 0 });
                    setActiveLightbox(prev => prev ? {
                      ...prev,
                      index: prev.index === prev.urls.length - 1 ? 0 : prev.index + 1
                    } : null);
                  }}
                  className="hidden sm:flex absolute right-4 p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/5 backdrop-blur-sm cursor-pointer z-50 items-center justify-center"
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

      {/* Modern AI ChatBot Widget */}
      <AIChatBot profile={profile} posts={posts} />
    </div>
  );
}
