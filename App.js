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
  // Khu vực Đồng Hới (3 phường mới)
  {
    name: 'Phường Đồng Hới',
    area: 'Đồng Hới',
    lat: 17.4689,
    lng: 106.6223,
    subUnits: 'Đức Ninh Đông, Đồng Hải, Đồng Phú, Phú Hải, Hải Thành, Nam Lý, Bảo Ninh, Đức Ninh',
  },
  {
    name: 'Phường Đồng Thuận',
    area: 'Đồng Hới',
    lat: 17.5032,
    lng: 106.5985,
    subUnits: 'Bắc Lý, Lộc Ninh, Quang Phú',
  },
  {
    name: 'Phường Đồng Sơn',
    area: 'Đồng Hới',
    lat: 17.4520,
    lng: 106.5780,
    subUnits: 'Bắc Nghĩa, Đồng Sơn, Nghĩa Ninh, Thuận Đức',
  },

  // Khu vực Bố Trạch (7 xã mới)
  {
    name: 'Xã Nam Trạch',
    area: 'Bố Trạch',
    lat: 17.5350,
    lng: 106.5450,
    subUnits: 'TT NT Việt Trung, Nhân Trạch, Lý Nam',
  },
  {
    name: 'Xã Hoàn Lão',
    area: 'Bố Trạch',
    lat: 17.5765,
    lng: 106.5280,
    subUnits: 'TT Hoàn Lão, Trung Trạch, Đại Trạch, Tây Trạch, Hòa Trạch',
  },
  {
    name: 'Xã Đông Trạch',
    area: 'Bố Trạch',
    lat: 17.6120,
    lng: 106.5050,
    subUnits: 'Hải Phú, Sơn Lộc, Đức Trạch, Đồng Trạch',
  },
  {
    name: 'Xã Bắc Trạch',
    area: 'Bố Trạch',
    lat: 17.6520,
    lng: 106.4720,
    subUnits: 'Thanh Trạch, Hạ Mỹ, Liên Trạch, Bắc Trạch',
  },
  {
    name: 'Xã Bố Trạch',
    area: 'Bố Trạch',
    lat: 17.5850,
    lng: 106.4350,
    subUnits: 'Hưng Trạch, Cự Nẫm, Vạn Trạch, Phú Định',
  },
  {
    name: 'Xã Phong Nha',
    area: 'Bố Trạch',
    lat: 17.5910,
    lng: 106.2880,
    subUnits: 'TT Phong Nha, Lâm Trạch, Xuân Trạch, Phúc Trạch',
  },
  {
    name: 'Xã Thượng Trạch',
    area: 'Bố Trạch',
    lat: 17.4250,
    lng: 106.1950,
    subUnits: 'Tân Trạch, Thượng Trạch',
  },

  // Khu vực Ba Đồn (2 phường, 2 xã mới)
  {
    name: 'Phường Ba Đồn',
    area: 'Ba Đồn',
    lat: 17.7524,
    lng: 106.4182,
    subUnits: 'Quảng Phong, Quảng Long, Ba Đồn, Quảng Hải',
  },
  {
    name: 'Phường Bắc Gianh',
    area: 'Ba Đồn',
    lat: 17.7431,
    lng: 106.4418,
    subUnits: 'Quảng Phúc, Quảng Thọ, Quảng Thuận',
  },
  {
    name: 'Xã Nam Gianh',
    area: 'Ba Đồn',
    lat: 17.7245,
    lng: 106.3910,
    subUnits: 'Quảng Hòa, Quảng Lộc, Quảng Văn, Quảng Minh',
  },
  {
    name: 'Xã Nam Ba Đồn',
    area: 'Ba Đồn',
    lat: 17.7050,
    lng: 106.3750,
    subUnits: 'Quảng Tân, Quảng Trung, Quảng Tiên, Quảng Sơn, Quảng Thủy',
  },

  // Khu vực Quảng Trạch (5 xã mới)
  {
    name: 'Xã Quảng Trạch',
    area: 'Quảng Trạch',
    lat: 17.7850,
    lng: 106.4120,
    subUnits: 'Quảng Phương, Quảng Xuân, Quảng Hưng',
  },
  {
    name: 'Xã Hòa Trạch',
    area: 'Quảng Trạch',
    lat: 17.8540,
    lng: 106.4620,
    subUnits: 'Quảng Châu, Quảng Tùng, Cảnh Dương',
  },
  {
    name: 'Xã Phú Trạch',
    area: 'Quảng Trạch',
    lat: 17.9120,
    lng: 106.4750,
    subUnits: 'Quảng Đông, Quảng Phú, Quảng Kim, Quảng Hợp',
  },
  {
    name: 'Xã Trung Thuần',
    area: 'Quảng Trạch',
    lat: 17.8120,
    lng: 106.3650,
    subUnits: 'Quảng Lưu, Quảng Thạch, Quảng Tiến',
  },
  {
    name: 'Xã Tân Gianh',
    area: 'Quảng Trạch',
    lat: 17.7720,
    lng: 106.3520,
    subUnits: 'Phù Cảnh, Liên Trường, Quảng Thanh',
  },

  // Khu vực Tuyên Hóa (6 xã mới)
  {
    name: 'Xã Tuyên Hóa',
    area: 'Tuyên Hóa',
    lat: 17.7950,
    lng: 106.2650,
    subUnits: 'Tiến Hóa, Châu Hóa, Cao Quảng, Văn Hóa',
  },
  {
    name: 'Xã Tuyên Bình',
    area: 'Tuyên Hóa',
    lat: 17.8250,
    lng: 106.2150,
    subUnits: 'Phong Hóa, Ngư Hóa, Mai Hóa',
  },
  {
    name: 'Xã Tuyên Phú',
    area: 'Tuyên Hóa',
    lat: 17.8650,
    lng: 106.1450,
    subUnits: 'Đồng Hóa, Thạch Hóa, Đức Hóa',
  },
  {
    name: 'Xã Đồng Lê',
    area: 'Tuyên Hóa',
    lat: 17.9050,
    lng: 106.0350,
    subUnits: 'TT Đồng Lê, Kim Hóa, Lê Hóa, Thuận Hóa, Sơn Hóa',
  },
  {
    name: 'Xã Tuyên Sơn',
    area: 'Tuyên Hóa',
    lat: 17.9550,
    lng: 105.9850,
    subUnits: 'Thanh Thạch, Hương Hóa',
  },
  {
    name: 'Xã Tuyên Lâm',
    area: 'Tuyên Hóa',
    lat: 18.0150,
    lng: 105.9150,
    subUnits: 'Lâm Hóa, Thanh Hóa',
  },

  // Khu vực Minh Hóa (5 xã mới)
  {
    name: 'Xã Minh Hóa',
    area: 'Minh Hóa',
    lat: 17.7850,
    lng: 105.9750,
    subUnits: 'TT Quy Đạt, Xuân Hóa, Yên Hóa, Hồng Hóa',
  },
  {
    name: 'Xã Kim Phú',
    area: 'Minh Hóa',
    lat: 17.7350,
    lng: 106.0350,
    subUnits: 'Thượng Hóa, Trung Hóa, Minh Hóa, Tân Hóa',
  },
  {
    name: 'Xã Kim Điền',
    area: 'Minh Hóa',
    lat: 17.8450,
    lng: 105.9150,
    subUnits: 'Hóa Sơn, Hóa Hợp',
  },
  {
    name: 'Xã Dân Hóa',
    area: 'Minh Hóa',
    lat: 17.7650,
    lng: 105.7850,
    subUnits: 'Trọng Hóa, Dân Hóa',
  },
  {
    name: 'Xã Tân Thành',
    area: 'Minh Hóa',
    lat: 17.7450,
    lng: 105.8950,
    subUnits: 'Giữ nguyên theo NQ 1680/NQ-UBTVQH15',
  },
];

// =========================================================================
// HỆ THỐNG BẢNG GIÁ & PHỤ PHÍ TẬP TRUNG (SINGLE SOURCE OF TRUTH - NINJA SHIP)
// =========================================================================
const PRICING_TABLE = Object.freeze({
  // 1. ĐẶT ĐỒ ĂN (theo km)
  food: {
    baseMaxKm: 2,
    basePrice: 12000,
    extraPerKm: 5000,
  },
  // 2. MUA HỘ (phí mua hộ theo giá trị đơn hàng + phí vận chuyển riêng)
  buyForMe: {
    tiers: [
      { maxOrderValue: 100000, fee: 5000 },
      { maxOrderValue: 300000, fee: 10000 },
      { maxOrderValue: 500000, fee: 15000 },
      { maxOrderValue: 1000000, fee: 20000 },
    ],
    overMaxRate: 0.03, // Trên 1.000.000đ: 3% giá trị đơn
  },
  // 3. NHẬN HỘ (theo km: 0-2km 15k, 3km 20k, ..., 10km 55k, mỗi km tiếp +5k)
  receiveForMe: {
    baseMaxKm: 2,
    basePrice: 15000,
    extraPerKm: 5000,
  },
  // 4. ĐI CHỢ HỘ (phí dịch vụ theo giá trị giỏ hàng + phí vận chuyển riêng)
  grocery: {
    tiers: [
      { maxOrderValue: 200000, fee: 10000 },
      { maxOrderValue: 500000, fee: 15000 },
      { maxOrderValue: 1000000, fee: 20000 },
      { maxOrderValue: 2000000, fee: 30000 },
    ],
    overMaxRate: 0.03, // Trên 2.000.000đ: 3% giá trị hàng
  },
  // 5. LÀM HỘ (theo thời gian thực hiện - phút)
  taskForMe: {
    tiers: [
      { maxMinutes: 15, fee: 10000, label: 'Dưới 15 phút' },
      { maxMinutes: 30, fee: 15000, label: '15–30 phút' },
      { maxMinutes: 60, fee: 25000, label: '30–60 phút' },
      { maxMinutes: 120, fee: 40000, label: '1–2 giờ' },
    ],
    extraPerHour: 20000, // Mỗi giờ tiếp theo +20.000đ
  },
  // 6. MUA THUỐC (phí mua hộ theo giá trị đơn thuốc + phí vận chuyển riêng)
  medicine: {
    tiers: [
      { maxOrderValue: 100000, fee: 5000 },
      { maxOrderValue: 300000, fee: 10000 },
      { maxOrderValue: 500000, fee: 15000 },
    ],
    overMaxFee: 20000, // Trên 500.000đ: 20.000đ
  },
  // 7. GIAO ĐỒ (0-2km 15k, 3km 20k, ..., 10km 55k, 15km 80k, 20km 105k, mỗi km tiếp +5k)
  delivery: {
    baseMaxKm: 2,
    basePrice: 15000,
    extraPerKm: 5000,
  },
  // 8. PHỤ PHÍ CHUNG
  surcharges: {
    nightStartHour: 22, // 22h
    nightEndHour: 6,    // đến 6h
    nightFee: 10000,
    freeWaitMinutes: 10,
    waitStepMinutes: 5,
    waitStepFee: 3000,
    extraStopFee: 5000,
    bulkyMinFee: 10000,
    bulkyMaxFee: 20000,
    cancelAfterAcceptFee: 10000,
    badWeatherMinFee: 5000,
    badWeatherMaxFee: 10000,
  },
});

function calcTieredDistanceFee(distanceKm, baseMaxKm, basePrice, extraPerKm) {
  if (!distanceKm || distanceKm <= 0) return 0;
  const billedKm = Math.ceil(distanceKm);
  if (billedKm <= baseMaxKm) return basePrice;
  return basePrice + (billedKm - baseMaxKm) * extraPerKm;
}

function isNightTimeNow(dateObj = new Date()) {
  const h = dateObj.getHours();
  return h >= PRICING_TABLE.surcharges.nightStartHour || h < PRICING_TABLE.surcharges.nightEndHour;
}

function calculateNinjaOrderPricing({
  serviceName,
  distanceKm = 0,
  goodsValue = 0,
  taskMinutes = 15,
  discountRate = 0,
  surchargesInput = {},
  now = new Date(),
}) {
  const hasDistance = distanceKm > 0;
  const safeGoodsValue = Math.max(0, Math.round(Number(goodsValue) || 0));
  const safeMinutes = Math.max(1, Math.round(Number(taskMinutes) || 15));

  let shippingFee = 0;
  let serviceFee = 0;
  let serviceFeeLabel = '';
  let shippingLabel = '';

  const standardDeliveryShip = hasDistance
    ? calcTieredDistanceFee(
        distanceKm,
        PRICING_TABLE.delivery.baseMaxKm,
        PRICING_TABLE.delivery.basePrice,
        PRICING_TABLE.delivery.extraPerKm
      )
    : 0;

  switch (serviceName) {
    case 'Đặt đồ ăn': {
      shippingFee = hasDistance
        ? calcTieredDistanceFee(
            distanceKm,
            PRICING_TABLE.food.baseMaxKm,
            PRICING_TABLE.food.basePrice,
            PRICING_TABLE.food.extraPerKm
          )
        : 0;
      shippingLabel = `Phí giao đồ ăn (${distanceKm} km)`;
      break;
    }
    case 'Mua hộ đồ': {
      shippingFee = standardDeliveryShip;
      shippingLabel = `Phí vận chuyển (${distanceKm} km)`;
      if (safeGoodsValue < 100000) {
        serviceFee = 5000;
        serviceFeeLabel = 'Phí mua hộ (đơn dưới 100.000đ)';
      } else if (safeGoodsValue <= 300000) {
        serviceFee = 10000;
        serviceFeeLabel = 'Phí mua hộ (100.000–300.000đ)';
      } else if (safeGoodsValue <= 500000) {
        serviceFee = 15000;
        serviceFeeLabel = 'Phí mua hộ (300.000–500.000đ)';
      } else if (safeGoodsValue <= 1000000) {
        serviceFee = 20000;
        serviceFeeLabel = 'Phí mua hộ (500.000–1.000.000đ)';
      } else {
        serviceFee = Math.round(safeGoodsValue * PRICING_TABLE.buyForMe.overMaxRate);
        serviceFeeLabel = 'Phí mua hộ (3% giá trị đơn > 1tr)';
      }
      break;
    }
    case 'Nhận hộ': {
      shippingFee = hasDistance
        ? calcTieredDistanceFee(
            distanceKm,
            PRICING_TABLE.receiveForMe.baseMaxKm,
            PRICING_TABLE.receiveForMe.basePrice,
            PRICING_TABLE.receiveForMe.extraPerKm
          )
        : 0;
      shippingLabel = `Phí nhận hộ (${distanceKm} km)`;
      break;
    }
    case 'Đi chợ hộ': {
      shippingFee = standardDeliveryShip;
      shippingLabel = `Phí vận chuyển (${distanceKm} km)`;
      if (safeGoodsValue < 200000) {
        serviceFee = 10000;
        serviceFeeLabel = 'Phí đi chợ hộ (giỏ dưới 200.000đ)';
      } else if (safeGoodsValue <= 500000) {
        serviceFee = 15000;
        serviceFeeLabel = 'Phí đi chợ hộ (200.000–500.000đ)';
      } else if (safeGoodsValue <= 1000000) {
        serviceFee = 20000;
        serviceFeeLabel = 'Phí đi chợ hộ (500.000–1.000.000đ)';
      } else if (safeGoodsValue <= 2000000) {
        serviceFee = 30000;
        serviceFeeLabel = 'Phí đi chợ hộ (1.000.000–2.000.000đ)';
      } else {
        serviceFee = Math.round(safeGoodsValue * PRICING_TABLE.grocery.overMaxRate);
        serviceFeeLabel = 'Phí đi chợ hộ (3% giá trị hàng > 2tr)';
      }
      break;
    }
    case 'Làm hộ': {
      // Dịch vụ làm hộ tính theo thời gian thực hiện (không tính trùng phí vận chuyển)
      shippingFee = 0;
      if (safeMinutes < 15) {
        serviceFee = 10000;
        serviceFeeLabel = 'Phí làm hộ (dưới 15 phút)';
      } else if (safeMinutes <= 30) {
        serviceFee = 15000;
        serviceFeeLabel = 'Phí làm hộ (15–30 phút)';
      } else if (safeMinutes <= 60) {
        serviceFee = 25000;
        serviceFeeLabel = 'Phí làm hộ (30–60 phút)';
      } else if (safeMinutes <= 120) {
        serviceFee = 40000;
        serviceFeeLabel = 'Phí làm hộ (1–2 giờ)';
      } else {
        const extraHours = Math.ceil((safeMinutes - 120) / 60);
        serviceFee = 40000 + extraHours * PRICING_TABLE.taskForMe.extraPerHour;
        serviceFeeLabel = `Phí làm hộ (2 giờ + ${extraHours} giờ tiếp)`;
      }
      break;
    }
    case 'Mua thuốc': {
      shippingFee = standardDeliveryShip;
      shippingLabel = `Phí vận chuyển (${distanceKm} km)`;
      if (safeGoodsValue < 100000) {
        serviceFee = 5000;
        serviceFeeLabel = 'Phí mua thuốc (đơn dưới 100.000đ)';
      } else if (safeGoodsValue <= 300000) {
        serviceFee = 10000;
        serviceFeeLabel = 'Phí mua thuốc (100.000–300.000đ)';
      } else if (safeGoodsValue <= 500000) {
        serviceFee = 15000;
        serviceFeeLabel = 'Phí mua thuốc (300.000–500.000đ)';
      } else {
        serviceFee = PRICING_TABLE.medicine.overMaxFee;
        serviceFeeLabel = 'Phí mua thuốc (đơn trên 500.000đ)';
      }
      break;
    }
    case 'Giao đồ Km':
    case 'Siêu tốc Ninja':
    default: {
      shippingFee = standardDeliveryShip;
      shippingLabel = `Phí giao đồ (${distanceKm} km)`;
      break;
    }
  }

  // Phụ phí chung (tự động ban đêm + các tùy chọn phụ phí)
  const isNight =
    typeof surchargesInput.isNight === 'boolean'
      ? surchargesInput.isNight
      : isNightTimeNow(now);
  const nightFee = isNight ? PRICING_TABLE.surcharges.nightFee : 0;

  const waitMinutes = Math.max(0, Math.round(Number(surchargesInput.waitMinutes) || 0));
  const chargeableWait = Math.max(0, waitMinutes - PRICING_TABLE.surcharges.freeWaitMinutes);
  const waitFee =
    chargeableWait > 0
      ? Math.ceil(chargeableWait / PRICING_TABLE.surcharges.waitStepMinutes) *
        PRICING_TABLE.surcharges.waitStepFee
      : 0;

  const extraStops = Math.max(0, Math.round(Number(surchargesInput.extraStops) || 0));
  const extraStopFee = extraStops * PRICING_TABLE.surcharges.extraStopFee;

  const bulkyFee = Math.max(0, Math.round(Number(surchargesInput.bulkyFee) || 0)); // 0 | 10000 | 20000
  const badWeatherFee = Math.max(0, Math.round(Number(surchargesInput.badWeatherFee) || 0)); // 0 | 5000 | 10000

  const surchargeTotal = nightFee + waitFee + extraStopFee + bulkyFee + badWeatherFee;

  // Giảm giá ưu đãi áp dụng trên phí ship (hoặc phí dịch vụ nếu là dịch vụ không có phí ship)
  const discountBase = shippingFee > 0 ? shippingFee : serviceFee;
  const discountAmount = Math.round(discountBase * Math.max(0, discountRate));

  const subtotalDeliveryAndService = Math.max(
    0,
    shippingFee + serviceFee + surchargeTotal - discountAmount
  );
  const totalAmount = subtotalDeliveryAndService + safeGoodsValue;

  return {
    shippingFee,
    shippingLabel,
    serviceFee,
    serviceFeeLabel,
    goodsValue: safeGoodsValue,
    nightFee,
    waitFee,
    extraStopFee,
    bulkyFee,
    badWeatherFee,
    surchargeTotal,
    discountAmount,
    totalAmount,
  };
}

const SERVICE_CONFIGS = {
  'Đặt đồ ăn': {
    type: 'order',
    icon: '🍜',
    promoKey: 'promo_food_25',
    discountRate: 0.25,
    discountLabel: '0–2km: 12.000đ • +5.000đ/km • Giảm 25% (1 lần)',
    mainLabel: 'Tên món ăn & số lượng *',
    mainPlaceholder: 'VD: 2 tô Bún bò + 1 Trà đào cam sả, ít cay',
    pickupLabel: 'Quán ăn / Nhà hàng lấy món',
    detailPlaceholder: 'VD: Quán Bún Bò O Hoa, gần chợ...',
    showAdvance: true,
    advanceLabel: 'Tiền món ăn tài xế ứng trả quán (đ)',
    showDuration: false,
    extraLabel: 'Ghi chú cho quán / tài xế',
    extraPlaceholder: 'VD: Lấy thêm đũa muỗng, gọi khi tới cổng',
    submitText: 'Đặt đồ ăn ngay',
  },
  'Mua hộ đồ': {
    type: 'order',
    icon: '🛍️',
    promoKey: 'promo_buy_20',
    discountRate: 0.20,
    discountLabel: 'Phí mua hộ từ 5.000đ + Phí ship theo Km',
    mainLabel: 'Danh sách đồ cần mua hộ *',
    mainPlaceholder: 'VD: 1 thùng sữa Vinamilk, 1 túi bột giặt OMO 3kg',
    pickupLabel: 'Cửa hàng / Siêu thị / Tạp hóa mua đồ',
    detailPlaceholder: 'VD: Siêu thị WinMart hoặc Tạp hóa Cô Lan...',
    showAdvance: true,
    advanceLabel: 'Giá trị đơn hàng / Tiền ứng trước (đ) *',
    showDuration: false,
    extraLabel: 'Yêu cầu chọn đồ / chụp hóa đơn',
    extraPlaceholder: 'VD: Chụp ảnh bill gửi Zalo trước khi thanh toán',
    submitText: 'Nhờ mua hộ ngay',
  },
  'Nhận hộ': {
    type: 'order',
    icon: '📦',
    promoKey: 'promo_receive_15',
    discountRate: 0.15,
    discountLabel: '0–2km: 15.000đ • +5.000đ/km • Giảm 15% (1 lần)',
    mainLabel: 'Thông tin bưu phẩm / Hàng cần nhận hộ *',
    mainPlaceholder: 'VD: Nhận thùng hàng xe khách / Bưu phẩm Shopee',
    pickupLabel: 'Điểm nhận hàng (Bến xe / Bưu cục / Người gửi)',
    detailPlaceholder: 'VD: Nhà xe Hưng Long hoặc Bưu cục Viettel Post...',
    showAdvance: true,
    advanceLabel: 'Tiền COD / Phí nhà xe cần trả hộ (đ)',
    showDuration: false,
    extraLabel: 'Tên & SĐT người gửi / Mã vận đơn',
    extraPlaceholder: 'VD: Anh Nam - 0912xxx, đọc mã 8842',
    submitText: 'Đặt tài xế nhận hộ',
  },
  'Làm hộ': {
    type: 'order',
    icon: '⚡',
    promoKey: null,
    discountRate: 0,
    discountLabel: 'Tính theo thời gian: <15p 10k • 15–30p 15k • 30–60p 25k',
    mainLabel: 'Nội dung công việc cần làm hộ *',
    mainPlaceholder: 'VD: Xếp hàng nộp hồ sơ / Gửi giấy tờ / Trả đồ giúp',
    pickupLabel: 'Địa điểm thực hiện công việc',
    detailPlaceholder: 'VD: Bộ phận một cửa / Ngân hàng / Nhà người quen...',
    showAdvance: true,
    advanceLabel: 'Chi phí phát sinh cần ứng trước (đ)',
    showDuration: true,
    extraLabel: 'Thời gian hẹn & hướng dẫn chi tiết',
    extraPlaceholder: 'VD: Có mặt trước 9h30 sáng, gặp chị Hương',
    submitText: 'Thuê Ninja làm hộ',
  },
  'Đi chợ hộ': {
    type: 'order',
    icon: '🥬',
    promoKey: null,
    discountRate: 0,
    discountLabel: 'Phí đi chợ từ 10.000đ + Phí ship theo Km',
    mainLabel: 'Danh sách thực phẩm đi chợ *',
    mainPlaceholder: 'VD: 5 lạng thịt ba chỉ, 1 bó rau muống, 1 con cá thu',
    pickupLabel: 'Khu vực chợ / Cửa hàng thực phẩm sạch',
    detailPlaceholder: 'VD: Chợ Ba Đồn, hàng thịt cô Tâm cổng chính...',
    showAdvance: true,
    advanceLabel: 'Giá trị giỏ hàng dự kiến (đ) *',
    showDuration: false,
    extraLabel: 'Cách sơ chế / chọn đồ tươi',
    extraPlaceholder: 'VD: Nhờ người bán làm sạch cá, chọn thịt nhiều nạc',
    submitText: 'Đặt đi chợ hộ ngay',
  },
  'Mua thuốc': {
    type: 'order',
    icon: '💊',
    promoKey: null,
    discountRate: 0,
    discountLabel: 'Phí mua thuốc từ 5.000đ + Phí ship theo Km',
    mainLabel: 'Tên thuốc / Triệu chứng cần dược sĩ tư vấn *',
    mainPlaceholder: 'VD: 1 vỉ Panadol Extra, 1 chai nước muối sinh lý',
    pickupLabel: 'Nhà thuốc / Quầy thuốc tây',
    detailPlaceholder: 'VD: Nhà thuốc Long Châu hoặc Quầy thuốc gần nhất...',
    showAdvance: true,
    advanceLabel: 'Giá trị đơn thuốc ước tính (đ) *',
    showDuration: false,
    extraLabel: 'Đối tượng sử dụng / Lưu ý dị ứng',
    extraPlaceholder: 'VD: Mua cho người lớn, không có tiền sử dị ứng',
    submitText: 'Đặt mua thuốc gấp',
  },
  'Giao đồ Km': {
    type: 'order',
    icon: '🛵',
    promoKey: null,
    discountRate: 0,
    discountLabel: '0–2km: 15.000đ • 3km: 20.000đ • +5.000đ/km',
    mainLabel: 'Tên hàng hóa & kích thước gói hàng *',
    mainPlaceholder: 'VD: 1 túi quần áo + 1 hộp bánh sinh nhật (dễ vỡ)',
    pickupLabel: 'Điểm lấy hàng đi giao',
    detailPlaceholder: 'VD: Số 24 đường Hùng Vương, shop thời trang...',
    showAdvance: false,
    advanceLabel: '',
    showDuration: false,
    extraLabel: 'SĐT người nhận / Lưu ý bảo quản',
    extraPlaceholder: 'VD: Hàng dễ vỡ, treo cẩn thận giúp mình',
    submitText: 'Gọi xe giao hàng ngay',
  },
  'Siêu tốc Ninja': {
    type: 'order',
    icon: '🚀',
    promoKey: null,
    discountRate: 0,
    discountLabel: '0–2km: 15.000đ • +5.000đ/km • Ưu tiên hỏa tốc',
    mainLabel: 'Hàng hóa / Giấy tờ cần giao hỏa tốc *',
    mainPlaceholder: 'VD: Hồ sơ thầu / Chìa khóa nhà / Đồ ăn nóng',
    pickupLabel: 'Điểm xuất phát lấy hàng hỏa tốc',
    detailPlaceholder: 'VD: Số 10 đường Quang Trung...',
    showAdvance: true,
    advanceLabel: 'Tiền ứng trước (nếu có) (đ)',
    showDuration: false,
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
  const orderScrollRef = React.useRef(null);
  const itemInputRef = React.useRef(null);
  const hamletInputRef = React.useRef(null);
  const dropoffInputRef = React.useRef(null);
  const advanceInputRef = React.useRef(null);
  const [formValidationMsg, setFormValidationMsg] = useState('');
  const [missingFieldKey, setMissingFieldKey] = useState(''); // 'item' | 'commune' | 'hamlet' | 'dropoff' | 'advance'


  const [itemNote, setItemNote] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [advanceMoney, setAdvanceMoney] = useState('');
  const [taskDurationMinutes, setTaskDurationMinutes] = useState(15);
  const [extraStopsCount, setExtraStopsCount] = useState(0);
  const [bulkySurcharge, setBulkySurcharge] = useState(0); // 0 | 10000 | 20000
  const [weatherSurcharge, setWeatherSurcharge] = useState(0); // 0 | 5000 | 10000

  const [detectedProvince, setDetectedProvince] = useState('Quảng Trị');
  const [communes, setCommunes] = useState(FALLBACK_COMMUNES);
  const [selectedPickupCommune, setSelectedPickupCommune] = useState(null);
  const [pickupHamlet, setPickupHamlet] = useState(''); // Thôn / Tổ dân phố / Xóm
  const [pickupDetailAddress, setPickupDetailAddress] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('Tất cả');

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

  // Chống kẹt phóng to màn hình trên iPhone Safari khi nhập liệu & tự khôi phục tỷ lệ thu phóng
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    );

    const resetZoom = () => {
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
      if (typeof window !== 'undefined' && window.scrollTo) {
        window.scrollTo(0, 0);
      }
    };
    document.addEventListener('focusout', resetZoom);
    return () => document.removeEventListener('focusout', resetZoom);
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
        const rawProv =
          addr.state || addr.province || addr.city || addr.region || 'Quảng Trị';
        const prov = /quảng bình/i.test(rawProv) ? 'Quảng Trị' : rawProv;
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
        if (!/quảng trị/i.test(prov) && Array.isArray(listData) && listData.length >= 4) {
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
          setDropoffAddress('Phường Ba Đồn, Tỉnh Quảng Trị');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setDropoffAddress('Phường Ba Đồn, Tỉnh Quảng Trị');
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
            <Text style={styles.authBrandSub}>Giao hàng từ 15k • Đặt đồ ăn từ 12k • Mua hộ 24/7</Text>
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
    setFormValidationMsg('');
    setMissingFieldKey('');
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

  const effectiveDiscountRate =
    currentServiceConfig && !isPromoAlreadyUsed ? currentServiceConfig.discountRate : 0;
  const rawAdvanceDigits = currentServiceConfig?.showAdvance
    ? advanceMoney.replace(/\D/g, '')
    : '';
  // Gõ 1 -> 10.000đ, gõ 2 -> 20.000đ ... gõ 9 -> 90.000đ, gõ 15 -> 150.000đ (tự thêm .000đ / nhân 10.000đ)
  const parsedAdvance = rawAdvanceDigits
    ? (parseInt(rawAdvanceDigits, 10) || 0) * 10000
    : 0;

  const handleAdvanceMoneyChange = (text) => {
    const digitsOnly = String(text || '').replace(/\D/g, '').replace(/^0+/, '');
    if (!digitsOnly) {
      setAdvanceMoney('');
      return;
    }
    setAdvanceMoney(digitsOnly);
    if (missingFieldKey === 'advance' && parseInt(digitsOnly, 10) * 10000 >= 10000) {
      setMissingFieldKey('');
      setFormValidationMsg('');
    }
  };

  // Tính giá tập trung qua PRICING_TABLE (không tự cho sửa giá tay)
  const pricing = calculateNinjaOrderPricing({
    serviceName: activeModal || 'Giao đồ Km',
    distanceKm: autoDistanceKm,
    goodsValue: parsedAdvance,
    taskMinutes: taskDurationMinutes,
    discountRate: effectiveDiscountRate,
    surchargesInput: {
      extraStops: extraStopsCount,
      bulkyFee: bulkySurcharge,
      badWeatherFee: weatherSurcharge,
    },
  });

  const discountAmount = pricing.discountAmount;
  const totalAmount = pricing.totalAmount;

  const focusAndRemindField = (fieldKey, message, inputRef, scrollY = 0) => {
    setMissingFieldKey(fieldKey);
    setFormValidationMsg(message);
    if (orderScrollRef.current && orderScrollRef.current.scrollTo) {
      orderScrollRef.current.scrollTo({ y: scrollY, animated: true });
    }
    setTimeout(() => {
      if (inputRef && inputRef.current && inputRef.current.focus) {
        inputRef.current.focus();
      }
    }, 180);
  };

  const handleCreateOrder = () => {
    setFormValidationMsg('');
    setMissingFieldKey('');

    if (!itemNote.trim()) {
      focusAndRemindField(
        'item',
        `⚠️ Bạn chưa nhập "${currentServiceConfig.mainLabel.replace(' *', '')}". Vui lòng nhập vào ô bên dưới!`,
        itemInputRef,
        0
      );
      return;
    }
    if (!selectedPickupCommune) {
      focusAndRemindField(
        'commune',
        '⚠️ Bạn chưa chọn Xã / Phường điểm lấy hàng. Vui lòng chọn ở mục bên dưới!',
        null,
        70
      );
      return;
    }
    if (!pickupHamlet.trim()) {
      focusAndRemindField(
        'hamlet',
        `⚠️ Bạn chưa nhập Thôn / Tổ dân phố tại ${selectedPickupCommune.name}. Vui lòng tự nhập vào ô bên dưới!`,
        hamletInputRef,
        150
      );
      return;
    }
    if (!dropoffAddress.trim() || dropoffAddress.startsWith('Đang định vị')) {
      focusAndRemindField(
        'dropoff',
        '⚠️ Chưa có địa chỉ điểm giao cho bạn. Vui lòng nhập địa chỉ hoặc bấm Cập nhật GPS!',
        dropoffInputRef,
        240
      );
      return;
    }
    if (currentServiceConfig.showAdvance) {
      const isAdvanceRequired = currentServiceConfig.advanceLabel.includes('*');
      if ((isAdvanceRequired && parsedAdvance < 10000) || (parsedAdvance > 0 && parsedAdvance < 10000)) {
        focusAndRemindField(
          'advance',
          '⚠️ Tiền ứng trước / giá trị hàng phải từ 10.000đ trở lên (VD: gõ 1 → 10.000đ, gõ 5 → 50.000đ). Vui lòng nhập lại!',
          advanceInputRef,
          320
        );
        return;
      }
    }

    // Tính lại giá chính xác tại thời điểm tạo đơn để chống can thiệp dữ liệu
    const verifiedPricing = calculateNinjaOrderPricing({
      serviceName: activeModal || 'Giao đồ Km',
      distanceKm: autoDistanceKm,
      goodsValue: parsedAdvance,
      taskMinutes: taskDurationMinutes,
      discountRate: effectiveDiscountRate,
      surchargesInput: {
        extraStops: extraStopsCount,
        bulkyFee: bulkySurcharge,
        badWeatherFee: weatherSurcharge,
      },
    });

    // Nếu đơn này có áp dụng ưu đãi 1 lần -> Khóa vĩnh viễn ưu đãi đó cho SĐT + Thiết bị
    if (promoKey && verifiedPricing.discountAmount > 0) {
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

    const fullPickup = [
      pickupDetailAddress.trim(),
      pickupHamlet.trim(),
      selectedPickupCommune.name,
      detectedProvince,
    ]
      .filter(Boolean)
      .join(', ');

    const feeTags = [
      verifiedPricing.shippingFee > 0 ? `Ship: ${verifiedPricing.shippingFee.toLocaleString('vi-VN')}đ` : null,
      verifiedPricing.serviceFee > 0 ? `Phí DV: ${verifiedPricing.serviceFee.toLocaleString('vi-VN')}đ` : null,
      verifiedPricing.goodsValue > 0 ? `Tiền hàng: ${verifiedPricing.goodsValue.toLocaleString('vi-VN')}đ` : null,
      verifiedPricing.surchargeTotal > 0 ? `Phụ phí: ${verifiedPricing.surchargeTotal.toLocaleString('vi-VN')}đ` : null,
      verifiedPricing.discountAmount > 0 ? `Giảm: -${verifiedPricing.discountAmount.toLocaleString('vi-VN')}đ` : null,
    ].filter(Boolean).join(' • ');

    const noteSummary = extraNote.trim()
      ? `${itemNote.trim()} • Ghi chú: ${extraNote.trim()} (Từ: ${fullPickup} • ${autoDistanceKm} km | ${feeTags})`
      : `${itemNote.trim()} (Từ: ${fullPickup} • ${autoDistanceKm} km | ${feeTags})`;

    const newOrder = {
      id: `NS-${Math.floor(1000 + Math.random() * 9000)}`,
      service: activeModal || 'Ninja Ship',
      note: noteSummary,
      total: verifiedPricing.totalAmount,
      pricingBreakdown: verifiedPricing,
      distanceKm: autoDistanceKm,
      pickupCoords: { lat: selectedPickupCommune.lat, lng: selectedPickupCommune.lng },
      dropoffCoords,
      status: 'Đang tìm tài xế Ninja',
      time: 'Vừa xong',
    };
    setOrders([newOrder, ...orders]);
    postToBackend('/api/orders', {
      ...newOrder,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      dropoffAddress,
      pricingVersion: 'v2-tiered-2026',
    }).then((r) => {
      if (r.ok) {
        // Nếu server trả về tổng tiền đã xác thực từ backend thì đồng bộ luôn
        if (r.data && typeof r.data.verifiedTotal === 'number') {
          setOrders((prev) =>
            prev.map((o) => (o.id === newOrder.id ? { ...o, total: r.data.verifiedTotal } : o))
          );
        }
        setAdminSyncNote(`Đã đẩy đơn ${newOrder.id} (${verifiedPricing.totalAmount.toLocaleString('vi-VN')}đ) về Admin & Tài xế.`);
      } else if (r.reason === 'missing_url') {
        setAdminSyncNote(`Đơn ${newOrder.id} mới lưu trên máy vì chưa điền BACKEND_API_URL.`);
      } else {
        setAdminSyncNote(`Đơn ${newOrder.id} gửi về Admin bị lỗi (${r.status || r.reason}).`);
      }
    });
    setActiveModal(null);
    setItemNote('');
    setExtraNote('');
    setPickupHamlet('');
    setAdvanceMoney('');
    setTaskDurationMinutes(15);
    setExtraStopsCount(0);
    setBulkySurcharge(0);
    setWeatherSurcharge(0);
    setActiveTab('orders');
    Alert.alert(
      'Đặt đơn thành công',
      `Mã đơn ${newOrder.id} • Tổng thanh toán: ${verifiedPricing.totalAmount.toLocaleString('vi-VN')}đ đã gửi tới tài xế gần nhất!`
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
  const previewFoodCost = calculateNinjaOrderPricing({
    serviceName: 'Đặt đồ ăn',
    distanceKm: previewKm,
    surchargesInput: { isNight: false },
  }).shippingFee;
  const previewDeliveryCost = calculateNinjaOrderPricing({
    serviceName: 'Giao đồ Km',
    distanceKm: previewKm,
    surchargesInput: { isNight: false },
  }).shippingFee;

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
              <Text style={styles.rateText}>Bảng giá</Text>
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
            <Text style={styles.promoHeading}>Giao nhanh 15 phút • Đồ ăn từ 12k, Giao đồ từ 15k</Text>
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
              <ScrollView
                ref={orderScrollRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 540 }}
              >
                {!!formValidationMsg && (
                  <View style={styles.validationAlertBanner}>
                    <Text style={styles.validationAlertText}>{formValidationMsg}</Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>{currentServiceConfig.mainLabel}</Text>
                <TextInput
                  ref={itemInputRef}
                  style={[
                    styles.modalInput,
                    missingFieldKey === 'item' && styles.inputMissingHighlight,
                  ]}
                  placeholder={currentServiceConfig.mainPlaceholder}
                  value={itemNote}
                  onChangeText={(v) => {
                    setItemNote(v);
                    if (missingFieldKey === 'item' && v.trim()) {
                      setMissingFieldKey('');
                      setFormValidationMsg('');
                    }
                  }}
                />

                <View style={styles.labelRowBetween}>
                  <Text style={styles.inputLabel}>
                    {currentServiceConfig.pickupLabel} (Tỉnh {detectedProvince} - Từ Đồng Hới trở ra) *
                  </Text>
                  <Text style={styles.autoBadge}>Xã/Phường mới 2025</Text>
                </View>

                {/* Bộ lọc nhanh theo cụm khu vực từ Đồng Hới trở ra Bắc */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.communeChipsRow}
                >
                  {['Tất cả', 'Đồng Hới', 'Bố Trạch', 'Ba Đồn', 'Quảng Trạch', 'Tuyên Hóa', 'Minh Hóa'].map((area) => {
                    const activeArea = selectedAreaFilter === area;
                    return (
                      <TouchableOpacity
                        key={`area-${area}`}
                        style={[
                          styles.communeChip,
                          { paddingVertical: 5, backgroundColor: activeArea ? '#111827' : '#F3F4F6', borderColor: activeArea ? '#111827' : '#E5E7EB' },
                        ]}
                        onPress={() => setSelectedAreaFilter(area)}
                      >
                        <Text
                          style={[
                            styles.communeChipText,
                            { fontSize: 12, color: activeArea ? '#FFFFFF' : '#374151' },
                          ]}
                        >
                          {area}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.communeChipsRow}
                >
                  {communes
                    .filter((com) => selectedAreaFilter === 'Tất cả' || com.area === selectedAreaFilter)
                    .map((com, index) => {
                      const isSelected = selectedPickupCommune?.name === com.name;
                      return (
                        <TouchableOpacity
                          key={`${com.name}-${index}`}
                          style={[
                            styles.communeChip,
                            isSelected && styles.communeChipActive,
                          ]}
                          onPress={() => { setSelectedPickupCommune(com); setPickupHamlet(''); if (missingFieldKey === 'commune') { setMissingFieldKey(''); setFormValidationMsg(''); } }}
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
                    {!!selectedPickupCommune.subUnits && (
                      <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700', marginBottom: 6 }}>
                        ℹ️ Hợp nhất từ: {selectedPickupCommune.subUnits}
                      </Text>
                    )}
                    <Text style={styles.subInputLabel}>
                      Thôn / Tổ dân phố / Xóm tại {selectedPickupCommune.name} (tự nhập) *:
                    </Text>
                    <TextInput
                      ref={hamletInputRef}
                      style={[
                        styles.modalInput,
                        missingFieldKey === 'hamlet' && styles.inputMissingHighlight,
                      ]}
                      placeholder="Nhập tên Thôn / Tổ dân phố / Xóm của điểm lấy hàng..."
                      value={pickupHamlet}
                      onChangeText={(v) => {
                        setPickupHamlet(v);
                        if (missingFieldKey === 'hamlet' && v.trim()) {
                          setMissingFieldKey('');
                          setFormValidationMsg('');
                        }
                      }}
                    />
                    <Text style={styles.subInputLabel}>
                      Số nhà, tên đường / tên quán tại {selectedPickupCommune.name}:
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
                <View
                  style={[
                    styles.gpsBox,
                    missingFieldKey === 'dropoff' && styles.inputMissingHighlight,
                  ]}
                >
                  {isLocating && (
                    <ActivityIndicator size="small" color="#D92D20" style={{ marginRight: 8 }} />
                  )}
                  <TextInput
                    ref={dropoffInputRef}
                    style={styles.gpsInput}
                    value={dropoffAddress}
                    onChangeText={(v) => {
                      setDropoffAddress(v);
                      if (missingFieldKey === 'dropoff' && v.trim()) {
                        setMissingFieldKey('');
                        setFormValidationMsg('');
                      }
                    }}
                    placeholder="Vị trí GPS chính xác của bạn"
                  />
                </View>

                {currentServiceConfig.showDuration && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={styles.inputLabel}>Thời gian thực hiện ước tính *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communeChipsRow}>
                      {[
                        { mins: 10, label: 'Dưới 15p (10k)' },
                        { mins: 25, label: '15–30p (15k)' },
                        { mins: 45, label: '30–60p (25k)' },
                        { mins: 90, label: '1–2 giờ (40k)' },
                        { mins: 180, label: '3 giờ (60k)' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.mins}
                          style={[
                            styles.communeChip,
                            taskDurationMinutes === opt.mins && styles.communeChipActive,
                          ]}
                          onPress={() => setTaskDurationMinutes(opt.mins)}
                        >
                          <Text
                            style={[
                              styles.communeChipText,
                              taskDurationMinutes === opt.mins && styles.communeChipTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {currentServiceConfig.showAdvance && (
                  <>
                    <View style={styles.labelRowBetween}>
                      <Text style={styles.inputLabel}>{currentServiceConfig.advanceLabel}</Text>
                      <Text style={styles.autoBadge}>Gõ 1 = 10.000đ</Text>
                    </View>
                    <View style={styles.advanceUnitInputWrap}>
                      <TextInput
                        ref={advanceInputRef}
                        style={[
                          styles.modalInput,
                          { flex: 1, marginBottom: 0 },
                          missingFieldKey === 'advance' && styles.inputMissingHighlight,
                        ]}
                        keyboardType="numeric"
                        placeholder="Gõ 1 → 10.000đ, 5 → 50.000đ, 12 → 120.000đ..."
                        value={advanceMoney}
                        onChangeText={handleAdvanceMoneyChange}
                      />
                      {parsedAdvance > 0 && (
                        <View style={styles.advanceSuffixPill}>
                          <Text style={styles.advanceSuffixText}>
                            = {parsedAdvance.toLocaleString('vi-VN')}đ
                          </Text>
                        </View>
                      )}
                    </View>
                    {parsedAdvance > 0 && (
                      <View style={styles.liveAmountPreviewBox}>
                        <Text style={styles.liveAmountPreviewText}>
                          💰 Tiền ứng trước: {parsedAdvance.toLocaleString('vi-VN')}đ (Gõ {advanceMoney} → {parsedAdvance.toLocaleString('vi-VN')}đ)
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* Tùy chọn phụ phí chung */}
                <Text style={styles.inputLabel}>Phụ phí phát sinh (nếu có)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communeChipsRow}>
                  <TouchableOpacity
                    style={[styles.communeChip, extraStopsCount > 0 && styles.communeChipActive]}
                    onPress={() => setExtraStopsCount((c) => (c >= 3 ? 0 : c + 1))}
                  >
                    <Text style={[styles.communeChipText, extraStopsCount > 0 && styles.communeChipTextActive]}>
                      {extraStopsCount > 0 ? `+${extraStopsCount} điểm giao (+${(extraStopsCount * 5000).toLocaleString('vi-VN')}đ)` : '+ Điểm giao thêm (+5k)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.communeChip, bulkySurcharge > 0 && styles.communeChipActive]}
                    onPress={() =>
                      setBulkySurcharge((v) => (v === 0 ? 10000 : v === 10000 ? 20000 : 0))
                    }
                  >
                    <Text style={[styles.communeChipText, bulkySurcharge > 0 && styles.communeChipTextActive]}>
                      {bulkySurcharge > 0 ? `Hàng cồng kềnh (+${bulkySurcharge.toLocaleString('vi-VN')}đ)` : 'Hàng cồng kềnh (+10–20k)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.communeChip, weatherSurcharge > 0 && styles.communeChipActive]}
                    onPress={() =>
                      setWeatherSurcharge((v) => (v === 0 ? 5000 : v === 5000 ? 10000 : 0))
                    }
                  >
                    <Text style={[styles.communeChipText, weatherSurcharge > 0 && styles.communeChipTextActive]}>
                      {weatherSurcharge > 0 ? `Thời tiết xấu (+${weatherSurcharge.toLocaleString('vi-VN')}đ)` : 'Thời tiết xấu (+5–10k)'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                <Text style={styles.inputLabel}>{currentServiceConfig.extraLabel}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={currentServiceConfig.extraPlaceholder}
                  value={extraNote}
                  onChangeText={setExtraNote}
                />

                <View style={styles.priceSummary}>
                  {!selectedPickupCommune ? (
                    <Text style={styles.priceLine}>
                      Vui lòng chọn xã/phường điểm lấy hàng để hệ thống GPS tính chi tiết từng khoản phí.
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.priceLine}>
                        • Tuyến GPS: {[pickupHamlet.trim(), selectedPickupCommune.name, detectedProvince].filter(Boolean).join(', ')} → Vị trí của bạn ({autoDistanceKm} km)
                      </Text>
                      {pricing.shippingFee > 0 && (
                        <Text style={styles.priceLine}>
                          • {pricing.shippingLabel}: {pricing.shippingFee.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                      {pricing.serviceFee > 0 && (
                        <Text style={styles.priceLine}>
                          • {pricing.serviceFeeLabel}: {pricing.serviceFee.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                      {pricing.goodsValue > 0 && (
                        <Text style={styles.priceLine}>
                          • Tiền hàng / ứng trước: {pricing.goodsValue.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                      {pricing.nightFee > 0 && (
                        <Text style={styles.priceLine}>
                          • Phụ phí ban đêm (22h–6h): +{pricing.nightFee.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                      {pricing.extraStopFee > 0 && (
                        <Text style={styles.priceLine}>
                          • Phụ phí {extraStopsCount} điểm giao thêm: +{pricing.extraStopFee.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                      {pricing.bulkyFee > 0 && (
                        <Text style={styles.priceLine}>
                          • Phụ phí hàng cồng kềnh: +{pricing.bulkyFee.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                      {pricing.badWeatherFee > 0 && (
                        <Text style={styles.priceLine}>
                          • Phụ phí thời tiết xấu: +{pricing.badWeatherFee.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                      {discountAmount > 0 && (
                        <Text style={styles.discountLine}>
                          • Ưu đãi 1 lần/người (-{Math.round(effectiveDiscountRate * 100)}%): -{discountAmount.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                      {isPromoAlreadyUsed && promoKey && (
                        <Text style={styles.usedPromoWarning}>
                          * Tài khoản / thiết bị này đã sử dụng ưu đãi trước đó (áp dụng giá chuẩn).
                        </Text>
                      )}
                    </>
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
                  <Text style={styles.rateHighlightTitle}>Bảng giá chính thức Ninja Ship ({detectedProvince})</Text>
                  <Text style={styles.rateHighlightSub}>
                    • Đặt đồ ăn: 0–2km 12.000đ • 3km 17.000đ • +5.000đ/km{"\n"}
                    • Giao đồ & Nhận hộ: 0–2km 15.000đ • 3km 20.000đ • +5.000đ/km{"\n"}
                    • Mua hộ & Mua thuốc: &lt;100k: 5k | 100–300k: 10k | 300–500k: 15k | &gt;500k: 20k (Mua hộ &gt;1tr: 3%) + ship{"\n"}
                    • Đi chợ hộ: &lt;200k: 10k | 200–500k: 15k | 500k–1tr: 20k | 1–2tr: 30k | &gt;2tr: 3% + ship{"\n"}
                    • Làm hộ: &lt;15p: 10k | 15–30p: 15k | 30–60p: 25k | 1–2h: 40k | +20k/giờ tiếp{"\n"}
                    • Phụ phí: Đêm (22h–6h) +10k • Chờ &gt;10p: +3k/5p • Điểm thêm +5k • Cồng kềnh +10–20k • Thời tiết xấu +5–10k • Hủy sau nhận 10k
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
                    Quãng đường: {previewKm} km • Đồ ăn: {previewFoodCost.toLocaleString('vi-VN')}đ • Giao đồ/Nhận hộ: {previewDeliveryCost.toLocaleString('vi-VN')}đ
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
    fontSize: 16,
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
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
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
  validationAlertBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  validationAlertText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  inputMissingHighlight: {
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FFF5F5',
  },
  liveAmountPreviewBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: -4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveAmountPreviewText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
}  advanceUnitInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  advanceSuffixPill: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    marginLeft: 8,
  },
  advanceSuffixText: {
    color: '#FACC15',
    fontSize: 15,
    fontWeight: '900',
  },
});
