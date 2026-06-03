import type React from 'react';

export type Role = 'manager' | 'cast';
export type ManagerTab = 'home' | 'casts' | 'input' | 'missions' | 'settings';
export type CastTab = 'home' | 'stats' | 'missions' | 'badges';
export type RankTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Regular';
export type AttendStatus = 'scheduled' | 'arrived' | 'absent';

export interface AuthSession {
  companyId: string;
  storeName: string;
}

export interface CompanyAccount {
  password: string;
  storeName: string;
  monthlySales: number;
  monthlyGoal: number;
  todaySales: number;
  pendingEntries: number;
  prevMonthRatio: number;
  laborCost: number;
  monthlyTrend: { month: string; sales: number; current?: boolean }[];
}

export interface Cast {
  id: number;
  name: string;
  rank: RankTier;
  monthlySales: number;
  monthlyGoal: number;
  salaryEstimate: number;
  nominations: number;
  drinks: number;
  workDays: number;
  rankNum: number;
  prevMonthRatio: number;
  status: string;
  weeklySales: number[];
  shifts: string[];
  hourlyRate: number;
  bottleSales: number;
  cheki: number;
}

export interface Mission {
  id: number;
  title: string;
  condition: string;
  target: number;
  current: number;
  reward: string;
  deadline: string;
  achievers: number;
  total: number;
}

export type BadgeIcon = (props: { size?: number; color?: string }) => React.JSX.Element;

export interface Badge {
  id: number;
  Icon: BadgeIcon;
  title: string;
  desc: string;
  earned: boolean;
  earnedDate?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'important';
  createdAt: string;
  pinned: boolean;
}

export interface PerformanceRecord {
  id: string;
  date: string;
  castName: string;
  hours: number;
  sales: number;
  salary: number;
  nominations: number;
  floorNominations?: number;
  drinks: number;
  bottleSales: number;
  cheki: number;
  otherBack?: number;
  memo: string;
  savedAt: string;
}

export interface DailyReport {
  id: string;
  date: string;
  notes: string;
  totalSalary: number;
  totalDrinks: number;
  totalNominations: number;
  attendanceCount: number;
  topCast: string;
  closed: boolean;
  closedAt?: string;
  createdAt: string;
}

export interface BackSettings {
  drinkBack: number;
  nominationBack: number;
  floorNomBack: number;
  bottleBackRate: number;
  chekiBack: number;
}

export interface DisplaySettings {
  showSalaryEstimate: boolean;
  showStoreRank: boolean;
  showPrevMonthRatio: boolean;
  showMissions: boolean;
  showBadges: boolean;
}
