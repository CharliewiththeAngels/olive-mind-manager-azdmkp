
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
import * as DocumentPicker from 'expo-document-picker';
import { useBrandBriefs, BrandBrief } from '@/hooks/useBrandBriefs';

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
  briefCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 2px 8px ${colors.shadow}20`,
      },
    }),
  },
  briefHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  briefInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  briefTitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  briefDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  briefActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  briefContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginTop: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
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
  fileUploadButton: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  fileUploadText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    marginTop: 8,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  removeFileButton: {
    padding: 4,
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BrandBriefScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingBrief, setEditingBrief] = useState<BrandBrief | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [brandName, setBrandName] = useState('');
  const [briefTitle, setBriefTitle] = useState('');
  const [briefContent, setBriefContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);

  const { user, isManager } = useAuth();
  const { briefs, loading, createBrief, updateBrief, deleteBrief, uploadFile, deleteFile } = useBrandBriefs();

  const openCreateModal = () => {
    setEditingBrief(null);
    setBrandName('');
    setBriefTitle('');
    setBriefContent('');
    setSelectedFile(null);
    setShowModal(true);
  };

  const openEditModal = (brief: BrandBrief) => {
    setEditingBrief(brief);
    setBrandName(brief.brand_name);
    setBriefTitle(brief.brief_title);
    setBriefContent(brief.brief_content || '');
    setSelectedFile(null);
    setShowModal(true);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          size: file.size || 0,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const saveBrief = async () => {
    if (!brandName.trim() || !briefTitle.trim()) {
      Alert.alert('Error', 'Please fill in brand name and brief title');
      return;
    }

    if (!briefContent.trim()) {
      Alert.alert('Error', 'Please provide brief content');
      return;
    }

    try {
      setSaving(true);
      let fileData = null;

      // Upload file if selected (temporarily disabled)
      // if (selectedFile) {
      //   fileData = await uploadFile(selectedFile, user?.email || 'unknown');
      // }

      const briefData = {
        brand_name: brandName.trim(),
        brief_title: briefTitle.trim(),
        brief_content: briefContent.trim() || null,
        file_url: fileData?.url || null,
        file_name: fileData?.name || null,
        file_type: fileData?.type || null,
        created_by: user?.email || 'unknown',
        updated_at: new Date().toISOString(),
      };

      let success = false;
      if (editingBrief) {
        // Update existing brief
        success = await updateBrief(editingBrief.id, briefData);
      } else {
        // Create new brief
        success = await createBrief(briefData);
      }

      if (success) {
        setShowModal(false);
        Alert.alert('Success', `Brand brief ${editingBrief ? 'updated' : 'created'} successfully`);
      }
    } catch (error) {
      console.error('Error saving brief:', error);
      Alert.alert('Error', 'Failed to save brand brief');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrief = async (brief: BrandBrief) => {
    Alert.alert(
      'Delete Brand Brief',
      `Are you sure you want to delete "${brief.brief_title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete brief from database using the hook function
              const success = await deleteBrief(brief.id);
              
              if (success) {
                Alert.alert('Success', 'Brand brief deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting brief:', error);
              Alert.alert('Error', 'Failed to delete brand brief');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openFile = async (brief: BrandBrief) => {
    if (brief.file_url) {
      // For web, open in new tab
      if (Platform.OS === 'web') {
        window.open(brief.file_url, '_blank');
      } else {
        // For mobile, you might want to use a WebView or external app
        Alert.alert('File', `File: ${brief.file_name}\nTap OK to view content below.`);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Brand Brief', headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading brand briefs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Brand Brief', headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Brand Brief</Text>
        <RoleGuard requiredRole="manager">
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <IconSymbol name="plus" size={16} color={colors.background} />
            <Text style={styles.addButtonText}>Add Brief</Text>
          </TouchableOpacity>
        </RoleGuard>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {briefs.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol 
              name="document" 
              size={64} 
              color={colors.textSecondary} 
              style={styles.emptyStateIcon} 
            />
            <Text style={styles.emptyStateTitle}>No Brand Briefs</Text>
            <Text style={styles.emptyStateText}>
              {isManager() 
                ? "Create your first brand brief to store important brand information and guidelines."
                : "No brand briefs have been created yet."
              }
            </Text>
          </View>
        ) : (
          briefs.map((brief) => (
            <View key={brief.id} style={styles.briefCard}>
              <View style={styles.briefHeader}>
                <View style={styles.briefInfo}>
                  <Text style={styles.brandName}>{brief.brand_name}</Text>
                  <Text style={styles.briefTitle}>{brief.brief_title}</Text>
                  <Text style={styles.briefDate}>
                    Created {formatDate(brief.created_at)}
                  </Text>
                </View>
                <RoleGuard requiredRole="manager">
                  <View style={styles.briefActions}>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => openEditModal(brief)}
                    >
                      <IconSymbol name="pencil" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => handleDeleteBrief(brief)}
                    >
                      <IconSymbol name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </RoleGuard>
              </View>

              {brief.brief_content && (
                <Text style={styles.briefContent} numberOfLines={3}>
                  {brief.brief_content}
                </Text>
              )}

              {/* File display temporarily disabled */}
              {/* {brief.file_url && (
                <TouchableOpacity 
                  style={styles.fileInfo} 
                  onPress={() => openFile(brief)}
                >
                  <IconSymbol name="document" size={16} color={colors.primary} />
                  <Text style={styles.fileName}>{brief.file_name}</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )} */}
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
              {editingBrief ? 'Edit Brand Brief' : 'Create Brand Brief'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Brand Name *</Text>
                <TextInput
                  style={styles.input}
                  value={brandName}
                  onChangeText={setBrandName}
                  placeholder="Enter brand name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Brief Title *</Text>
                <TextInput
                  style={styles.input}
                  value={briefTitle}
                  onChangeText={setBriefTitle}
                  placeholder="Enter brief title"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Brief Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={briefContent}
                  onChangeText={setBriefContent}
                  placeholder="Enter brief content or upload a file below"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>

              {/* File upload temporarily disabled for initial release */}
              {/* <View style={styles.formGroup}>
                <Text style={styles.label}>Upload File (Optional)</Text>
                <TouchableOpacity style={styles.fileUploadButton} onPress={pickDocument}>
                  <IconSymbol name="document" size={32} color={colors.textSecondary} />
                  <Text style={styles.fileUploadText}>
                    Tap to upload PDF, Word, or Text file
                  </Text>
                </TouchableOpacity>

                {selectedFile && (
                  <View style={styles.selectedFile}>
                    <IconSymbol name="document" size={16} color={colors.primary} />
                    <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                    <TouchableOpacity 
                      style={styles.removeFileButton}
                      onPress={() => setSelectedFile(null)}
                    >
                      <IconSymbol name="xmark" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View> */}
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
                onPress={saveBrief}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                    {editingBrief ? 'Update' : 'Create'}
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
