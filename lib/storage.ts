import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  get: async <T>(key: string, fallback: T): Promise<T> => {
    try {
      const v = await AsyncStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: async (key: string, value: unknown): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const keys = {
  session:      () => 'castboard_session',
  goals:        (cid: string) => `castboard_goals_${cid}`,
  records:      (cid: string) => `castboard_records_${cid}`,
  memos:        (cid: string) => `castboard_memos_${cid}`,
  attendance:   (cid: string, date: string) => `castboard_attendance_${cid}_${date}`,
  announcements:(cid: string) => `castboard_announcements_${cid}`,
  annRead:      (cid: string) => `castboard_ann_read_${cid}`,
  clock:        (cid: string, name: string, date: string) => `castboard_clock_${cid}_${name}_${date}`,
  dailyReports: (cid: string) => `castboard_dailyreports_${cid}`,
  hourlyRates:     (cid: string) => `castboard_hourly_${cid}`,
  backSettings:    (cid: string) => `castboard_back_${cid}`,
  displaySettings: (cid: string, name: string) => `castboard_display_${cid}_${name}`,
  missions:        (cid: string) => `castboard_missions_${cid}`,
  monthlyGoal:     (cid: string) => `castboard_monthlygoal_${cid}`,
};

export const fmt = (n: number) => '¥' + n.toLocaleString('ja-JP');
export const pct = (a: number, b: number) => Math.min(100, Math.round((a / b) * 100));

export const DEFAULT_BACK = {
  drinkBack: 100, nominationBack: 1500, floorNomBack: 500,
  bottleBackRate: 10, chekiBack: 200,
};

export const DEFAULT_DISPLAY = {
  showSalaryEstimate: true, showStoreRank: true, showPrevMonthRatio: true,
  showMissions: true, showBadges: true,
};
