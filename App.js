import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CustomerApp from './src/CustomerApp';
import DriverApp from './src/DriverApp';

// Hỗ trợ build riêng từng app qua biến môi trường EXPO_PUBLIC_APP_ROLE ('customer' | 'driver')
// Nếu không đặt biến môi trường, hiển thị thanh chuyển đổi nhanh ở trên cùng để chạy cả 2 app trên cùng 1 bản build.
const FIXED_ROLE =
  (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_APP_ROLE) || '';

export default function App() {
  const [role, setRole] = useState(FIXED_ROLE === 'driver' ? 'driver' : 'customer');

  if (FIXED_ROLE === 'driver') {
    return <DriverApp />;
  }
  if (FIXED_ROLE === 'customer') {
    return <CustomerApp />;
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.topSwitchBar}>
        <TouchableOpacity
          style={[styles.tabBtn, role === 'customer' && styles.tabBtnActiveCustomer]}
          onPress={() => setRole('customer')}
        >
          <Text style={[styles.tabText, role === 'customer' && styles.tabTextActive]}>
            🥷 App Khách
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, role === 'driver' && styles.tabBtnActiveDriver]}
          onPress={() => setRole('driver')}
        >
          <Text style={[styles.tabText, role === 'driver' && styles.tabTextActive]}>
            🛵 App Tài Xế
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      {role === 'driver' ? <DriverApp /> : <CustomerApp />}
    </View>
  );
}

const styles = StyleSheet.create({
  topSwitchBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  tabBtnActiveCustomer: {
    backgroundColor: '#D92D20',
  },
  tabBtnActiveDriver: {
    backgroundColor: '#059669',
  },
  tabText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
