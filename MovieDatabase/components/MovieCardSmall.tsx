import React from 'react';
import { StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Text, View } from './Themed';
import { Movie, MovieCardSmallProps } from '../constants/types';
import { MovieTag } from './MovieTag';

export default function MovieCardSmall({ movie, onPress }: MovieCardSmallProps) {
  return (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: movie.image }} style={styles.movieImage} />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
        <View style={styles.tagsContainer}>
          {movie.tags.map((tag, index) => (
            <MovieTag key={index} tag={tag} />
          ))}
        </View>
        <Text style={styles.movieDate}>
          {new Date(movie.releaseDate).toLocaleDateString('cs-CZ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  movieDate: {
    fontSize: 14,
    color: '#666',
  },
});
