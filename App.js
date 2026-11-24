import React, { useState } from 'react';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [itemNote, setItemNote] = useState('');
  const [pickupAddress, setPickupAddress] = useState('45 Hùng Vương, Hải Châu');
  const [dropoffAddress, setDropoffAddress] = useState('120 Lê Duẩn, Quận Hải Châu');
  const [distanceKm, setDistanceKm] = useState('3.2');
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

  const RATE_PER_KM = 5000;
  const parsedKm = parseFloat(distanceKm) || 0;
  const parsedAdvance = parseInt(advanceMoney.replace(/\D/g, ''), 10) || 0;
  const shippingFee = Math.round(parsedKm * RATE_PER_KM);
  const totalAmount = shippingFee + parsedAdvance;

  const openOrderModal = (serviceName) => {
    setSelectedService(serviceName);
  };

  const handleCreateOrder = () => {
    if (!itemNote.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập món cần đặt hoặc nội dung nhờ mua hộ.');
      return;
    }
    const newOrder = {
      id: `NS-${Math.floor(1000 + Math.random() * 9000)}`,
      service: selectedService || 'Đặt đồ ăn',
      note: itemNote.trim(),
      total: totalAmount,
      status: 'Đang tìm tài xế Ninja',
      time: 'Vừa xong',
    };
    setOrders([newOrder, ...orders]);
    setSelectedService(null);
    setItemNote('');
    setActiveTab('orders');
    Alert.alert('Đặt đơn thành công', `Mã đơn ${newOrder.id} đang được gửi tới tài xế gần nhất!`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7F9" />

      {/* Nền gradient nhẹ phía trên */}
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
                • Nguyễn Văn{'\n'}Khách
              </Text>
            </View>

            <TouchableOpacity
              style={styles.ratePill}
              onPress={() => Alert.alert('Bảng giá Ninja Ship', 'Đồng giá siêu tiết kiệm: 5.000đ / 1 km đầu và các km tiếp theo.')}
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
                <Text style={styles.orderId}>{ord.id} • {ord.service}</Text>
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
            <Text style={styles.orderId}>🥷 Nguyễn Văn Khách</Text>
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
          onPress={() => Alert.alert('Điểm thưởng Ninja', 'Bạn đang có 350 điểm đổi voucher miễn phí ship!')}
        >
          <Text style={styles.trophyIcon}>🏆</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL ĐẶT ĐƠN NHANH */}
      <Modal visible={!!selectedService} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedService}</Text>
              <TouchableOpacity onPress={() => setSelectedService(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Món cần đặt / Nội dung mua hộ *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="VD: 2 tô Bún bò + 1 Trà đào cam sả"
              value={itemNote}
              onChangeText={setItemNote}
            />

            <Text style={styles.inputLabel}>Điểm lấy hàng / Quán mua (Điểm A)</Text>
            <TextInput
              style={styles.modalInput}
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />

            <Text style={styles.inputLabel}>Điểm giao cho bạn (Điểm B)</Text>
            <TextInput
              style={styles.modalInput}
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
            />

            <View style={styles.rowTwoCol}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Khoảng cách (Km)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={distanceKm}
                  onChangeText={setDistanceKm}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Tiền hàng ứng (đ)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={advanceMoney}
                  onChangeText={setAdvanceMoney}
                />
              </View>
            </View>

            <View style={styles.priceSummary}>
              <Text style={styles.priceLine}>Phí ship ({parsedKm} km × 5.000đ): {shippingFee.toLocaleString('vi-VN')}đ</Text>
              <Text style={styles.priceTotal}>Tổng thanh toán: {totalAmount.toLocaleString('vi-VN')}đ</Text>
            </View>

            <TouchableOpacity style={styles.submitOrderBtn} onPress={handleCreateOrder}>
              <Text style={styles.submitOrderText}>Đặt Ninja Ship ngay</Text>
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
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
  rowTwoCol: {
    flexDirection: 'row',
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
    marginBottom: 2,
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
