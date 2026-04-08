import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabaseClient";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { AuthState } from "../types";
import useUserStore from "./useUserStore";

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null as any,
      isLoggedIn: false,
      isLoading: true,
      access_token: "",

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setLogin: (isLoggedIn: boolean) => set({ isLoggedIn }),
      setAccessToken: (access_token: string) => set({ access_token }),

      initialize: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            set({
              user: session.user,
              access_token: session.access_token,
              isLoggedIn: true,
            });
            const { data: profile } = await supabase
              .from("User")
              .select("*")
              .eq("id", session.user.id)
              .single();
            if (profile) {
              useUserStore.getState().setLoginUser(profile);
            }
          }
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) throw error;

        if (data?.session) {
          set({
            user: data.session.user,
            access_token: data.session.access_token,
            isLoggedIn: true,
          });
          const { data: profile } = await supabase
            .from("User")
            .select("*")
            .eq("id", data.session.user.id)
            .single();
          if (profile) {
            useUserStore.getState().setLoginUser(profile);
          }
        }

        return data;
      },

      googleLogin: async () => {
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          const idToken = userInfo.data?.idToken || userInfo.data?.idToken;

          if (!idToken) {
            throw new Error("No ID token present!");
          }

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
          });

          if (error) throw error;

          if (data?.session) {
            set({
              user: data.session.user,
              access_token: data.session.access_token,
              isLoggedIn: true,
            });
            const { data: profile } = await supabase
              .from("User")
              .select("*")
              .eq("id", data.session.user.id)
              .single();
            if (profile) {
              useUserStore.getState().setLoginUser(profile);
            }
          }

          return data;
        } catch (error: any) {
          if (isErrorWithCode(error)) {
            switch (error.code) {
              case statusCodes.SIGN_IN_CANCELLED:
                throw new Error("User cancelled the login flow");
              case statusCodes.IN_PROGRESS:
                throw new Error("Sign in is in progress already");
              case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                throw new Error("Play services not available or outdated");
              default:
                throw error;
            }
          } else {
            throw error;
          }
        }
      },

      signup: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data?.user) {
          const newUserProfile = {
            id: data.user.id,
            name: name,
            email: email,
            bio: "",
            image: "",
          };
          await supabase.from("User").insert([newUserProfile]);
          useUserStore.getState().setLoginUser(newUserProfile);
        }

        return data;
      },

      logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({
          user: null,
          isLoggedIn: false,
          access_token: "",
        });
        useUserStore.getState().setLoginUser(null);
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useAuthStore;
