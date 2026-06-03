import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { DEMO_ACCOUNTS } from '../lib/data';
import { IcoBuilding, IcoKey, IcoEye, IcoEyeOff, IcoMoon } from '../components/icons/Icons';
import { C } from '../components/ui';

const DEMO_HINTS = [
  { id: 'luna001', pw: '1234', store: 'Luna Lounge' },
  { id: 'rose002', pw: '5678', store: 'Rose Club' },
  { id: 'sky003',  pw: '0000', store: 'Sky Bar' },
  { id: 'demo',    pw: 'demo', store: 'Demo Store' },
];

export default function LoginScreen() {
  const [companyId, setCompanyId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    const account = DEMO_ACCOUNTS[companyId.trim().toLowerCase()];
    if (!account || account.password !== password) {
      setError('会社IDまたはパスワードが正しくありません');
      return;
    }
    setLoading(true);
    await login({ companyId: companyId.trim().toLowerCase(), storeName: account.storeName });
    router.replace('/(tabs)/');
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <IcoMoon size={28} color={C.gold} />
          <Text style={s.title}>CastBoard</Text>
          <Text style={s.subtitle}>夜職店舗向け管理アプリ</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <View style={s.fieldWrap}>
            <Text style={s.label}>会社ID</Text>
            <View style={s.inputRow}>
              <IcoBuilding size={16} color={C.gray5} />
              <TextInput
                style={s.input}
                value={companyId}
                onChangeText={v => { setCompanyId(v); setError(''); }}
                placeholder="例: luna001"
                placeholderTextColor={C.gray5}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={s.fieldWrap}>
            <Text style={s.label}>パスワード</Text>
            <View style={s.inputRow}>
              <IcoKey size={16} color={C.gray5} />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder="パスワード"
                placeholderTextColor={C.gray5}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                {showPw
                  ? <IcoEyeOff size={16} color={C.gray5} />
                  : <IcoEye size={16} color={C.gray5} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={!companyId || !password || loading}
            activeOpacity={0.8}
            style={[s.loginBtn, (!companyId || !password) && s.loginBtnDisabled]}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.loginBtnText}>ログイン</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Demo hints */}
        <View style={s.hints}>
          <Text style={s.hintsLabel}>デモアカウント</Text>
          {DEMO_HINTS.map(h => (
            <TouchableOpacity
              key={h.id}
              onPress={() => { setCompanyId(h.id); setPassword(h.pw); setError(''); }}
              style={s.hintRow}
              activeOpacity={0.7}
            >
              <Text style={s.hintStore}>{h.store}</Text>
              <Text style={s.hintId}>{h.id} / {h.pw}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: C.bg },
  scroll:    { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 80 },
  header:    { alignItems: 'center', marginBottom: 40 },
  title:     { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 12, letterSpacing: 1 },
  subtitle:  { fontSize: 13, color: C.gray5, marginTop: 4 },
  form:      { width: '100%', gap: 16, marginBottom: 40 },
  fieldWrap: { gap: 6 },
  label:     { fontSize: 12, color: C.gray4, fontWeight: '700' },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  input:     { flex: 1, color: '#fff', fontSize: 15 },
  error:     { color: '#F87171', fontSize: 13, textAlign: 'center' },
  loginBtn:  { backgroundColor: C.gold, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  loginBtnDisabled: { backgroundColor: '#1f1f1f' },
  loginBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
  hints:     { width: '100%', gap: 8 },
  hintsLabel:{ fontSize: 10, color: C.gray5, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  hintRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#181818', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  hintStore: { fontSize: 13, color: '#fff', fontWeight: '700' },
  hintId:    { fontSize: 11, color: C.gray5, fontFamily: 'monospace' },
});
