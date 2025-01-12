import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Text, View } from '../../components/Themed';
import { UserNotification, UserProfile, getNotifications, clearNotifications, getUserProfile } from '../../utils/storage';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DeleteButton from '../../components/DeleteButton';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    const [notifs, profile] = await Promise.all([
      getNotifications(),
      getUserProfile()
    ]);
    
    setNotifications(notifs.sort((a, b) => b.timestamp - a.timestamp));
    setUserProfile(profile);
  };

  const handleClearNotifications = async () => {
    Alert.alert(
      'Smazat notifikace',
      'Opravdu chcete smazat všechny notifikace?',
      [
        {
          text: 'Zrušit',
          style: 'cancel',
        },
        {
          text: 'Smazat',
          style: 'destructive',
          onPress: async () => {
            await clearNotifications();
            setNotifications([]);
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('cs-CZ');
  };

  const renderNotification = ({ item }: { item: UserNotification }) => (
    <View style={styles.notificationItem}>
      <Ionicons
        name={item.type === 'add_favorite' ? 'star' : 'star-outline'}
        size={24}
        color={Colors.light.tint}
        style={styles.notificationIcon}
      />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>
          {item.type === 'add_favorite' ? 'Přidáno do oblíbených' : 'Odebráno z oblíbených'}
        </Text>
        <Text style={styles.movieTitle}>{item.movieTitle}</Text>
        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <>
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.notificationsList}
            ListFooterComponent={
              <DeleteButton
                onDelete={async ({ deleteNotifications }) => {
                  await clearNotifications();
                  setNotifications([]);
                }}
                showOptions={false}
                buttonText="Smazat všechny notifikace"
                style={styles.clearButton}
                textStyle={styles.clearButtonText}
              />
            }
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off" size={48} color="#666" />
          <Text style={styles.emptyStateText}>Žádné notifikace</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  movieTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  clearButton: {
    backgroundColor: '#dc3545',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
