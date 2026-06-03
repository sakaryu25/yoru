import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/AuthContext';
import { MISSIONS, BADGES } from '../../lib/data';
import { storage, keys, pct, DEFAULT_DISPLAY } from '../../lib/storage';
import { Card, ProgressBar, C, SectionLabel } from '../../components/ui';
import { IcoTarget, IcoPlus, IcoX, IcoCheck } from '../../components/icons/Icons';
import { notifyMissionComplete, notifyMissionCreated } from '../../lib/notifications';
import type { Mission, DisplaySettings } from '../../lib/types';

// ─── Create Mission Modal ─────────────────────────────────────────────────────

function MissionModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (m: Omit<Mission, 'id' | 'current' | 'achievers' | 'total'>) => void;
}) {
  const [title, setTitle]       = useState('');
  const [condition, setCondition] = useState('');
  const [target, setTarget]     = useState('5');
  const [reward, setReward]     = useState('');
  const [deadline, setDeadline] = useState('今週末まで');

  const reset = () => { setTitle(''); setCondition(''); setTarget('5'); setReward(''); setDeadline('今週末まで'); };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), condition: condition.trim(), target: parseInt(target) || 5, reward: reward.trim() || '+¥1,000', deadline: deadline.trim() });
    reset(); onClose();
  };

  const field = (label: string, value: string, onChange: (v: string) => void, numeric = false) => (
    <View style={m.fieldWrap}>
      <Text style={m.fieldLabel}>{label}</Text>
      <TextInput
        style={m.input}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'numeric' : 'default'}
        placeholderTextColor={C.gray5}
        placeholder={label}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.header}>
            <Text style={m.title}>ミッションを追加</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <IcoX size={20} color={C.gray4} />
            </TouchableOpacity>
          </View>
          {field('タイトル', title, setTitle)}
          {field('達成条件（例：指名3本）', condition, setCondition)}
          {field('目標数', target, setTarget, true)}
          {field('報酬（例：+¥3,000）', reward, setReward)}
          {field('期限（例：今週末まで）', deadline, setDeadline)}
          <TouchableOpacity
            onPress={handleSave}
            style={[m.saveBtn, !title.trim() && { opacity: 0.4 }]}
            disabled={!title.trim()}
          >
            <IcoCheck size={16} color="#000" />
            <Text style={m.saveBtnText}>追加する</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Manager Missions ─────────────────────────────────────────────────────────

function ManagerMissions() {
  const { session } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    const saved = await storage.get<Mission[]>(keys.missions(companyId), MISSIONS);
    setMissions(saved);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const addMission = async (data: Omit<Mission, 'id' | 'current' | 'achievers' | 'total'>) => {
    const newM: Mission = { id: Date.now(), current: 0, achievers: 0, total: MISSIONS[0]?.total ?? 12, ...data };
    const updated = [...missions, newM];
    await storage.set(keys.missions(companyId), updated);
    setMissions(updated);
    notifyMissionCreated(newM.title);
  };

  const deleteMission = async (id: number) => {
    const updated = missions.filter(m => m.id !== id);
    await storage.set(keys.missions(companyId), updated);
    setMissions(updated);
  };

  const adjustMission = async (id: number, delta: number) => {
    const updated = missions.map(m =>
      m.id === id ? { ...m, current: Math.max(0, Math.min(m.target, m.current + delta)) } : m
    );
    await storage.set(keys.missions(companyId), updated);
    setMissions(updated);
    const mission = missions.find(m => m.id === id);
    if (mission && delta > 0 && (mission.current + delta) >= mission.target) {
      notifyMissionComplete(mission.title);
    }
  };

  const activeMissions    = missions.filter(m => m.current < m.target);
  const completedMissions = missions.filter(m => m.current >= m.target);

  const clearCompleted = async () => {
    await storage.set(keys.missions(companyId), activeMissions);
    setMissions(activeMissions);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerRow}>
        <Text style={s.title}>ミッション管理</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <IcoPlus size={16} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <SectionLabel>進行中のミッション</SectionLabel>
        {activeMissions.length === 0 ? (
          <Card><Text style={{ color: C.gray5, textAlign: 'center', fontSize: 13 }}>進行中のミッションがありません</Text></Card>
        ) : activeMissions.map(m => {
          return (
            <Card key={m.id}>
              <View style={[s.row, { marginBottom: 8 }]}>
                <View style={s.iconBox}><IcoTarget size={16} color={C.gold} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.missionTitle}>{m.title}</Text>
                  <Text style={s.sub}>{m.condition} · {m.deadline}</Text>
                </View>
                <Text style={s.reward}>{m.reward}</Text>
                <TouchableOpacity onPress={() => deleteMission(m.id)} style={{ padding: 4 }}>
                  <IcoX size={14} color={C.gray5} />
                </TouchableOpacity>
              </View>
              <ProgressBar value={m.current} max={m.target} />
              <View style={[s.row, { marginTop: 8 }]}>
                <Text style={s.sub}>達成者 {m.achievers}/{m.total}人</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => adjustMission(m.id, -1)}
                    style={[s.adjBtn, m.current === 0 && { opacity: 0.3 }]}
                    disabled={m.current === 0}
                  >
                    <Text style={s.adjText}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ color: C.gold, fontSize: 12, fontWeight: '700', minWidth: 48, textAlign: 'center' }}>
                    {m.current}/{m.target}
                  </Text>
                  <TouchableOpacity
                    onPress={() => adjustMission(m.id, 1)}
                    style={s.adjBtn}
                  >
                    <Text style={s.adjText}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })}

        {completedMissions.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <SectionLabel>{`達成済み (${completedMissions.length})`}</SectionLabel>
              <TouchableOpacity onPress={clearCompleted} style={s.clearBtn}>
                <Text style={s.clearBtnText}>クリア</Text>
              </TouchableOpacity>
            </View>
            {completedMissions.map(m => (
              <Card key={m.id} style={{ borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' }}>
                <View style={s.row}>
                  <View style={[s.iconBox, { backgroundColor: 'rgba(74,222,128,0.1)' }]}>
                    <IcoCheck size={16} color="#4ADE80" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.missionTitle}>{m.title}</Text>
                    <Text style={s.sub}>{m.deadline} · {m.reward}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteMission(m.id)} style={{ padding: 4 }}>
                    <IcoX size={14} color={C.gray5} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <MissionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={addMission}
      />
    </SafeAreaView>
  );
}

// ─── Cast Badges ─────────────────────────────────────────────────────────────

function CastBadges() {
  const { session, castName } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const [disp, setDisp] = useState<DisplaySettings>(DEFAULT_DISPLAY);

  useEffect(() => {
    storage.get<DisplaySettings>(keys.displaySettings(companyId, castName), DEFAULT_DISPLAY).then(setDisp);
  }, [companyId, castName]);

  const earned    = BADGES.filter(b => b.earned);
  const notEarned = BADGES.filter(b => !b.earned);

  if (!disp.showBadges) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}><Text style={s.title}>バッジ</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <IcoTarget size={32} color={C.gray5} />
          <Text style={{ color: C.gray5, fontSize: 14 }}>バッジ表示はオフです</Text>
          <Text style={{ color: C.gray6, fontSize: 12 }}>設定から変更できます</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>バッジ</Text>
        <Text style={s.sub2}>{earned.length}/{BADGES.length}個獲得</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <SectionLabel>{`獲得済み (${earned.length})`}</SectionLabel>
        <View style={s.badgeGrid}>
          {earned.map(b => (
            <View key={b.id} style={s.badge}>
              <View style={s.badgeIconWrap}><b.Icon size={26} color={C.gold} /></View>
              <Text style={s.badgeTitle}>{b.title}</Text>
              <Text style={s.badgeDate}>{b.earnedDate}</Text>
            </View>
          ))}
        </View>
        <SectionLabel>{`未獲得 (${notEarned.length})`}</SectionLabel>
        <View style={s.badgeGrid}>
          {notEarned.map(b => (
            <View key={b.id} style={[s.badge, s.badgeLocked]}>
              <View style={[s.badgeIconWrap, { opacity: 0.3 }]}><b.Icon size={26} color={C.gray5} /></View>
              <Text style={[s.badgeTitle, { color: C.gray5 }]}>{b.title}</Text>
              <Text style={s.badgeDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Cast Missions (in input.tsx) — showMissions guard added separately ───────

export default function MissionsTab() {
  const { role } = useAuth();
  return role === 'manager' ? <ManagerMissions /> : <CastBadges />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title:       { fontSize: 18, fontWeight: '900', color: '#fff' },
  sub:         { fontSize: 11, color: C.gray5, marginTop: 2 },
  sub2:        { fontSize: 12, color: C.gray5 },
  scroll:      { flex: 1 },
  content:     { padding: 16, gap: 12 },
  addBtn:      { backgroundColor: C.gold, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  adjBtn:      { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  adjText:     { color: C.gold, fontWeight: '900', fontSize: 15, lineHeight: 17 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
  missionTitle:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  reward:      { color: C.gold, fontWeight: '700', fontSize: 13 },
  badgeGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  badge:       { width: '30%' as const, alignItems: 'center', backgroundColor: '#181818', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  badgeLocked: { borderColor: '#2a2a2a', backgroundColor: '#111' },
  badgeIconWrap: { marginBottom: 6 },
  badgeTitle:  { fontSize: 11, fontWeight: '700', color: '#fff', textAlign: 'center' },
  badgeDate:   { fontSize: 10, color: C.gold, marginTop: 2 },
  badgeDesc:   { fontSize: 10, color: C.gray5, textAlign: 'center', marginTop: 2 },
  clearBtn:    { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  clearBtnText:{ color: C.gray4, fontSize: 11, fontWeight: '700' },
});

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#181818', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title:      { fontSize: 16, fontWeight: '900', color: '#fff' },
  fieldWrap:  { gap: 4 },
  fieldLabel: { fontSize: 11, color: C.gray5 },
  input:      { backgroundColor: '#111', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: '#fff', fontSize: 14 },
  saveBtn:    { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  saveBtnText:{ color: '#000', fontWeight: '900', fontSize: 15 },
});
