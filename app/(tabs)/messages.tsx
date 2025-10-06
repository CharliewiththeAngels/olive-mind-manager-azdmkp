
import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

interface MessageData {
  id: string;
  eventId: string;
  message: string;
  date: string;
  sent: boolean;
}

export default function MessagesScreen() {
  console.log('MessagesScreen rendering...');
  
  const [messages, setMessages] = useState<MessageData[]>([]);

  useEffect(() => {
    console.log('MessagesScreen useEffect running...');
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      console.log('Loading messages from AsyncStorage...');
      const storedMessages = await AsyncStorage.getItem('olive_mind_messages');
      if (storedMessages) {
        const messagesData = JSON.parse(storedMessages);
        // Sort messages by date (newest first)
        messagesData.sort((a: MessageData, b: MessageData) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMessages(messagesData);
        console.log('Messages loaded:', messagesData.length, 'messages');
      } else {
        console.log('No messages found in storage');
      }
    } catch (error) {
      console.log('Error loading messages:', error);
    }
  };

  const markAsSent = async (messageId: string) => {
    try {
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, sent: true } : msg
      );
      setMessages(updatedMessages);
      await AsyncStorage.setItem('olive_mind_messages', JSON.stringify(updatedMessages));
      console.log('Message marked as sent');
    } catch (error) {
      console.log('Error marking message as sent:', error);
    }
  };

  const shareMessage = async (message: MessageData) => {
    try {
      await Share.share({
        message: message.message,
        title: 'Work Confirmation - Olive Mind Marketing',
      });
      await markAsSent(message.id);
    } catch (error) {
      console.log('Error sharing message:', error);
    }
  };

  const copyMessage = async (message: MessageData) => {
    try {
      await Clipboard.setStringAsync(message.message);
      Alert.alert('Copied!', 'Message copied to clipboard');
      await markAsSent(message.id);
    } catch (error) {
      console.log('Error copying message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-ZA', options);
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
              const updatedMessages = messages.filter(msg => msg.id !== messageId);
              setMessages(updatedMessages);
              await AsyncStorage.setItem('olive_mind_messages', JSON.stringify(updatedMessages));
              console.log('Message deleted');
            } catch (error) {
              console.log('Error deleting message:', error);
            }
          }
        }
      ]
    );
  };

  console.log('MessagesScreen about to render UI...');

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Messages - Olive Mind Marketing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
      )}
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Work Messages</Text>
          <Text style={styles.subtitle}>Generated confirmation messages</Text>
        </View>

        {messages.length > 0 ? (
          messages.map((message) => (
            <View key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <View style={styles.messageInfo}>
                  <Text style={styles.messageDate}>{formatDate(message.date)}</Text>
                  <View style={[
                    styles.statusBadge,
                    message.sent ? styles.sentBadge : styles.pendingBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      message.sent ? styles.sentText : styles.pendingText
                    ]}>
                      {message.sent ? 'Sent' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => deleteMessage(message.id)}
                  style={styles.deleteButton}
                >
                  <IconSymbol name="trash" size={20} color={colors.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.messageContent}>
                <Text style={styles.messageText} numberOfLines={6}>
                  {message.message}
                </Text>
              </View>

              <View style={styles.messageActions}>
                <TouchableOpacity
                  onPress={() => copyMessage(message)}
                  style={[styles.actionButton, styles.copyButton]}
                >
                  <IconSymbol name="doc.on.clipboard" size={18} color={colors.card} />
                  <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => shareMessage(message)}
                  style={[styles.actionButton, styles.shareButton]}
                >
                  <IconSymbol name="square.and.arrow.up" size={18} color={colors.card} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="envelope" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Messages Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create events in the Calendar tab to generate confirmation messages
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  messageCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messageInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageDate: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentBadge: {
    backgroundColor: colors.accent,
  },
  pendingBadge: {
    backgroundColor: colors.highlight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sentText: {
    color: colors.card,
  },
  pendingText: {
    color: colors.text,
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
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  copyButton: {
    backgroundColor: colors.primary,
  },
  shareButton: {
    backgroundColor: colors.accent,
  },
  actionButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
