import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { CASTS, RANK_CONFIG } from '../../lib/data';
import { storage, keys, fmt } from '../../lib/storage';
import { Card, ProgressBar, RankBadge, C, Avatar } from '../../components/ui';
import { IcoChevronRight, IcoSettings, IcoCheck } from '../../components/icons/Icons';
import { aggregateManager, aggregateCast, castRanking } from '../../lib/analytics';
import type { PerformanceRecord } from '../../lib/types';
// API request/response types (mirrors castboard-web/app/api/ai/*/route.ts)
type ManagerAIRequest = {
  store: { name: string; monthlySales: number; monthlyGoal: number; prevMonthRatio: number; laborCost: number; todaySales: number };
  casts: { name: string; rank: string; sales: number; goal: number; nominations: number; drinks: number; workDays: number; prevMonthRatio: number; bottleSales: number }[];
  month: string;
};
type ManagerAIResponse = {
  summary: string;
  strengths: string[];
  growthPoints: string[];
  actions: { title: string; detail: string }[];
  casts: { name: string; strength: string; challenge: string; action: string; comment: string; missionSuggestion: string }[];
  missions: { name: string; purpose: string; condition: string; reward: string; target: string }[];
};
type CastAIRequest = {
  cast: { name: string; rank: string; sales: number; goal: number; nominations: number; drinks: number; workDays: number; prevMonthRatio: number; bottleSales: number; salary: number };
  month: string;
};
type CastAIResponse = {
  todayAdvice: string;
  growingPoints: string[];
  pathToGoal: { comment: string; patterns: { label: string; desc: string }[] };
  nextSteps: { step: string; detail: string }[];
  mindset: string;
  encouragement: string;
  missionSuggestion: string;
};

// VercelにデプロイしたらこのURLを差し替える
const API_BASE = process.env.EXPO_PUBLIC_AI_API_URL ?? 'http://localhost:3010';

// ─── AICard ───────────────────────────────────────────────────────────────────

function AICard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[a.aiCard, style]}>{children}</View>;
}

function AILabel({ label }: { label: string }) {
  return (
    <View style={a.aiLabelWrap}>
      <Text style={a.aiLabelText}>✦ {label}</Text>
    </View>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function BulletRow({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <View style={a.bulletRow}>
      <Text style={[a.bulletIcon, { color }]}>{icon}</Text>
      <Text style={a.bulletText}>{text}</Text>
    </View>
  );
}

function ActionRow({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <View style={a.actionRow}>
      <View style={a.actionNum}><Text style={a.actionNumText}>{n}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={a.actionTitle}>{title}</Text>
        <Text style={a.actionDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function LoadingCard() {
  return (
    <AICard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
        <ActivityIndicator color={C.gold} />
        <Text style={a.aiLabelText}>AI が分析中...</Text>
      </View>
    </AICard>
  );
}

// ─── CastAICard (expandable) ─────────────────────────────────────────────────

type CastStatItem = {
  name: string;
  sales: number;
  nominations: number;
  drinks: number;
  workDays: number;
  prevMonthRatio: number;
  bottleSales: number;
  salary: number;
};

type CastAIResult = ManagerAIResponse['casts'][0];

function CastAICard({ stats, goal, aiResult }: {
  stats: CastStatItem;
  goal: number;
  aiResult?: CastAIResult;
}) {
  const [open, setOpen] = useState(false);
  const c = CASTS.find(x => x.name === stats.name);
  const rc = RANK_CONFIG[c?.rank ?? 'Regular'];
  const rate = Math.min(100, Math.round((stats.sales / goal) * 100));

  return (
    <AICard>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Avatar name={stats.name} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={a.castName}>{stats.name}</Text>
              <RankBadge rank={c?.rank ?? 'Regular'} color={rc.color} bg={rc.bg} border={rc.border} />
            </View>
            <Text style={a.castSub}>{fmt(stats.sales)} / 目標 {fmt(goal)}</Text>
          </View>
        </View>
        <IcoChevronRight size={14} color={open ? C.gold : C.gray5} />
      </TouchableOpacity>

      {open && (
        <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.15)', paddingTop: 14, gap: 10 }}>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={a.subLabel}>達成率</Text>
              <Text style={[a.subLabel, { color: C.gold }]}>{rate}%</Text>
            </View>
            <ProgressBar value={stats.sales} max={goal} color={rc.color} thin />
          </View>

          <View style={a.statsRow}>
            {[
              { val: String(stats.nominations), key: '指名' },
              { val: String(stats.drinks),       key: 'ドリンク' },
              { val: `${stats.prevMonthRatio >= 0 ? '+' : ''}${stats.prevMonthRatio}%`, key: '前月比', color: stats.prevMonthRatio >= 0 ? '#4ADE80' : '#F87171' },
            ].map(item => (
              <View key={item.key} style={a.statBox}>
                <Text style={[a.statVal, item.color ? { color: item.color } : {}]}>{item.val}</Text>
                <Text style={a.statKey}>{item.key}</Text>
              </View>
            ))}
          </View>

          {aiResult ? (
            <>
              {[
                { label: '✦ 強み',      text: aiResult.strength },
                { label: '✦ 伸びしろ',  text: aiResult.challenge },
                { label: '✦ アクション', text: aiResult.action },
                { label: '💬 声かけ例', text: aiResult.comment },
              ].map(item => (
                <View key={item.label} style={a.infoBox}>
                  <Text style={a.infoLabel}>{item.label}</Text>
                  <Text style={a.infoText}>{item.text}</Text>
                </View>
              ))}
            </>
          ) : (
            <View style={a.infoBox}>
              <ActivityIndicator color={C.gold} size="small" />
            </View>
          )}
        </View>
      )}
    </AICard>
  );
}

// ─── MissionCard ──────────────────────────────────────────────────────────────

function MissionCard({ mission, index }: {
  mission: ManagerAIResponse['missions'][0];
  index: number;
}) {
  const [created, setCreated] = useState(false);
  return (
    <AICard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={a.missionNum}><Text style={a.missionNumText}>{index + 1}</Text></View>
        <Text style={[a.castName, { flex: 1 }]}>{mission.name}</Text>
        <View style={a.rewardBadge}><Text style={a.rewardText}>{mission.reward}</Text></View>
      </View>

      {[
        { k: '目的', v: mission.purpose },
        { k: '条件', v: mission.condition },
        { k: '対象', v: mission.target },
      ].map(row => (
        <View key={row.k} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          <Text style={[a.subLabel, { width: 36 }]}>{row.k}</Text>
          <Text style={[a.infoText, { flex: 1 }]}>{row.v}</Text>
        </View>
      ))}

      <TouchableOpacity
        onPress={() => setCreated(true)}
        disabled={created}
        style={[a.createBtn, created && a.createBtnDone]}
        activeOpacity={0.8}
      >
        {created && <IcoCheck size={13} color={C.gold} />}
        <Text style={[a.createBtnText, created && { color: C.gold }]}>
          {created ? '作成済み' : 'このミッションを作成'}
        </Text>
      </TouchableOpacity>
    </AICard>
  );
}

// ─── Manager AI ──────────────────────────────────────────────────────────────

function ManagerAI() {
  const router = useRouter();
  const { session } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState(5_000_000);
  const [aiData, setAiData] = useState<ManagerAIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    storage.get<PerformanceRecord[]>(keys.records(companyId), []).then(setRecords);
    storage.get<number>(keys.monthlyGoal(companyId), 5_000_000).then(setMonthlyGoal);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const mgr = aggregateManager(records);
  const ranking = castRanking(records);
  const salesPct = Math.min(100, Math.round((mgr.monthlySales / monthlyGoal) * 100));
  const remaining = monthlyGoal - mgr.monthlySales;

  const castStats: CastStatItem[] = CASTS.map(c => {
    const r = ranking.find(x => x.name === c.name);
    return {
      name: c.name,
      sales:          r?.sales       ?? c.monthlySales,
      nominations:    r?.nominations ?? c.nominations,
      drinks:         r?.drinks      ?? c.drinks,
      workDays:       r?.workDays    ?? c.workDays,
      prevMonthRatio: c.prevMonthRatio,
      bottleSales:    c.bottleSales,
      salary:         r?.salary      ?? c.salaryEstimate,
    };
  });

  const fetchAI = async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const body: ManagerAIRequest = {
      store: {
        name: session?.storeName ?? '店舗',
        monthlySales: mgr.monthlySales,
        monthlyGoal,
        prevMonthRatio: mgr.prevMonthRatio,
        laborCost: mgr.laborCost,
        todaySales: mgr.todaySales,
      },
      casts: castStats.map(cs => ({
        name: cs.name,
        rank: CASTS.find(c => c.name === cs.name)?.rank ?? 'Regular',
        sales: cs.sales,
        goal: CASTS.find(c => c.name === cs.name)?.monthlyGoal ?? monthlyGoal / CASTS.length,
        nominations: cs.nominations,
        drinks: cs.drinks,
        workDays: cs.workDays,
        prevMonthRatio: cs.prevMonthRatio,
        bottleSales: cs.bottleSales,
      })),
      month: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    };

    try {
      const res = await fetch(`${API_BASE}/api/ai/manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('APIエラー');
      setAiData(await res.json());
    } catch {
      setError('AI分析の取得に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  return (
    <SafeAreaView style={a.safe} edges={['top']}>
      <View style={a.header}>
        <Text style={a.title}>AI マネージャー分析</Text>
        <Text style={a.headerSub}>{now.getFullYear()}年{now.getMonth() + 1}月</Text>
      </View>
      <ScrollView style={a.scroll} contentContainerStyle={a.content} showsVerticalScrollIndicator={false}>

        {/* Store summary */}
        <AICard>
          <AILabel label="店舗サマリー" />
          <View style={[a.statsRow, { marginTop: 10, marginBottom: 10 }]}>
            {[
              { label: '今月売上', val: fmt(mgr.monthlySales) },
              { label: '月間目標', val: fmt(monthlyGoal) },
              { label: '前月比',   val: `${mgr.prevMonthRatio >= 0 ? '+' : ''}${mgr.prevMonthRatio}%`, color: mgr.prevMonthRatio >= 0 ? '#4ADE80' : '#F87171' },
              { label: '人件費',   val: fmt(mgr.laborCost) },
            ].map(item => (
              <View key={item.label} style={a.summaryBox}>
                <Text style={a.subLabel}>{item.label}</Text>
                <Text style={[a.summaryVal, item.color ? { color: item.color } : {}]}>{item.val}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={a.subLabel}>達成率</Text>
              <Text style={[a.subLabel, { color: C.gold }]}>{salesPct}%</Text>
            </View>
            <ProgressBar value={mgr.monthlySales} max={monthlyGoal} />
            {remaining > 0 && <Text style={[a.subLabel, { textAlign: 'right', marginTop: 4 }]}>残り {fmt(remaining)}</Text>}
          </View>
          {aiData ? (
            <Text style={a.aiComment}>{aiData.summary}</Text>
          ) : (
            <TouchableOpacity
              style={[a.analyzeBtn, loading && { opacity: 0.6 }]}
              onPress={fetchAI}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={a.analyzeBtnText}>✦ AI分析を開始する</Text>
              }
            </TouchableOpacity>
          )}
          {error && <Text style={a.errorText}>{error}</Text>}
        </AICard>

        {/* Strengths */}
        {aiData ? (
          <Card>
            <Text style={a.sectionTitle}>今月の強み</Text>
            {aiData.strengths.map(s => <BulletRow key={s} icon="✓" text={s} color="#4ADE80" />)}
          </Card>
        ) : loading ? <LoadingCard /> : null}

        {/* Growth points */}
        {aiData ? (
          <Card>
            <Text style={a.sectionTitle}>伸ばせるポイント</Text>
            {aiData.growthPoints.map(s => <BulletRow key={s} icon="→" text={s} color={C.gold} />)}
          </Card>
        ) : null}

        {/* This week's actions */}
        {aiData ? (
          <AICard>
            <AILabel label="今週のアクション" />
            <View style={{ marginTop: 12, gap: 12 }}>
              {aiData.actions.map((item, i) => (
                <ActionRow key={i} n={i + 1} title={item.title} detail={item.detail} />
              ))}
            </View>
          </AICard>
        ) : null}

        {/* Per-cast AI analysis */}
        <Text style={a.sectionHeader}>キャスト別AI分析</Text>
        {castStats.map(cs => (
          <CastAICard
            key={cs.name}
            stats={cs}
            goal={CASTS.find(c => c.name === cs.name)?.monthlyGoal ?? monthlyGoal / CASTS.length}
            aiResult={aiData?.casts.find(r => r.name === cs.name)}
          />
        ))}

        {/* Mission suggestions */}
        {aiData?.missions?.length ? (
          <>
            <Text style={a.sectionHeader}>AIミッション提案</Text>
            {aiData.missions.map((m, i) => <MissionCard key={m.name} mission={m} index={i} />)}
          </>
        ) : null}

        <TouchableOpacity
          style={a.settingsBtn}
          onPress={() => router.navigate('/settings' as never)}
          activeOpacity={0.8}
        >
          <IcoSettings size={16} color={C.gray5} />
          <Text style={a.settingsBtnText}>設定</Text>
          <IcoChevronRight size={14} color={C.gray5} />
        </TouchableOpacity>

        {aiData && (
          <Text style={a.disclaimer}>
            ※ このAI分析はOpenAI GPT-4oにより生成されています。実際の判断はご自身の経験と組み合わせてご活用ください。
          </Text>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Cast AI ─────────────────────────────────────────────────────────────────

function CastAI() {
  const router = useRouter();
  const { session, castName } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [aiData, setAiData] = useState<CastAIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    storage.get<PerformanceRecord[]>(keys.records(companyId), []).then(setRecords);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const castData = CASTS.find(c => c.name === castName) ?? CASTS[0];
  const cs = aggregateCast(records, castName);

  const stats = {
    sales:          cs.hasData ? cs.sales          : castData.monthlySales,
    nominations:    cs.hasData ? cs.nominations    : castData.nominations,
    drinks:         cs.hasData ? cs.drinks         : castData.drinks,
    workDays:       cs.hasData ? cs.workDays       : castData.workDays,
    bottleSales:    cs.hasData ? cs.bottleSales    : castData.bottleSales,
    prevMonthRatio: cs.hasData ? cs.prevMonthRatio : castData.prevMonthRatio,
    salary:         cs.hasData ? cs.salary         : castData.salaryEstimate,
  };

  const goal = castData.monthlyGoal;
  const rate = Math.min(100, Math.round((stats.sales / goal) * 100));
  const remaining = goal - stats.sales;

  const fetchAI = async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const body: CastAIRequest = {
      cast: {
        name: castName,
        rank: castData.rank,
        sales: stats.sales,
        goal,
        nominations: stats.nominations,
        drinks: stats.drinks,
        workDays: stats.workDays,
        prevMonthRatio: stats.prevMonthRatio,
        bottleSales: stats.bottleSales,
        salary: stats.salary,
      },
      month: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    };

    try {
      const res = await fetch(`${API_BASE}/api/ai/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('APIエラー');
      setAiData(await res.json());
    } catch {
      setError('AIコーチの取得に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  return (
    <SafeAreaView style={a.safe} edges={['top']}>
      <View style={a.header}>
        <Text style={a.title}>AI コーチ</Text>
        <Text style={a.headerSub}>{castName}さんへ</Text>
      </View>
      <ScrollView style={a.scroll} contentContainerStyle={a.content} showsVerticalScrollIndicator={false}>

        {/* Stats summary */}
        <AICard>
          <AILabel label={`${now.getFullYear()}年${now.getMonth() + 1}月 状況`} />
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={a.subLabel}>達成率</Text>
              <Text style={[a.subLabel, { color: C.gold }]}>{rate}%</Text>
            </View>
            <ProgressBar value={stats.sales} max={goal} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={a.subLabel}>{fmt(stats.sales)}</Text>
              <Text style={a.subLabel}>目標 {fmt(goal)}</Text>
            </View>
          </View>
          <View style={[a.statsRow, { marginBottom: 12 }]}>
            {[
              { val: `${stats.nominations}本`, key: '指名' },
              { val: `${stats.drinks}杯`,      key: 'ドリンク' },
              { val: `${stats.workDays}日`,    key: '出勤' },
              { val: `${stats.prevMonthRatio >= 0 ? '+' : ''}${stats.prevMonthRatio}%`, key: '前月比', color: stats.prevMonthRatio >= 0 ? '#4ADE80' : '#F87171' },
            ].map(item => (
              <View key={item.key} style={a.statBox}>
                <Text style={[a.statVal, item.color ? { color: item.color } : {}]}>{item.val}</Text>
                <Text style={a.statKey}>{item.key}</Text>
              </View>
            ))}
          </View>

          {!aiData && (
            <TouchableOpacity
              style={[a.analyzeBtn, loading && { opacity: 0.6 }]}
              onPress={fetchAI}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={a.analyzeBtnText}>✦ AIコーチに相談する</Text>
              }
            </TouchableOpacity>
          )}
          {error && <Text style={a.errorText}>{error}</Text>}
        </AICard>

        {loading && <LoadingCard />}

        {/* AI results */}
        {aiData && (
          <>
            <AICard>
              <AILabel label="今日のアドバイス" />
              <Text style={[a.aiComment, { marginTop: 10 }]}>{aiData.todayAdvice}</Text>
            </AICard>

            <Card>
              <Text style={a.sectionTitle}>伸びているポイント</Text>
              {aiData.growingPoints.map(s => <BulletRow key={s} icon="↑" text={s} color="#4ADE80" />)}
            </Card>

            <AICard>
              <AILabel label="目標までの道のり" />
              <Text style={[a.infoText, { marginTop: 10, marginBottom: 10 }]}>{aiData.pathToGoal.comment}</Text>
              <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.12)', paddingTop: 12, gap: 8 }}>
                <Text style={[a.aiLabelText, { marginBottom: 4 }]}>✦ 達成パターン例</Text>
                {aiData.pathToGoal.patterns.map(p => (
                  <View key={p.label} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                    <View style={a.patternTag}><Text style={a.patternTagText}>{p.label}</Text></View>
                    <Text style={[a.infoText, { flex: 1 }]}>{p.desc}</Text>
                  </View>
                ))}
              </View>
            </AICard>

            <Card>
              <Text style={a.sectionTitle}>次の一歩</Text>
              <View style={{ gap: 12 }}>
                {aiData.nextSteps.map((item, i) => (
                  <ActionRow key={i} n={i + 1} title={item.step} detail={item.detail} />
                ))}
              </View>
            </Card>

            <Card>
              <Text style={a.sectionTitle}>今月意識したいこと</Text>
              <Text style={a.infoText}>{aiData.mindset}</Text>
            </Card>

            <AICard>
              <Text style={a.encourageTitle}>✦ AIからの応援 ✦</Text>
              <Text style={a.encourageText}>{aiData.encouragement}</Text>
              <View style={a.missionChip}>
                <Text style={a.missionChipText}>おすすめ：{aiData.missionSuggestion}</Text>
              </View>
            </AICard>

            <Text style={a.disclaimer}>
              ※ このAIコーチの内容はOpenAI GPT-4oにより生成されています。数値や状況に合わせてご自身のペースで参考にしてください。
            </Text>
          </>
        )}

        <TouchableOpacity
          style={a.settingsBtn}
          onPress={() => router.navigate('/settings' as never)}
          activeOpacity={0.8}
        >
          <IcoSettings size={16} color={C.gray5} />
          <Text style={a.settingsBtnText}>設定</Text>
          <IcoChevronRight size={14} color={C.gray5} />
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };

function AIChat() {
  const { session, role, castName } = useAuth();
  const companyId = session?.companyId ?? 'demo';
  const flatRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', text: role === 'manager'
      ? '店舗の売上・キャスト・ミッションについて何でも聞いてください。'
      : `${castName}さん、何でも相談してください！` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.text })),
          context: { companyId, role, castName: role === 'cast' ? castName : undefined },
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.message ?? 'エラーが発生しました。';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={a.safe} edges={['top']}>
      <View style={a.header}>
        <Text style={a.title}>AIチャット</Text>
        <Text style={a.headerSub}>{role === 'manager' ? 'マネージャーモード' : `${castName}さん`}</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[ch.bubble, item.role === 'user' ? ch.userBubble : ch.aiBubble]}>
              {item.role === 'assistant' && (
                <View style={ch.aiTag}><Text style={ch.aiTagText}>✦ AI</Text></View>
              )}
              <Text style={[ch.bubbleText, item.role === 'user' && { color: '#000' }]}>{item.text}</Text>
            </View>
          )}
        />
        {loading && (
          <View style={ch.typingRow}>
            <ActivityIndicator size="small" color={C.gold} />
            <Text style={ch.typingText}>AIが考えています...</Text>
          </View>
        )}
        <View style={ch.inputRow}>
          <TextInput
            style={ch.input}
            value={input}
            onChangeText={setInput}
            placeholder="メッセージを入力..."
            placeholderTextColor={C.gray5}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!input.trim() || loading}
            style={[ch.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
            activeOpacity={0.8}
          >
            <Text style={ch.sendText}>送信</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

type AIMode = 'analysis' | 'chat';

export default function AITab() {
  const { role } = useAuth();
  const [mode, setMode] = useState<AIMode>('analysis');

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={ch.modeSwitcher}>
        {(['analysis', 'chat'] as AIMode[]).map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={[ch.modeBtn, mode === m && ch.modeBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[ch.modeBtnText, mode === m && { color: '#000' }]}>
              {m === 'analysis' ? 'AI分析' : 'チャット'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {mode === 'analysis'
        ? (role === 'manager' ? <ManagerAI /> : <CastAI />)
        : <AIChat />
      }
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const a = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  header:         { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:          { fontSize: 18, fontWeight: '900', color: '#fff' },
  headerSub:      { fontSize: 12, color: C.gray5 },
  scroll:         { flex: 1 },
  content:        { padding: 16, gap: 12 },

  aiCard:         { backgroundColor: '#181818', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', borderRadius: 16, padding: 14 },
  aiLabelWrap:    { alignSelf: 'flex-start', backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  aiLabelText:    { fontSize: 11, fontWeight: '700', color: C.gold },
  aiComment:      { fontSize: 13, color: '#ddd', lineHeight: 20 },

  sectionTitle:   { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 10 },
  sectionHeader:  { fontSize: 13, fontWeight: '700', color: C.gold, marginTop: 4, marginBottom: 4 },
  subLabel:       { fontSize: 11, color: C.gray5 },

  bulletRow:      { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  bulletIcon:     { fontSize: 12, fontWeight: '700', width: 14, marginTop: 2 },
  bulletText:     { fontSize: 12, color: '#ccc', flex: 1, lineHeight: 18 },

  actionRow:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  actionNum:      { width: 22, height: 22, borderRadius: 11, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  actionNumText:  { fontSize: 11, fontWeight: '900', color: '#000' },
  actionTitle:    { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  actionDetail:   { fontSize: 11, color: C.gray4, lineHeight: 16 },

  castName:       { fontSize: 14, fontWeight: '700', color: '#fff' },
  castSub:        { fontSize: 11, color: C.gray5, marginTop: 2 },
  statsRow:       { flexDirection: 'row', gap: 6 },
  statBox:        { flex: 1, backgroundColor: '#111', borderRadius: 10, padding: 8, alignItems: 'center' },
  statVal:        { fontSize: 14, fontWeight: '700', color: '#fff' },
  statKey:        { fontSize: 9, color: C.gray5, marginTop: 2 },
  infoBox:        { backgroundColor: '#111', borderRadius: 10, padding: 10 },
  infoLabel:      { fontSize: 10, fontWeight: '700', color: C.gold, marginBottom: 4 },
  infoText:       { fontSize: 12, color: '#ccc', lineHeight: 18 },

  missionNum:     { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(212,175,55,0.2)', alignItems: 'center', justifyContent: 'center' },
  missionNumText: { fontSize: 11, fontWeight: '700', color: C.gold },
  rewardBadge:    { backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  rewardText:     { fontSize: 11, fontWeight: '700', color: C.gold },
  createBtn:      { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.gold, borderRadius: 10, paddingVertical: 10 },
  createBtnDone:  { backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)' },
  createBtnText:  { fontSize: 13, fontWeight: '700', color: '#000' },

  summaryBox:     { flex: 1, backgroundColor: '#111', borderRadius: 10, padding: 8, alignItems: 'center' },
  summaryVal:     { fontSize: 12, fontWeight: '700', color: '#fff', marginTop: 3 },

  patternTag:     { backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 2 },
  patternTagText: { fontSize: 9, fontWeight: '700', color: C.gold },

  encourageTitle: { fontSize: 13, fontWeight: '700', color: C.gold, textAlign: 'center', marginBottom: 10 },
  encourageText:  { fontSize: 13, color: '#ddd', lineHeight: 20, textAlign: 'center' },
  missionChip:    { marginTop: 12, alignSelf: 'center', backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  missionChipText:{ fontSize: 12, fontWeight: '700', color: C.gold },

  analyzeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gold, borderRadius: 12, paddingVertical: 12, gap: 6 },
  analyzeBtnText: { fontSize: 14, fontWeight: '900', color: '#000' },
  errorText:      { fontSize: 12, color: '#F87171', textAlign: 'center', marginTop: 8 },

  settingsBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14, marginTop: 4 },
  settingsBtnText:{ fontSize: 14, color: C.gray4, flex: 1, marginLeft: 10 },
  disclaimer:     { fontSize: 10, color: C.gray5, lineHeight: 16, textAlign: 'center', paddingHorizontal: 8, marginTop: 4 },
});

const ch = StyleSheet.create({
  modeSwitcher:  { flexDirection: 'row', backgroundColor: '#111', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, padding: 4 },
  modeBtn:       { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: { backgroundColor: C.gold },
  modeBtnText:   { fontSize: 13, fontWeight: '700', color: C.gray4 },

  bubble:        { maxWidth: '85%', borderRadius: 16, padding: 12 },
  userBubble:    { alignSelf: 'flex-end', backgroundColor: C.gold },
  aiBubble:      { alignSelf: 'flex-start', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  bubbleText:    { fontSize: 13, color: '#ddd', lineHeight: 20 },
  aiTag:         { marginBottom: 6 },
  aiTagText:     { fontSize: 10, fontWeight: '700', color: C.gold },

  typingRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingText:    { fontSize: 12, color: C.gray5 },

  inputRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  input:         { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 100 },
  sendBtn:       { backgroundColor: C.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  sendText:      { fontSize: 13, fontWeight: '900', color: '#000' },
});
