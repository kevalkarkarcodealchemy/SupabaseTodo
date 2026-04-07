import {create} from 'zustand';
import {supabase} from '../services/supabaseClient';
import {UserStore, User} from '../types';

const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({isLoading: true, error: null});
    try {
      const {data, error} = await supabase
        .from('User')
        .select('*');

      if (error) throw error;

      set({users: (data as User[]) || [], isLoading: false});
    } catch (error: any) {
      set({error: error.message, isLoading: false});
      console.error('Error fetching users:', error);
    }
  },

  subscribeToUsers: () => {
    const subscription = supabase
      .channel('public:User')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'User',
        },
        async (payload) => {
          const {eventType, new: newUser, old: oldUser} = payload;
          const {users} = get();

          if (eventType === 'INSERT') {
            set({users: [...users, newUser as User]});
          } else if (eventType === 'UPDATE') {
            set({
              users: users.map((u) => (u.id === (newUser as User).id ? (newUser as User) : u)),
            });
          } else if (eventType === 'DELETE') {
            set({
              users: users.filter((u) => u.id !== (oldUser as User).id),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },
}));

export default useUserStore;
