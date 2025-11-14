
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
import { supabase } from '@/app/integrations/supabase/client';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';

interface AccountSetup {
  email: string;
  password: string;
  name: string;
  role: 'manager' | 'supervisor';
}

const ACCOUNTS: AccountSetup[] = [
  {
    email: 'mtsand09@gmail.com',
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
  const [setupStatus, setSetupStatus] = useState<{ [key: string]: string }>({});

  const createAccount = async (account: AccountSetup) => {
    try {
      console.log(`\n=== Setting up ${account.role} account ===`);
      console.log('Email:', account.email);
      
      setSetupStatus(prev => ({ ...prev, [account.email]: 'checking...' }));

      // Check if user already exists in auth.users
      const { data: existingAuthUsers, error: checkError } = await supabase.rpc(
        'check_user_exists',
        { user_email: account.email }
      );

      if (checkError) {
        console.log('⚠️ Could not check existing user (this is okay):', checkError.message);
      }

      // Try to sign up the user
      console.log('📝 Creating auth user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            name: account.name,
            role: account.role,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.log('✅ User already exists in auth');
          setSetupStatus(prev => ({ 
            ...prev, 
            [account.email]: 'Already exists in Auth' 
          }));
          
          // Get the user ID from auth.users
          const { data: authUser } = await supabase
            .from('auth.users')
            .select('id')
            .eq('email', account.email)
            .single();

          if (authUser) {
            // Update or create user in public.users with correct ID
            await updatePublicUser(authUser.id, account);
          }
        } else {
          console.error('❌ Sign up error:', signUpError.message);
          setSetupStatus(prev => ({ 
            ...prev, 
            [account.email]: `Error: ${signUpError.message}` 
          }));
          return false;
        }
      } else if (signUpData.user) {
        console.log('✅ Auth user created successfully');
        console.log('User ID:', signUpData.user.id);
        
        // Confirm the email automatically (for development)
        // Note: In production, users should verify their email
        setSetupStatus(prev => ({ 
          ...prev, 
          [account.email]: 'Created in Auth (check email for verification)' 
        }));

        // Create or update user in public.users
        await updatePublicUser(signUpData.user.id, account);
      }

      return true;
    } catch (error: any) {
      console.error('❌ Exception creating account:', error.message);
      setSetupStatus(prev => ({ 
        ...prev, 
        [account.email]: `Exception: ${error.message}` 
      }));
      return false;
    }
  };

  const updatePublicUser = async (authUserId: string, account: AccountSetup) => {
    try {
      console.log('📝 Updating public.users table...');
      
      // Check if user exists in public.users
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', account.email)
        .maybeSingle();

      if (checkError) {
        console.error('⚠️ Error checking public.users:', checkError.message);
      }

      if (existingUser) {
        console.log('📝 User exists in public.users, updating ID to match auth...');
        
        // Delete the old record
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('email', account.email);

        if (deleteError) {
          console.error('⚠️ Error deleting old user record:', deleteError.message);
        }
      }

      // Insert new record with correct ID from auth
      console.log('📝 Creating user record with ID:', authUserId);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: account.email,
          name: account.name,
          role: account.role,
        });

      if (insertError) {
        if (insertError.message.includes('duplicate key')) {
          console.log('✅ User already exists in public.users with correct ID');
          
          // Update the existing record
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: account.name,
              role: account.role,
            })
            .eq('id', authUserId);

          if (updateError) {
            console.error('⚠️ Error updating user:', updateError.message);
          } else {
            console.log('✅ User updated in public.users');
          }
        } else {
          console.error('❌ Error inserting user:', insertError.message);
        }
      } else {
        console.log('✅ User created in public.users');
      }
    } catch (error: any) {
      console.error('❌ Exception updating public user:', error.message);
    }
  };

  const handleSetupAll = async () => {
    setIsLoading(true);
    setSetupStatus({});

    console.log('\n🚀 Starting account setup...\n');

    let successCount = 0;
    for (const account of ACCOUNTS) {
      const success = await createAccount(account);
      if (success) successCount++;
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsLoading(false);

    if (successCount === ACCOUNTS.length) {
      Alert.alert(
        'Setup Complete',
        'All accounts have been set up successfully!\n\n' +
        'Important: Check your email to verify the accounts before logging in.\n\n' +
        'You can now go back and login.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      Alert.alert(
        'Setup Partially Complete',
        `${successCount} out of ${ACCOUNTS.length} accounts were set up.\n\n` +
        'Check the status below for details.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Setup Accounts</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoBox}>
            <IconSymbol name="info-circle" size={24} color={colors.primary} />
            <Text style={styles.infoText}>
              This will create or fix the required user accounts in Supabase Auth and sync them with the database.
            </Text>
          </View>

          <View style={styles.accountsList}>
            <Text style={styles.sectionTitle}>Accounts to Setup:</Text>
            
            {ACCOUNTS.map((account, index) => (
              <View key={index} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <IconSymbol 
                    name={account.role === 'manager' ? 'briefcase' : 'user'} 
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={styles.accountRole}>{account.role.toUpperCase()}</Text>
                </View>
                
                <Text style={styles.accountEmail}>{account.email}</Text>
                <Text style={styles.accountName}>{account.name}</Text>
                
                {setupStatus[account.email] && (
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>
                      Status: {setupStatus[account.email]}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.setupButton, isLoading && styles.setupButtonDisabled]}
            onPress={handleSetupAll}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <>
                <IconSymbol name="gear" size={20} color={colors.card} />
                <Text style={styles.setupButtonText}>Setup All Accounts</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.warningBox}>
            <IconSymbol name="exclamation-triangle" size={20} color="#ff9800" />
            <Text style={styles.warningText}>
              Important: After setup, you may need to verify the email addresses by clicking the link sent to each email.
            </Text>
          </View>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>What this does:</Text>
            
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>
                Creates user accounts in Supabase Auth (if they don't exist)
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>
                Syncs user data with the public.users table
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>
                Fixes any ID mismatches between auth and database
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>
                Assigns the correct roles (manager/supervisor)
              </Text>
            </View>
          </View>
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
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
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
  accountsList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountRole: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  accountEmail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  accountName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  setupButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ff980020',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 8,
    lineHeight: 18,
  },
  instructionsBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 8,
    width: 16,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
