
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';

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
  const { user, isManager } = useAuth();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'all' | 'summary'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, filterStatus]);

  const loadPayments = async () => {
    try {
      console.log('Loading payments from storage...');
      const storedPayments = await AsyncStorage.getItem('@payments');
      if (storedPayments) {
        const parsedPayments = JSON.parse(storedPayments);
        console.log('Loaded payments:', parsedPayments.length);
        setPayments(parsedPayments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Apply status filter
    if (filterStatus === 'paid') {
      filtered = filtered.filter(payment => payment.paid);
    } else if (filterStatus === 'unpaid') {
      filtered = filtered.filter(payment => !payment.paid);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(payment =>
        payment.promoters.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.event.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const markAsPaid = async (paymentId: string) => {
    if (!isManager()) {
      Alert.alert('Access Denied', 'Only managers can mark payments as paid.');
      return;
    }

    try {
      console.log('Marking payment as paid:', paymentId);
      const updatedPayments = payments.map(payment =>
        payment.id === paymentId ? { ...payment, paid: true } : payment
      );
      
      setPayments(updatedPayments);
      await AsyncStorage.setItem('@payments', JSON.stringify(updatedPayments));
      
      Alert.alert('Success', 'Payment marked as paid!');
    } catch (error) {
      console.error('Error updating payment:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const markAsUnpaid = async (paymentId: string) => {
    if (!isManager()) {
      Alert.alert('Access Denied', 'Only managers can mark payments as unpaid.');
      return;
    }

    try {
      console.log('Marking payment as unpaid:', paymentId);
      const updatedPayments = payments.map(payment =>
        payment.id === paymentId ? { ...payment, paid: false } : payment
      );
      
      setPayments(updatedPayments);
      await AsyncStorage.setItem('@payments', JSON.stringify(updatedPayments));
      
      Alert.alert('Success', 'Payment marked as unpaid!');
    } catch (error) {
      console.error('Error updating payment:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const calculateTotals = () => {
    const displayPayments = filteredPayments;
    const totalAmount = displayPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
    const paidAmount = displayPayments.reduce((sum, payment) => 
      payment.paid ? sum + payment.totalAmount : sum, 0
    );
    const unpaidAmount = totalAmount - paidAmount;
    
    return { totalAmount, paidAmount, unpaidAmount };
  };

  const getPromoterPaymentSummary = () => {
    const displayPayments = filteredPayments;
    const promoterSummary: { [key: string]: { total: number; paid: number; unpaid: number; events: number } } = {};
    
    displayPayments.forEach(payment => {
      if (!promoterSummary[payment.promoters]) {
        promoterSummary[payment.promoters] = { total: 0, paid: 0, unpaid: 0, events: 0 };
      }
      
      promoterSummary[payment.promoters].total += payment.totalAmount;
      promoterSummary[payment.promoters].events += 1;
      
      if (payment.paid) {
        promoterSummary[payment.promoters].paid += payment.totalAmount;
      } else {
        promoterSummary[payment.promoters].unpaid += payment.totalAmount;
      }
    });
    
    return Object.entries(promoterSummary).map(([name, data]) => ({
      name,
      ...data,
    }));
  };

  const renderPaymentCard = ({ item }: { item: PaymentData }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.promoterName}>{item.promoters}</Text>
          <Text style={styles.eventName}>{item.event}</Text>
          <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={styles.amountText}>{formatCurrency(item.totalAmount)}</Text>
          <Text style={styles.hoursText}>{item.hours}h × R{item.rate}</Text>
        </View>
      </View>
      
      <View style={styles.paymentFooter}>
        <View style={[styles.statusBadge, item.paid ? styles.paidBadge : styles.unpaidBadge]}>
          <IconSymbol 
            name={item.paid ? "check-circle" : "clock"} 
            size={16} 
            color={item.paid ? colors.card : colors.secondary} 
          />
          <Text style={[styles.statusText, item.paid ? styles.paidText : styles.unpaidText]}>
            {item.paid ? 'Paid' : 'Unpaid'}
          </Text>
        </View>
        
        <RoleGuard allowedRoles={['manager']} showMessage={false}>
          {!item.paid ? (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => markAsPaid(item.id)}
            >
              <Text style={styles.payButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.unpayButton}
              onPress={() => markAsUnpaid(item.id)}
            >
              <Text style={styles.unpayButtonText}>Mark as Unpaid</Text>
            </TouchableOpacity>
          )}
        </RoleGuard>
      </View>
    </View>
  );

  const renderPromoterSummaryCard = ({ item }: { item: any }) => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryName}>{item.name}</Text>
        <Text style={styles.summaryTotal}>{formatCurrency(item.total)}</Text>
      </View>
      
      <View style={styles.summaryDetails}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Events:</Text>
          <Text style={styles.summaryValue}>{item.events}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Paid:</Text>
          <Text style={[styles.summaryValue, styles.paidAmount]}>{formatCurrency(item.paid)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Unpaid:</Text>
          <Text style={[styles.summaryValue, styles.unpaidAmount]}>{formatCurrency(item.unpaid)}</Text>
        </View>
      </View>
    </View>
  );

  const totals = calculateTotals();
  const promoterSummary = getPromoterPaymentSummary();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Payments',
          headerShown: true,
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
        }} 
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Payment Management</Text>
        <View style={styles.roleIndicator}>
          <IconSymbol 
            name={isManager() ? "crown" : "eye"} 
            size={16} 
            color={isManager() ? colors.primary : colors.accent} 
          />
          <Text style={styles.roleText}>
            {isManager() ? 'Manager - Can Edit' : 'Supervisor - View Only'}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol name="magnifying-glass" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or event..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'all' && styles.activeFilter]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'unpaid' && styles.activeFilter]}
          onPress={() => setFilterStatus('unpaid')}
        >
          <Text style={[styles.filterText, filterStatus === 'unpaid' && styles.activeFilterText]}>
            Unpaid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'paid' && styles.activeFilter]}
          onPress={() => setFilterStatus('paid')}
        >
          <Text style={[styles.filterText, filterStatus === 'paid' && styles.activeFilterText]}>
            Paid
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, selectedView === 'all' && styles.activeToggle]}
          onPress={() => setSelectedView('all')}
        >
          <Text style={[styles.toggleText, selectedView === 'all' && styles.activeToggleText]}>
            All Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, selectedView === 'summary' && styles.activeToggle]}
          onPress={() => setSelectedView('summary')}
        >
          <Text style={[styles.toggleText, selectedView === 'summary' && styles.activeToggleText]}>
            By Promoter
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalsContainer}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totals.totalAmount)}</Text>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Paid</Text>
          <Text style={[styles.totalAmount, styles.paidAmount]}>{formatCurrency(totals.paidAmount)}</Text>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Unpaid</Text>
          <Text style={[styles.totalAmount, styles.unpaidAmount]}>{formatCurrency(totals.unpaidAmount)}</Text>
        </View>
      </View>

      {searchQuery.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.searchResultsText}>
            {filteredPayments.length} result{filteredPayments.length !== 1 ? 's' : ''} for "{searchQuery}"
          </Text>
        </View>
      )}

      <FlatList
        data={selectedView === 'all' ? filteredPayments : promoterSummary}
        renderItem={selectedView === 'all' ? renderPaymentCard : renderPromoterSummaryCard}
        keyExtractor={(item, index) => selectedView === 'all' ? (item as PaymentData).id : `summary_${index}`}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="creditcard" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Payments Found</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your filters or search terms' 
                : 'Payments will appear here when events are created'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: colors.card,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.card,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: colors.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: colors.card,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeToggleText: {
    color: colors.card,
  },
  totalsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  totalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  paidAmount: {
    color: colors.primary,
  },
  unpaidAmount: {
    color: colors.secondary,
  },
  searchResults: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.highlight + '20',
  },
  searchResultsText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  promoterName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  eventName: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  eventDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  hoursText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paidBadge: {
    backgroundColor: colors.primary,
  },
  unpaidBadge: {
    backgroundColor: colors.secondary + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  paidText: {
    color: colors.card,
  },
  unpaidText: {
    color: colors.secondary,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  unpayButton: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  unpayButtonText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  summaryDetails: {
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});
