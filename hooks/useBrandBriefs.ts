
import { useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Alert } from 'react-native';

export interface BrandBrief {
  id: string;
  brand_name: string;
  brief_title: string;
  brief_content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandBriefData {
  brand_name: string;
  brief_title: string;
  brief_content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  created_by: string;
}

export function useBrandBriefs() {
  const [briefs, setBriefs] = useState<BrandBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBriefs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('brand_briefs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setBriefs(data || []);
    } catch (err: any) {
      console.error('Error loading briefs:', err);
      setError(err.message || 'Failed to load brand briefs');
    } finally {
      setLoading(false);
    }
  };

  const createBrief = async (briefData: CreateBrandBriefData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_briefs')
        .insert([{
          ...briefData,
          updated_at: new Date().toISOString(),
        }]);

      if (error) {
        throw error;
      }

      await loadBriefs();
      return true;
    } catch (err: any) {
      console.error('Error creating brief:', err);
      Alert.alert('Error', err.message || 'Failed to create brand brief');
      return false;
    }
  };

  const updateBrief = async (id: string, briefData: Partial<CreateBrandBriefData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_briefs')
        .update({
          ...briefData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      await loadBriefs();
      return true;
    } catch (err: any) {
      console.error('Error updating brief:', err);
      Alert.alert('Error', err.message || 'Failed to update brand brief');
      return false;
    }
  };

  const deleteBrief = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_briefs')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      await loadBriefs();
      return true;
    } catch (err: any) {
      console.error('Error deleting brief:', err);
      Alert.alert('Error', err.message || 'Failed to delete brand brief');
      return false;
    }
  };

  const uploadFile = async (file: { uri: string; name: string; type: string }, userEmail: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userEmail}/${fileName}`;

      // Create a blob from the file URI for web compatibility
      let fileBlob;
      
      if (typeof fetch !== 'undefined') {
        // For web and React Native with fetch support
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
      } else {
        // Fallback for environments without fetch
        throw new Error('File upload not supported in this environment');
      }

      const { data, error } = await supabase.storage
        .from('brand-briefs')
        .upload(filePath, fileBlob, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('brand-briefs')
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        path: filePath,
        name: file.name,
        type: file.type,
      };
    } catch (err: any) {
      console.error('Error uploading file:', err);
      throw err;
    }
  };

  const deleteFile = async (fileUrl: string): Promise<boolean> => {
    try {
      // Extract the file path from the URL
      const urlParts = fileUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'brand-briefs');
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        const { error } = await supabase.storage
          .from('brand-briefs')
          .remove([filePath]);

        if (error) {
          throw error;
        }
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting file:', err);
      return false;
    }
  };

  useEffect(() => {
    loadBriefs();
  }, []);

  return {
    briefs,
    loading,
    error,
    loadBriefs,
    createBrief,
    updateBrief,
    deleteBrief,
    uploadFile,
    deleteFile,
  };
}
