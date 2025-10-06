
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
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MessageData {
  id: string;
  eventId: string;
  message: string;
  date: string;
  sent: boolean;
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('olive_mind_messages');
      if (storedMessages) {
        const messagesData = JSON.parse(storedMessages);
        // Sort messages by date (newest first)
        messagesData.sort((a: MessageData, b: MessageData) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMessages(messagesData);
      }
    } catch (error) {
      console.log('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsSent = async (messageId: string) => {
    try {
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, sent: true } : msg
      );
      setMessages(updatedMessages);
      await AsyncStorage.setItem('olive_mind_messages', JSON.stringify(updatedMessages));
    } catch (error) {
      console.log('Error updating message:', error);
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
      Alert.alert('Copied', 'Message copied to clipboard');
      await markAsSent(message.id);
    } catch (error) {
      console.log('Error copying message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
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
            } catch (error) {
              console.log('Error deleting message:', error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.subtitle}>Generated messages for your events</Text>
        </View>

        {messages.length > 0 ? (
          messages.map((message) => (
            <View key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot, 
                    { backgroundColor: message.sent ? colors.accent : colors.secondary }
                  ]} />
                  <Text style={styles.statusText}>
                    {message.sent ? 'Sent' : 'Draft'}
                  </Text>
                </View>
                <Text style={styles.messageDate}>{formatDate(message.date)}</Text>
              </View>

              <View style={styles.messageContent}>
                <Text style={styles.messageText}>{message.message}</Text>
              </View>

              <View style={styles.messageActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.shareButton]}
                  onPress={() => shareMessage(message)}
                >
                  <IconSymbol name="square.and.arrow.up" size={16} color={colors.card} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.copyButton]}
                  onPress={() => copyMessage(message)}
                >
                  <IconSymbol name="doc.on.doc" size={16} color={colors.primary} />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteMessage(message.id)}
                >
                  <IconSymbol name="trash" size={16} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <IconSymbol name="envelope" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Messages Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create events in the Calendar tab to generate messages automatically
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    borderRadius: 12,
    margin: 16,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  messageDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageContent: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shareButton: {
    backgroundColor: colors.primary,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  shareButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  copyButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  copyButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
