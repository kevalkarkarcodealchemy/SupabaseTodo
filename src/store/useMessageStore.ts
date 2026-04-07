import {create} from 'zustand';
import {supabase} from '../services/supabaseClient';
import {MessageStore, Message} from '../types';

const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  fetchMessages: async (currentUserId: string, otherUserId: string) => {
    set({isLoading: true, error: null, messages: []});
    try {
      const {data, error} = await supabase
        .from('Messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`,
        )
        .order('created_at', {ascending: true});

      if (error) throw error;
      set({messages: (data as Message[]) ?? [], isLoading: false});
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({error: error.message, isLoading: false});
    }
  },

  sendMessage: async (senderId: string, receiverId: string, text: string) => {
    try {
      const {data, error} = await supabase
        .from('Messages')
        .insert([{sender_id: senderId, receiver_id: receiverId, content: text}])
        .select()
        .single();

      if (error) throw error;

      // Optimistically append the message in case realtime is delayed
      const messages = get().messages;
      const alreadyExists = messages.some(m => m.id === (data as Message).id);
      if (!alreadyExists) {
        set({
           messages: [...messages, data as Message],
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  subscribeToMessages: (currentUserId: string, otherUserId: string) => {
    // Use a deterministic channel name (sorted IDs so A-B === B-A)
    const channelName = `messages:${[currentUserId, otherUserId].sort().join('-')}`;

    // Remove any stale channel with the same name before creating a new one
    // supabase.removeChannel(supabase.channel(channelName));

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Messages',
        },
        payload => {
          const newMessage = payload.new as Message;

          // Only process messages that belong to this conversation
          const isRelevant =
            (newMessage.sender_id === currentUserId &&
              newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId &&
              newMessage.receiver_id === currentUserId);

          if (!isRelevant) return;

          const {messages} = get();

          // Deduplicate: skip if already added via optimistic update
          const alreadyExists = messages.some(m => m.id === newMessage.id);
          if (!alreadyExists) {
            set({messages: [...messages, newMessage]});
          }
        },
      )
      .subscribe(status => {
        console.log('[Realtime] Messages channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

export default useMessageStore;
