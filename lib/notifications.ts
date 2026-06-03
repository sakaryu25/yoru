import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CastBoard',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync('missions', {
      name: 'ミッション',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    return null;
  }
}

export async function sendLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null,
  });
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '今日の売上を入力しましょう',
      body: 'キャストの成績を記録してください',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelAllScheduled() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function notifyMissionComplete(missionTitle: string) {
  return sendLocalNotification(
    `ミッション達成！`,
    `「${missionTitle}」が達成されました！おめでとうございます！`,
    { type: 'mission_complete' }
  );
}

export function notifyMissionCreated(missionTitle: string) {
  return sendLocalNotification(
    '新しいミッション',
    `「${missionTitle}」が追加されました！`,
    { type: 'mission_created' }
  );
}
