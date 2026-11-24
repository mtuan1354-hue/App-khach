import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { BANK_CONFIG, COLORS } from '../config/constants';
import { buildVietQRUrl, formatDateTime, formatVND } from '../utils/formatters';

export default function WalletScreen({ walletBalance, transactions, onTopup, onWithdraw }) {
  const [mode, setMode] = useState('topup');
  const [amount, setAmount] = useState('100000');
  const [withdrawAccount, setWithdrawAccount] = useState('MB - 0912345678 - NGUYEN VAN A');

  const numericAmount = Math.max(10000, parseInt(amount.replace(/\D/g, ''), 10) || 100000);
  const qrImageUrl = buildVietQRUrl(numericAmount, 'NAP NINJA PAY KHACH');

  const handleConfirmTopup = () => {
    onTopup(numericAmount);
    Alert.alert('Đã cộng số dư', `Ví Ninja Pay đã được nạp thêm ${formatVND(numericAmount)}.`);
  };

  const handleConfirmWithdraw = () => {
    if (numericAmount > walletBalance) {
      Alert.alert('Số dư không đủ', 'Số tiền rút vượt quá số dư hiện tại trong ví.');
      return;
    }
    if (!withdrawAccount.trim()) {
      Alert.alert('Thiếu tài khoản', 'Vui lòng nhập thông tin ngân hàng hoặc ví nhận tiền.');
      return;
    }
    onWithdraw(numericAmount, withdrawAccount.trim());
    Alert.alert('Đã gửi lệnh rút tiền', `Rút ${formatVND(numericAmount)} về ${withdrawAccount}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Số dư khả dụng Ninja Pay</Text>
        <Text style={styles.balanceValue}>{formatVND(walletBalance)}</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'topup' && styles.tabBtnActive]}
            onPress={() => setMode('topup')}
          >
            <Text style={[styles.tabBtnText, mode === 'topup' && styles.tabBtnTextActive]}>
              + Nạp VietQR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'withdraw' && styles.tabBtnActive]}
            onPress={() => setMode('withdraw')}
          >
            <Text style={[styles.tabBtnText, mode === 'withdraw' && styles.tabBtnTextActive]}>
              ⬆️ Rút tiền
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {mode === 'topup' ? '🏦 Nạp tiền qua VietQR Ngân hàng / Ví' : '💸 Rút tiền về tài khoản'}
        </Text>

        <View style={styles.presetRow}>
          {['50000', '100000', '200000', '500000'].map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.presetChip, amount === val && styles.presetChipActive]}
              onPress={() => setAmount(val)}
            >
              <Text style={[styles.presetText, amount === val && styles.presetTextActive]}>
                {formatVND(val)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="Nhập số tiền (VNĐ)"
        />

        {mode === 'topup' ? (
          <>
            <Image source={{ uri: qrImageUrl }} style={styles.qrImg} resizeMode="contain" />
            <Text style={styles.bankInfo}>
              {BANK_CONFIG.bankId} • STK: {BANK_CONFIG.accountNo} • {BANK_CONFIG.accountName}
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleConfirmTopup}>
              <Text style={styles.actionBtnText}>✅ Tôi đã chuyển khoản xong</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Tài khoản Ngân hàng / Ví MoMo / ZaloPay nhận tiền</Text>
            <TextInput
              style={styles.input}
              value={withdrawAccount}
              onChangeText={setWithdrawAccount}
              placeholder="Tên NH/Ví - Số tài khoản - Tên chủ TK"
            />
            <TouchableOpacity style={styles.actionBtn} onPress={handleConfirmWithdraw}>
              <Text style={styles.actionBtnText}>Xác nhận rút {formatVND(numericAmount)}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.historyTitle}>🧾 Lịch sử biến động số dư</Text>
      {transactions.map((tx) => (
        <View key={tx.id} style={styles.txRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txTitle}>{tx.title}</Text>
            <Text style={styles.txTime}>{formatDateTime(tx.createdAt)}</Text>
          </View>
          <Text
            style={[
              styles.txAmount,
              { color: tx.amount >= 0 ? COLORS.success : COLORS.primary },
            ]}
          >
            {tx.amount >= 0 ? `+${formatVND(tx.amount)}` : formatVND(tx.amount)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 14, paddingBottom: 30 },
  balanceCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  balanceLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  balanceValue: { color: COLORS.white, fontSize: 28, fontWeight: '900', marginVertical: 6 },
  tabRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  tabBtn: {
    flex: 1,
    backgroundColor: COLORS.darkSecondary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabBtnText: { color: '#D1D5DB', fontWeight: '700', fontSize: 13 },
  tabBtnTextActive: { color: COLORS.white, fontWeight: '900' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },
  presetRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  presetChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  presetChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  presetText: { fontSize: 11, fontWeight: '700', color: COLORS.dark },
  presetTextActive: { color: COLORS.primary },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  qrImg: { width: '100%', height: 210, marginVertical: 6 },
  bankInfo: { textAlign: 'center', fontSize: 12, color: COLORS.grayText, marginBottom: 10 },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  historyTitle: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 8 },
  txRow: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  txTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  txTime: { fontSize: 11, color: COLORS.grayText, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
});
