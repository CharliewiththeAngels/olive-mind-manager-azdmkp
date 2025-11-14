
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RoleGuard from '@/components/RoleGuard';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

interface PaymentData {
  id: string;
  eventId: string;
  promoters: string;
  event: string;
  date: string;
  hours: number;
  rate: number;
  totalAmount: number;
  paid: boolean;
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function PaymentsScreen() {
  const { user, logout } = useAuth();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  useEffect(() => {
    loadPayments();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('payments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        console.log('Payments changed, reloading...');
        loadPayments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, filterStatus]);

  const handleLogout = async () => {
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
            console.log('🚪 User confirmed logout from Payments');
            await logout();
          },
        },
      ]
    );
  };

  const loadPayments = async () => {
    try {
      console.log('Loading payments from Supabase...');
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading payments:', error);
        return;
      }

      if (data) {
        console.log('Loaded payments:', data.length);
        const paymentsData: PaymentData[] = data.map((payment) => ({
          id: payment.id,
          eventId: payment.event_id || '',
          promoters: payment.promoters,
          event: payment.event,
          date: payment.date,
          hours: payment.hours,
          rate: payment.rate,
          totalAmount: payment.total_amount,
          paid: payment.paid,
        }));
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error in loadPayments:', error);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Filter by status
    if (filterStatus === 'paid') {
      filtered = filtered.filter((p) => p.paid);
    } else if (filterStatus === 'unpaid') {
      filtered = filtered.filter((p) => !p.paid);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.promoters.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.event.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const markAsPaid = async (paymentId: string) => {
    try {
      console.log('Marking payment as paid:', paymentId);
      const { error } = await supabase
        .from('payments')
        .update({ paid: true, updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (error) {
        console.error('Error marking payment as paid:', error);
        Alert.alert('Error', 'Failed to update payment status');
        return;
      }

      await loadPayments();
    } catch (error) {
      console.error('Error in markAsPaid:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const markAsUnpaid = async (paymentId: string) => {
    try {
      console.log('Marking payment as unpaid:', paymentId);
      const { error } = await supabase
        .from('payments')
        .update({ paid: false, updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (error) {
        console.error('Error marking payment as unpaid:', error);
        Alert.alert('Error', 'Failed to update payment status');
        return;
      }

      await loadPayments();
    } catch (error) {
      console.error('Error in markAsUnpaid:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount: number): string => {
    return `R${amount.toFixed(2)}`;
  };

  const calculateTotals = () => {
    const total = filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const paid = filteredPayments
      .filter((p) => p.paid)
      .reduce((sum, p) => sum + p.totalAmount, 0);
    const unpaid = filteredPayments
      .filter((p) => !p.paid)
      .reduce((sum, p) => sum + p.totalAmount, 0);

    return { total, paid, unpaid };
  };

  const getPromoterPaymentSummary = () => {
    const summary: { [key: string]: { total: number; paid: number; unpaid: number } } = {};

    filteredPayments.forEach((payment) => {
      if (!summary[payment.promoters]) {
        summary[payment.promoters] = { total: 0, paid: 0, unpaid: 0 };
      }
      summary[payment.promoters].total += payment.totalAmount;
      if (payment.paid) {
        summary[payment.promoters].paid += payment.totalAmount;
      } else {
        summary[payment.promoters].unpaid += payment.totalAmount;
      }
    });

    return Object.entries(summary).map(([name, amounts]) => ({
      name,
      ...amounts,
    }));
  };

  const renderPaymentCard = ({ item }: { item: PaymentData }) => (
    <View style={[styles.paymentCard, item.paid && styles.paymentCardPaid]}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentHeaderLeft}>
          <Text style={styles.promoterName}>{item.promoters}</Text>
          {item.paid && (
            <View style={styles.paidBadge}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={16}
                color="#4CAF50"
              />
              <Text style={styles.paidText}>Paid</Text>
            </View>
          )}
        </View>
        <Text style={styles.paymentAmount}>{formatCurrency(item.totalAmount)}</Text>
      </View>

      <Text style={styles.eventName}>{item.event}</Text>
      <Text style={styles.paymentDate}>{formatDate(item.date)}</Text>

      <View style={styles.paymentDetails}>
        <Text style={styles.paymentDetail}>
          {item.hours} hours × {formatCurrency(item.rate)}/hr
        </Text>
      </View>

      <RoleGuard allowedRoles={['manager']}>
        <View style={styles.paymentActions}>
          {!item.paid ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => markAsPaid(item.id)}
            >
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check_circle"
                size={20}
                color="#fff"
              />
              <Text style={styles.actionButtonTextPrimary}>Mark as Paid</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => markAsUnpaid(item.id)}
            >
              <IconSymbol
                ios_icon_name="arrow.uturn.backward"
                android_material_icon_name="undo"
                size={20}
                color={colors.text}
              />
              <Text style={styles.actionButtonText}>Mark as Unpaid</Text>
            </TouchableOpacity>
          )}
        </View>
      </RoleGuard>
    </View>
  );

  const renderPromoterSummaryCard = ({ item }: { item: any }) => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryName}>{item.name}</Text>
      <View style={styles.summaryDetails}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(item.total)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, styles.summaryLabelPaid]}>Paid:</Text>
          <Text style={[styles.summaryValue, styles.summaryValuePaid]}>
            {formatCurrency(item.paid)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, styles.summaryLabelUnpaid]}>Unpaid:</Text>
          <Text style={[styles.summaryValue, styles.summaryValueUnpaid]}>
            {formatCurrency(item.unpaid)}
          </Text>
        </View>
      </View>
    </View>
  );

  const totals = calculateTotals();
  const promoterSummary = getPromoterPaymentSummary();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Payments',
          headerShown: false,
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <IconSymbol
            ios_icon_name="rectangle.portrait.and.arrow.right"
            android_material_icon_name="logout"
            size={20}
            color="#FF3B30"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={hexToRgba(colors.text, 0.5)}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by promoter or event..."
          placeholderTextColor={hexToRgba(colors.text, 0.5)}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterStatus === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'unpaid' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('unpaid')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterStatus === 'unpaid' && styles.filterButtonTextActive,
            ]}
          >
            Unpaid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'paid' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('paid')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterStatus === 'paid' && styles.filterButtonTextActive,
            ]}
          >
            Paid
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalsContainer}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totals.total)}</Text>
        </View>
        <View style={[styles.totalCard, styles.totalCardPaid]}>
          <Text style={styles.totalLabel}>Paid</Text>
          <Text style={[styles.totalValue, styles.totalValuePaid]}>
            {formatCurrency(totals.paid)}
          </Text>
        </View>
        <View style={[styles.totalCard, styles.totalCardUnpaid]}>
          <Text style={styles.totalLabel}>Unpaid</Text>
          <Text style={[styles.totalValue, styles.totalValueUnpaid]}>
            {formatCurrency(totals.unpaid)}
          </Text>
        </View>
      </View>

      {promoterSummary.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promoter Summary</Text>
          <FlatList
            data={promoterSummary}
            renderItem={renderPromoterSummaryCard}
            keyExtractor={(item) => item.name}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryList}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        {filteredPayments.length > 0 ? (
          <FlatList
            data={filteredPayments}
            renderItem={renderPaymentCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.paymentsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="banknote"
              android_material_icon_name="payments"
              size={64}
              color={hexToRgba(colors.text, 0.3)}
            />
            <Text style={styles.emptyStateText}>No payments found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Payments will appear here when you create events'}
            </Text>
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(colors.text, 0.1),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutButton: {
    backgroundColor: hexToRgba('#FF3B30', 0.1),
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: hexToRgba('#FF3B30', 0.3),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: hexToRgba(colors.text, 0.05),
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: hexToRgba(colors.text, 0.05),
    borderWidth: 1,
    borderColor: hexToRgba(colors.text, 0.1),
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  totalsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  totalCard: {
    flex: 1,
    backgroundColor: hexToRgba(colors.text, 0.05),
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  totalCardPaid: {
    borderColor: hexToRgba('#4CAF50', 0.3),
  },
  totalCardUnpaid: {
    borderColor: hexToRgba('#ff9800', 0.3),
  },
  totalLabel: {
    fontSize: 12,
    color: hexToRgba(colors.text, 0.6),
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValuePaid: {
    color: '#4CAF50',
  },
  totalValueUnpaid: {
    color: '#ff9800',
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  summaryCard: {
    backgroundColor: hexToRgba(colors.text, 0.05),
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 200,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: hexToRgba(colors.text, 0.6),
  },
  summaryLabelPaid: {
    color: '#4CAF50',
  },
  summaryLabelUnpaid: {
    color: '#ff9800',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryValuePaid: {
    color: '#4CAF50',
  },
  summaryValueUnpaid: {
    color: '#ff9800',
  },
  paymentsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  paymentCard: {
    backgroundColor: hexToRgba(colors.text, 0.05),
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentCardPaid: {
    borderColor: hexToRgba('#4CAF50', 0.3),
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  promoterName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: hexToRgba('#4CAF50', 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  eventName: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: hexToRgba(colors.text, 0.6),
    marginBottom: 8,
  },
  paymentDetails: {
    marginBottom: 12,
  },
  paymentDetail: {
    fontSize: 12,
    color: hexToRgba(colors.text, 0.6),
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: hexToRgba(colors.text, 0.05),
    borderWidth: 1,
    borderColor: hexToRgba(colors.text, 0.1),
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: hexToRgba(colors.text, 0.5),
    marginTop: 8,
    textAlign: 'center',
  },
});
