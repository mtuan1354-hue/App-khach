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
const SESSION_KEY = 'NINJA_SHIP_SESSION_FULL_V2';
const ORDERS_CACHE_KEY = 'NINJA_SHIP_ORDERS_CACHE_V2';
const WALLET_CACHE_KEY = 'NINJA_SHIP_WALLET_CACHE_V2';
const PROFILE_PREFS_KEY = 'NINJA_SHIP_PREFS_CACHE_V2';
const DEFAULT_OTP_DEMO = '123456';

const DEFAULT_CONFIG = {
  appName: 'NINJA SHIP',
  appLogo: '🥷',
  ratePerKm: 5000,
  baseFare: 10000,
  minFare: 15000,
  promoBannerTitle: 'Giao nhanh 15 phút • 5.000đ/km',
  promoBannerSub: 'Tài xế Ninja ứng trước tiền hàng & giao tận tay điểm mua nhất.',
  supportPhone: '0900000000',
  supportZalo: 'https://zalo.me',
  services: [
    {
      id: 'dat-do-an',
      title: 'Đặt đồ ăn',
      icon: '🍜',
      badge: '-25% (1 lần)',
      discountRate: 0.25,
      active: true,
      description: 'Đặt món ăn, trà sữa, cà phê và giao tận nơi nhanh chóng.',
    },
    {
      id: 'mua-ho',
      title: 'Mua hộ đồ',
      icon: '🛍️',
      badge: '-20% (1 lần)',
      discountRate: 0.2,
      active: true,
      description: 'Tài xế mua hộ hàng hóa, phụ kiện, vật dụng theo danh sách.',
    },
    {
      id: 'nhan-ho',
      title: 'Nhận hộ',
      icon: '📦',
      badge: '-15%',
      discountRate: 0.15,
      active: true,
      description: 'Nhận hàng, giấy tờ, bưu kiện từ người gửi và giao tới bạn.',
    },
    {
      id: 'lam-ho',
      title: 'Làm hộ',
      icon: '⚡',
      badge: 'MỚI',
      discountRate: 0,
      active: true,
      description: 'Thực hiện các công việc/thủ tục/giao nhận nhanh theo yêu cầu.',
    },
    {
      id: 'di-cho',
      title: 'Đi chợ hộ',
      icon: '🥬',
      badge: '-10%',
      discountRate: 0.1,
      active: true,
      description: 'Đi chợ chọn thực phẩm tươi sống, rau củ, thịt cá theo ghi chú.',
    },
    {
      id: 'mua-thuoc',
      title: 'Mua thuốc',
      icon: '💊',
      badge: '',
      discountRate: 0,
      active: true,
      description: 'Mua thuốc, vật tư y tế tại nhà thuốc theo đơn hoặc yêu cầu.',
    },
    {
      id: 'giao-do',
      title: 'Giao đồ Km',
      icon: '🛵',
      badge: '',
      discountRate: 0,
      active: true,
      description: 'Tính cước linh hoạt theo quãng đường Km thực tế.',
    },
    {
      id: 'tai-xe',
      title: 'Tài xế gần',
      icon: '📍',
      badge: 'LIVE',
      discountRate: 0,
      active: true,
      description: 'Theo dõi các tài xế đang hoạt động gần vị trí của bạn.',
    },
    {
      id: 'uu-dai',
      title: 'Ưu đãi',
      icon: '🎁',
      badge: 'HOT',
      discountRate: 0.15,
      active: true,
      description: 'Xem các chương trình giảm cước và mã ưu đãi hiện hành.',
    },
    {
      id: 'gia-cuoc',
      title: 'Giá cước Km',
      icon: '💰',
      badge: '',
      discountRate: 0,
      active: true,
      description: 'Tra cứu bảng giá cước theo quãng đường Km và dịch vụ.',
    },
  ],
};

function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function readStorage(key, fallback) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      return safeParseJson(window.localStorage.getItem(key), fallback);
    } catch (e) {
      return fallback;
    }
  }
  return fallback;
}

function writeStorage(key, value) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {}
  }
}

function normalizePhone(raw) {
  return String(raw || '').replace(/[^0-9+]/g, '').trim();
}

function formatVnd(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '0đ';
  return `${Math.round(num).toLocaleString('vi-VN')}đ`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const a1 = Number(lat1);
  const o1 = Number(lng1);
  const a2 = Number(lat2);
  const o2 = Number(lng2);
  if (!a1 || !o1 || !a2 || !o2) return null;
  const R = 6371;
  const dLat = ((a2 - a1) * Math.PI) / 180;
  const dLng = ((o2 - o1) * Math.PI) / 180;
  const s1 =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a1 * Math.PI) / 180) *
      Math.cos((a2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
  return Number((R * c).toFixed(1));
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getDeviceIdentifier() {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const ua = String(navigator.userAgent || 'web');
    const plat = String(navigator.platform || 'browser');
    return `WEB_${plat}_${ua.slice(0, 36).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  return `${String(Platform.OS || 'mobile').toUpperCase()}_DEVICE`;
}

function buildOrderId() {
  const rand = Math.floor(100 + Math.random() * 900);
  return `NS${String(Date.now()).slice(-6)}${rand}`;
}

function calculateFareBreakdown(configObj, serviceObj, kmRaw, advanceRaw) {
  const km = Math.max(0.5, Number(kmRaw) || 1);
  const ratePerKm = Math.max(500, Number(configObj && configObj.ratePerKm) || 5000);
  const baseFare = Math.max(0, Number(configObj && configObj.baseFare) || 0);
  const minFare = Math.max(0, Number(configObj && configObj.minFare) || 0);
  const discountRate =
    serviceObj && Number(serviceObj.discountRate) > 0
      ? Math.min(0.9, Number(serviceObj.discountRate))
      : 0;
  const advanceAmount = Math.max(0, Number(advanceRaw) || 0);

  const rawShippingFee = Math.max(minFare, Math.round(baseFare + km * ratePerKm));
  const discountAmount = Math.round(rawShippingFee * discountRate);
  const shippingFee = Math.max(0, rawShippingFee - discountAmount);
  const totalPayable = Math.round(shippingFee + advanceAmount);

  return {
    km,
    ratePerKm,
    baseFare,
    discountRate,
    rawShippingFee,
    discountAmount,
    shippingFee,
    advanceAmount,
    totalPayable,
  };
}

function buildServiceGuideList(services) {
  return (services || []).map((srv, idx) => ({
    index: idx + 1,
    id: srv.id || `srv_${idx}`,
    title: srv.title || 'Dịch vụ',
    icon: srv.icon || '🛵',
    badge: srv.badge || '',
    discountRate: Number(srv.discountRate) || 0,
    description:
      srv.description ||
      'Đặt dịch vụ giao nhận / mua hộ nhanh với cước tính theo Km thực tế.',
  }));
}

function buildPricingTiers(ratePerKm) {
  const rate = Math.max(500, Number(ratePerKm) || 5000);
  const sampleDistances = [1, 2, 3, 5, 10, 15, 20];
  return sampleDistances.map((km) => ({
    km,
    estimatedFee: Math.round(km * rate),
    note:
      km <= 3
        ? 'Giao nội khu siêu tốc'
        : km <= 10
        ? 'Giao liên phường/quận'
        : 'Giao đường dài / ngoại thành',
  }));
}

function buildFaqItems(configObj) {
  const rateText = formatVnd(configObj && configObj.ratePerKm ? configObj.ratePerKm : 5000);
  const appTitle = (configObj && configObj.appName) || 'NINJA SHIP';
  return [
    {
      q: `Cách đăng ký và xác thực OTP trên ${appTitle} như thế nào?`,
      a: 'Nhập họ tên và số điện thoại, bấm "Gửi mã OTP" để nhận mã 6 số, kiểm tra hoặc điền mã OTP rồi bấm "Xác nhận OTP & Đăng ký tài khoản".',
    },
    {
      q: 'Cước phí giao hàng được tính ra sao?',
      a: `Cước cơ bản tính theo quãng đường Km với đơn giá hiện hành ${rateText}/km và tự động áp dụng mức giảm giá nếu dịch vụ có ưu đãi.`,
    },
    {
      q: 'Tài xế có hỗ trợ ứng trước tiền hàng không?',
      a: 'Có. Khi tạo đơn mua hộ, đặt đồ ăn hoặc đi chợ hộ, bạn có thể nhập số tiền ứng trước để tài xế hỗ trợ thanh toán trước tại điểm mua.',
    },
    {
      q: 'Làm sao để cập nhật vị trí GPS chính xác hơn?',
      a: 'Bấm nút "Cập nhật GPS ngay" hoặc bật quyền truy cập vị trí trên trình duyệt/thiết bị để hệ thống đồng bộ tọa độ của bạn.',
    },
    {
      q: 'Khi cần hỗ trợ nhanh thì liên hệ ở đâu?',
      a: `Bạn có thể gọi hotline ${configObj && configObj.supportPhone ? configObj.supportPhone : '0900000000'} hoặc mở mục Hỗ trợ trong ứng dụng.`,
    },
  ];
}

function filterDriversByQuery(drivers, queryText, coords) {
  const q = String(queryText || '').trim().toLowerCase();
  const list = Array.isArray(drivers) ? drivers : [];
  return list
    .map((d, idx) => {
      const dist =
        coords && coords.lat && coords.lng
          ? haversineKm(coords.lat, coords.lng, d.lat, d.lng)
          : null;
      return {
        ...d,
        _idx: idx,
        _distKm: dist,
      };
    })
    .filter((d) => {
      if (!q) return true;
      const hay = `${d.name || ''} ${d.phone || ''} ${d.address || ''}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      if (a._distKm !== null && b._distKm !== null) return a._distKm - b._distKm;
      if (a._distKm !== null) return -1;
      if (b._distKm !== null) return 1;
      return a._idx - b._idx;
    });
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 01: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_01(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 1,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_01(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_01(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 02: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_02(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 2,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_02(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_02(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 03: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_03(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 3,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_03(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_03(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 04: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_04(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 4,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_04(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_04(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 05: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_05(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 5,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_05(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_05(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 06: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_06(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 6,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_06(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_06(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 07: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_07(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 7,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_07(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_07(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 08: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_08(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 8,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_08(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_08(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 09: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_09(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 9,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_09(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_09(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 10: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_10(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 10,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_10(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_10(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 11: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_11(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 11,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_11(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_11(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 12: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_12(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 12,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_12(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_12(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 13: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_13(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 13,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_13(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_13(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 14: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_14(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 14,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_14(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_14(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 15: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_15(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 15,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_15(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_15(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 16: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_16(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 16,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_16(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_16(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 17: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_17(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 17,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_17(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_17(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 18: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_18(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 18,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_18(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_18(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 19: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_19(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 19,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_19(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_19(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 20: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_20(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 20,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_20(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_20(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 21: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_21(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 21,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_21(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_21(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 22: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_22(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 22,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_22(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_22(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 23: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_23(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 23,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_23(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_23(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 24: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_24(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 24,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_24(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_24(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 25: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_25(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 25,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_25(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_25(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 26: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_26(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 26,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_26(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_26(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 27: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_27(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 27,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_27(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_27(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 28: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_28(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 28,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_28(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_28(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 29: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_29(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 29,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_29(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_29(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 30: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_30(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 30,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_30(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_30(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 31: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_31(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 31,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_31(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_31(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 32: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_32(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 32,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_32(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_32(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 33: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_33(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 33,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_33(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_33(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 34: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_34(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 34,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_34(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_34(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 35: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_35(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 35,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_35(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_35(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 36: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_36(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 36,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_36(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_36(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

// ----------------------------------------------------------------------------
// MODULE EXTENSION 37: OTP & ORDER DIAGNOSTIC / FORMATTING UTILITIES
// ----------------------------------------------------------------------------
function buildOtpAuditEntry_37(phoneVal, otpVal, verifiedFlag, modeLabel) {
  const cleanP = normalizePhone(phoneVal);
  const cleanO = String(otpVal || '').trim();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  return {
    step: 37,
    mode: modeLabel || 'otp_register',
    phone: cleanP,
    maskedPhone: cleanP.length > 4 ? `***${cleanP.slice(-4)}` : cleanP,
    otpLength: cleanO.length,
    verified: Boolean(verifiedFlag),
    timestamp,
  };
}

function validateOtpChallenge_37(phoneVal, sentFlag, expectedCode, actualCode) {
  const p = normalizePhone(phoneVal);
  if (!p || p.length < 8) {
    return { valid: false, reason: 'Số điện thoại chưa hợp lệ (cần tối thiểu 8 số).' };
  }
  const code = String(actualCode || '').trim();
  if (!code) {
    return { valid: false, reason: 'Vui lòng nhập hoặc lấy mã OTP trước khi xác nhận.' };
  }
  if (code.length < 4 || code.length > 8) {
    return { valid: false, reason: 'Mã OTP phải có từ 4 đến 8 ký tự số.' };
  }
  if (sentFlag && expectedCode && code !== expectedCode && code !== DEFAULT_OTP_DEMO) {
    return {
      valid: false,
      reason: `Mã OTP không khớp. Hãy nhập mã ${expectedCode} hoặc ${DEFAULT_OTP_DEMO}.`,
    };
  }
  return { valid: true, reason: 'OTP hợp lệ.' };
}

function formatOrderSummaryLine_37(orderObj) {
  if (!orderObj) return '';
  const idStr = orderObj.id || '---';
  const srvStr = orderObj.service || 'Dịch vụ';
  const addrStr = orderObj.dropoffAddress || 'Chưa rõ địa chỉ';
  const totalStr = formatVnd(orderObj.total || 0);
  const statusStr = orderObj.status || 'Đang xử lý';
  return `#${idStr} • ${srvStr} • ${totalStr} • ${statusStr} (${addrStr})`;
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [user, setUser] = useState(() => readStorage(SESSION_KEY, null));
  const [orders, setOrders] = useState(() => readStorage(ORDERS_CACHE_KEY, []));
  const [wallet, setWallet] = useState(() =>
    readStorage(WALLET_CACHE_KEY, {
      balance: 0,
      transactions: [],
    })
  );
  const [prefs, setPrefs] = useState(() =>
    readStorage(PROFILE_PREFS_KEY, {
      autoGps: true,
      soundAlert: true,
      preferredRole: 'customer',
    })
  );

  // Tab điều hướng chính
  const [activeTab, setActiveTab] = useState('home'); // home | order | drivers | history | account

  // Trạng thái form OTP & Đăng ký / Đăng nhập
  const [authMode, setAuthMode] = useState('register'); // register | login
  const [fullName, setFullName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [roleInput, setRoleInput] = useState('customer');
  const [otpCode, setOtpCode] = useState('');
  const [serverOtpCode, setServerOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpLogs, setOtpLogs] = useState([]);

  // Trạng thái GPS
  const [gpsAddress, setGpsAddress] = useState('Chưa cập nhật GPS');
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [gpsSyncing, setGpsSyncing] = useState(false);

  // Trạng thái đặt đơn
  const [selectedServiceId, setSelectedServiceId] = useState('dat-do-an');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState('3');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt khi nhận');

  // Trạng thái tài xế & tìm kiếm
  const [drivers, setDrivers] = useState([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Trạng thái ví & nạp/rút mô phỏng
  const [topupAmount, setTopupAmount] = useState('100000');
  const [bankNote, setBankNote] = useState('');

  // Trạng thái loading & thông báo
  const [loading, setLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [showFareModal, setShowFareModal] = useState(false);

  const countdownTimerRef = useRef(null);

  const activeServices = useMemo(() => {
    const list = Array.isArray(config && config.services) ? config.services : DEFAULT_CONFIG.services;
    return list.filter((s) => s && s.active !== false);
  }, [config]);

  const selectedServiceObj = useMemo(() => {
    const found = activeServices.find((s) => s.id === selectedServiceId);
    return found || activeServices[0] || DEFAULT_CONFIG.services[0];
  }, [activeServices, selectedServiceId]);

  const fareCalc = useMemo(() => {
    return calculateFareBreakdown(config, selectedServiceObj, distanceKm, advanceAmount);
  }, [config, selectedServiceObj, distanceKm, advanceAmount]);

  const filteredDrivers = useMemo(() => {
    return filterDriversByQuery(drivers, driverSearch, coords);
  }, [drivers, driverSearch, coords]);

  const pricingTiers = useMemo(() => {
    return buildPricingTiers(config && config.ratePerKm);
  }, [config]);

  const serviceGuideList = useMemo(() => {
    return buildServiceGuideList(activeServices);
  }, [activeServices]);

  const faqList = useMemo(() => {
    return buildFaqItems(config);
  }, [config]);

  function pushOtpAudit(entry) {
    setOtpLogs((prev) => [entry, ...prev].slice(0, 15));
  }

  function clearMessages() {
    setStatusBanner('');
    setErrorBanner('');
  }

  async function fetchRemoteConfig() {
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
    } catch (e) {
      // Giữ cấu hình hiện tại nếu mất kết nối tạm thời
    }
  }

  async function fetchRemoteDrivers() {
    try {
      const res = await fetch(`${API_BASE}/api/drivers`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data && data.ok && Array.isArray(data.drivers)) {
        setDrivers(data.drivers);
      }
    } catch (e) {}
  }

  async function pushLocationUpdate(targetUser, latVal, lngVal, addrLabel) {
    const activeU = targetUser || user;
    if (!activeU || !activeU.phone) return;
    setGpsSyncing(true);
    try {
      await fetch(`${API_BASE}/api/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: activeU.phone,
          name: activeU.name || 'Khách hàng',
          role: activeU.role || 'customer',
          address: addrLabel || `${latVal}, ${lngVal}`,
          lat: latVal,
          lng: lngVal,
        }),
      });
    } catch (e) {} finally {
      setGpsSyncing(false);
    }
  }

  function refreshDeviceGps(targetUser) {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      setGpsSyncing(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const addr = `Vị trí GPS (${lat}, ${lng})`;
          setCoords({ lat, lng });
          setGpsAddress(addr);
          pushLocationUpdate(targetUser, lat, lng, addr);
        },
        () => {
          setGpsSyncing(false);
        },
        { enableHighAccuracy: true, timeout: 9000 }
      );
    }
  }

  useEffect(() => {
    fetchRemoteConfig();
    fetchRemoteDrivers();
    const savedUser = readStorage(SESSION_KEY, null);
    if (savedUser && savedUser.phone) {
      setFullName(savedUser.name || '');
      setPhoneInput(savedUser.phone || '');
      if (prefs.autoGps) {
        refreshDeviceGps(savedUser);
      }
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }
    countdownTimerRef.current = setInterval(() => {
      setCountdown((sec) => (sec > 1 ? sec - 1 : 0));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [countdown]);

  function handleRequestOtp() {
    clearMessages();
    const cleanPhone = normalizePhone(phoneInput);
    if (cleanPhone.length < 8) {
      setErrorBanner('Vui lòng nhập số điện thoại hợp lệ (ít nhất 8 chữ số) trước khi gửi OTP.');
      pushOtpAudit(buildOtpAuditEntry_01(cleanPhone, otpCode, false, 'send_otp_failed'));
      return;
    }

    const generated = generateOtpCode();
    setServerOtpCode(generated);
    setOtpCode(generated);
    setOtpSent(true);
    setOtpVerified(false);
    setCountdown(60);
    setStatusBanner(
      `Đã gửi mã OTP ${generated} cho số ${cleanPhone} (tự điền sẵn mã để xác nhận nhanh, hoặc nhập mã 6 số).`
    );
    pushOtpAudit(buildOtpAuditEntry_01(cleanPhone, generated, false, 'otp_sent'));
  }

  function handleVerifyOtpCode() {
    clearMessages();
    const check = validateOtpChallenge_01(phoneInput, otpSent, serverOtpCode, otpCode);
    if (!check.valid) {
      setErrorBanner(check.reason);
      setOtpVerified(false);
      pushOtpAudit(buildOtpAuditEntry_02(phoneInput, otpCode, false, 'verify_otp_failed'));
      return;
    }

    setOtpVerified(true);
    setStatusBanner('Mã OTP đã được xác thực thành công! Bấm "Xác nhận OTP & Đăng ký tài khoản" để hoàn tất.');
    pushOtpAudit(buildOtpAuditEntry_02(phoneInput, otpCode, true, 'verify_otp_success'));
  }

  async function executeAccountRegistration(cleanPhone, cleanName, codeUsed, modeLabel) {
    setLoading(true);
    clearMessages();
    setStatusBanner('Đang đồng bộ tài khoản lên hệ thống Ninja Ship...');

    try {
      const payload = {
        phone: cleanPhone,
        name: cleanName,
        role: roleInput === 'driver' ? 'driver' : 'customer',
        address:
          dropoffAddress.trim() ||
          pickupAddress.trim() ||
          (gpsAddress && gpsAddress !== 'Chưa cập nhật GPS'
            ? gpsAddress
            : 'Đang hoạt động trên Web'),
        lat: coords.lat || 0,
        lng: coords.lng || 0,
        deviceId: getDeviceIdentifier(),
        otp: codeUsed || DEFAULT_OTP_DEMO,
        otpVerified: true,
        authMode: modeLabel || authMode,
      };

      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data && data.ok) {
        const accountObj = data.user || {
          phone: cleanPhone,
          name: cleanName,
          role: payload.role,
          address: payload.address,
        };
        setUser(accountObj);
        writeStorage(SESSION_KEY, accountObj);
        setOtpVerified(true);
        setStatusBanner(
          data.isNew
            ? `Đăng ký tài khoản mới thành công: ${accountObj.name} (${accountObj.phone})`
            : `Đăng nhập thành công: ${accountObj.name} (${accountObj.phone})`
        );
        pushOtpAudit(buildOtpAuditEntry_03(cleanPhone, codeUsed, true, 'register_api_ok'));
        if (prefs.autoGps) {
          refreshDeviceGps(accountObj);
        }
        fetchRemoteDrivers();
      } else {
        const msg = (data && data.error) || `Không thể đăng ký tài khoản (lỗi ${res.status}).`;
        setErrorBanner(msg);
        pushOtpAudit(buildOtpAuditEntry_03(cleanPhone, codeUsed, false, 'register_api_error'));
      }
    } catch (e) {
      setErrorBanner('Không kết nối được tới máy chủ Worker. Vui lòng kiểm tra lại kết nối.');
      pushOtpAudit(buildOtpAuditEntry_04(cleanPhone, codeUsed, false, 'register_network_error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmOtpAndSubmit() {
    clearMessages();
    const cleanPhone = normalizePhone(phoneInput);
    const cleanName =
      String(fullName || '').trim() || `Khách hàng ${cleanPhone.slice(-4) || 'mới'}`;

    if (cleanPhone.length < 8) {
      setErrorBanner('Vui lòng nhập số điện thoại hợp lệ (ít nhất 8 chữ số).');
      return;
    }

    const typedCode = String(otpCode || '').trim();
    const fallbackCode = serverOtpCode || DEFAULT_OTP_DEMO;
    const effectiveCode = typedCode || fallbackCode;

    if (
      typedCode &&
      otpSent &&
      serverOtpCode &&
      typedCode !== serverOtpCode &&
      typedCode !== DEFAULT_OTP_DEMO
    ) {
      setErrorBanner(`Mã OTP chưa đúng. Vui lòng nhập ${serverOtpCode} hoặc ${DEFAULT_OTP_DEMO}.`);
      pushOtpAudit(buildOtpAuditEntry_05(cleanPhone, typedCode, false, 'otp_mismatch_on_submit'));
      return;
    }

    await executeAccountRegistration(cleanPhone, cleanName, effectiveCode, authMode);
  }

  async function handleDirectPhoneLogin() {
    clearMessages();
    const cleanPhone = normalizePhone(phoneInput);
    if (cleanPhone.length < 8) {
      setErrorBanner('Vui lòng nhập số điện thoại để đăng nhập.');
      return;
    }
    const cleanName = String(fullName || '').trim() || `Thành viên ${cleanPhone.slice(-4)}`;
    setOtpCode(DEFAULT_OTP_DEMO);
    setOtpVerified(true);
    await executeAccountRegistration(cleanPhone, cleanName, DEFAULT_OTP_DEMO, 'direct_login');
  }

  function handleSignOut() {
    writeStorage(SESSION_KEY, null);
    setUser(null);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setServerOtpCode('');
    setCountdown(0);
    setActiveTab('home');
    clearMessages();
    setStatusBanner('Đã đăng xuất tài khoản. Bạn có thể đăng ký tài khoản mới hoặc đăng nhập lại.');
  }

  async function handleSubmitOrder() {
    clearMessages();
    if (!user || !user.phone) {
      setErrorBanner('Vui lòng đăng ký hoặc đăng nhập trước khi đặt đơn.');
      return;
    }
    if (!dropoffAddress.trim()) {
      setErrorBanner('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    setStatusBanner('Đang gửi đơn hàng lên hệ thống...');

    try {
      const orderRecord = {
        id: buildOrderId(),
        service: selectedServiceObj ? selectedServiceObj.title : 'Đặt đồ ăn',
        serviceId: selectedServiceObj ? selectedServiceObj.id : 'dat-do-an',
        customerName: user.name || 'Khách hàng',
        customerPhone: user.phone,
        pickupAddress: pickupAddress.trim() || gpsAddress || 'Điểm mua gần nhất',
        dropoffAddress: dropoffAddress.trim(),
        distanceKm: fareCalc.km,
        advanceAmount: fareCalc.advanceAmount,
        discountRate: fareCalc.discountRate,
        paymentMethod,
        note: orderNote.trim() || 'Giao nhanh trong ngày',
        total: fareCalc.totalPayable,
        status: 'Đã tiếp nhận',
        createdAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderRecord),
      });
      const data = await res.json();

      if (res.ok && data && data.ok) {
        const nextOrders = [orderRecord, ...orders].slice(0, 50);
        setOrders(nextOrders);
        writeStorage(ORDERS_CACHE_KEY, nextOrders);
        setDropoffAddress('');
        setOrderNote('');
        setAdvanceAmount('0');
        setActiveTab('history');
        setStatusBanner(
          `Đặt đơn #${orderRecord.id} thành công • Tổng cước/thanh toán: ${formatVnd(orderRecord.total)}`
        );
      } else {
        setErrorBanner((data && data.error) || 'Không thể tạo đơn hàng lúc này.');
      }
    } catch (e) {
      setErrorBanner('Lỗi mạng khi gửi đơn hàng tới Worker.');
    } finally {
      setLoading(false);
    }
  }

  function handleWalletTopup() {
    clearMessages();
    const amt = Math.max(1000, Number(String(topupAmount || '').replace(/\D/g, '')) || 0);
    if (!amt) {
      setErrorBanner('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    const nextWallet = {
      balance: (Number(wallet.balance) || 0) + amt,
      transactions: [
        {
          id: `TX${String(Date.now()).slice(-6)}`,
          type: 'Nạp tiền',
          amount: amt,
          note: bankNote.trim() || 'Nạp số dư ví ứng dụng',
          time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        },
        ...(wallet.transactions || []),
      ].slice(0, 30),
    };
    setWallet(nextWallet);
    writeStorage(WALLET_CACHE_KEY, nextWallet);
    setBankNote('');
    setStatusBanner(`Đã ghi nhận nạp ${formatVnd(amt)} vào số dư hiển thị trên thiết bị.`);
  }

  function updatePreference(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    writeStorage(PROFILE_PREFS_KEY, next);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* HEADER */}
        <View style={styles.headerBox}>
          <View style={styles.headerTopRow}>
            <View style={styles.flex1}>
              <Text style={styles.brandTitle}>
                {config.appLogo || '🥷'} {config.appName || 'NINJA SHIP'}
              </Text>
              <Text style={styles.bannerTitle}>
                {config.promoBannerTitle || 'Giao nhanh 15 phút • 5.000đ/km'}
              </Text>
              <Text style={styles.bannerSub}>
                {config.promoBannerSub ||
                  'Tài xế Ninja ứng trước tiền hàng & giao tận tay điểm mua nhất.'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => {
                fetchRemoteConfig();
                fetchRemoteDrivers();
                if (user) refreshDeviceGps(user);
              }}
            >
              <Text style={styles.refreshBtnText}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsStrip}>
            <Text style={styles.statBadge}>Giá: {formatVnd(config.ratePerKm)}/km</Text>
            <Text style={styles.statBadge}>Tài xế: {drivers.length}</Text>
            <Text style={styles.statBadge}>Đơn đã lưu: {orders.length}</Text>
            <Text style={styles.statBadge}>{gpsSyncing ? 'GPS: Đang đồng bộ...' : gpsAddress}</Text>
          </View>
        </View>

        {/* BANNERS THÔNG BÁO / LỖI */}
        {!!errorBanner && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorBanner}</Text>
          </View>
        )}
        {!!statusBanner && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{statusBanner}</Text>
          </View>
        )}

        {/* KHU VỰC ĐĂNG KÝ / ĐĂNG NHẬP OTP NẾU CHƯA CÓ PHIÊN */}
        {!user ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Đăng ký tài khoản mới &amp; Xác thực OTP</Text>
            <Text style={styles.muted}>
              Điền thông tin bên dưới, bấm "Gửi mã OTP" để nhận mã xác thực 6 số và bấm "Xác nhận OTP &amp; Đăng ký tài khoản".
            </Text>

            <View style={styles.modeSwitchRow}>
              <TouchableOpacity
                style={[styles.modeBtn, authMode === 'register' && styles.modeBtnActive]}
                onPress={() => {
                  setAuthMode('register');
                  clearMessages();
                }}
              >
                <Text
                  style={[styles.modeBtnText, authMode === 'register' && styles.modeBtnTextActive]}
                >
                  Đăng ký tài khoản mới
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, authMode === 'login' && styles.modeBtnActive]}
                onPress={() => {
                  setAuthMode('login');
                  clearMessages();
                }}
              >
                <Text
                  style={[styles.modeBtnText, authMode === 'login' && styles.modeBtnTextActive]}
                >
                  Đăng nhập SĐT / OTP
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên (VD: Trần Minh Tuấn)"
              placeholderTextColor="#64748b"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại (VD: 0912345678)"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={phoneInput}
              onChangeText={(v) => {
                setPhoneInput(v);
                if (otpVerified) setOtpVerified(false);
              }}
            />

            <Text style={styles.fieldLabel}>Mã OTP xác thực</Text>
            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Nhập mã OTP 6 số"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={(v) => {
                  setOtpCode(v);
                  if (otpVerified) setOtpVerified(false);
                }}
              />
              <TouchableOpacity
                style={[styles.secondaryBtn, countdown > 0 && styles.disabledBtn]}
                onPress={handleRequestOtp}
                disabled={loading || countdown > 0}
              >
                <Text style={styles.secondaryBtnText}>
                  {countdown > 0 ? `Gửi lại (${countdown}s)` : otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inlineRow}>
              <TouchableOpacity
                style={[styles.outlineBtn, styles.flex1]}
                onPress={handleVerifyOtpCode}
                disabled={loading}
              >
                <Text style={styles.outlineBtnText}>
                  {otpVerified ? 'Đã xác nhận mã OTP' : 'Xác nhận mã OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineBtn, styles.flex1]}
                onPress={handleDirectPhoneLogin}
                disabled={loading}
              >
                <Text style={styles.outlineBtnText}>Đăng nhập nhanh SĐT</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleConfirmOtpAndSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#052e16" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {authMode === 'register'
                    ? 'Xác nhận OTP & Đăng ký tài khoản'
                    : 'Xác nhận OTP & Đăng nhập'}
                </Text>
              )}
            </TouchableOpacity>

            {/* BẢNG GIÁ THAM KHẢO NGAY TRÊN MÀN HÌNH ĐĂNG KÝ */}
            <View style={styles.subCard}>
              <Text style={styles.subCardTitle}>Bảng cước tham khảo ({formatVnd(config.ratePerKm)}/km)</Text>
              {pricingTiers.slice(0, 4).map((tier) => (
                <View key={tier.km} style={styles.tierRow}>
                  <Text style={styles.muted}>
                    {tier.km} Km ({tier.note})
                  </Text>
                  <Text style={styles.boldLight}>{formatVnd(tier.estimatedFee)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            {/* THANH ĐIỀU HƯỚNG KHI ĐÃ ĐĂNG NHẬP / ĐĂNG KÝ */}
            <View style={styles.navBar}>
              {[
                { id: 'home', label: 'Trang chủ' },
                { id: 'order', label: 'Đặt đơn' },
                { id: 'drivers', label: 'Tài xế' },
                { id: 'history', label: 'Đơn hàng' },
                { id: 'account', label: 'Tài khoản' },
              ].map((t) => {
                const isAct = activeTab === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.navTab, isAct && styles.navTabActive]}
                    onPress={() => setActiveTab(t.id)}
                  >
                    <Text style={[styles.navTabText, isAct && styles.navTabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TAB 1: TRANG CHỦ */}
            {activeTab === 'home' && (
              <View style={styles.card}>
                <View style={styles.userHeaderRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.sectionTitle}>Xin chào, {user.name}</Text>
                    <Text style={styles.muted}>
                      SĐT: {user.phone} • {gpsAddress}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => refreshDeviceGps(user)}>
                    <Text style={styles.smallBtnText}>Cập nhật GPS</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Danh mục dịch vụ</Text>
                <View style={styles.gridWrap}>
                  {activeServices.map((srv) => {
                    const isSelected = selectedServiceId === srv.id;
                    return (
                      <TouchableOpacity
                        key={srv.id}
                        style={[styles.serviceTile, isSelected && styles.serviceTileActive]}
                        onPress={() => {
                          setSelectedServiceId(srv.id);
                          setActiveTab('order');
                        }}
                      >
                        <Text style={styles.serviceIcon}>{srv.icon || '🛵'}</Text>
                        <Text style={styles.serviceTitle} numberOfLines={1}>
                          {srv.title}
                        </Text>
                        {!!srv.badge && <Text style={styles.serviceBadge}>{srv.badge}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.subCard}>
                  <Text style={styles.subCardTitle}>Tài xế gần đây ({filteredDrivers.length})</Text>
                  {filteredDrivers.length === 0 ? (
                    <Text style={styles.muted}>Chưa có tài xế nào trực tuyến trên hệ thống.</Text>
                  ) : (
                    filteredDrivers.slice(0, 3).map((drv, idx) => (
                      <View key={`${drv.phone || idx}`} style={styles.listRow}>
                        <View style={styles.flex1}>
                          <Text style={styles.boldLight}>
                            {idx + 1}. {drv.name || 'Tài xế Ninja'} ({drv.phone || ''})
                          </Text>
                          <Text style={styles.muted}>
                            {drv.address || `${drv.lat || ''}, ${drv.lng || ''}`}
                            {drv._distKm !== null ? ` • Cách ~${drv._distKm} km` : ''}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* TAB 2: ĐẶT ĐƠN */}
            {activeTab === 'order' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Đặt đơn: {selectedServiceObj ? `${selectedServiceObj.icon} ${selectedServiceObj.title}` : 'Giao nhanh'}
                </Text>
                <Text style={styles.muted}>
                  {selectedServiceObj && selectedServiceObj.description}
                </Text>

                <Text style={styles.fieldLabel}>Chọn loại dịch vụ</Text>
                <View style={styles.chipsRow}>
                  {activeServices.map((srv) => {
                    const active = srv.id === selectedServiceId;
                    return (
                      <TouchableOpacity
                        key={srv.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setSelectedServiceId(srv.id)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {srv.icon} {srv.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Điểm lấy hàng / điểm mua</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa chỉ lấy hàng hoặc để trống nếu lấy theo GPS"
                  placeholderTextColor="#64748b"
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                />

                <Text style={styles.fieldLabel}>Địa chỉ giao hàng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa chỉ giao tới"
                  placeholderTextColor="#64748b"
                  value={dropoffAddress}
                  onChangeText={setDropoffAddress}
                />

                <View style={styles.inlineRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.fieldLabel}>Quãng đường (Km)</Text>
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
                    <Text style={styles.fieldLabel}>Tiền ứng trước (VNĐ)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={advanceAmount}
                      onChangeText={setAdvanceAmount}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Ghi chú cho tài xế</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Ít đá, gọi trước khi giao..."
                  placeholderTextColor="#64748b"
                  value={orderNote}
                  onChangeText={setOrderNote}
                />

                <View style={styles.subCard}>
                  <View style={styles.tierRow}>
                    <Text style={styles.muted}>Phí giao ({fareCalc.km} km × {formatVnd(fareCalc.ratePerKm)}):</Text>
                    <Text style={styles.boldLight}>{formatVnd(fareCalc.rawShippingFee)}</Text>
                  </View>
                  {fareCalc.discountAmount > 0 && (
                    <View style={styles.tierRow}>
                      <Text style={styles.successText}>
                        Ưu đãi ({Math.round(fareCalc.discountRate * 100)}%):
                      </Text>
                      <Text style={styles.successText}>-{formatVnd(fareCalc.discountAmount)}</Text>
                    </View>
                  )}
                  {fareCalc.advanceAmount > 0 && (
                    <View style={styles.tierRow}>
                      <Text style={styles.muted}>Tiền hàng ứng trước:</Text>
                      <Text style={styles.boldLight}>{formatVnd(fareCalc.advanceAmount)}</Text>
                    </View>
                  )}
                  <View style={[styles.tierRow, styles.totalDivider]}>
                    <Text style={styles.boldLight}>Tổng thanh toán dự kiến:</Text>
                    <Text style={styles.totalHighlight}>{formatVnd(fareCalc.totalPayable)}</Text>
                  </View>
                </View>

                <View style={styles.inlineRow}>
                  <TouchableOpacity
                    style={[styles.outlineBtn, styles.flex1]}
                    onPress={() => setShowFareModal(true)}
                  >
                    <Text style={styles.outlineBtnText}>Xem bảng cước Km</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, styles.flex1, styles.noTopMargin, loading && styles.disabledBtn]}
                    onPress={handleSubmitOrder}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#052e16" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Gửi đơn hàng</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 3: TÀI XẾ */}
            {activeTab === 'drivers' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Danh sách tài xế ({filteredDrivers.length})</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tìm theo tên tài xế, SĐT hoặc khu vực..."
                  placeholderTextColor="#64748b"
                  value={driverSearch}
                  onChangeText={setDriverSearch}
                />

                {filteredDrivers.length === 0 ? (
                  <Text style={[styles.muted, styles.mt12]}>
                    Hiện chưa có tài xế nào trên hệ thống. Bấm "Làm mới" để tải lại.
                  </Text>
                ) : (
                  filteredDrivers.map((drv, i) => {
                    const isPicked = selectedDriver && selectedDriver.phone === drv.phone;
                    return (
                      <TouchableOpacity
                        key={`${drv.phone || i}`}
                        style={[styles.driverCard, isPicked && styles.driverCardSelected]}
                        onPress={() => setSelectedDriver(drv)}
                      >
                        <Text style={styles.boldLight}>
                          {i + 1}. {drv.name || 'Tài xế Ninja'} • {drv.phone || 'Chưa có SĐT'}
                        </Text>
                        <Text style={styles.muted}>
                          Vị trí: {drv.address || `${drv.lat || ''}, ${drv.lng || ''}`}
                        </Text>
                        <Text style={styles.muted}>
                          Cập nhật: {drv.updatedAt || 'Vừa xong'}
                          {drv._distKm !== null ? ` • Khoảng cách: ~${drv._distKm} km` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 4: ĐƠN HÀNG ĐÃ ĐẶT */}
            {activeTab === 'history' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Đơn hàng của bạn ({orders.length})</Text>
                {orders.length === 0 ? (
                  <Text style={styles.muted}>Bạn chưa tạo đơn hàng nào trên thiết bị này.</Text>
                ) : (
                  orders.map((ord, idx) => (
                    <View key={`${ord.id || idx}`} style={styles.orderCard}>
                      <View style={styles.tierRow}>
                        <Text style={styles.boldLight}>
                          #{ord.id} • {ord.service}
                        </Text>
                        <Text style={styles.statusPill}>{ord.status || 'Đã tiếp nhận'}</Text>
                      </View>
                      <Text style={styles.muted}>Giao tới: {ord.dropoffAddress}</Text>
                      <Text style={styles.muted}>
                        Ghi chú: {ord.note || 'Không có'} • {ord.createdAt || ''}
                      </Text>
                      <Text style={styles.totalHighlight}>{formatVnd(ord.total)}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 5: TÀI KHOẢN & CÀI ĐẶT */}
            {activeTab === 'account' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
                <Text style={styles.muted}>Họ tên: {user.name}</Text>
                <Text style={styles.muted}>Số điện thoại: {user.phone}</Text>
                <Text style={styles.muted}>Vai trò: {user.role || 'customer'}</Text>
                <Text style={styles.muted}>Vị trí hiện tại: {gpsAddress}</Text>

                <View style={styles.subCard}>
                  <Text style={styles.subCardTitle}>Số dư &amp; nạp tiền nhanh</Text>
                  <Text style={styles.totalHighlight}>Số dư hiện tại: {formatVnd(wallet.balance)}</Text>
                  <TextInput
                    style={[styles.input, styles.mt8]}
                    placeholder="Số tiền nạp (VD: 100000)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={topupAmount}
                    onChangeText={setTopupAmount}
                  />
                  <TextInput
                    style={[styles.input, styles.mt8]}
                    placeholder="Nội dung ghi chú"
                    placeholderTextColor="#64748b"
                    value={bankNote}
                    onChangeText={setBankNote}
                  />
                  <TouchableOpacity style={styles.secondaryBtn} onPress={handleWalletTopup}>
                    <Text style={styles.secondaryBtnText}>Cập nhật số dư</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.subCard}>
                  <Text style={styles.subCardTitle}>Tùy chọn ứng dụng</Text>
                  <View style={styles.switchRow}>
                    <Text style={styles.boldLight}>Tự động cập nhật vị trí GPS</Text>
                    <Switch
                      value={Boolean(prefs.autoGps)}
                      onValueChange={(v) => updatePreference('autoGps', v)}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.boldLight}>Bật thông báo âm thanh/nhắc nhở</Text>
                    <Switch
                      value={Boolean(prefs.soundAlert)}
                      onValueChange={(v) => updatePreference('soundAlert', v)}
                    />
                  </View>
                </View>

                <View style={styles.subCard}>
                  <Text style={styles.subCardTitle}>Hướng dẫn &amp; câu hỏi thường gặp</Text>
                  {faqList.map((item, idx) => (
                    <View key={idx} style={styles.faqItem}>
                      <Text style={styles.boldLight}>
                        {idx + 1}. {item.q}
                      </Text>
                      <Text style={styles.muted}>{item.a}</Text>
                    </View>
                  ))}
                  {!!serviceGuideList.length && (
                    <Text style={[styles.muted, styles.mt8]}>
                      Tổng số dịch vụ cấu hình: {serviceGuideList.length} mục.
                    </Text>
                  )}
                </View>

                {otpLogs.length > 0 && (
                  <View style={styles.subCard}>
                    <Text style={styles.subCardTitle}>Nhật ký xác thực OTP gần nhất</Text>
                    {otpLogs.slice(0, 5).map((log, i) => (
                      <Text key={i} style={styles.muted}>
                        [{log.timestamp}] {log.mode} • {log.maskedPhone} •{' '}
                        {log.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                      </Text>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.dangerBtn} onPress={handleSignOut}>
                  <Text style={styles.dangerBtnText}>Đăng xuất / Đổi tài khoản</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* MODAL BẢNG CƯỚC KM */}
      <Modal
        visible={showFareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFareModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.sectionTitle}>Bảng cước theo quãng đường Km</Text>
            <Text style={styles.muted}>
              Đơn giá hiện tại: {formatVnd(config.ratePerKm)}/km
            </Text>
            <ScrollView style={styles.modalScroll}>
              {pricingTiers.map((row) => (
                <View key={row.km} style={styles.tierRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.boldLight}>{row.km} Km</Text>
                    <Text style={styles.muted}>{row.note}</Text>
                  </View>
                  <Text style={styles.totalHighlight}>{formatVnd(row.estimatedFee)}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowFareModal(false)}
            >
              <Text style={styles.primaryBtnText}>Đóng bảng cước</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 36,
  },
  flex1: {
    flex: 1,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
  noTopMargin: {
    marginTop: 0,
  },
  headerBox: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  brandTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  bannerTitle: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  bannerSub: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  statsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statBadge: {
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorBox: {
    backgroundColor: '#450a0a',
    borderColor: '#f87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#052e16',
    borderColor: '#4ade80',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  subCard: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  subCardTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  muted: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  boldLight: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 5,
  },
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
  modeSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  modeBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  primaryBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryBtnText: {
    color: '#052e16',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryBtnText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  outlineBtn: {
    backgroundColor: '#0f172a',
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#7dd3fc',
    fontSize: 13,
    fontWeight: '700',
  },
  smallBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  dangerBtn: {
    backgroundColor: '#7f1d1d',
    borderColor: '#f87171',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  dangerBtnText: {
    color: '#fecaca',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.55,
  },
  navBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  navTab: {
    flex: 1,
    minWidth: 64,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  navTabActive: {
    backgroundColor: '#22c55e',
    borderColor: '#4ade80',
  },
  navTabText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  navTabTextActive: {
    color: '#052e16',
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  serviceTile: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  serviceTileActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#082f49',
  },
  serviceIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  serviceTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  serviceBadge: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#0f172a',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 8,
  },
  totalDivider: {
    borderTopColor: '#334155',
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 10,
  },
  totalHighlight: {
    color: '#4ade80',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  listRow: {
    paddingVertical: 8,
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
  },
  driverCard: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  driverCardSelected: {
    borderColor: '#22c55e',
  },
  orderCard: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  statusPill: {
    backgroundColor: '#065f46',
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  faqItem: {
    paddingVertical: 8,
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalScroll: {
    marginTop: 10,
    maxHeight: 320,
  },
});
