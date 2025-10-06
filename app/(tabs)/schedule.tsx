
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  console.log('ScheduleScreen rendering...');
  
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    console.log('ScheduleScreen useEffect running...');
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      console.log('Loading schedule from AsyncStorage...');
      const storedEvents = await AsyncStorage.getItem('olive_mind_events');
      if (storedEvents) {
        const eventsData = JSON.parse(storedEvents);
        const allEvents: EventData[] = [];
        
        // Flatten all events from all dates
        Object.values(eventsData).forEach((dayEvents: any) => {
          if (Array.isArray(dayEvents)) {
            allEvents.push(...dayEvents);
          }
        });
        
        // Sort events by date
        allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(allEvents);
        console.log('Schedule loaded:', allEvents.length, 'events');
      } else {
        console.log('No schedule found in storage');
      }
    } catch (error) {
      console.log('Error loading schedule:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-ZA', options);
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-ZA', options);
  };

  const isUpcoming = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  const upcomingEvents = events.filter(event => isUpcoming(event.date));
  const pastEvents = events.filter(event => !isUpcoming(event.date));

  console.log('ScheduleScreen about to render UI...');

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Schedule - Olive Mind Marketing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
      )}
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Work Schedule</Text>
          <Text style={styles.subtitle}>Your upcoming and past events</Text>
        </View>

        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {upcomingEvents.map((event) => (
              <View key={event.id} style={[styles.eventCard, styles.upcomingCard]}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.event}</Text>
                  <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                </View>
                <Text style={styles.eventVenue}>{event.venue}</Text>
                <Text style={styles.eventDetail}>Promoters: {event.promoters}</Text>
                <Text style={styles.eventDetail}>Arrival: {event.arrivalTime}</Text>
                <Text style={styles.eventDetail}>Duration: {event.duration}</Text>
                <Text style={styles.eventDetail}>Rate: {event.rate}</Text>
                {event.brands && (
                  <Text style={styles.eventDetail}>Brands: {event.brands}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {pastEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Events</Text>
            {pastEvents.map((event) => (
              <View key={event.id} style={[styles.eventCard, styles.pastCard]}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, styles.pastEventTitle]}>{event.event}</Text>
                  <Text style={[styles.eventDate, styles.pastEventDate]}>{formatDate(event.date)}</Text>
                </View>
                <Text style={[styles.eventVenue, styles.pastEventText]}>{event.venue}</Text>
                <Text style={[styles.eventDetail, styles.pastEventText]}>Promoters: {event.promoters}</Text>
                <Text style={[styles.eventDetail, styles.pastEventText]}>Arrival: {event.arrivalTime}</Text>
                <Text style={[styles.eventDetail, styles.pastEventText]}>Duration: {event.duration}</Text>
                <Text style={[styles.eventDetail, styles.pastEventText]}>Rate: {event.rate}</Text>
                {event.brands && (
                  <Text style={[styles.eventDetail, styles.pastEventText]}>Brands: {event.brands}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {events.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Events Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Create events in the Calendar tab to see them here
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
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  upcomingCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  pastCard: {
    backgroundColor: colors.card,
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.textSecondary,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
    marginRight: 8,
  },
  pastEventTitle: {
    color: colors.textSecondary,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  pastEventDate: {
    color: colors.textSecondary,
  },
  eventVenue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  pastEventText: {
    color: colors.textSecondary,
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
