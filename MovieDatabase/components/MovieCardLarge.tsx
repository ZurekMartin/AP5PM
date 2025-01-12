import React from 'react';
import { StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { MovieTag } from './MovieTag';
import { MovieCardLargeProps } from '../constants/types';

export default function MovieCardLarge({ movie, isFavorite, onPress, onFavoritePress }: MovieCardLargeProps) {
  return (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={async (e) => {
          e.stopPropagation();
          await onFavoritePress();
        }}
      >
        <Ionicons
          name={isFavorite ? 'star' : 'star-outline'}
          size={20}
          color={isFavorite ? Colors.light.tint : '#666'}
        />
      </TouchableOpacity>
      <Image source={{ uri: movie.image }} style={styles.movieImage} />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
        <View style={styles.tagsContainer}>
          {movie.tags.map((tag, index) => (
            <MovieTag key={index} tag={tag} />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  movieCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
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
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  movieInfo: {
    padding: 16,
    backgroundColor: 'white',
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    marginTop: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 16,
  },
});