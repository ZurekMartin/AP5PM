export interface Movie {
  id: string;
  title: string;
  image: string;
  tags: string[];
  description: string;
  releaseDate: string;
  isFavorite?: boolean;
}

export interface MovieDetailModalProps {
  movie: Movie | null;
  visible: boolean;
  onClose: () => void;
  onFavoriteChange?: () => void;
}

export interface MovieCardLargeProps {
  movie: {
    id: string;
    title: string;
    image: string;
    tags: string[];
  };
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => Promise<void>;
}

export interface MovieCardSmallProps {
  movie: Movie;
  onPress: () => void;
}

export interface MovieTagProps {
  tag: string;
  style?: object;
  textStyle?: object;
}

export interface UserProfile {
  name: string;
  notificationsEnabled: boolean;
  avatarUrl: string;
}

export interface UserNotification {
  id: string;
  type: 'add_favorite' | 'remove_favorite';
  movieId: string;
  movieTitle: string;
  timestamp: number;
}

export interface DeleteButtonProps {
  onDelete: (options: {
    deleteNotifications: boolean;
    deleteSettings: boolean;
    deleteFavorites: boolean;
  }) => Promise<void>;
  showOptions?: boolean;
  style?: object;
  textStyle?: object;
  buttonText?: string;
} 