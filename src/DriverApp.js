import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
  Vibration,
} from 'react-native';

// Dùng chung endpoint Cloudflare Worker với hệ thống Ninja Ship
const BACKEND_API_URL =
  (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_BACKEND_API_URL) ||
  'https://appkhach.mtuan1354.workers.dev';

const isBackendConfigured =
  typeof BACKEND_API_URL === 'string' &&
  BACKEND_API_URL.trim().length > 0 &&
  !BACKEND_API_URL.includes('your-subdomain');

async function postDriverApi(path, payload) {
  if (!isBackendConfigured) {
    return { ok: false, reason: 'missing_url' };
  }
  try {
    const baseUrl = BACKEND_API_URL.replace(/\/+$/, '');
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch (err) {
    return { ok: false, reason: 'network_error', error: String(err) };
  }
}

async function getDriverApi(path) {
  if (!isBackendConfigured) {
    return { ok: false, reason: 'missing_url' };
  }
  try {
    const baseUrl = BACKEND_API_URL.replace(/\/+$/, '');
    const res = await fetch(`${baseUrl}${path}`);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch (err) {
    return { ok: false, reason: 'network_error', error: String(err) };
  }
}

const DRIVER_VAULT_KEY = 'NINJA_SHIP_DRIVER_VAULT_V2';
const driverMemoryFallback = {};

function readDriverVault() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DRIVER_VAULT_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        drivers: parsed.drivers || {},
        lastDriverPhone: parsed.lastDriverPhone || '',
        acceptedOrders: Array.isArray(parsed.acceptedOrders) ? parsed.acceptedOrders : [],
        completedOrders: Array.isArray(parsed.completedOrders) ? parsed.completedOrders : [],
      };
    }
  } catch (e) {}
  const fb = driverMemoryFallback.data || {};
  return {
    drivers: fb.drivers || {},
    lastDriverPhone: fb.lastDriverPhone || '',
    acceptedOrders: Array.isArray(fb.acceptedOrders) ? fb.acceptedOrders : [],
    completedOrders: Array.isArray(fb.completedOrders) ? fb.completedOrders : [],
  };
}

function writeDriverVault(vault) {
  driverMemoryFallback.data = vault;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DRIVER_VAULT_KEY, JSON.stringify(vault));
    }
  } catch (e) {}
}

function getDriverDeviceFingerprint() {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof window !== 'undefined') {
    const raw = [
      'DRIVER',
      navigator.userAgent,
      navigator.language,
      window.screen?.width,
      window.screen?.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `DRV-${Math.abs(hash).toString(16).toUpperCase()}`;
  }
  return `DRV-${Platform.OS.toUpperCase()}-73K1`;
}

function playNewOrderAlert(order) {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 350, 150, 350]);
    } else if (typeof window !== 'undefined') {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([300, 150, 300]);
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Đơn mới ${order.id || ''} • ${order.service || 'Giao hàng'}`, {
          body: `Giao tới: ${order.dropoff || ''} • Thu nhập: ${(Number(order.driverPayout) || 0).toLocaleString('vi-VN')}đ`,
        });
      }
    }
  } catch (e) {}
}

function mapRawOrder(o) {
  const payout =
    Number(o.driverPayout) ||
    Number(o.pricingBreakdown?.shippingFee || 0) +
      Number(o.pricingBreakdown?.serviceFee || 0) +
      Number(o.pricingBreakdown?.surchargeTotal || 0) ||
    Number(o.total) ||
    20000;
  return {
    id: o.id || `NS-${Math.floor(1000 + Math.random() * 9000)}`,
    service: o.service || 'Giao đồ Km',
    pickup: o.pickupAddress || o.pickup || 'Điểm lấy hàng trên đơn',
    dropoff: o.dropoffAddress || o.dropoff || 'Điểm giao khách hàng',
    distanceKm: Number(o.distanceKm) || 2.5,
    advanceAmount: Number(o.pricingBreakdown?.goodsValue ?? o.advanceAmount) || 0,
    driverPayout: payout,
    totalCustomerPay: Number(o.total || o.totalCustomerPay) || payout,
    note: o.note || 'Giao đúng giờ, giữ gìn hàng hóa',
    createdAt: o.time || 'Vừa xong',
  };
}

const SAMPLE_AVAILABLE_ORDERS = [
  {
    id: 'NS-8421',
    service: 'Đặt đồ ăn',
    pickup: 'Quán Bún Bò O Hoa, Phường Đồng Hới, Quảng Trị',
    dropoff: 'Số 24 Hùng Vương, Phường Đồng Hới, Quảng Trị',
    distanceKm: 2.4,
    advanceAmount: 65000,
    driverPayout: 17000,
    totalCustomerPay: 82000,
    note: '2 tô Bún bò ít cay + 1 Trà đào, gọi trước khi tới',
    createdAt: 'Vừa xong',
  },
];

const VEHICLE_TYPES = [
  { id: 'bike', label: 'Xe máy (2 bánh)', icon: '🛵' },
  { id: 'ev_bike', label: 'Xe máy điện', icon: '⚡' },
  { id: 'car', label: 'Ô tô / Bán tải', icon: '🚗' },
];

export default function App() {
  const initialVault = readDriverVault();
  const deviceId = getDriverDeviceFingerprint();

  // Hồ sơ tài xế đã đăng ký 1 lần
  const [driverProfile, setDriverProfile] = useState(null);
  // Chế độ màn hình auth: 'login' (chỉ SĐT + OTP) hoặc 'register' (đăng ký hồ sơ 1 lần)
  const [authMode, setAuthMode] = useState(
    initialVault.lastDriverPhone && initialVault.drivers[initialVault.lastDriverPhone]
      ? 'login'
      : 'register'
  );

  // Trường nhập cho đăng nhập nhanh (SĐT + OTP) & đăng ký 1 lần
  const [driverPhone, setDriverPhone] = useState(initialVault.lastDriverPhone || '');
  const [driverName, setDriverName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleBrandModel, setVehicleBrandModel] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [declaredNoCriminal, setDeclaredNoCriminal] = useState(false);
  const [declaredTrafficRules, setDeclaredTrafficRules] = useState(false);

  // OTP xác thực
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [authBanner, setAuthBanner] = useState('');
  const [authError, setAuthError] = useState('');

  // Tác nghiệp trên đường
  const [activeTab, setActiveTab] = useState('duty');
  const [isOnline, setIsOnline] = useState(false);
  const [gpsCoords, setGpsCoords] = useState({ lat: 17.4689, lng: 106.6223 });
  const [gpsAddress, setGpsAddress] = useState('Đang cập nhật GPS tài xế...');
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);

  const [availableOrders, setAvailableOrders] = useState(SAMPLE_AVAILABLE_ORDERS);
  const [activeOrder, setActiveOrder] = useState(null);
  const [acceptedOrders, setAcceptedOrders] = useState(initialVault.acceptedOrders || []);
  const [completedOrders, setCompletedOrders] = useState(initialVault.completedOrders || []);
  const [syncMessage, setSyncMessage] = useState('Sẵn sàng kết nối hệ thống điều phối Ninja Ship.');
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const seenOrderIdsRef = useRef(new Set(SAMPLE_AVAILABLE_ORDERS.map((o) => o.id)));
  const scrollRef = useRef(null);

  const normalizePhone = (v) => String(v || '').replace(/\D/g, '');
  const isValidPhone = (p) => /^0\d{8,10}$/.test(p);
  const isValidCccd = (c) => /^\d{12}$/.test(String(c || '').replace(/\D/g, ''));
  const normalizePlate = (pl) => String(pl || '').trim().toUpperCase();
  const isValidPlate = (pl) => /^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{3,5}(\.[0-9]{2})?$/.test(normalizePlate(pl));

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  const validateStrictDriverApplication = () => {
    const cleanPhone = normalizePhone(driverPhone);
    const cleanCccd = String(idCardNumber || '').replace(/\D/g, '');
    const cleanLicense = String(licenseNumber || '').trim();
    const cleanExpiry = String(licenseExpiry || '').trim();
    const cleanPlate = normalizePlate(licensePlate);
    const cleanBrand = String(vehicleBrandModel || '').trim();
    const cleanEmName = String(emergencyContactName || '').trim();
    const cleanEmPhone = normalizePhone(emergencyContactPhone);

    if (!driverName.trim() || driverName.trim().length < 2) {
      return 'Vui lòng nhập đầy đủ Họ và tên tài xế (trùng khớp CCCD).';
    }
    if (!isValidPhone(cleanPhone)) {
      return 'Số điện thoại tài xế không hợp lệ (VD: 0912345678).';
    }
    if (!isValidCccd(cleanCccd)) {
      return 'Số CCCD/CMND bắt buộc đủ 12 chữ số.';
    }
    if (!cleanLicense || cleanLicense.length < 5) {
      return 'Vui lòng nhập số Giấy phép lái xe (GPLX) hợp lệ.';
    }
    if (!/^\d{2}\/\d{4}$/.test(cleanExpiry)) {
      return 'Vui lòng nhập hạn GPLX đúng định dạng MM/YYYY (VD: 12/2030).';
    }
    if (!isValidPlate(cleanPlate)) {
      return 'Biển số xe chưa đúng định dạng (VD: 73K1-458.21 hoặc 73A-12345).';
    }
    if (!cleanBrand || cleanBrand.length < 2) {
      return 'Vui lòng nhập Hãng & dòng xe đăng ký hoạt động.';
    }
    if (!cleanEmName || !isValidPhone(cleanEmPhone)) {
      return 'Vui lòng nhập đầy đủ Họ tên và SĐT người thân liên hệ khẩn cấp.';
    }
    if (!declaredNoCriminal || !declaredTrafficRules) {
      return 'Bạn phải tích xác nhận cả 2 cam kết: Không tiền án/tiền sự & Không vi phạm nồng độ cồn/ma túy/ATGT.';
    }
    return '';
  };

  // Gửi OTP: ở chế độ 'login' chỉ kiểm tra SĐT; ở chế độ 'register' kiểm tra đủ hồ sơ 1 lần
  const handleSendOtp = async () => {
    setAuthError('');
    setAuthBanner('');
    const cleanPhone = normalizePhone(driverPhone);

    if (!isValidPhone(cleanPhone)) {
      setAuthError('Số điện thoại tài xế không hợp lệ (VD: 0912345678).');
      return;
    }

    if (authMode === 'login') {
      const vault = readDriverVault();
      const existing = vault.drivers && vault.drivers[cleanPhone];
      if (!existing) {
        setAuthError(
          `SĐT ${cleanPhone} chưa có hồ sơ đăng ký trên máy này. Hãy chuyển sang "Đăng ký 1 lần" để khai báo hồ sơ.`
        );
        return;
      }
    } else {
      const err = validateStrictDriverApplication();
      if (err) {
        setAuthError(err);
        if (scrollRef.current && scrollRef.current.scrollTo) {
          scrollRef.current.scrollTo({ y: 0, animated: true });
        }
        return;
      }
    }

    const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
    let codeToUse = fallbackOtp;

    if (isBackendConfigured) {
      const res = await postDriverApi('/api/otp/request', {
        phone: cleanPhone,
        role: 'driver',
        deviceId,
      });
      if (res.ok && res.data && (res.data.otp || res.data.code)) {
        codeToUse = String(res.data.otp || res.data.code);
      }
    }

    setGeneratedOtp(codeToUse);
    setOtpSent(true);
    setOtpCountdown(60);
    setAuthBanner(
      authMode === 'login'
        ? `Mã OTP đăng nhập nhanh cho SĐT ${cleanPhone}: ${codeToUse}`
        : `Mã OTP kích hoạt hồ sơ tài xế cho SĐT ${cleanPhone}: ${codeToUse}`
    );
  };

  const handleConfirmOtp = async () => {
    setAuthError('');
    const cleanPhone = normalizePhone(driverPhone);

    if (!isValidPhone(cleanPhone)) {
      setAuthError('Số điện thoại không hợp lệ.');
      return;
    }
    if (inputOtp.trim() !== generatedOtp) {
      setAuthError('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
      return;
    }

    const vault = readDriverVault();
    vault.drivers = vault.drivers || {};

    if (authMode === 'login') {
      const existing = vault.drivers[cleanPhone];
      if (!existing) {
        setAuthError('Không tìm thấy hồ sơ tài xế. Vui lòng đăng ký 1 lần trước.');
        return;
      }
      vault.lastDriverPhone = cleanPhone;
      writeDriverVault(vault);
      setDriverProfile(existing);
      setOtpSent(false);
      setInputOtp('');
      setSyncMessage(`Đăng nhập nhanh thành công (${existing.name} • ${existing.licensePlate}).`);
      return;
    }

    // Đăng ký 1 lần đầy đủ hồ sơ
    const err = validateStrictDriverApplication();
    if (err) {
      setAuthError(err);
      return;
    }

    const cleanCccd = String(idCardNumber).replace(/\D/g, '');
    const cleanPlate = normalizePlate(licensePlate);
    const cleanEmPhone = normalizePhone(emergencyContactPhone);

    const duplicateConflict = Object.values(vault.drivers).find(
      (d) =>
        d.phone !== cleanPhone &&
        (d.idCardNumber === cleanCccd || d.licensePlate === cleanPlate)
    );
    if (duplicateConflict) {
      setAuthError(
        `CCCD (${cleanCccd}) hoặc Biển số (${cleanPlate}) đã được đăng ký bởi SĐT ${duplicateConflict.phone}.`
      );
      return;
    }

    const profile = {
      phone: cleanPhone,
      name: driverName.trim(),
      idCardNumber: cleanCccd,
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseExpiry: licenseExpiry.trim(),
      vehicleType,
      licensePlate: cleanPlate,
      vehicleBrandModel: vehicleBrandModel.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: cleanEmPhone,
      declaredNoCriminal: true,
      declaredTrafficRules: true,
      deviceId,
      verificationStatus: 'ĐÃ XÁC MINH HỒ SƠ (ĐĂNG KÝ 1 LẦN)',
      safetyScore: 100,
      registeredAt: new Date().toISOString(),
    };

    vault.drivers[cleanPhone] = profile;
    vault.lastDriverPhone = cleanPhone;
    writeDriverVault(vault);

    setDriverProfile(profile);
    setAuthMode('login');
    setOtpSent(false);
    setInputOtp('');

    await postDriverApi('/api/register', {
      phone: profile.phone,
      name: profile.name,
      role: 'driver',
      address: `${profile.vehicleBrandModel} (${profile.licensePlate}) • CCCD: ${profile.idCardNumber} • GPLX: ${profile.licenseNumber}`,
      lat: gpsCoords.lat,
      lng: gpsCoords.lng,
      deviceId: profile.deviceId,
      driverCompliance: {
        idCardNumber: profile.idCardNumber,
        licenseNumber: profile.licenseNumber,
        licenseExpiry: profile.licenseExpiry,
        vehicleType: profile.vehicleType,
        licensePlate: profile.licensePlate,
        vehicleBrandModel: profile.vehicleBrandModel,
        emergencyContact: `${profile.emergencyContactName} (${profile.emergencyContactPhone})`,
      },
    });

    setSyncMessage(
      `Đã lưu hồ sơ 1 lần cho ${profile.name}. Lần sau chỉ cần SĐT + OTP để đăng nhập.`
    );
  };

  // Kiểm tra đơn mới từ server và phát thông báo + âm thanh + rung
  const pollOrdersAndNotify = async (forceAlertForLatest = false) => {
    const r = await getDriverApi('/api/orders');
    if (r.ok && Array.isArray(r.data.orders) && r.data.orders.length > 0) {
      const mapped = r.data.orders.map(mapRawOrder);
      const trulyNew = mapped.filter((item) => !seenOrderIdsRef.current.has(item.id));
      mapped.forEach((item) => seenOrderIdsRef.current.add(item.id));
      setAvailableOrders(mapped);

      const alertTarget = trulyNew[0] || (forceAlertForLatest ? mapped[0] : null);
      if (alertTarget) {
        setNewOrderAlert(alertTarget);
        playNewOrderAlert(alertTarget);
        setSyncMessage(
          `🔔 CÓ ĐƠN MỚI ${alertTarget.id} (${alertTarget.service}) • Thu nhập ${(alertTarget.driverPayout || 0).toLocaleString('vi-VN')}đ`
        );
      }
    }
  };

  const syncDriverGps = async () => {
    if (!driverProfile) return;
    setIsUpdatingGps(true);
    const applyCoords = async (lat, lng) => {
      setGpsCoords({ lat, lng });
      let resolved = `GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi`
        );
        const data = await res.json();
        const a = data.address || {};
        const parts = [
          a.house_number,
          a.road,
          a.suburb || a.quarter || a.village || a.town,
          a.county || a.city_district,
          a.state || a.province || 'Quảng Trị',
        ].filter(Boolean);
        if (parts.length > 0) resolved = parts.join(', ');
      } catch (e) {}
      setGpsAddress(resolved);
      setIsUpdatingGps(false);

      if (isOnline && isBackendConfigured) {
        postDriverApi('/api/location', {
          phone: driverProfile.phone,
          name: `${driverProfile.name} [${driverProfile.licensePlate}]`,
          role: 'driver',
          address: resolved,
          lat,
          lng,
          online: true,
        });
      }
    };

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude),
        () => {
          setIsUpdatingGps(false);
          setGpsAddress('Phường Đồng Hới, Tỉnh Quảng Trị');
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      setIsUpdatingGps(false);
      setGpsAddress('Phường Đồng Hới, Tỉnh Quảng Trị');
    }
  };

  useEffect(() => {
    if (!driverProfile) return;
    syncDriverGps();
    pollOrdersAndNotify(false);
  }, [driverProfile]);

  // Luôn lắng nghe đơn mới mỗi 5 giây khi tài xế đã đăng nhập (kể cả khi chưa gạt Trực tuyến)
  useEffect(() => {
    if (!driverProfile) return;
    const orderPoll = setInterval(() => {
      pollOrdersAndNotify(false);
    }, 5000);
    return () => clearInterval(orderPoll);
  }, [driverProfile]);

  useEffect(() => {
    if (!driverProfile || !isOnline) return;
    syncDriverGps();
    const gpsTimer = setInterval(syncDriverGps, 15000);
    return () => clearInterval(gpsTimer);
  }, [driverProfile, isOnline]);

  const handleToggleOnlineStatus = () => {
    if (!driverProfile) return;
    if (activeOrder && isOnline) {
      Alert.alert(
        'Đang có cuốc hoạt động',
        'Vui lòng hoàn tất hoặc hủy cuốc hiện tại trước khi tắt trạng thái trực tuyến.'
      );
      return;
    }
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (nextState) {
      syncDriverGps();
      pollOrdersAndNotify(false);
      setSyncMessage('Tài xế đang TRỰC TUYẾN — Đang lắng nghe đơn mới & cập nhật GPS.');
    } else {
      setSyncMessage('Tài xế đã TẠM NGHỈ (Offline) — Vẫn hiển thị thông báo đơn mới.');
    }
  };

  const handleAcceptOrder = (ord) => {
    if (!isOnline) {
      Alert.alert('Chưa bật trực tuyến', 'Vui lòng gạt nút TRỰC TUYẾN để nhận cuốc.');
      return;
    }
    if (activeOrder) {
      Alert.alert('Đang thực hiện 1 cuốc', 'Vui lòng hoàn tất cuốc hiện tại trước khi nhận cuốc mới.');
      return;
    }
    const acceptedItem = {
      ...ord,
      acceptedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      driverPhone: driverProfile.phone,
      driverPlate: driverProfile.licensePlate,
      stage: 'Đang tới điểm lấy hàng',
    };
    setActiveOrder(acceptedItem);
    setNewOrderAlert(null);
    setAvailableOrders((prev) => prev.filter((item) => item.id !== ord.id));

    const v = readDriverVault();
    v.acceptedOrders = [acceptedItem, ...(v.acceptedOrders || [])].slice(0, 50);
    writeDriverVault(v);
    setAcceptedOrders(v.acceptedOrders);

    postDriverApi('/api/orders/accept', {
      orderId: ord.id,
      driverPhone: driverProfile.phone,
      driverName: driverProfile.name,
      licensePlate: driverProfile.licensePlate,
    });
  };

  const handleAdvanceOrderStage = () => {
    if (!activeOrder) return;
    if (activeOrder.stage === 'Đang tới điểm lấy hàng') {
      setActiveOrder({ ...activeOrder, stage: 'Đã lấy hàng — Đang giao khách' });
      return;
    }
    const finished = {
      ...activeOrder,
      stage: 'Đã hoàn thành',
      completedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setActiveOrder(null);
    const v = readDriverVault();
    v.completedOrders = [finished, ...(v.completedOrders || [])].slice(0, 100);
    writeDriverVault(v);
    setCompletedOrders(v.completedOrders);
    postDriverApi('/api/orders/complete', {
      orderId: finished.id,
      driverPhone: driverProfile.phone,
    });
    Alert.alert(
      'Hoàn tất cuốc xe',
      `Đã hoàn thành đơn ${finished.id}. Thu nhập cuốc: ${(finished.driverPayout || 0).toLocaleString('vi-VN')}đ.`
    );
  };

  const handleCancelActiveOrderStrict = () => {
    if (!activeOrder) return;
    Alert.alert(
      'Cảnh báo hủy cuốc',
      'Hủy cuốc sau khi đã nhận sẽ trừ 10 điểm uy tín tài xế. Bạn vẫn muốn hủy?',
      [
        { text: 'Giữ cuốc', style: 'cancel' },
        {
          text: 'Xác nhận hủy (-10 điểm)',
          style: 'destructive',
          onPress: () => {
            const v = readDriverVault();
            const currentAcc = v.drivers[driverProfile.phone];
            const nextScore = Math.max(0, (currentAcc?.safetyScore ?? 100) - 10);
            if (currentAcc) {
              currentAcc.safetyScore = nextScore;
              writeDriverVault(v);
            }
            setDriverProfile((prev) => ({ ...prev, safetyScore: nextScore }));
            setAvailableOrders((prev) => [
              { ...activeOrder, stage: undefined, acceptedAt: undefined },
              ...prev,
            ]);
            setActiveOrder(null);
          },
        },
      ]
    );
  };

  // =========================================================================
  // MÀN HÌNH ĐĂNG NHẬP NHANH (SĐT + OTP) HOẶC ĐĂNG KÝ 1 LẦN
  // =========================================================================
  if (!driverProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAF7F2" />
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandHeaderCard}>
            <View style={styles.brandBadgeRow}>
              <Text style={styles.brandEmoji}>⚡</Text>
              <Text style={styles.brandTitle}>NINJA SHIP TÀI XẾ</Text>
            </View>
            <Text style={styles.brandSubtitle}>
              Đăng ký hồ sơ 1 lần • Từ lần sau chỉ cần nhập SĐT + OTP để đăng nhập
            </Text>
          </View>

          <View style={styles.modeSwitchRow}>
            <TouchableOpacity
              style={[styles.modePill, authMode === 'login' && styles.modePillActive]}
              onPress={() => {
                setAuthMode('login');
                setOtpSent(false);
                setInputOtp('');
                setAuthError('');
                setAuthBanner('');
              }}
            >
              <Text style={[styles.modePillText, authMode === 'login' && styles.modePillTextActive]}>
                Đăng nhập (SĐT + OTP)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modePill, authMode === 'register' && styles.modePillActive]}
              onPress={() => {
                setAuthMode('register');
                setOtpSent(false);
                setInputOtp('');
                setAuthError('');
                setAuthBanner('');
              }}
            >
              <Text style={[styles.modePillText, authMode === 'register' && styles.modePillTextActive]}>
                Đăng ký 1 lần
              </Text>
            </TouchableOpacity>
          </View>

          {!!authError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
          {!!authBanner && (
            <View style={styles.infoBannerBox}>
              <Text style={styles.infoBannerText}>{authBanner}</Text>
            </View>
          )}

          <View style={styles.formCard}>
            <Text style={styles.label}>Số điện thoại tài xế *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 0912345678"
              keyboardType="phone-pad"
              maxLength={10}
              value={driverPhone}
              onChangeText={setDriverPhone}
              editable={!otpSent}
            />

            {authMode === 'register' && (
              <>
                <Text style={styles.sectionTitle}>1. Thông tin cá nhân & CCCD</Text>
                <Text style={styles.label}>Họ và tên (khớp CCCD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Trần Văn Hùng"
                  value={driverName}
                  onChangeText={setDriverName}
                  editable={!otpSent}
                />

                <Text style={styles.label}>Số CCCD / CMND (12 số) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 044095001234"
                  keyboardType="numeric"
                  maxLength={12}
                  value={idCardNumber}
                  onChangeText={setIdCardNumber}
                  editable={!otpSent}
                />

                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>2. Giấy phép lái xe (GPLX)</Text>
                <Text style={styles.label}>Số GPLX *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 440123456789"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  editable={!otpSent}
                />

                <Text style={styles.label}>Hạn GPLX (MM/YYYY) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 12/2030"
                  maxLength={7}
                  value={licenseExpiry}
                  onChangeText={setLicenseExpiry}
                  editable={!otpSent}
                />

                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>3. Phương tiện hoạt động</Text>
                <View style={styles.vehicleRow}>
                  {VEHICLE_TYPES.map((vt) => {
                    const active = vehicleType === vt.id;
                    return (
                      <TouchableOpacity
                        key={vt.id}
                        style={[styles.vehicleChip, active && styles.vehicleChipActive]}
                        onPress={() => !otpSent && setVehicleType(vt.id)}
                      >
                        <Text style={{ fontSize: 18 }}>{vt.icon}</Text>
                        <Text style={[styles.vehicleChipText, active && styles.vehicleChipTextActive]}>
                          {vt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Biển số xe *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 73K1-458.21"
                  autoCapitalize="characters"
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  editable={!otpSent}
                />

                <Text style={styles.label}>Hãng & dòng xe *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Honda Wave RSX / VinFast Evo200"
                  value={vehicleBrandModel}
                  onChangeText={setVehicleBrandModel}
                  editable={!otpSent}
                />

                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>4. Liên hệ khẩn cấp (SOS)</Text>
                <Text style={styles.label}>Họ tên người thân *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Trần Thị Mai"
                  value={emergencyContactName}
                  onChangeText={setEmergencyContactName}
                  editable={!otpSent}
                />

                <Text style={styles.label}>SĐT người thân *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 0987654321"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={emergencyContactPhone}
                  onChangeText={setEmergencyContactPhone}
                  editable={!otpSent}
                />

                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>5. Cam kết chuẩn mực</Text>
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => !otpSent && setDeclaredNoCriminal(!declaredNoCriminal)}
                >
                  <Text style={styles.checkboxBox}>{declaredNoCriminal ? '☑️' : '⬜'}</Text>
                  <Text style={styles.checkText}>
                    Cam kết lý lịch rõ ràng, không tiền án/tiền sự và không nồng độ cồn/ma túy.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => !otpSent && setDeclaredTrafficRules(!declaredTrafficRules)}
                >
                  <Text style={styles.checkboxBox}>{declaredTrafficRules ? '☑️' : '⬜'}</Text>
                  <Text style={styles.checkText}>
                    Cam kết chấp hành luật giao thông, bảo quản hàng hóa & tiền ứng của khách.
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {!otpSent ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp}>
                <Text style={styles.primaryBtnText}>
                  {authMode === 'login' ? 'Gửi mã OTP đăng nhập' : 'Gửi mã OTP đăng ký 1 lần'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.otpBox}>
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Nhập mã OTP 6 số *</Text>
                  <TouchableOpacity disabled={otpCountdown > 0} onPress={handleSendOtp}>
                    <Text style={styles.resendText}>
                      {otpCountdown > 0 ? `Gửi lại (${otpCountdown}s)` : 'Gửi lại mã'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="• • • • • •"
                  keyboardType="numeric"
                  maxLength={6}
                  value={inputOtp}
                  onChangeText={setInputOtp}
                />
                <Text style={styles.otpPreviewNote}>Mã OTP hiện tại: {generatedOtp}</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmOtp}>
                  <Text style={styles.primaryBtnText}>
                    {authMode === 'login' ? 'Xác nhận OTP & Vào app' : 'Xác nhận OTP & Lưu hồ sơ'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => {
                    setOtpSent(false);
                    setInputOtp('');
                  }}
                >
                  <Text style={styles.linkBtnText}>← Quay lại nhập lại SĐT</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // MÀN HÌNH TÁC NGHIỆP TÀI XẾ + THÔNG BÁO ĐƠN MỚI
  // =========================================================================
  const totalEarned = completedOrders.reduce(
    (sum, item) => sum + (Number(item.driverPayout) || 0),
    0
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAF7F2" />
      <ScrollView contentContainerStyle={styles.dutyScroll} showsVerticalScrollIndicator={false}>
        {/* Banner thông báo nổi bật khi có đơn mới */}
        {newOrderAlert && (
          <View style={styles.alertBannerCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.alertBannerTitle}>
                🔔 ĐƠN MỚI {newOrderAlert.id} • {newOrderAlert.service}
              </Text>
              <TouchableOpacity onPress={() => setNewOrderAlert(null)}>
                <Text style={styles.alertDismissText}>Đóng</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.alertBannerBody}>
              Giao tới: {newOrderAlert.dropoff} • Thu nhập:{' '}
              {(newOrderAlert.driverPayout || 0).toLocaleString('vi-VN')}đ
            </Text>
            <TouchableOpacity
              style={styles.alertAcceptBtn}
              onPress={() => {
                if (!isOnline) {
                  setIsOnline(true);
                }
                handleAcceptOrder(newOrderAlert);
              }}
            >
              <Text style={styles.alertAcceptText}>Bật trực tuyến & Nhận đơn này</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.topStatusCard}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.driverTitleLine}>
              {driverProfile.name} • {driverProfile.licensePlate}
            </Text>
            <Text style={styles.driverMetaLine}>
              SĐT: {driverProfile.phone} • Xong: {completedOrders.length} cuốc ({totalEarned.toLocaleString('vi-VN')}đ)
            </Text>
            <Text style={styles.gpsLine} numberOfLines={2}>
              📍 {gpsAddress}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.onlineToggleBtn, isOnline ? styles.onlineBtnOn : styles.onlineBtnOff]}
            onPress={handleToggleOnlineStatus}
          >
            <Text style={styles.onlineToggleText}>{isOnline ? 'TRỰC TUYẾN' : 'NGOẠI TUYẾN'}</Text>
            <Text style={styles.onlineSubText}>{isOnline ? 'Đang nhận cuốc' : 'Bấm để bật'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.syncStrip}>
          {isUpdatingGps && <ActivityIndicator size="small" color="#059669" style={{ marginRight: 6 }} />}
          <Text style={styles.syncStripText} numberOfLines={2}>
            {syncMessage}
          </Text>
          <TouchableOpacity onPress={() => pollOrdersAndNotify(true)}>
            <Text style={styles.checkNowText}>Kiểm tra đơn</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBarRow}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'duty' && styles.tabPillActive]}
            onPress={() => setActiveTab('duty')}
          >
            <Text style={[styles.tabPillText, activeTab === 'duty' && styles.tabPillTextActive]}>
              Nhận cuốc ({availableOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'history' && styles.tabPillActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabPillText, activeTab === 'history' && styles.tabPillTextActive]}>
              Lịch sử ({completedOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'compliance' && styles.tabPillActive]}
            onPress={() => setActiveTab('compliance')}
          >
            <Text style={[styles.tabPillText, activeTab === 'compliance' && styles.tabPillTextActive]}>
              Hồ sơ
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'duty' && (
          <>
            {activeOrder && (
              <View style={styles.activeJobCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.activeJobBadge}>CUỐC ĐANG THỰC HIỆN • {activeOrder.id}</Text>
                  <Text style={styles.activeJobPay}>
                    +{(activeOrder.driverPayout || 0).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
                <Text style={styles.jobServiceText}>
                  {activeOrder.service} ({activeOrder.distanceKm} km)
                </Text>
                <Text style={styles.jobAddrText}>Lấy hàng: {activeOrder.pickup}</Text>
                <Text style={styles.jobAddrText}>Giao tới: {activeOrder.dropoff}</Text>
                {activeOrder.advanceAmount > 0 && (
                  <Text style={styles.advanceWarnText}>
                    Tiền cần ứng trước: {activeOrder.advanceAmount.toLocaleString('vi-VN')}đ
                  </Text>
                )}
                <Text style={styles.jobStageText}>Trạng thái: {activeOrder.stage}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.advanceStageBtn} onPress={handleAdvanceOrderStage}>
                    <Text style={styles.advanceStageText}>
                      {activeOrder.stage === 'Đang tới điểm lấy hàng'
                        ? 'Xác nhận đã lấy hàng'
                        : 'Hoàn tất giao hàng'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelJobBtn} onPress={handleCancelActiveOrderStrict}>
                    <Text style={styles.cancelJobText}>Hủy cuốc</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.rowBetween}>
              <Text style={styles.listHeading}>Đơn chờ nhận ({availableOrders.length})</Text>
              <TouchableOpacity onPress={syncDriverGps}>
                <Text style={styles.refreshLink}>Làm mới GPS</Text>
              </TouchableOpacity>
            </View>

            {availableOrders.map((ord) => (
              <View key={ord.id} style={styles.orderCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.orderIdTitle}>
                    {ord.id} • {ord.service}
                  </Text>
                  <Text style={styles.orderPayout}>
                    Thu nhập: {(ord.driverPayout || 0).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
                <Text style={styles.orderMeta}>
                  Quãng đường: {ord.distanceKm} km • {ord.createdAt}
                </Text>
                <Text style={styles.orderAddr}>• Lấy: {ord.pickup}</Text>
                <Text style={styles.orderAddr}>• Giao: {ord.dropoff}</Text>
                {ord.advanceAmount > 0 && (
                  <Text style={styles.advanceWarnText}>
                    • Ứng trước cho khách: {ord.advanceAmount.toLocaleString('vi-VN')}đ
                  </Text>
                )}
                <Text style={styles.orderNote}>Ghi chú: {ord.note}</Text>

                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOrder(ord)}>
                  <Text style={styles.acceptBtnText}>
                    {isOnline ? 'Nhận cuốc ngay' : 'Bật trực tuyến & Nhận cuốc'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <Text style={styles.listHeading}>Cuốc xe đã hoàn thành ({completedOrders.length})</Text>
            {completedOrders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyDesc}>Chưa có cuốc hoàn thành nào.</Text>
              </View>
            ) : (
              completedOrders.map((item, idx) => (
                <View key={`${item.id}-${idx}`} style={styles.orderCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.orderIdTitle}>
                      {item.id} • {item.service}
                    </Text>
                    <Text style={styles.orderPayout}>
                      +{(item.driverPayout || 0).toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                  <Text style={styles.orderAddr}>Giao tới: {item.dropoff}</Text>
                  <Text style={styles.orderMeta}>Hoàn thành lúc {item.completedAt || 'Vừa xong'}</Text>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'compliance' && (
          <View style={styles.orderCard}>
            <Text style={styles.orderIdTitle}>Hồ sơ tài xế (Đã đăng ký 1 lần)</Text>
            <Text style={styles.complianceRow}>• Họ tên: {driverProfile.name}</Text>
            <Text style={styles.complianceRow}>• SĐT: {driverProfile.phone}</Text>
            <Text style={styles.complianceRow}>• CCCD: {driverProfile.idCardNumber}</Text>
            <Text style={styles.complianceRow}>
              • GPLX: {driverProfile.licenseNumber} (Hạn: {driverProfile.licenseExpiry})
            </Text>
            <Text style={styles.complianceRow}>
              • Xe: {driverProfile.vehicleBrandModel} — Biển số {driverProfile.licensePlate}
            </Text>
            <Text style={styles.complianceRow}>
              • Liên hệ khẩn cấp: {driverProfile.emergencyContactName} ({driverProfile.emergencyContactPhone})
            </Text>

            <TouchableOpacity
              style={[styles.cancelJobBtn, { marginTop: 14, width: '100%' }]}
              onPress={() => {
                setIsOnline(false);
                setActiveOrder(null);
                setAuthMode('login');
                setDriverProfile(null);
              }}
            >
              <Text style={styles.cancelJobText}>Đăng xuất (lần sau chỉ cần SĐT + OTP)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F6F5',
  },
  authScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  dutyScroll: {
    padding: 14,
    paddingBottom: 36,
  },
  brandHeaderCard: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    lineHeight: 18,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
  },
  modePill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  modePillActive: {
    backgroundColor: '#059669',
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
  modePillTextActive: {
    color: '#FFFFFF',
  },
  alertBannerCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#D97706',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  alertBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400E',
  },
  alertDismissText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  alertBannerBody: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    marginTop: 4,
  },
  alertAcceptBtn: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  alertAcceptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  infoBannerBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vehicleChip: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  vehicleChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  vehicleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    marginTop: 4,
  },
  vehicleChipTextActive: {
    color: '#065F46',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkboxBox: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  checkText: {
    flex: 1,
    fontSize: 12,
    color: '#1F2937',
    lineHeight: 17,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  otpBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 6,
  },
  otpPreviewNote: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  linkBtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  topStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  driverTitleLine: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  driverMetaLine: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  gpsLine: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    marginTop: 4,
  },
  onlineToggleBtn: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 104,
  },
  onlineBtnOn: {
    backgroundColor: '#059669',
  },
  onlineBtnOff: {
    backgroundColor: '#4B5563',
  },
  onlineToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  onlineSubText: {
    color: '#ECFDF5',
    fontSize: 11,
    marginTop: 2,
  },
  syncStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  syncStripText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    marginRight: 8,
  },
  checkNowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  tabBarRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabPillTextActive: {
    color: '#064E3B',
  },
  activeJobCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  activeJobBadge: {
    fontSize: 12,
    fontWeight: '900',
    color: '#065F46',
  },
  activeJobPay: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  jobServiceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  jobAddrText: {
    fontSize: 13,
    color: '#1F2937',
    marginTop: 3,
  },
  advanceWarnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 4,
  },
  jobStageText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  advanceStageBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginRight: 8,
  },
  advanceStageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelJobBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  cancelJobText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
  },
  listHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  refreshLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderIdTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  orderPayout: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  orderMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 6,
  },
  orderAddr: {
    fontSize: 13,
    color: '#1F2937',
    marginBottom: 2,
  },
  orderNote: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  acceptBtn: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  complianceRow: {
    fontSize: 13,
    color: '#1F2937',
    marginTop: 6,
    lineHeight: 18,
  },
});
