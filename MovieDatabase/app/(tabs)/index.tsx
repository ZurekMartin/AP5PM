import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Text, View } from '../../components/Themed';
import { movies } from '../../constants/Movies';
import { getFavoriteMovies, saveFavoriteMovies, saveNotification, getNotificationsEnabled } from '../../utils/storage';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MovieDetailModal from '../../components/MovieDetailModal';
import MovieCardLarge from '../../components/MovieCardLarge';
import * as Notifications from 'expo-notifications';

export default function MoviesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<typeof movies[0] | null>(null);
  const allTags = Array.from(new Set(movies.flatMap(movie => movie.tags))).sort();
  const navigation = useNavigation();

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });

    return () => unsubscribe();
  }, []);

  const loadFavorites = async () => {
    const favorites = await getFavoriteMovies();
    setFavoriteMovies(favorites);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => movie.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleFavorite = async (movie: typeof movies[0]) => {
    const favorites = await getFavoriteMovies();
    const isCurrentlyFavorite = favorites.includes(movie.id);
    const newFavorites = isCurrentlyFavorite
      ? favorites.filter(id => id !== movie.id)
      : [...favorites, movie.id];
    
    await saveFavoriteMovies(newFavorites);

    const notification = {
      id: Date.now().toString(),
      type: isCurrentlyFavorite ? 'remove_favorite' as const : 'add_favorite' as const,
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
          body: `${movie.title} byl ${isCurrentlyFavorite ? 'odebrán z' : 'přidán do'} oblíbených filmů`,
        },
        trigger: null,
      });
    }

    loadFavorites();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Vyhledat film..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
        
        <FlatList
          horizontal
          data={allTags}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tagButton,
                selectedTags.includes(item) && styles.tagButtonSelected
              ]}
              onPress={() => toggleTag(item)}
            >
              <Text style={[
                styles.tagText,
                selectedTags.includes(item) && styles.tagTextSelected
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagList}
        />
      </View>

      <FlatList
        data={filteredMovies}
        renderItem={({ item }) => (
          <MovieCardLarge
            movie={item}
            isFavorite={favoriteMovies.includes(item.id)}
            onPress={() => setSelectedMovie(item)}
            onFavoritePress={async () => await toggleFavorite(item)}
          />
        )}
        contentContainerStyle={styles.movieList}
      />

      <MovieDetailModal
        movie={selectedMovie}
        visible={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onFavoriteChange={loadFavorites}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#000',
    backgroundColor: 'transparent',
  },
  tagList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  tagButtonSelected: {
    backgroundColor: Colors.light.tint,
  },
  tagText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: 'white',
  },
  movieList: {
    padding: 16,
  },
});
