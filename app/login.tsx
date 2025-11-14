
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Email:', email.trim());
      console.log('Password length:', password.length);
      
      const success = await login(email.trim(), password);
      
      if (success) {
        console.log('✅ Login successful, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('❌ Login failed');
        setErrorMessage(
          'Login failed. Please check:\n\n' +
          '• Email address is correct\n' +
          '• Password is correct\n' +
          '• Account exists in Supabase Auth\n' +
          '• Email has been verified\n\n' +
          'If accounts are not set up, use the Setup button below.'
        );
      }
    } catch (error: any) {
      console.error('❌ Login exception:', error);
      setErrorMessage(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <IconSymbol name="briefcase" size={60} color={colors.primary} />
              <Text style={styles.title}>Olive Mind Marketing</Text>
              <Text style={styles.subtitle}>Work Management System</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <IconSymbol name="envelope" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <IconSymbol name="lock" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <IconSymbol 
                    name={showPassword ? "eye-slash" : "eye"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <IconSymbol name="exclamation-triangle" size={20} color="#ff4444" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.card} />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.setupButton}
                onPress={() => router.push('/setup-accounts')}
                disabled={isLoading}
              >
                <IconSymbol name="gear" size={20} color={colors.primary} />
                <Text style={styles.setupButtonText}>Setup Accounts</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.setupInstructions}>
              <View style={styles.instructionHeader}>
                <IconSymbol name="info-circle" size={24} color={colors.primary} />
                <Text style={styles.instructionTitle}>First Time Setup</Text>
              </View>
              
              <Text style={styles.instructionText}>
                If this is your first time using the app, you need to create user accounts in Supabase Auth.
              </Text>

              <View style={styles.stepContainer}>
                <Text style={styles.stepNumber}>1.</Text>
                <Text style={styles.stepText}>
                  Click the "Setup Accounts" button above to automatically create accounts
                </Text>
              </View>

              <View style={styles.stepContainer}>
                <Text style={styles.stepNumber}>2.</Text>
                <Text style={styles.stepText}>
                  Or manually create accounts in your Supabase Dashboard under Authentication → Users
                </Text>
              </View>

              <View style={styles.accountsBox}>
                <Text style={styles.accountsTitle}>Required Accounts:</Text>
                
                <View style={styles.accountItem}>
                  <Text style={styles.accountLabel}>Manager:</Text>
                  <Text style={styles.accountEmail}>Mtsand09@gmail.com</Text>
                  <Text style={styles.accountPassword}>Password: Olive@22!</Text>
                </View>

                <View style={styles.accountItem}>
                  <Text style={styles.accountLabel}>Supervisor:</Text>
                  <Text style={styles.accountEmail}>sisandamhlongo28@gmail.com</Text>
                  <Text style={styles.accountPassword}>Password: Sands#28!</Text>
                </View>
              </View>

              <View style={styles.noteBox}>
                <IconSymbol name="exclamation-triangle" size={16} color="#ff9800" />
                <Text style={styles.noteText}>
                  Important: Passwords are case-sensitive. Make sure to enter them exactly as shown.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  eyeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ff444420',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ff4444',
    marginLeft: 8,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  setupButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  setupInstructions: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
    width: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  accountsBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  accountsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  accountItem: {
    marginBottom: 12,
  },
  accountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 13,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  accountPassword: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
