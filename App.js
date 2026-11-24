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
} from 'react-native';

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

// Danh sách xã/phường mẫu khu vực Ba Đồn - Quảng Trạch (Quảng Bình)
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

// Công thức Haversine tính khoảng cách thực tế (nhân hệ số đường bộ 1.25)
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
  const straightKm = R * c;
  const roadKm = Math.max(1.0, straightKm * 1.25);
  return Math.round(roadKm * 10) / 10;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [itemNote, setItemNote] = useState('');

  // Vị trí & Tỉnh/Xã tự động
  const [detectedProvince, setDetectedProvince] = useState('Quảng Bình');
  const [communes, setCommunes] = useState(FALLBACK_COMMUNES);
  const [selectedPickupCommune, setSelectedPickupCommune] = useState(null);
  const [pickupDetailAddress, setPickupDetailAddress] = useState('');

  // Điểm giao cho bạn (Vị trí chính xác)
  const [dropoffCoords, setDropoffCoords] = useState({ lat: 17.7524, lng: 106.4182 });
  const [dropoffAddress, setDropoffAddress] = useState('Đang định vị chính xác...');
  const [isLocating, setIsLocating] = useState(false);

  const [advanceMoney, setAdvanceMoney] = useState('0');
  const [orders, setOrders] = useState([
    {
      id: 'NS-8821',
      service: 'Đặt đồ ăn',
      note: '2 tô Bún bò + 1 Trà đào cam sả',
      total: 101000,
      status: 'Đang giao hàng',
      time: 'Hôm nay, 08:05',
    },
  ]);

  // Tự động thu thập GPS & Tỉnh/Xã khi mở app
  const detectUserLocationAndCommunes = () => {
    setIsLocating(true);

    const onSuccessCoords = async (lat, lng) => {
      setDropoffCoords({ lat, lng });
      try {
        // 1. Reverse geocoding lấy địa chỉ chính xác & tỉnh đang sống
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

        // 2. Truy vấn danh sách các xã/phường thuộc tỉnh/huyện hiện tại
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
    detectUserLocationAndCommunes();
  }, []);

  // Tự động tính Km theo Xã điểm lấy hàng -> Vị trí chính xác của khách (không phụ thuộc số nhà chi tiết)
  const autoDistanceKm = selectedPickupCommune
    ? calculateRoadDistanceKm(
        selectedPickupCommune.lat,
        selectedPickupCommune.lng,
        dropoffCoords.lat,
        dropoffCoords.lng
      )
    : 0;

  const RATE_PER_KM = 5000;
  const parsedAdvance = parseInt(advanceMoney.replace(/\D/g, ''), 10) || 0;
  const shippingFee = Math.round(autoDistanceKm * RATE_PER_KM);
  const totalAmount = shippingFee + parsedAdvance;

  const openOrderModal = (serviceName) => {
    setSelectedService(serviceName);
    if (!dropoffAddress || dropoffAddress.startsWith('Đang định vị')) {
      detectUserLocationAndCommunes();
    }
  };

  const handleCreateOrder = () => {
    if (!itemNote.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập món cần đặt hoặc nội dung nhờ mua hộ.');
      return;
    }
    if (!selectedPickupCommune) {
      Alert.alert('Chưa chọn xã/phường', 'Vui lòng chọn xã/phường nơi lấy hàng trước.');
      return;
    }
    const fullPickup = pickupDetailAddress.trim()
      ? `${pickupDetailAddress.trim()}, ${selectedPickupCommune.name}`
      : selectedPickupCommune.name;

    const newOrder = {
      id: `NS-${Math.floor(1000 + Math.random() * 9000)}`,
      service: selectedService || 'Đặt đồ ăn',
      note: `${itemNote.trim()} (Lấy tại: ${fullPickup} • ${autoDistanceKm} km)`,
      total: totalAmount,
      status: 'Đang tìm tài xế Ninja',
      time: 'Vừa xong',
    };
    setOrders([newOrder, ...orders]);
    setSelectedService(null);
    setItemNote('');
    setActiveTab('orders');
    Alert.alert(
      'Đặt đơn thành công',
      `Mã đơn ${newOrder.id} (${autoDistanceKm} km) đang được gửi tới tài xế gần nhất!`
    );
  };

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
          {/* 1. HEADER BAR */}
          <View style={styles.headerRow}>
            <View style={styles.brandPill}>
              <View style={styles.ninjaAvatar}>
                <Text style={styles.ninjaEmoji}>🥷</Text>
              </View>
              <View style={styles.brandTitleWrap}>
                <Text style={styles.brandTitle}>NINJA</Text>
                <Text style={styles.brandTitle}>SHIP</Text>
              </View>
              <View style={styles.userDivider} />
              <Text style={styles.userName} numberOfLines={2}>
                • {detectedProvince}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.ratePill}
              onPress={() =>
                Alert.alert('Bảng giá Ninja Ship', 'Đồng giá siêu tiết kiệm: 5.000đ / 1 km.')
              }
            >
              <Text style={styles.rateGear}>⚙️</Text>
              <Text style={styles.rateText}>5.000đ/km</Text>
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
              onSubmitEditing={() => openOrderModal('Đặt đồ ăn / Mua hộ')}
            />
          </View>

          {/* 3. HAI THẺ DỊCH VỤ LỚN */}
          <View style={styles.bigCardsRow}>
            <TouchableOpacity
              style={styles.bigCard}
              activeOpacity={0.85}
              onPress={() => openOrderModal('Đặt đồ ăn')}
            >
              <Text style={styles.bigCardTitle}>Đặt đồ ăn</Text>
              <View style={styles.discountBadgePink}>
                <Text style={styles.discountTextPink}>-25%</Text>
              </View>
              <Text style={styles.bigCardEmoji}>🍜</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bigCard}
              activeOpacity={0.85}
              onPress={() => openOrderModal('Mua hộ đồ')}
            >
              <Text style={styles.bigCardTitle}>Mua hộ đồ</Text>
              <View style={styles.discountBadgeYellow}>
                <Text style={styles.discountTextYellow}>-20%</Text>
              </View>
              <Text style={styles.bigCardEmoji}>🛍️</Text>
            </TouchableOpacity>
          </View>

          {/* 4. TIÊU ĐỀ DỊCH VỤ KHÁC + MỞ BẢN ĐỒ KM */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dịch vụ khác</Text>
            <TouchableOpacity onPress={() => openOrderModal('Tính cước bản đồ Km')}>
              <Text style={styles.mapLink}>Mở bản đồ Km →</Text>
            </TouchableOpacity>
          </View>

          {/* 5. LƯỚI 8 DỊCH VỤ NHỎ */}
          <View style={styles.gridWrap}>
            {SERVICES_SMALL.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                activeOpacity={0.8}
                onPress={() => openOrderModal(item.title.replace('\n', ' '))}
              >
                {item.badge && (
                  <View style={[styles.gridBadge, { backgroundColor: item.badgeColor }]}>
                    <Text style={[styles.gridBadgeText, { color: item.badgeText }]}>
                      {item.badge}
                    </Text>
                  </View>
                )}
                <Text style={styles.gridIcon}>{item.icon}</Text>
                <Text style={styles.gridLabel}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 6. BANNER SIÊU TỐC NINJA */}
          <TouchableOpacity
            style={styles.promoBanner}
            activeOpacity={0.9}
            onPress={() => openOrderModal('Siêu tốc Ninja')}
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
          {orders.map((ord) => (
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
          ))}
        </ScrollView>
      )}

      {/* TAB THÔNG BÁO */}
      {activeTab === 'notifications' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageHeading}>Thông báo & Ưu đãi</Text>
          <View style={styles.orderCard}>
            <Text style={styles.orderId}>🎁 Mã giảm 25% Đặt đồ ăn</Text>
            <Text style={styles.orderNote}>Áp dụng tự động cho đơn hàng từ 50.000đ hôm nay.</Text>
          </View>
        </ScrollView>
      )}

      {/* TAB TÀI KHOẢN */}
      {activeTab === 'profile' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageHeading}>Tài khoản khách hàng</Text>
          <View style={styles.orderCard}>
            <Text style={styles.orderId}>🥷 Nguyễn Văn Khách ({detectedProvince})</Text>
            <Text style={styles.orderNote}>Ví Ninja Pay: 1.700.000đ • Hạng Thành viên Vàng</Text>
          </View>
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
          onPress={() =>
            Alert.alert('Điểm thưởng Ninja', 'Bạn đang có 350 điểm đổi voucher miễn phí ship!')
          }
        >
          <Text style={styles.trophyIcon}>🏆</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL ĐẶT ĐƠN NHANH (TỰ ĐỘNG TÍNH KM THEO XÃ -> VỊ TRÍ CHÍNH XÁC) */}
      <Modal visible={!!selectedService} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedService}</Text>
              <TouchableOpacity onPress={() => setSelectedService(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              <Text style={styles.inputLabel}>Món cần đặt / Nội dung mua hộ *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: 2 tô Bún bò + 1 Trà đào cam sả"
                value={itemNote}
                onChangeText={setItemNote}
              />

              {/* ĐIỂM LẤY HÀNG: TỰ NHẬN TỈNH & HIỂN THỊ DANH SÁCH XÃ/PHƯỜNG */}
              <View style={styles.labelRowBetween}>
                <Text style={styles.inputLabel}>
                  Điểm lấy hàng ({detectedProvince}) *
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

              {/* HIỆN Ô NHẬP ĐỊA CHỈ CỤ THỂ SAU KHI CHỌN XÃ (KHÔNG LÀM THAY ĐỔI SỐ KM) */}
              {selectedPickupCommune && (
                <View style={styles.detailAddrBox}>
                  <Text style={styles.subInputLabel}>
                    Địa chỉ cụ thể tại {selectedPickupCommune.name} (số nhà, tên quán):
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={`VD: Số 15 đường chính, ${selectedPickupCommune.name}`}
                    value={pickupDetailAddress}
                    onChangeText={setPickupDetailAddress}
                  />
                </View>
              )}

              {/* ĐIỂM GIAO CHO BẠN: TỰ THU THẬP VỊ TRÍ CHÍNH XÁC */}
              <View style={styles.labelRowBetween}>
                <Text style={styles.inputLabel}>Điểm giao cho bạn (Vị trí chính xác) *</Text>
                <TouchableOpacity onPress={detectUserLocationAndCommunes}>
                  <Text style={styles.gpsRefreshText}>
                    {isLocating ? 'Đang định vị...' : '📍 Cập nhật GPS'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.gpsBox}>
                {isLocating && <ActivityIndicator size="small" color="#D92D20" style={{ marginRight: 8 }} />}
                <TextInput
                  style={styles.gpsInput}
                  value={dropoffAddress}
                  onChangeText={setDropoffAddress}
                  placeholder="Vị trí GPS chính xác của bạn"
                />
              </View>

              {/* TIỀN HÀNG ỨNG TRƯỚC */}
              <Text style={styles.inputLabel}>Tiền hàng ứng trước ước tính (đ)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={advanceMoney}
                onChangeText={setAdvanceMoney}
              />

              {/* TỰ ĐỘNG TÍNH KM & CƯỚC PHÍ */}
              <View style={styles.priceSummary}>
                <Text style={styles.priceLine}>
                  {selectedPickupCommune
                    ? `Tuyến tự động: ${selectedPickupCommune.name} → Vị trí của bạn (${autoDistanceKm} km × 5.000đ)`
                    : 'Vui lòng chọn xã/phường lấy hàng để hệ thống tự tính Km'}
                </Text>
                <Text style={styles.priceTotal}>
                  Tổng thanh toán: {totalAmount.toLocaleString('vi-VN')}đ
                </Text>
              </View>

              <TouchableOpacity style={styles.submitOrderBtn} onPress={handleCreateOrder}>
                <Text style={styles.submitOrderText}>Đặt Ninja Ship ngay</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: '600',
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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '800',
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
    marginBottom: 8,
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
});
