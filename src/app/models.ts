export interface UserProfile {
  id: string;
  name: string;
  email: string;
  favoriteGame: string;
  bio: string;
  avatar: string;
}

export interface ReviewItem {
  id: string;
  game: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  author: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: string;
  content: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  title: string;
  type: 'personal' | 'group';
  members: string[];
}
