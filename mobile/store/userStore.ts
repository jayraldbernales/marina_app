import { create } from "zustand";

type UserState = {
  user: null | {
    id: string;
    email: string;
    fullName?: string;
  };
  setUser: (u: UserState["user"]) => void;
  logout: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
