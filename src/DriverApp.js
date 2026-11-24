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

const DRIVER_VAULT_KEY = 'NINJA_SHIP_DRIVER_VAULT_V1';
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
  {
    id: 'NS-8422',
    service: 'Giao đồ Km',
    pickup: 'Shop Thời Trang Lan Anh, Phường Ba Đồn, Quảng Trị',
    dropoff: 'Xã Nam Gianh, Quảng Trị',
    distanceKm: 4.2,
    advanceAmount: 0,
    driverPayout: 25000,
    totalCustomerPay: 25000,
    note: '1 túi quần áo, treo cẩn thận không để nhăn',
    createdAt: '2 phút trước',
  },
  {
    id: 'NS-8423',
    service: 'Mua thuốc',
    pickup: 'Nhà Thuốc Trung Tâm, Xã Hoàn Lão, Quảng Trị',
    dropoff: 'Xã Bố Trạch, Quảng Trị',
    distanceKm: 5.5,
    advanceAmount: 120000,
    driverPayout: 40000,
    totalCustomerPay: 160000,
    note: '1 vỉ hạ sốt + 1 chai nước muối sinh lý, chụp bill gửi khách',
    createdAt: '5 phút trước',
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

  // TRẠNG THÁI HỒ SƠ & XÁC THỰC NGHIÊM NGẶT (CHUẨN XANH SM / HÀNH NGHỀ TÀI XẾ)
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverPhone, setDriverPhone] = useState(initialVault.lastDriverPhone || '');
  const [driverName, setDriverName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState(''); // CCCD 12 số
  const [licenseNumber, setLicenseNumber] = useState(''); // GPLX / Chứng chỉ hành nghề
  const [licenseExpiry, setLicenseExpiry] = useState(''); // Hạn GPLX (VD: 12/2030)
  const [vehicleType, setVehicleType] = useState('bike');
  const [licensePlate, setLicensePlate] = useState(''); // Biển số xe (VD: 73K1-123.45)
  const [vehicleBrandModel, setVehicleBrandModel] = useState(''); // Hãng & dòng xe
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [declaredNoCriminal, setDeclaredNoCriminal] = useState(false); // Cam kết lý lịch & nồng độ cồn/ma túy
  const [declaredTrafficRules, setDeclaredTrafficRules] = useState(false); // Cam kết tuân thủ ATGT & đồng phục

  // OTP xác thực SĐT tài xế
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [authBanner, setAuthBanner] = useState('');
  const [authError, setAuthError] = useState('');

  // TRẠNG THÁI VẬN HÀNH TRÊN ĐƯỜNG (ONLINE / OFFLINE + GPS + ĐƠN HÀNG)
  const [activeTab, setActiveTab] = useState('duty'); // 'duty' | 'history' | 'compliance'
  const [isOnline, setIsOnline] = useState(false); // Chỉ bật Online khi hồ sơ đạt chuẩn (verified/active)
  const [gpsCoords, setGpsCoords] = useState({ lat: 17.4689, lng: 106.6223 });
  const [gpsAddress, setGpsAddress] = useState('Đang cập nhật GPS tài xế...');
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);

  const [availableOrders, setAvailableOrders] = useState(SAMPLE_AVAILABLE_ORDERS);
  const [activeOrder, setActiveOrder] = useState(null);
  const [acceptedOrders, setAcceptedOrders] = useState(initialVault.acceptedOrders || []);
  const [completedOrders, setCompletedOrders] = useState(initialVault.completedOrders || []);
  const [syncMessage, setSyncMessage] = useState('Sẵn sàng kết nối hệ thống điều phối Ninja Ship.');

  const scrollRef = useRef(null);

  const normalizePhone = (v) => String(v || '').replace(/\D/g, '');
  const isValidPhone = (p) => /^0\d{8,10}$/.test(p);
  const isValidCccd = (c) => /^\d{12}$/.test(String(c || '').replace(/\D/g, ''));
  const normalizePlate = (pl) => String(pl || '').trim().toUpperCase();
  const isValidPlate = (pl) => /^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{3,5}(\.[0-9]{2})?$/.test(normalizePlate(pl));

  // Tự điền hồ sơ đã lưu nếu nhập lại SĐT cũ
  useEffect(() => {
    const cleanPhone = normalizePhone(driverPhone);
    if (!isValidPhone(cleanPhone)) return;
    const vault = readDriverVault();
    const existing = vault.drivers && vault.drivers[cleanPhone];
    if (existing) {
      setDriverName(existing.name || '');
      setIdCardNumber(existing.idCardNumber || '');
      setLicenseNumber(existing.licenseNumber || '');
      setLicenseExpiry(existing.licenseExpiry || '');
      setVehicleType(existing.vehicleType || 'bike');
      setLicensePlate(existing.licensePlate || '');
      setVehicleBrandModel(existing.vehicleBrandModel || '');
      setEmergencyContactName(existing.emergencyContactName || '');
      setEmergencyContactPhone(existing.emergencyContactPhone || '');
      setDeclaredNoCriminal(!!existing.declaredNoCriminal);
      setDeclaredTrafficRules(!!existing.declaredTrafficRules);
    }
  }, [driverPhone]);

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

  const handleSendDriverOtp = async () => {
    setAuthError('');
    setAuthBanner('');
    const err = validateStrictDriverApplication();
    if (err) {
      setAuthError(err);
      if (scrollRef.current && scrollRef.current.scrollTo) {
        scrollRef.current.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    const cleanPhone = normalizePhone(driverPhone);
    const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
    let codeToUse = fallbackOtp;

    if (isBackendConfigured) {
      const res = await postDriverApi('/api/otp/request', {
        phone: cleanPhone,
        role: 'driver',
        name: driverName.trim(),
        deviceId,
      });
      if (res.ok && res.data && (res.data.otp || res.data.code)) {
        codeToUse = String(res.data.otp || res.data.code);
      }
    }

    setGeneratedOtp(codeToUse);
    setOtpSent(true);
    setOtpCountdown(60);
    setAuthBanner(`Đã gửi mã OTP xác thực hồ sơ tài xế tới ${cleanPhone}: ${codeToUse}`);
  };

  const handleConfirmDriverRegistration = async () => {
    setAuthError('');
    const err = validateStrictDriverApplication();
    if (err) {
      setAuthError(err);
      return;
    }
    if (inputOtp.trim() !== generatedOtp) {
      setAuthError('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
      return;
    }

    const cleanPhone = normalizePhone(driverPhone);
    const cleanCccd = String(idCardNumber).replace(/\D/g, '');
    const cleanPlate = normalizePlate(licensePlate);
    const cleanEmPhone = normalizePhone(emergencyContactPhone);

    const vault = readDriverVault();
    vault.drivers = vault.drivers || {};

    // Kiểm tra trùng CCCD hoặc biển số xe ở tài khoản SĐT khác trên thiết bị
    const duplicateConflict = Object.values(vault.drivers).find(
      (d) =>
        d.phone !== cleanPhone &&
        (d.idCardNumber === cleanCccd || d.licensePlate === cleanPlate)
    );
    if (duplicateConflict) {
      setAuthError(
        `CCCD (${cleanCccd}) hoặc Biển số (${cleanPlate}) đã được đăng ký bởi SĐT ${duplicateConflict.phone}. Mỗi phương tiện/CCCD chỉ gắn với 1 tài xế.`
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
      // Chuẩn kiểm duyệt nghiêm ngặt: hồ sơ hợp lệ mới được bật trạng thái sẵn sàng nhận cuốc
      verificationStatus: 'ĐÃ XÁC MINH HỒ SƠ (CHUẨN XANH SM)',
      safetyScore: 100,
      registeredAt: new Date().toISOString(),
    };

    vault.drivers[cleanPhone] = profile;
    vault.lastDriverPhone = cleanPhone;
    writeDriverVault(vault);

    setDriverProfile(profile);
    setOtpSent(false);
    setInputOtp('');

    const apiRes = await postDriverApi('/api/register', {
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

    if (apiRes.ok) {
      setSyncMessage(`Đã gửi hồ sơ kiểm duyệt tài xế ${profile.name} (${profile.licensePlate}) về hệ thống.`);
    } else {
      setSyncMessage(`Hồ sơ tài xế ${profile.name} đã lưu trên thiết bị (chờ kết nối máy chủ điều phối).`);
    }
  };

  // Cập nhật vị trí GPS thực tế của tài xế khi đang bật nhận cuốc
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
  }, [driverProfile]);

  useEffect(() => {
    if (!driverProfile || !isOnline) return;
    syncDriverGps();
    const gpsTimer = setInterval(syncDriverGps, 15000);
    const ordersTimer = setInterval(async () => {
      const r = await getDriverApi('/api/orders');
      if (r.ok && Array.isArray(r.data.orders) && r.data.orders.length > 0) {
        const mapped = r.data.orders.map((o) => ({
          id: o.id || `NS-${Math.floor(1000 + Math.random() * 9000)}`,
          service: o.service || 'Giao đồ Km',
          pickup: o.pickupAddress || 'Điểm lấy hàng trên đơn',
          dropoff: o.dropoffAddress || 'Điểm giao khách hàng',
          distanceKm: Number(o.distanceKm) || 2.5,
          advanceAmount: Number(o.pricingBreakdown?.goodsValue) || 0,
          driverPayout:
            Number(o.pricingBreakdown?.shippingFee || 0) +
            Number(o.pricingBreakdown?.serviceFee || 0) +
            Number(o.pricingBreakdown?.surchargeTotal || 0),
          totalCustomerPay: Number(o.total) || 20000,
          note: o.note || 'Giao đúng giờ, giữ gìn hàng hóa',
          createdAt: o.time || 'Mới lên đơn',
        }));
        setAvailableOrders(mapped);
      }
    }, 10000);
    return () => {
      clearInterval(gpsTimer);
      clearInterval(ordersTimer);
    };
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
      setSyncMessage('Tài xế đang TRỰC TUYẾN — Đã mở radar nhận cuốc chuẩn xác thực.');
    } else {
      setSyncMessage('Tài xế đã TẠM NGHỈ (Offline) — Không nhận cuốc mới.');
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
    Alert.alert(
      'Hoàn tất cuốc xe',
      `Đã hoàn thành đơn ${finished.id}. Thu nhập cuốc: ${(finished.driverPayout || 0).toLocaleString('vi-VN')}đ.`
    );
  };

  const handleCancelActiveOrderStrict = () => {
    if (!activeOrder) return;
    Alert.alert(
      'Cảnh báo hủy cuốc (Chuẩn nghiêm ngặt)',
      'Hủy cuốc sau khi đã nhận sẽ trừ 10 điểm uy tín tài xế và ghi nhận lên hệ thống điều phối. Bạn vẫn muốn hủy?',
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
  // MÀN HÌNH ĐĂNG KÝ / XÁC THỰC TÀI XẾ NGHIÊM NGẶT (CHUẨN XANH SM)
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
              Khai báo định danh CCCD • GPLX • Phương tiện • Cam kết an toàn giao thông nghiêm ngặt
            </Text>
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
            <Text style={styles.sectionTitle}>1. Thông tin cá nhân & CCCD</Text>
            <Text style={styles.label}>Họ và tên (khớp CCCD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Trần Văn Hùng"
              value={driverName}
              onChangeText={setDriverName}
              editable={!otpSent}
            />

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

            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>2. Giấy phép lái xe (GPLX)</Text>
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

            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>3. Phương tiện hoạt động</Text>
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

            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>4. Liên hệ khẩn cấp (SOS)</Text>
            <Text style={styles.label}>Họ tên người thân *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Trần Thị Mai (Vợ/Mẹ)"
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

            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>5. Cam kết chuẩn mực bắt buộc</Text>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => !otpSent && setDeclaredNoCriminal(!declaredNoCriminal)}
            >
              <Text style={styles.checkboxBox}>{declaredNoCriminal ? '☑️' : '⬜'}</Text>
              <Text style={styles.checkText}>
                Tôi cam kết lý lịch rõ ràng, không tiền án/tiền sự và tuyệt đối không điều khiển phương tiện khi có nồng độ cồn hoặc chất kích thích.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => !otpSent && setDeclaredTrafficRules(!declaredTrafficRules)}
            >
              <Text style={styles.checkboxBox}>{declaredTrafficRules ? '☑️' : '⬜'}</Text>
              <Text style={styles.checkText}>
                Tôi cam kết chấp hành nghiêm luật giao thông, bảo quản nguyên vẹn hàng hóa & tiền ứng trước của khách hàng.
              </Text>
            </TouchableOpacity>

            {!otpSent ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendDriverOtp}>
                <Text style={styles.primaryBtnText}>Gửi mã OTP xác thực hồ sơ tài xế</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.otpBox}>
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Nhập mã OTP 6 số *</Text>
                  <TouchableOpacity disabled={otpCountdown > 0} onPress={handleSendDriverOtp}>
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
                <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmDriverRegistration}>
                  <Text style={styles.primaryBtnText}>Xác nhận OTP & Kích hoạt tài xế</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => {
                    setOtpSent(false);
                    setInputOtp('');
                  }}
                >
                  <Text style={styles.linkBtnText}>← Quay lại sửa thông tin hồ sơ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // MÀN HÌNH TÁC NGHIỆP TÀI XẾ (TRỰC TUYẾN / NHẬN CUỐC / LỊCH SỬ / HỒ SƠ)
  // =========================================================================
  const totalEarned = completedOrders.reduce(
    (sum, item) => sum + (Number(item.driverPayout) || 0),
    0
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAF7F2" />
      <ScrollView contentContainerStyle={styles.dutyScroll} showsVerticalScrollIndicator={false}>
        {/* Thanh trạng thái tài xế + nút bật/tắt trực tuyến */}
        <View style={styles.topStatusCard}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.driverTitleLine}>
              {driverProfile.name} • {driverProfile.licensePlate}
            </Text>
            <Text style={styles.driverMetaLine}>
              Điểm uy tín: {driverProfile.safetyScore ?? 100}/100 • Đã xong: {completedOrders.length} cuốc ({totalEarned.toLocaleString('vi-VN')}đ)
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
        </View>

        {/* Chuyển tab tác nghiệp */}
        <View style={styles.tabBarRow}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'duty' && styles.tabPillActive]}
            onPress={() => setActiveTab('duty')}
          >
            <Text style={[styles.tabPillText, activeTab === 'duty' && styles.tabPillTextActive]}>
              Nhận cuốc
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
              Hồ sơ chuẩn
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

            {!isOnline ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Bạn đang ở chế độ NGOẠI TUYẾN</Text>
                <Text style={styles.emptyDesc}>
                  Bật nút TRỰC TUYẾN ở góc trên để hệ thống định vị GPS và đẩy cuốc mới gần bạn.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.rowBetween}>
                  <Text style={styles.listHeading}>Đơn khả dụng quanh bạn ({availableOrders.length})</Text>
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

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptOrder(ord)}
                    >
                      <Text style={styles.acceptBtnText}>Nhận cuốc ngay</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
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
            <Text style={styles.orderIdTitle}>Hồ sơ định danh & chuẩn mực tài xế</Text>
            <Text style={styles.complianceRow}>• Trạng thái: {driverProfile.verificationStatus}</Text>
            <Text style={styles.complianceRow}>• Họ tên: {driverProfile.name}</Text>
            <Text style={styles.complianceRow}>• SĐT: {driverProfile.phone}</Text>
            <Text style={styles.complianceRow}>• CCCD: {driverProfile.idCardNumber}</Text>
            <Text style={styles.complianceRow}>
              • GPLX: {driverProfile.licenseNumber} (Hạn: {driverProfile.licenseExpiry})
            </Text>
            <Text style={styles.complianceRow}>
              • Phương tiện: {driverProfile.vehicleBrandModel} — Biển số {driverProfile.licensePlate}
            </Text>
            <Text style={styles.complianceRow}>
              • Liên hệ khẩn cấp: {driverProfile.emergencyContactName} ({driverProfile.emergencyContactPhone})
            </Text>
            <Text style={styles.complianceRow}>• Mã thiết bị: {driverProfile.deviceId}</Text>

            <TouchableOpacity
              style={[styles.cancelJobBtn, { marginTop: 14, width: '100%' }]}
              onPress={() => {
                setIsOnline(false);
                setActiveOrder(null);
                setDriverProfile(null);
              }}
            >
              <Text style={styles.cancelJobText}>Đăng xuất ca làm việc</Text>
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
    marginBottom: 14,
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
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
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
