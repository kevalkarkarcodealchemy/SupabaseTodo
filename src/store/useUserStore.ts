import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { UserStore, User } from "../types";

const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  loginUser: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from("User").select("*");

      if (error) throw error;

      set({ users: (data as User[]) || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
    0;
  },

  subscribeToUsers: () => {
    const subscription = supabase
      .channel("user-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "User",
        },
        (payload) => {
          const { eventType, new: newUser, old: oldUser } = payload;
          const { users } = get();

          if (eventType === "INSERT") {
            const exists = users.some((u) => u.id === (newUser as User).id);
            if (!exists) {
              set({ users: [...users, newUser as User] });
            }
          } else if (eventType === "UPDATE") {
            set({
              users: users.map((u) =>
                u.id === (newUser as User).id ? (newUser as User) : u,
              ),
            });
          } else if (eventType === "DELETE") {
            set({
              users: users.filter((u) => u.id !== (oldUser as User).id),
            });
          }
        },
      )
      .subscribe((status) => {
        console.log("[Realtime] User subscription status:", status);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  },
  setLoginUser: (user: User | null) => {
    set({ loginUser: user });
  },

  updateProfile: async (id: string, name: string, bio: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("User")
        .update({ name, bio })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set({
          loginUser: data as User,
          users: get().users.map((u) => (u.id === id ? (data as User) : u)),
        });
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useUserStore;
