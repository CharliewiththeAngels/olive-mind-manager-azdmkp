
import React, { useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack, router } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  console.log('TabLayout rendering...');
  
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('TabLayout useEffect - user:', user?.email, 'isLoading:', isLoading);
    
    if (!isLoading && !user) {
      console.log('No user found, redirecting to login');
      router.replace('/login');
    }
  }, [user, isLoading]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // If no user, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }
  
  // Define the tabs configuration for Olive Mind Marketing work management
  const tabs: TabBarItem[] = [
    {
      name: 'calendar',
      route: '/(tabs)/calendar',
      icon: 'calendar',
      label: 'Calendar',
    },
    {
      name: 'schedule',
      route: '/(tabs)/schedule',
      icon: 'clock',
      label: 'Schedule',
    },
    {
      name: 'messages',
      route: '/(tabs)/messages',
      icon: 'envelope',
      label: 'Messages',
    },
    {
      name: 'payments',
      route: '/(tabs)/payments',
      icon: 'creditcard',
      label: 'Payments',
    },
  ];

  // Use NativeTabs for iOS, custom FloatingTabBar for Android and Web
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf="calendar" drawable="ic_calendar" />
          <Label>Calendar</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="calendar">
          <Icon sf="calendar" drawable="ic_calendar" />
          <Label>Calendar</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="schedule">
          <Icon sf="clock" drawable="ic_schedule" />
          <Label>Schedule</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="messages">
          <Icon sf="envelope" drawable="ic_message" />
          <Label>Messages</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="payments">
          <Icon sf="creditcard" drawable="ic_payment" />
          <Label>Payments</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Remove fade animation to prevent black screen flash
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="payments" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
