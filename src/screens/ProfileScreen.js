import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS } from '../config/constants';

export default function ProfileScreen({ profile, onSaveProfile }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [defaultAddress, setDefaultAddress] = useState(profile.defaultAddress);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và số điện thoại liên hệ.');
      return;
    }
    onSaveProfile({
      name: name.trim(),
      phone: phone.trim(),
      defaultAddress: defaultAddress.trim(),
    });
    Alert.alert('Đã lưu', 'Thông tin khách hàng Ninja Ship đã được cập nhật.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>👤 Hồ sơ Khách hàng</Text>

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Số điện thoại nhận hàng</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Địa chỉ nhận hàng mặc định</Text>
        <TextInput
          style={styles.input}
          value={defaultAddress}
          onChangeText={setDefaultAddress}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Lưu thông tin</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🥷 Về Ninja Ship Khách</Text>
        <Text style={styles.infoText}>
          • Ứng dụng đặt đồ ăn, mua hộ, nhận hộ và giao hàng nội thành tính cước tự động theo Km.
        </Text>
        <Text style={styles.infoText}>
          • Hỗ trợ thanh toán qua Ví Ninja Pay, quét mã VietQR hoặc Tiền mặt COD.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 14 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  infoCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 14,
    padding: 16,
  },
  infoTitle: { color: COLORS.white, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  infoText: { color: '#D1D5DB', fontSize: 13, lineHeight: 20, marginBottom: 4 },
});
