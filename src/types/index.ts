import { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  image: string;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  last_message: string | null;
  last_message_sender_id: string | null;
  last_message_at: string | null;
  created_at: string;
  is_group?: boolean;
  group_name?: string | null;
  created_by?: string | null;
}

export interface GroupMember {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface GroupConversation extends Conversation {
  is_group: boolean;
  group_name: string | null;
  created_by: string | null;
}

export interface ConversationWithUser {
  id: string;
  isGroup?: boolean;
  groupName?: string | null;
  otherUserId?: string;
  otherUserName: string;
  otherUserImage: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export interface Message {
  id: string;
  conversation_id: string | null;
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
  loginUser: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  subscribeToUsers: () => () => void;
  setLoginUser: (user: User | null) => void;
  updateProfile: (id: string, name: string, bio: string) => Promise<void>;
}

export interface MessageStore {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  resolveConversation: (
    senderId: string,
    receiverId: string,
  ) => Promise<string | null>;
  fetchMessages: (currentUserId: string, otherUserId: string) => Promise<void>;
  sendMessage: (
    senderId: string,
    receiverId: string,
    text: string,
  ) => Promise<void>;
  updateMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  subscribeToMessages: (myId: string, otherId: string) => () => void;
}

export interface ChatListStore {
  conversations: ConversationWithUser[];
  isLoading: boolean;
  error: string | null;
  fetchConversations: (currentUserId: string) => Promise<void>;
  subscribeToConversations: (currentUserId: string) => () => void;
}

export interface GroupStore {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  createGroup: (name: string, memberIds: string[], creatorId: string) => Promise<string>;
  fetchGroupMembers: (conversationId: string) => Promise<User[]>;
  fetchGroupMessages: (conversationId: string) => Promise<void>;
  sendGroupMessage: (conversationId: string, senderId: string, text: string) => Promise<void>;
  updateMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  subscribeToGroupMessages: (conversationId: string) => () => void;
}
