import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config/constants';
import { formatVND } from '../utils/formatters';

export default function Header({ customerName, walletBalance }) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🥷 NINJA SHIP</Text>
        </View>
        <Text style={styles.greeting}>Xin chào, {customerName}</Text>
      </View>

      <View style={styles.walletPill}>
        <Text style={styles.walletLabel}>Ninja Pay</Text>
        <Text style={styles.walletValue}>{formatVND(walletBalance)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  left: { flex: 1 },
  badge: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  greeting: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 5,
  },
  walletPill: {
    backgroundColor: COLORS.darkSecondary,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  walletLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '600' },
  walletValue: { color: '#F87171', fontSize: 14, fontWeight: '800', marginTop: 1 },
});
