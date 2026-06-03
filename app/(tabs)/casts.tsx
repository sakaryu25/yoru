import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/AuthContext';
import { CASTS, RANK_CONFIG } from '../../lib/data';
import { storage, keys, fmt, pct, DEFAULT_DISPLAY } from '../../lib/storage';
import { Card, ProgressBar, Avatar, RankBadge, C } from '../../components/ui';
import { IcoTrendUp, IcoChevronRight } from '../../components/icons/Icons';
import { BarChart } from '../../components/charts/BarChart';
import { CastDetailModal } from '../../components/CastDetailModal';
import type { DisplaySettings, PerformanceRecord } from '../../lib/types';
import { aggregateCast, castRanking } from '../../lib/analytics';

export default function CastsTab() {
  const { role } = useAuth();
  return role === 'manager' ? <ManagerCasts /> : <CastStats />;
}

function ManagerCasts() {
  const { session } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [selectedCast, setSelectedCast] = useState<string | null>(null);

  useEffect(() => {
    storage.get<PerformanceRecord[]>(keys.records(companyId), []).then(setRecords);
  }, [companyId]);

  const rankMap = Object.fromEntries(castRanking(records).map(r => [r.name, r]));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>キャスト一覧</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {CASTS.map(c => {
          const rc = RANK_CONFIG[c.rank];
          const real = rankMap[c.name];
          const monthlySales = real ? real.sales       : c.monthlySales;
          const nominations  = real ? real.nominations : c.nominations;
          const workDays     = real ? real.workDays    : c.workDays;
          const rate = pct(monthlySales, c.monthlyGoal);
          return (
            <TouchableOpacity key={c.id} onPress={() => setSelectedCast(c.name)} activeOpacity={0.8}>
              <Card>
                <View style={s.row}>
                  <Avatar name={c.name} />
                  <View style={{ flex: 1 }}>
                    <View style={[s.row, { marginBottom: 4 }]}>
                      <Text style={s.name}>{c.name}</Text>
                      <RankBadge rank={c.rank} color={rc.color} bg={rc.bg} border={rc.border} />
                    </View>
                    <Text style={s.sub}>{workDays}日出勤 · 指名{nominations}本</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.sales}>{fmt(monthlySales)}</Text>
                      <Text style={s.sub}>{rate}%</Text>
                    </View>
                    <IcoChevronRight size={14} color={C.gray6} />
                  </View>
                </View>
                <View style={{ marginTop: 8 }}>
                  <ProgressBar value={monthlySales} max={c.monthlyGoal} color={rc.color} thin />
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {selectedCast && (
        <CastDetailModal
          castName={selectedCast}
          records={records}
          onClose={() => setSelectedCast(null)}
        />
      )}
    </SafeAreaView>
  );
}

function CastStats() {
  const { session, castName } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const [disp, setDisp] = useState<DisplaySettings>(DEFAULT_DISPLAY);
  const [records, setRecords] = useState<PerformanceRecord[]>([]);

  useEffect(() => {
    storage.get<DisplaySettings>(keys.displaySettings(companyId, castName), DEFAULT_DISPLAY).then(setDisp);
    storage.get<PerformanceRecord[]>(keys.records(companyId), []).then(setRecords);
  }, [companyId, castName]);

  const castStats = aggregateCast(records, castName);
  const c = CASTS.find(c => c.name === castName) ?? CASTS[0];

  const stats = {
    sales:          castStats.hasData ? castStats.sales          : c.monthlySales,
    salary:         castStats.hasData ? castStats.salary         : c.salaryEstimate,
    nominations:    castStats.hasData ? castStats.nominations    : c.nominations,
    drinks:         castStats.hasData ? castStats.drinks         : c.drinks,
    workDays:       castStats.hasData ? castStats.workDays       : c.workDays,
    bottleSales:    castStats.hasData ? castStats.bottleSales    : c.bottleSales,
    weeklySales:    castStats.hasData ? castStats.weeklySales    : c.weeklySales,
    prevMonthRatio: castStats.hasData ? castStats.prevMonthRatio : c.prevMonthRatio,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>マイ成績</Text>
        <Text style={{ fontSize: 12, color: C.gray5 }}>{castName}</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.grid3}>
          {[
            { label: '今月売上', value: fmt(stats.sales), always: true },
            { label: '指名数',   value: `${stats.nominations}本`, always: true },
            { label: 'ドリンク', value: `${stats.drinks}杯`, always: true },
            { label: '出勤日数', value: `${stats.workDays}日`, always: true },
            { label: 'ボトル',   value: fmt(stats.bottleSales), always: true },
            { label: '給与見込', value: fmt(stats.salary), always: false, show: disp.showSalaryEstimate },
          ].filter(item => item.always || item.show).map(item => (
            <Card key={item.label} style={{ flex: 1, minWidth: '30%', alignItems: 'center', paddingVertical: 12 }}>
              <Text style={s.sub}>{item.label}</Text>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginTop: 4 }}>{item.value}</Text>
            </Card>
          ))}
        </View>

        <Card>
          <Text style={[s.sub, { marginBottom: 16 }]}>週間売上推移</Text>
          <BarChart
            data={stats.weeklySales.map((v, i) => ({
              label: `${i + 1}週`,
              value: v,
              highlight: i === stats.weeklySales.length - 1,
            }))}
            chartHeight={90}
            showAllLabels
          />
        </Card>

        {disp.showPrevMonthRatio && (
          <Card>
            <View style={[s.row, { marginBottom: 4 }]}>
              <Text style={s.sub}>前月比</Text>
              <Text style={{ color: stats.prevMonthRatio >= 0 ? '#4ADE80' : '#F87171', fontWeight: '700' }}>
                {stats.prevMonthRatio >= 0 ? '+' : ''}{stats.prevMonthRatio}%
              </Text>
            </View>
            <View style={s.row}>
              <IcoTrendUp size={16} color={stats.prevMonthRatio >= 0 ? '#4ADE80' : '#F87171'} />
              <Text style={{ color: C.gray4, fontSize: 13, flex: 1, marginLeft: 8 }}>
                {stats.prevMonthRatio >= 0 ? '今月のペース良好です' : '先月より売上が下がっています'}
              </Text>
            </View>
          </Card>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  header:  { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:   { fontSize: 18, fontWeight: '900', color: '#fff' },
  scroll:  { flex: 1 },
  content: { padding: 16, gap: 12 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name:    { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  sales:   { fontSize: 14, fontWeight: '700', color: C.gold },
  sub:     { fontSize: 11, color: C.gray5 },
  grid3:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
