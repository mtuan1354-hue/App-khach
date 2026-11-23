import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { COLORS } from './src/config/constants';
import { StorageService } from './src/services/storage';
import { NinjaApi } from './src/services/api';
import Header from './src/components/Header';
import BookingScreen from './src/screens/BookingScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('booking');
  const [profile, setProfile] = useState({
    name: 'Khách hàng Ninja',
    phone: '0909123456',
    defaultAddress: '120 Lê Duẩn, Hải Châu',
  });
  const [walletBalance, setWalletBalance] = useState(200000);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await StorageService.loadState();
      setProfile(saved.profile);
      setWalletBalance(saved.walletBalance);
      setOrders(saved.orders);
      setTransactions(saved.transactions);
    })();
  }, []);

  const handleSubmitOrder = async (payload) => {
    const orderId = 'NJ' + Date.now().toString().slice(-6);
    const newOrder = {
      id: orderId,
      ...payload,
      customerName: profile.name,
      customerPhone: profile.phone,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (payload.paymentMethod === 'wallet') {
      const nextBalance = walletBalance - payload.totalAmount;
      setWalletBalance(nextBalance);
      await StorageService.saveWalletBalance(nextBalance);

      const newTx = {
        id: 'TX' + Date.now().toString().slice(-5),
        type: 'payment',
        title: `Thanh toán đơn #${orderId}`,
        amount: -payload.totalAmount,
        createdAt: new Date().toISOString(),
      };
      const nextTx = [newTx, ...transactions];
      setTransactions(nextTx);
      await StorageService.saveTransactions(nextTx);
    }

    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);
    await StorageService.saveOrders(nextOrders);

    await NinjaApi.createOrder(newOrder);

    setActiveTab('orders');
    Alert.alert(
      'Đặt đơn thành công #' + orderId,
      'Đơn hàng đã được gửi tới hệ thống tài xế Ninja Ship!'
    );
  };

  const handleCancelOrder = async (orderId) => {
    const target = orders.find((o) => o.id === orderId);
    const nextOrders = orders.map((o) =>
      o.id === orderId ? { ...o, status: 'cancelled' } : o
    );
    setOrders(nextOrders);
    await StorageService.saveOrders(nextOrders);

    if (target && target.paymentMethod === 'wallet') {
      const refunded = walletBalance + target.totalAmount;
      setWalletBalance(refunded);
      await StorageService.saveWalletBalance(refunded);

      const refundTx = {
        id: 'TX' + Date.now().toString().slice(-5),
        type: 'refund',
        title: `Hoàn tiền hủy đơn #${orderId}`,
        amount: target.totalAmount,
        createdAt: new Date().toISOString(),
      };
      const nextTx = [refundTx, ...transactions];
      setTransactions(nextTx);
      await StorageService.saveTransactions(nextTx);
    }

    await NinjaApi.cancelOrder(orderId);
  };

  const handleRefreshOrders = async () => {
    setRefreshing(true);
    const res = await NinjaApi.fetchCustomerOrders(profile.phone);
    if (res.ok && Array.isArray(res.data?.orders)) {
      setOrders(res.data.orders);
      await StorageService.saveOrders(res.data.orders);
    }
    setRefreshing(false);
  };

  const handleTopup = async (amount) => {
    const nextBal = walletBalance + amount;
    setWalletBalance(nextBal);
    await StorageService.saveWalletBalance(nextBal);

    const newTx = {
      id: 'TX' + Date.now().toString().slice(-5),
      type: 'topup',
      title: 'Nạp tiền vào ví qua VietQR',
      amount,
      createdAt: new Date().toISOString(),
    };
    const nextTx = [newTx, ...transactions];
    setTransactions(nextTx);
    await StorageService.saveTransactions(nextTx);
  };

  const handleWithdraw = async (amount, accountInfo) => {
    const nextBal = walletBalance - amount;
    setWalletBalance(nextBal);
    await StorageService.saveWalletBalance(nextBal);

    const newTx = {
      id: 'TX' + Date.now().toString().slice(-5),
      type: 'withdraw',
      title: `Rút tiền về ${accountInfo}`,
      amount: -amount,
      createdAt: new Date().toISOString(),
    };
    const nextTx = [newTx, ...transactions];
    setTransactions(nextTx);
    await StorageService.saveTransactions(nextTx);

    await NinjaApi.requestWithdraw({
      phone: profile.phone,
      amount,
      accountInfo,
    });
  };

  const handleSaveProfile = async (updated) => {
    setProfile(updated);
    await StorageService.saveProfile(updated);
  };

  const navItems = [
    { id: 'booking', icon: '🛵', label: 'Đặt đơn' },
    { id: 'orders', icon: '📋', label: 'Đơn hàng' },
    { id: 'wallet', icon: '💳', label: 'Ví tiền' },
    { id: 'profile', icon: '👤', label: 'Tài khoản' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <Header customerName={profile.name} walletBalance={walletBalance} />

      <View style={styles.body}>
        {activeTab === 'booking' && (
          <BookingScreen
            profile={profile}
            walletBalance={walletBalance}
            onSubmitOrder={handleSubmitOrder}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersScreen
            orders={orders}
            refreshing={refreshing}
            onRefresh={handleRefreshOrders}
            onCancelOrder={handleCancelOrder}
          />
        )}
        {activeTab === 'wallet' && (
          <WalletScreen
            walletBalance={walletBalance}
            transactions={transactions}
            onTopup={handleTopup}
            onWithdraw={handleWithdraw}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen profile={profile} onSaveProfile={handleSaveProfile} />
        )}
      </View>

      <View style={styles.tabBar}>
        {navItems.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  body: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 19 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: COLORS.grayText, marginTop: 2 },
  tabLabelActive: { color: COLORS.primary, fontWeight: '800' },
});
