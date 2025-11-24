import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showInfo } from "./toast"; // 👈 add this

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

const secureStoreAdapter = {
  async getItem(key: string) {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value != null) return value;

      return (await AsyncStorage.getItem(key)) ?? null;
    } catch {
      try {
        return (await AsyncStorage.getItem(key)) ?? null;
      } catch {
        return null;
      }
    }
  },

  async setItem(key: string, value: string) {
    try {
      const useAsync = typeof value === "string" && value.length > 2000;

      if (useAsync) {
        showInfo("Large session detected — using AsyncStorage instead.");
        await AsyncStorage.setItem(key, value);
        return;
      }

      await SecureStore.setItemAsync(key, value);
    } catch {
      showInfo("SecureStore failed — falling back to AsyncStorage.");
      try {
        await AsyncStorage.setItem(key, value);
      } catch {
        showInfo("AsyncStorage fallback also failed.");
      }
    }
  },

  async removeItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}

    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
  },
});
