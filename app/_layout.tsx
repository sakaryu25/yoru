import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { registerForPushNotifications } from '../lib/notifications';

function Guard() {
  const { session, booting } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (session) registerForPushNotifications();
  }, [session]);

  React.useEffect(() => {
    if (booting) return;
    const inTabs = segments[0] === '(tabs)';
    if (!session && inTabs) router.replace('/login');
    if (session && !inTabs) router.replace('/(tabs)/');
  }, [session, booting, segments]);

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Guard />
    </AuthProvider>
  );
}
