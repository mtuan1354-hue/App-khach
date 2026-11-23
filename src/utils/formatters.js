import { PRICING, BANK_CONFIG } from '../config/constants';

export const formatVND = (amount) => {
  const num = Math.round(Number(amount) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
};

export const calculateShippingFee = (distanceKm) => {
  const km = Math.max(0.5, parseFloat(distanceKm) || 1);
  if (km <= PRICING.baseKm) {
    return PRICING.baseFare;
  }
  const extraKm = km - PRICING.baseKm;
  return Math.round(PRICING.baseFare + extraKm * PRICING.ratePerKm);
};

export const buildVietQRUrl = (amount, description) => {
  const cleanAmount = Math.max(10000, Math.round(Number(amount) || 50000));
  const encodedInfo = encodeURIComponent(description || 'NAP NINJA PAY');
  const encodedName = encodeURIComponent(BANK_CONFIG.accountName);
  return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${cleanAmount}&addInfo=${encodedInfo}&accountName=${encodedName}`;
};

export const formatDateTime = (isoString) => {
  const d = new Date(isoString);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${hh}:${mm} - ${dd}/${mo}/${d.getFullYear()}`;
};
