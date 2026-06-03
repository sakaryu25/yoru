import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { CASTS, RANK_CONFIG } from '../lib/data';
import { fmt } from '../lib/storage';
import { aggregateCast } from '../lib/analytics';
import { Card, Avatar, RankBadge, C } from './ui';
import { IcoX } from './icons/Icons';
import { BarChart } from './charts/BarChart';
import type { PerformanceRecord } from '../lib/types';

export function CastDetailModal({ castName, records, onClose }: {
  castName: string;
  records: PerformanceRecord[];
  onClose: () => void;
}) {
  const cast = CASTS.find(c => c.name === castName);
  if (!cast) return null;

  const cs = aggregateCast(records, castName);
  const stats = {
    sales:       cs.hasData ? cs.sales       : cast.monthlySales,
    salary:      cs.hasData ? cs.salary      : cast.salaryEstimate,
    nominations: cs.hasData ? cs.nominations : cast.nominations,
    drinks:      cs.hasData ? cs.drinks      : cast.drinks,
    workDays:    cs.hasData ? cs.workDays    : cast.workDays,
    bottleSales: cs.hasData ? cs.bottleSales : cast.bottleSales,
    weeklySales: cs.hasData ? cs.weeklySales : cast.weeklySales,
  };
  const rc = RANK_CONFIG[cast.rank];
  const castRecords = records
    .filter(r => r.castName === castName)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Avatar name={castName} />
              <View>
                <Text style={s.castName}>{castName}</Text>
                <RankBadge rank={cast.rank} color={rc.color} bg={rc.bg} border={rc.border} />
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <IcoX size={20} color={C.gray4} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.grid}>
              {[
                { label: '今月売上',  value: fmt(stats.sales) },
                { label: '給与見込',  value: fmt(stats.salary) },
                { label: '指名数',    value: `${stats.nominations}本` },
                { label: 'ドリンク',  value: `${stats.drinks}杯` },
                { label: '出勤日数',  value: `${stats.workDays}日` },
                { label: 'ボトル',    value: fmt(stats.bottleSales) },
              ].map(item => (
                <Card key={item.label} style={s.statCard}>
                  <Text style={s.statLabel}>{item.label}</Text>
                  <Text style={s.statValue}>{item.value}</Text>
                </Card>
              ))}
            </View>

            <Card style={{ marginTop: 10 }}>
              <Text style={{ color: C.gray5, fontSize: 11, marginBottom: 12 }}>週間売上</Text>
              <BarChart
                data={stats.weeklySales.map((v, i) => ({
                  label: `${i + 1}週`,
                  value: v,
                  highlight: i === stats.weeklySales.length - 1,
                }))}
                chartHeight={80}
                showAllLabels
              />
            </Card>

            {castRecords.length > 0 && (
              <>
                <Text style={s.sectionTitle}>直近の実績</Text>
                {castRecords.map(r => (
                  <Card key={r.id} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{r.date}</Text>
                        <Text style={{ color: C.gray5, fontSize: 11, marginTop: 2 }}>
                          {r.hours}h · 指名{r.nominations} · ドリンク{r.drinks}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: C.gold, fontWeight: '900', fontSize: 15 }}>{fmt(r.salary)}</Text>
                        <Text style={{ color: C.gray5, fontSize: 10, marginTop: 2 }}>売上 {fmt(r.sales)}</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#181818', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '88%' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  castName:     { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 4 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard:     { flex: 1, minWidth: '30%', alignItems: 'center', paddingVertical: 12 },
  statLabel:    { fontSize: 10, color: C.gray5, marginBottom: 4 },
  statValue:    { fontSize: 13, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: 11, color: C.gray5, fontWeight: '700', marginTop: 16, marginBottom: 4 },
});
