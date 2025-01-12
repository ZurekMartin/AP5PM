import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  FAVORITE_MOVIES: 'favorite_movies',
  NOTIFICATIONS: 'notifications'
};

export interface UserProfile {
  name: string;
  avatarUrl?: string;
  notificationsEnabled: boolean;
}

export interface UserNotification {
  id: string;
  type: 'add_favorite' | 'remove_favorite' | 'calendar_event_created';
  movieId: string;
  timestamp: number;
  movieTitle: string;
}

export const saveUserProfile = async (profile: UserProfile) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!profile) {
      const defaultProfile: UserProfile = {
        name: 'Uživatel',
        notificationsEnabled: true
      };
      await saveUserProfile(defaultProfile);
      return defaultProfile;
    }
    const parsedProfile = JSON.parse(profile);
    if (typeof parsedProfile.notificationsEnabled === 'undefined') {
      parsedProfile.notificationsEnabled = true;
      await saveUserProfile(parsedProfile);
    }
    return parsedProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const saveFavoriteMovies = async (movieIds: string[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_MOVIES, JSON.stringify(movieIds));
  } catch (error) {
    console.error('Error saving favorite movies:', error);
  }
};

export const getFavoriteMovies = async (): Promise<string[]> => {
  try {
    const favorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_MOVIES);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorite movies:', error);
    return [];
  }
};

export const saveNotification = async (notification: UserNotification) => {
  try {
    const notifications = await getNotifications();
    notifications.push(notification);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notification:', error);
  }
};

export const getNotifications = async (): Promise<UserNotification[]> => {
  try {
    const notifications = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const clearNotifications = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

export const setNotificationsEnabled = async (enabled: boolean) => {
  try {
    const profile = await getUserProfile();
    if (profile) {
      profile.notificationsEnabled = enabled;
      await saveUserProfile(profile);
    }
  } catch (error) {
    console.error('Error saving notifications setting:', error);
  }
};

export const getNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    return profile?.notificationsEnabled ?? true;
  } catch (error) {
    console.error('Error getting notifications setting:', error);
    return true;
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};