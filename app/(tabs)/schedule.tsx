
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
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem('olive_mind_events');
      if (storedEvents) {
        const eventsData = JSON.parse(storedEvents);
        // Flatten the events object into an array and sort by date
        const allEvents: EventData[] = [];
        Object.keys(eventsData).forEach(date => {
          eventsData[date].forEach((event: EventData) => {
            allEvents.push(event);
          });
        });
        
        // Sort events by date
        allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(allEvents);
      }
    } catch (error) {
      console.log('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={styles.sectionHeader}>
              <IconSymbol name="clock" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            
            {upcomingEvents.map((event) => (
              <View key={event.id} style={[styles.eventCard, styles.upcomingCard]}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.event}</Text>
                  <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                </View>
                
                <View style={styles.eventDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="location" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{event.venue}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol name="person.2" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{event.promoters}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol name="clock" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{event.arrivalTime} - {event.duration}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol name="dollarsign" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{event.rate}</Text>
                  </View>
                  
                  {event.brands && (
                    <View style={styles.detailRow}>
                      <IconSymbol name="tag" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{event.brands}</Text>
                    </View>
                  )}
                </View>
                
                {event.location && (
                  <Text style={styles.locationText}>{event.location}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {pastEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="checkmark.circle" size={20} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Past Events</Text>
            </View>
            
            {pastEvents.map((event) => (
              <View key={event.id} style={[styles.eventCard, styles.pastCard]}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: colors.textSecondary }]}>{event.event}</Text>
                  <Text style={[styles.eventDate, { color: colors.textSecondary }]}>{formatDate(event.date)}</Text>
                </View>
                
                <View style={styles.eventDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="location" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{event.venue}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol name="person.2" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{event.promoters}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {events.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="calendar" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Events Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Create your first event in the Calendar tab to see it here
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
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  upcomingCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  pastCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.textSecondary,
    opacity: 0.7,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
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
