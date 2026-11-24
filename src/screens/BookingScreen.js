import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, PRICING, SERVICE_TYPES } from '../config/constants';
import { calculateShippingFee, formatVND } from '../utils/formatters';

export default function BookingScreen({ profile, walletBalance, onSubmitOrder }) {
  const [selectedService, setSelectedService] = useState(SERVICE_TYPES[0]);
  const [itemNote, setItemNote] = useState('');
  const [estimatedGoodsCost, setEstimatedGoodsCost] = useState('0');
  const [pickupAddress, setPickupAddress] = useState('45 Hùng Vương, Hải Châu');
  const [dropoffAddress, setDropoffAddress] = useState(
    profile.defaultAddress || '120 Lê Duẩn, Hải Châu'
  );
  const [distanceKm, setDistanceKm] = useState('2.5');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const kmNumber = Math.max(0.5, parseFloat(distanceKm.replace(',', '.')) || 1);
  const shippingFee = calculateShippingFee(kmNumber);
  const goodsCost = Math.max(0, parseInt(estimatedGoodsCost.replace(/\D/g, ''), 10) || 0);
  const totalAmount = shippingFee + goodsCost;

  const handleUseCurrentGPS = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Chưa cấp quyền vị trí', 'Vui lòng bật quyền GPS trong Cài đặt để lấy địa chỉ.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const places = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (places && places.length > 0) {
        const p = places[0];
        const formatted = [p.streetNumber, p.street, p.district, p.city]
          .filter(Boolean)
          .join(', ');
        setDropoffAddress(
          formatted || `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`
        );
      }
    } catch (e) {
      Alert.alert('Lỗi GPS', 'Không thể lấy tọa độ hiện tại. Bạn có thể nhập tay địa chỉ.');
    } finally {
      setLocating(false);
    }
  };

  const handleCreate = async () => {
    if (!itemNote.trim()) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập món ăn hoặc hàng hóa cần giao/mua hộ.');
      return;
    }
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng nhập đầy đủ điểm lấy hàng và điểm giao hàng.');
      return;
    }
    if (paymentMethod === 'wallet' && walletBalance < totalAmount) {
      Alert.alert(
        'Số dư Ninja Pay không đủ',
        `Cần ${formatVND(totalAmount)} nhưng ví chỉ còn ${formatVND(walletBalance)}. Vui lòng nạp thêm hoặc chọn Tiền mặt COD.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitOrder({
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        itemNote: itemNote.trim(),
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        distanceKm: kmNumber,
        shippingFee,
        goodsCost,
        totalAmount,
        paymentMethod,
      });
      setItemNote('');
      setEstimatedGoodsCost('0');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>1. Chọn dịch vụ Ninja Ship</Text>
      <View style={styles.serviceGrid}>
        {SERVICE_TYPES.map((srv) => {
          const active = selectedService.id === srv.id;
          return (
            <TouchableOpacity
              key={srv.id}
              style={[styles.serviceCard, active && styles.serviceCardActive]}
              onPress={() => setSelectedService(srv)}
            >
              <Text style={styles.serviceIcon}>{srv.icon}</Text>
              <Text style={[styles.serviceTitle, active && styles.serviceTitleActive]}>
                {srv.title}
              </Text>
              <Text style={styles.serviceDesc} numberOfLines={2}>
                {srv.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Chi tiết hàng hóa & lộ trình</Text>

        <Text style={styles.label}>Món cần đặt / Nội dung mua hộ *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={itemNote}
          onChangeText={setItemNote}
          placeholder={selectedService.placeholderNote}
          placeholderTextColor="#9CA3AF"
        />

        {selectedService.id !== 'express' && (
          <>
            <Text style={styles.label}>Tiền hàng ứng trước ước tính (VNĐ)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={estimatedGoodsCost}
              onChangeText={setEstimatedGoodsCost}
              placeholder="0"
            />
          </>
        )}

        <Text style={styles.label}>Điểm lấy hàng / Quán mua (Điểm A) *</Text>
        <TextInput
          style={styles.input}
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Nhập địa chỉ quán hoặc nơi lấy đồ"
        />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Điểm giao cho bạn (Điểm B) *</Text>
          <TouchableOpacity onPress={handleUseCurrentGPS} disabled={locating}>
            <Text style={styles.gpsLink}>
              {locating ? 'Đang định vị...' : '📍 Lấy vị trí GPS hiện tại'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={dropoffAddress}
          onChangeText={setDropoffAddress}
          placeholder="Nhập địa chỉ nhận hàng"
        />

        <Text style={styles.label}>
          Khoảng cách (Km) — {formatVND(PRICING.baseFare)}/{PRICING.baseKm}km đầu, sau đó{' '}
          {formatVND(PRICING.ratePerKm)}/km
        </Text>
        <View style={styles.kmRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            keyboardType="decimal-pad"
            value={distanceKm}
            onChangeText={setDistanceKm}
          />
          {['1.5', '3.0', '5.0', '8.0'].map((preset) => (
            <TouchableOpacity
              key={preset}
              style={styles.kmPresetBtn}
              onPress={() => setDistanceKm(preset)}
            >
              <Text style={styles.kmPresetText}>{preset}km</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>3. Phương thức thanh toán</Text>
        <View style={styles.payRow}>
          {[
            { id: 'wallet', label: '💳 Ví Ninja Pay' },
            { id: 'vietqr', label: '🏦 Chuyển VietQR' },
            { id: 'cod', label: '💵 Tiền mặt COD' },
          ].map((m) => {
            const active = paymentMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.payChip, active && styles.payChipActive]}
                onPress={() => setPaymentMethod(m.id)}
              >
                <Text style={[styles.payChipText, active && styles.payChipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Cước vận chuyển ({kmNumber} km):</Text>
            <Text style={styles.summaryVal}>{formatVND(shippingFee)}</Text>
          </View>
          {goodsCost > 0 && (
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Tiền hàng ứng hộ:</Text>
              <Text style={styles.summaryVal}>{formatVND(goodsCost)}</Text>
            </View>
          )}
          <View style={[styles.summaryLine, styles.totalLine]}>
            <Text style={styles.totalLabel}>TỔNG THANH TOÁN:</Text>
            <Text style={styles.totalVal}>{formatVND(totalAmount)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>🚀 TÌM TÀI XẾ NINJA NGAY</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 14, paddingBottom: 30 },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },
  serviceGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  serviceCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  serviceCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  serviceIcon: { fontSize: 22, marginBottom: 4 },
  serviceTitle: { fontSize: 12, fontWeight: '800', color: COLORS.dark },
  serviceTitleActive: { color: COLORS.primary },
  serviceDesc: { fontSize: 10, color: COLORS.grayText, marginTop: 3 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 8, marginBottom: 4 },
  gpsLink: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.dark,
    backgroundColor: '#F9FAFB',
  },
  textArea: { minHeight: 64, textAlignVertical: 'top' },
  kmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kmPresetBtn: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 8,
  },
  kmPresetText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  payRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  payChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  payChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  payChipText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  payChipTextActive: { color: COLORS.primary, fontWeight: '800' },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  summaryLabel: { fontSize: 13, color: COLORS.grayText },
  summaryVal: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  totalVal: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '900', letterSpacing: 0.4 },
});
