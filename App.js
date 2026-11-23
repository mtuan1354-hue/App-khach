import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  StatusBar,
} from 'react-native';

const RATE_PER_KM = 5000;
const MIN_FARE = 10000;
const BANK_ID = 'MB';
const BANK_ACCOUNT = '0988886666';
const BANK_OWNER = 'CONG TY NINJA SHIP VN';

const formatVND = (num) => Number(num || 0).toLocaleString('vi-VN') + 'đ';

export default function App() {
  const [balance, setBalance] = useState(150000);
  const [service, setService] = useState('Đặt đồ ăn');
  const [note, setNote] = useState('2 tô Bún bò + 1 Trà đá');
  const [pointA, setPointA] = useState('45 Hùng Vương');
  const [pointB, setPointB] = useState('120 Lê Duẩn');
  const [kmInput, setKmInput] = useState('2.5');
  const [payMethod, setPayMethod] = useState('wallet');

  const [walletTab, setWalletTab] = useState('none');
  const [amountInput, setAmountInput] = useState('100000');
  const [bankTarget, setBankTarget] = useState('MB - 0912345678 - NGUYEN VAN A');

  const [orders, setOrders] = useState([
    {
      id: 'NJ88210',
      service: 'Mua hộ / Nhận hộ',
      note: 'Mua hộp thuốc cảm + nước suối',
      pointA: 'Nhà thuốc Long Châu',
      pointB: '88 Nguyễn Trãi',
      km: 1.8,
      price: 10000,
      payMethod: 'Tiền mặt (COD)',
      status: '⏳ Chờ tài xế nhận',
    },
  ]);

  const kmVal = Math.max(0.5, parseFloat(kmInput) || 1);
  const estimatedPrice = Math.max(MIN_FARE, Math.round(kmVal * RATE_PER_KM));

  const handleCreateOrder = () => {
    if (!note.trim() || !pointA.trim() || !pointB.trim()) {
      Alert.alert('Thiếu thông tin', 'Nhập đủ món/nội dung, điểm A và điểm B.');
      return;
    }
    if (payMethod === 'wallet' && balance < estimatedPrice) {
      Alert.alert('Số dư không đủ', 'Ví Ninja Pay không đủ tiền. Hãy nạp thêm hoặc chọn COD.');
      return;
    }

    const orderId = 'NJ' + Date.now().toString().slice(-5);
    const payLabel =
      payMethod === 'wallet'
        ? 'Ví Ninja Pay (Đã trả)'
        : payMethod === 'vietqr'
        ? 'Chuyển khoản VietQR'
        : 'Tiền mặt (COD)';

    if (payMethod === 'wallet') {
      setBalance((b) => b - estimatedPrice);
    }

    const newOrder = {
      id: orderId,
      service,
      note: note.trim(),
      pointA: pointA.trim(),
      pointB: pointB.trim(),
      km: kmVal,
      price: estimatedPrice,
      payMethod: payLabel,
      status: '⏳ Chờ tài xế nhận',
    };

    setOrders((prev) => [newOrder, ...prev]);
    Alert.alert('Đã đặt đơn #' + orderId, `Cước phí: ${formatVND(estimatedPrice)}`);
  };

  const handleTopupConfirm = () => {
    const val = Math.max(10000, parseInt(amountInput.replace(/\D/g, ''), 10) || 0);
    setBalance((b) => b + val);
    setWalletTab('none');
    Alert.alert('Nạp tiền thành công', `Đã cộng +${formatVND(val)} vào Ví Ninja Pay.`);
  };

  const handleWithdrawConfirm = () => {
    const val = Math.max(10000, parseInt(amountInput.replace(/\D/g, ''), 10) || 0);
    if (val > balance) {
      Alert.alert('Lỗi', 'Số dư ví không đủ để rút.');
      return;
    }
    setBalance((b) => b - val);
    setWalletTab('none');
    Alert.alert('Đã gửi lệnh rút tiền', `Rút ${formatVND(val)} về ${bankTarget}`);
  };

  const qrAmount = Math.max(10000, parseInt(amountInput.replace(/\D/g, ''), 10) || 100000);
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact.png?amount=${qrAmount}&addInfo=${encodeURIComponent(
    'NAP KHACH NINJA'
  )}`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>🥷 NINJA SHIP KHÁCH</Text>
          <Text style={styles.brandSub}>Đặt đồ ăn • Mua hộ • Giao hàng theo Km</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={styles.walletCard}>
          <View>
            <Text style={styles.walletLabel}>💳 Ví Ninja Pay (Khách hàng)</Text>
            <Text style={styles.walletAmount}>{formatVND(balance)}</Text>
          </View>
          <View style={styles.walletActions}>
            <TouchableOpacity
              style={styles.walletBtn}
              onPress={() => setWalletTab(walletTab === 'topup' ? 'none' : 'topup')}
            >
              <Text style={styles.walletBtnText}>+ Nạp VietQR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.walletBtn, styles.withdrawBtn]}
              onPress={() => setWalletTab(walletTab === 'withdraw' ? 'none' : 'withdraw')}
            >
              <Text style={styles.walletBtnText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        {walletTab === 'topup' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏦 Nạp tiền VietQR Ngân hàng / Ví</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
            />
            <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
            <Text style={styles.qrNote}>
              {BANK_ID} • {BANK_ACCOUNT} • {BANK_OWNER}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleTopupConfirm}>
              <Text style={styles.primaryBtnText}>✅ Xác nhận đã chuyển khoản</Text>
            </TouchableOpacity>
          </View>
        )}

        {walletTab === 'withdraw' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⬆️ Rút tiền về Ngân hàng / Ví điện tử</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
            />
            <TextInput
              style={styles.input}
              value={bankTarget}
              onChangeText={setBankTarget}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleWithdrawConfirm}>
              <Text style={styles.primaryBtnText}>Gửi lệnh rút tiền</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Đặt đơn mới</Text>
          <View style={styles.chipRow}>
            {['Đặt đồ ăn', 'Mua hộ / Nhận hộ', 'Giao hàng nhanh'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, service === item && styles.chipActive]}
                onPress={() => setService(item)}
              >
                <Text style={[styles.chipText, service === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Món cần mua / Nội dung đơn</Text>
          <TextInput style={styles.input} value={note} onChangeText={setNote} />

          <Text style={styles.label}>Điểm lấy / Quán mua (Điểm A)</Text>
          <TextInput style={styles.input} value={pointA} onChangeText={setPointA} />

          <Text style={styles.label}>Điểm giao khách hàng (Điểm B)</Text>
          <TextInput style={styles.input} value={pointB} onChangeText={setPointB} />

          <Text style={styles.label}>Số Km ({formatVND(RATE_PER_KM)}/km)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={kmInput}
            onChangeText={setKmInput}
          />

          <Text style={styles.label}>Thanh toán</Text>
          <View style={styles.chipRow}>
            {[
              { id: 'wallet', label: 'Ví Ninja Pay' },
              { id: 'vietqr', label: 'VietQR NH' },
              { id: 'cod', label: 'Tiền mặt COD' },
            ].map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.chip, payMethod === m.id && styles.chipActive]}
                onPress={() => setPayMethod(m.id)}
              >
                <Text style={[styles.chipText, payMethod === m.id && styles.chipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tổng cước ({kmVal} km):</Text>
            <Text style={styles.priceValue}>{formatVND(estimatedPrice)}</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateOrder}>
            <Text style={styles.primaryBtnText}>🚀 ĐẶT ĐƠN NGAY</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>📋 Đơn của tôi ({orders.length})</Text>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <Text style={styles.orderId}>
                #{order.id} • {order.service}
              </Text>
              <Text style={styles.orderPrice}>{formatVND(order.price)}</Text>
            </View>
            <Text style={styles.orderNote}>{order.note}</Text>
            <Text style={styles.orderRoute}>📍 Lấy: {order.pointA}</Text>
            <Text style={styles.orderRoute}>🏁 Giao: {order.pointB} ({order.km} km)</Text>
            <Text style={styles.orderMeta}>Thanh toán: {order.payMethod}</Text>
            <Text style={styles.orderStatus}>{order.status}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 14 },
  brandTitle: { color: '#FFF', fontSize: 19, fontWeight: '800' },
  brandSub: { color: '#FEE2E2', fontSize: 11, marginTop: 2 },
  container: { flex: 1, padding: 14 },
  walletCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  walletLabel: { color: '#9CA3AF', fontSize: 12 },
  walletAmount: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 2 },
  walletActions: { gap: 8 },
  walletBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawBtn: { backgroundColor: '#374151' },
  walletBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 15, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    marginBottom: 6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF',
  },
  chipActive: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#DC2626', fontWeight: '800' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#DC2626' },
  primaryBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  qrImage: { width: '100%', height: 190, marginVertical: 8 },
  qrNote: { textAlign: 'center', fontSize: 12, color: '#4B5563', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 14, fontWeight: '800', color: '#111827' },
  orderPrice: { fontSize: 15, fontWeight: '800', color: '#DC2626' },
  orderNote: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  orderRoute: { fontSize: 13, color: '#4B5563', marginBottom: 2 },
  orderMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  orderStatus: { fontSize: 13, fontWeight: '700', color: '#2563EB', marginTop: 4 },
});
