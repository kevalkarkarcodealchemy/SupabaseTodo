import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  image: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface AuthState {
  user: SupabaseUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  access_token: string;
  setLoading: (isLoading: boolean) => void;
  setLogin: (isLoggedIn: boolean) => void;
  setAccessToken: (access_token: string) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  googleLogin: () => Promise<any>;
  signup: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
}

export interface UserStore {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  subscribeToUsers: () => () => void;
}

export interface MessageStore {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  fetchMessages: (currentUserId: string, otherUserId: string) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string, text: string) => Promise<void>;
  subscribeToMessages: (currentUserId: string, otherUserId: string) => () => void;
}
