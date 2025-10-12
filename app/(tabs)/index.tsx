
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Stack, router } from 'expo-router';

export default function IndexScreen() {
  const { user, logout, isManager, isSupervisor } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const navigateToTab = (tab: string) => {
    router.push(`/(tabs)/${tab}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <IconSymbol 
            name={isManager() ? "crown" : "eye"} 
            size={32} 
            color={isManager() ? colors.primary : colors.accent} 
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>
              {user?.role === 'manager' ? 'Manager' : 'Supervisor'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="arrow-right-from-bracket" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Olive Mind Marketing</Text>
        <Text style={styles.subtitle}>Work Management Dashboard</Text>

        <View style={styles.accessInfo}>
          <Text style={styles.accessTitle}>Your Access Level</Text>
          {isManager() ? (
            <View style={styles.accessCard}>
              <IconSymbol name="crown" size={24} color={colors.primary} />
              <View style={styles.accessDetails}>
                <Text style={styles.accessRole}>Manager</Text>
                <Text style={styles.accessDescription}>
                  Full access - You can view and edit all data
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.accessCard}>
              <IconSymbol name="eye" size={24} color={colors.accent} />
              <View style={styles.accessDetails}>
                <Text style={styles.accessRole}>Supervisor</Text>
                <Text style={styles.accessDescription}>
                  View-only access - You can view but not edit data
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.navigation}>
          <Text style={styles.navigationTitle}>Quick Navigation</Text>
          
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateToTab('calendar')}
          >
            <IconSymbol name="calendar" size={24} color={colors.primary} />
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonTitle}>Calendar</Text>
              <Text style={styles.navButtonSubtitle}>
                {isManager() ? 'Create and manage events' : 'View scheduled events'}
              </Text>
            </View>
            <IconSymbol name="chevron-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateToTab('schedule')}
          >
            <IconSymbol name="clock" size={24} color={colors.accent} />
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonTitle}>Schedule</Text>
              <Text style={styles.navButtonSubtitle}>View upcoming events</Text>
            </View>
            <IconSymbol name="chevron-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateToTab('messages')}
          >
            <IconSymbol name="envelope" size={24} color={colors.highlight} />
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonTitle}>Messages</Text>
              <Text style={styles.navButtonSubtitle}>
                {isManager() ? 'Send and manage messages' : 'View messages'}
              </Text>
            </View>
            <IconSymbol name="chevron-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateToTab('payments')}
          >
            <IconSymbol name="creditcard" size={24} color={colors.secondary} />
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonTitle}>Payments</Text>
              <Text style={styles.navButtonSubtitle}>
                {isManager() ? 'Manage payment records' : 'View payment information'}
              </Text>
            </View>
            <IconSymbol name="chevron-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateToTab('brand-brief')}
          >
            <IconSymbol name="note" size={24} color={colors.primary} />
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonTitle}>Brand Notes</Text>
              <Text style={styles.navButtonSubtitle}>
                {isManager() ? 'Create and manage brand notes' : 'View brand notes'}
              </Text>
            </View>
            <IconSymbol name="chevron-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  accessInfo: {
    marginBottom: 32,
  },
  accessTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  accessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  accessDetails: {
    marginLeft: 12,
    flex: 1,
  },
  accessRole: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  accessDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  navigation: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  navButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  navButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  navButtonSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
