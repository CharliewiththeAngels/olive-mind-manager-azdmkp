
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export default function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback,
  showMessage = true 
}: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <View style={styles.container}>
          <IconSymbol name="lock" size={48} color={colors.textSecondary} />
          <Text style={styles.title}>Access Restricted</Text>
          <Text style={styles.message}>
            This feature is only available to {allowedRoles.join(' and ')} users.
          </Text>
          <Text style={styles.currentRole}>
            Your current role: {user?.role || 'Unknown'}
          </Text>
        </View>
      );
    }

    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  currentRole: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
