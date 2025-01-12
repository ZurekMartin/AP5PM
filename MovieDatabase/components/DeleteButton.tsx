import React from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { DeleteButtonProps } from '../constants/types';

export default function DeleteButton({
  onDelete,
  showOptions = false,
  style,
  textStyle,
  buttonText = 'Smazat'
}: DeleteButtonProps) {
  const handlePress = () => {
    if (!showOptions) {
      onDelete({
        deleteNotifications: true,
        deleteSettings: false,
        deleteFavorites: false
      });
      return;
    }

    Alert.alert(
      'Potvrdit smazání',
      'Vyberte, co chcete smazat:',
      [
        {
            text: 'Zrušit',
            style: 'cancel',
        },
        {
          text: 'Smazat vše',
          style: 'destructive',
          onPress: async () => {
            await onDelete({
              deleteNotifications: true,
              deleteSettings: true,
              deleteFavorites: true,
            });
          },
        },
        {
            text: 'Pouze notifikace',
            onPress: async () => {
              await onDelete({
                deleteNotifications: true,
                deleteSettings: false,
                deleteFavorites: false,
              });
            },
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
    >
      <Ionicons name="trash-outline" size={20} color="white" style={styles.icon} />
      <Text style={[styles.buttonText, textStyle]}>{buttonText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    margin: 16,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
