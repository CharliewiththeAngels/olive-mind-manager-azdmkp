
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
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

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

export default function WorkersScreen() {
  console.log('WorkersScreen rendering...');
  
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<WorkerData | null>(null);
  const [workerForm, setWorkerForm] = useState<Partial<WorkerData>>({
    name: '',
    contactNumber: '',
    area: '',
    age: '',
    height: '',
    rating: 5,
    photos: [],
    owingAmount: 0,
  });

  useEffect(() => {
    console.log('WorkersScreen useEffect running...');
    loadWorkers();
  }, []);

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

  const saveWorkers = async (newWorkers: WorkerData[]) => {
    try {
      await AsyncStorage.setItem('olive_mind_workers', JSON.stringify(newWorkers));
      setWorkers(newWorkers);
      console.log('Workers saved successfully');
    } catch (error) {
      console.log('Error saving workers:', error);
    }
  };

  const openAddWorkerModal = () => {
    setEditingWorker(null);
    setWorkerForm({
      name: '',
      contactNumber: '',
      area: '',
      age: '',
      height: '',
      rating: 5,
      photos: [],
      owingAmount: 0,
    });
    setShowWorkerModal(true);
  };

  const openEditWorkerModal = (worker: WorkerData) => {
    setEditingWorker(worker);
    setWorkerForm(worker);
    setShowWorkerModal(true);
  };

  const saveWorker = async () => {
    if (!workerForm.name || !workerForm.contactNumber || !workerForm.area) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Contact Number, Area)');
      return;
    }

    const workerData: WorkerData = {
      id: editingWorker?.id || Date.now().toString(),
      name: workerForm.name || '',
      contactNumber: workerForm.contactNumber || '',
      area: workerForm.area || '',
      age: workerForm.age || '',
      height: workerForm.height || '',
      rating: workerForm.rating || 5,
      photos: workerForm.photos || [],
      owingAmount: workerForm.owingAmount || 0,
      createdAt: editingWorker?.createdAt || new Date().toISOString(),
    };

    let updatedWorkers;
    if (editingWorker) {
      updatedWorkers = workers.map(w => w.id === editingWorker.id ? workerData : w);
    } else {
      updatedWorkers = [...workers, workerData];
    }

    await saveWorkers(updatedWorkers);
    setShowWorkerModal(false);
    Alert.alert('Success', `Worker ${editingWorker ? 'updated' : 'added'} successfully!`);
  };

  const deleteWorker = (workerId: string) => {
    Alert.alert(
      'Delete Worker',
      'Are you sure you want to delete this worker?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedWorkers = workers.filter(w => w.id !== workerId);
            await saveWorkers(updatedWorkers);
            Alert.alert('Success', 'Worker deleted successfully!');
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...(workerForm.photos || []), result.assets[0].uri];
      setWorkerForm({ ...workerForm, photos: newPhotos });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = workerForm.photos?.filter((_, i) => i !== index) || [];
    setWorkerForm({ ...workerForm, photos: newPhotos });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setWorkerForm({ ...workerForm, rating: i })}
          style={styles.starButton}
        >
          <IconSymbol
            name={i <= rating ? 'star.fill' : 'star'}
            size={24}
            color={i <= rating ? '#FFD700' : colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderWorkerCard = ({ item }: { item: WorkerData }) => (
    <View style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{item.name}</Text>
          <Text style={styles.workerDetail}>📞 {item.contactNumber}</Text>
          <Text style={styles.workerDetail}>📍 {item.area}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <IconSymbol
                key={star}
                name={star <= item.rating ? 'star.fill' : 'star'}
                size={16}
                color={star <= item.rating ? '#FFD700' : colors.textSecondary}
              />
            ))}
            <Text style={styles.ratingText}>({item.rating}/5)</Text>
          </View>
        </View>
        
        {item.photos && item.photos.length > 0 && (
          <Image source={{ uri: item.photos[0] }} style={styles.workerPhoto} />
        )}
      </View>

      <View style={styles.workerDetails}>
        <Text style={styles.workerDetail}>Age: {item.age}</Text>
        <Text style={styles.workerDetail}>Height: {item.height}</Text>
        <Text style={[styles.workerDetail, { color: item.owingAmount > 0 ? colors.secondary : colors.primary }]}>
          Owing: R{item.owingAmount.toFixed(2)}
        </Text>
      </View>

      <View style={styles.workerActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditWorkerModal(item)}
        >
          <IconSymbol name="pencil" size={16} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteWorker(item.id)}
        >
          <IconSymbol name="trash" size={16} color={colors.secondary} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  console.log('WorkersScreen about to render UI...');

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Workers - Olive Mind Marketing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
      )}
      
      <View style={styles.header}>
        <Text style={styles.title}>Workers Management</Text>
        <Text style={styles.subtitle}>Manage your team of promoters</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddWorkerModal}
        >
          <IconSymbol name="plus" size={20} color={colors.card} />
          <Text style={styles.addButtonText}>Add Worker</Text>
        </TouchableOpacity>
      </View>

      {workers.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="person.2" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No workers added yet</Text>
          <Text style={styles.emptyStateSubtext}>Tap "Add Worker" to get started</Text>
        </View>
      ) : (
        <FlatList
          data={workers}
          renderItem={renderWorkerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.workersList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showWorkerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowWorkerModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingWorker ? 'Edit Worker' : 'Add Worker'}
            </Text>
            <TouchableOpacity
              onPress={saveWorker}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                value={workerForm.name}
                onChangeText={(text) => setWorkerForm({...workerForm, name: text})}
                placeholder="Enter worker's full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number *</Text>
              <TextInput
                style={styles.textInput}
                value={workerForm.contactNumber}
                onChangeText={(text) => setWorkerForm({...workerForm, contactNumber: text})}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Area *</Text>
              <TextInput
                style={styles.textInput}
                value={workerForm.area}
                onChangeText={(text) => setWorkerForm({...workerForm, area: text})}
                placeholder="Enter area/location"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                value={workerForm.age}
                onChangeText={(text) => setWorkerForm({...workerForm, age: text})}
                placeholder="Enter age"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height</Text>
              <TextInput
                style={styles.textInput}
                value={workerForm.height}
                onChangeText={(text) => setWorkerForm({...workerForm, height: text})}
                placeholder="e.g., 5'6\" or 168cm"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rating</Text>
              <View style={styles.ratingInput}>
                {renderStars(workerForm.rating || 5)}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Owing Amount (R)</Text>
              <TextInput
                style={styles.textInput}
                value={workerForm.owingAmount?.toString() || '0'}
                onChangeText={(text) => setWorkerForm({...workerForm, owingAmount: parseFloat(text) || 0})}
                placeholder="Enter amount owed"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Photos</Text>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <IconSymbol name="camera" size={20} color={colors.primary} />
                <Text style={styles.photoButtonText}>Add Photo</Text>
              </TouchableOpacity>
              
              {workerForm.photos && workerForm.photos.length > 0 && (
                <ScrollView horizontal style={styles.photosContainer}>
                  {workerForm.photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.photo} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <IconSymbol name="xmark.circle.fill" size={24} color={colors.secondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
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
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary,
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
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  workersList: {
    padding: 16,
  },
  workerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  workerDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  workerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
  },
  workerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  ratingInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  photoButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
});
