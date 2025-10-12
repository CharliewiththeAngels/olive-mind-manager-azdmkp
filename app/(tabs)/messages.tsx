
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import * as Clipboard from 'expo-clipboard';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';

interface MessageData {
  id: string;
  eventId: string;
  message: string;
  date: string;
  sent: boolean;
}

export default function MessagesScreen() {
  const { user, isManager } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      console.log('Loading messages from storage...');
      const storedMessages = await AsyncStorage.getItem('@messages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        console.log('Loaded messages:', parsedMessages.length);
        setMessages(parsedMessages.sort((a: MessageData, b: MessageData) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsSent = async (messageId: string) => {
    if (!isManager()) {
      Alert.alert('Access Denied', 'Only managers can mark messages as sent.');
      return;
    }

    try {
      console.log('Marking message as sent:', messageId);
      const updatedMessages = messages.map(message =>
        message.id === messageId ? { ...message, sent: true } : message
      );
      
      setMessages(updatedMessages);
      await AsyncStorage.setItem('@messages', JSON.stringify(updatedMessages));
      
      Alert.alert('Success', 'Message marked as sent!');
    } catch (error) {
      console.error('Error updating message:', error);
      Alert.alert('Error', 'Failed to update message status');
    }
  };

  const shareMessage = async (message: MessageData) => {
    try {
      console.log('Sharing message:', message.id);
      await Share.share({
        message: message.message,
        title: 'Work Confirmation - Olive Mind Marketing',
      });
      
      if (isManager()) {
        // Automatically mark as sent when shared
        await markAsSent(message.id);
      }
    } catch (error) {
      console.error('Error sharing message:', error);
      Alert.alert('Error', 'Failed to share message');
    }
  };

  const copyMessage = async (message: MessageData) => {
    try {
      console.log('Copying message to clipboard:', message.id);
      await Clipboard.setStringAsync(message.message);
      Alert.alert('Copied', 'Message copied to clipboard!');
    } catch (error) {
      console.error('Error copying message:', error);
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const deleteMessage = async (messageId: string) => {
    if (!isManager()) {
      Alert.alert('Access Denied', 'Only managers can delete messages.');
      return;
    }

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting message:', messageId);
              const updatedMessages = messages.filter(message => message.id !== messageId);
              setMessages(updatedMessages);
              await AsyncStorage.setItem('@messages', JSON.stringify(updatedMessages));
              Alert.alert('Success', 'Message deleted!');
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Messages',
          headerShown: true,
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
        }} 
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Event Messages</Text>
        <Text style={styles.subtitle}>
          {isManager() ? 'Send confirmation messages to workers' : 'View event messages'}
        </Text>
        <View style={styles.roleIndicator}>
          <IconSymbol 
            name={isManager() ? "crown" : "eye"} 
            size={16} 
            color={isManager() ? colors.primary : colors.accent} 
          />
          <Text style={styles.roleText}>
            {isManager() ? 'Manager - Can Edit' : 'Supervisor - View Only'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="envelope" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Messages Yet</Text>
            <Text style={styles.emptyMessage}>
              Messages will appear here when you create events in the calendar
            </Text>
          </View>
        ) : (
          messages.map((message, index) => (
            <View key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <View style={styles.messageInfo}>
                  <Text style={styles.messageDate}>{formatDate(message.date)}</Text>
                  <View style={[styles.statusBadge, message.sent ? styles.sentBadge : styles.unsentBadge]}>
                    <IconSymbol 
                      name={message.sent ? "check-circle" : "clock"} 
                      size={14} 
                      color={message.sent ? colors.card : colors.secondary} 
                    />
                    <Text style={[styles.statusText, message.sent ? styles.sentText : styles.unsentText]}>
                      {message.sent ? 'Sent' : 'Not Sent'}
                    </Text>
                  </View>
                </View>
                
                <RoleGuard allowedRoles={['manager']} showMessage={false}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteMessage(message.id)}
                  >
                    <IconSymbol name="trash" size={16} color={colors.secondary} />
                  </TouchableOpacity>
                </RoleGuard>
              </View>

              <View style={styles.messageContent}>
                <Text style={styles.messageText}>{message.message}</Text>
              </View>

              <View style={styles.messageActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => copyMessage(message)}
                >
                  <IconSymbol name="copy" size={16} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => shareMessage(message)}
                >
                  <IconSymbol name="share" size={16} color={colors.accent} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>

                <RoleGuard allowedRoles={['manager']} showMessage={false}>
                  {!message.sent && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.markSentButton]}
                      onPress={() => markAsSent(message.id)}
                    >
                      <IconSymbol name="check" size={16} color={colors.card} />
                      <Text style={[styles.actionButtonText, styles.markSentText]}>Mark Sent</Text>
                    </TouchableOpacity>
                  )}
                </RoleGuard>
              </View>
            </View>
          ))
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
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sentBadge: {
    backgroundColor: colors.primary,
  },
  unsentBadge: {
    backgroundColor: colors.secondary + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  sentText: {
    color: colors.card,
  },
  unsentText: {
    color: colors.secondary,
  },
  deleteButton: {
    padding: 4,
  },
  messageContent: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  markSentButton: {
    backgroundColor: colors.primary,
  },
  markSentText: {
    color: colors.card,
  },
});
