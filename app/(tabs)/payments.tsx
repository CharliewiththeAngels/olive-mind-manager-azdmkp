
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function PaymentsScreen() {
  console.log('PaymentsScreen rendering...');
  
  const [payments, setPayments] = useState<PaymentData[]>([]);

  useEffect(() => {
    console.log('PaymentsScreen useEffect running...');
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      console.log('Loading payments from AsyncStorage...');
      const storedPayments = await AsyncStorage.getItem('olive_mind_payments');
      if (storedPayments) {
        const paymentsData = JSON.parse(storedPayments);
        // Sort payments by date (newest first)
        paymentsData.sort((a: PaymentData, b: PaymentData) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setPayments(paymentsData);
        console.log('Payments loaded:', paymentsData.length, 'payments');
      } else {
        console.log('No payments found in storage');
      }
    } catch (error) {
      console.log('Error loading payments:', error);
    }
  };

  const markAsPaid = async (paymentId: string) => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this payment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              const updatedPayments = payments.map(payment => 
                payment.id === paymentId ? { ...payment, paid: true } : payment
              );
              setPayments(updatedPayments);
              await AsyncStorage.setItem('olive_mind_payments', JSON.stringify(updatedPayments));
              console.log('Payment marked as paid');
            } catch (error) {
              console.log('Error marking payment as paid:', error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-ZA', options);
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const calculateTotals = () => {
    const pending = payments.filter(p => !p.paid);
    const completed = payments.filter(p => p.paid);
    
    const pendingAmount = pending.reduce((sum, p) => sum + p.totalAmount, 0);
    const completedAmount = completed.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalAmount = pendingAmount + completedAmount;

    return {
      pending: pendingAmount,
      completed: completedAmount,
      total: totalAmount,
      pendingCount: pending.length,
      completedCount: completed.length,
    };
  };

  const totals = calculateTotals();
  const pendingPayments = payments.filter(p => !p.paid);
  const completedPayments = payments.filter(p => p.paid);

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
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment Tracking</Text>
          <Text style={styles.subtitle}>Track your work payments</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.pendingCard]}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totals.pending)}</Text>
            <Text style={styles.summaryCount}>{totals.pendingCount} payments</Text>
          </View>

          <View style={[styles.summaryCard, styles.completedCard]}>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totals.completed)}</Text>
            <Text style={styles.summaryCount}>{totals.completedCount} payments</Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totals.total)}</Text>
        </View>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Payments</Text>
            {pendingPayments.map((payment) => (
              <View key={payment.id} style={[styles.paymentCard, styles.pendingPaymentCard]}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentEvent}>{payment.event}</Text>
                    <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                  </View>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.totalAmount)}</Text>
                </View>

                <Text style={styles.paymentDetail}>Promoters: {payment.promoters}</Text>
                <Text style={styles.paymentDetail}>
                  {payment.hours} hours × {formatCurrency(payment.rate)}/hour
                </Text>

                <TouchableOpacity
                  onPress={() => markAsPaid(payment.id)}
                  style={styles.markPaidButton}
                >
                  <IconSymbol name="checkmark.circle" size={18} color={colors.card} />
                  <Text style={styles.markPaidText}>Mark as Paid</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Completed Payments */}
        {completedPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Payments</Text>
            {completedPayments.map((payment) => (
              <View key={payment.id} style={[styles.paymentCard, styles.completedPaymentCard]}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentEvent, styles.completedText]}>{payment.event}</Text>
                    <Text style={[styles.paymentDate, styles.completedText]}>{formatDate(payment.date)}</Text>
                  </View>
                  <Text style={[styles.paymentAmount, styles.completedText]}>
                    {formatCurrency(payment.totalAmount)}
                  </Text>
                </View>

                <Text style={[styles.paymentDetail, styles.completedText]}>
                  Promoters: {payment.promoters}
                </Text>
                <Text style={[styles.paymentDetail, styles.completedText]}>
                  {payment.hours} hours × {formatCurrency(payment.rate)}/hour
                </Text>

                <View style={styles.paidBadge}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.accent} />
                  <Text style={styles.paidText}>Paid</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {payments.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="creditcard" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Payments Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create events in the Calendar tab to track payments
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
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
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pendingCard: {
    backgroundColor: colors.highlight,
  },
  completedCard: {
    backgroundColor: colors.accent,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.card,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  paymentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pendingPaymentCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.highlight,
  },
  completedPaymentCard: {
    backgroundColor: colors.card,
    opacity: 0.8,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  paymentInfo: {
    flex: 1,
    marginRight: 8,
  },
  paymentEvent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentDetail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  completedText: {
    color: colors.textSecondary,
  },
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  markPaidText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  paidText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
