export const COLORS = {
  primary: '#DC2626',
  primaryDark: '#B91C1C',
  primaryLight: '#FEF2F2',
  dark: '#111827',
  darkSecondary: '#1F2937',
  grayText: '#6B7280',
  border: '#E5E7EB',
  background: '#F3F4F6',
  white: '#FFFFFF',
  success: '#16A34A',
  warning: '#D97706',
  info: '#2563EB',
};

export const PRICING = {
  baseFare: 10000,
  baseKm: 2,
  ratePerKm: 5000,
};

export const BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '0988886666',
  accountName: 'CONG TY NINJA SHIP VN',
  template: 'compact2',
};

export const API_CONFIG = {
  baseUrl: 'https://ninja-ship-api.workers.dev',
  timeoutMs: 8000,
};

export const SERVICE_TYPES = [
  {
    id: 'food',
    title: 'Đặt đồ ăn',
    icon: '🍜',
    desc: 'Quán ăn, trà sữa, đồ ăn vặt giao tận nơi',
    placeholderNote: 'VD: 2 tô Bún bò + 1 Trà đào cam sả',
  },
  {
    id: 'buy_for_me',
    title: 'Mua hộ / Nhận hộ',
    icon: '🛍️',
    desc: 'Đi siêu thị, mua thuốc, nhận bưu phẩm hộ',
    placeholderNote: 'VD: Mua 1 vỉ thuốc cảm + 2 chai nước suối lớn',
  },
  {
    id: 'express',
    title: 'Giao hàng nhanh',
    icon: '📦',
    desc: 'Chuyển tài liệu, hàng hóa hỏa tốc nội thành',
    placeholderNote: 'VD: Túi hồ sơ quan trọng, gọi người nhận trước 5 phút',
  },
];
