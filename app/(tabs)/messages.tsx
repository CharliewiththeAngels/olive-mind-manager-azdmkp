
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import * as Clipboard from 'expo-clipboard';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RoleGuard from '@/components/RoleGuard';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

interface MessageData {
  id: string;
  eventId: string;
  message: string;
  date: string;
  sent: boolean;
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function MessagesScreen() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);

  useEffect(() => {
    loadMessages();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        console.log('Messages changed, reloading...');
        loadMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 User confirmed logout from Messages');
            try {
              await logout();
              console.log('✅ Logout completed, navigating to login screen');
              router.replace('/login');
            } catch (error: any) {
              console.error('❌ Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const loadMessages = async () => {
    try {
      console.log('Loading messages from Supabase...');
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (data) {
        console.log('Loaded messages:', data.length);
        const messagesData: MessageData[] = data.map((msg) => ({
          id: msg.id,
          eventId: msg.event_id || '',
          message: msg.message,
          date: msg.date,
          sent: msg.sent,
        }));
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  };

  const markAsSent = async (messageId: string) => {
    try {
      console.log('Marking message as sent:', messageId);
      const { error } = await supabase
        .from('messages')
        .update({ sent: true, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as sent:', error);
        Alert.alert('Error', 'Failed to update message status');
        return;
      }

      await loadMessages();
    } catch (error) {
      console.error('Error in markAsSent:', error);
      Alert.alert('Error', 'Failed to update message status');
    }
  };

  const shareMessage = async (message: MessageData) => {
    try {
      console.log('Sharing message:', message.id);
      await Share.share({
        message: message.message,
      });
      await markAsSent(message.id);
    } catch (error) {
      console.error('Error sharing message:', error);
    }
  };

  const copyMessage = async (message: MessageData) => {
    try {
      console.log('Copying message:', message.id);
      await Clipboard.setStringAsync(message.message);
      Alert.alert('Success', 'Message copied to clipboard');
      await markAsSent(message.id);
    } catch (error) {
      console.error('Error copying message:', error);
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting message:', messageId);
              const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

              if (error) {
                console.error('Error deleting message:', error);
                Alert.alert('Error', 'Failed to delete message');
                return;
              }

              await loadMessages();
            } catch (error) {
              console.error('Error in deleteMessage:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerShown: false,
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <IconSymbol
            ios_icon_name="rectangle.portrait.and.arrow.right"
            android_material_icon_name="logout"
            size={20}
            color="#FF3B30"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageCard,
                message.sent && styles.messageCardSent,
              ]}
            >
              <View style={styles.messageHeader}>
                <View style={styles.messageHeaderLeft}>
                  <Text style={styles.messageDate}>{formatDate(message.date)}</Text>
                  {message.sent && (
                    <View style={styles.sentBadge}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={16}
                        color="#4CAF50"
                      />
                      <Text style={styles.sentText}>Sent</Text>
                    </View>
                  )}
                </View>
                <RoleGuard allowedRoles={['manager']}>
                  <TouchableOpacity
                    onPress={() => deleteMessage(message.id)}
                    style={styles.deleteButton}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20}
                      color="#ff4444"
                    />
                  </TouchableOpacity>
                </RoleGuard>
              </View>

              <ScrollView style={styles.messageContent}>
                <Text style={styles.messageText}>{message.message}</Text>
              </ScrollView>

              <View style={styles.messageActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => copyMessage(message)}
                >
                  <IconSymbol
                    ios_icon_name="doc.on.doc"
                    android_material_icon_name="content_copy"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => shareMessage(message)}
                >
                  <IconSymbol
                    ios_icon_name="square.and.arrow.up"
                    android_material_icon_name="share"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonTextPrimary}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="envelope"
              android_material_icon_name="mail"
              size={64}
              color={hexToRgba(colors.text, 0.3)}
            />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Messages will appear here when you create events
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(colors.text, 0.1),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutButton: {
    backgroundColor: hexToRgba('#FF3B30', 0.1),
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: hexToRgba('#FF3B30', 0.3),
  },
  content: {
    flex: 1,
    padding: 20,
  },
  messageCard: {
    backgroundColor: hexToRgba(colors.text, 0.05),
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  messageCardSent: {
    borderColor: hexToRgba('#4CAF50', 0.3),
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  messageDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: hexToRgba('#4CAF50', 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  messageContent: {
    maxHeight: 200,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: hexToRgba(colors.text, 0.05),
    borderWidth: 1,
    borderColor: hexToRgba(colors.text, 0.1),
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: hexToRgba(colors.text, 0.5),
    marginTop: 8,
    textAlign: 'center',
  },
});
