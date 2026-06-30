import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, SERIF } from '@/shared/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { forgotPassword, type AccountType } from '@/features/auth/api/auth';
import type { ApiError } from '@/shared/api/client';

type Mode = 'login' | 'register';

const NIP_RE = /^\d{10}$/;

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const [mode, setMode] = useState<Mode>('login');
  const [accountType, setAccountType] = useState<AccountType>('PRIVATE');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset hasła (scaffold) — modal z prośbą o link
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const openForgot = () => {
    setForgotEmail(email);
    setForgotSent(false);
    setForgotOpen(true);
  };

  const submitForgot = async () => {
    if (!forgotEmail.includes('@')) return;
    setForgotBusy(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch {
      // anti-enumeration: nawet przy błędzie pokazujemy ten sam komunikat
      setForgotSent(true);
    } finally {
      setForgotBusy(false);
    }
  };

  const isReg = mode === 'register';
  const isBusiness = accountType === 'BUSINESS';

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  // Walidacja po stronie klienta — szybki feedback, backend i tak waliduje ponownie.
  const validationError = useMemo<string | null>(() => {
    if (!email.includes('@')) return 'Podaj poprawny adres e-mail.';
    if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków.';
    if (isReg) {
      if (displayName.trim().length < 2) return 'Podaj nazwę (min. 2 znaki).';
      if (password !== confirm) return 'Hasła nie są takie same.';
      if (!accept) return 'Zaakceptuj regulamin, aby założyć konto.';
      if (isBusiness) {
        if (companyName.trim().length < 2) return 'Podaj nazwę firmy.';
        if (!NIP_RE.test(nip.trim())) return 'NIP musi mieć 10 cyfr.';
      }
    }
    return null;
  }, [email, password, confirm, displayName, accept, isReg, isBusiness, companyName, nip]);

  const submit = async () => {
    setError(null);
    // Rejestracja celowo WYŁĄCZONA na tym etapie (Etap 1) — formularz jest tylko widokiem.
    // Konta testowe/admin zakładane bezpośrednio w bazie; pełna rejestracja: Etap 2/3 (z e-mailem).
    if (isReg) {
      setError('Rejestracja będzie wkrótce dostępna. Konta zakłada administrator.');
      return;
    }
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      if (isReg) {
        await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          accountType,
          ...(isBusiness
            ? { companyName: companyName.trim(), nip: nip.trim() }
            : {}),
        });
      } else {
        await signIn(email.trim(), password);
      }
      // Sukces: AuthProvider ma już usera — zamykamy modal i wracamy tam, skąd przyszliśmy.
      close();
    } catch (e) {
      const err = e as ApiError;
      setError(err?.message ?? 'Coś poszło nie tak. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Zamknij — przyklejone do rogu ekranu */}
      <TouchableOpacity style={[s.close, { top: insets.top + 8 }]} onPress={close} hitSlop={10}>
        <Text style={s.closeText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Nagłówek */}
        <View style={s.head}>
          <View style={s.badge}>
            <Text style={s.badgeIcon}>{isReg ? '✦' : '🔒'}</Text>
          </View>
          <Text style={s.title}>{isReg ? 'Załóż konto' : 'Zaloguj się'}</Text>
          <Text style={s.subtitle}>
            {isReg
              ? 'Dołącz do AdBox i odkrywaj świat mody.'
              : 'Witaj ponownie! Zaloguj się, aby kontynuować.'}
          </Text>
        </View>

        {/* Typ konta — tylko przy rejestracji */}
        {isReg && (
          <View style={s.segment}>
            <SegBtn
              label="Osoba prywatna"
              active={!isBusiness}
              onPress={() => setAccountType('PRIVATE')}
            />
            <SegBtn
              label="Firma"
              active={isBusiness}
              onPress={() => setAccountType('BUSINESS')}
            />
          </View>
        )}

        {/* Pola */}
        <View style={s.fields}>
          {isReg && (
            <Field
              label={isBusiness ? 'Nazwa wyświetlana' : 'Imię / nazwa'}
              placeholder="Jak Cię wyświetlać?"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}

          {isReg && isBusiness && (
            <>
              <Field
                label="Nazwa firmy"
                placeholder="Nazwa firmy"
                value={companyName}
                onChangeText={setCompanyName}
              />
              <Field
                label="NIP"
                placeholder="10 cyfr"
                value={nip}
                onChangeText={setNip}
                keyboardType="number-pad"
                maxLength={10}
              />
            </>
          )}

          <Field
            label="E-mail"
            placeholder="Wprowadź adres e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Field
            label="Hasło"
            placeholder="Wprowadź hasło"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
            rightLabel={showPwd ? 'Ukryj' : 'Pokaż'}
            onRightPress={() => setShowPwd((v) => !v)}
          />

          {isReg && (
            <Field
              label="Potwierdź hasło"
              placeholder="Potwierdź hasło"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirm}
              rightLabel={showConfirm ? 'Ukryj' : 'Pokaż'}
              onRightPress={() => setShowConfirm((v) => !v)}
            />
          )}
        </View>

        {/* Zgoda / opcje */}
        {isReg ? (
          <TouchableOpacity
            style={s.checkRow}
            onPress={() => setAccept((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, accept && s.checkboxOn]}>
              {accept && <Text style={s.checkMark}>✓</Text>}
            </View>
            <Text style={s.checkText}>
              Akceptuję <Text style={s.link}>Regulamin</Text> oraz{' '}
              <Text style={s.link}>Politykę prywatności</Text>.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={s.optionsRow}>
            <TouchableOpacity
              style={s.checkRowInline}
              onPress={() => setAccept((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[s.checkbox, accept && s.checkboxOn]}>
                {accept && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={s.rememberText}>Zapamiętaj mnie</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openForgot} style={s.forgotBtn} hitSlop={8}>
              <Text style={s.link}>Nie pamiętasz hasła?</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Błąd */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[s.cta, submitting && s.ctaDisabled]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.ctaText}>{isReg ? 'Załóż konto' : 'Zaloguj się'}</Text>
          )}
        </TouchableOpacity>

        {/* Separator */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>lub kontynuuj z</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Social (na razie dekoracyjne — Google/Apple w Etapie 2) */}
        <View style={s.socialRow}>
          <SocialBtn label="Google" />
          <SocialBtn label="Apple" />
        </View>

        {/* Przełącznik trybu */}
        <View style={s.switchRow}>
          <Text style={s.switchText}>
            {isReg ? 'Masz już konto? ' : 'Nie masz konta? '}
          </Text>
          <TouchableOpacity onPress={() => switchMode(isReg ? 'login' : 'register')}>
            <Text style={s.link}>{isReg ? 'Zaloguj się' : 'Załóż konto'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reset hasła — prośba o link (scaffold; mail zaślepiony po stronie serwera) */}
      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <Pressable style={s.fpOverlay} onPress={() => setForgotOpen(false)}>
          <Pressable style={s.fpCard} onPress={() => {}}>
            {forgotSent ? (
              <>
                <View style={s.fpIcon}><Text style={{ fontSize: 26 }}>✉️</Text></View>
                <Text style={s.fpTitle}>Sprawdź skrzynkę</Text>
                <Text style={s.fpText}>Jeśli istnieje konto powiązane z tym adresem, wysłaliśmy link do zresetowania hasła. Link jest ważny 1 godzinę.</Text>
                <TouchableOpacity style={s.fpBtn} onPress={() => setForgotOpen(false)} activeOpacity={0.85}>
                  <Text style={s.fpBtnText}>Rozumiem</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.fpTitle}>Reset hasła</Text>
                <Text style={s.fpText}>Podaj adres e-mail — wyślemy link do ustawienia nowego hasła.</Text>
                <View style={s.inputWrap}>
                  <TextInput
                    style={s.input}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    placeholder="Wprowadź adres e-mail"
                    placeholderTextColor={C.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[s.fpBtn, (forgotBusy || !forgotEmail.includes('@')) && s.ctaDisabled]}
                  onPress={submitForgot}
                  disabled={forgotBusy || !forgotEmail.includes('@')}
                  activeOpacity={0.85}
                >
                  {forgotBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.fpBtnText}>Wyślij link</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setForgotOpen(false)} style={{ marginTop: 12 }}>
                  <Text style={s.fpCancel}>Anuluj</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Podkomponenty ─────────────────────────────────────────────────────────

function SegBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.segBtn, active && s.segBtnOn]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[s.segText, active && s.segTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface FieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  maxLength?: number;
  rightLabel?: string;
  onRightPress?: () => void;
}

function Field({
  label,
  rightLabel,
  onRightPress,
  ...input
}: FieldProps) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput
          style={s.input}
          placeholderTextColor={C.muted}
          {...input}
        />
        {rightLabel && (
          <TouchableOpacity onPress={onRightPress} hitSlop={8}>
            <Text style={s.inputAction}>{rightLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SocialBtn({ label }: { label: string }) {
  return (
    <TouchableOpacity style={s.social} activeOpacity={0.85}>
      <Text style={s.socialText}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },

  close: { position: 'absolute', right: 14, padding: 8, zIndex: 10 },
  closeText: { fontSize: 22, color: C.muted },

  head: { alignItems: 'center', marginBottom: 30 },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgeIcon: { fontSize: 30, color: C.gold },
  title: { fontFamily: SERIF, fontSize: 34, fontWeight: '700', color: C.ink },
  subtitle: {
    fontSize: 15,
    color: C.muted,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: C.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segBtnOn: {
    backgroundColor: C.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segText: { fontSize: 13, fontWeight: '600', color: C.muted },
  segTextOn: { color: C.ink },

  fields: { gap: 16 },
  field: { gap: 7 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: C.ink },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: C.ink },
  inputAction: { fontSize: 14, fontWeight: '600', color: C.gold },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  checkRowInline: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  checkboxOn: { backgroundColor: C.gold, borderColor: C.gold },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  checkText: { flex: 1, fontSize: 14, color: C.inkSoft, lineHeight: 19 },
  rememberText: { fontSize: 14, color: C.inkSoft },
  forgotBtn: { flexShrink: 0 },
  link: { fontSize: 14, fontWeight: '700', color: C.gold },

  errorBox: {
    marginTop: 16,
    backgroundColor: '#FCEBEA',
    borderWidth: 1,
    borderColor: '#F3C9C5',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  errorText: { color: '#B23B36', fontSize: 13, lineHeight: 18 },

  cta: {
    marginTop: 24,
    backgroundColor: C.gold,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { fontSize: 13, color: C.muted },

  socialRow: { flexDirection: 'row', gap: 12 },
  social: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  socialText: { fontSize: 15, fontWeight: '600', color: C.ink },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  switchText: { fontSize: 15, color: C.muted },

  fpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  fpCard: { width: '100%', maxWidth: 380, backgroundColor: C.bg, borderRadius: 20, padding: 22, alignItems: 'center' },
  fpIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  fpTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: C.ink, textAlign: 'center' },
  fpText: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 20, marginBottom: 16 },
  fpBtn: { alignSelf: 'stretch', backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  fpBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  fpCancel: { fontSize: 14, fontWeight: '600', color: C.muted, textAlign: 'center' },
});
