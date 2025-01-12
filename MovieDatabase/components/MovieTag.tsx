import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from './Themed';
import { MovieTagProps } from '../constants/types';

export function MovieTag({ tag, style, textStyle }: MovieTagProps) {
  return (
    <Text style={[styles.tag, style, textStyle]}>{tag}</Text>
  );
}

const styles = StyleSheet.create({
  tag: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
});
