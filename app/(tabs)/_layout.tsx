
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  console.log('TabLayout rendering...');
  
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
