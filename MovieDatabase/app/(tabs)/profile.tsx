import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, TouchableOpacity, TextInput, FlatList, Alert, Platform, Switch, Modal } from 'react-native';
import { Text, View } from '../../components/Themed';
import { getUserProfile, saveUserProfile, getFavoriteMovies, getNotificationsEnabled, setNotificationsEnabled } from '../../utils/storage';
import { movies } from '../../constants/Movies';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import MovieDetailModal from '../../components/MovieDetailModal';
import MovieCardSmall from '../../components/MovieCardSmall';
import DeleteButton from '../../components/DeleteButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  FAVORITE_MOVIES: 'favorite_movies',
  NOTIFICATIONS: 'notifications'
};

const DEFAULT_AVATARS = [
  require('../../assets/images/avatars/avatar-0.png'),
  require('../../assets/images/avatars/avatar-1.png'),
  require('../../assets/images/avatars/avatar-2.png'),
  require('../../assets/images/avatars/avatar-3.png'),
  require('../../assets/images/avatars/avatar-4.png'),
  require('../../assets/images/avatars/avatar-5.png'),
  require('../../assets/images/avatars/avatar-6.png')
];

const getNameAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

const AvatarGrid = ({ onSelect }: { onSelect: (avatar: any) => void }) => {
  return (
    <View style={styles.avatarGrid}>
      <TouchableOpacity
        style={styles.avatarOption}
        onPress={() => onSelect('name')}
      >
        <View style={[styles.avatarOptionImage, styles.iconContainer]}>
          <Ionicons name="close" size={28} color={Colors.light.tint} />
        </View>
      </TouchableOpacity>
      
      {DEFAULT_AVATARS.map((avatar, index) => (
        <TouchableOpacity
          key={index}
          style={styles.avatarOption}
          onPress={() => onSelect(avatar)}
        >
          <Image source={avatar} style={styles.avatarOptionImage} resizeMode="cover" />
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.avatarOption}
        onPress={() => onSelect('custom')}
      >
        <View style={[styles.avatarOptionImage, styles.iconContainer]}>
          <Ionicons name="add" size={28} color={Colors.light.tint} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function ProfileScreen() {
  const [name, setName] = useState('Uživatel');
  const [isEditing, setIsEditing] = useState(false);
  const [favoriteMovies, setFavoriteMovies] = useState<(typeof movies[0])[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title'>('title');
  const [selectedMovie, setSelectedMovie] = useState<typeof movies[0] | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadProfile();
    loadFavorites();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
      loadFavorites();
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async () => {
    const profile = await getUserProfile();
    if (profile) {
      setName(profile.name);
      setNotificationsEnabled(profile.notificationsEnabled);
      setAvatarUrl(profile.avatarUrl || getNameAvatar(profile.name));
    } else {
      const defaultName = 'Filmový fanoušek';
      const defaultProfile = {
        name: defaultName,
        notificationsEnabled: true,
        avatarUrl: getNameAvatar(defaultName)
      };
      await saveUserProfile(defaultProfile);
      setName(defaultName);
      setNotificationsEnabled(true);
      setAvatarUrl(defaultProfile.avatarUrl);
    }
  };

  const loadFavorites = async () => {
    const favoriteIds = await getFavoriteMovies();
    const favorites = movies.filter(movie => favoriteIds.includes(movie.id));
    const sorted = sortMovies(favorites, sortBy);
    setFavoriteMovies(sorted);
  };

  const sortMovies = (moviesToSort: typeof movies, sortType: 'date' | 'title') => {
    return [...moviesToSort].sort((a, b) => {
      if (sortType === 'date') {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      }
      return a.title.localeCompare(b.title);
    });
  };

  const handleSortChange = (newSortBy: 'date' | 'title') => {
    setSortBy(newSortBy);
    setFavoriteMovies(sortMovies(favoriteMovies, newSortBy));
  };

  const handleNameSave = async () => {
    if (name.trim()) {
      const profile = await getUserProfile();
      const currentAvatarUrl = profile?.avatarUrl || getNameAvatar(name);
      const isUsingNameAvatar = typeof currentAvatarUrl === 'string' && currentAvatarUrl.includes('ui-avatars.com');
      
      const updatedProfile = {
        name: name.trim(),
        notificationsEnabled,
        avatarUrl: isUsingNameAvatar ? getNameAvatar(name.trim()) : currentAvatarUrl
      };

      try {
        await saveUserProfile(updatedProfile);
        if (isUsingNameAvatar) {
          setAvatarUrl(updatedProfile.avatarUrl);
        }
        setIsEditing(false);
      } catch (error) {
        Alert.alert('Chyba', 'Nepodařilo se uložit změny profilu');
      }
    } else {
      Alert.alert('Chyba', 'Jméno nemůže být prázdné');
    }
  };

  const handleProfileDelete = async () => {
    Alert.alert(
      'Smazat profil',
      'Opravdu chcete smazat svůj profil? Tato akce smaže vaše nastavení, oblíbené filmy a nastavení notifikací.',
      [
        {
          text: 'Zrušit',
          style: 'cancel',
        },
        {
          text: 'Smazat',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.USER_PROFILE,
              STORAGE_KEYS.FAVORITE_MOVIES,
              STORAGE_KEYS.NOTIFICATIONS
            ]);
            const defaultName = 'Filmový fanoušek';
            const defaultProfile = {
              name: defaultName,
              notificationsEnabled: true,
              avatarUrl: getNameAvatar(defaultName)
            };
            await saveUserProfile(defaultProfile);
            setName(defaultName);
            setNotificationsEnabled(true);
            setAvatarUrl(defaultProfile.avatarUrl);
            loadFavorites();
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Oprávnění zamítnuto',
          'Pro zapnutí notifikací prosím povolte oprávnění v nastavení zařízení.'
        );
        return;
      }
    }

    const profile = await getUserProfile();
    const updatedProfile = {
      name,
      notificationsEnabled: value,
      avatarUrl: profile?.avatarUrl || getNameAvatar(name)
    };
    
    await saveUserProfile(updatedProfile);
    setNotificationsEnabled(value);
  };

  const handleAvatarChange = async (newAvatarUrl: any) => {
    try {
      const updatedProfile = {
        name,
        notificationsEnabled,
        avatarUrl: newAvatarUrl
      };
      
      await saveUserProfile(updatedProfile);
      setAvatarUrl(newAvatarUrl);
      setShowAvatarModal(false);
    } catch (error) {
      Alert.alert('Chyba', 'Nepodařilo se změnit avatar');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleAvatarChange(result.assets[0].uri);
    }
  };

  const handleAvatarSelect = async (selection: any) => {
    if (selection === 'name') {
      await handleAvatarChange(getNameAvatar(name));
    } else if (selection === 'custom') {
      await pickImage();
    } else {
      await handleAvatarChange(selection);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={typeof avatarUrl === 'string' ? { uri: avatarUrl } : avatarUrl}
            style={styles.avatar}
            defaultSource={DEFAULT_AVATARS[0]}
          />
          <TouchableOpacity 
            style={styles.editAvatarButton}
            onPress={() => setShowAvatarModal(true)}
          >
            <Ionicons name="pencil" size={16} color="white" />
          </TouchableOpacity>
        </View>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Vaše jméno"
            />
            <TouchableOpacity onPress={handleNameSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Uložit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{name}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={20} color={Colors.light.tint} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.settingsRow}>
          <View style={styles.settingItem}>
            <Ionicons name="notifications" size={24} color={Colors.light.tint} style={styles.settingIcon} />
            <Text style={styles.settingText}>Povolit notifikace</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#767577', true: Colors.light.tint }}
          />
        </View>

        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'title' && styles.sortButtonActive]}
            onPress={() => handleSortChange('title')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'title' && styles.sortButtonTextActive]}>
              Podle názvu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => handleSortChange('date')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
              Podle data
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={favoriteMovies}
        renderItem={({ item }) => (
          <MovieCardSmall
            movie={item}
            onPress={() => setSelectedMovie(item)}
          />
        )}
        style={styles.movieList}
        ListFooterComponent={
          <DeleteButton
            onDelete={async ({ deleteNotifications, deleteSettings, deleteFavorites }) => {
              const keysToRemove = [];
              if (deleteNotifications) keysToRemove.push(STORAGE_KEYS.NOTIFICATIONS);
              if (deleteSettings) keysToRemove.push(STORAGE_KEYS.USER_PROFILE);
              if (deleteFavorites) keysToRemove.push(STORAGE_KEYS.FAVORITE_MOVIES);
              
              await AsyncStorage.multiRemove(keysToRemove);
              
              if (deleteSettings) {
                const defaultName = 'Filmový fanoušek';
                const defaultProfile = {
                  name: defaultName,
                  notificationsEnabled: true,
                  avatarUrl: getNameAvatar(defaultName)
                };
                await saveUserProfile(defaultProfile);
                setName(defaultName);
                setNotificationsEnabled(true);
                setAvatarUrl(defaultProfile.avatarUrl);
              }
              
              if (deleteFavorites) {
                loadFavorites();
              }
            }}
            showOptions={true}
            buttonText="Smazat profil"
            style={styles.deleteProfileButton}
            textStyle={styles.deleteProfileButtonText}
          />
        }
      />

      <MovieDetailModal
        movie={selectedMovie}
        visible={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onFavoriteChange={loadFavorites}
      />

      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowAvatarModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Vyberte avatar</Text>
            <AvatarGrid onSelect={handleAvatarSelect} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAvatarModal(false)}
            >
              <Text style={styles.closeButtonText}>Zavřít</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#000',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
    marginRight: 8,
    paddingVertical: 4,
    minWidth: 150,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sortButtons: {
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  sortButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  movieList: {
    flex: 1,
    padding: 16,
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  movieImage: {
    width: 80,
    height: 120,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  movieTag: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 8,
  },
  movieDate: {
    fontSize: 14,
    color: '#666',
  },
  deleteProfileButton: {
    backgroundColor: '#dc3545',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarOption: {
    width: '30%',
    aspectRatio: 1,
    padding: 4,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  iconContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: 'white',
  },
  uploadButton: {
    backgroundColor: Colors.light.tint,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  nameAvatarOption: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 8,
  },
  nameAvatarText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
