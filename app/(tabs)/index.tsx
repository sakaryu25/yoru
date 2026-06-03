import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/AuthContext';
import { DEMO_ACCOUNTS, CASTS, RANK_CONFIG } from '../../lib/data';
import { storage, keys, fmt, pct, DEFAULT_DISPLAY } from '../../lib/storage';
import type { DisplaySettings, PerformanceRecord, DailyReport } from '../../lib/types';
import { aggregateManager, monthlyTrend, castRanking, pendingCount, aggregateCast } from '../../lib/analytics';
import { CastDetailModal } from '../../components/CastDetailModal';
import { Card, ProgressBar, Avatar, RankBadge, C, SectionLabel } from '../../components/ui';
import {
  IcoMoon, IcoTrendUp, IcoTarget, IcoAlertCircle, IcoUsers,
  IcoHome, IcoChart, IcoAward, IcoEdit, IcoSettings, MedalIcon,
  IcoBell, IcoPlus, IcoX, IcoCheck, IcoClock, IcoLogIn, IcoLogOut,
} from '../../components/icons/Icons';
import { BarChart } from '../../components/charts/BarChart';
import type { Announcement } from '../../lib/types';

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useAnnouncements(companyId: string) {
  const [list, setList] = useState<Announcement[]>([]);

  const load = useCallback(async () => {
    const data = await storage.get<Announcement[]>(keys.announcements(companyId), []);
    setList(data);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const add = async (title: string, body: string, priority: 'normal' | 'important') => {
    const ann: Announcement = {
      id: Date.now().toString(),
      title, body, priority,
      createdAt: new Date().toISOString(),
      pinned: false,
    };
    const updated = [ann, ...list];
    await storage.set(keys.announcements(companyId), updated);
    setList(updated);
  };

  const remove = async (id: string) => {
    const updated = list.filter(a => a.id !== id);
    await storage.set(keys.announcements(companyId), updated);
    setList(updated);
  };

  return { list, add, remove };
}

function useAnnRead(companyId: string, annIds: string[]) {
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    storage.get<string[]>(keys.annRead(companyId), []).then(setReadIds);
  }, [companyId]);

  const markAllRead = useCallback(async () => {
    const updated = [...new Set([...readIds, ...annIds])];
    await storage.set(keys.annRead(companyId), updated);
    setReadIds(updated);
  }, [companyId, readIds, annIds]);

  const unreadCount = annIds.filter(id => !readIds.includes(id)).length;

  return { readIds, markAllRead, unreadCount };
}

// ─── Clock hook & card ───────────────────────────────────────────────────────

interface ClockRecord { clockIn: string | null; clockOut: string | null; }

function useClock(companyId: string, castName: string) {
  const today = new Date().toISOString().split('T')[0];
  const key   = keys.clock(companyId, castName, today);
  const [rec, setRec] = useState<ClockRecord>({ clockIn: null, clockOut: null });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    storage.get<ClockRecord>(key, { clockIn: null, clockOut: null }).then(setRec);
  }, [key]);

  useEffect(() => {
    if (!rec.clockIn || rec.clockOut) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(rec.clockIn!).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rec.clockIn, rec.clockOut]);

  const clockIn  = async () => {
    const updated = { clockIn: new Date().toISOString(), clockOut: null };
    await storage.set(key, updated); setRec(updated);
  };
  const clockOut = async () => {
    const updated = { ...rec, clockOut: new Date().toISOString() };
    await storage.set(key, updated); setRec(updated);
  };

  const status: 'off' | 'working' | 'done' =
    !rec.clockIn ? 'off' : !rec.clockOut ? 'working' : 'done';

  const totalSec = rec.clockIn && rec.clockOut
    ? Math.floor((new Date(rec.clockOut).getTime() - new Date(rec.clockIn!).getTime()) / 1000)
    : elapsed;

  const fmt2 = (n: number) => n.toString().padStart(2, '0');
  const formatSec = (s: number) =>
    `${fmt2(Math.floor(s / 3600))}:${fmt2(Math.floor((s % 3600) / 60))}:${fmt2(s % 60)}`;

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  return { status, clockIn, clockOut, totalSec, formatSec, fmtTime, rec };
}

function ClockCard({ companyId, castName }: { companyId: string; castName: string }) {
  const { status, clockIn, clockOut, totalSec, formatSec, fmtTime, rec } = useClock(companyId, castName);

  if (status === 'off') {
    return (
      <Card>
        <View style={cl.row}>
          <IcoClock size={16} color={C.gray5} />
          <Text style={{ color: C.gray5, fontSize: 13 }}>本日まだ出勤していません</Text>
        </View>
        <TouchableOpacity style={cl.inBtn} onPress={clockIn} activeOpacity={0.8}>
          <IcoLogIn size={18} color="#000" />
          <Text style={cl.inBtnText}>出勤する</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  if (status === 'working') {
    return (
      <Card style={{ borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' }}>
        <View style={[cl.row, { marginBottom: 4 }]}>
          <View style={cl.dot} />
          <Text style={{ color: '#4ADE80', fontSize: 12, fontWeight: '700' }}>勤務中</Text>
          <Text style={{ color: C.gray5, fontSize: 12, marginLeft: 'auto' }}>
            {rec.clockIn ? fmtTime(rec.clockIn) : ''}〜
          </Text>
        </View>
        <Text style={cl.timer}>{formatSec(totalSec)}</Text>
        <TouchableOpacity style={cl.outBtn} onPress={clockOut} activeOpacity={0.8}>
          <IcoLogOut size={16} color={C.gold} />
          <Text style={cl.outBtnText}>退勤する</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  const hours = Math.floor(totalSec / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  return (
    <Card style={{ borderWidth: 1, borderColor: '#2a2a2a' }}>
      <View style={cl.row}>
        <IcoCheck size={14} color="#4ADE80" />
        <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 13 }}>本日の勤務完了</Text>
      </View>
      <View style={[cl.row, { marginTop: 10 }]}>
        <View>
          <Text style={{ color: C.gray5, fontSize: 10 }}>出勤</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {rec.clockIn ? fmtTime(rec.clockIn) : '-'}
          </Text>
        </View>
        <Text style={{ color: C.gray5, fontSize: 18 }}>→</Text>
        <View>
          <Text style={{ color: C.gray5, fontSize: 10 }}>退勤</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {rec.clockOut ? fmtTime(rec.clockOut) : '-'}
          </Text>
        </View>
        <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
          <Text style={{ color: C.gray5, fontSize: 10 }}>勤務時間</Text>
          <Text style={{ color: C.gold, fontWeight: '900', fontSize: 18 }}>
            {hours}h{mins > 0 ? `${mins}m` : ''}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────

function AnnModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, body: string, priority: 'normal' | 'important') => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important'>('normal');

  const reset = () => { setTitle(''); setBody(''); setPriority('normal'); };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim(), body.trim(), priority);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>お知らせを作成</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <IcoX size={20} color={C.gray4} />
            </TouchableOpacity>
          </View>

          <View style={m.priorityRow}>
            {(['normal', 'important'] as const).map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[m.priorityBtn, priority === p && (p === 'important' ? m.priorityBtnAlert : m.priorityBtnActive)]}
              >
                <Text style={[m.priorityText, priority === p && { color: p === 'important' ? '#FB923C' : C.gold }]}>
                  {p === 'important' ? '重要' : '通常'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={m.input}
            placeholder="タイトル"
            placeholderTextColor={C.gray5}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[m.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="内容（任意）"
            placeholderTextColor={C.gray5}
            value={body}
            onChangeText={setBody}
            multiline
          />

          <TouchableOpacity
            onPress={handleSave}
            style={[m.saveBtn, !title.trim() && { opacity: 0.4 }]}
            disabled={!title.trim()}
          >
            <IcoCheck size={16} color="#000" />
            <Text style={m.saveBtnText}>投稿する</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Close Day Modal ──────────────────────────────────────────────────────────

function CloseDayModal({ visible, onClose, records, companyId }: {
  visible: boolean;
  onClose: () => void;
  records: PerformanceRecord[];
  companyId: string;
}) {
  const [notes, setNotes] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const todayRecs = records.filter(r => r.date === today);
  const totalSalary = todayRecs.reduce((s, r) => s + r.salary, 0);
  const totalDrinks = todayRecs.reduce((s, r) => s + r.drinks, 0);
  const totalNominations = todayRecs.reduce((s, r) => s + r.nominations, 0);
  const topCast = todayRecs.sort((a, b) => b.sales - a.sales)[0]?.castName ?? '—';

  const handleClose = async () => {
    const report: DailyReport = {
      id: Date.now().toString(),
      date: today,
      notes: notes.trim(),
      totalSalary,
      totalDrinks,
      totalNominations,
      attendanceCount: todayRecs.length,
      topCast,
      closed: true,
      closedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const saved = await storage.get<DailyReport[]>(keys.dailyReports(companyId), []);
    const existingIdx = saved.findIndex(r => r.date === today);
    const updated = existingIdx >= 0
      ? saved.map((r, i) => i === existingIdx ? report : r)
      : [report, ...saved];
    await storage.set(keys.dailyReports(companyId), updated);
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>本日を締める</Text>
            <TouchableOpacity onPress={onClose}><IcoX size={20} color={C.gray4} /></TouchableOpacity>
          </View>
          <Text style={{ color: C.gray5, fontSize: 12, marginBottom: 4 }}>{today}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {[
              { label: '出勤数', value: `${todayRecs.length}人` },
              { label: '給与合計', value: fmt(totalSalary) },
              { label: 'ドリンク計', value: `${totalDrinks}杯` },
              { label: '本日No.1', value: topCast },
            ].map(item => (
              <View key={item.label} style={{ backgroundColor: '#111', borderRadius: 10, padding: 10, minWidth: '45%', flex: 1 }}>
                <Text style={{ color: C.gray5, fontSize: 10 }}>{item.label}</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginTop: 2 }}>{item.value}</Text>
              </View>
            ))}
          </View>
          <TextInput
            style={[m.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="本日のメモ（任意）"
            placeholderTextColor={C.gray5}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <TouchableOpacity onPress={handleClose} style={m.saveBtn}>
            <IcoCheck size={16} color="#000" />
            <Text style={m.saveBtnText}>締め処理を完了</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function HomeTab() {
  const { session, role, setRole } = useAuth();
  if (!session) return null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.appName}>CastBoard</Text>
        <View style={s.roleToggle}>
          <TouchableOpacity
            onPress={() => setRole('manager')}
            style={[s.roleBtn, role === 'manager' && s.roleBtnActive]}
          >
            <Text style={[s.roleBtnText, role === 'manager' && s.roleBtnTextActive]}>店舗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRole('cast')}
            style={[s.roleBtn, role === 'cast' && s.roleBtnActive]}
          >
            <Text style={[s.roleBtnText, role === 'cast' && s.roleBtnTextActive]}>キャスト</Text>
          </TouchableOpacity>
        </View>
      </View>

      {role === 'manager'
        ? <ManagerHome session={session} />
        : <CastHome />
      }
    </SafeAreaView>
  );
}

function ManagerHome({ session }: { session: { companyId: string; storeName: string } }) {
  const companyData = DEMO_ACCOUNTS[session.companyId];
  const { list: anns, add: addAnn, remove: removeAnn } = useAnnouncements(session.companyId);
  const [showModal, setShowModal] = useState(false);
  const [showCloseDay, setShowCloseDay] = useState(false);
  const [detailCast, setDetailCast] = useState<string | null>(null);
  const [records, setRecords] = useState<PerformanceRecord[]>([]);

  const loadRecords = useCallback(async () => {
    const saved = await storage.get<PerformanceRecord[]>(keys.records(session.companyId), []);
    setRecords(saved);
  }, [session.companyId]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const [monthlyGoal, setMonthlyGoal] = useState(companyData?.monthlyGoal ?? 5000000);
  useEffect(() => {
    storage.get<number>(keys.monthlyGoal(session.companyId), companyData?.monthlyGoal ?? 5000000).then(setMonthlyGoal);
  }, [session.companyId]);

  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const loadDailyReports = useCallback(async () => {
    const saved = await storage.get<DailyReport[]>(keys.dailyReports(session.companyId), []);
    setDailyReports(saved.slice(0, 10));
  }, [session.companyId]);
  useEffect(() => { loadDailyReports(); }, [loadDailyReports]);

  if (!companyData) return null;

  const stats     = aggregateManager(records);
  const trend     = monthlyTrend(records, companyData.monthlyTrend);
  const ranking   = castRanking(records);
  const pending   = pendingCount(records, CASTS);

  const monthlySales   = stats.hasData ? stats.monthlySales   : companyData.monthlySales;
  const laborCost      = stats.hasData ? stats.laborCost      : companyData.laborCost;
  const todaySales     = stats.hasData ? stats.todaySales     : companyData.todaySales;
  const prevMonthRatio = stats.hasData ? stats.prevMonthRatio : companyData.prevMonthRatio;
  const pendingEntries = stats.hasData ? pending              : companyData.pendingEntries;
  const top3 = (ranking.length > 0
    ? ranking.map(r => ({ name: r.name, sales: r.sales }))
    : [...CASTS].sort((a, b) => b.monthlySales - a.monthlySales).map(c => ({ name: c.name, sales: c.monthlySales }))
  ).slice(0, 3);

  const goalRate = pct(monthlySales, monthlyGoal);
  const trendColor = prevMonthRatio >= 0 ? '#4ADE80' : '#F87171';
  const trendSign  = prevMonthRatio >= 0 ? '+' : '';
  const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={{ marginBottom: 8 }}>
        <Text style={s.greeting}>こんばんは、{session.storeName}</Text>
        <Text style={s.date}>{today}</Text>
      </View>

      {/* Monthly sales */}
      <Card style={s.goldCard}>
        <View style={s.goldGlow} />
        <Text style={s.cardLabel}>今月売上</Text>
        <Text style={s.bigNum}>{fmt(monthlySales)}</Text>
        <Text style={s.sub}>目標 {fmt(monthlyGoal)}</Text>
        <View style={s.row}>
          <Text style={s.sub}>達成率</Text>
          <Text style={[s.sub, { color: C.gold, fontWeight: '700' }]}>{goalRate}%</Text>
        </View>
        <ProgressBar value={monthlySales} max={monthlyGoal} />
        <View style={[s.row, { marginTop: 8 }]}>
          <View style={s.rowItem}>
            <IcoTrendUp size={12} color={trendColor} />
            <Text style={{ color: trendColor, fontSize: 12 }}>前月比 {trendSign}{prevMonthRatio}%</Text>
          </View>
          <Text style={s.sub}>残り {fmt(monthlyGoal - monthlySales)}</Text>
        </View>
      </Card>

      {/* Trend chart */}
      <Card>
        <View style={[s.row, { marginBottom: 16 }]}>
          <Text style={s.cardLabel}>月間売上推移（過去6ヶ月）</Text>
          <View style={s.rowItem}>
            <IcoTrendUp size={11} color={trendColor} />
            <Text style={{ color: trendColor, fontSize: 11 }}>{trendSign}{prevMonthRatio}%</Text>
          </View>
        </View>
        <BarChart
          data={trend.map(m => ({
            label: m.month,
            value: m.sales,
            highlight: m.current,
          }))}
          goal={monthlyGoal}
          chartHeight={100}
        />
      </Card>

      {/* Stats grid */}
      <View style={s.grid2}>
        <Card style={s.gridCard}>
          <Text style={s.cardLabel}>今日の売上</Text>
          <Text style={s.midNum}>{fmt(todaySales)}</Text>
        </Card>
        <Card style={[s.gridCard, pendingEntries > 0 && { borderWidth: 1, borderColor: 'rgba(251,146,60,0.3)' }]}>
          <View style={s.row}>
            <Text style={s.cardLabel}>未入力実績</Text>
            {pendingEntries > 0 && <IcoAlertCircle size={14} color="#FB923C" />}
          </View>
          <Text style={[s.midNum, { color: pendingEntries > 0 ? '#FB923C' : '#fff' }]}>
            {pendingEntries}件
          </Text>
        </Card>
        <Card style={s.gridCard}>
          <Text style={s.cardLabel}>人件費見込み</Text>
          <Text style={s.midNum}>{fmt(laborCost)}</Text>
        </Card>
        <Card style={s.gridCard}>
          <Text style={s.cardLabel}>前月比</Text>
          <Text style={[s.midNum, { color: trendColor }]}>{trendSign}{prevMonthRatio}%</Text>
        </Card>
      </View>

      {/* Top 3 ranking */}
      <Card>
        <Text style={[s.cardLabel, { marginBottom: 12 }]}>今月売上ランキング TOP3</Text>
        <View style={{ gap: 12 }}>
          {top3.map((c, i) => {
            const colors = ['#D4AF37', '#9CA3AF', '#92400E'];
            return (
              <TouchableOpacity key={c.name} onPress={() => setDetailCast(c.name)} activeOpacity={0.8}>
                <View style={s.rankRow}>
                  <MedalIcon place={i + 1} size={24} />
                  <Avatar name={c.name} size="sm" />
                  <View style={{ flex: 1 }}>
                    <View style={s.row}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{c.name}</Text>
                      <Text style={{ color: colors[i], fontWeight: '700', fontSize: 14 }}>{fmt(c.sales)}</Text>
                    </View>
                    <ProgressBar value={c.sales} max={monthlyGoal} color={colors[i]} thin />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Close day */}
      <TouchableOpacity onPress={() => setShowCloseDay(true)} activeOpacity={0.8}
        style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
        <Text style={{ color: C.gray4, fontWeight: '700', fontSize: 14 }}>本日を締める</Text>
      </TouchableOpacity>

      {/* Announcements */}
      <View style={s.row}>
        <SectionLabel>お知らせ</SectionLabel>
        <TouchableOpacity onPress={() => setShowModal(true)} style={s.addBtn}>
          <IcoPlus size={14} color="#000" />
        </TouchableOpacity>
      </View>
      {anns.length === 0 ? (
        <Card><Text style={{ color: C.gray5, fontSize: 13, textAlign: 'center' }}>お知らせはありません</Text></Card>
      ) : (
        anns.map(a => (
          <Card key={a.id} style={a.priority === 'important' ? { borderWidth: 1, borderColor: 'rgba(251,146,60,0.4)' } : {}}>
            <View style={s.row}>
              <View style={s.rowItem}>
                <IcoBell size={13} color={a.priority === 'important' ? '#FB923C' : C.gold} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 }}>{a.title}</Text>
              </View>
              <TouchableOpacity onPress={() => removeAnn(a.id)}>
                <IcoX size={16} color={C.gray5} />
              </TouchableOpacity>
            </View>
            {a.body ? <Text style={{ color: C.gray4, fontSize: 13, marginTop: 6 }}>{a.body}</Text> : null}
            <Text style={{ color: C.gray5, fontSize: 10, marginTop: 6 }}>
              {new Date(a.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Card>
        ))
      )}

      <AnnModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={addAnn}
      />

      {dailyReports.length > 0 && (
        <>
          <SectionLabel>日報履歴</SectionLabel>
          {dailyReports.map(r => (
            <Card key={r.id}>
              <View style={[s.row, { marginBottom: 6 }]}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{r.date}</Text>
                <Text style={{ color: C.gold, fontWeight: '700', fontSize: 13 }}>{fmt(r.totalSalary)}</Text>
              </View>
              <Text style={{ color: C.gray5, fontSize: 11 }}>
                出勤 {r.attendanceCount}人 · ドリンク {r.totalDrinks}杯 · No.1 {r.topCast}
              </Text>
              {r.notes ? <Text style={{ color: C.gray4, fontSize: 12, marginTop: 6 }}>{r.notes}</Text> : null}
            </Card>
          ))}
        </>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>

    <CloseDayModal
      visible={showCloseDay}
      onClose={() => { setShowCloseDay(false); loadDailyReports(); }}
      records={records}
      companyId={session.companyId}
    />

    {detailCast && (
      <CastDetailModal
        castName={detailCast}
        records={records}
        onClose={() => setDetailCast(null)}
      />
    )}
    </>
  );
}

function CastHome() {
  const { session, castName } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const { list: anns } = useAnnouncements(companyId);
  const { readIds, markAllRead, unreadCount } = useAnnRead(companyId, anns.map(a => a.id));
  const [disp, setDisp] = useState<DisplaySettings>(DEFAULT_DISPLAY);
  const [records, setRecords] = useState<PerformanceRecord[]>([]);

  useEffect(() => {
    if (anns.length > 0) markAllRead();
  }, [anns.length]);

  useEffect(() => {
    storage.get<DisplaySettings>(keys.displaySettings(companyId, castName), DEFAULT_DISPLAY).then(setDisp);
    storage.get<PerformanceRecord[]>(keys.records(companyId), []).then(setRecords);
  }, [companyId, castName]);

  const castStats = aggregateCast(records, castName);
  const c = CASTS.find(cast => cast.name === castName) ?? CASTS[0];
  const monthlySales   = castStats.hasData ? castStats.sales  : c.monthlySales;
  const salaryEstimate = castStats.hasData ? castStats.salary : c.salaryEstimate;
  const rate = pct(monthlySales, c.monthlyGoal);
  const remaining = c.monthlyGoal - monthlySales;
  const rc = RANK_CONFIG[c.rank];
  const ranking = castRanking(records);
  const rankIdx = ranking.findIndex(r => r.name === castName);
  const storeRank = rankIdx >= 0 ? rankIdx + 1 : c.rankNum;
  const castPrevRatio = castStats.hasData ? castStats.prevMonthRatio : c.prevMonthRatio;
  const castPrevColor = castPrevRatio >= 0 ? '#4ADE80' : '#F87171';
  const castPrevSign  = castPrevRatio >= 0 ? '+' : '';
  const motivationMsg =
    rate >= 100 ? '目標達成！今月も最高です！' :
    rate >= 80  ? 'いい調子！あと少しで目標達成！' :
    rate >= 60  ? 'ペース良好、このまま続けよう！' :
    rate >= 40  ? '折り返し地点、もう一踏ん張り！' :
                  'まだまだこれから、頑張ろう！';
  const motivationColor =
    rate >= 80 ? '#4ADE80' : rate >= 40 ? C.gold : '#FB923C';

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={{ marginBottom: 8 }}>
        <Text style={s.greeting}>こんばんは、{c.name}さん</Text>
        <Text style={s.date}>{(() => {
          const t = new Date();
          const key = `${t.getDate()}`;
          return c.shifts.includes(key) ? `本日シフト · 20:00〜LAST` : '本日はオフ日';
        })()}</Text>
      </View>

      <ClockCard companyId={companyId} castName={c.name} />

      <Card style={s.goldCard}>
        <View style={s.goldGlow} />
        <Text style={s.cardLabel}>目標まであと</Text>
        <Text style={[s.bigNum, { color: C.gold }]}>{fmt(remaining)}</Text>
        <Text style={s.sub}>今月 {fmt(monthlySales)} / 目標 {fmt(c.monthlyGoal)}</Text>
        <View style={s.row}>
          <Text style={s.sub}>達成率</Text>
          <Text style={[s.sub, { color: C.gold, fontWeight: '700' }]}>{rate}%</Text>
        </View>
        <ProgressBar value={monthlySales} max={c.monthlyGoal} />
        <Text style={{ color: motivationColor, fontSize: 12, marginTop: 8 }}>{motivationMsg}</Text>
      </Card>

      {rc.next && rc.nextThreshold && (
        <Card>
          <View style={[s.row, { marginBottom: 8 }]}>
            <RankBadge rank={c.rank} color={rc.color} bg={rc.bg} border={rc.border} />
            <Text style={{ color: C.gray5, fontSize: 12 }}>→</Text>
            <Text style={{ color: RANK_CONFIG[rc.next].color, fontWeight: '700', fontSize: 12 }}>{rc.next}</Text>
            <Text style={{ color: C.gray5, fontSize: 11, marginLeft: 'auto' }}>あと {fmt(rc.nextThreshold - monthlySales)}</Text>
          </View>
          <ProgressBar value={monthlySales - rc.threshold} max={rc.nextThreshold - rc.threshold} />
        </Card>
      )}

      <View style={s.grid2}>
        {disp.showSalaryEstimate && (
          <Card style={s.gridCard}>
            <Text style={s.cardLabel}>給与見込み</Text>
            <Text style={[s.midNum, { color: C.gold }]}>{fmt(salaryEstimate)}</Text>
          </Card>
        )}
        {disp.showStoreRank && (
          <Card style={s.gridCard}>
            <Text style={s.cardLabel}>店内順位</Text>
            <Text style={s.midNum}>{storeRank}位<Text style={{ fontSize: 12, color: C.gray5 }}> / {CASTS.length}人</Text></Text>
            {disp.showPrevMonthRatio && (
              <Text style={{ color: castPrevColor, fontSize: 11, marginTop: 2 }}>{castPrevSign}{castPrevRatio}% 前月比</Text>
            )}
          </Card>
        )}
      </View>

      {/* Announcements */}
      {anns.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SectionLabel>お知らせ</SectionLabel>
            {unreadCount > 0 && (
              <View style={{ backgroundColor: C.gold, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {anns.map(a => {
            const isUnread = !readIds.includes(a.id);
            return (
              <Card key={a.id} style={[
                a.priority === 'important' ? { borderWidth: 1, borderColor: 'rgba(251,146,60,0.4)' } : {},
                isUnread ? { borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' } : {},
              ]}>
                <View style={s.rowItem}>
                  {isUnread && <View style={s.unreadDot} />}
                  <IcoBell size={13} color={a.priority === 'important' ? '#FB923C' : C.gold} />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{a.title}</Text>
                </View>
                {a.body ? <Text style={{ color: C.gray4, fontSize: 13, marginTop: 6 }}>{a.body}</Text> : null}
                <Text style={{ color: C.gray5, fontSize: 10, marginTop: 6 }}>
                  {new Date(a.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Card>
            );
          })}
        </>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  appName:   { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  roleToggle:{ flexDirection: 'row', backgroundColor: '#1f1f1f', borderRadius: 10, padding: 3 },
  roleBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  roleBtnActive: { backgroundColor: C.gold },
  roleBtnText: { fontSize: 12, fontWeight: '700', color: C.gray5 },
  roleBtnTextActive: { color: '#000' },
  scroll:    { flex: 1 },
  content:   { padding: 16, gap: 12 },
  greeting:  { fontSize: 15, color: C.gray4 },
  date:      { fontSize: 11, color: C.gray5, marginTop: 2 },
  cardLabel: { fontSize: 11, color: C.gray4, marginBottom: 4 },
  bigNum:    { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 4 },
  midNum:    { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 4 },
  sub:       { fontSize: 12, color: C.gray5, marginBottom: 4 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  grid2:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard:  { flex: 1, minWidth: '45%' },
  rankRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goldCard:  { position: 'relative', overflow: 'hidden' },
  goldGlow:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 16 },
  addBtn:    { backgroundColor: C.gold, width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold, marginRight: 4 },
});

const cl = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  timer:     { fontSize: 36, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 2, marginVertical: 8 },
  inBtn:     { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  inBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
  outBtn:    { borderWidth: 1, borderColor: C.gold, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  outBtnText:{ color: C.gold, fontWeight: '700', fontSize: 14 },
});

const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#181818', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle:   { fontSize: 16, fontWeight: '900', color: '#fff' },
  priorityRow:  { flexDirection: 'row', gap: 8 },
  priorityBtn:  { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center' },
  priorityBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(212,175,55,0.1)' },
  priorityBtnAlert:  { borderColor: '#FB923C', backgroundColor: 'rgba(251,146,60,0.1)' },
  priorityText: { fontSize: 13, fontWeight: '700', color: C.gray5 },
  input:        { backgroundColor: '#111', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15 },
  saveBtn:      { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  saveBtnText:  { color: '#000', fontWeight: '900', fontSize: 15 },
});
