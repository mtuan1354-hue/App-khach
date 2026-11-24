import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';

const API_BASE = 'https://appkhach.mtuan1354.workers.dev';

const FALLBACK_CONFIG = {
  appName: 'NINJA SHIP',
  appLogo: '🥷',
  ratePerKm: 5000,
  promoBannerTitle: 'Giao nhanh 15 phút • 5.000đ/km',
  promoBannerSub: 'Tài xế Ninja ứng trước tiền hàng & giao tận tay điểm mua nhất.',
  services: [
    { id: 'dat-do-an', title: 'Đặt đồ ăn', icon: '🍜', badge: '-25% (1 lần)', discountRate: 0.25 },
    { id: 'mua-ho', title: 'Mua hộ đồ', icon: '🛍️', badge: '-20% (1 lần)', discountRate: 0.2 },
    { id: 'nhan-ho', title: 'Nhận hộ', icon: '📦', badge: '-15%', discountRate: 0.15 },
    { id: 'giao-do', title: 'Giao đồ Km', icon: '🛵', badge: '', discountRate: 0 },
  ],
};

function notifyUser(title, message) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
    window.alert(`${title}: ${message}`);
  }
}

export default function App() {
  const [config, setConfig] = useState(FALLBACK_CONFIG);
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedService, setSelectedService] = useState('Đặt đồ ăn');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [note, setNote] = useState('');
  const [distanceKm, setDistanceKm] = useState('3');
  const [drivers, setDrivers] = useState([]);

  async function fetchConfig() {
    try {
      const res = await fetch(`${API_BASE}/api/config`, { cache: 'no-store' });
      const data = await res.json();
      if (data && data.ok && data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      // Giữ cấu hình mặc định nếu mạng tạm ngắt
    }
  }

  async function fetchDrivers() {
    try {
      const res = await fetch(`${API_BASE}/api/drivers`, { cache: 'no-store' });
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.drivers)) {
        setDrivers(data.drivers);
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchConfig();
    fetchDrivers();
  }, []);

  function handleSendOtp() {
    const cleanPhone = String(phone || '').trim();
    if (!cleanPhone) {
      setStatusMsg('Vui lòng nhập số điện thoại trước khi lấy mã OTP.');
      return;
    }
    setOtpSent(true);
    setOtp('123456');
    setStatusMsg('Mã OTP test đã tự điền (123456). Bấm Xác nhận / Đăng ký ngay.');
  }

  async function handleRegisterOrLogin() {
    const cleanPhone = String(phone || '').trim();
    const cleanName = String(name || '').trim() || 'Khách hàng mới';
    if (!cleanPhone) {
      setStatusMsg('Vui lòng nhập số điện thoại.');
      notifyUser('Thiếu thông tin', 'Vui lòng nhập số điện thoại.');
      return;
    }

    setLoading(true);
    setStatusMsg('Đang đăng ký tài khoản...');
    try {
      const deviceId =
        Platform.OS === 'web' && typeof navigator !== 'undefined'
          ? navigator.userAgent.slice(0, 40)
          : `${Platform.OS}_device`;

      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          name: cleanName,
          role: 'customer',
          address: dropoffAddress.trim() || 'Đang hoạt động trên Web',
          lat: 0,
          lng: 0,
          deviceId,
          otp: otp.trim() || '123456',
        }),
      });

      const data = await res.json();
      if (res.ok && data && data.ok) {
        const loggedUser = data.user || { phone: cleanPhone, name: cleanName, role: 'customer' };
        setUser(loggedUser);
        setStatusMsg(`Đăng ký thành công: ${loggedUser.name} (${loggedUser.phone})`);
        fetchDrivers();
      } else {
        const errText = (data && data.error) || `Lỗi máy chủ (${res.status})`;
        setStatusMsg(errText);
        notifyUser('Đăng ký thất bại', errText);
      }
    } catch (e) {
      setStatusMsg('Không kết nối được tới máy chủ Worker.');
      notifyUser('Lỗi kết nối', 'Không kết nối được tới máy chủ Worker.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder() {
    if (!user) {
      setStatusMsg('Vui lòng đăng ký / đăng nhập trước khi đặt đơn.');
      return;
    }
    if (!dropoffAddress.trim()) {
      setStatusMsg('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    try {
      const km = Math.max(1, parseFloat(distanceKm) || 1);
      const rate = Number(config.ratePerKm) || 5000;
      const total = Math.round(km * rate);
      const orderPayload = {
        id: String(Date.now()).slice(-6),
        service: selectedService,
        customerName: user.name,
        customerPhone: user.phone,
        dropoffAddress: dropoffAddress.trim(),
        note: note.trim() || 'Giao nhanh',
        total,
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();
      if (res.ok && data && data.ok) {
        setDropoffAddress('');
        setNote('');
        setStatusMsg(`Đã tạo đơn #${orderPayload.id} (${total.toLocaleString('vi-VN')}đ).`);
      } else {
        setStatusMsg('Không thể gửi đơn hàng.');
      }
    } catch (e) {
      setStatusMsg('Lỗi mạng khi gửi đơn hàng.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>
            {config.appLogo || '🥷'} {config.appName || 'NINJA SHIP'}
          </Text>
          <Text style={styles.sub}>{config.promoBannerTitle}</Text>
          <Text style={styles.muted}>
            Giá cước: {Number(config.ratePerKm || 5000).toLocaleString('vi-VN')}đ/km • Tài xế: {drivers.length}
          </Text>
        </View>

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Đăng ký / Đăng nhập tài khoản</Text>

            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ tên"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Mã OTP (VD: 123456)"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleSendOtp} disabled={loading}>
                <Text style={styles.secondaryBtnText}>{otpSent ? 'Gửi lại OTP' : 'Lấy mã OTP'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterOrLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#052e16" />
              ) : (
                <Text style={styles.primaryBtnText}>Xác nhận OTP &amp; Đăng ký</Text>
              )}
            </TouchableOpacity>

            {!!statusMsg && <Text style={styles.status}>{statusMsg}</Text>}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Xin chào, {user.name}</Text>
            <Text style={styles.muted}>SĐT: {user.phone}</Text>

            <Text style={styles.label}>Chọn dịch vụ</Text>
            <View style={styles.chips}>
              {(config.services || []).map((srv) => {
                const active = selectedService === srv.title;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedService(srv.title)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {srv.icon} {srv.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Địa chỉ giao hàng</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa chỉ nhận hàng"
              placeholderTextColor="#64748b"
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
            />

            <Text style={styles.label}>Khoảng cách ước tính (Km)</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={distanceKm}
              onChangeText={setDistanceKm}
            />

            <Text style={styles.label}>Ghi chú đơn hàng</Text>
            <TextInput
              style={styles.input}
              placeholder="Ghi chú cho tài xế"
              placeholderTextColor="#64748b"
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateOrder} disabled={loading}>
              <Text style={styles.primaryBtnText}>Đặt đơn ngay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, styles.mt10]}
              onPress={() => {
                setUser(null);
                setOtp('');
                setOtpSent(false);
                setStatusMsg('');
              }}
            >
              <Text style={styles.secondaryBtnText}>Đổi tài khoản / Đăng xuất</Text>
            </TouchableOpacity>

            {!!statusMsg && <Text style={styles.status}>{statusMsg}</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 16, maxWidth: 680, width: '100%', alignSelf: 'center' },
  headerCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sub: { color: '#38bdf8', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  muted: { color: '#94a3b8', fontSize: 13 },
  label: { color: '#cbd5e1', fontSize: 13, marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 15,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  flex1: { flex: 1 },
  primaryBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryBtnText: { color: '#052e16', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#f8fafc', fontWeight: '600', fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    backgroundColor: '#0f172a',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  chipText: { color: '#cbd5e1', fontSize: 13 },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  status: { color: '#4ade80', fontSize: 13, marginTop: 10 },
  mt10: { marginTop: 10 },
});
