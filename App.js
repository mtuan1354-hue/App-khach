import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Modal,
  Switch,
} from 'react-native';

const API_BASE = 'https://appkhach.mtuan1354.workers.dev';
const SESSION_KEY = 'NINJA_SHIP_V9_SESSION';
const ORDERS_KEY = 'NINJA_SHIP_V9_ORDERS';
const WALLET_KEY = 'NINJA_SHIP_V9_WALLET';
const PREFS_KEY = 'NINJA_SHIP_V9_PREFS';
const DEMO_OTP = '123456';

const DEFAULT_CONFIG = {
  appName: 'NINJA SHIP',
  appLogo: '🥷',
  ratePerKm: 5000,
  baseFare: 10000,
  minFare: 15000,
  promoBannerTitle: 'Giao nhanh 15 phút • 5.000đ/km',
  promoBannerSub: 'Tài xế Ninja ứng trước tiền hàng & giao tận tay điểm mua nhất.',
  supportPhone: '0900000000',
  services: [
    {
      id: 'dat-do-an',
      title: 'Đặt đồ ăn',
      icon: '🍜',
      badge: '-25% (1 lần)',
      discountRate: 0.25,
      active: true,
      description: 'Đặt đồ ăn, trà sữa, cà phê và giao tận nơi nhanh chóng.',
    },
    {
      id: 'mua-ho',
      title: 'Mua hộ đồ',
      icon: '🛍️',
      badge: '-20% (1 lần)',
      discountRate: 0.2,
      active: true,
      description: 'Tài xế mua hộ hàng hóa, phụ kiện theo danh sách.',
    },
    {
      id: 'nhan-ho',
      title: 'Nhận hộ',
      icon: '📦',
      badge: '-15%',
      discountRate: 0.15,
      active: true,
      description: 'Nhận hàng, giấy tờ, bưu kiện và giao tới tận tay.',
    },
    {
      id: 'lam-ho',
      title: 'Làm hộ',
      icon: '⚡',
      badge: 'MỚI',
      discountRate: 0,
      active: true,
      description: 'Thực hiện công việc/thủ tục/giao nhận theo yêu cầu.',
    },
    {
      id: 'di-cho',
      title: 'Đi chợ hộ',
      icon: '🥬',
      badge: '-10%',
      discountRate: 0.1,
      active: true,
      description: 'Đi chợ chọn thực phẩm tươi sống theo ghi chú.',
    },
    {
      id: 'mua-thuoc',
      title: 'Mua thuốc',
      icon: '💊',
      badge: '',
      discountRate: 0,
      active: true,
      description: 'Mua thuốc và vật tư y tế tại nhà thuốc.',
    },
    {
      id: 'giao-do',
      title: 'Giao đồ Km',
      icon: '🛵',
      badge: '',
      discountRate: 0,
      active: true,
      description: 'Tính cước linh hoạt theo quãng đường Km.',
    },
    {
      id: 'tai-xe',
      title: 'Tài xế gần',
      icon: '📍',
      badge: 'LIVE',
      discountRate: 0,
      active: true,
      description: 'Xem các tài xế đang hoạt động trên hệ thống.',
    },
    {
      id: 'uu-dai',
      title: 'Ưu đãi',
      icon: '🎁',
      badge: 'HOT',
      discountRate: 0.15,
      active: true,
      description: 'Áp dụng ưu đãi giảm cước theo từng dịch vụ.',
    },
    {
      id: 'gia-cuoc',
      title: 'Giá cước Km',
      icon: '💰',
      badge: '',
      discountRate: 0,
      active: true,
      description: 'Tra cứu bảng giá cước theo quãng đường Km.',
    },
  ],
};

function parseJsonSafe(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function loadStore(key, fallback) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      return parseJsonSafe(window.localStorage.getItem(key), fallback);
    } catch (e) {
      return fallback;
    }
  }
  return fallback;
}

function saveStore(key, val) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      if (val === null || val === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(val));
      }
    } catch (e) {}
  }
}

function cleanPhone(raw) {
  return String(raw || '').replace(/[^0-9+]/g, '').trim();
}

function formatMoney(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '0đ';
  return `${Math.round(n).toLocaleString('vi-VN')}đ`;
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function makeOrderCode() {
  return `V9${String(Date.now()).slice(-6)}${Math.floor(10 + Math.random() * 89)}`;
}

function calcFare(cfg, srv, kmInput, advInput) {
  const km = Math.max(0.5, Number(kmInput) || 1);
  const rate = Math.max(500, Number(cfg && cfg.ratePerKm) || 5000);
  const base = Math.max(0, Number(cfg && cfg.baseFare) || 0);
  const minFare = Math.max(0, Number(cfg && cfg.minFare) || 0);
  const discountRate =
    srv && Number(srv.discountRate) > 0 ? Math.min(0.9, Number(srv.discountRate)) : 0;
  const advance = Math.max(0, Number(advInput) || 0);

  const rawFee = Math.max(minFare, Math.round(base + km * rate));
  const discountAmount = Math.round(rawFee * discountRate);
  const shippingFee = Math.max(0, rawFee - discountAmount);
  const total = Math.round(shippingFee + advance);

  return {
    km,
    rate,
    discountRate,
    rawFee,
    discountAmount,
    shippingFee,
    advance,
    total,
  };
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [user, setUser] = useState(() => loadStore(SESSION_KEY, null));
  const [orders, setOrders] = useState(() => loadStore(ORDERS_KEY, []));
  const [wallet, setWallet] = useState(() => loadStore(WALLET_KEY, { balance: 0, logs: [] }));
  const [prefs, setPrefs] = useState(() =>
    loadStore(PREFS_KEY, { autoGps: true, soundAlert: true })
  );

  // Điều hướng tab
  const [tab, setTab] = useState('home'); // home | order | drivers | history | account

  // Form OTP & tài khoản
  const [authTab, setAuthTab] = useState('register'); // register | login
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [issuedOtp, setIssuedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpConfirmed, setOtpConfirmed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // GPS
  const [gpsText, setGpsText] = useState('Chưa cập nhật GPS');
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [gpsBusy, setGpsBusy] = useState(false);

  // Đặt đơn
  const [selectedServiceId, setSelectedServiceId] = useState('dat-do-an');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [kmStr, setKmStr] = useState('3');
  const [advanceStr, setAdvanceStr] = useState('0');
  const [note, setNote] = useState('');

  // Tài xế & ví
  const [drivers, setDrivers] = useState([]);
  const [driverFilter, setDriverFilter] = useState('');
  const [topupStr, setTopupStr] = useState('100000');

  // Trạng thái chung
  const [busy, setBusy] = useState(false);
  const [msgOk, setMsgOk] = useState('');
  const [msgErr, setMsgErr] = useState('');
  const [fareModalVisible, setFareModalVisible] = useState(false);

  const timerRef = useRef(null);

  const services = useMemo(() => {
    const arr = Array.isArray(config && config.services) ? config.services : DEFAULT_CONFIG.services;
    return arr.filter((s) => s && s.active !== false);
  }, [config]);

  const currentService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || services[0] || DEFAULT_CONFIG.services[0];
  }, [services, selectedServiceId]);

  const fare = useMemo(() => {
    return calcFare(config, currentService, kmStr, advanceStr);
  }, [config, currentService, kmStr, advanceStr]);

  const visibleDrivers = useMemo(() => {
    const q = String(driverFilter || '').trim().toLowerCase();
    const list = Array.isArray(drivers) ? drivers : [];
    if (!q) return list;
    return list.filter((d) =>
      `${d.name || ''} ${d.phone || ''} ${d.address || ''}`.toLowerCase().includes(q)
    );
  }, [drivers, driverFilter]);

  function resetAlerts() {
    setMsgOk('');
    setMsgErr('');
  }

  async function pullConfig() {
    try {
      const res = await fetch(`${API_BASE}/api/config`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data && data.ok && data.config) {
        setConfig((prev) => ({
          ...DEFAULT_CONFIG,
          ...prev,
          ...data.config,
          services:
            Array.isArray(data.config.services) && data.config.services.length > 0
              ? data.config.services
              : prev.services || DEFAULT_CONFIG.services,
        }));
      }
    } catch (e) {}
  }

  async function pullDrivers() {
    try {
      const res = await fetch(`${API_BASE}/api/drivers`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data && data.ok && Array.isArray(data.drivers)) {
        setDrivers(data.drivers);
      }
    } catch (e) {}
  }

  async function syncGpsToServer(targetUser, lat, lng, addr) {
    const active = targetUser || user;
    if (!active || !active.phone) return;
    setGpsBusy(true);
    try {
      await fetch(`${API_BASE}/api/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: active.phone,
          name: active.name || 'Khách hàng',
          role: 'customer',
          address: addr || `${lat}, ${lng}`,
          lat,
          lng,
        }),
      });
    } catch (e) {} finally {
      setGpsBusy(false);
    }
  }

  function updateGps(targetUser) {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      setGpsBusy(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const addr = `GPS: ${lat}, ${lng}`;
          setCoords({ lat, lng });
          setGpsText(addr);
          syncGpsToServer(targetUser, lat, lng, addr);
        },
        () => {
          setGpsBusy(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  useEffect(() => {
    pullConfig();
    pullDrivers();
    const saved = loadStore(SESSION_KEY, null);
    if (saved && saved.phone) {
      setName(saved.name || '');
      setPhone(saved.phone || '');
      if (prefs.autoGps) updateGps(saved);
    }
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft]);

  function onSendOtp() {
    resetAlerts();
    const p = cleanPhone(phone);
    if (p.length < 8) {
      setMsgErr('Vui lòng nhập số điện thoại (ít nhất 8 chữ số) trước khi lấy mã OTP.');
      return;
    }
    const code = randomOtp();
    setIssuedOtp(code);
    setOtp(code);
    setOtpSent(true);
    setOtpConfirmed(false);
    setSecondsLeft(60);
    setMsgOk(`Đã gửi mã OTP ${code} tới ${p} (đã điền sẵn mã, bấm Xác nhận OTP & Đăng ký).`);
  }

  function onCheckOtp() {
    resetAlerts();
    const p = cleanPhone(phone);
    if (p.length < 8) {
      setMsgErr('Vui lòng nhập số điện thoại hợp lệ.');
      return;
    }
    const typed = String(otp || '').trim();
    if (!typed) {
      setMsgErr('Vui lòng bấm "Gửi mã OTP" hoặc nhập mã OTP.');
      return;
    }
    if (otpSent && issuedOtp && typed !== issuedOtp && typed !== DEMO_OTP) {
      setMsgErr(`Mã OTP chưa khớp. Mã hiện tại là ${issuedOtp} (hoặc nhập ${DEMO_OTP}).`);
      return;
    }
    setOtpConfirmed(true);
    setMsgOk('Mã OTP hợp lệ! Bấm "Xác nhận OTP & Đăng ký" để tạo/vào tài khoản.');
  }

  async function sendRegisterApi(p, n, codeUsed) {
    setBusy(true);
    resetAlerts();
    setMsgOk('Đang gửi tài khoản lên máy chủ...');
    try {
      const devId =
        Platform.OS === 'web' && typeof navigator !== 'undefined'
          ? `WEB_${navigator.userAgent.slice(0, 32)}`
          : `${Platform.OS}_app`;

      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: p,
          name: n,
          role: 'customer',
          address: dropoff.trim() || (gpsText !== 'Chưa cập nhật GPS' ? gpsText : 'Đang hoạt động trên Web'),
          lat: coords.lat || 0,
          lng: coords.lng || 0,
          deviceId: devId,
          otp: codeUsed || DEMO_OTP,
          otpVerified: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data && data.ok) {
        const logged = data.user || { phone: p, name: n, role: 'customer' };
        setUser(logged);
        saveStore(SESSION_KEY, logged);
        setOtpConfirmed(true);
        setMsgOk(
          data.isNew
            ? `Đăng ký thành công: ${logged.name} (${logged.phone})`
            : `Đăng nhập thành công: ${logged.name} (${logged.phone})`
        );
        if (prefs.autoGps) updateGps(logged);
        pullDrivers();
      } else {
        setMsgErr((data && data.error) || `Đăng ký thất bại (lỗi ${res.status}).`);
      }
    } catch (e) {
      setMsgErr('Không kết nối được tới máy chủ Worker.');
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmOtpAndRegister() {
    resetAlerts();
    const p = cleanPhone(phone);
    const n = String(name || '').trim() || `Khách ${p.slice(-4) || 'mới'}`;
    if (p.length < 8) {
      setMsgErr('Vui lòng nhập số điện thoại hợp lệ.');
      return;
    }
    const typed = String(otp || '').trim();
    const code = typed || issuedOtp || DEMO_OTP;
    if (typed && otpSent && issuedOtp && typed !== issuedOtp && typed !== DEMO_OTP) {
      setMsgErr(`Sai mã OTP. Hãy nhập ${issuedOtp} hoặc ${DEMO_OTP}.`);
      return;
    }
    await sendRegisterApi(p, n, code);
  }

  async function onQuickLogin() {
    resetAlerts();
    const p = cleanPhone(phone);
    if (p.length < 8) {
      setMsgErr('Nhập số điện thoại để đăng nhập nhanh.');
      return;
    }
    const n = String(name || '').trim() || `Khách ${p.slice(-4)}`;
    setOtp(DEMO_OTP);
    setOtpConfirmed(true);
    await sendRegisterApi(p, n, DEMO_OTP);
  }

  function onLogout() {
    saveStore(SESSION_KEY, null);
    setUser(null);
    setOtpSent(false);
    setOtpConfirmed(false);
    setOtp('');
    setIssuedOtp('');
    setSecondsLeft(0);
    setTab('home');
    resetAlerts();
    setMsgOk('Đã đăng xuất. Bạn có thể đăng ký tài khoản mới hoặc đăng nhập lại.');
  }

  async function onCreateOrder() {
    resetAlerts();
    if (!user || !user.phone) {
      setMsgErr('Vui lòng đăng ký / đăng nhập trước khi đặt đơn.');
      return;
    }
    if (!dropoff.trim()) {
      setMsgErr('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    setBusy(true);
    setMsgOk('Đang gửi đơn hàng...');
    try {
      const ord = {
        id: makeOrderCode(),
        service: currentService ? currentService.title : 'Đặt đồ ăn',
        customerName: user.name,
        customerPhone: user.phone,
        pickupAddress: pickup.trim() || gpsText || 'Điểm mua gần nhất',
        dropoffAddress: dropoff.trim(),
        note: note.trim() || 'Giao nhanh',
        total: fare.total,
        status: 'Đã gửi',
        createdAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ord),
      });
      const data = await res.json();
      if (res.ok && data && data.ok) {
        const nextList = [ord, ...orders].slice(0, 50);
        setOrders(nextList);
        saveStore(ORDERS_KEY, nextList);
        setDropoff('');
        setNote('');
        setAdvanceStr('0');
        setTab('history');
        setMsgOk(`Đã tạo đơn #${ord.id} • Tổng: ${formatMoney(ord.total)}`);
      } else {
        setMsgErr('Không thể gửi đơn hàng.');
      }
    } catch (e) {
      setMsgErr('Lỗi kết nối khi đặt đơn.');
    } finally {
      setBusy(false);
    }
  }

  function onTopupWallet() {
    resetAlerts();
    const amt = Math.max(1000, Number(String(topupStr || '').replace(/\D/g, '')) || 0);
    const nextW = {
      balance: (Number(wallet.balance) || 0) + amt,
      logs: [
        {
          id: `NAP${String(Date.now()).slice(-6)}`,
          amount: amt,
          time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        },
        ...(wallet.logs || []),
      ].slice(0, 20),
    };
    setWallet(nextW);
    saveStore(WALLET_KEY, nextW);
    setMsgOk(`Đã cộng ${formatMoney(amt)} vào số dư ví trên thiết bị.`);
  }

  const sampleKmList = [1, 2, 3, 5, 10, 15, 20];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.rowBetween}>
            <View style={styles.flex1}>
              <Text style={styles.appTitle}>
                {config.appLogo || '🥷'} {config.appName || 'NINJA SHIP'} • V9
              </Text>
              <Text style={styles.banner}>{config.promoBannerTitle}</Text>
              <Text style={styles.subBanner}>{config.promoBannerSub}</Text>
            </View>
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={() => {
                pullConfig();
                pullDrivers();
                if (user) updateGps(user);
              }}
            >
              <Text style={styles.reloadBtnText}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaPill}>Giá: {formatMoney(config.ratePerKm)}/km</Text>
            <Text style={styles.metaPill}>Tài xế: {drivers.length}</Text>
            <Text style={styles.metaPill}>{gpsBusy ? 'GPS: Đang lấy...' : gpsText}</Text>
          </View>
        </View>

        {!!msgErr && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{msgErr}</Text>
          </View>
        )}
        {!!msgOk && (
          <View style={styles.okBox}>
            <Text style={styles.okText}>{msgOk}</Text>
          </View>
        )}

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.h2}>Đăng ký / Đăng nhập &amp; Xác thực OTP</Text>
            <Text style={styles.muted}>
              Nhập họ tên và số điện thoại, bấm "Gửi mã OTP", kiểm tra/xác nhận mã và bấm "Xác nhận OTP &amp; Đăng ký".
            </Text>

            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, authTab === 'register' && styles.modeBtnOn]}
                onPress={() => {
                  setAuthTab('register');
                  resetAlerts();
                }}
              >
                <Text style={[styles.modeTxt, authTab === 'register' && styles.modeTxtOn]}>
                  Đăng ký mới
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, authTab === 'login' && styles.modeBtnOn]}
                onPress={() => {
                  setAuthTab('login');
                  resetAlerts();
                }}
              >
                <Text style={[styles.modeTxt, authTab === 'login' && styles.modeTxtOn]}>
                  Đăng nhập OTP
                </Text>
              </TouchableOpacity>
            </View>

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
              onChangeText={(v) => {
                setPhone(v);
                if (otpConfirmed) setOtpConfirmed(false);
              }}
            />

            <Text style={styles.label}>Mã OTP</Text>
            <View style={styles.rowGap}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Mã OTP (6 số)"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(v) => {
                  setOtp(v);
                  if (otpConfirmed) setOtpConfirmed(false);
                }}
              />
              <TouchableOpacity
                style={[styles.secBtn, secondsLeft > 0 && styles.disabled]}
                onPress={onSendOtp}
                disabled={busy || secondsLeft > 0}
              >
                <Text style={styles.secBtnTxt}>
                  {secondsLeft > 0 ? `Gửi lại (${secondsLeft}s)` : otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowGap}>
              <TouchableOpacity style={[styles.outBtn, styles.flex1]} onPress={onCheckOtp} disabled={busy}>
                <Text style={styles.outBtnTxt}>
                  {otpConfirmed ? '✓ Đã xác nhận OTP' : 'Xác nhận mã OTP'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.outBtn, styles.flex1]} onPress={onQuickLogin} disabled={busy}>
                <Text style={styles.outBtnTxt}>Đăng nhập nhanh SĐT</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.priBtn, busy && styles.disabled]}
              onPress={onConfirmOtpAndRegister}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#052e16" />
              ) : (
                <Text style={styles.priBtnTxt}>
                  {authTab === 'register'
                    ? 'Xác nhận OTP & Đăng ký tài khoản'
                    : 'Xác nhận OTP & Đăng nhập'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.tabs}>
              {[
                { id: 'home', label: 'Trang chủ' },
                { id: 'order', label: 'Đặt đơn' },
                { id: 'drivers', label: 'Tài xế' },
                { id: 'history', label: 'Đơn hàng' },
                { id: 'account', label: 'Tài khoản' },
              ].map((t) => {
                const active = tab === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tabBtn, active && styles.tabBtnOn]}
                    onPress={() => setTab(t.id)}
                  >
                    <Text style={[styles.tabTxt, active && styles.tabTxtOn]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {tab === 'home' && (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex1}>
                    <Text style={styles.h2}>Xin chào, {user.name}</Text>
                    <Text style={styles.muted}>SĐT: {user.phone} • {gpsText}</Text>
                  </View>
                  <TouchableOpacity style={styles.miniBtn} onPress={() => updateGps(user)}>
                    <Text style={styles.miniBtnTxt}>Cập nhật GPS</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Dịch vụ Ninja Ship</Text>
                <View style={styles.grid}>
                  {services.map((s) => {
                    const sel = s.id === selectedServiceId;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.tile, sel && styles.tileOn]}
                        onPress={() => {
                          setSelectedServiceId(s.id);
                          setTab('order');
                        }}
                      >
                        <Text style={styles.tileIcon}>{s.icon || '🛵'}</Text>
                        <Text style={styles.tileTitle} numberOfLines={1}>
                          {s.title}
                        </Text>
                        {!!s.badge && <Text style={styles.tileBadge}>{s.badge}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {tab === 'order' && (
              <View style={styles.card}>
                <Text style={styles.h2}>
                  Đặt đơn: {currentService ? `${currentService.icon} ${currentService.title}` : 'Giao nhanh'}
                </Text>
                <Text style={styles.muted}>{currentService && currentService.description}</Text>

                <Text style={styles.label}>Điểm lấy / điểm mua</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập điểm lấy hàng hoặc để trống"
                  placeholderTextColor="#64748b"
                  value={pickup}
                  onChangeText={setPickup}
                />

                <Text style={styles.label}>Địa chỉ giao hàng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa chỉ giao hàng"
                  placeholderTextColor="#64748b"
                  value={dropoff}
                  onChangeText={setDropoff}
                />

                <View style={styles.rowGap}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Số Km</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="3"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={kmStr}
                      onChangeText={setKmStr}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Tiền ứng trước (đ)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={advanceStr}
                      onChangeText={setAdvanceStr}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Ghi chú</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ghi chú cho tài xế"
                  placeholderTextColor="#64748b"
                  value={note}
                  onChangeText={setNote}
                />

                <View style={styles.box}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.muted}>Phí giao ({fare.km} km × {formatMoney(fare.rate)}):</Text>
                    <Text style={styles.bold}>{formatMoney(fare.rawFee)}</Text>
                  </View>
                  {fare.discountAmount > 0 && (
                    <View style={styles.rowBetween}>
                      <Text style={styles.okText}>Giảm ưu đãi ({Math.round(fare.discountRate * 100)}%):</Text>
                      <Text style={styles.okText}>-{formatMoney(fare.discountAmount)}</Text>
                    </View>
                  )}
                  <View style={[styles.rowBetween, styles.divider]}>
                    <Text style={styles.bold}>Tổng thanh toán:</Text>
                    <Text style={styles.money}>{formatMoney(fare.total)}</Text>
                  </View>
                </View>

                <View style={styles.rowGap}>
                  <TouchableOpacity style={[styles.outBtn, styles.flex1]} onPress={() => setFareModalVisible(true)}>
                    <Text style={styles.outBtnTxt}>Bảng giá Km</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priBtn, styles.flex1, styles.noMt, busy && styles.disabled]}
                    onPress={onCreateOrder}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator color="#052e16" />
                    ) : (
                      <Text style={styles.priBtnTxt}>Đặt đơn ngay</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {tab === 'drivers' && (
              <View style={styles.card}>
                <Text style={styles.h2}>Tài xế hoạt động ({visibleDrivers.length})</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tìm tài xế theo tên hoặc SĐT..."
                  placeholderTextColor="#64748b"
                  value={driverFilter}
                  onChangeText={setDriverFilter}
                />
                {visibleDrivers.length === 0 ? (
                  <Text style={[styles.muted, styles.mt10]}>Chưa có tài xế nào trực tuyến.</Text>
                ) : (
                  visibleDrivers.map((d, idx) => (
                    <View key={`${d.phone || idx}`} style={styles.box}>
                      <Text style={styles.bold}>
                        {idx + 1}. {d.name || 'Tài xế Ninja'} ({d.phone || ''})
                      </Text>
                      <Text style={styles.muted}>Vị trí: {d.address || `${d.lat || ''}, ${d.lng || ''}`}</Text>
                      <Text style={styles.muted}>Cập nhật: {d.updatedAt || 'Vừa xong'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {tab === 'history' && (
              <View style={styles.card}>
                <Text style={styles.h2}>Lịch sử đơn hàng ({orders.length})</Text>
                {orders.length === 0 ? (
                  <Text style={styles.muted}>Chưa có đơn hàng nào.</Text>
                ) : (
                  orders.map((o, idx) => (
                    <View key={`${o.id || idx}`} style={styles.box}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.bold}>#{o.id} • {o.service}</Text>
                        <Text style={styles.pill}>{o.status || 'Đã gửi'}</Text>
                      </View>
                      <Text style={styles.muted}>Giao tới: {o.dropoffAddress}</Text>
                      <Text style={styles.muted}>{o.createdAt || ''}</Text>
                      <Text style={styles.money}>{formatMoney(o.total)}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {tab === 'account' && (
              <View style={styles.card}>
                <Text style={styles.h2}>Tài khoản V9</Text>
                <Text style={styles.muted}>Tên: {user.name}</Text>
                <Text style={styles.muted}>SĐT: {user.phone}</Text>
                <Text style={styles.muted}>GPS: {gpsText}</Text>

                <View style={styles.box}>
                  <Text style={styles.bold}>Số dư hiển thị: {formatMoney(wallet.balance)}</Text>
                  <TextInput
                    style={[styles.input, styles.mt8]}
                    placeholder="Số tiền nạp"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={topupStr}
                    onChangeText={setTopupStr}
                  />
                  <TouchableOpacity style={styles.secBtn} onPress={onTopupWallet}>
                    <Text style={styles.secBtnTxt}>Cập nhật số dư</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.box}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.bold}>Tự động cập nhật GPS</Text>
                    <Switch
                      value={Boolean(prefs.autoGps)}
                      onValueChange={(v) => {
                        const next = { ...prefs, autoGps: v };
                        setPrefs(next);
                        saveStore(PREFS_KEY, next);
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.outBtn} onPress={onLogout}>
                  <Text style={styles.outBtnTxt}>Đăng xuất / Đổi tài khoản</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={fareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFareModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.h2}>Bảng cước Km ({formatMoney(config.ratePerKm)}/km)</Text>
            {sampleKmList.map((k) => (
              <View key={k} style={styles.rowBetween}>
                <Text style={styles.muted}>{k} Km</Text>
                <Text style={styles.bold}>{formatMoney(k * (Number(config.ratePerKm) || 5000))}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.priBtn} onPress={() => setFareModalVisible(false)}>
              <Text style={styles.priBtnTxt}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 16, maxWidth: 720, width: '100%', alignSelf: 'center', paddingBottom: 32 },
  flex1: { flex: 1 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
  noMt: { marginTop: 0 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 4 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  header: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  appTitle: { color: '#f8fafc', fontSize: 21, fontWeight: '800' },
  banner: { color: '#38bdf8', fontSize: 14, fontWeight: '700', marginTop: 4 },
  subBanner: { color: '#cbd5e1', fontSize: 13, marginTop: 2 },
  reloadBtn: { backgroundColor: '#334155', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  reloadBtnText: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaPill: { backgroundColor: '#0f172a', color: '#94a3b8', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#334155' },
  errBox: { backgroundColor: '#450a0a', borderColor: '#f87171', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  errText: { color: '#fecaca', fontSize: 13, fontWeight: '600' },
  okBox: { backgroundColor: '#052e16', borderColor: '#4ade80', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  okText: { color: '#bbf7d0', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  box: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
  h2: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  muted: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  bold: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  money: { color: '#4ade80', fontSize: 15, fontWeight: '800', marginTop: 4 },
  divider: { borderTopColor: '#334155', borderTopWidth: 1, marginTop: 6, paddingTop: 8 },
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 5 },
  input: { backgroundColor: '#0f172a', borderColor: '#475569', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#f8fafc', fontSize: 15 },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modeBtn: { flex: 1, backgroundColor: '#0f172a', borderColor: '#475569', borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  modeBtnOn: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  modeTxt: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  modeTxtOn: { color: '#fff', fontWeight: '700' },
  priBtn: { backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', marginTop: 14 },
  priBtnTxt: { color: '#052e16', fontSize: 15, fontWeight: '800' },
  secBtn: { backgroundColor: '#334155', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center', marginTop: 8 },
  secBtnTxt: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  outBtn: { backgroundColor: '#0f172a', borderColor: '#38bdf8', borderWidth: 1, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12, alignItems: 'center' },
  outBtnTxt: { color: '#7dd3fc', fontSize: 13, fontWeight: '700' },
  miniBtn: { backgroundColor: '#0284c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  miniBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tabBtn: { flex: 1, minWidth: 64, backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  tabBtnOn: { backgroundColor: '#22c55e', borderColor: '#4ade80' },
  tabTxt: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  tabTxtOn: { color: '#052e16' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  tile: { width: '48%', backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 12 },
  tileOn: { borderColor: '#38bdf8', backgroundColor: '#082f49' },
  tileIcon: { fontSize: 20, marginBottom: 4 },
  tileTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  tileBadge: { color: '#fbbf24', fontSize: 11, fontWeight: '700', marginTop: 4 },
  pill: { backgroundColor: '#065f46', color: '#a7f3d0', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  modalBg: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.78)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1, borderRadius: 16, padding: 16 },
});
