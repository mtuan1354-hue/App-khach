import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROFILE: '@ninja_khach_profile_v1',
  WALLET: '@ninja_khach_wallet_v1',
  ORDERS: '@ninja_khach_orders_v1',
  TRANSACTIONS: '@ninja_khach_tx_v1',
};

export const StorageService = {
  async loadState() {
    try {
      const [profileRaw, walletRaw, ordersRaw, txRaw] = await Promise.all([
        AsyncStorage.getItem(KEYS.PROFILE),
        AsyncStorage.getItem(KEYS.WALLET),
        AsyncStorage.getItem(KEYS.ORDERS),
        AsyncStorage.getItem(KEYS.TRANSACTIONS),
      ]);

      return {
        profile: profileRaw
          ? JSON.parse(profileRaw)
          : {
              name: 'Khách hàng Ninja',
              phone: '0909123456',
              defaultAddress: '120 Lê Duẩn, Quận Hải Châu',
            },
        walletBalance: walletRaw !== null ? Number(walletRaw) : 200000,
        orders: ordersRaw ? JSON.parse(ordersRaw) : [],
        transactions: txRaw
          ? JSON.parse(txRaw)
          : [
              {
                id: 'TX1001',
                type: 'topup',
                title: 'Tặng thưởng kích hoạt ví Ninja Pay',
                amount: 200000,
                createdAt: new Date().toISOString(),
              },
            ],
      };
    } catch (error) {
      return {
        profile: { name: 'Khách hàng Ninja', phone: '0909123456', defaultAddress: '' },
        walletBalance: 200000,
        orders: [],
        transactions: [],
      };
    }
  },

  async saveProfile(profile) {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  async saveWalletBalance(balance) {
    await AsyncStorage.setItem(KEYS.WALLET, String(balance));
  },

  async saveOrders(orders) {
    await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },

  async saveTransactions(transactions) {
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },
};
