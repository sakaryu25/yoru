import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';

const C = {
  bg:    '#0a0a0a',
  card:  '#181818',
  line:  '#1f1f1f',
  line2: '#2a2a2a',
  gold:  '#D4AF37',
  gray4: '#9CA3AF',
  gray5: '#6B7280',
  gray6: '#4B5563',
};

export { C };

export function Card({
  children, style, onPress,
}: {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[s.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function ProgressBar({
  value, max, color = C.gold, thin = false,
}: {
  value: number; max: number; color?: string; thin?: boolean;
}) {
  const w = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <View style={[s.trackOuter, thin && { height: 4 }]}>
      <View style={[s.trackInner, { width: `${w}%` as `${number}%`, backgroundColor: color, height: thin ? 4 : 8 }]} />
    </View>
  );
}

export function RankBadge({ rank, color, bg, border }: { rank: string; color: string; bg: string; border: string }) {
  return (
    <View style={[s.rankBadge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[s.rankBadgeText, { color }]}>{rank}</Text>
    </View>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 64 : size === 'sm' ? 28 : 40;
  const fs  = size === 'lg' ? 20 : size === 'sm' ? 12 : 14;
  return (
    <View style={[s.avatar, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      <Text style={[s.avatarText, { fontSize: fs }]}>{name[0]}</Text>
    </View>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!on)}
      activeOpacity={0.8}
      style={[s.toggle, { backgroundColor: on ? C.gold : '#333' }]}
    >
      <View style={[s.toggleKnob, on ? s.toggleKnobOn : s.toggleKnobOff]} />
    </TouchableOpacity>
  );
}

export function Spinner() {
  return <ActivityIndicator color={C.gold} />;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

export function GoldButton({
  label, onPress, disabled = false, icon,
}: {
  label: string; onPress: () => void; disabled?: boolean; icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[s.goldBtn, disabled && { opacity: 0.4 }]}
    >
      {icon}
      <Text style={s.goldBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function GhostButton({
  label, onPress, icon,
}: {
  label: string; onPress: () => void; icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.ghostBtn}>
      {icon}
      <Text style={s.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
  },
  trackOuter: {
    width: '100%',
    height: 8,
    backgroundColor: C.line2,
    borderRadius: 99,
    overflow: 'hidden',
  },
  trackInner: {
    height: 8,
    borderRadius: 99,
  },
  rankBadge: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  avatar: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: C.gold,
    fontWeight: '900',
  },
  toggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    position: 'absolute',
  },
  toggleKnobOn:  { right: 4 },
  toggleKnobOff: { left: 4 },
  sectionLabel: {
    fontSize: 10,
    color: C.gray5,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  goldBtn: {
    backgroundColor: C.gold,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  goldBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  ghostBtn: {
    backgroundColor: C.line,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostBtnText: {
    color: C.gold,
    fontWeight: '700',
    fontSize: 14,
  },
});
