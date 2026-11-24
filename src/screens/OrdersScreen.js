import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../config/constants';
import { formatDateTime, formatVND } from '../utils/formatters';

const STATUS_META = {
  pending: { label: '⏳ Đang tìm tài xế Ninja...', color: COLORS.warning, bg: '#FEF3C7' },
  accepted: { label: '🏍️ Tài xế đang đến điểm lấy', color: COLORS.info, bg: '#DBEAFE' },
  bought: { label: '🛍️ Đã mua/lấy hàng - Đang giao', color: '#7C3AED', bg: '#EDE9FE' },
  completed: { label: '✅ Đã giao hoàn tất', color: COLORS.success, bg: '#DCFCE7' },
  cancelled: { label: '❌ Đã hủy đơn', color: COLORS.primary, bg: '#FEE2E2' },
};

export default function OrdersScreen({ orders, refreshing, onRefresh, onCancelOrder }) {
  const confirmCancel = (order) => {
    Alert.alert('Hủy đơn hàng #' + order.id, 'Bạn có chắc muốn hủy đơn này không?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: () => onCancelOrder(order.id),
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>📋 Lịch sử & Theo dõi đơn ({orders.length})</Text>

      {orders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🛵</Text>
          <Text style={styles.emptyTitle}>Bạn chưa có đơn hàng nào</Text>
          <Text style={styles.emptySub}>
            Chuyển sang tab Đặt đơn để gọi tài xế Ninja Ship ngay!
          </Text>
        </View>
      ) : (
        orders.map((order) => {
          const meta = STATUS_META[order.status] || STATUS_META.pending;
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.topRow}>
                <Text style={styles.orderId}>
                  #{order.id} • {order.serviceTitle}
                </Text>
                <Text style={styles.price}>{formatVND(order.totalAmount)}</Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
              </View>

              <Text style={styles.note}>{order.itemNote}</Text>
              <Text style={styles.route}>📍 Lấy: {order.pickupAddress}</Text>
              <Text style={styles.route}>
                🏁 Giao: {order.dropoffAddress} ({order.distanceKm} km)
              </Text>

              <View style={styles.footerRow}>
                <Text style={styles.timeText}>{formatDateTime(order.createdAt)}</Text>
                {order.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => confirmCancel(order)}
                  >
                    <Text style={styles.cancelBtnText}>Hủy đơn</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 14, paddingBottom: 30 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  emptySub: { fontSize: 13, color: COLORS.grayText, textAlign: 'center', marginTop: 4 },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  price: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginVertical: 8,
  },
  statusText: { fontSize: 12, fontWeight: '800' },
  note: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 6 },
  route: { fontSize: 13, color: '#4B5563', marginBottom: 3 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timeText: { fontSize: 11, color: COLORS.grayText },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  cancelBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
});
