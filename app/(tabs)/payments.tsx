
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PaymentData {
  id: string;
  eventId: string;
  workerId?: string;
  workerName?: string;
  promoters: string;
  event: string;
  date: string;
  hours: number;
  rate: number;
  totalAmount: number;
  paid: boolean;
}

interface WorkerData {
  id: string;
  name: string;
  contactNumber: string;
  area: string;
  age: string;
  height: string;
  rating: number;
  photos: string[];
  owingAmount: number;
  createdAt: string;
}

const hexToRgba = (hex: string, alpha: number) => {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex; // fallback if not a 6-digit hex
  const [, r, g, b] = m;
  return `rgba(${parseInt(r,16)}, ${parseInt(g,16)}, ${parseInt(b,16)}, ${alpha})`;
};

export default function PaymentsScreen() {
  console.log('PaymentsScreen rendering...');
  
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'completed' | 'workers'>('pending');

  useEffect(() => {
    console.log('PaymentsScreen useEffect running...');
    loadPayments();
    loadWorkers();
  }, []);

  const loadPayments = async () => {
    try {
      console.log('Loading payments from AsyncStorage...');
      const storedPayments = await AsyncStorage.getItem('olive_mind_payments');
      if (storedPayments) {
        setPayments(JSON.parse(storedPayments));
        console.log('Payments loaded:', JSON.parse(storedPayments));
      } else {
        console.log('No payments found in storage');
      }
    } catch (error) {
      console.log('Error loading payments:', error);
    }
  };

  const loadWorkers = async () => {
    try {
      console.log('Loading workers from AsyncStorage...');
      const storedWorkers = await AsyncStorage.getItem('olive_mind_workers');
      if (storedWorkers) {
        setWorkers(JSON.parse(storedWorkers));
        console.log('Workers loaded:', JSON.parse(storedWorkers));
      } else {
        console.log('No workers found in storage');
      }
    } catch (error) {
      console.log('Error loading workers:', error);
    }
  };

  const markAsPaid = async (paymentId: string) => {
    try {
      const updatedPayments = payments.map(payment => 
        payment.id === paymentId ? { ...payment, paid: true } : payment
      );
      
      await AsyncStorage.setItem('olive_mind_payments', JSON.stringify(updatedPayments));
      setPayments(updatedPayments);
      
      // Update worker's owing amount
      const payment = payments.find(p => p.id === paymentId);
      if (payment && payment.workerId) {
        await updateWorkerOwingAmount(payment.workerId, -payment.totalAmount);
      }
      
      console.log('Payment marked as paid');
      Alert.alert('Success', 'Payment marked as completed!');
    } catch (error) {
      console.log('Error marking payment as paid:', error);
    }
  };

  const updateWorkerOwingAmount = async (workerId: string, amountChange: number) => {
    try {
      const updatedWorkers = workers.map(worker => 
        worker.id === workerId 
          ? { ...worker, owingAmount: Math.max(0, worker.owingAmount + amountChange) }
          : worker
      );
      
      await AsyncStorage.setItem('olive_mind_workers', JSON.stringify(updatedWorkers));
      setWorkers(updatedWorkers);
      console.log('Worker owing amount updated');
    } catch (error) {
      console.log('Error updating worker owing amount:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const calculateTotals = () => {
    const pendingPayments = payments.filter(p => !p.paid);
    const completedPayments = payments.filter(p => p.paid);
    
    const totalPending = pendingPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
    const totalCompleted = completedPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
    const totalOwing = workers.reduce((sum, worker) => sum + worker.owingAmount, 0);
    
    return { totalPending, totalCompleted, totalOwing };
  };

  const getWorkerPaymentSummary = () => {
    const workerSummary: { [key: string]: { name: string; totalEarned: number; totalPaid: number; totalOwing: number; paymentCount: number } } = {};
    
    payments.forEach(payment => {
      const workerId = payment.workerId || payment.promoters;
      const workerName = payment.workerName || payment.promoters;
      
      if (!workerSummary[workerId]) {
        workerSummary[workerId] = {
          name: workerName,
          totalEarned: 0,
          totalPaid: 0,
          totalOwing: 0,
          paymentCount: 0,
        };
      }
      
      workerSummary[workerId].totalEarned += payment.totalAmount;
      workerSummary[workerId].paymentCount += 1;
      
      if (payment.paid) {
        workerSummary[workerId].totalPaid += payment.totalAmount;
      } else {
        workerSummary[workerId].totalOwing += payment.totalAmount;
      }
    });
    
    return Object.values(workerSummary);
  };

  const renderPaymentCard = ({ item }: { item: PaymentData }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>{item.event}</Text>
          <Text style={styles.paymentWorker}>👤 {item.workerName || item.promoters}</Text>
          <Text style={styles.paymentDate}>📅 {formatDate(item.date)}</Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={styles.amountText}>{formatCurrency(item.totalAmount)}</Text>
          <Text style={styles.hoursText}>{item.hours}h × R{item.rate}</Text>
        </View>
      </View>
      
      {!item.paid && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => markAsPaid(item.id)}
        >
          <IconSymbol name="checkmark.circle" size={20} color={colors.card} />
          <Text style={styles.payButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}
      
      {item.paid && (
        <View style={styles.paidIndicator}>
          <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
          <Text style={styles.paidText}>Paid</Text>
        </View>
      )}
    </View>
  );

  const renderWorkerSummaryCard = ({ item }: { item: any }) => (
    <View style={styles.workerSummaryCard}>
      <View style={styles.workerSummaryHeader}>
        <Text style={styles.workerSummaryName}>{item.name}</Text>
        <Text style={styles.workerSummaryCount}>{item.paymentCount} jobs</Text>
      </View>
      
      <View style={styles.workerSummaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Earned</Text>
          <Text style={styles.statValue}>{formatCurrency(item.totalEarned)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Paid</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatCurrency(item.totalPaid)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Owing</Text>
          <Text style={[styles.statValue, { color: item.totalOwing > 0 ? colors.secondary : colors.primary }]}>
            {formatCurrency(item.totalOwing)}
          </Text>
        </View>
      </View>
    </View>
  );

  const { totalPending, totalCompleted, totalOwing } = calculateTotals();
  const pendingPayments = payments.filter(p => !p.paid);
  const completedPayments = payments.filter(p => p.paid);
  const workerSummaries = getWorkerPaymentSummary();

  console.log('PaymentsScreen about to render UI...');

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Payments - Olive Mind Marketing",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
      )}
      
      <View style={styles.header}>
        <Text style={styles.title}>Payment Tracking</Text>
        <Text style={styles.subtitle}>Monitor worker payments and earnings</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryAmount, { color: colors.secondary }]}>
            {formatCurrency(totalPending)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>
            {formatCurrency(totalCompleted)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Owing</Text>
          <Text style={[styles.summaryAmount, { color: colors.accent }]}>
            {formatCurrency(totalOwing)}
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingPayments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
            Completed ({completedPayments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'workers' && styles.activeTab]}
          onPress={() => setSelectedTab('workers')}
        >
          <Text style={[styles.tabText, selectedTab === 'workers' && styles.activeTabText]}>
            Workers ({workerSummaries.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'pending' && (
        <FlatList
          data={pendingPayments}
          renderItem={renderPaymentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.paymentsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="checkmark.circle" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No pending payments</Text>
              <Text style={styles.emptyStateSubtext}>All payments are up to date!</Text>
            </View>
          }
        />
      )}

      {selectedTab === 'completed' && (
        <FlatList
          data={completedPayments}
          renderItem={renderPaymentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.paymentsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="creditcard" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No completed payments</Text>
              <Text style={styles.emptyStateSubtext}>Completed payments will appear here</Text>
            </View>
          }
        />
      )}

      {selectedTab === 'workers' && (
        <FlatList
          data={workerSummaries}
          renderItem={renderWorkerSummaryCard}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.paymentsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="person.2" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No worker data</Text>
              <Text style={styles.emptyStateSubtext}>Worker payment summaries will appear here</Text>
            </View>
          }
        />
      )}
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
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(colors.textSecondary, 0.125),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.card,
  },
  paymentsList: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  paymentWorker: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  hoursText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  paidText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  workerSummaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  workerSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerSummaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  workerSummaryCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  workerSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
