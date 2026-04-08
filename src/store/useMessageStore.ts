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
    set({ isLoading: true, error: null, messages: [] });
    try {
      const conversationId = await get().resolveConversation(
        currentUserId,
        otherUserId,
      );

      if (!conversationId) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from("Messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      set({ messages: (data as Message[]) ?? [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Send a message — creates the conversation row ONLY if it doesn't exist
  // ─────────────────────────────────────────────────────────────────────────
  sendMessage: async (senderId: string, receiverId: string, text: string) => {
    try {
      let conversationId = get().conversationId;

      // If not in state, try to resolve from DB
      if (!conversationId) {
        conversationId = await get().resolveConversation(senderId, receiverId);
      }

      // If still no conversation, CREATE IT NOW (first message ever)
      if (!conversationId) {
        const { data: created, error: createError } = await supabase
          .from("Conversation")
          .insert([{ sender_id: senderId, receiver_id: receiverId }])
          .select("id")
          .single();

        if (createError) throw createError;
        conversationId = (created as any).id;
        set({ conversationId });
      }

      // Step 2 — Insert the message linked to the resolved conversation_id
      const { data: newMsg, error: msgError } = await supabase
        .from("Messages")
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: text,
          },
        ])
        .select()
        .single();

      if (msgError) throw msgError;

      // Step 3 — Update Conversation metadata (last_message, timestamp)
      // This is a best-effort denormalisation update; it does NOT block the
      // message from being delivered if it fails.
      const { error: updateError } = await supabase
        .from("Conversation")
        .update({
          last_message: text,
          last_message_sender_id: senderId,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      if (updateError) {
        console.error(
          "[Chat] Update Conversation metadata failed:",
          updateError.message,
          {
            code: updateError.code,
            hint: updateError.hint,
            details: updateError.details,
          },
        );
      }

      // Optimistic local append (in case realtime is delayed)
      const messages = get().messages;
      const alreadyExists = messages.some(
        (m) => m.id === (newMsg as Message).id,
      );
      if (!alreadyExists) {
        set({ messages: [...messages, newMsg as Message] });
      }
    } catch (error: any) {
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Realtime subscription — improved to handle the "first message" scenario
  // ─────────────────────────────────────────────────────────────────────────
  subscribeToMessages: (myId: string, otherId: string) => {
    const channelName = `messages:pair:${[myId, otherId].sort().join("-")}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // Check if this message belongs to our current chat pair
          const isFromOtherToMe =
            newMessage.sender_id === otherId && newMessage.receiver_id === myId;
          const isFromMeToOther =
            newMessage.sender_id === myId && newMessage.receiver_id === otherId;

          if (!isFromOtherToMe && !isFromMeToOther) return;

          // Sync conversationId if it was missing locally
          if (!get().conversationId && newMessage.conversation_id) {
            set({ conversationId: newMessage.conversation_id });
          }

          const { messages } = get();
          const alreadyExists = messages.some((m) => m.id === newMessage.id);
          if (!alreadyExists) {
            set({ messages: [...messages, newMessage] });
          }
        },
      )
      .subscribe((status) => {
        console.log("[Realtime] Messages channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

export default useMessageStore;
