
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RoleGuard from '@/components/RoleGuard';
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

export default function CalendarScreen() {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<{ [key: string]: EventData[] }>({});
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [formData, setFormData] = useState({
    promoters: '',
    venue: '',
    location: '',
    event: '',
    arrivalTime: '',
    duration: '',
    rate: '',
    brands: '',
    mechanic: '',
  });

  useEffect(() => {
    loadEvents();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        console.log('Events changed, reloading...');
        loadEvents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
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
            console.log('🚪 User confirmed logout from Calendar');
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

  const loadEvents = async () => {
    try {
      console.log('Loading events from Supabase...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      if (data) {
        console.log('Loaded events:', data.length);
        const groupedEvents: { [key: string]: EventData[] } = {};
        
        data.forEach((event) => {
          const eventData: EventData = {
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
          };

          if (!groupedEvents[event.date]) {
            groupedEvents[event.date] = [];
          }
          groupedEvents[event.date].push(eventData);
        });

        setEvents(groupedEvents);
      }
    } catch (error) {
      console.error('Error in loadEvents:', error);
    }
  };

  const onDayPress = (day: DateData) => {
    console.log('Day pressed:', day.dateString);
    setSelectedDate(day.dateString);
  };

  const openCreateEventModal = () => {
    console.log('Opening create event modal');
    setEditingEvent(null);
    setFormData({
      promoters: '',
      venue: '',
      location: '',
      event: '',
      arrivalTime: '',
      duration: '',
      rate: '',
      brands: '',
      mechanic: '',
    });
    setShowModal(true);
  };

  const openEditEventModal = (event: EventData) => {
    console.log('Opening edit event modal for:', event.id);
    setEditingEvent(event);
    setFormData({
      promoters: event.promoters,
      venue: event.venue,
      location: event.location,
      event: event.event,
      arrivalTime: event.arrivalTime,
      duration: event.duration,
      rate: event.rate,
      brands: event.brands,
      mechanic: event.mechanic,
    });
    setShowModal(true);
  };

  const createEvent = async () => {
    if (!selectedDate || !formData.promoters || !formData.event) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      console.log('Creating event for date:', selectedDate);
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          date: selectedDate,
          promoters: formData.promoters,
          venue: formData.venue,
          location: formData.location,
          event: formData.event,
          arrival_time: formData.arrivalTime,
          duration: formData.duration,
          rate: formData.rate,
          brands: formData.brands,
          mechanic: formData.mechanic,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        Alert.alert('Error', 'Failed to create event');
        return;
      }

      if (data) {
        console.log('Event created:', data.id);
        
        // Create message and payment entries
        await createMessage(data);
        await createPaymentEntries(data);
        
        setShowModal(false);
        await loadEvents();
      }
    } catch (error) {
      console.error('Error in createEvent:', error);
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const updateEvent = async () => {
    if (!editingEvent) return;

    try {
      console.log('Updating event:', editingEvent.id);
      
      const { error } = await supabase
        .from('events')
        .update({
          promoters: formData.promoters,
          venue: formData.venue,
          location: formData.location,
          event: formData.event,
          arrival_time: formData.arrivalTime,
          duration: formData.duration,
          rate: formData.rate,
          brands: formData.brands,
          mechanic: formData.mechanic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEvent.id);

      if (error) {
        console.error('Error updating event:', error);
        Alert.alert('Error', 'Failed to update event');
        return;
      }

      console.log('Event updated successfully');
      
      // Update message and payment entries
      await updateMessage(editingEvent.id);
      await updatePaymentEntries(editingEvent.id);
      
      setShowModal(false);
      await loadEvents();
    } catch (error) {
      console.error('Error in updateEvent:', error);
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const deleteEvent = async (event: EventData) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.event}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting event:', event.id);
              
              const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', event.id);

              if (error) {
                console.error('Error deleting event:', error);
                Alert.alert('Error', 'Failed to delete event');
                return;
              }

              console.log('Event deleted successfully');
              await loadEvents();
            } catch (error) {
              console.error('Error in deleteEvent:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const createMessage = async (event: any) => {
    const message = generateMessage(event);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          event_id: event.id,
          message: message,
          date: event.date,
          sent: false,
        });

      if (error) {
        console.error('Error creating message:', error);
      }
    } catch (error) {
      console.error('Error in createMessage:', error);
    }
  };

  const updateMessage = async (eventId: string) => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventData) {
        const message = generateMessage(eventData);
        
        const { error } = await supabase
          .from('messages')
          .update({ message: message, updated_at: new Date().toISOString() })
          .eq('event_id', eventId);

        if (error) {
          console.error('Error updating message:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateMessage:', error);
    }
  };

  const generateMessage = (event: any): string => {
    return `Good afternoon Miss ☀ Confirmation of work for Olive Mind Marketing

Promoters: ${event.promoters}
Venue: ${event.venue}
Location: ${event.location}
Event: ${event.event}
Date: ${formatDate(event.date)}
Arrival Time: ${event.arrival_time}
Duration: ${event.duration}
Rate: ${event.rate}
Brands: ${event.brands}

Mechanic: ${event.mechanic}

1 hour prior arrival is the call time and failure to arrive for call time will result to penalties.

Dress code: plain white top, blue denim jeans and white sneakers.

Grooming: Please ensure that you have light makeup no heavy eyeshadows please ensure that your hair neat straightened or tied neatly.

NB: Taking pictures of consumers with the products is essential
• A minimum of 15 pictures is needed.
• Please always ensure that your phone is fully charged and also bring a power bank or a charger.

How the promotion will work:
Ensure that your work station at all times is clean and presentable. There is a display showing stock and / or giveaways. Engage with each and every consumer in a professional and brand appropriate fashion. Convince consumers that our products are the ultimate brand of choice.`;
  };

  const createPaymentEntries = async (event: any) => {
    const promotersList = event.promoters.split('&').map((p: string) => p.trim());
    const durationMatch = event.duration.match(/\((\d+)\s*hours?\)/i);
    const hours = durationMatch ? parseInt(durationMatch[1]) : 0;
    const rateMatch = event.rate.match(/R?(\d+)/);
    const rate = rateMatch ? parseInt(rateMatch[1]) : 0;
    const totalAmount = hours * rate;

    try {
      const payments = promotersList.map((promoter: string) => ({
        event_id: event.id,
        promoters: promoter,
        event: event.event,
        date: event.date,
        hours: hours,
        rate: rate,
        total_amount: totalAmount,
        paid: false,
      }));

      const { error } = await supabase
        .from('payments')
        .insert(payments);

      if (error) {
        console.error('Error creating payment entries:', error);
      }
    } catch (error) {
      console.error('Error in createPaymentEntries:', error);
    }
  };

  const updatePaymentEntries = async (eventId: string) => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventData) {
        // Delete old payment entries
        await supabase
          .from('payments')
          .delete()
          .eq('event_id', eventId);

        // Create new payment entries
        await createPaymentEntries(eventData);
      }
    } catch (error) {
      console.error('Error in updatePaymentEntries:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    Object.keys(events).forEach((date) => {
      marked[date] = {
        marked: true,
        dotColor: colors.primary,
      };
    });
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
    }
    return marked;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Calendar',
          headerShown: false,
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerActions}>
          <RoleGuard allowedRoles={['manager']}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openCreateEventModal}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </RoleGuard>
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
      </View>

      <ScrollView style={styles.content}>
        <Calendar
          onDayPress={onDayPress}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: colors.background,
            calendarBackground: colors.background,
            textSectionTitleColor: colors.text,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: hexToRgba(colors.text, 0.3),
            dotColor: colors.primary,
            selectedDotColor: '#ffffff',
            arrowColor: colors.primary,
            monthTextColor: colors.text,
            indicatorColor: colors.primary,
          }}
        />

        {selectedDate && (
          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>
              Events for {formatDate(selectedDate)}
            </Text>
            {events[selectedDate] && events[selectedDate].length > 0 ? (
              events[selectedDate].map((event, index) => (
                <View key={index} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{event.event}</Text>
                    <RoleGuard allowedRoles={['manager']}>
                      <View style={styles.eventActions}>
                        <TouchableOpacity
                          onPress={() => openEditEventModal(event)}
                          style={styles.iconButton}
                        >
                          <IconSymbol
                            ios_icon_name="pencil"
                            android_material_icon_name="edit"
                            size={20}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deleteEvent(event)}
                          style={styles.iconButton}
                        >
                          <IconSymbol
                            ios_icon_name="trash"
                            android_material_icon_name="delete"
                            size={20}
                            color="#ff4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </RoleGuard>
                  </View>
                  <Text style={styles.eventDetail}>
                    <Text style={styles.eventLabel}>Promoters: </Text>
                    {event.promoters}
                  </Text>
                  <Text style={styles.eventDetail}>
                    <Text style={styles.eventLabel}>Venue: </Text>
                    {event.venue}
                  </Text>
                  <Text style={styles.eventDetail}>
                    <Text style={styles.eventLabel}>Location: </Text>
                    {event.location}
                  </Text>
                  <Text style={styles.eventDetail}>
                    <Text style={styles.eventLabel}>Time: </Text>
                    {event.arrivalTime}
                  </Text>
                  <Text style={styles.eventDetail}>
                    <Text style={styles.eventLabel}>Duration: </Text>
                    {event.duration}
                  </Text>
                  <Text style={styles.eventDetail}>
                    <Text style={styles.eventLabel}>Rate: </Text>
                    {event.rate}
                  </Text>
                  <Text style={styles.eventDetail}>
                    <Text style={styles.eventLabel}>Brands: </Text>
                    {event.brands}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noEvents}>No events scheduled for this day</Text>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEvent ? 'Edit Event' : 'Create Event'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Promoters *</Text>
              <TextInput
                style={styles.input}
                value={formData.promoters}
                onChangeText={(text) =>
                  setFormData({ ...formData, promoters: text })
                }
                placeholder="e.g., Jackie & Noluthando"
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
              />

              <Text style={styles.inputLabel}>Event Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.event}
                onChangeText={(text) => setFormData({ ...formData, event: text })}
                placeholder="e.g., Springboks vs Argentina"
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
              />

              <Text style={styles.inputLabel}>Venue</Text>
              <TextInput
                style={styles.input}
                value={formData.venue}
                onChangeText={(text) => setFormData({ ...formData, venue: text })}
                placeholder="e.g., King's Park Stadium"
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
              />

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
                placeholder="e.g., Jacko Jackson Dr, Stamford Hill"
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
              />

              <Text style={styles.inputLabel}>Arrival Time</Text>
              <TextInput
                style={styles.input}
                value={formData.arrivalTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, arrivalTime: text })
                }
                placeholder="e.g., 14:00"
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
              />

              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(text) =>
                  setFormData({ ...formData, duration: text })
                }
                placeholder="e.g., 15:00- 21:00 (6 hours)"
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
              />

              <Text style={styles.inputLabel}>Rate</Text>
              <TextInput
                style={styles.input}
                value={formData.rate}
                onChangeText={(text) => setFormData({ ...formData, rate: text })}
                placeholder="e.g., R100 per hour"
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
              />

              <Text style={styles.inputLabel}>Brands</Text>
              <TextInput
                style={styles.input}
                value={formData.brands}
                onChangeText={(text) => setFormData({ ...formData, brands: text })}
                placeholder="e.g., Klipdrift"
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
              />

              <Text style={styles.inputLabel}>Mechanic</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.mechanic}
                onChangeText={(text) =>
                  setFormData({ ...formData, mechanic: text })
                }
                placeholder="Describe the work mechanic..."
                placeholderTextColor={hexToRgba(colors.text, 0.5)}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editingEvent ? updateEvent : createEvent}
              >
                <Text style={styles.submitButtonText}>
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  eventsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: hexToRgba(colors.text, 0.05),
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  eventDetail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  eventLabel: {
    fontWeight: '600',
  },
  noEvents: {
    fontSize: 16,
    color: hexToRgba(colors.text, 0.5),
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(colors.text, 0.1),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: hexToRgba(colors.text, 0.05),
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: hexToRgba(colors.text, 0.1),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
