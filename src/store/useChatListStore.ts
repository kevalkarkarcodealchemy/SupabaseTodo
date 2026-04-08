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
      // Fetch group memberships
      const { data: groupMembers, error: gmError } = await supabase
        .from("groupmembers")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      const groupIds = (groupMembers || []).map(gm => gm.conversation_id);
      let orQuery = `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`;
      
      if (groupIds.length > 0) {
        const inFilter = groupIds.map(id => `"${id}"`).join(',');
        orQuery += `,id.in.(${inFilter})`;
      }

      // Fetch conversations (both 1-to-1 and groups)
      const { data: convs, error: convError } = await supabase
        .from("Conversation")
        .select("*")
        .or(orQuery)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convError) throw convError;

      if (!convs || convs.length === 0) {
        set({ conversations: [], isLoading: false });
        return;
      }

      // Fetch user profiles for 1-to-1 chats
      const otherUserIds = convs
        .filter(c => !c.is_group)
        .map((c) => (c.sender_id === currentUserId ? c.receiver_id : c.sender_id));
        
      const uniqueIds = Array.from(new Set(otherUserIds)).filter(Boolean) as string[];

      let profileMap: any = {};
      
      if (uniqueIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("User")
          .select("id, name, image")
          .in("id", uniqueIds);

        if (profileError) throw profileError;

        profileMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }

      const enriched: ConversationWithUser[] = convs.map((row) => {
        if (row.is_group) {
          return {
            id: row.id,
            isGroup: true,
            groupName: row.group_name,
            otherUserName: row.group_name || "Group",
            otherUserImage: null,
            lastMessage: row.last_message ?? null,
            lastMessageAt: row.last_message_at ?? null,
          };
        } else {
          const otherId = row.sender_id === currentUserId ? row.receiver_id : row.sender_id;
          const profile = profileMap[otherId];

          return {
            id: row.id,
            isGroup: false,
            otherUserId: otherId,
            otherUserName: profile?.name ?? "Unknown User",
            otherUserImage: profile?.image ?? null,
            lastMessage: row.last_message ?? null,
            lastMessageAt: row.last_message_at ?? null,
          };
        }
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
