
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';

interface AccountSetup {
  email: string;
  password: string;
  name: string;
  role: 'manager' | 'supervisor';
}

const ACCOUNTS: AccountSetup[] = [
  {
    email: 'Mtsand09@gmail.com',
    password: 'Olive@22!',
    name: 'Manager',
    role: 'manager',
  },
  {
    email: 'sisandamhlongo28@gmail.com',
    password: 'Sands#28!',
    name: 'Supervisor',
    role: 'supervisor',
  },
];

export default function SetupAccountsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ [key: string]: string }>({});

  const createAccount = async (account: AccountSetup) => {
    try {
      console.log(`Creating account for ${account.email}...`);
      
      const response = await fetch(
        'https://bicjjpxzvgeqqzujhxfo.supabase.co/functions/v1/create-auth-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpY2pqcHh6dmdlcXF6dWpoeGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzcyNDUsImV4cCI6MjA2NDI1MzI0NX0.n_azq_On3EKwkkzDqvv6268_OEi4NBaRtJCIzOz0dC0'}`,
          },
          body: JSON.stringify(account),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Account created: ${account.email}`);
        return { success: true, message: 'Account created successfully' };
      } else {
        console.error(`❌ Failed to create account: ${data.error}`);
        return { success: false, message: data.error || 'Unknown error' };
      }
    } catch (error: any) {
      console.error(`❌ Exception creating account:`, error);
      return { success: false, message: error.message || 'Network error' };
    }
  };

  const handleSetupAll = async () => {
    setIsLoading(true);
    setResults({});
    const newResults: { [key: string]: string } = {};

    for (const account of ACCOUNTS) {
      const result = await createAccount(account);
      newResults[account.email] = result.success 
        ? '✅ Created successfully' 
        : `❌ ${result.message}`;
      setResults({ ...newResults });
    }

    setIsLoading(false);
    
    const allSuccess = Object.values(newResults).every(r => r.includes('✅'));
    if (allSuccess) {
      Alert.alert(
        'Success',
        'All accounts created successfully! You can now log in.',
        [{ text: 'Go to Login', onPress: () => router.replace('/login') }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol name="gear" size={60} color={colors.primary} />
          <Text style={styles.title}>Account Setup</Text>
          <Text style={styles.subtitle}>
            Create authentication accounts for the app
          </Text>
        </View>

        <View style={styles.infoBox}>
          <IconSymbol name="info-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            This will create the following accounts in Supabase Auth:
          </Text>
        </View>

        {ACCOUNTS.map((account, index) => (
          <View key={index} style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <IconSymbol 
                name={account.role === 'manager' ? 'star' : 'user'} 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.accountRole}>{account.name}</Text>
            </View>
            <Text style={styles.accountEmail}>{account.email}</Text>
            <Text style={styles.accountPassword}>Password: {account.password}</Text>
            
            {results[account.email] && (
              <View style={styles.resultContainer}>
                <Text style={[
                  styles.resultText,
                  results[account.email].includes('✅') && styles.resultSuccess,
                  results[account.email].includes('❌') && styles.resultError,
                ]}>
                  {results[account.email]}
                </Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.setupButton, isLoading && styles.setupButtonDisabled]}
          onPress={handleSetupAll}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <>
              <IconSymbol name="checkmark-circle" size={24} color={colors.card} />
              <Text style={styles.setupButtonText}>Create All Accounts</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.noteBox}>
          <IconSymbol name="exclamation-triangle" size={16} color="#ff9800" />
          <Text style={styles.noteText}>
            Note: This uses an Edge Function to create accounts. If it fails, 
            you can manually create accounts in the Supabase Dashboard under 
            Authentication → Users.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  accountCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountRole: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  accountEmail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  accountPassword: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultSuccess: {
    color: '#4caf50',
  },
  resultError: {
    color: '#ff4444',
  },
  setupButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  setupButtonDisabled: {
    opacity: 0.6,
  },
  setupButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ff980020',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 8,
    lineHeight: 18,
  },
});
