
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

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

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function ScheduleScreen() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    loadSchedule();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('schedule_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        console.log('Schedule changed, reloading...');
        loadSchedule();
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
            console.log('🚪 User confirmed logout from Schedule');
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

  const loadSchedule = async () => {
    try {
      console.log('Loading schedule from Supabase...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading schedule:', error);
        return;
      }

      if (data) {
        console.log('Loaded schedule events:', data.length);
        const eventsData: EventData[] = data.map((event) => ({
          id: event.id,
          date: event.date,
          promoters: event.promoters,
          venue: event.venue,
          location: event.location,
          event: event.event,
          arrivalTime: event.arrival_time,
          duration: event.duration,
          rate: event.rate,
          brands: event.brands,
          mechanic: event.mechanic,
        }));
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error in loadSchedule:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isUpcoming = (dateString: string): boolean => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  const getDaysUntilEvent = (dateString: string): number => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingEvents = events.filter((event) => isUpcoming(event.date));
  const pastEvents = events.filter((event) => !isUpcoming(event.date));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Schedule',
          headerShown: false,
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
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
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {upcomingEvents.map((event, index) => {
              const daysUntil = getDaysUntilEvent(event.date);
              return (
                <View key={index} style={styles.eventCard}>
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateBadgeText}>{formatDate(event.date)}</Text>
                  </View>

                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.event}</Text>
                    <Text style={styles.eventDate}>{formatFullDate(event.date)}</Text>

                    {daysUntil === 0 && (
                      <View style={styles.todayBadge}>
                        <IconSymbol
                          ios_icon_name="calendar.badge.clock"
                          android_material_icon_name="today"
                          size={16}
                          color="#fff"
                        />
                        <Text style={styles.todayBadgeText}>Today</Text>
                      </View>
                    )}

                    {daysUntil === 1 && (
                      <View style={styles.tomorrowBadge}>
                        <IconSymbol
                          ios_icon_name="calendar"
                          android_material_icon_name="event"
                          size={16}
                          color="#fff"
                        />
                        <Text style={styles.tomorrowBadgeText}>Tomorrow</Text>
                      </View>
                    )}

                    {daysUntil > 1 && (
                      <Text style={styles.daysUntil}>In {daysUntil} days</Text>
                    )}

                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetailRow}>
                        <IconSymbol
                          ios_icon_name="person.2"
                          android_material_icon_name="people"
                          size={16}
                          color={hexToRgba(colors.text, 0.6)}
                        />
                        <Text style={styles.eventDetailText}>{event.promoters}</Text>
                      </View>

                      <View style={styles.eventDetailRow}>
                        <IconSymbol
                          ios_icon_name="mappin"
                          android_material_icon_name="place"
                          size={16}
                          color={hexToRgba(colors.text, 0.6)}
                        />
                        <Text style={styles.eventDetailText}>{event.venue}</Text>
                      </View>

                      <View style={styles.eventDetailRow}>
                        <IconSymbol
                          ios_icon_name="clock"
                          android_material_icon_name="schedule"
                          size={16}
                          color={hexToRgba(colors.text, 0.6)}
                        />
                        <Text style={styles.eventDetailText}>
                          {event.arrivalTime} • {event.duration}
                        </Text>
                      </View>

                      <View style={styles.eventDetailRow}>
                        <IconSymbol
                          ios_icon_name="tag"
                          android_material_icon_name="label"
                          size={16}
                          color={hexToRgba(colors.text, 0.6)}
                        />
                        <Text style={styles.eventDetailText}>{event.brands}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {pastEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Events</Text>
            {pastEvents.map((event, index) => (
              <View key={index} style={[styles.eventCard, styles.pastEventCard]}>
                <View style={[styles.eventDateBadge, styles.pastEventDateBadge]}>
                  <Text style={styles.eventDateBadgeText}>{formatDate(event.date)}</Text>
                </View>

                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.event}</Text>
                  <Text style={styles.eventDate}>{formatFullDate(event.date)}</Text>

                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <IconSymbol
                        ios_icon_name="person.2"
                        android_material_icon_name="people"
                        size={16}
                        color={hexToRgba(colors.text, 0.6)}
                      />
                      <Text style={styles.eventDetailText}>{event.promoters}</Text>
                    </View>

                    <View style={styles.eventDetailRow}>
                      <IconSymbol
                        ios_icon_name="mappin"
                        android_material_icon_name="place"
                        size={16}
                        color={hexToRgba(colors.text, 0.6)}
                      />
                      <Text style={styles.eventDetailText}>{event.venue}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {events.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={64}
              color={hexToRgba(colors.text, 0.3)}
            />
            <Text style={styles.emptyStateText}>No events scheduled</Text>
            <Text style={styles.emptyStateSubtext}>
              Events will appear here when you create them in the calendar
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
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: hexToRgba(colors.text, 0.05),
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: hexToRgba(colors.primary, 0.2),
  },
  pastEventCard: {
    borderColor: hexToRgba(colors.text, 0.1),
    opacity: 0.7,
  },
  eventDateBadge: {
    backgroundColor: colors.primary,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  pastEventDateBadge: {
    backgroundColor: hexToRgba(colors.text, 0.3),
  },
  eventDateBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: hexToRgba(colors.text, 0.6),
    marginBottom: 12,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  todayBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  tomorrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tomorrowBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  daysUntil: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: hexToRgba(colors.text, 0.8),
    flex: 1,
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
    paddingHorizontal: 40,
  },
});
