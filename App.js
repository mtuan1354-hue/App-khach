import React, { useState, useEffect } from 'react';
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
  Modal,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';

// ĐIỀN LINK CLOUDFLARE WORKER CỦA BẠN VÀO ĐÂY SAU KHI DEPLOY:
const BACKEND_API_URL = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_BACKEND_API_URL) || 'https://appkhach.mtuan1354.workers.dev';

const isBackendConfigured =
  typeof BACKEND_API_URL === 'string' &&
  BACKEND_API_URL.trim().length > 0 &&
  !BACKEND_API_URL.includes('your-subdomain');

async function postToBackend(path, payload) {
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
    return { ok: res.ok && (data.ok !== false), status: res.status, data };
  } catch (err) {
    return { ok: false, reason: 'network_error', error: String(err) };
  }
}



const SERVICES_SMALL = [
  { id: 'nhan-ho', title: 'Nhận hộ', icon: '📦', badge: '-15%', badgeColor: '#E11D48', badgeText: '#FFF' },
  { id: 'lam-ho', title: 'Làm hộ', icon: '⚡', badge: 'MỚI', badgeColor: '#10B981', badgeText: '#FFF' },
  { id: 'di-cho', title: 'Đi chợ hộ', icon: '🥬' },
  { id: 'mua-thuoc', title: 'Mua thuốc', icon: '💊' },
  { id: 'giao-do', title: 'Giao đồ\nKm', icon: '🛵' },
  { id: 'tai-xe', title: 'Tài xế gần', icon: '📍' },
  { id: 'uu-dai', title: 'Ưu đãi', icon: '🎁' },
  { id: 'gia-cuoc', title: 'Giá cước\nKm', icon: '💰' },
];

const FALLBACK_COMMUNES = [
  { name: 'Phường Ba Đồn', lat: 17.7524, lng: 106.4182 },
  { name: 'Phường Quảng Long', lat: 17.7685, lng: 106.4251 },
  { name: 'Phường Quảng Thọ', lat: 17.7431, lng: 106.4418 },
  { name: 'Phường Quảng Thuận', lat: 17.7412, lng: 106.4045 },
  { name: 'Phường Quảng Phúc', lat: 17.7215, lng: 106.4530 },
  { name: 'Phường Quảng Phong', lat: 17.7590, lng: 106.3980 },
  { name: 'Xã Quảng Hòa', lat: 17.7310, lng: 106.3755 },
  { name: 'Xã Quảng Lộc', lat: 17.7220, lng: 106.3920 },
  { name: 'Xã Quảng Tân', lat: 17.7150, lng: 106.4110 },
  { name: 'Xã Quảng Trung', lat: 17.7080, lng: 106.3840 },
  { name: 'Xã Quảng Tiên', lat: 17.7195, lng: 106.3650 },
  { name: 'Xã Quảng Văn', lat: 17.7025, lng: 106.4280 },
  { name: 'Xã Quảng Minh', lat: 17.6940, lng: 106.3710 },
  { name: 'Xã Quảng Sơn', lat: 17.6850, lng: 106.3420 },
  { name: 'Xã Quảng Thủy', lat: 17.6980, lng: 106.3540 },
  { name: 'Xã Quảng Hải', lat: 17.7380, lng: 106.4290 },
  { name: 'Xã Quảng Phương', lat: 17.7850, lng: 106.4120 },
  { name: 'Xã Quảng Hưng', lat: 17.8120, lng: 106.3980 },
  { name: 'Xã Quảng Thanh', lat: 17.7720, lng: 106.3820 },
  { name: 'Xã Quảng Trạch (Cảnh Dương)', lat: 17.8540, lng: 106.4620 },
];

const SERVICE_CONFIGS = {
  'Đặt đồ ăn': {
    type: 'order',
    icon: '🍜',
    promoKey: 'promo_food_25',
    discountRate: 0.25,
    discountLabel: 'Giảm 25% phí ship (1 lần duy nhất/khách)',
    mainLabel: 'Tên món ăn & số lượng *',
    mainPlaceholder: 'VD: 2 tô Bún bò + 1 Trà đào cam sả, ít cay',
    pickupLabel: 'Quán ăn / Nhà hàng lấy món',
    detailPlaceholder: 'VD: Quán Bún Bò O Hoa, gần chợ...',
    showAdvance: true,
    advanceLabel: 'Tiền món ăn tài xế ứng trả quán (đ)',
    extraLabel: 'Ghi chú cho quán / tài xế',
    extraPlaceholder: 'VD: Lấy thêm đũa muỗng, gọi khi tới cổng',
    submitText: 'Đặt đồ ăn ngay',
  },
  'Mua hộ đồ': {
    type: 'order',
    icon: '🛍️',
    promoKey: 'promo_buy_20',
    discountRate: 0.20,
    discountLabel: 'Giảm 20% phí ship (1 lần duy nhất/khách)',
    mainLabel: 'Danh sách đồ cần mua hộ *',
    mainPlaceholder: 'VD: 1 thùng sữa Vinamilk, 1 túi bột giặt OMO 3kg',
    pickupLabel: 'Cửa hàng / Siêu thị / Tạp hóa mua đồ',
    detailPlaceholder: 'VD: Siêu thị WinMart hoặc Tạp hóa Cô Lan...',
    showAdvance: true,
    advanceLabel: 'Tiền hàng ước tính cần ứng trước (đ)',
    extraLabel: 'Yêu cầu chọn đồ / chụp hóa đơn',
    extraPlaceholder: 'VD: Chụp ảnh bill gửi Zalo trước khi thanh toán',
    submitText: 'Nhờ mua hộ ngay',
  },
  'Nhận hộ': {
    type: 'order',
    icon: '📦',
    promoKey: 'promo_receive_15',
    discountRate: 0.15,
    discountLabel: 'Giảm 15% phí ship (1 lần duy nhất/khách)',
    mainLabel: 'Thông tin bưu phẩm / Hàng cần nhận hộ *',
    mainPlaceholder: 'VD: Nhận thùng hàng xe khách / Bưu phẩm Shopee',
    pickupLabel: 'Điểm nhận hàng (Bến xe / Bưu cục / Người gửi)',
    detailPlaceholder: 'VD: Nhà xe Hưng Long hoặc Bưu cục Viettel Post...',
    showAdvance: true,
    advanceLabel: 'Tiền COD / Phí nhà xe cần trả hộ (đ)',
    extraLabel: 'Tên & SĐT người gửi / Mã vận đơn',
    extraPlaceholder: 'VD: Anh Nam - 0912xxx, đọc mã 8842',
    submitText: 'Đặt tài xế nhận hộ',
  },
  'Làm hộ': {
    type: 'order',
    icon: '⚡',
    promoKey: null,
    discountRate: 0,
    discountLabel: 'Dịch vụ mới • Ưu tiên xử lý nhanh',
    mainLabel: 'Nội dung công việc cần làm hộ *',
    mainPlaceholder: 'VD: Xếp hàng nộp hồ sơ / Gửi giấy tờ / Trả đồ giúp',
    pickupLabel: 'Địa điểm thực hiện công việc',
    detailPlaceholder: 'VD: Bộ phận một cửa / Ngân hàng / Nhà người quen...',
    showAdvance: true,
    advanceLabel: 'Chi phí phát sinh cần ứng trước (đ)',
    extraLabel: 'Thời gian hẹn & hướng dẫn chi tiết',
    extraPlaceholder: 'VD: Có mặt trước 9h30 sáng, gặp chị Hương',
    submitText: 'Thuê Ninja làm hộ',
  },
  'Đi chợ hộ': {
    type: 'order',
    icon: '🥬',
    promoKey: null,
    discountRate: 0,
    discountLabel: 'Chọn đồ tươi ngon theo yêu cầu',
    mainLabel: 'Danh sách thực phẩm đi chợ *',
    mainPlaceholder: 'VD: 5 lạng thịt ba chỉ, 1 bó rau muống, 1 con cá thu',
    pickupLabel: 'Khu vực chợ / Cửa hàng thực phẩm sạch',
    detailPlaceholder: 'VD: Chợ Ba Đồn, hàng thịt cô Tâm cổng chính...',
    showAdvance: true,
    advanceLabel: 'Tiền đi chợ dự kiến tài xế ứng (đ)',
    extraLabel: 'Cách sơ chế / chọn đồ tươi',
    extraPlaceholder: 'VD: Nhờ người bán làm sạch cá, chọn thịt nhiều nạc',
    submitText: 'Đặt đi chợ hộ ngay',
  },
  'Mua thuốc': {
    type: 'order',
    icon: '💊',
    promoKey: null,
    discountRate: 0,
    discountLabel: 'Giao thuốc khẩn cấp 15 phút',
    mainLabel: 'Tên thuốc / Triệu chứng cần dược sĩ tư vấn *',
    mainPlaceholder: 'VD: 1 vỉ Panadol Extra, 1 chai nước muối sinh lý',
    pickupLabel: 'Nhà thuốc / Quầy thuốc tây',
    detailPlaceholder: 'VD: Nhà thuốc Long Châu hoặc Quầy thuốc gần nhất...',
    showAdvance: true,
    advanceLabel: 'Tiền thuốc ước tính cần ứng (đ)',
    extraLabel: 'Đối tượng sử dụng / Lưu ý dị ứng',
    extraPlaceholder: 'VD: Mua cho người lớn, không có tiền sử dị ứng',
    submitText: 'Đặt mua thuốc gấp',
  },
  'Giao đồ Km': {
    type: 'order',
    icon: '🛵',
    promoKey: null,
    discountRate: 0,
    discountLabel: 'Tính cước chuẩn 5.000đ/km',
    mainLabel: 'Tên hàng hóa & kích thước gói hàng *',
    mainPlaceholder: 'VD: 1 túi quần áo + 1 hộp bánh sinh nhật (dễ vỡ)',
    pickupLabel: 'Điểm lấy hàng đi giao',
    detailPlaceholder: 'VD: Số 24 đường Hùng Vương, shop thời trang...',
    showAdvance: false,
    advanceLabel: '',
    extraLabel: 'SĐT người nhận / Lưu ý bảo quản',
    extraPlaceholder: 'VD: Hàng dễ vỡ, treo cẩn thận giúp mình',
    submitText: 'Gọi xe giao hàng ngay',
  },
  'Siêu tốc Ninja': {
    type: 'order',
    icon: '🚀',
    promoKey: null,
    discountRate: 0,
    discountLabel: 'Hỏa tốc 15 phút • Nhận đơn ngay lập tức',
    mainLabel: 'Hàng hóa / Giấy tờ cần giao hỏa tốc *',
    mainPlaceholder: 'VD: Hồ sơ thầu / Chìa khóa nhà / Đồ ăn nóng',
    pickupLabel: 'Điểm xuất phát lấy hàng hỏa tốc',
    detailPlaceholder: 'VD: Số 10 đường Quang Trung...',
    showAdvance: true,
    advanceLabel: 'Tiền ứng trước (nếu có) (đ)',
    extraLabel: 'Ghi chú ưu tiên khẩn cấp',
    extraPlaceholder: 'VD: Cần giao gấp trong 15 phút, gọi ngay khi tới',
    submitText: 'Đặt Siêu Tốc Ninja',
  },
};

const NEARBY_DRIVERS = [
  { id: 'TX-01', name: 'Trần Văn Hùng', bike: 'Honda Wave • 73K1-458.21', dist: '0.4 km', rating: '4.9 ★', status: 'Đang rảnh' },
  { id: 'TX-02', name: 'Nguyễn Minh Tuấn', bike: 'Yamaha Sirius • 73K1-892.10', dist: '0.9 km', rating: '5.0 ★', status: 'Đang rảnh' },
  { id: 'TX-03', name: 'Lê Hoàng Phúc', bike: 'Honda Vision • 73K1-319.66', dist: '1.4 km', rating: '4.8 ★', status: 'Đang rảnh' },
];

const VOUCHERS_LIST = [
  { key: 'promo_food_25', code: 'NINJA25', title: 'Giảm 25% phí ship Đặt đồ ăn', desc: 'Áp dụng duy nhất 1 lần cho mỗi khách hàng / thiết bị', tag: 'Đặt đồ ăn' },
  { key: 'promo_buy_20', code: 'MUAHO20', title: 'Giảm 20% phí Mua hộ đồ', desc: 'Áp dụng duy nhất 1 lần cho mỗi khách hàng / thiết bị', tag: 'Mua hộ đồ' },
  { key: 'promo_receive_15', code: 'NHANHO15', title: 'Giảm 15% dịch vụ Nhận hộ', desc: 'Áp dụng duy nhất 1 lần cho mỗi khách hàng / thiết bị', tag: 'Nhận hộ' },
];

// =========================================================================
// HỆ THỐNG CHỐNG GIAN LẬN 4 LỚP (ANTI-FRAUD DEVICE & ACCOUNT FINGERPRINT)
// =========================================================================
function getHardwareFingerprint() {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof window !== 'undefined') {
    const raw = [
      navigator.userAgent,
      navigator.language,
      window.screen?.width,
      window.screen?.height,
      window.screen?.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `DEV-${Math.abs(hash).toString(16).toUpperCase()}`;
  }
  return `DEV-${Platform.OS.toUpperCase()}-98A2F1`;
}

// Bộ nhớ lưu trữ bền vững trên thiết bị (chặn xóa app/tạo nick mới nhận lại ưu đãi)
const DEVICE_VAULT_KEY = 'NINJA_SHIP_ANTI_FRAUD_VAULT_V1';
const memoryFallbackVault = {};

function readFraudVault() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DEVICE_VAULT_KEY);
      return raw ? JSON.parse(raw) : { accounts: {}, devicePromos: {}, boundPhones: [] };
    }
  } catch (e) {}
  return memoryFallbackVault.data || { accounts: {}, devicePromos: {}, boundPhones: [] };
}

function writeFraudVault(vault) {
  memoryFallbackVault.data = vault;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DEVICE_VAULT_KEY, JSON.stringify(vault));
    }
  } catch (e) {}
}

function calculateRoadDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number'
  ) {
    return 2.5;
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadKm = Math.max(1.0, R * c * 1.25);
  return Math.round(roadKm * 10) / 10;
}

export default function App() {
  // TRẠNG THÁI ĐĂNG NHẬP / ĐĂNG KÝ OTP
  const [currentUser, setCurrentUser] = useState(null); // { phone, name, deviceId, isDeviceFlagged }
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authPhone, setAuthPhone] = useState('');
  const [authName, setAuthName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // TRẠNG THÁI ỨNG DỤNG CHÍNH
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  const [itemNote, setItemNote] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [advanceMoney, setAdvanceMoney] = useState('0');

  const [detectedProvince, setDetectedProvince] = useState('Quảng Bình');
  const [communes, setCommunes] = useState(FALLBACK_COMMUNES);
  const [selectedPickupCommune, setSelectedPickupCommune] = useState(null);
  const [pickupDetailAddress, setPickupDetailAddress] = useState('');

  const [dropoffCoords, setDropoffCoords] = useState({ lat: 17.7524, lng: 106.4182 });
  const [dropoffAddress, setDropoffAddress] = useState('Đang định vị chính xác...');
  const [isLocating, setIsLocating] = useState(false);

  const [calcFromCommune, setCalcFromCommune] = useState(FALLBACK_COMMUNES[0]);
  const [calcToCommune, setCalcToCommune] = useState(FALLBACK_COMMUNES[2]);

  const [orders, setOrders] = useState([]);
  const [usedPromos, setUsedPromos] = useState({}); // Theo dõi ưu đãi đã dùng của user + thiết bị

  // Cấu hình động đồng bộ từ Bot Telegram Admin
  const [remoteConfig, setRemoteConfig] = useState({
    appName: 'NINJA SHIP',
    appLogo: '🥷',
    ratePerKm: 5000,
    services: null,
  });
  const [liveDrivers, setLiveDrivers] = useState(NEARBY_DRIVERS);

  const [adminSyncNote, setAdminSyncNote] = useState(
    isBackendConfigured
      ? 'Đang kết nối máy chủ Admin...'
      : 'Chưa điền link Cloudflare Worker (BACKEND_API_URL) nên chưa đẩy đơn/đăng ký về Admin.'
  );

  const fetchAdminConfig = async () => {
    if (!isBackendConfigured) {
      setAdminSyncNote('Chưa điền link Cloudflare Worker (BACKEND_API_URL) nên chưa đẩy đơn/đăng ký về Admin.');
      return;
    }
    const baseUrl = BACKEND_API_URL.replace(/\/+$/, '');
    try {
      const res = await fetch(`${baseUrl}/api/config`);
      if (!res.ok) {
        setAdminSyncNote(`Máy chủ Admin phản hồi lỗi HTTP ${res.status} khi đọc cấu hình.`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.config) {
        setRemoteConfig(data.config);
      }
      setAdminSyncNote('Đã đồng bộ cấu hình & kết nối máy chủ Admin.');
      const drvRes = await fetch(`${baseUrl}/api/drivers`);
      if (drvRes.ok) {
        const drvData = await drvRes.json().catch(() => ({}));
        if (drvData.ok && Array.isArray(drvData.drivers) && drvData.drivers.length > 0) {
          setLiveDrivers(
            drvData.drivers.map((d, idx) => ({
              id: `TX-${idx + 1}`,
              name: `${d.name} (${d.phone})`,
              bike: d.address,
              dist: 'GPS Live',
              rating: '5.0 ★',
              status: `Cập nhật ${d.updatedAt}`,
            }))
          );
        }
      }
    } catch (e) {
      setAdminSyncNote('Không thể kết nối máy chủ Admin (kiểm tra link Worker hoặc CORS).');
    }
  };

  useEffect(() => {
    fetchAdminConfig();
    const interval = setInterval(fetchAdminConfig, 15000);
    return () => clearInterval(interval);
  }, []);

  const deviceId = getHardwareFingerprint();

  // Đếm ngược gửi lại OTP
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Kiểm tra SĐT hợp lệ (10 số đầu 03, 05, 07, 08, 09)
  const normalizePhone = (raw) => raw.replace(/\D/g, '');
  const isValidVnPhone = (p) => /^0\d{8,10}$/.test(p);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [authStatusMsg, setAuthStatusMsg] = useState('');

  const showOtpNotification = (cleanPhone, code) => {
    const msg = `Mã OTP gửi tới ${cleanPhone}: ${code}\n(hiệu lực 60s)`;
    setAuthStatusMsg(msg);
  };

  const triggerOtpDispatch = async (cleanPhone, mode, name) => {
    const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
    setIsSendingOtp(true);
    setAuthStatusMsg(`Đang gửi mã OTP tới ${cleanPhone}...`);
    try {
      if (isBackendConfigured) {
        const res = await fetch(`${BACKEND_API_URL}/api/otp/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            mode,
            name: name || '',
            deviceId,
          }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const serverCode = String(data.otp || data.code || fallbackCode);
          setGeneratedOtp(serverCode);
          setOtpSent(true);
          setOtpCountdown(60);
          showOtpNotification(cleanPhone, serverCode);
          return;
        }
      }
    } catch (e) {
      // Fallback sang mã OTP cục bộ khi chưa cấu hình backend hoặc lỗi mạng
    } finally {
      setIsSendingOtp(false);
    }

    setGeneratedOtp(fallbackCode);
    setOtpSent(true);
    setOtpCountdown(60);
    showOtpNotification(cleanPhone, fallbackCode);
  };

  const [authErrorMsg, setAuthErrorMsg] = useState('');

  const handleRequestOtp = () => {
    if (isSendingOtp) return;
    setAuthErrorMsg('');
    const cleanPhone = normalizePhone(authPhone);
    if (!isValidVnPhone(cleanPhone)) {
      setAuthErrorMsg('Số điện thoại không hợp lệ (VD: 0912345678).');
      return;
    }

    const vault = readFraudVault();
    vault.accounts = vault.accounts || {};
    vault.boundPhones = vault.boundPhones || [];
    const existingAcc = vault.accounts[cleanPhone];

    if (authMode === 'register') {
      const trimmedName = authName.trim();
      if (!trimmedName || trimmedName.length < 2) {
        setAuthErrorMsg('Vui lòng nhập họ và tên (từ 2 ký tự trở lên) để đăng ký.');
        return;
      }
      if (existingAcc) {
        setAuthMode('login');
        triggerOtpDispatch(cleanPhone, 'login', existingAcc.name || trimmedName);
        return;
      }
      if (vault.boundPhones.length >= 2 && !vault.boundPhones.includes(cleanPhone)) {
        setAuthErrorMsg(
          `Thiết bị (${deviceId}) đã đạt giới hạn 2 tài khoản. Vui lòng đăng nhập bằng số đã đăng ký.`
        );
        return;
      }
      triggerOtpDispatch(cleanPhone, 'register', trimmedName);
    } else {
      if (!existingAcc) {
        if (authName.trim().length >= 2) {
          setAuthMode('register');
          triggerOtpDispatch(cleanPhone, 'register', authName.trim());
        } else {
          setAuthMode('register');
          setAuthErrorMsg('Số này chưa có tài khoản. Vui lòng nhập Họ và tên rồi bấm gửi mã OTP.');
        }
        return;
      }
      triggerOtpDispatch(cleanPhone, 'login', existingAcc.name || '');
    }
  };

  const handleVerifyOtpAndEnter = () => {
    const cleanPhone = normalizePhone(authPhone);
    if (inputOtp.trim() !== generatedOtp) {
      setAuthErrorMsg('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
      return;
    }
    setAuthErrorMsg('');

    const vault = readFraudVault();
    let userRecord = vault.accounts[cleanPhone];

    if (!userRecord) {
      const resolvedName = (authName || '').trim() || `Khách ${cleanPhone.slice(-4)}`;
      const isSecondaryOnSameDevice = vault.boundPhones.length > 0;
      userRecord = {
        phone: cleanPhone,
        name: resolvedName,
        deviceId,
        createdAt: new Date().toISOString(),
        usedPromos: {},
        isSecondaryAccount: isSecondaryOnSameDevice,
      };
      vault.accounts[cleanPhone] = userRecord;
      if (!vault.boundPhones.includes(cleanPhone)) {
        vault.boundPhones.push(cleanPhone);
      }
      writeFraudVault(vault);

      if (isSecondaryOnSameDevice) {
        Alert.alert(
          'Lưu ý chính sách ưu đãi',
          'Tài khoản mới tạo thành công! Tuy nhiên do thiết bị này đã từng nhận ưu đãi tân thủ trước đó, các mã giảm giá 1 lần/người sẽ được khóa để đảm bảo công bằng.'
        );
      }
    }

    // Hợp nhất lịch sử dùng ưu đãi của CẢ SỐ ĐIỆN THOẠI lẫn MÃ THIẾT BỊ (chống tạo nick phụ ăn mã)
    const mergedUsedPromos = {
      ...(vault.devicePromos || {}),
      ...(userRecord.usedPromos || {}),
    };

    setUsedPromos(mergedUsedPromos);
    setCurrentUser(userRecord);
    setOtpSent(false);
    setInputOtp('');

    // Gửi thông báo đăng ký/đăng nhập về Bot Telegram Admin
    postToBackend('/api/register', {
      phone: userRecord.phone,
      name: userRecord.name,
      role: 'customer',
      address: dropoffAddress,
      lat: dropoffCoords.lat,
      lng: dropoffCoords.lng,
      deviceId: userRecord.deviceId,
    }).then((r) => {
      if (r.ok) {
        setAdminSyncNote('Đã gửi thông tin tài khoản mới/đăng nhập về Admin.');
      } else if (r.reason === 'missing_url') {
        setAdminSyncNote('Chưa cấu hình BACKEND_API_URL nên chưa gửi đăng ký mới về Admin.');
      } else {
        setAdminSyncNote(`Gửi đăng ký về Admin chưa thành công (lỗi ${r.status || r.reason}).`);
      }
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setOtpSent(false);
    setInputOtp('');
    setActiveTab('home');
  };

  // Tự động thu thập GPS & Tỉnh/Xã khi đã đăng nhập
  const detectUserLocationAndCommunes = () => {
    setIsLocating(true);
    const onSuccessCoords = async (lat, lng) => {
      setDropoffCoords({ lat, lng });
      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi`
        );
        const revData = await revRes.json();
        const addr = revData.address || {};
        const prov =
          addr.state || addr.province || addr.city || addr.region || 'Quảng Bình';
        setDetectedProvince(prov);

        const exactParts = [
          addr.house_number,
          addr.road,
          addr.suburb || addr.quarter || addr.village || addr.town,
          addr.county || addr.city_district,
          prov,
        ].filter(Boolean);
        setDropoffAddress(
          exactParts.length > 0
            ? exactParts.join(', ')
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        );

        const queryArea = encodeURIComponent(prov);
        const listRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=xã+phường+${queryArea}&limit=25&accept-language=vi`
        );
        const listData = await listRes.json();
        if (Array.isArray(listData) && listData.length >= 4) {
          const parsedList = listData
            .map((item) => ({
              name: item.display_name.split(',')[0].trim(),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }))
            .filter(
              (v, idx, self) =>
                v.name && self.findIndex((t) => t.name === v.name) === idx
            );
          if (parsedList.length > 0) {
            setCommunes(parsedList);
            setCalcFromCommune(parsedList[0]);
            if (parsedList[1]) setCalcToCommune(parsedList[1]);
          }
        }
      } catch (e) {
        setDropoffAddress(`Vị trí GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      } finally {
        setIsLocating(false);
      }
    };

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => onSuccessCoords(pos.coords.latitude, pos.coords.longitude),
        () => {
          setIsLocating(false);
          setDropoffAddress('Phường Ba Đồn, Thị xã Ba Đồn, Quảng Bình');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setDropoffAddress('Phường Ba Đồn, Thị xã Ba Đồn, Quảng Bình');
    }
  };

  useEffect(() => {
    if (currentUser) {
      detectUserLocationAndCommunes();
      const gpsInterval = setInterval(detectUserLocationAndCommunes, 25000);
      return () => clearInterval(gpsInterval);
    }
  }, [currentUser]);

  useEffect(() => {
    if (
      currentUser &&
      dropoffAddress &&
      !dropoffAddress.startsWith('Đang định vị') &&
      isBackendConfigured
    ) {
      postToBackend('/api/location', {
        phone: currentUser.phone,
        name: currentUser.name,
        role: 'customer',
        address: dropoffAddress,
        lat: dropoffCoords.lat,
        lng: dropoffCoords.lng,
      });
    }
  }, [dropoffAddress, dropoffCoords, currentUser]);

  // =========================================================================
  // MÀN HÌNH ĐĂNG NHẬP / ĐĂNG KÝ OTP (HIỆN TRƯỚC KHI VÀO APP)
  // =========================================================================
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6F8" />
        <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.authLogoBox}>
            <View style={styles.authNinjaCircle}>
              <Text style={{ fontSize: 38 }}>🥷</Text>
            </View>
            <Text style={styles.authBrandTitle}>NINJA SHIP KHÁCH</Text>
            <Text style={styles.authBrandSub}>Giao hàng • Đặt đồ ăn • Mua hộ 5.000đ/km</Text>
          </View>

          <View style={styles.authCard}>
            {!!authStatusMsg && (
              <View style={styles.otpBannerBox}>
                <Text style={styles.otpBannerText}>{authStatusMsg}</Text>
              </View>
            )}
            {!!authErrorMsg && (
              <View style={[styles.otpBannerBox, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}>
                <Text style={[styles.otpBannerText, { color: '#B91C1C' }]}>{authErrorMsg}</Text>
              </View>
            )}
            {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
            <View style={styles.authSwitchRow}>
              <TouchableOpacity
                style={[styles.authSwitchTab, authMode === 'login' && styles.authSwitchTabActive]}
                onPress={() => {
                  setAuthMode('login');
                  setOtpSent(false);
                  setInputOtp('');
                  setAuthStatusMsg('');
                  setAuthErrorMsg('');
                }}
              >
                <Text
                  style={[
                    styles.authSwitchText,
                    authMode === 'login' && styles.authSwitchTextActive,
                  ]}
                >
                  Đăng nhập
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authSwitchTab, authMode === 'register' && styles.authSwitchTabActive]}
                onPress={() => {
                  setAuthMode('register');
                  setOtpSent(false);
                  setInputOtp('');
                  setAuthStatusMsg('');
                  setAuthErrorMsg('');
                }}
              >
                <Text
                  style={[
                    styles.authSwitchText,
                    authMode === 'register' && styles.authSwitchTextActive,
                  ]}
                >
                  Đăng ký mới
                </Text>
              </TouchableOpacity>
            </View>

            {authMode === 'register' && (
              <>
                <Text style={styles.inputLabel}>Họ và tên khách hàng *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="VD: Nguyễn Văn An"
                  value={authName}
                  onChangeText={setAuthName}
                  editable={!otpSent}
                />
              </>
            )}

            <Text style={styles.inputLabel}>Số điện thoại nhận mã OTP *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="VD: 0912345678"
              keyboardType="phone-pad"
              maxLength={10}
              value={authPhone}
              onChangeText={setAuthPhone}
              editable={!otpSent}
            />

            {!otpSent ? (
              <TouchableOpacity
                style={[styles.submitOrderBtn, isSendingOtp && { opacity: 0.75 }]}
                onPress={handleRequestOtp}
                disabled={isSendingOtp}
              >
                <Text style={styles.submitOrderText}>
                  {isSendingOtp ? 'Đang gửi mã OTP...' : 'Gửi mã xác thực OTP'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.otpVerifyBox}>
                <View style={styles.labelRowBetween}>
                  <Text style={styles.inputLabel}>Nhập mã OTP 6 số vừa gửi *</Text>
                  <TouchableOpacity
                    disabled={otpCountdown > 0}
                    onPress={handleRequestOtp}
                  >
                    <Text style={styles.gpsRefreshText}>
                      {otpCountdown > 0 ? `Gửi lại (${otpCountdown}s)` : 'Gửi lại mã'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.modalInput, styles.otpInputField]}
                  placeholder="• • • • • •"
                  keyboardType="numeric"
                  maxLength={6}
                  value={inputOtp}
                  onChangeText={setInputOtp}
                />
                <Text style={styles.otpHintText}>
                  Mã OTP thử nghiệm hiện tại: <Text style={{ fontWeight: '900', color: '#D92D20' }}>{generatedOtp}</Text>
                </Text>

                <TouchableOpacity style={styles.submitOrderBtn} onPress={handleVerifyOtpAndEnter}>
                  <Text style={styles.submitOrderText}>
                    {authMode === 'register' ? 'Hoàn tất đăng ký & Vào app' : 'Xác nhận OTP & Đăng nhập'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 12, alignItems: 'center' }}
                  onPress={() => {
                    setOtpSent(false);
                    setInputOtp('');
                  }}
                >
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>
                    ← Đổi số điện thoại khác
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Khung giải thích cơ chế bảo vệ ưu đãi 1 người / 1 lần */}
            <View style={styles.securityNoticeBox}>
              <Text style={styles.securityNoticeTitle}>🛡️ Chính sách chống gian lận ưu đãi</Text>
              <Text style={styles.securityNoticeDesc}>
                • Mỗi khách hàng xác thực 1 SĐT chính chủ + 1 mã thiết bị ({deviceId}).{"\n"}
                • Các mã ưu đãi (-25%, -20%, -15%) chỉ áp dụng duy nhất 1 lần/người & 1 lần/thiết bị.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // GIAO DIỆN CHÍNH SAU KHI ĐÃ XÁC THỰC OTP
  // =========================================================================
  const openModalFor = (name, prefillText = '') => {
    setActiveModal(name);
    if (prefillText) setItemNote(prefillText);
    if (!dropoffAddress || dropoffAddress.startsWith('Đang định vị')) {
      detectUserLocationAndCommunes();
    }
  };

  const currentServiceConfig = SERVICE_CONFIGS[activeModal] || null;
  const promoKey = currentServiceConfig?.promoKey || null;
  const isPromoAlreadyUsed = promoKey ? !!usedPromos[promoKey] : false;

  const autoDistanceKm = selectedPickupCommune
    ? calculateRoadDistanceKm(
        selectedPickupCommune.lat,
        selectedPickupCommune.lng,
        dropoffCoords.lat,
        dropoffCoords.lng
      )
    : 0;

  const RATE_PER_KM = remoteConfig.ratePerKm || 5000;
  const rawShippingFee = Math.round(autoDistanceKm * RATE_PER_KM);
  // Chỉ áp dụng giảm giá nếu cả SĐT lẫn thiết bị CHƯA từng dùng ưu đãi này
  const effectiveDiscountRate =
    currentServiceConfig && !isPromoAlreadyUsed ? currentServiceConfig.discountRate : 0;
  const discountAmount = Math.round(rawShippingFee * effectiveDiscountRate);
  const finalShippingFee = Math.max(0, rawShippingFee - discountAmount);
  const parsedAdvance = currentServiceConfig?.showAdvance
    ? parseInt(advanceMoney.replace(/\D/g, ''), 10) || 0
    : 0;
  const totalAmount = finalShippingFee + parsedAdvance;

  const handleCreateOrder = () => {
    if (!itemNote.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ nội dung yêu cầu.');
      return;
    }
    if (!selectedPickupCommune) {
      Alert.alert('Chưa chọn xã/phường', 'Vui lòng chọn xã/phường điểm lấy hàng.');
      return;
    }

    // Nếu đơn này có áp dụng ưu đãi 1 lần -> Khóa vĩnh viễn ưu đãi đó cho SĐT + Thiết bị + Địa chỉ giao
    if (promoKey && discountAmount > 0) {
      const vault = readFraudVault();
      vault.devicePromos = { ...(vault.devicePromos || {}), [promoKey]: true };
      if (vault.accounts[currentUser.phone]) {
        vault.accounts[currentUser.phone].usedPromos = {
          ...(vault.accounts[currentUser.phone].usedPromos || {}),
          [promoKey]: true,
        };
      }
      writeFraudVault(vault);
      setUsedPromos({ ...usedPromos, [promoKey]: true });
    }

    const fullPickup = pickupDetailAddress.trim()
      ? `${pickupDetailAddress.trim()}, ${selectedPickupCommune.name}`
      : selectedPickupCommune.name;

    const noteSummary = extraNote.trim()
      ? `${itemNote.trim()} • Ghi chú: ${extraNote.trim()} (Từ: ${fullPickup} • ${autoDistanceKm} km)`
      : `${itemNote.trim()} (Từ: ${fullPickup} • ${autoDistanceKm} km)`;

    const newOrder = {
      id: `NS-${Math.floor(1000 + Math.random() * 9000)}`,
      service: activeModal || 'Ninja Ship',
      note: noteSummary,
      total: totalAmount,
      status: 'Đang tìm tài xế Ninja',
      time: 'Vừa xong',
    };
    setOrders([newOrder, ...orders]);
    postToBackend('/api/orders', {
      ...newOrder,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      dropoffAddress,
    }).then((r) => {
      if (r.ok) {
        setAdminSyncNote(`Đã đẩy đơn ${newOrder.id} về máy chủ Admin.`);
      } else if (r.reason === 'missing_url') {
        setAdminSyncNote(`Đơn ${newOrder.id} mới lưu trên máy vì chưa điền BACKEND_API_URL.`);
      } else {
        setAdminSyncNote(`Đơn ${newOrder.id} gửi về Admin bị lỗi (${r.status || r.reason}).`);
      }
    });
    setActiveModal(null);
    setItemNote('');
    setExtraNote('');
    setAdvanceMoney('0');
    setActiveTab('orders');
    Alert.alert(
      'Đặt đơn thành công',
      `Mã đơn ${newOrder.id} (${autoDistanceKm} km) đã gửi tới tài xế gần nhất!`
    );
  };

  const previewKm =
    calcFromCommune && calcToCommune
      ? calculateRoadDistanceKm(
          calcFromCommune.lat,
          calcFromCommune.lng,
          calcToCommune.lat,
          calcToCommune.lng
        )
      : 0;
  const previewCost = Math.round(previewKm * RATE_PER_KM);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7F9" />
      <View style={styles.topTint} />

      {activeTab === 'home' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. HEADER BAR HIỂN THỊ TÊN KHÁCH ĐÃ ĐĂNG NHẬP */}
          <View style={styles.headerRow}>
            <View style={styles.brandPill}>
              <View style={styles.ninjaAvatar}>
                {remoteConfig.appLogo?.startsWith('http') ? <Image source={{ uri: remoteConfig.appLogo }} style={{ width: 28, height: 28, borderRadius: 14 }} /> : <Text style={styles.ninjaEmoji}>{remoteConfig.appLogo || '🥷'}</Text>}
              </View>
              <View style={styles.brandTitleWrap}>
                <Text style={styles.brandTitle} numberOfLines={2}>{remoteConfig.appName || 'NINJA SHIP'}</Text>
              </View>
              <View style={styles.userDivider} />
              <Text style={styles.userName} numberOfLines={2}>
                • {currentUser.name}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.ratePill}
              onPress={() => openModalFor('Giá cước Km')}
            >
              <Text style={styles.rateGear}>⚙️</Text>
              <Text style={styles.rateText}>{(remoteConfig.ratePerKm || 5000).toLocaleString('vi-VN')}đ/km</Text>
            </TouchableOpacity>
          </View>

          {/* 2. THANH TÌM KIẾM */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Bạn muốn ăn gì, mua gì hôm nay?"
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => openModalFor('Mua hộ đồ', searchQuery)}
            />
          </View>

          {/* 3. HAI THẺ DỊCH VỤ LỚN (HIỂN THỊ TRẠNG THÁI ĐÃ DÙNG / CÒN LƯỢT ƯU ĐÃI) */}
          <View style={styles.bigCardsRow}>
            <TouchableOpacity
              style={styles.bigCard}
              activeOpacity={0.85}
              onPress={() => openModalFor('Đặt đồ ăn')}
            >
              <Text style={styles.bigCardTitle}>Đặt đồ ăn</Text>
              {!usedPromos.promo_food_25 ? (
                <View style={styles.discountBadgePink}>
                  <Text style={styles.discountTextPink}>-25% (1 lần)</Text>
                </View>
              ) : (
                <View style={styles.usedBadge}>
                  <Text style={styles.usedBadgeText}>Đã dùng ưu đãi</Text>
                </View>
              )}
              <Text style={styles.bigCardEmoji}>🍜</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bigCard}
              activeOpacity={0.85}
              onPress={() => openModalFor('Mua hộ đồ')}
            >
              <Text style={styles.bigCardTitle}>Mua hộ đồ</Text>
              {!usedPromos.promo_buy_20 ? (
                <View style={styles.discountBadgeYellow}>
                  <Text style={styles.discountTextYellow}>-20% (1 lần)</Text>
                </View>
              ) : (
                <View style={styles.usedBadge}>
                  <Text style={styles.usedBadgeText}>Đã dùng ưu đãi</Text>
                </View>
              )}
              <Text style={styles.bigCardEmoji}>🛍️</Text>
            </TouchableOpacity>
          </View>

          {/* 4. TIÊU ĐỀ DỊCH VỤ KHÁC + MỞ BẢN ĐỒ KM */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dịch vụ khác</Text>
            <TouchableOpacity onPress={() => openModalFor('Mở bản đồ Km')}>
              <Text style={styles.mapLink}>Mở bản đồ Km →</Text>
            </TouchableOpacity>
          </View>

          {/* 5. LƯỚI 8 DỊCH VỤ NHỎ */}
          <View style={styles.gridWrap}>
            {SERVICES_SMALL.map((item) => {
              const showBadge =
                item.id === 'nhan-ho' ? !usedPromos.promo_receive_15 : !!item.badge;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  activeOpacity={0.8}
                  onPress={() => openModalFor(item.title.replace("\n", ' '))}
                >
                  {showBadge && (
                    <View style={[styles.gridBadge, { backgroundColor: item.badgeColor }]}>
                      <Text style={[styles.gridBadgeText, { color: item.badgeText }]}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.gridIcon}>{item.icon}</Text>
                  <Text style={styles.gridLabel}>{item.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 6. BANNER SIÊU TỐC NINJA */}
          <TouchableOpacity
            style={styles.promoBanner}
            activeOpacity={0.9}
            onPress={() => openModalFor('Siêu tốc Ninja')}
          >
            <View style={styles.promoTag}>
              <Text style={styles.promoTagText}>SIÊU TỐC NINJA</Text>
            </View>
            <Text style={styles.promoHeading}>Giao nhanh 15 phút • 5.000đ/km</Text>
            <Text style={styles.promoSub}>
              Tài xế Ninja ứng trước tiền hàng & giao tận tay điểm mua nhất.
            </Text>
            <Text style={styles.promoNinjaDeco}>🥷</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* TAB ĐƠN HÀNG */}
      {activeTab === 'orders' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageHeading}>Đơn hàng của bạn</Text>
          {orders.length === 0 ? (
            <View style={styles.orderCard}>
              <Text style={styles.orderNote}>Bạn chưa có đơn hàng nào. Hãy chọn dịch vụ ở Trang chủ để đặt ngay!</Text>
            </View>
          ) : (
            orders.map((ord) => (
              <View key={ord.id} style={styles.orderCard}>
                <View style={styles.orderCardTop}>
                  <Text style={styles.orderId}>
                    {ord.id} • {ord.service}
                  </Text>
                  <Text style={styles.orderStatus}>{ord.status}</Text>
                </View>
                <Text style={styles.orderNote}>{ord.note}</Text>
                <View style={styles.orderCardBottom}>
                  <Text style={styles.orderTime}>{ord.time}</Text>
                  <Text style={styles.orderTotal}>{ord.total.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* TAB THÔNG BÁO */}
      {activeTab === 'notifications' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageHeading}>Thông báo & Bảo mật</Text>
          <View style={styles.orderCard}>
            <Text style={styles.orderId}>✅ Xác thực OTP thành công</Text>
            <Text style={styles.orderNote}>
              Tài khoản {currentUser.phone} đã liên kết với mã thiết bị {currentUser.deviceId}.
            </Text>
          </View>
          <View style={styles.orderCard}>
            <Text style={styles.orderId}>📡 Trạng thái đồng bộ Admin</Text>
            <Text style={styles.orderNote}>{adminSyncNote}</Text>
          </View>
        </ScrollView>
      )}

      {/* TAB TÀI KHOẢN & ĐĂNG XUẤT */}
      {activeTab === 'profile' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageHeading}>Tài khoản khách hàng</Text>
          <View style={styles.orderCard}>
            <Text style={styles.orderId}>🥷 {currentUser.name}</Text>
            <Text style={styles.orderNote}>Số điện thoại OTP: {currentUser.phone}</Text>
            <Text style={styles.orderNote}>Khu vực: {detectedProvince}</Text>
            <Text style={styles.orderNote}>Mã thiết bị chống gian lận: {currentUser.deviceId}</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitOrderBtn, { backgroundColor: '#1F2937' }]}
            onPress={handleLogout}
          >
            <Text style={styles.submitOrderText}>Đăng xuất tài khoản</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* THANH ĐIỀU HƯỚNG NỔI DƯỚI CÙNG + NÚT CÚP */}
      <View style={styles.floatingNavWrap}>
        <View style={styles.floatingTabBar}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
            <Text style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>🏠</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('orders')}>
            <Text style={[styles.navIcon, activeTab === 'orders' && styles.navIconActive]}>🕒</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('notifications')}>
            <Text style={[styles.navIcon, activeTab === 'notifications' && styles.navIconActive]}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
            <Text style={[styles.navIcon, activeTab === 'profile' && styles.navIconActive]}>👤</Text>
            <View style={styles.redDot} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.trophyButton}
          onPress={() => openModalFor('Ưu đãi')}
        >
          <Text style={styles.trophyIcon}>🏆</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL RIÊNG BIỆT CHO TỪNG MỤC */}
      <Modal visible={!!activeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, marginRight: 8 }}>
                  {currentServiceConfig?.icon ||
                    (activeModal === 'Tài xế gần'
                      ? '📍'
                      : activeModal === 'Ưu đãi'
                      ? '🎁'
                      : '🗺️')}
                </Text>
                <View>
                  <Text style={styles.modalTitle}>{activeModal}</Text>
                  {currentServiceConfig?.discountLabel && (
                    <Text
                      style={[
                        styles.modalSubtitle,
                        isPromoAlreadyUsed && { color: '#DC2626' },
                      ]}
                    >
                      {isPromoAlreadyUsed
                        ? 'Đã sử dụng hết lượt ưu đãi 1 lần/người'
                        : currentServiceConfig.discountLabel}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* NHÓM 1: BIỂU MẪU ĐẶT DỊCH VỤ */}
            {currentServiceConfig && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 540 }}>
                <Text style={styles.inputLabel}>{currentServiceConfig.mainLabel}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={currentServiceConfig.mainPlaceholder}
                  value={itemNote}
                  onChangeText={setItemNote}
                />

                <View style={styles.labelRowBetween}>
                  <Text style={styles.inputLabel}>
                    {currentServiceConfig.pickupLabel} ({detectedProvince}) *
                  </Text>
                  <Text style={styles.autoBadge}>Chọn xã/phường</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.communeChipsRow}
                >
                  {communes.map((com, index) => {
                    const isSelected = selectedPickupCommune?.name === com.name;
                    return (
                      <TouchableOpacity
                        key={`${com.name}-${index}`}
                        style={[
                          styles.communeChip,
                          isSelected && styles.communeChipActive,
                        ]}
                        onPress={() => setSelectedPickupCommune(com)}
                      >
                        <Text
                          style={[
                            styles.communeChipText,
                            isSelected && styles.communeChipTextActive,
                          ]}
                        >
                          {com.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {selectedPickupCommune && (
                  <View style={styles.detailAddrBox}>
                    <Text style={styles.subInputLabel}>
                      Địa chỉ cụ thể tại {selectedPickupCommune.name} (số nhà, tên quán):
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder={currentServiceConfig.detailPlaceholder}
                      value={pickupDetailAddress}
                      onChangeText={setPickupDetailAddress}
                    />
                  </View>
                )}

                <View style={styles.labelRowBetween}>
                  <Text style={styles.inputLabel}>Điểm giao cho bạn (Vị trí chính xác) *</Text>
                  <TouchableOpacity onPress={detectUserLocationAndCommunes}>
                    <Text style={styles.gpsRefreshText}>
                      {isLocating ? 'Đang định vị...' : '📍 Cập nhật GPS'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.gpsBox}>
                  {isLocating && (
                    <ActivityIndicator size="small" color="#D92D20" style={{ marginRight: 8 }} />
                  )}
                  <TextInput
                    style={styles.gpsInput}
                    value={dropoffAddress}
                    onChangeText={setDropoffAddress}
                    placeholder="Vị trí GPS chính xác của bạn"
                  />
                </View>

                {currentServiceConfig.showAdvance && (
                  <>
                    <Text style={styles.inputLabel}>{currentServiceConfig.advanceLabel}</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={advanceMoney}
                      onChangeText={setAdvanceMoney}
                    />
                  </>
                )}

                <Text style={styles.inputLabel}>{currentServiceConfig.extraLabel}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={currentServiceConfig.extraPlaceholder}
                  value={extraNote}
                  onChangeText={setExtraNote}
                />

                <View style={styles.priceSummary}>
                  <Text style={styles.priceLine}>
                    {selectedPickupCommune
                      ? `Tự động tính: ${selectedPickupCommune.name} → Vị trí của bạn (${autoDistanceKm} km × 5.000đ = ${rawShippingFee.toLocaleString('vi-VN')}đ)`
                      : 'Chọn xã/phường lấy hàng để tự động tính khoảng cách Km'}
                  </Text>
                  {discountAmount > 0 && selectedPickupCommune && (
                    <Text style={styles.discountLine}>
                      Ưu đãi 1 lần/người (-{Math.round(effectiveDiscountRate * 100)}%): -{discountAmount.toLocaleString('vi-VN')}đ
                    </Text>
                  )}
                  {isPromoAlreadyUsed && promoKey && (
                    <Text style={styles.usedPromoWarning}>
                      * Tài khoản / thiết bị này đã sử dụng ưu đãi giảm giá trước đó (áp dụng giá chuẩn 5.000đ/km).
                    </Text>
                  )}
                  <Text style={styles.priceTotal}>
                    Tổng thanh toán: {totalAmount.toLocaleString('vi-VN')}đ
                  </Text>
                </View>

                <TouchableOpacity style={styles.submitOrderBtn} onPress={handleCreateOrder}>
                  <Text style={styles.submitOrderText}>{currentServiceConfig.submitText}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* NHÓM 2: MỤC "TÀI XẾ GẦN" */}
            {activeModal === 'Tài xế gần' && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                <Text style={styles.helperBanner}>
                  📍 Khu vực hiện tại: {dropoffAddress}
                </Text>
                {liveDrivers.map((drv) => (
                  <View key={drv.id} style={styles.infoCard}>
                    <View style={styles.labelRowBetween}>
                      <Text style={styles.infoCardTitle}>🛵 {drv.name}</Text>
                      <Text style={styles.driverDistBadge}>Cách {drv.dist}</Text>
                    </View>
                    <Text style={styles.infoCardSub}>{drv.bike} • Đánh giá {drv.rating}</Text>
                    <View style={[styles.labelRowBetween, { marginTop: 8 }]}>
                      <Text style={styles.driverStatusText}>● {drv.status}</Text>
                      <TouchableOpacity
                        style={styles.miniActionBtn}
                        onPress={() => openModalFor('Giao đồ Km')}
                      >
                        <Text style={styles.miniActionText}>Đặt tài xế này</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* NHÓM 3: MỤC "ƯU ĐÃI" (HIỂN THỊ TRẠNG THÁI 1 NGƯỜI 1 LẦN) */}
            {activeModal === 'Ưu đãi' && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                <Text style={styles.helperBanner}>
                  🛡️ Áp dụng 1 lần duy nhất cho SĐT {currentUser.phone} & thiết bị {currentUser.deviceId}
                </Text>
                {VOUCHERS_LIST.map((v) => {
                  const used = !!usedPromos[v.key];
                  return (
                    <View key={v.code} style={[styles.infoCard, used && { opacity: 0.6 }]}>
                      <View style={styles.labelRowBetween}>
                        <Text style={styles.voucherCode}>{v.code}</Text>
                        <Text
                          style={[
                            styles.autoBadge,
                            used && { backgroundColor: '#FEE2E2', color: '#DC2626' },
                          ]}
                        >
                          {used ? 'Đã sử dụng' : 'Còn 1 lượt'}
                        </Text>
                      </View>
                      <Text style={styles.infoCardTitle}>{v.title}</Text>
                      <Text style={styles.infoCardSub}>{v.desc}</Text>
                      {!used && (
                        <TouchableOpacity
                          style={[styles.miniActionBtn, { alignSelf: 'flex-end', marginTop: 8 }]}
                          onPress={() => openModalFor(v.tag)}
                        >
                          <Text style={styles.miniActionText}>Dùng ngay →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* NHÓM 4: MỤC "MỞ BẢN ĐỒ KM" & "GIÁ CƯỚC KM" */}
            {(activeModal === 'Mở bản đồ Km' || activeModal === 'Giá cước Km') && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
                <View style={styles.rateHighlightBox}>
                  <Text style={styles.rateHighlightTitle}>Bảng giá Ninja Ship ({detectedProvince})</Text>
                  <Text style={styles.rateHighlightSub}>
                    • Đồng giá chuẩn: 5.000đ / 1 km (tính tự động từ tâm xã đến tâm xã){"\n"}
                    • Không phụ thu giờ cao điểm • Tài xế ứng trước tiền hàng miễn phí
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Chọn xã/phường xuất phát:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communeChipsRow}>
                  {communes.map((com, idx) => (
                    <TouchableOpacity
                      key={`from-${idx}`}
                      style={[
                        styles.communeChip,
                        calcFromCommune?.name === com.name && styles.communeChipActive,
                      ]}
                      onPress={() => setCalcFromCommune(com)}
                    >
                      <Text
                        style={[
                          styles.communeChipText,
                          calcFromCommune?.name === com.name && styles.communeChipTextActive,
                        ]}
                      >
                        {com.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Chọn xã/phường điểm đến:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communeChipsRow}>
                  {communes.map((com, idx) => (
                    <TouchableOpacity
                      key={`to-${idx}`}
                      style={[
                        styles.communeChip,
                        calcToCommune?.name === com.name && styles.communeChipActive,
                      ]}
                      onPress={() => setCalcToCommune(com)}
                    >
                      <Text
                        style={[
                          styles.communeChipText,
                          calcToCommune?.name === com.name && styles.communeChipTextActive,
                        ]}
                      >
                        {com.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.priceSummary}>
                  <Text style={styles.priceLine}>
                    Tuyến: {calcFromCommune?.name} ↔ {calcToCommune?.name}
                  </Text>
                  <Text style={styles.priceTotal}>
                    Quãng đường: {previewKm} km • Cước ước tính: {previewCost.toLocaleString('vi-VN')}đ
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.submitOrderBtn}
                  onPress={() => {
                    setSelectedPickupCommune(calcFromCommune);
                    openModalFor('Giao đồ Km');
                  }}
                >
                  <Text style={styles.submitOrderText}>Đặt đơn theo tuyến này</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authSafeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  authContainer: {
    padding: 20,
    paddingTop: 32,
  },
  authLogoBox: {
    alignItems: 'center',
    marginBottom: 22,
  },
  authNinjaCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  authBrandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D92D20',
  },
  authBrandSub: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  authSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  authSwitchTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  authSwitchTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  authSwitchText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  authSwitchTextActive: {
    color: '#111827',
  },
  otpVerifyBox: {
    marginTop: 6,
  },
  otpInputField: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 6,
  },
  otpHintText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  securityNoticeBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  securityNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  securityNoticeDesc: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  topTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#EEF6F3',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ninjaAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  ninjaEmoji: {
    fontSize: 18,
  },
  brandTitleWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D92D20',
    lineHeight: 14,
  },
  userDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 16,
  },
  ratePill: {
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  rateGear: {
    fontSize: 12,
    marginBottom: 1,
  },
  rateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  bigCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bigCard: {
    width: '48%',
    height: 132,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bigCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  discountBadgePink: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  discountTextPink: {
    color: '#E11D48',
    fontSize: 11,
    fontWeight: '800',
  },
  discountBadgeYellow: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  discountTextYellow: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  usedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  usedBadgeText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  bigCardEmoji: {
    fontSize: 38,
    alignSelf: 'flex-end',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  mapLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D92D20',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridItem: {
    width: '23.2%',
    height: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gridBadge: {
    position: 'absolute',
    top: -6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  gridIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 15,
  },
  promoBanner: {
    backgroundColor: '#B91C1C',
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    marginTop: 4,
  },
  promoTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  promoTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
  },
  promoHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 13,
    color: '#FEE2E2',
    paddingRight: 50,
    lineHeight: 18,
  },
  promoNinjaDeco: {
    position: 'absolute',
    right: 14,
    bottom: 8,
    fontSize: 54,
  },
  floatingNavWrap: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingTabBar: {
    flex: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  navItem: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 22,
    opacity: 0.55,
  },
  navIconActive: {
    opacity: 1,
    transform: [{ scale: 1.12 }],
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  trophyButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  trophyIcon: {
    fontSize: 24,
  },
  pageHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D92D20',
  },
  orderNote: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  orderTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  modalClose: {
    fontSize: 20,
    color: '#6B7280',
    padding: 4,
  },
  labelRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  subInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  autoBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  communeChipsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  communeChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  communeChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#D92D20',
  },
  communeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  communeChipTextActive: {
    color: '#D92D20',
    fontWeight: '800',
  },
  detailAddrBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gpsRefreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D92D20',
  },
  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  gpsInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#111827',
    marginBottom: 10,
  },
  priceSummary: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
  },
  priceLine: {
    fontSize: 13,
    color: '#7F1D1D',
    marginBottom: 4,
    lineHeight: 18,
  },
  discountLine: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  usedPromoWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: 4,
  },
  priceTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
  },
  submitOrderBtn: {
    backgroundColor: '#D92D20',
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  helperBanner: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  infoCardSub: {
    fontSize: 13,
    color: '#4B5563',
  },
  driverDistBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D92D20',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  driverStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  miniActionBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  miniActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  voucherCode: {
    fontSize: 14,
    fontWeight: '900',
    color: '#D92D20',
  },
  rateHighlightBox: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  rateHighlightTitle: {
    color: '#FACC15',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  rateHighlightSub: {
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 18,
  },
  otpBannerBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  otpBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
