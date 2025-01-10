// User/Profile related types
export interface Profile {
  // Core Identity
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  
  // Profile Information
  avatar_url: string | null;
  bio: string | null;
  title: string | null;
  timezone: string | null;
  
  // Status & Presence
  status: 'online' | 'offline' | 'away' | 'busy';
  custom_status: string | null;
  last_seen_at: string;
  
  // Preferences
  notification_preferences: {
    email_notifications: boolean;
    desktop_notifications: boolean;
    mobile_notifications: boolean;
    mention_notifications: boolean;
  };
  theme_preference: 'light' | 'dark' | 'system';
  
  // Metadata
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  is_admin: boolean;
}

// Channel related types
export interface Channel {
  id: string;
  name: string;
  description: string | null;
  type: 'public' | 'private' | 'direct';
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_archived: boolean;
  settings: {
    notifications: boolean;
    pinned_messages: string[];
    default_thread_notifications: boolean;
  };
  metadata: Record<string, unknown>;
  // Joined data
  members?: {
    profile_id: string;
    profile: {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
      status: 'online' | 'offline' | 'away' | 'busy';
      last_seen_at: string;
    };
  }[];
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  profile_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  settings: {
    notifications: boolean;
    thread_notifications: boolean;
    mention_notifications: boolean;
  };
  metadata: Record<string, any>;
  // Joined data
  profile?: Profile;
}

// Message related types
export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  parent_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, any>;
  // Joined data
  sender?: Profile;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageMap {
  message: Message;
  children: Map<string, MessageMap>;
} 

export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

// Auth related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
  full_name: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Socket Event types
export interface TypingEvent {
  profile_id: string;
  channel_id: string;
}

export interface MessageEvent {
  message: Message;
  channel_id: string;
}

// Component Prop types
export interface ChannelListProps {
  channels: Channel[];
}

export interface ChatAreaProps {
  channelId: string;
}

export interface MessageItemProps {
  message: Message;
  isThread?: boolean;
} 