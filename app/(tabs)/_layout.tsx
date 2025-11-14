
import React, { useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
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
      icon: 'schedule',
      label: 'Schedule',
    },
    {
      name: 'messages',
      route: '/(tabs)/messages',
      icon: 'mail',
      label: 'Messages',
    },
    {
      name: 'payments',
      route: '/(tabs)/payments',
      icon: 'payments',
      label: 'Payments',
    },
  ];

  // Use Stack navigation with custom floating tab bar for all platforms
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="payments" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </View>
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
