import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/AuthContext';
import { CASTS, MISSIONS } from '../../lib/data';
import { storage, keys, fmt, pct, DEFAULT_BACK, DEFAULT_DISPLAY } from '../../lib/storage';
import { Card, ProgressBar, GoldButton, C, SectionLabel } from '../../components/ui';
import { IcoEdit, IcoTarget, IcoAlertCircle, IcoChevronLeft, IcoChevronRight, IcoX, IcoCheck } from '../../components/icons/Icons';
import type { PerformanceRecord, BackSettings, Mission, DisplaySettings } from '../../lib/types';

export default function InputTab() {
  const { role } = useAuth();
  return role === 'manager' ? <ManagerInput /> : <CastMissions />;
}

// ─── Edit Record Modal ────────────────────────────────────────────────────────
function EditRecordModal({ record, back, hourlyRates, onClose, onSave }: {
  record: PerformanceRecord;
  back: BackSettings;
  hourlyRates: Record<string, number>;
  onClose: () => void;
  onSave: (updated: PerformanceRecord) => void;
}) {
  const [form, setForm] = useState({
    hours: record.hours,
    sales: record.sales,
    nominations: record.nominations,
    floorNominations: record.floorNominations ?? 0,
    drinks: record.drinks,
    bottleSales: record.bottleSales,
    cheki: record.cheki,
    otherBack: record.otherBack ?? 0,
    memo: record.memo,
  });

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const castData = CASTS.find(c => c.name === record.castName);
  const hourlyRate = hourlyRates[record.castName] ?? castData?.hourlyRate ?? 2500;
  const salary =
    hourlyRate * form.hours +
    form.drinks * back.drinkBack +
    form.nominations * back.nominationBack +
    form.floorNominations * back.floorNomBack +
    Math.floor(form.bottleSales * (back.bottleBackRate / 100)) +
    form.cheki * back.chekiBack +
    form.otherBack;

  const field = (label: string, key: keyof typeof form, numeric = true) => (
    <View key={key}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={String(form[key])}
          onChangeText={v => set(key, numeric ? Number(v) || 0 : v)}
          keyboardType={numeric ? 'numeric' : 'default'}
          placeholderTextColor={C.gray5}
        />
      </View>
    </View>
  );

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={er.overlay}>
        <View style={er.sheet}>
          <View style={er.header}>
            <View>
              <Text style={er.title}>{record.castName} の実績を編集</Text>
              <Text style={{ color: C.gray5, fontSize: 11, marginTop: 2 }}>{record.date}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><IcoX size={20} color={C.gray4} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View style={[s.gap, { marginBottom: 12 }]}>
              {field('勤務時間 (h)', 'hours')}
              {field('売上', 'sales')}
              {field('本指名数', 'nominations')}
              {field('場内指名数', 'floorNominations')}
              {field('ドリンク数', 'drinks')}
              {field('ボトル売上', 'bottleSales')}
              {field('チェキ数', 'cheki')}
              {field('その他バック', 'otherBack')}
              {field('メモ', 'memo', false)}
            </View>
            <View style={er.salaryRow}>
              <Text style={{ color: C.gray4, fontSize: 13 }}>給与見込み</Text>
              <Text style={{ color: C.gold, fontWeight: '900', fontSize: 20 }}>{fmt(salary)}</Text>
            </View>
          </ScrollView>
          <TouchableOpacity
            onPress={() => { onSave({ ...record, ...form, salary }); onClose(); }}
            style={er.saveBtn}
          >
            <IcoCheck size={16} color="#000" />
            <Text style={er.saveBtnText}>保存する</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Manager Input ─────────────────────────────────────────────────────────────
function ManagerInput() {
  const { session } = useAuth();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    cast: CASTS[0].name, hours: 6, sales: 0, nominations: 0,
    floorNominations: 0, drinks: 0, bottleSales: 0,
    cheki: 0, merchandise: 0, otherBack: 0, dayPay: 0, deduction: 0, memo: '',
  });
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [hourlyRates, setHourlyRates] = useState<Record<string, number>>({});
  const [back, setBack] = useState<BackSettings>(DEFAULT_BACK);
  const [editRecord, setEditRecord] = useState<PerformanceRecord | null>(null);

  const companyId = session?.companyId ?? 'demo';

  const loadRecords = useCallback(async () => {
    const saved = await storage.get<PerformanceRecord[]>(keys.records(companyId), []);
    setRecords(saved);
  }, [companyId]);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => {
    storage.get<Record<string, number>>(keys.hourlyRates(companyId), {}).then(setHourlyRates);
    storage.get<BackSettings>(keys.backSettings(companyId), DEFAULT_BACK).then(setBack);
  }, [companyId]);

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const shiftDate = (days: number) => {
    const d = new Date(form.date);
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    if (iso <= new Date().toISOString().split('T')[0]) set('date', iso);
  };
  const deleteRecord = async (id: string) => {
    const updated = records.filter(r => r.id !== id);
    await storage.set(keys.records(companyId), updated);
    setRecords(updated);
  };

  const updateRecord = async (updated: PerformanceRecord) => {
    const next = records.map(r => r.id === updated.id ? updated : r);
    await storage.set(keys.records(companyId), next);
    setRecords(next);
  };
  const castData = CASTS.find(c => c.name === form.cast);
  const hourlyRate = hourlyRates[form.cast] ?? castData?.hourlyRate ?? 2500;
  const drinkBack = form.drinks * back.drinkBack;
  const nominationBack = form.nominations * back.nominationBack + form.floorNominations * back.floorNomBack;
  const bottleBack = Math.floor(form.bottleSales * (back.bottleBackRate / 100));
  const chekiBack = form.cheki * back.chekiBack;
  const salary = hourlyRate * form.hours + drinkBack + nominationBack + bottleBack + chekiBack + form.otherBack - form.dayPay - form.deduction;

  const handleSave = async () => {
    const record: PerformanceRecord = {
      id: Date.now().toString(),
      date: form.date,
      castName: form.cast,
      hours: form.hours,
      sales: form.sales,
      salary,
      nominations: form.nominations,
      floorNominations: form.floorNominations,
      drinks: form.drinks,
      bottleSales: form.bottleSales,
      cheki: form.cheki,
      otherBack: form.otherBack,
      memo: form.memo,
      savedAt: new Date().toISOString(),
    };
    const updated = [record, ...records].slice(0, 500);
    await storage.set(keys.records(companyId), updated);
    setRecords(updated);
    Alert.alert('保存完了', `${form.cast} の実績を保存しました`);
  };

  const field = (label: string, key: string, unit = '') => (
    <View key={key}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={String((form as Record<string, string | number>)[key])}
          onChangeText={v => set(key, key === 'memo' ? v : Number(v) || 0)}
          keyboardType={key === 'memo' ? 'default' : 'numeric'}
          placeholderTextColor={C.gray5}
        />
        {unit ? <Text style={{ color: C.gray5, fontSize: 12 }}>{unit}</Text> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>実績入力</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <Card>
          <SectionLabel>基本情報</SectionLabel>
          <View style={[s.gap, { marginTop: 12 }]}>
            <View>
              <Text style={s.label}>日付</Text>
              <View style={s.inputRow}>
                <TouchableOpacity onPress={() => shiftDate(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <IcoChevronLeft size={18} color={C.gold} />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 15, flex: 1, textAlign: 'center' }}>{form.date}</Text>
                <TouchableOpacity
                  onPress={() => shiftDate(1)}
                  disabled={form.date >= new Date().toISOString().split('T')[0]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <IcoChevronRight size={18} color={form.date >= new Date().toISOString().split('T')[0] ? C.gray6 : C.gold} />
                </TouchableOpacity>
              </View>
            </View>
            <View>
              <Text style={s.label}>キャスト</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CASTS.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => set('cast', c.name)}
                      style={[s.castChip, form.cast === c.name && s.castChipActive]}
                    >
                      <Text style={[s.castChipText, form.cast === c.name && { color: '#000' }]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            {field('勤務時間', 'hours', 'h')}
          </View>
        </Card>

        <Card>
          <SectionLabel>売上・バック</SectionLabel>
          <View style={[s.grid2, { marginTop: 12 }]}>
            {[
              ['売上', 'sales'], ['本指名数', 'nominations'],
              ['場内指名数', 'floorNominations'], ['ドリンク数', 'drinks'],
              ['ボトル売上', 'bottleSales'], ['チェキ数', 'cheki'],
              ['その他バック', 'otherBack'],
            ].map(([l, k]) => (
              <View key={k} style={{ flex: 1, minWidth: '45%' }}>
                {field(l, k)}
              </View>
            ))}
          </View>
        </Card>

        {/* Salary summary */}
        <Card style={{ position: 'relative', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 16 }} />
          <SectionLabel>給与見込み</SectionLabel>
          <View style={[s.gap, { marginTop: 12 }]}>
            {[
              { label: `時給 (${fmt(hourlyRate)}×${form.hours}h)`, val: hourlyRate * form.hours },
              { label: 'ドリンクバック', val: drinkBack },
              { label: '指名バック', val: nominationBack },
              { label: 'ボトルバック', val: bottleBack },
              { label: 'チェキバック', val: chekiBack },
            ].map(item => (
              <View key={item.label} style={s.row}>
                <Text style={{ color: C.gray4, fontSize: 13 }}>{item.label}</Text>
                <Text style={{ color: '#fff', fontSize: 13 }}>{fmt(item.val)}</Text>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: '#2a2a2a', paddingTop: 12 }}>
              <View style={s.row}>
                <Text style={{ color: C.gray4, fontSize: 14 }}>本日給与</Text>
                <Text style={{ color: C.gold, fontWeight: '900', fontSize: 24 }}>{fmt(salary)}</Text>
              </View>
            </View>
          </View>
        </Card>

        <GoldButton
          label="実績を保存"
          onPress={handleSave}
          icon={<IcoEdit size={18} color="#000" />}
        />

        {records.length > 0 && (
          <>
            <SectionLabel>保存済み履歴</SectionLabel>
            {records.slice(0, 20).map(r => (
              <Card key={r.id}>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{r.castName}</Text>
                    <Text style={{ color: C.gray5, fontSize: 11, marginTop: 2 }}>{r.date} · {r.hours}h</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    <Text style={{ color: C.gold, fontWeight: '900', fontSize: 16 }}>{fmt(r.salary)}</Text>
                    <Text style={{ color: C.gray5, fontSize: 10, marginTop: 2 }}>指名{r.nominations} ドリンク{r.drinks}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setEditRecord(r)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <IcoEdit size={14} color={C.gray5} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteRecord(r.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <IcoX size={14} color={C.gray5} />
                  </TouchableOpacity>
                </View>
                {r.memo ? (
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 8, alignItems: 'center' }}>
                    <IcoAlertCircle size={11} color={C.gray5} />
                    <Text style={{ color: C.gray5, fontSize: 11, flex: 1 }}>{r.memo}</Text>
                  </View>
                ) : null}
              </Card>
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {editRecord && (
        <EditRecordModal
          record={editRecord}
          back={back}
          hourlyRates={hourlyRates}
          onClose={() => setEditRecord(null)}
          onSave={updateRecord}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Cast: Missions ────────────────────────────────────────────────────────────
function CastMissions() {
  const { session, castName } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const [missions, setMissions] = useState<Mission[]>([]);
  const [disp, setDisp] = useState<DisplaySettings>(DEFAULT_DISPLAY);

  useEffect(() => {
    storage.get<Mission[]>(keys.missions(companyId), MISSIONS).then(setMissions);
    storage.get<DisplaySettings>(keys.displaySettings(companyId, castName), DEFAULT_DISPLAY).then(setDisp);
  }, [companyId, castName]);

  if (!disp.showMissions) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}><Text style={s.title}>ミッション</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <IcoTarget size={32} color={C.gray5} />
          <Text style={{ color: C.gray5, fontSize: 14 }}>ミッション表示はオフです</Text>
          <Text style={{ color: C.gray6, fontSize: 12 }}>設定から変更できます</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>ミッション</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {missions.map(m => {
          const rate = pct(m.current, m.target);
          const done = m.current >= m.target;
          return (
            <Card key={m.id} style={done ? { borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' } : {}}>
              <View style={[s.row, { marginBottom: 8 }]}>
                <View style={s.missionIcon}>
                  <IcoTarget size={16} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{m.title}</Text>
                  <Text style={{ color: C.gray5, fontSize: 11 }}>{m.condition} · {m.deadline}</Text>
                </View>
                <Text style={{ color: C.gold, fontWeight: '700', fontSize: 13 }}>{m.reward}</Text>
              </View>
              <View style={[s.row, { marginBottom: 6 }]}>
                <Text style={{ color: C.gold, fontSize: 12 }}>
                  {done ? '達成！' : `あと${m.target - m.current}回で達成`}
                </Text>
                <Text style={{ color: C.gray5, fontSize: 11 }}>{m.current}/{m.target} ({rate}%)</Text>
              </View>
              <ProgressBar value={m.current} max={m.target} color={done ? '#4ADE80' : C.gold} />
              <Text style={{ color: C.gray5, fontSize: 10, marginTop: 8 }}>
                達成者 {m.achievers}/{m.total}人
              </Text>
            </Card>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  header:       { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title:        { fontSize: 18, fontWeight: '900', color: '#fff' },
  scroll:       { flex: 1 },
  content:      { padding: 16, gap: 12 },
  label:        { fontSize: 11, color: C.gray5, marginBottom: 6 },
  inputRow:     { backgroundColor: '#111', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  input:        { flex: 1, color: '#fff', fontSize: 15 },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gap:          { gap: 12 },
  grid2:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  castChip:     { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  castChipActive:{ backgroundColor: C.gold },
  castChipText: { color: C.gray4, fontWeight: '700', fontSize: 13 },
  missionIcon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
});

const er = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#181818', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:      { fontSize: 15, fontWeight: '900', color: '#fff' },
  salaryRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 12 },
  saveBtn:    { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText:{ color: '#000', fontWeight: '900', fontSize: 15 },
});
