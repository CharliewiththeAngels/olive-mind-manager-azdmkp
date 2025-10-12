
import { useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Alert } from 'react-native';

export interface BrandNote {
  id: string;
  brand_name: string;
  note_title: string;
  note_content: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandNoteData {
  brand_name: string;
  note_title: string;
  note_content?: string | null;
  created_by: string;
}

export function useBrandNotes() {
  const [notes, setNotes] = useState<BrandNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('brand_notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      setNotes(data || []);
    } catch (err: any) {
      console.error('Error loading notes:', err);
      setError(err.message || 'Failed to load brand notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData: CreateBrandNoteData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_notes')
        .insert([{
          ...noteData,
          updated_at: new Date().toISOString(),
        }]);

      if (error) {
        throw error;
      }

      await loadNotes();
      return true;
    } catch (err: any) {
      console.error('Error creating note:', err);
      Alert.alert('Error', err.message || 'Failed to create brand note');
      return false;
    }
  };

  const updateNote = async (id: string, noteData: Partial<CreateBrandNoteData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_notes')
        .update({
          ...noteData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      await loadNotes();
      return true;
    } catch (err: any) {
      console.error('Error updating note:', err);
      Alert.alert('Error', err.message || 'Failed to update brand note');
      return false;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_notes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      await loadNotes();
      return true;
    } catch (err: any) {
      console.error('Error deleting note:', err);
      Alert.alert('Error', err.message || 'Failed to delete brand note');
      return false;
    }
  };

  // Group notes by brand for easier organization
  const getNotesByBrand = () => {
    const grouped: { [key: string]: BrandNote[] } = {};
    notes.forEach(note => {
      if (!grouped[note.brand_name]) {
        grouped[note.brand_name] = [];
      }
      grouped[note.brand_name].push(note);
    });
    return grouped;
  };

  useEffect(() => {
    loadNotes();
  }, []);

  return {
    notes,
    loading,
    error,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    getNotesByBrand,
  };
}
