
import React, { useState, useEffect } from 'react';
import { Calendar, DateData } from 'react-native-calendars';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';

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
  const { user, isManager } = useAuth();
  const [events, setEvents] = useState<{ [key: string]: EventData[] }>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<EventData>>({
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
  }, []);

  const loadEvents = async () => {
    try {
      console.log('Loading events from storage...');
      const storedEvents = await AsyncStorage.getItem('@events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        console.log('Loaded events:', Object.keys(parsedEvents).length, 'dates');
        setEvents(parsedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const saveEvents = async (newEvents: { [key: string]: EventData[] }) => {
    try {
      console.log('Saving events to storage...');
      await AsyncStorage.setItem('@events', JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  const onDayPress = (day: DateData) => {
    console.log('Day pressed:', day.dateString);
    setSelectedDate(day.dateString);
  };

  const openCreateEventModal = () => {
    if (!isManager()) {
      Alert.alert('Access Denied', 'Only managers can create events.');
      return;
    }
    setEditingEvent(null);
    setNewEvent({
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
    setShowEventModal(true);
  };

  const openEditEventModal = (event: EventData) => {
    if (!isManager()) {
      Alert.alert('Access Denied', 'Only managers can edit events.');
      return;
    }
    setEditingEvent(event);
    setNewEvent({
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
    setShowEventModal(true);
  };

  const createEvent = async () => {
    if (!selectedDate || !newEvent.promoters || !newEvent.venue || !newEvent.event) {
      Alert.alert('Error', 'Please fill in all required fields (Promoters, Venue, Event)');
      return;
    }

    const eventId = Date.now().toString();
    const eventData: EventData = {
      id: eventId,
      date: selectedDate,
      promoters: newEvent.promoters || '',
      venue: newEvent.venue || '',
      location: newEvent.location || '',
      event: newEvent.event || '',
      arrivalTime: newEvent.arrivalTime || '',
      duration: newEvent.duration || '',
      rate: newEvent.rate || '',
      brands: newEvent.brands || '',
      mechanic: newEvent.mechanic || '',
    };

    console.log('Creating new event:', eventData);

    const updatedEvents = { ...events };
    if (!updatedEvents[selectedDate]) {
      updatedEvents[selectedDate] = [];
    }
    updatedEvents[selectedDate].push(eventData);

    await saveEvents(updatedEvents);
    await generateMessage(eventData);
    await createPaymentEntries(eventData);

    setShowEventModal(false);
    Alert.alert('Success', 'Event created successfully!');
  };

  const updateEvent = async () => {
    if (!editingEvent || !newEvent.promoters || !newEvent.venue || !newEvent.event) {
      Alert.alert('Error', 'Please fill in all required fields (Promoters, Venue, Event)');
      return;
    }

    console.log('Updating event:', editingEvent.id);

    const updatedEventData: EventData = {
      ...editingEvent,
      promoters: newEvent.promoters || '',
      venue: newEvent.venue || '',
      location: newEvent.location || '',
      event: newEvent.event || '',
      arrivalTime: newEvent.arrivalTime || '',
      duration: newEvent.duration || '',
      rate: newEvent.rate || '',
      brands: newEvent.brands || '',
      mechanic: newEvent.mechanic || '',
    };

    const updatedEvents = { ...events };
    const dateEvents = updatedEvents[editingEvent.date] || [];
    const eventIndex = dateEvents.findIndex(e => e.id === editingEvent.id);
    
    if (eventIndex !== -1) {
      dateEvents[eventIndex] = updatedEventData;
      updatedEvents[editingEvent.date] = dateEvents;
      await saveEvents(updatedEvents);

      // Update related message
      await updateMessage(updatedEventData);
      
      // Update related payments
      await updatePaymentEntries(updatedEventData);

      setShowEventModal(false);
      Alert.alert('Success', 'Event updated successfully!');
    }
  };

  const deleteEvent = async (event: EventData) => {
    if (!isManager()) {
      Alert.alert('Access Denied', 'Only managers can delete events.');
      return;
    }

    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.event}"? This will also delete related messages and payments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting event:', event.id);

            const updatedEvents = { ...events };
            const dateEvents = updatedEvents[event.date] || [];
            updatedEvents[event.date] = dateEvents.filter(e => e.id !== event.id);
            
            // Remove date key if no events left
            if (updatedEvents[event.date].length === 0) {
              delete updatedEvents[event.date];
            }

            await saveEvents(updatedEvents);

            // Delete related message
            await deleteMessage(event.id);

            // Delete related payments
            await deletePaymentEntries(event.id);

            Alert.alert('Success', 'Event deleted successfully!');
          },
        },
      ]
    );
  };

  const generateMessage = async (event: EventData) => {
    try {
      console.log('Generating message for event:', event.id);
      
      const message = `Good afternoon Miss ☀ Confirmation of work for Olive Mind Marketing

Promoters: ${event.promoters}
Venue: ${event.venue}
Location: ${event.location}
Event: ${event.event}
Date: ${formatDate(event.date)}
Arrival Time: ${event.arrivalTime}
Duration: ${event.duration}
Rate: R${event.rate} per hour
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

      const messageData = {
        id: Date.now().toString(),
        eventId: event.id,
        message: message,
        date: event.date,
        sent: false,
      };

      const storedMessages = await AsyncStorage.getItem('@messages');
      const messages = storedMessages ? JSON.parse(storedMessages) : [];
      messages.push(messageData);
      await AsyncStorage.setItem('@messages', JSON.stringify(messages));
      
      console.log('Message generated and saved');
    } catch (error) {
      console.error('Error generating message:', error);
    }
  };

  const updateMessage = async (event: EventData) => {
    try {
      console.log('Updating message for event:', event.id);
      
      const message = `Good afternoon Miss ☀ Confirmation of work for Olive Mind Marketing

Promoters: ${event.promoters}
Venue: ${event.venue}
Location: ${event.location}
Event: ${event.event}
Date: ${formatDate(event.date)}
Arrival Time: ${event.arrivalTime}
Duration: ${event.duration}
Rate: R${event.rate} per hour
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

      const storedMessages = await AsyncStorage.getItem('@messages');
      const messages = storedMessages ? JSON.parse(storedMessages) : [];
      
      const updatedMessages = messages.map((msg: any) => 
        msg.eventId === event.id ? { ...msg, message, date: event.date } : msg
      );
      
      await AsyncStorage.setItem('@messages', JSON.stringify(updatedMessages));
      console.log('Message updated');
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const deleteMessage = async (eventId: string) => {
    try {
      console.log('Deleting message for event:', eventId);
      
      const storedMessages = await AsyncStorage.getItem('@messages');
      const messages = storedMessages ? JSON.parse(storedMessages) : [];
      
      const updatedMessages = messages.filter((msg: any) => msg.eventId !== eventId);
      await AsyncStorage.setItem('@messages', JSON.stringify(updatedMessages));
      
      console.log('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const createPaymentEntries = async (event: EventData) => {
    try {
      console.log('Creating payment entries for event:', event.id);
      
      const promoterNames = event.promoters.split('&').map(name => name.trim());
      const rate = parseFloat(event.rate) || 0;
      const durationMatch = event.duration.match(/(\d+)\s*hours?/i);
      const hours = durationMatch ? parseInt(durationMatch[1]) : 0;
      
      const paymentEntries = promoterNames.map(promoter => ({
        id: `${event.id}_${promoter.replace(/\s+/g, '_')}`,
        eventId: event.id,
        promoters: promoter,
        event: event.event,
        date: event.date,
        hours: hours,
        rate: rate,
        totalAmount: hours * rate,
        paid: false,
      }));

      const storedPayments = await AsyncStorage.getItem('@payments');
      const payments = storedPayments ? JSON.parse(storedPayments) : [];
      payments.push(...paymentEntries);
      await AsyncStorage.setItem('@payments', JSON.stringify(payments));
      
      console.log('Payment entries created:', paymentEntries.length);
    } catch (error) {
      console.error('Error creating payment entries:', error);
    }
  };

  const updatePaymentEntries = async (event: EventData) => {
    try {
      console.log('Updating payment entries for event:', event.id);
      
      const storedPayments = await AsyncStorage.getItem('@payments');
      const payments = storedPayments ? JSON.parse(storedPayments) : [];
      
      // Remove old payment entries for this event
      const filteredPayments = payments.filter((p: any) => p.eventId !== event.id);
      
      // Create new payment entries
      const promoterNames = event.promoters.split('&').map(name => name.trim());
      const rate = parseFloat(event.rate) || 0;
      const durationMatch = event.duration.match(/(\d+)\s*hours?/i);
      const hours = durationMatch ? parseInt(durationMatch[1]) : 0;
      
      const newPaymentEntries = promoterNames.map(promoter => ({
        id: `${event.id}_${promoter.replace(/\s+/g, '_')}`,
        eventId: event.id,
        promoters: promoter,
        event: event.event,
        date: event.date,
        hours: hours,
        rate: rate,
        totalAmount: hours * rate,
        paid: false,
      }));

      const updatedPayments = [...filteredPayments, ...newPaymentEntries];
      await AsyncStorage.setItem('@payments', JSON.stringify(updatedPayments));
      
      console.log('Payment entries updated');
    } catch (error) {
      console.error('Error updating payment entries:', error);
    }
  };

  const deletePaymentEntries = async (eventId: string) => {
    try {
      console.log('Deleting payment entries for event:', eventId);
      
      const storedPayments = await AsyncStorage.getItem('@payments');
      const payments = storedPayments ? JSON.parse(storedPayments) : [];
      
      const updatedPayments = payments.filter((p: any) => p.eventId !== eventId);
      await AsyncStorage.setItem('@payments', JSON.stringify(updatedPayments));
      
      console.log('Payment entries deleted');
    } catch (error) {
      console.error('Error deleting payment entries:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getMarkedDates = () => {
    const marked: { [key: string]: any } = {};
    
    Object.keys(events).forEach(date => {
      marked[date] = {
        marked: true,
        dotColor: colors.primary,
        selectedColor: colors.primary,
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Calendar',
          headerShown: true,
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
        }} 
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Event Calendar</Text>
        <Text style={styles.subtitle}>
          {isManager() ? 'Tap a date to create an event' : 'View scheduled events'}
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

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: colors.card,
          calendarBackground: colors.card,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.card,
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.textSecondary,
          dotColor: colors.primary,
          selectedDotColor: colors.card,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          indicatorColor: colors.primary,
          textDayFontWeight: '500',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '600',
        }}
        onDayPress={onDayPress}
        markedDates={getMarkedDates()}
      />

      <ScrollView style={styles.eventsContainer}>
        {selectedDate && (
          <View style={styles.selectedDateHeader}>
            <Text style={styles.selectedDateTitle}>
              {formatDate(selectedDate)}
            </Text>
            <RoleGuard allowedRoles={['manager']} showMessage={false}>
              <TouchableOpacity 
                style={styles.addEventButton}
                onPress={openCreateEventModal}
              >
                <IconSymbol name="plus" size={20} color={colors.card} />
                <Text style={styles.addEventButtonText}>Add Event</Text>
              </TouchableOpacity>
            </RoleGuard>
          </View>
        )}

        {selectedDate && events[selectedDate] && events[selectedDate].length > 0 ? (
          <View style={styles.selectedDateEvents}>
            {events[selectedDate].map((event, index) => (
              <View key={index} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleContainer}>
                    <Text style={styles.eventTitle}>{event.event}</Text>
                    <Text style={styles.eventVenue}>{event.venue}</Text>
                  </View>
                  <RoleGuard allowedRoles={['manager']} showMessage={false}>
                    <View style={styles.eventActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => openEditEventModal(event)}
                      >
                        <IconSymbol name="pencil" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => deleteEvent(event)}
                      >
                        <IconSymbol name="trash" size={20} color={colors.secondary} />
                      </TouchableOpacity>
                    </View>
                  </RoleGuard>
                </View>
                <Text style={styles.eventDetail}>Promoters: {event.promoters}</Text>
                <Text style={styles.eventDetail}>Time: {event.arrivalTime}</Text>
                <Text style={styles.eventDetail}>Duration: {event.duration}</Text>
                <Text style={styles.eventDetail}>Rate: R{event.rate}/hour</Text>
                <Text style={styles.eventDetail}>Brands: {event.brands}</Text>
              </View>
            ))}
          </View>
        ) : selectedDate ? (
          <View style={styles.noEventsContainer}>
            <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
            <Text style={styles.noEventsText}>No events scheduled for this date</Text>
            <RoleGuard allowedRoles={['manager']} showMessage={false}>
              <TouchableOpacity 
                style={styles.createFirstEventButton}
                onPress={openCreateEventModal}
              >
                <Text style={styles.createFirstEventButtonText}>Create Event</Text>
              </TouchableOpacity>
            </RoleGuard>
          </View>
        ) : null}
      </ScrollView>

      <RoleGuard allowedRoles={['manager']} showMessage={false}>
        <Modal
          visible={showEventModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingEvent ? 'Edit Event' : 'Create Event'}
              </Text>
              <TouchableOpacity onPress={editingEvent ? updateEvent : createEvent}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.selectedDateText}>
                Date: {selectedDate ? formatDate(selectedDate) : ''}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Promoters *</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.promoters}
                  onChangeText={(text) => setNewEvent({...newEvent, promoters: text})}
                  placeholder="e.g., Jackie & Noluthando"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Venue *</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.venue}
                  onChangeText={(text) => setNewEvent({...newEvent, venue: text})}
                  placeholder="e.g., King's Park Stadium"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.location}
                  onChangeText={(text) => setNewEvent({...newEvent, location: text})}
                  placeholder="e.g., Jacko Jackson Dr, Stamford Hill, Durban, 4025"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event *</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.event}
                  onChangeText={(text) => setNewEvent({...newEvent, event: text})}
                  placeholder="e.g., Springboks vs Argentina"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Arrival Time</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.arrivalTime}
                  onChangeText={(text) => setNewEvent({...newEvent, arrivalTime: text})}
                  placeholder="e.g., 14:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.duration}
                  onChangeText={(text) => setNewEvent({...newEvent, duration: text})}
                  placeholder="e.g., 15:00- 21:00 (6 hours)"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rate (per hour)</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.rate}
                  onChangeText={(text) => setNewEvent({...newEvent, rate: text})}
                  placeholder="e.g., 100"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brands</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.brands}
                  onChangeText={(text) => setNewEvent({...newEvent, brands: text})}
                  placeholder="e.g., Klipdrift"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mechanic</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newEvent.mechanic}
                  onChangeText={(text) => setNewEvent({...newEvent, mechanic: text})}
                  placeholder="e.g., Hosting guests in the Heineken and Klipdrift Suite."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </RoleGuard>
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
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  eventsContainer: {
    flex: 1,
    padding: 20,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEventButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  selectedDateEvents: {
    marginBottom: 20,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  eventVenue: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noEventsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  createFirstEventButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstEventButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.secondary,
  },
  saveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
