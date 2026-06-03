import type { CompanyAccount, Cast, Mission, Badge, RankTier } from './types';
import {
  IcoStar, IcoCocktail, IcoYen, IcoDiamond, IcoFire, IcoTrendUp,
  IcoCrown, IcoGift, IcoCamera, IcoWine,
} from '../components/icons/Icons';

export const DEMO_ACCOUNTS: Record<string, CompanyAccount> = {
  luna001: {
    password: '1234', storeName: 'Luna Lounge',
    monthlySales: 3420000, monthlyGoal: 4500000, todaySales: 286000,
    pendingEntries: 3, prevMonthRatio: 18, laborCost: 1120000,
    monthlyTrend: [
      { month: '12月', sales: 2850000 }, { month: '1月', sales: 3100000 },
      { month: '2月', sales: 2920000 }, { month: '3月', sales: 3380000 },
      { month: '4月', sales: 2900000 }, { month: '5月', sales: 3420000, current: true },
    ],
  },
  rose002: {
    password: '5678', storeName: 'Rose Club',
    monthlySales: 2180000, monthlyGoal: 3500000, todaySales: 195000,
    pendingEntries: 1, prevMonthRatio: 12, laborCost: 840000,
    monthlyTrend: [
      { month: '12月', sales: 1900000 }, { month: '1月', sales: 2050000 },
      { month: '2月', sales: 1980000 }, { month: '3月', sales: 2200000 },
      { month: '4月', sales: 1940000 }, { month: '5月', sales: 2180000, current: true },
    ],
  },
  sky003: {
    password: '0000', storeName: 'Sky Bar',
    monthlySales: 5100000, monthlyGoal: 6000000, todaySales: 412000,
    pendingEntries: 5, prevMonthRatio: 25, laborCost: 1580000,
    monthlyTrend: [
      { month: '12月', sales: 3800000 }, { month: '1月', sales: 4200000 },
      { month: '2月', sales: 4050000 }, { month: '3月', sales: 4600000 },
      { month: '4月', sales: 4080000 }, { month: '5月', sales: 5100000, current: true },
    ],
  },
  demo: {
    password: 'demo', storeName: 'Demo Store',
    monthlySales: 1500000, monthlyGoal: 2000000, todaySales: 120000,
    pendingEntries: 0, prevMonthRatio: 8, laborCost: 520000,
    monthlyTrend: [
      { month: '12月', sales: 1100000 }, { month: '1月', sales: 1250000 },
      { month: '2月', sales: 1180000 }, { month: '3月', sales: 1390000 },
      { month: '4月', sales: 1390000 }, { month: '5月', sales: 1500000, current: true },
    ],
  },
};

export const CASTS: Cast[] = [
  { id: 1, name: 'みゆ', rank: 'Gold', monthlySales: 820000, monthlyGoal: 900000, salaryEstimate: 286000, nominations: 34, drinks: 128, workDays: 14, rankNum: 2, prevMonthRatio: 22, status: '在籍中', weeklySales: [185000, 210000, 195000, 230000], shifts: ['1','3','5','8','10','12','15','17','19','21','22','24','26','28','30'], hourlyRate: 2800, bottleSales: 180000, cheki: 24 },
  { id: 2, name: 'りな', rank: 'Silver', monthlySales: 640000, monthlyGoal: 800000, salaryEstimate: 221000, nominations: 26, drinks: 96, workDays: 12, rankNum: 3, prevMonthRatio: 12, status: '在籍中', weeklySales: [140000, 160000, 175000, 165000], shifts: ['2','4','7','9','11','14','16','18','20','23','25','27'], hourlyRate: 2500, bottleSales: 120000, cheki: 15 },
  { id: 3, name: 'あい', rank: 'Bronze', monthlySales: 410000, monthlyGoal: 600000, salaryEstimate: 158000, nominations: 15, drinks: 72, workDays: 10, rankNum: 5, prevMonthRatio: 5, status: '在籍中', weeklySales: [85000, 110000, 105000, 110000], shifts: ['3','6','9','12','15','18','21','24','26','28','30'], hourlyRate: 2200, bottleSales: 60000, cheki: 8 },
  { id: 4, name: 'さら', rank: 'Silver', monthlySales: 530000, monthlyGoal: 700000, salaryEstimate: 190000, nominations: 21, drinks: 84, workDays: 11, rankNum: 4, prevMonthRatio: 8, status: '在籍中', weeklySales: [120000, 135000, 140000, 135000], shifts: ['1','4','7','10','13','16','19','22','25','27','29','30'], hourlyRate: 2500, bottleSales: 90000, cheki: 12 },
  { id: 5, name: 'ゆな', rank: 'Regular', monthlySales: 280000, monthlyGoal: 500000, salaryEstimate: 112000, nominations: 9, drinks: 50, workDays: 8, rankNum: 7, prevMonthRatio: -3, status: '在籍中', weeklySales: [60000, 75000, 80000, 65000], shifts: ['5','9','13','17','21','24','27','29'], hourlyRate: 2000, bottleSales: 30000, cheki: 4 },
];

export const MY_CAST = CASTS[0];

export const MISSIONS: Mission[] = [
  { id: 1, title: 'ドリンク強化DAY', condition: 'ドリンク5杯', target: 5, current: 3, reward: '+¥1,000', deadline: '今日まで', achievers: 4, total: 8 },
  { id: 2, title: '今週の指名チャレンジ', condition: '本指名3本', target: 3, current: 2, reward: '+¥3,000', deadline: '今週末まで', achievers: 2, total: 12 },
  { id: 3, title: 'SNS投稿キャンペーン', condition: 'Instagram投稿3回', target: 3, current: 1, reward: 'ポイント+10', deadline: '月末まで', achievers: 6, total: 12 },
];

export const BADGES: Badge[] = [
  { id: 1,  Icon: IcoStar,     title: '初指名達成',   desc: '初めての本指名',     earned: true,  earnedDate: '4/2' },
  { id: 2,  Icon: IcoCocktail, title: 'ドリンク10杯', desc: '1日10杯達成',        earned: true,  earnedDate: '4/8' },
  { id: 3,  Icon: IcoYen,      title: '売上10万達成', desc: '月間売上10万円突破', earned: true,  earnedDate: '4/10' },
  { id: 4,  Icon: IcoDiamond,  title: '売上50万達成', desc: '月間売上50万円突破', earned: true,  earnedDate: '4/28' },
  { id: 5,  Icon: IcoFire,     title: '3連勤達成',    desc: '3日連続出勤',        earned: true,  earnedDate: '5/5' },
  { id: 6,  Icon: IcoTrendUp,  title: '前月比120%',   desc: '先月の1.2倍の売上', earned: true,  earnedDate: '5/20' },
  { id: 7,  Icon: IcoCrown,    title: '今週MVP',      desc: '週間売上1位',        earned: false },
  { id: 8,  Icon: IcoGift,     title: 'イベント出勤', desc: '特別イベントに参加', earned: false },
  { id: 9,  Icon: IcoCamera,   title: 'SNS投稿達成',  desc: 'SNSミッション完了',  earned: false },
  { id: 10, Icon: IcoWine,     title: 'ボトル達成',   desc: 'ボトル売上5本',      earned: false },
];

export const RANK_CONFIG: Record<RankTier, {
  color: string; bg: string; border: string;
  next?: RankTier; threshold: number; nextThreshold?: number;
}> = {
  Platinum: { color: '#67E8F9', bg: 'rgba(103,232,249,0.1)', border: 'rgba(103,232,249,0.3)', threshold: 1000000 },
  Gold:     { color: '#D4AF37', bg: 'rgba(212,175,55,0.1)',  border: 'rgba(212,175,55,0.3)',  threshold: 700000,  next: 'Platinum', nextThreshold: 1000000 },
  Silver:   { color: '#E5E7EB', bg: 'rgba(229,231,235,0.1)', border: 'rgba(229,231,235,0.3)', threshold: 400000,  next: 'Gold',     nextThreshold: 700000 },
  Bronze:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  threshold: 200000,  next: 'Silver',   nextThreshold: 400000 },
  Regular:  { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', threshold: 0,       next: 'Bronze',   nextThreshold: 200000 },
};

export const RANK_ORDER: Record<RankTier, number> = { Platinum: 5, Gold: 4, Silver: 3, Bronze: 2, Regular: 1 };
