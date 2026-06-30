import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from './Icon';

export { Icon };
export type { IconName };

// ─── Button ─────────────────────────────────────────────────────────────────
type ButtonVariant = 'gold' | 'dark' | 'ghost' | 'outline';

export function Button({
  title,
  onPress,
  variant = 'gold',
  full,
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  full?: boolean;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const v = BTN[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        b.base,
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0 },
        full && { alignSelf: 'stretch' },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={v.fg} />}
          <Text style={[b.label, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const BTN: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  gold: { bg: C.gold, fg: '#fff' },
  dark: { bg: C.ink, fg: '#fff' },
  ghost: { bg: C.surface, fg: C.ink, border: C.line },
  outline: { bg: 'transparent', fg: C.ink, border: C.ink },
};

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({
  children,
  tone = 'dark',
}: {
  children: React.ReactNode;
  tone?: 'dark' | 'gold' | 'success';
}) {
  const tones = {
    dark: { bg: 'rgba(30,27,22,0.8)', fg: '#fff' },
    gold: { bg: C.gold, fg: '#fff' },
    success: { bg: 'rgba(42,122,74,0.12)', fg: '#2A7A4A' },
  }[tone];
  return (
    <View style={[bd.wrap, { backgroundColor: tones.bg }]}>
      {typeof children === 'string' ? (
        <Text style={[bd.text, { color: tones.fg }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

// ─── Pill (filtr/chip) ────────────────────────────────────────────────────────
export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        pl.wrap,
        active
          ? { backgroundColor: C.ink, borderColor: C.ink }
          : { backgroundColor: C.surface, borderColor: C.line },
      ]}
    >
      <Text style={[pl.text, { color: active ? '#fff' : C.ink }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({ name, src, size = 44 }: { name?: string; src?: string; size?: number }) {
  if (src) {
    return (
      <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.gold,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontFamily: SERIF, fontSize: size * 0.42, fontWeight: '700' }}>
        {name?.[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

// ─── Field (label + input) ────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  icon,
  right,
  style,
  ...input
}: React.ComponentProps<typeof TextInput> & {
  label?: string;
  hint?: string;
  icon?: IconName;
  right?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {label && <Text style={f.label}>{label}</Text>}
      <View style={f.wrap}>
        {icon && <Icon name={icon} size={18} color={C.muted} />}
        <TextInput style={f.input} placeholderTextColor={C.muted} {...input} />
        {right}
      </View>
      {hint && <Text style={f.hint}>{hint}</Text>}
    </View>
  );
}

// ─── SectionHead ──────────────────────────────────────────────────────────────
export function SectionHead({
  title,
  action,
  onAction,
  big,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  big?: boolean;
}) {
  return (
    <View style={sh.row}>
      <Text style={[sh.title, big && { fontSize: 20 }]}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={sh.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Card (card-surface) ──────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[cardStyle, style]}>{children}</View>;
}

export const cardStyle: ViewStyle = {
  backgroundColor: C.surface,
  borderWidth: 1,
  borderColor: C.line,
  borderRadius: 16,
};

// ─── style ───────────────────────────────────────────────────────────────────
const b = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  label: { fontSize: 15, fontWeight: '700' } as TextStyle,
});

const bd = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
});

const pl = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  text: { fontSize: 13, fontWeight: '600' },
});

const f = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 8 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.ink },
  hint: { fontSize: 12, color: C.muted, marginTop: 6 },
});

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: C.ink },
  action: { fontSize: 13, fontWeight: '700', color: C.gold },
});
