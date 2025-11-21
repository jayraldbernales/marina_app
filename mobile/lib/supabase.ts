import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

/**
 * Storage adapter for Expo/React Native.
 * Stores small values in SecureStore, large values in AsyncStorage.
 * SecureStore has a size limit (~2KB on Android).
 */
const secureStoreAdapter = {
  async getItem(key: string) {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value != null) return value;

      // fallback for large Supabase session payloads
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
        // generic warning without exposing key/value
        console.warn("SecureStore limit exceeded; using AsyncStorage.");
        await AsyncStorage.setItem(key, value);
        return;
      }

      await SecureStore.setItemAsync(key, value);
    } catch {
      console.warn("SecureStore failed; falling back to AsyncStorage.");
      try {
        await AsyncStorage.setItem(key, value);
      } catch {
        console.warn("AsyncStorage fallback also failed.");
      }
    }
  },

  async removeItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore SecureStore removal error
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore AsyncStorage removal error
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
  },
});
