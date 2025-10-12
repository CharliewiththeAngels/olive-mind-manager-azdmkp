
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useBrandNotes, BrandNote } from '@/hooks/useBrandNotes';

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
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  brandSection: {
    marginBottom: 24,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  brandCount: {
    fontSize: 14,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: `0 1px 4px ${colors.shadow}20`,
      },
    }),
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  noteContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.text,
  },
  saveButtonText: {
    color: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default function BrandBriefScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<BrandNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [brandName, setBrandName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const { user, isManager } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote, getNotesByBrand } = useBrandNotes();

  const openCreateModal = () => {
    setEditingNote(null);
    setBrandName('');
    setNoteTitle('');
    setNoteContent('');
    setShowModal(true);
  };

  const openEditModal = (note: BrandNote) => {
    setEditingNote(note);
    setBrandName(note.brand_name);
    setNoteTitle(note.note_title);
    setNoteContent(note.note_content || '');
    setShowModal(true);
  };

  const saveNote = async () => {
    if (!brandName.trim()) {
      Alert.alert('Error', 'Please enter a brand name');
      return;
    }

    if (!noteTitle.trim()) {
      Alert.alert('Error', 'Please enter a note title');
      return;
    }

    try {
      setSaving(true);

      const noteData = {
        brand_name: brandName.trim(),
        note_title: noteTitle.trim(),
        note_content: noteContent.trim() || null,
        created_by: user?.email || 'unknown',
      };

      let success = false;
      if (editingNote) {
        success = await updateNote(editingNote.id, noteData);
      } else {
        success = await createNote(noteData);
      }

      if (success) {
        setShowModal(false);
        // Don't show success alert for better UX (like iPhone Notes)
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (note: BrandNote) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.note_title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(note.id);
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const filteredNotes = notes.filter(note => 
    note.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.note_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.note_content && note.note_content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedNotes = () => {
    const grouped: { [key: string]: BrandNote[] } = {};
    filteredNotes.forEach(note => {
      if (!grouped[note.brand_name]) {
        grouped[note.brand_name] = [];
      }
      grouped[note.brand_name].push(note);
    });
    return grouped;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Brand Notes', headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Brand Notes', headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Brand Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <IconSymbol name="plus" size={16} color={colors.background} />
          <Text style={styles.addButtonText}>New Note</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol 
              name="note" 
              size={64} 
              color={colors.textSecondary} 
              style={styles.emptyStateIcon} 
            />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No matching notes' : 'No Notes Yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Tap "New Note" to create your first brand note'
              }
            </Text>
          </View>
        ) : (
          Object.entries(groupedNotes()).map(([brand, brandNotes]) => (
            <View key={brand} style={styles.brandSection}>
              <View style={styles.brandHeader}>
                <Text style={styles.brandName}>{brand}</Text>
                <Text style={styles.brandCount}>{brandNotes.length}</Text>
              </View>
              
              {brandNotes.map((note) => (
                <TouchableOpacity 
                  key={note.id} 
                  style={styles.noteCard}
                  onPress={() => openEditModal(note)}
                  activeOpacity={0.7}
                >
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle} numberOfLines={1}>
                      {note.note_title}
                    </Text>
                    <RoleGuard requiredRole="manager">
                      <View style={styles.noteActions}>
                        <TouchableOpacity 
                          style={styles.actionButton} 
                          onPress={(e) => {
                            e.stopPropagation();
                            openEditModal(note);
                          }}
                        >
                          <IconSymbol name="pencil" size={14} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton} 
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note);
                          }}
                        >
                          <IconSymbol name="trash" size={14} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </RoleGuard>
                  </View>

                  {note.note_content && (
                    <Text style={styles.noteContent} numberOfLines={2}>
                      {note.note_content}
                    </Text>
                  )}

                  <Text style={styles.noteDate}>
                    {formatDate(note.updated_at)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Brand</Text>
                <TextInput
                  style={styles.input}
                  value={brandName}
                  onChangeText={setBrandName}
                  placeholder="Enter brand name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  placeholder="Enter note title"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={noteContent}
                  onChangeText={setNoteContent}
                  placeholder="Enter your notes about this brand..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowModal(false)}
                disabled={saving}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveNote}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                    {editingNote ? 'Save' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
