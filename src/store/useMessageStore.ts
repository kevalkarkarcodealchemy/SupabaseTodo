import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { MessageStore, Message, Conversation } from "../types";

const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  conversationId: null,
  isLoading: false,
  error: null,

  // ─────────────────────────────────────────────────────────────────────────
  // resolveConversation: Just fetches an existing ID without creating one
  // ─────────────────────────────────────────────────────────────────────────
  resolveConversation: async (
    senderId: string,
    receiverId: string,
  ): Promise<string | null> => {
    const { data: existing, error: fetchError } = await supabase
      .from("Conversation")
      .select("id")
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),` +
          `and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`,
      )
      .maybeSingle();

    if (fetchError) {
      return null;
    }

    if (existing) {
      set({ conversationId: existing.id });
      return existing.id;
    }

    set({ conversationId: null });
    return null;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch all messages for an existing conversation
  // ─────────────────────────────────────────────────────────────────────────
  fetchMessages: async (currentUserId: string, otherUserId: string) => {
    set({ isLoading: true, error: null });
    try {
      const convId = await get().resolveConversation(
        currentUserId,
        otherUserId,
      );

      if (!convId) {
        set({ messages: [], isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from("Messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Only update if conversation haven't changed while fetching
      if (get().conversationId === convId || !get().conversationId) {
        set({
          messages: (data as Message[]) ?? [],
          isLoading: false,
          conversationId: convId,
        });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Send a message — creates the conversation row ONLY if it doesn't exist
  // ─────────────────────────────────────────────────────────────────────────
  sendMessage: async (senderId: string, receiverId: string, text: string) => {
    try {
      let currentConvId = get().conversationId;

      // If not in state, try to resolve from DB
      if (!currentConvId) {
        currentConvId = await get().resolveConversation(senderId, receiverId);
      }

      // If still no conversation, CREATE IT NOW (first message ever)
      if (!currentConvId) {
        const { data: created, error: createError } = await supabase
          .from("Conversation")
          .insert([{ sender_id: senderId, receiver_id: receiverId }])
          .select("id")
          .single();

        if (createError) throw createError;
        currentConvId = (created as any).id;
        set({ conversationId: currentConvId });
      }

      // Step 2 — Insert the message linked to the resolved conversation_id
      const { data: newMsg, error: msgError } = await supabase
        .from("Messages")
        .insert([
          {
            conversation_id: currentConvId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: text,
          },
        ])
        .select()
        .single();

      if (msgError) throw msgError;

      // Step 3 — Update Conversation metadata (last_message, timestamp)
      // Fetch sender name for the initial
      await supabase
        .from("Conversation")
        .update({
          last_message: text,
          last_message_sender_id: senderId,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", currentConvId);

      // Optimistic local append if not already there
      const currentMessages = get().messages;
      const exists = currentMessages.some(
        (m) => String(m.id) === String((newMsg as Message).id),
      );
      if (!exists) {
        set({ messages: [...currentMessages, newMsg as Message] });
      }
    } catch (error: any) {
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Update a message
  // ─────────────────────────────────────────────────────────────────────────
  updateMessage: async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from("Messages")
        .update({ content: newContent })
        .eq("id", messageId);

      if (error) throw error;

      // Optimistic update
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, content: newContent } : m,
        ),
      }));

      // Sync Conversation metadata if this was the last message
      const state = get();
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.id === messageId && state.conversationId) {
        const { data: sender } = await supabase
          .from("User")
          .select("name")
          .eq("id", lastMsg.sender_id)
          .single();

        const initial = sender?.name?.charAt(0)?.toUpperCase() || "?";
        await supabase
          .from("Conversation")
          .update({
            last_message: `${initial}: ${newContent}`,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", state.conversationId);
      }
    } catch (error: any) {
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Delete a message
  // ─────────────────────────────────────────────────────────────────────────
  deleteMessage: async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("Messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      // Optimistic delete
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));

      // Find the new last message and sync Conversation metadata
      const state = get();
      const lastMsg = state.messages[state.messages.length - 1];
      const conversationId = state.conversationId;

      if (!conversationId) return;

      if (lastMsg) {
        const { data: sender } = await supabase
          .from("User")
          .select("name")
          .eq("id", lastMsg.sender_id)
          .single();

        const initial = sender?.name?.charAt(0)?.toUpperCase() || "?";
        await supabase
          .from("Conversation")
          .update({
            last_message: `${initial}: ${lastMsg.content}`,
            last_message_at: lastMsg.created_at,
            last_message_sender_id: lastMsg.sender_id,
          })
          .eq("id", conversationId);
      } else {
        await supabase
          .from("Conversation")
          .update({
            last_message: null,
            last_message_at: null,
            last_message_sender_id: null,
          })
          .eq("id", conversationId);
      }
    } catch (error: any) {
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Realtime subscription — listens for new, updated, and deleted messages
  // ─────────────────────────────────────────────────────────────────────────
  subscribeToMessages: (myId: string, otherId: string) => {
    // Unique channel name for this specific chat pair
    const channelId = [myId, otherId].sort().join("_");
    const channelName = `chat_room_${channelId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events: INSERT, UPDATE, DELETE
          schema: "public",
          table: "Messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message;
            const isRelevant =
              (newMessage.sender_id === otherId &&
                newMessage.receiver_id === myId) ||
              (newMessage.sender_id === myId &&
                newMessage.receiver_id === otherId);

            if (!isRelevant) return;

            if (!get().conversationId && newMessage.conversation_id) {
              set({ conversationId: newMessage.conversation_id });
            }

            const currentMessages = get().messages;
            const exists = currentMessages.some(
              (m) => String(m.id) === String(newMessage.id),
            );

            if (!exists) {
              set({ messages: [...currentMessages, newMessage] });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new as Message;
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === updatedMessage.id ? updatedMessage : m,
              ),
            }));
          } else if (payload.eventType === "DELETE") {
            const deletedMessageId = payload.old.id;
            set((state) => ({
              messages: state.messages.filter((m) => m.id !== deletedMessageId),
            }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

export default useMessageStore;
