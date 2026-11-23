# Ninja Ship Khách (React Native Expo)

## Cấu trúc dự án
- `App.js`: Điều hướng 4 màn hình chính (Đặt đơn, Đơn hàng, Ví tiền, Tài khoản)
- `src/config/constants.js`: Cấu hình màu sắc, bảng giá theo Km, thông tin VietQR & API
- `src/screens/BookingScreen.js`: Đặt đồ ăn, mua hộ/nhận hộ, giao hàng nhanh + định vị GPS
- `src/screens/OrdersScreen.js`: Theo dõi trạng thái đơn hàng & hủy đơn
- `src/screens/WalletScreen.js`: Ví Ninja Pay, nạp VietQR, rút tiền & lịch sử giao dịch
- `src/screens/ProfileScreen.js`: Thông tin khách hàng
- `eas.json` & `app.json`: Cấu hình Expo EAS Build cho Android APK và iOS IPA
- `.github/workflows/eas-build.yml`: Quy trình CI/CD tự động build trên GitHub Actions
