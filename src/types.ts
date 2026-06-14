export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: any; // Firestore Timestamp
}

export interface Post {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageUrls?: string[];
  tags: string[];
  likesCount: number;
  likedBy: string[]; // List of visitor/session ids that liked this post
  createdAt: any; // Firestore Timestamp
}

export interface UserProfile {
  name: string;
  avatar: string; // url or placeholder
  coverPhoto: string; // url or placeholder
  bio: string;
  role: string;
  company: string;
  location: string;
  github: string;
  linkedin: string;
  facebook?: string;
  email?: string;
  skills: string[];
}
