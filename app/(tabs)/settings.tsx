import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { CASTS } from '../../lib/data';
import { storage, keys, fmt, DEFAULT_BACK, DEFAULT_DISPLAY } from '../../lib/storage';
import { Card, Toggle, C, SectionLabel } from '../../components/ui';
import {
  IcoLogOut, IcoBuilding, IcoEdit, IcoCheck, IcoX,
  IcoStar, IcoTarget, IcoChart, IcoUsers,
} from '../../components/icons/Icons';
import { scheduleDailyReminder, cancelAllScheduled } from '../../lib/notifications';

import type { BackSettings, DisplaySettings } from '../../lib/types';

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ label, value, unit, onClose, onSave }: {
  label: string;
  value: string;
  unit?: string;
  onClose: () => void;
  onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.dialog}>
          <Text style={m.dialogLabel}>{label}</Text>
          <View style={m.inputRow}>
            <TextInput
              style={m.input}
              value={text}
              onChangeText={setText}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
            />
            {unit ? <Text style={m.unit}>{unit}</Text> : null}
          </View>
          <View style={m.btns}>
            <TouchableOpacity onPress={onClose} style={m.cancelBtn}>
              <Text style={m.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onSave(text); onClose(); }} style={m.saveBtn}>
              <IcoCheck size={14} color="#000" />
              <Text style={m.saveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Row components ───────────────────────────────────────────────────────────

function SettingRow({ label, value, unit, onEdit }: {
  label: string; value: string; unit?: string; onEdit: () => void;
}) {
  return (
    <TouchableOpacity style={s.settingRow} onPress={onEdit} activeOpacity={0.7}>
      <Text style={s.settingLabel}>{label}</Text>
      <View style={s.settingRight}>
        <Text style={s.settingValue}>{value}{unit ? <Text style={s.settingUnit}> {unit}</Text> : null}</Text>
        <IcoEdit size={13} color={C.gray5} />
      </View>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={s.settingRow}>
      <Text style={s.settingLabel}>{label}</Text>
      <Toggle on={value} onChange={onChange} />
    </View>
  );
}

// ─── Manager Settings ─────────────────────────────────────────────────────────

function ManagerSettings({ companyId, storeName }: { companyId: string; storeName: string }) {
  const [hourly, setHourly] = useState<Record<string, number>>({});
  const [back, setBack] = useState<BackSettings>(DEFAULT_BACK);
  const [monthlyGoal, setMonthlyGoal] = useState(5000000);
  const [editing, setEditing] = useState<{ label: string; value: string; unit?: string; onSave: (v: string) => void } | null>(null);

  useEffect(() => {
    storage.get<Record<string, number>>(keys.hourlyRates(companyId), {}).then(setHourly);
    storage.get<BackSettings>(keys.backSettings(companyId), DEFAULT_BACK).then(setBack);
    storage.get<number>(keys.monthlyGoal(companyId), 5000000).then(setMonthlyGoal);
  }, [companyId]);

  const saveGoal = async (n: number) => {
    await storage.set(keys.monthlyGoal(companyId), n);
    setMonthlyGoal(n);
  };

  const saveHourly = async (name: string, rate: number) => {
    const updated = { ...hourly, [name]: rate };
    await storage.set(keys.hourlyRates(companyId), updated);
    setHourly(updated);
  };

  const saveBack = async (patch: Partial<BackSettings>) => {
    const updated = { ...back, ...patch };
    await storage.set(keys.backSettings(companyId), updated);
    setBack(updated);
  };

  const edit = (label: string, value: number, unit: string, onSave: (v: string) => void) => {
    setEditing({ label, value: String(value), unit, onSave });
  };

  return (
    <>
      {/* Store info */}
      <Card>
        <View style={s.row}>
          <View style={s.iconBox}><IcoBuilding size={18} color={C.gold} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.storeName}>{storeName}</Text>
            <Text style={s.companyId}>ID: {companyId}</Text>
          </View>
        </View>
      </Card>

      {/* Hourly rates */}
      <SectionLabel>キャスト時給設定</SectionLabel>
      <Card>
        {CASTS.map((c, i) => {
          const rate = hourly[c.name] ?? c.hourlyRate;
          return (
            <View key={c.id}>
              {i > 0 && <View style={s.divider} />}
              <SettingRow
                label={c.name}
                value={rate.toLocaleString()}
                unit="円/h"
                onEdit={() => edit(`${c.name}の時給`, rate, '円/h', v => {
                  const n = parseInt(v, 10);
                  if (n > 0) saveHourly(c.name, n);
                })}
              />
            </View>
          );
        })}
      </Card>

      {/* Monthly goal */}
      <SectionLabel>月間売上目標</SectionLabel>
      <Card>
        <SettingRow
          label="今月の売上目標"
          value={monthlyGoal.toLocaleString()}
          unit="円"
          onEdit={() => edit('月間売上目標', monthlyGoal, '円', v => {
            const n = parseInt(v.replace(/,/g, ''), 10);
            if (n > 0) saveGoal(n);
          })}
        />
      </Card>

      {/* Back settings */}
      <SectionLabel>バック計算設定</SectionLabel>
      <Card>
        {[
          { label: 'ドリンクバック', key: 'drinkBack' as const, unit: '円/杯' },
          { label: '本指名バック',   key: 'nominationBack' as const, unit: '円/本' },
          { label: '場内指名バック', key: 'floorNomBack' as const, unit: '円/本' },
          { label: 'ボトルバック率', key: 'bottleBackRate' as const, unit: '%' },
          { label: 'チェキバック',   key: 'chekiBack' as const, unit: '円/枚' },
        ].map(({ label, key, unit }, i) => (
          <View key={key}>
            {i > 0 && <View style={s.divider} />}
            <SettingRow
              label={label}
              value={back[key].toLocaleString()}
              unit={unit}
              onEdit={() => edit(label, back[key], unit, v => {
                const n = parseFloat(v);
                if (!isNaN(n) && n >= 0) saveBack({ [key]: n });
              })}
            />
          </View>
        ))}
      </Card>

      {/* Notification settings */}
      <SectionLabel>通知設定</SectionLabel>
      <NotificationSettings />

      {editing && (
        <EditModal
          label={editing.label}
          value={editing.value}
          unit={editing.unit}
          onClose={() => setEditing(null)}
          onSave={editing.onSave}
        />
      )}
    </>
  );
}

// ─── Notification Settings ────────────────────────────────────────────────────

function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(21);

  useEffect(() => {
    storage.get<boolean>('castboard_notif_enabled', false).then(setEnabled);
    storage.get<number>('castboard_notif_hour', 21).then(setHour);
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await storage.set('castboard_notif_enabled', next);
    if (next) {
      await scheduleDailyReminder(hour, 0);
    } else {
      await cancelAllScheduled();
    }
  };

  const changeHour = async (h: number) => {
    setHour(h);
    await storage.set('castboard_notif_hour', h);
    if (enabled) await scheduleDailyReminder(h, 0);
  };

  return (
    <Card>
      <View style={s.divider && undefined}>
        <ToggleRow label="毎日のリマインダー" value={enabled} onChange={toggle} />
      </View>
      {enabled && (
        <>
          <View style={s.divider} />
          <View style={[s.settingRow, { paddingTop: 12 }]}>
            <Text style={s.settingLabel}>通知時間</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[18, 19, 20, 21, 22, 23].map(h => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => changeHour(h)}
                    style={[s.hourChip, hour === h && s.hourChipActive]}
                  >
                    <Text style={[s.hourChipText, hour === h && { color: '#000' }]}>{h}時</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </>
      )}
    </Card>
  );
}

// ─── Cast Settings ────────────────────────────────────────────────────────────

function CastSettings({ companyId }: { companyId: string }) {
  const { castName, setCastName } = useAuth();
  const cast = CASTS.find(c => c.name === castName) ?? CASTS[0];
  const [disp, setDisp] = useState<DisplaySettings>(DEFAULT_DISPLAY);

  useEffect(() => {
    storage.get<DisplaySettings>(keys.displaySettings(companyId, castName), DEFAULT_DISPLAY).then(setDisp);
  }, [companyId, castName]);

  const toggle = async (key: keyof DisplaySettings) => {
    const updated = { ...disp, [key]: !disp[key] };
    await storage.set(keys.displaySettings(companyId, castName), updated);
    setDisp(updated);
  };

  return (
    <>
      <SectionLabel>キャスト切り替え</SectionLabel>
      <Card>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
            {CASTS.map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCastName(c.name)}
                style={[s.castChip, castName === c.name && s.castChipActive]}
              >
                <Text style={[s.castChipText, castName === c.name && { color: '#000' }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Card>

      <Card>
        <View style={s.row}>
          <View style={s.iconBox}><IcoStar size={18} color={C.gold} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.storeName}>{cast.name}</Text>
            <Text style={s.companyId}>{cast.rank} ランク</Text>
          </View>
        </View>
      </Card>

      <SectionLabel>表示設定</SectionLabel>
      <Card>
        {([
          { label: '給与見込みを表示',   key: 'showSalaryEstimate' as const },
          { label: '店内順位を表示',     key: 'showStoreRank' as const },
          { label: '前月比を表示',       key: 'showPrevMonthRatio' as const },
          { label: 'ミッションを表示',   key: 'showMissions' as const },
          { label: 'バッジを表示',       key: 'showBadges' as const },
        ]).map(({ label, key }, i) => (
          <View key={key}>
            {i > 0 && <View style={s.divider} />}
            <ToggleRow label={label} value={disp[key]} onChange={() => toggle(key)} />
          </View>
        ))}
      </Card>
    </>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function SettingsTab() {
  const { session, role, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/login'); },
      },
    ]);
  };

  const companyId = session?.companyId ?? 'demo';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>設定</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {role === 'manager'
          ? <ManagerSettings companyId={companyId} storeName={session?.storeName ?? ''} />
          : <CastSettings companyId={companyId} />
        }

        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn} activeOpacity={0.8}>
          <IcoLogOut size={18} color="#F87171" />
          <Text style={s.logoutText}>ログアウト</Text>
        </TouchableOpacity>

        <Text style={s.version}>CastBoard v1.0.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title:       { fontSize: 18, fontWeight: '900', color: '#fff' },
  scroll:      { flex: 1 },
  content:     { padding: 16, gap: 12 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
  storeName:   { fontSize: 16, fontWeight: '900', color: '#fff' },
  companyId:   { fontSize: 12, color: C.gray5, marginTop: 2 },
  settingRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  settingLabel:{ fontSize: 14, color: '#fff' },
  settingRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue:{ fontSize: 14, color: C.gold, fontWeight: '700' },
  settingUnit: { fontSize: 11, color: C.gray5, fontWeight: '400' },
  divider:     { height: 1, backgroundColor: '#1f1f1f' },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: 16, paddingVertical: 16, marginTop: 8 },
  logoutText:  { color: '#F87171', fontWeight: '700', fontSize: 15 },
  version:     { textAlign: 'center', color: C.gray5, fontSize: 12, marginTop: 8 },
  castChip:    { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  castChipActive: { backgroundColor: C.gold },
  castChipText:{ color: C.gray4, fontWeight: '700', fontSize: 13 },
  hourChip:    { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  hourChipActive: { backgroundColor: C.gold },
  hourChipText:{ color: C.gray4, fontWeight: '700', fontSize: 12 },
});

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  dialog:     { backgroundColor: '#181818', borderRadius: 20, padding: 24, width: '100%', gap: 16 },
  dialogLabel:{ fontSize: 15, fontWeight: '700', color: '#fff', textAlign: 'center' },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:      { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  unit:       { color: C.gray5, fontSize: 13 },
  btns:       { flexDirection: 'row', gap: 10 },
  cancelBtn:  { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center' },
  cancelText: { color: C.gray5, fontWeight: '700', fontSize: 14 },
  saveBtn:    { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveBtnText:{ color: '#000', fontWeight: '900', fontSize: 14 },
});
