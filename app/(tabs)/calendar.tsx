
import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EventData {
  id: string;
  date: string;
  promoters: string;
  selectedWorkerIds: string[];
  venue: string;
  location: string;
  event: string;
  arrivalTime: string;
  duration: string;
  rate: string;
  brands: string;
  mechanic: string;
}

interface WorkerData {
  id: string;
  name: string;
  contactNumber: string;
  area: string;
  age: string;
  height: string;
  rating: number;
  photos: string[];
  owingAmount: number;
  createdAt: string;
}

// '#RRGGBB' + 'AA' => '#RRGGBBAA'
const withOpacity = (hex: string, alphaHex: string) =>
  `${hex}${alphaHex}`.toLowerCase();

// Or if you prefer decimal alpha (0..1)
const hexToRgba = (hex: string, alpha: number) => {
  const m = hex.replace('#','').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex; // fallback if not a 6-digit hex
  const [, r, g, b] = m;
  return `rgba(${parseInt(r,16)}, ${parseInt(g,16)}, ${parseInt(b,16)}, ${alpha})`;
};

export default function CalendarScreen() {
  console.log('CalendarScreen rendering...');
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [events, setEvents] = useState<{ [key: string]: EventData[] }>({});
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [eventForm, setEventForm] = useState<Partial<EventData>>({
    promoters: '',
    selectedWorkerIds: [],
    venue: '',
    location: '',
    event: '',
    arrivalTime: '',
    duration: '',
    rate: 'R100 per hour',
    brands: '',
    mechanic: '',
  });

  useEffect(() => {
    console.log('CalendarScreen useEffect running...');
    loadEvents();
    loadWorkers();
  }, []);

  const loadEvents = async () => {
    try {
      console.log('Loading events from AsyncStorage...');
      const storedEvents = await AsyncStorage.getItem('olive_mind_events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
        console.log('Events loaded:', JSON.parse(storedEvents));
      } else {
        console.log('No events found in storage');
      }
    } catch (error) {
      console.log('Error loading events:', error);
    }
  };

  const loadWorkers = async () => {
    try {
      console.log('Loading workers from AsyncStorage...');
      const storedWorkers = await AsyncStorage.getItem('olive_mind_workers');
      if (storedWorkers) {
        setWorkers(JSON.parse(storedWorkers));
        console.log('Workers loaded:', JSON.parse(storedWorkers));
      } else {
        console.log('No workers found in storage');
      }
    } catch (error) {
      console.log('Error loading workers:', error);
    }
  };

  const saveEvents = async (newEvents: { [key: string]: EventData[] }) => {
    try {
      await AsyncStorage.setItem('olive_mind_events', JSON.stringify(newEvents));
      setEvents(newEvents);
      console.log('Events saved successfully');
    } catch (error) {
      console.log('Error saving events:', error);
    }
  };

  const onDayPress = (day: DateData) => {
    console.log('Day pressed:', day.dateString);
    setSelectedDate(day.dateString);
    setShowEventModal(true);
  };

  const toggleWorkerSelection = (workerId: string) => {
    const currentSelection = eventForm.selectedWorkerIds || [];
    const isSelected = currentSelection.includes(workerId);
    
    let newSelection;
    if (isSelected) {
      newSelection = currentSelection.filter(id => id !== workerId);
    } else {
      newSelection = [...currentSelection, workerId];
    }
    
    // Update promoters field with selected worker names
    const selectedWorkerNames = workers
      .filter(worker => newSelection.includes(worker.id))
      .map(worker => worker.name)
      .join(' & ');
    
    setEventForm({
      ...eventForm,
      selectedWorkerIds: newSelection,
      promoters: selectedWorkerNames,
    });
  };

  const createEvent = async () => {
    if (!selectedDate || !eventForm.promoters || !eventForm.venue || !eventForm.event) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newEvent: EventData = {
      id: Date.now().toString(),
      date: selectedDate,
      promoters: eventForm.promoters || '',
      selectedWorkerIds: eventForm.selectedWorkerIds || [],
      venue: eventForm.venue || '',
      location: eventForm.location || '',
      event: eventForm.event || '',
      arrivalTime: eventForm.arrivalTime || '',
      duration: eventForm.duration || '',
      rate: eventForm.rate || 'R100 per hour',
      brands: eventForm.brands || '',
      mechanic: eventForm.mechanic || '',
    };

    const updatedEvents = { ...events };
    if (!updatedEvents[selectedDate]) {
      updatedEvents[selectedDate] = [];
    }
    updatedEvents[selectedDate].push(newEvent);

    await saveEvents(updatedEvents);
    
    // Generate message for the Messages tab
    await generateMessage(newEvent);
    
    // Create payment entries for each selected worker
    await createPaymentEntries(newEvent);

    setShowEventModal(false);
    setEventForm({
      promoters: '',
      selectedWorkerIds: [],
      venue: '',
      location: '',
      event: '',
      arrivalTime: '',
      duration: '',
      rate: 'R100 per hour',
      brands: '',
      mechanic: '',
    });

    Alert.alert('Success', 'Event created successfully!');
  };

  const generateMessage = async (event: EventData) => {
    const message = `Good afternoon Miss ☀ Confirmation of work for Olive Mind Marketing

Promoters: ${event.promoters}
Venue: ${event.venue}
Location: ${event.location}
Event: ${event.event}
Date: ${formatDate(event.date)}
Arrival Time: ${event.arrivalTime}
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

    try {
      const existingMessages = await AsyncStorage.getItem('olive_mind_messages');
      const messages = existingMessages ? JSON.parse(existingMessages) : [];
      messages.push({
        id: Date.now().toString(),
        eventId: event.id,
        message,
        date: new Date().toISOString(),
        sent: false,
      });
      await AsyncStorage.setItem('olive_mind_messages', JSON.stringify(messages));
      console.log('Message generated and saved');
    } catch (error) {
      console.log('Error saving message:', error);
    }
  };

  const createPaymentEntries = async (event: EventData) => {
    try {
      const existingPayments = await AsyncStorage.getItem('olive_mind_payments');
      const payments = existingPayments ? JSON.parse(existingPayments) : [];
      
      // Calculate hours from duration
      const durationMatch = event.duration.match(/(\d+)\s*hours?/i);
      const hours = durationMatch ? parseInt(durationMatch[1]) : 0;
      const rateMatch = event.rate.match(/R(\d+)/);
      const hourlyRate = rateMatch ? parseInt(rateMatch[1]) : 100;
      const totalAmount = hours * hourlyRate;

      // Create individual payment entries for each selected worker
      event.selectedWorkerIds.forEach(workerId => {
        const worker = workers.find(w => w.id === workerId);
        if (worker) {
          payments.push({
            id: `${Date.now()}-${workerId}`,
            eventId: event.id,
            workerId: workerId,
            workerName: worker.name,
            promoters: worker.name,
            event: event.event,
            date: event.date,
            hours,
            rate: hourlyRate,
            totalAmount,
            paid: false,
          });
        }
      });

      await AsyncStorage.setItem('olive_mind_payments', JSON.stringify(payments));
      console.log('Payment entries created for selected workers');
    } catch (error) {
      console.log('Error saving payments:', error);
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
    return date.toLocaleDateString('en-ZA', options);
  };

  const getMarkedDates = () => {
    const marked: { [key: string]: any } = {};
    Object.keys(events).forEach(date => {
      marked[date] = {
        marked: true,
        dotColor: colors.primary,
        selectedColor: colors.highlight,
      };
    });
    return marked;
  };

  console.log('CalendarScreen about to render UI...');

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Calendar - Olive Mind Marketing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
      )}
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Work Calendar</Text>
          <Text style={styles.subtitle}>Tap a date to create an event</Text>
        </View>

        <Calendar
          onDayPress={onDayPress}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.text,
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
          }}
          style={styles.calendar}
        />

        {selectedDate && events[selectedDate] && (
          <View style={styles.eventsContainer}>
            <Text style={styles.eventsTitle}>Events for {formatDate(selectedDate)}</Text>
            {events[selectedDate].map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.event}</Text>
                <Text style={styles.eventDetail}>Venue: {event.venue}</Text>
                <Text style={styles.eventDetail}>Promoters: {event.promoters}</Text>
                <Text style={styles.eventDetail}>Time: {event.arrivalTime}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowEventModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Event</Text>
            <TouchableOpacity
              onPress={createEvent}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.selectedDateText}>
              Date: {selectedDate ? formatDate(selectedDate) : ''}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Workers *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowWorkerDropdown(!showWorkerDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {eventForm.promoters || 'Select workers for this event'}
                </Text>
                <IconSymbol 
                  name={showWorkerDropdown ? 'chevron.up' : 'chevron.down'} 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showWorkerDropdown && (
                <View style={styles.dropdown}>
                  {workers.length === 0 ? (
                    <Text style={styles.noWorkersText}>
                      No workers available. Add workers in the Workers tab first.
                    </Text>
                  ) : (
                    workers.map((worker) => (
                      <TouchableOpacity
                        key={worker.id}
                        style={[
                          styles.workerOption,
                          (eventForm.selectedWorkerIds || []).includes(worker.id) && styles.selectedWorkerOption
                        ]}
                        onPress={() => toggleWorkerSelection(worker.id)}
                      >
                        <View style={styles.workerOptionInfo}>
                          <Text style={styles.workerOptionName}>{worker.name}</Text>
                          <Text style={styles.workerOptionDetails}>
                            {worker.area} • Rating: {worker.rating}/5
                          </Text>
                        </View>
                        {(eventForm.selectedWorkerIds || []).includes(worker.id) && (
                          <IconSymbol name="checkmark" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue *</Text>
              <TextInput
                style={styles.textInput}
                value={eventForm.venue}
                onChangeText={(text) => setEventForm({...eventForm, venue: text})}
                placeholder="e.g., King's Park Stadium"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={eventForm.location}
                onChangeText={(text) => setEventForm({...eventForm, location: text})}
                placeholder="e.g., Jacko Jackson Dr, Stamford Hill, Durban, 4025"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event *</Text>
              <TextInput
                style={styles.textInput}
                value={eventForm.event}
                onChangeText={(text) => setEventForm({...eventForm, event: text})}
                placeholder="e.g., Springboks vs Argentina"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Arrival Time</Text>
              <TextInput
                style={styles.textInput}
                value={eventForm.arrivalTime}
                onChangeText={(text) => setEventForm({...eventForm, arrivalTime: text})}
                placeholder="e.g., 14:00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                style={styles.textInput}
                value={eventForm.duration}
                onChangeText={(text) => setEventForm({...eventForm, duration: text})}
                placeholder="e.g., 15:00- 21:00 (6 hours)"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rate</Text>
              <TextInput
                style={styles.textInput}
                value={eventForm.rate}
                onChangeText={(text) => setEventForm({...eventForm, rate: text})}
                placeholder="e.g., R100 per hour"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Brands</Text>
              <TextInput
                style={styles.textInput}
                value={eventForm.brands}
                onChangeText={(text) => setEventForm({...eventForm, brands: text})}
                placeholder="e.g., Klipdrift"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mechanic</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={eventForm.mechanic}
                onChangeText={(text) => setEventForm({...eventForm, mechanic: text})}
                placeholder="e.g., Hosting guests in the Heineken and Klipdrift Suite."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  calendar: {
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  eventCard: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  eventDetail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary,
    backgroundColor: colors.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: colors.secondary,
    fontSize: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.card,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    backgroundColor: colors.card,
    marginTop: 4,
    maxHeight: 200,
  },
  workerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: withOpacity(colors.textSecondary, '20'),
  },
  selectedWorkerOption: {
    backgroundColor: withOpacity(colors.primary, '10'),
  },
  workerOptionInfo: {
    flex: 1,
  },
  workerOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  workerOptionDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noWorkersText: {
    padding: 16,
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
