
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
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const storedPayments = await AsyncStorage.getItem('olive_mind_payments');
      if (storedPayments) {
        const paymentsData = JSON.parse(storedPayments);
        // Sort payments by date (newest first)
        paymentsData.sort((a: PaymentData, b: PaymentData) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setPayments(paymentsData);
      }
    } catch (error) {
      console.log('Error loading payments:', error);
    } finally {
      setLoading(false);
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
            } catch (error) {
              console.log('Error updating payment:', error);
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
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-ZA', options);
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const calculateTotals = () => {
    const totalOwed = payments
      .filter(p => !p.paid)
      .reduce((sum, p) => sum + p.totalAmount, 0);
    
    const totalPaid = payments
      .filter(p => p.paid)
      .reduce((sum, p) => sum + p.totalAmount, 0);
    
    const totalEarnings = payments.reduce((sum, p) => sum + p.totalAmount, 0);

    return { totalOwed, totalPaid, totalEarnings };
  };

  const { totalOwed, totalPaid, totalEarnings } = calculateTotals();
  const pendingPayments = payments.filter(p => !p.paid);
  const completedPayments = payments.filter(p => p.paid);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={[styles.summaryCard, styles.owedCard]}>
            <IconSymbol name="clock" size={24} color={colors.secondary} />
            <Text style={styles.summaryAmount}>{formatCurrency(totalOwed)}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>

          <View style={[styles.summaryCard, styles.paidCard]}>
            <IconSymbol name="checkmark.circle" size={24} color={colors.accent} />
            <Text style={styles.summaryAmount}>{formatCurrency(totalPaid)}</Text>
            <Text style={styles.summaryLabel}>Paid</Text>
          </View>

          <View style={[styles.summaryCard, styles.totalCard]}>
            <IconSymbol name="dollarsign.circle" size={24} color={colors.primary} />
            <Text style={styles.summaryAmount}>{formatCurrency(totalEarnings)}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="clock" size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Pending Payments</Text>
            </View>
            
            {pendingPayments.map((payment) => (
              <View key={payment.id} style={[styles.paymentCard, styles.pendingCard]}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentEvent}>{payment.event}</Text>
                    <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                  </View>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.totalAmount)}</Text>
                </View>
                
                <View style={styles.paymentDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="person.2" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{payment.promoters}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol name="clock" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{payment.hours} hours @ {formatCurrency(payment.rate)}/hour</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.markPaidButton}
                  onPress={() => markAsPaid(payment.id)}
                >
                  <IconSymbol name="checkmark" size={16} color={colors.card} />
                  <Text style={styles.markPaidButtonText}>Mark as Paid</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Completed Payments */}
        {completedPayments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="checkmark.circle" size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Completed Payments</Text>
            </View>
            
            {completedPayments.map((payment) => (
              <View key={payment.id} style={[styles.paymentCard, styles.completedCard]}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentEvent, { color: colors.textSecondary }]}>{payment.event}</Text>
                    <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>{formatDate(payment.date)}</Text>
                  </View>
                  <Text style={[styles.paymentAmount, { color: colors.accent }]}>{formatCurrency(payment.totalAmount)}</Text>
                </View>
                
                <View style={styles.paymentDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="person.2" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{payment.promoters}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol name="clock" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{payment.hours} hours @ {formatCurrency(payment.rate)}/hour</Text>
                  </View>
                </View>

                <View style={styles.paidBadge}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.accent} />
                  <Text style={styles.paidBadgeText}>Paid</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {payments.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="creditcard" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Payments Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create events in the Calendar tab to track payments automatically
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  owedCard: {
    borderTopWidth: 3,
    borderTopColor: colors.secondary,
  },
  paidCard: {
    borderTopWidth: 3,
    borderTopColor: colors.accent,
  },
  totalCard: {
    borderTopWidth: 3,
    borderTopColor: colors.primary,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
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
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    opacity: 0.8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
    marginRight: 12,
  },
  paymentEvent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  markPaidButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  markPaidButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  paidBadgeText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
