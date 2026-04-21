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

      const groupIds = (groupMembers || []).map((gm) => gm.conversation_id);
      let orQuery = `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`;

      if (groupIds.length > 0) {
        const inFilter = groupIds.map((id) => `"${id}"`).join(",");
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
        .filter((c) => !c.is_group)
        .map((c) =>
          c.sender_id === currentUserId ? c.receiver_id : c.sender_id,
        );

      const uniqueIds = Array.from(new Set(otherUserIds)).filter(
        Boolean,
      ) as string[];

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
          const otherId =
            row.sender_id === currentUserId ? row.receiver_id : row.sender_id;
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
    const channelId = `chat-list-realtime-${currentUserId}-${Math.random()
      .toString(36)
      .substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Conversation",
        },
        (payload) => {
          const record =
            payload.eventType === "DELETE" ? payload.old : payload.new;
          if (record) {
            const isParticipant =
              record.sender_id === currentUserId ||
              record.receiver_id === currentUserId;
            const isKnownConv = get().conversations.some(
              (c) => c.id === record.id,
            );
            if (isParticipant || isKnownConv) {
              get().fetchConversations(currentUserId);
            }
          } else {
            get().fetchConversations(currentUserId);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Messages",
        },
        (payload) => {
          const record =
            payload.eventType === "DELETE" ? payload.old : payload.new;
          if (record) {
            const isParticipant =
              record.sender_id === currentUserId ||
              record.receiver_id === currentUserId;
            const isKnownConv = get().conversations.some(
              (c) => c.id === record.conversation_id,
            );
            if (isParticipant || isKnownConv) {
              get().fetchConversations(currentUserId);
            }
          } else {
            get().fetchConversations(currentUserId);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "User",
        },
        (payload) => {
          const record =
            payload.eventType === "DELETE" ? payload.old : payload.new;
          if (record) {
            // Refresh if the changed user is someone we have a conversation with
            const isRelevantUser = get().conversations.some(
              (c) => !c.isGroup && c.otherUserId === record.id,
            );
            if (isRelevantUser || record.id === currentUserId) {
              get().fetchConversations(currentUserId);
            }
          } else {
            get().fetchConversations(currentUserId);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

export default useChatListStore;
