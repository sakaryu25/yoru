import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { storage, keys } from '../../lib/storage';
import type { Announcement } from '../../lib/types';
import {
  IcoHome, IcoUsers, IcoEdit, IcoTarget, IcoSettings,
  IcoChart, IcoAward, IcoSparkles,
} from '../../components/icons/Icons';
import { C } from '../../components/ui';

const MANAGER_TABS = [
  { key: 'index',    label: 'ホーム',     Icon: IcoHome },
  { key: 'casts',    label: 'キャスト',   Icon: IcoUsers },
  { key: 'input',    label: '実績',       Icon: IcoEdit },
  { key: 'missions', label: 'ミッション', Icon: IcoTarget },
  { key: 'ai',       label: 'AI分析',     Icon: IcoSparkles },
] as const;

const CAST_TABS = [
  { key: 'index',    label: 'ホーム',     Icon: IcoHome },
  { key: 'casts',    label: 'マイ成績',   Icon: IcoChart },
  { key: 'input',    label: 'ミッション', Icon: IcoTarget },
  { key: 'missions', label: 'バッジ',     Icon: IcoAward },
  { key: 'ai',       label: 'AIコーチ',   Icon: IcoSparkles },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="casts" />
      <Tabs.Screen name="input" />
      <Tabs.Screen name="missions" />
      <Tabs.Screen name="ai" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

function CustomTabBar(props: Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0]) {
  const { state, navigation } = props;
  const { role, session } = useAuth();
  const tabs = role === 'manager' ? MANAGER_TABS : CAST_TABS;
  const [annBadge, setAnnBadge] = useState(0);

  useEffect(() => {
    if (role !== 'cast' || !session) { setAnnBadge(0); return; }
    const cid = session.companyId;
    Promise.all([
      storage.get<Announcement[]>(keys.announcements(cid), []),
      storage.get<string[]>(keys.annRead(cid), []),
    ]).then(([anns, readIds]) => {
      setAnnBadge(anns.filter(a => !readIds.includes(a.id)).length);
    });
  }, [role, session, state.index]);

  return (
    <View style={s.bar}>
      {tabs.map((tab) => {
        const routeIndex = state.routes.findIndex(r => r.name === tab.key);
        const isFocused = state.index === routeIndex;
        const isAI = tab.key === 'ai';
        const color = isFocused ? C.gold : isAI ? 'rgba(212,175,55,0.55)' : C.gray5;

        const onPress = () => {
          navigation.navigate(tab.key);
        };

        const showBadge = tab.key === 'index' && annBadge > 0;
        return (
          <TouchableOpacity key={tab.key} onPress={onPress} style={s.tab} activeOpacity={0.7}>
            <View>
              <tab.Icon size={22} color={color} />
              {showBadge && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{annBadge > 9 ? '9+' : annBadge}</Text>
                </View>
              )}
            </View>
            <Text style={[s.label, { color }]}>{tab.label}</Text>
            {isFocused && <View style={s.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar:   { flexDirection: 'row', backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#1f1f1f', paddingBottom: 28, paddingTop: 10 },
  tab:   { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 10, fontWeight: '700' },
  dot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginTop: 1 },
  badge:    { position: 'absolute', top: -4, right: -8, backgroundColor: '#F87171', borderRadius: 99, minWidth: 15, height: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:{ color: '#fff', fontSize: 9, fontWeight: '900' },
});
