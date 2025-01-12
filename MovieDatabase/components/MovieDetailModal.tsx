import React, { useEffect } from 'react';
import { StyleSheet, Modal, TouchableOpacity, Image, Platform, Alert, Share, Linking } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useRouter, usePathname } from 'expo-router';
import { Movie, MovieDetailModalProps, UserNotification } from '../constants/types';
import { getFavoriteMovies, saveFavoriteMovies, saveNotification, getNotificationsEnabled } from '../utils/storage';
import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { MovieTag } from './MovieTag';

export default function MovieDetailModal({
  movie,
  visible,
  onClose,
  onFavoriteChange
}: MovieDetailModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const toggleFavorite = async (movieId: string) => {
    const favorites = await getFavoriteMovies();
    const isCurrentlyFavorite = favorites.includes(movieId);
    const newFavorites = isCurrentlyFavorite
      ? favorites.filter(id => id !== movieId)
      : [...favorites, movieId];
    
    await saveFavoriteMovies(newFavorites);

    if (movie) {
      const notification: UserNotification = {
        id: Date.now().toString(),
        type: isCurrentlyFavorite ? 'remove_favorite' : 'add_favorite',
        movieId: movie.id,
        movieTitle: movie.title,
        timestamp: Date.now()
      };
      await saveNotification(notification);

      const notificationsEnabled = await getNotificationsEnabled();
      if (notificationsEnabled) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: isCurrentlyFavorite ? 'Film odebrán z oblíbených' : 'Film přidán do oblíbených',
            body: `${movie.title}`,
          },
          trigger: null,
        });
      }
    }

    if (onFavoriteChange) {
      onFavoriteChange();
    }
  };

  const [isFavorite, setIsFavorite] = React.useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (movie) {
        const favorites = await getFavoriteMovies();
        setIsFavorite(favorites.includes(movie.id));
      }
    };
    checkFavorite();
  }, [movie]);

  const addToCalendar = async (movie: Movie) => {
    try {
      const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Potřebné oprávnění',
            'Pro přidání události do kalendáře je nutné povolit přístup ke kalendáři v nastavení zařízení.',
            [{ 
              text: 'OK',
              onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings()
            }]
          );
          return;
        }
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (!calendars || calendars.length === 0) {
        Alert.alert(
          'Chyba',
          'Ve vašem zařízení není nastaven žádný kalendář.',
          [{ text: 'OK' }]
        );
        return;
      }

      const defaultCalendar = Platform.select({
        ios: calendars.find(cal => cal.allowsModifications && cal.source.name === 'iCloud') || calendars[0],
        android: calendars.find(cal => cal.allowsModifications && cal.isPrimary) || calendars[0],
        default: calendars[0]
      });

      if (!defaultCalendar) {
        Alert.alert(
          'Chyba',
          'Nepodařilo se najít vhodný kalendář.',
          [{ text: 'OK' }]
        );
        return;
      }

      const startDate = new Date(movie.releaseDate);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 2);

      const eventDetails = {
        title: `🎬 Premiéra: ${movie.title}`,
        notes: `Film: ${movie.title}\n\nPopis: ${movie.description}\n\nŽánry: ${movie.tags.join(', ')}`,
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: 'Kino',
        alarms: [{
          relativeOffset: -1440,
        }, {
          relativeOffset: -60,
        }],
      };

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, eventDetails);

      if (eventId) {
        Alert.alert(
          'Úspěch',
          'Premiéra filmu byla úspěšně přidána do vašeho kalendáře.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Chyba při přidávání do kalendáře:', error);
      Alert.alert(
        'Chyba',
        'Nastala chyba při přidávání události do kalendáře. Zkuste to prosím znovu.',
        [{ text: 'OK' }]
      );
    }
  };

  const shareMovie = async (movie: Movie) => {
    try {
      const premiereDate = new Date(movie.releaseDate).toLocaleDateString('cs-CZ');
      const message = `Ahoj! 👋\n\nNechceš se mnou jít na premiéru filmu "${movie.title}"?\n\nPremiéra je ${premiereDate}.\n\n${movie.description}\n\nŽánry: ${movie.tags.join(', ')}`;
      
      await Share.share({
        message,
        title: `Pozvánka na premiéru filmu ${movie.title}`,
      });
    } catch (error) {
      console.error('Chyba při sdílení:', error);
      Alert.alert(
        'Chyba',
        'Nepodařilo se otevřít dialog pro sdílení.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!movie) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <TouchableOpacity
        style={styles.modalContainer}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalFavoriteIcon}
              onPress={async () => {
                await toggleFavorite(movie.id);
                setIsFavorite(!isFavorite);
                if (!isFavorite === false && pathname.includes('profile')) {
                  onClose();
                }
              }}
            >
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={24}
                color={Colors.light.tint}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseIcon}
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          
          <Image source={{ uri: movie.image }} style={styles.modalImage} />
          
          <View style={styles.modalInfo}>
            <Text style={styles.modalTitle}>{movie.title}</Text>

            <View style={styles.modalTags}>
              {movie.tags.map((tag, index) => (
                <MovieTag 
                  key={index} 
                  tag={tag}
                  style={styles.modalTag}
                  textStyle={styles.modalTagText}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalDateButton}
              onPress={() => addToCalendar(movie)}
            >
              <Ionicons name="calendar" size={24} color={Colors.light.tint} />
              <Text style={styles.modalDateText}>
                Premiéra: {new Date(movie.releaseDate).toLocaleDateString('cs-CZ')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalDescription}>{movie.description}</Text>

            <TouchableOpacity
              style={styles.modalCinemaButton}
              onPress={() => shareMovie(movie)}
            >
              <Text style={styles.modalCinemaButtonText}>Pozvat přátele na premiéru</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  modalFavoriteIcon: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  modalInfo: {
    padding: 20,
  },
  modalTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 16,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4,
  },
  modalTagText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  modalDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  modalDateText: {
    marginLeft: 8,
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: '500',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    color: '#333',
    textAlign: 'center',
  },
  modalCinemaButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalCinemaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  }
}); 