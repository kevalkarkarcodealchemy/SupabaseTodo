import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { GroupStore, User, Message } from "../types";

const useGroupStore = create<GroupStore>((set, get) => ({
  messages: [],
  conversationId: null,
  isLoading: false,
  error: null,

  createGroup: async (
    name: string,
    memberIds: string[],
    creatorId: string,
  ): Promise<string> => {
    set({ isLoading: true, error: null });
    try {
      // 1. Create Conversation
      const { data: convData, error: convError } = await supabase
        .from("Conversation")
        .insert([
          {
            is_group: true,
            group_name: name,
            created_by: creatorId,
            last_message: "Group created",
            last_message_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (convError) throw convError;
      const conversationId = (convData as any).id;

      // 2. Add members to GroupMembers
      const membersToInsert = [...memberIds, creatorId].map((id) => ({
        conversation_id: conversationId,
        user_id: id,
      }));

      const { error: membersError } = await supabase
        .from("groupmembers")
        .insert(membersToInsert);

      if (membersError) throw membersError;

      set({ isLoading: false });
      return conversationId;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  fetchGroupMembers: async (conversationId: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from("groupmembers")
        .select(
          `
          user_id,
          User:user_id (*)
        `,
        )
        .eq("conversation_id", conversationId);

      if (error) throw error;

      const users = (data || []).map((item) => item.User as unknown as User);
      return users;
    } catch (error: any) {
      console.error("[GroupStore] fetchGroupMembers error:", error);
      return [];
    }
  },

  fetchGroupMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("Messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      set({
        messages: (data as Message[]) ?? [],
        isLoading: false,
        conversationId,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendGroupMessage: async (
    conversationId: string,
    senderId: string,
    text: string,
  ) => {
    try {
      // Step 1 — Insert the message
      // Important: Groups don't use receiver_id
      const { data: newMsg, error: msgError } = await supabase
        .from("Messages")
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            content: text,
          },
        ])
        .select()
        .single();

      if (msgError) throw msgError;

      // Step 2 — Update Conversation metadata (last_message, timestamp)
      const { data: sender } = await supabase
        .from("User")
        .select("name")
        .eq("id", senderId)
        .single();

      const initial = sender?.name?.split(" ")[0] || "User";

      const { error: updateError } = await supabase
        .from("Conversation")
        .update({
          last_message: `${initial}: ${text}`,
          last_message_sender_id: senderId,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to update Conversation metadata:", updateError);
      }

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

  updateMessage: async (messageId: string, newContent: string) => {
    try {
      const state = get();
      const targetMessage = state.messages.find(
        (m) => String(m.id) === String(messageId),
      );
      if (!targetMessage) return;

      const { data, error } = await supabase
        .from("Messages")
        .update({ content: newContent })
        .eq("id", targetMessage.id)
        .select();

      if (error) throw error;

      // Optimistic update
      set((state) => ({
        messages: state.messages.map((m) =>
          String(m.id) === String(messageId)
            ? { ...m, content: newContent }
            : m,
        ),
      }));

      // Sync Conversation metadata if this was the last message
      const messages = get().messages;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && String(lastMsg.id) === String(messageId)) {
        const { data: sender } = await supabase
          .from("User")
          .select("name")
          .eq("id", lastMsg.sender_id)
          .single();

        const initial = sender?.name?.split(" ")[0] || "User";
        await supabase
          .from("Conversation")
          .update({
            last_message: `${initial}: ${newContent}`,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", get().conversationId);
      }
    } catch (error: any) {
      console.error("[GroupStore] updateMessage error:", error);
      throw error;
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("Messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      // Optimistic delete
      set((state) => ({
        messages: state.messages.filter(
          (m) => String(m.id) !== String(messageId),
        ),
      }));

      // Find the new last message and sync Conversation metadata
      const messages = get().messages;
      const lastMsg = messages[messages.length - 1];
      const conversationId = get().conversationId;

      if (lastMsg) {
        const { data: sender } = await supabase
          .from("User")
          .select("name")
          .eq("id", lastMsg.sender_id)
          .single();

        const initial = sender?.name?.split(" ")[0] || "User";
        await supabase
          .from("Conversation")
          .update({
            last_message: `${initial}: ${lastMsg.content}`,
            last_message_at: lastMsg.created_at,
          })
          .eq("id", conversationId);
      } else {
        await supabase
          .from("Conversation")
          .update({
            last_message: "No messages yet",
            last_message_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
      }
    } catch (error: any) {
      throw error;
    }
  },

  clearChat: async (conversationId: string) => {
    try {
      console.log("this is clearChat ");
      // Delete all messages from Supabase
      const { data, error, count } = await supabase
        .from("Messages")
        .delete()
        .eq("conversation_id", conversationId)
        .select();

      if (error) throw error;

      console.log(
        "[GroupStore] clearChat deleted count:",
        count,
        "data:",
        data,
      );

      if (count === 0) {
        console.warn(
          "[GroupStore] clearChat: No messages deleted. Check RLS policies on Messages table.",
        );
      }

      // Clear local messages state
      set({ messages: [] });

      // Update Conversation metadata
      await supabase
        .from("Conversation")
        .update({
          last_message: "No messages yet",
          last_message_at: new Date().toISOString(),
          last_message_sender_id: null,
        })
        .eq("id", conversationId);
    } catch (error: any) {
      console.error("[GroupStore] clearChat error:", error);
      throw error;
    }
  },

  deleteChat: async (conversationId: string) => {
    try {
      // 1. Delete all group messages first
      const { error: msgError } = await supabase
        .from("Messages")
        .delete()
        .eq("conversation_id", conversationId);

      if (msgError) throw msgError;

      // 2. Delete the conversation record
      const { error: convError } = await supabase
        .from("Conversation")
        .delete()
        .eq("id", conversationId);

      if (convError) throw convError;

      // 3. Clear local state
      set({ messages: [], conversationId: null });
    } catch (error: any) {
      console.error("[GroupStore] deleteChat error:", error);
      throw error;
    }
  },

  subscribeToGroupMessages: (conversationId: string) => {
    const uniqueId = Math.random().toString(36).substring(7);
    const channelName = `group_room_${conversationId}_${uniqueId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message;

            const currentMessages = get().messages;
            const exists = currentMessages.some(
              (m) => String(m.id) === String(newMessage.id),
            );

            if (!exists) {
              set({ messages: [...currentMessages, newMessage] });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new as Partial<Message>;
            set((state) => ({
              messages: state.messages.map((m) =>
                String(m.id) === String(updatedMessage.id)
                  ? { ...m, ...updatedMessage }
                  : m,
              ),
            }));
          } else if (payload.eventType === "DELETE") {
            const deletedMessageId = payload.old.id;
            set((state) => ({
              messages: state.messages.filter(
                (m) => String(m.id) !== String(deletedMessageId),
              ),
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

export default useGroupStore;
