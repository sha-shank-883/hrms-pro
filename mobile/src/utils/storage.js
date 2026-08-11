import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const canUseSecureStore = async () => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    return false;
  }
};

export const appStorage = {
  getItem: async (key) => {
    if (await canUseSecureStore()) {
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },

  setItem: async (key, value) => {
    if (await canUseSecureStore()) {
      return SecureStore.setItemAsync(key, value);
    }
    return AsyncStorage.setItem(key, value);
  },

  deleteItem: async (key) => {
    if (await canUseSecureStore()) {
      return SecureStore.deleteItemAsync(key);
    }
    return AsyncStorage.removeItem(key);
  },
};
