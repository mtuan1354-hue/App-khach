import React, { useEffect, useRef, useState } from 'react';
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
const SESSION_KEY = 'NINJA_SHIP_CUSTOMER_SESSION_V1';

const DEFAULT_CONFIG = {
  appName: 'NINJA SHIP',
  appLogo: '🥷',
  ratePerKm: 5000,
  promoBannerTitle: 'Giao nhanh 15 phút • 5.000đ/km',
  promoBannerSub: 'Tài xế Ninja ứng trước tiền hàng & giao tận tay điểm mua nhất.',
  services: [
    { id: 'dat-do-an', title: 'Đặt đồ ăn', icon: '🍜', badge: '-25% (1 lần)', discountRate: 0.25, active: true },
    { id: 'mua-ho', title: 'Mua hộ đồ', icon: '🛍️', badge: '-20% (1 lần)', discountRate: 0.2, active: true },
    { id: 'nhan-ho', title: 'Nhận hộ', icon: '📦', badge: '-15%', discountRate: 0.15, active: true },
    { id: 'lam-ho', title: 'Làm hộ', icon: '⚡', badge: 'MỚI', discountRate: 0, active: true },
    { id: 'di-cho', title: 'Đi chợ hộ', icon: '🥬', badge: '', discountRate: 0, active: true },
    { id: 'mua-thuoc', title: 'Mua thuốc', icon: '💊', badge: '', discountRate: 0, active: true },
    { id: 'giao-do', title: 'Giao đồ Km', icon: '🛵', badge: '', discountRate: 0, active: true },
    { id: 'tai-xe', title: 'Tài xế gần', icon: '📍', badge: '', discountRate: 0, active: true },
    { id: 'uu-dai', title: 'Ưu đãi', icon: '🎁', badge: '', discountRate: 0, active: true },
    { id: 'gia-cuoc', title: 'Giá cước Km', icon: '💰', badge: '', discountRate: 0, active: true },
  ],
};

function normalizePhone(raw) {
  return String(raw || '').replace(/[^0-9+]/g, '').trim();
}

function readSavedSession() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
  }
  return null;
}

function writeSavedSession(userObj) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      if (userObj) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {}
  }
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [user, setUser] = useState(() => readSavedSession());

  // Form đăng ký / đăng nhập + OTP
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  // Vị trí GPS
  const [gpsAddress, setGpsAddress] = useState('Chưa cập nhật GPS');
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });

  // Đặt đơn & tài xế
  const [selectedService, setSelectedService] = useState('Đặt đồ ăn');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [note, setNote] = useState('');
  const [distanceKm, setDistanceKm] = useState('3');
  const [drivers, setDrivers] = useState([]);

  // Trạng thái thao tác
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);

  async function loadConfig() {
    try {
      const res = await fetch(`${API_BASE}/api/config`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data && data.ok && data.config) {
        setConfig(data.config);
        if (Array.isArray(data.config.services) && data.config.services.length > 0) {
          const exists = data.config.services.some((s) => s.title === selectedService);
          if (!exists) setSelectedService(data.config.services[0].title);
        }
      }
    } catch (e) {}
  }

  async function loadDrivers() {
    try {
      const res = await fetch(`${API_BASE}/api/drivers`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data && data.ok && Array.isArray(data.drivers)) {
        setDrivers(data.drivers);
      }
    } catch (e) {}
  }

  async function syncLocationToWorker(activeUser, latVal, lngVal, addrText) {
    const targetUser = activeUser || user;
    if (!targetUser || !targetUser.phone) return;
    try {
      await fetch(`${API_BASE}/api/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetUser.phone,
          name: targetUser.name || 'Khách hàng',
          role: 'customer',
          address: addrText || `${latVal}, ${lngVal}`,
          lat: latVal,
          lng: lngVal,
        }),
      });
    } catch (e) {}
  }

  function requestCurrentGps(activeUser) {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const addr = `GPS: ${lat}, ${lng}`;
          setCoords({ lat, lng });
          setGpsAddress(addr);
          syncLocationToWorker(activeUser, lat, lng, addr);
        },
        () => {
          // Bỏ qua nếu người dùng từ chối quyền vị trí
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  useEffect(() => {
    loadConfig();
    loadDrivers();
    const saved = readSavedSession();
    if (saved && saved.phone) {
      requestCurrentGps(saved);
    }
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setResendSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendSeconds]);

  function handleSendOtp() {
    setErrorMsg('');
    setStatusMsg('');
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 8) {
      setErrorMsg('Vui lòng nhập số điện thoại hợp lệ (ít nhất 8 chữ số).');
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpInput(code);
    setOtpSent(true);
    setOtpVerified(false);
    setResendSeconds(60);
    setStatusMsg(`Đã tạo mã OTP: ${code} (tự điền sẵn để xác nhận nhanh, hoặc nhập mã 6 số).`);
  }

  function handleVerifyOtpOnly() {
    setErrorMsg('');
    const entered = String(otpInput || '').trim();
    if (!otpSent || !generatedOtp) {
      setErrorMsg('Hãy bấm "Gửi mã OTP" trước khi xác nhận.');
      return;
    }
    if (entered.length < 4) {
      setErrorMsg('Vui lòng nhập mã OTP gồm 4-6 chữ số.');
      return;
    }
    if (entered !== generatedOtp && entered !== '123456') {
      setErrorMsg(`Mã OTP chưa khớp. Mã hiện tại là ${generatedOtp} (hoặc nhập 123456).`);
      return;
    }
    setOtpVerified(true);
    setStatusMsg('Xác thực OTP thành công! Bạn có thể bấm "Hoàn tất đăng ký / Đăng nhập".');
  }

  async function submitRegisterRequest(cleanPhone, cleanName, otpCodeUsed) {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Đang gửi thông tin tài khoản tới máy chủ...');
    try {
      const deviceId =
        Platform.OS === 'web' && typeof navigator !== 'undefined'
          ? navigator.userAgent.slice(0, 48)
          : `${Platform.OS}_app`;

      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          name: cleanName,
          role: 'customer',
          address: gpsAddress || 'Chưa cập nhật GPS',
          lat: coords.lat || 0,
          lng: coords.lng || 0,
          deviceId,
          otp: otpCodeUsed || '123456',
          otpVerified: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data && data.ok) {
        const loggedUser = data.user || {
          phone: cleanPhone,
          name: cleanName,
          role: 'customer',
          address: gpsAddress,
        };
        setUser(loggedUser);
        writeSavedSession(loggedUser);
        setStatusMsg(
          data.isNew
            ? `Đăng ký tài khoản mới thành công: ${loggedUser.name} (${loggedUser.phone})`
            : `Đăng nhập thành công: ${loggedUser.name} (${loggedUser.phone})`
        );
        requestCurrentGps(loggedUser);
        loadDrivers();
      } else {
        setErrorMsg((data && data.error) || `Không thể đăng ký (mã lỗi ${res.status}).`);
      }
    } catch (e) {
      setErrorMsg('Lỗi kết nối tới Worker. Kiểm tra lại mạng hoặc domain.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmOtpAndRegister() {
    setErrorMsg('');
    const cleanPhone = normalizePhone(phone);
    const cleanName = String(name || '').trim() || `Khách ${cleanPhone.slice(-4) || 'mới'}`;

    if (cleanPhone.length < 8) {
      setErrorMsg('Vui lòng nhập số điện thoại trước khi xác nhận OTP.');
      return;
    }

    const entered = String(otpInput || '').trim();
    const activeOtp = generatedOtp || '123456';
    const codeToUse = entered || activeOtp;

    if (entered && otpSent && entered !== generatedOtp && entered !== '123456') {
      setErrorMsg(`Sai mã OTP. Hãy nhập ${generatedOtp} hoặc 123456.`);
      return;
    }

    setOtpVerified(true);
    await submitRegisterRequest(cleanPhone, cleanName, codeToUse);
  }

  async function handleQuickLoginExisting() {
    setErrorMsg('');
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 8) {
      setErrorMsg('Nhập số điện thoại tài khoản cũ để đăng nhập nhanh.');
      return;
    }
    const cleanName = String(name || '').trim() || `Khách ${cleanPhone.slice(-4)}`;
    await submitRegisterRequest(cleanPhone, cleanName, '123456');
  }

  async function handleCreateOrder() {
    if (!user) {
      setErrorMsg('Vui lòng đăng nhập / đăng ký trước khi đặt đơn.');
      return;
    }
    if (!String(dropoffAddress || '').trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Đang gửi đơn hàng...');
    try {
      const km = Math.max(1, parseFloat(distanceKm) || 1);
      const rate = Number(config.ratePerKm) || 5000;
      const srvObj = (config.services || []).find((s) => s.title === selectedService);
      const disc = srvObj && Number(srvObj.discountRate) > 0 ? Number(srvObj.discountRate) : 0;
      const rawFee = km * rate;
      const total = Math.max(1000, Math.round(rawFee * (1 - disc)));

      const orderPayload = {
        id: String(Date.now()).slice(-6),
        service: selectedService,
        customerName: user.name,
        customerPhone: user.phone,
        dropoffAddress: dropoffAddress.trim(),
        note: String(note || '').trim() || 'Giao nhanh',
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
        setStatusMsg(`Đã tạo đơn #${orderPayload.id} • Tổng: ${total.toLocaleString('vi-VN')}đ`);
      } else {
        setErrorMsg('Gửi đơn hàng thất bại.');
      }
    } catch (e) {
      setErrorMsg('Lỗi mạng khi gửi đơn hàng.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    writeSavedSession(null);
    setUser(null);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpInput('');
    setGeneratedOtp('');
    setResendSeconds(0);
    setErrorMsg('');
    setStatusMsg('Đã đăng xuất. Bạn có thể đăng ký tài khoản mới hoặc đăng nhập lại.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <Text style={styles.title}>
            {config.appLogo || '🥷'} {config.appName || 'NINJA SHIP'}
          </Text>
          <Text style={styles.sub}>{config.promoBannerTitle}</Text>
          <Text style={styles.muted}>
            Giá cước: {Number(config.ratePerKm || 5000).toLocaleString('vi-VN')}đ/km • Tài xế hoạt động: {drivers.length}
          </Text>
        </View>

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Đăng ký tài khoản mới / OTP</Text>
            <Text style={styles.muted}>
              Nhập họ tên và số điện thoại, lấy mã OTP và xác nhận để tạo tài khoản trên hệ thống.
            </Text>

            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Nguyễn Văn A"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 0912345678"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                if (otpVerified) setOtpVerified(false);
              }}
            />

            <Text style={styles.label}>Mã xác thực OTP</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Nhập mã OTP (6 số)"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                maxLength={6}
                value={otpInput}
                onChangeText={(val) => {
                  setOtpInput(val);
                  if (otpVerified) setOtpVerified(false);
                }}
              />
              <TouchableOpacity
                style={[styles.secondaryBtn, resendSeconds > 0 && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading || resendSeconds > 0}
              >
                <Text style={styles.secondaryBtnText}>
                  {resendSeconds > 0 ? `Gửi lại (${resendSeconds}s)` : otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.outlineBtn, styles.flex1]}
                onPress={handleVerifyOtpOnly}
                disabled={loading}
              >
                <Text style={styles.outlineBtnText}>
                  {otpVerified ? '✓ Đã xác thực OTP' : 'Kiểm tra mã OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineBtn, styles.flex1]}
                onPress={handleQuickLoginExisting}
                disabled={loading}
              >
                <Text style={styles.outlineBtnText}>Đăng nhập nhanh SĐT</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleConfirmOtpAndRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#052e16" />
              ) : (
                <Text style={styles.primaryBtnText}>Xác nhận OTP &amp; Đăng ký tài khoản</Text>
              )}
            </TouchableOpacity>

            {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            {!!statusMsg && <Text style={styles.statusText}>{statusMsg}</Text>}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.topBar}>
              <View style={styles.flex1}>
                <Text style={styles.sectionTitle}>Xin chào, {user.name}</Text>
                <Text style={styles.muted}>SĐT: {user.phone} • {gpsAddress}</Text>
              </View>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleLogout}>
                <Text style={styles.secondaryBtnText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Chọn dịch vụ</Text>
            <View style={styles.chips}>
              {(config.services || []).map((srv) => {
                const isSel = selectedService === srv.title;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    style={[styles.chip, isSel && styles.chipActive]}
                    onPress={() => setSelectedService(srv.title)}
                  >
                    <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                      {srv.icon} {srv.title} {srv.badge ? `(${srv.badge})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Địa chỉ giao hàng</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa chỉ giao hàng"
              placeholderTextColor="#64748b"
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Khoảng cách (Km)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={distanceKm}
                  onChangeText={setDistanceKm}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Ghi chú</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Giao nhanh"
                  placeholderTextColor="#64748b"
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleCreateOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#052e16" />
              ) : (
                <Text style={styles.primaryBtnText}>Đặt đơn ngay</Text>
              )}
            </TouchableOpacity>

            {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            {!!statusMsg && <Text style={styles.statusText}>{statusMsg}</Text>}
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sub: { color: '#38bdf8', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  muted: { color: '#94a3b8', fontSize: 13 },
  label: { color: '#cbd5e1', fontSize: 13, marginTop: 12, marginBottom: 5 },
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
  secondaryBtnText: { color: '#f8fafc', fontWeight: '600', fontSize: 13 },
  outlineBtn: {
    backgroundColor: '#0f172a',
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  outlineBtnText: { color: '#7dd3fc', fontWeight: '600', fontSize: 13 },
  btnDisabled: { opacity: 0.55 },
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
  errorText: { color: '#f87171', fontSize: 13, marginTop: 10, fontWeight: '600' },
  statusText: { color: '#4ade80', fontSize: 13, marginTop: 10 },
});
