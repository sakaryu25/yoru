import type { PerformanceRecord } from './types';

const monthStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const todayStr  = () => new Date().toISOString().split('T')[0];

export function aggregateManager(records: PerformanceRecord[]) {
  const now   = new Date();
  const thisM = monthStr(now);
  const prevM = monthStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const thisMonth = records.filter(r => r.date.startsWith(thisM));
  const prevMonth = records.filter(r => r.date.startsWith(prevM));
  const today     = records.filter(r => r.date === todayStr());

  const sum = (rs: PerformanceRecord[], key: keyof PerformanceRecord) =>
    rs.reduce((s, r) => s + (Number(r[key]) || 0), 0);

  const monthlySales = sum(thisMonth, 'sales');
  const prevSales    = sum(prevMonth, 'sales');
  const laborCost    = sum(thisMonth, 'salary');
  const todaySales   = sum(today, 'sales');

  const prevMonthRatio = prevSales > 0
    ? Math.round(((monthlySales - prevSales) / prevSales) * 100)
    : 0;

  return { monthlySales, laborCost, todaySales, prevMonthRatio, hasData: records.length > 0 };
}

export function monthlyTrend(records: PerformanceRecord[], fallback: { month: string; sales: number; current?: boolean }[]) {
  const now = new Date();

  return Array.from({ length: 6 }, (_, i) => {
    const d      = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const prefix = monthStr(d);
    const label  = `${d.getMonth() + 1}`;
    const isCurr = i === 5;

    const realSales = records
      .filter(r => r.date.startsWith(prefix))
      .reduce((s, r) => s + (r.sales || 0), 0);

    // current month: use real data; past months: use real if exists, else fallback
    const fb = fallback[i];
    const sales = realSales > 0 ? realSales : (fb?.sales ?? 0);

    return { month: label, sales, current: isCurr };
  });
}

export function castRanking(records: PerformanceRecord[]) {
  const now   = new Date();
  const thisM = monthStr(now);
  const monthly = records.filter(r => r.date.startsWith(thisM));

  const map: Record<string, { sales: number; salary: number; nominations: number; drinks: number; workDays: Set<string> }> = {};
  for (const r of monthly) {
    if (!map[r.castName]) map[r.castName] = { sales: 0, salary: 0, nominations: 0, drinks: 0, workDays: new Set() };
    map[r.castName].sales       += r.sales || 0;
    map[r.castName].salary      += r.salary || 0;
    map[r.castName].nominations += r.nominations || 0;
    map[r.castName].drinks      += r.drinks || 0;
    map[r.castName].workDays.add(r.date);
  }

  return Object.entries(map)
    .map(([name, v]) => ({ name, ...v, workDays: v.workDays.size }))
    .sort((a, b) => b.sales - a.sales);
}

export function pendingCount(records: PerformanceRecord[], casts: { name: string; shifts: string[] }[]) {
  const t        = new Date();
  const keyStr   = `${t.getDate()}`;
  const isoToday = todayStr();

  const scheduled = casts.filter(c => c.shifts.includes(keyStr)).map(c => c.name);
  const entered   = new Set(records.filter(r => r.date === isoToday).map(r => r.castName));
  return scheduled.filter(n => !entered.has(n)).length;
}

export function aggregateCast(records: PerformanceRecord[], castName: string) {
  const now   = new Date();
  const thisM = monthStr(now);
  const prevM = monthStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const monthly     = records.filter(r => r.date.startsWith(thisM) && r.castName === castName);
  const prevMonthly = records.filter(r => r.date.startsWith(prevM) && r.castName === castName);

  const workDays   = new Set(monthly.map(r => r.date)).size;
  const sales      = monthly.reduce((s, r) => s + (r.sales || 0), 0);
  const salary     = monthly.reduce((s, r) => s + (r.salary || 0), 0);
  const nominations= monthly.reduce((s, r) => s + (r.nominations || 0), 0);
  const drinks     = monthly.reduce((s, r) => s + (r.drinks || 0), 0);
  const bottleSales= monthly.reduce((s, r) => s + (r.bottleSales || 0), 0);

  const prevSales = prevMonthly.reduce((s, r) => s + (r.sales || 0), 0);
  const prevMonthRatio = prevSales > 0
    ? Math.round(((sales - prevSales) / prevSales) * 100)
    : 0;

  const weeklySales = [0, 1, 2, 3].map(w => {
    const start = new Date(now.getFullYear(), now.getMonth(), w * 7 + 1);
    const end   = w === 3
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
      : new Date(now.getFullYear(), now.getMonth(), (w + 1) * 7);
    return monthly
      .filter(r => { const d = new Date(r.date); return d >= start && d <= end; })
      .reduce((s, r) => s + (r.sales || 0), 0);
  });

  return { workDays, sales, salary, nominations, drinks, bottleSales, weeklySales, prevMonthRatio, hasData: monthly.length > 0 };
}
