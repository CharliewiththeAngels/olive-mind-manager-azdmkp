
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

interface EventData {
  id: string;
  date: string;
  promoters: string;
  venue: string;
  location: string;
  event: string;
  arrivalTime: string;
  duration: string;
  rate: string;
  brands: string;
  mechanic: string;
}

export default function ScheduleScreen() {
  const { user, isManager } = useAuth();
  const [events, setEvents] = useState<{ [key: string]: EventData[] }>({});
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      console.log('Loading schedule from storage...');
      const storedEvents = await AsyncStorage.getItem('@events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        console.log('Loaded events for schedule:', Object.keys(parsedEvents).length, 'dates');
        setEvents(parsedEvents);
        
        // Filter and sort upcoming events
        const allEvents: EventData[] = [];
        Object.values(parsedEvents).forEach((dayEvents: EventData[]) => {
          allEvents.push(...dayEvents);
        });
        
        const upcoming = allEvents
          .filter(event => isUpcoming(event.date))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        console.log('Upcoming events:', upcoming.length);
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isUpcoming = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  const getDaysUntilEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return `In ${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Schedule',
          headerShown: true,
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
        }} 
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Event Schedule</Text>
        <Text style={styles.subtitle}>Upcoming events and activities</Text>
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

      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
        {upcomingEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="clock" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Upcoming Events</Text>
            <Text style={styles.emptyMessage}>
              {isManager() 
                ? 'Create events in the calendar to see them here' 
                : 'Upcoming events will appear here when scheduled'
              }
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Upcoming Events</Text>
              <Text style={styles.summaryCount}>{upcomingEvents.length}</Text>
            </View>

            {upcomingEvents.map((event, index) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventDateInfo}>
                    <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                    <Text style={styles.eventCountdown}>{getDaysUntilEvent(event.date)}</Text>
                  </View>
                  <View style={styles.eventStatus}>
                    <IconSymbol 
                      name={getDaysUntilEvent(event.date) === 'Today' ? "exclamation-circle" : "clock"} 
                      size={20} 
                      color={getDaysUntilEvent(event.date) === 'Today' ? colors.secondary : colors.primary} 
                    />
                  </View>
                </View>

                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.event}</Text>
                  <Text style={styles.eventVenue}>{event.venue}</Text>
                  
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <IconSymbol name="users" size={16} color={colors.textSecondary} />
                      <Text style={styles.eventDetailText}>Promoters: {event.promoters}</Text>
                    </View>
                    
                    <View style={styles.eventDetailRow}>
                      <IconSymbol name="clock" size={16} color={colors.textSecondary} />
                      <Text style={styles.eventDetailText}>Time: {event.arrivalTime}</Text>
                    </View>
                    
                    <View style={styles.eventDetailRow}>
                      <IconSymbol name="hourglass" size={16} color={colors.textSecondary} />
                      <Text style={styles.eventDetailText}>Duration: {event.duration}</Text>
                    </View>
                    
                    {event.brands && (
                      <View style={styles.eventDetailRow}>
                        <IconSymbol name="tag" size={16} color={colors.textSecondary} />
                        <Text style={styles.eventDetailText}>Brands: {event.brands}</Text>
                      </View>
                    )}
                    
                    <View style={styles.eventDetailRow}>
                      <IconSymbol name="banknotes" size={16} color={colors.textSecondary} />
                      <Text style={styles.eventDetailText}>Rate: R{event.rate}/hour</Text>
                    </View>
                  </View>

                  {event.location && (
                    <View style={styles.locationContainer}>
                      <IconSymbol name="map-pin" size={16} color={colors.accent} />
                      <Text style={styles.locationText}>{event.location}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
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
  scheduleContainer: {
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
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.card,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventDateInfo: {
    flex: 1,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  eventCountdown: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  eventStatus: {
    padding: 4,
  },
  eventContent: {
    gap: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  eventVenue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  eventDetails: {
    gap: 6,
    marginTop: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});
