import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { ChatListStore, ConversationWithUser, User } from "../types";

const useChatListStore = create<ChatListStore>((set, get) => ({
  conversations: [],
  isLoading: false,
  error: null,

  fetchConversations: async (currentUserId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Step 1: Fetch raw conversations
      const { data: convs, error: convError } = await supabase
        .from("Conversation")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convError) throw convError;

      if (!convs || convs.length === 0) {
        set({ conversations: [], isLoading: false });
        return;
      }

      const otherUserIds = convs.map((c) =>
        c.sender_id === currentUserId ? c.receiver_id : c.sender_id,
      );
      const uniqueIds = Array.from(new Set(otherUserIds));

      const { data: profiles, error: profileError } = await supabase
        .from("User")
        .select("id, name, image")
        .in("id", uniqueIds);

      if (profileError) throw profileError;

      const profileMap = (profiles || []).reduce((acc: any, p: User) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const enriched: ConversationWithUser[] = convs.map((row) => {
        const otherId =
          row.sender_id === currentUserId ? row.receiver_id : row.sender_id;
        const profile = profileMap[otherId];

        return {
          id: row.id,
          otherUserId: otherId,
          otherUserName: profile?.name ?? "Unknown User",
          otherUserImage: profile?.image ?? null,
          lastMessage: row.last_message ?? null,
          lastMessageAt: row.last_message_at ?? null,
        };
      });

      set({ conversations: enriched, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  subscribeToConversations: (currentUserId: string) => {
    const channel = supabase
      .channel(`chat-list-realtime:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Conversation",
        },
        () => {
          get().fetchConversations(currentUserId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

export default useChatListStore;
