import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { track } from './analytics';
import { DOWNLOAD_URL, OFFICIAL_SOURCE_URL, PRIVACY_URL } from './config';
import { UpdateResult, checkForUpdate } from './data/remote';
import { toKey } from './data/schedule';
import { scheduleFor, sectorNumber, useData } from './data/sectors';
import { Lang, fullDate, hourLabel, strings } from './i18n';
import { sendTest } from './notifications';
import { EVE_OPTIONS, MORNING_OPTIONS, ReminderHour, Settings } from './settings';
import { Theme } from './theme';
import { Reminders } from './useReminders';

interface Props {
  theme: Theme;
  settings: Settings;
  reminders: Reminders;
  onChangeStreet: () => void;
  onClose: () => void;
}

/** Deschide o setare Android; dacă telefonul nu o are, deschide setările aplicației. */
async function openAndroidSetting(action: string, withPackage = false) {
  try {
    await IntentLauncher.startActivityAsync(action, withPackage ? { data: `package:${Application.applicationId}` } : {});
  } catch {
    Linking.openSettings();
  }
}

export default function SettingsScreen({ theme, settings, reminders, onChangeStreet, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const data = useData();
  const { lang, street, times } = settings;
  const s = strings(lang);
  const [update, setUpdate] = useState<UpdateResult | 'checking' | null>(null);
  const [showTips, setShowTips] = useState(false);

  const onCheck = async () => {
    setUpdate('checking');
    const result = await checkForUpdate(true);
    setUpdate(result);
    track('update_check', { result });
  };

  const onTest = () => {
    if (!street) return;
    const next = scheduleFor(street).nextPickupDay(toKey(new Date()));
    if (next) sendTest(lang, street, next[0]).catch(() => undefined);
  };

  const isAndroid = Platform.OS === 'android';
  const canExactAlarm = isAndroid && Number(Platform.Version) >= 31;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.title}>{s.settings}</Text>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel={s.close} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {/* Strada */}
        <Section title={s.sectionStreet} styles={styles}>
          <View style={styles.row}>
            <Text style={[styles.body, { flex: 1 }]}>
              📍 {street ? `${s.street(street.name)} · ${s.sector(sectorNumber(street))}` : '—'}
            </Text>
            <Pressable onPress={onChangeStreet} style={styles.tonalButton}>
              <Text style={styles.tonalButtonText}>{s.changeStreet}</Text>
            </Pressable>
          </View>
        </Section>

        {/* Limba */}
        <Section title={s.sectionLanguage} styles={styles}>
          <View style={styles.chips}>
            {(
              [
                ['ro', 'Română'],
                ['en', 'English'],
              ] as [Lang, string][]
            ).map(([l, label]) => (
              <Chip key={l} label={label} selected={lang === l} onPress={() => settings.setLang(l)} styles={styles} />
            ))}
          </View>
        </Section>

        {/* Mementouri */}
        <Section title={s.sectionReminders} styles={styles}>
          <View style={styles.row}>
            <Text style={[styles.body, { flex: 1 }]}>🔔 {s.notifications}</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={async (v) => {
                settings.setNotificationsEnabled(v);
                if (v && !reminders.permission) await reminders.askPermission();
              }}
              trackColor={{ true: theme.primary, false: theme.outline }}
              thumbColor={isAndroid ? theme.surface : undefined}
            />
          </View>

          {settings.notificationsEnabled && reminders.permission === false && (
            <View style={styles.warning}>
              <Text style={[styles.warningText, { flex: 1 }]}>⚠️ {s.notificationsBlocked}</Text>
              <Pressable onPress={reminders.askPermission} style={styles.warningButton}>
                <Text style={styles.warningButtonText}>{s.allow}</Text>
              </Pressable>
            </View>
          )}

          {settings.notificationsEnabled && (
            <>
              <HourPicker
                label={s.eveReminder}
                value={times.eve}
                options={EVE_OPTIONS}
                offLabel={s.off}
                onChange={(eve) => {
                  settings.setTimes({ ...times, eve });
                  track('reminder_time', { kind: 'eve', hour: eve ?? -1 });
                }}
                styles={styles}
              />
              <HourPicker
                label={s.morningReminder}
                value={times.morning}
                options={MORNING_OPTIONS}
                offLabel={s.off}
                onChange={(morning) => {
                  settings.setTimes({ ...times, morning });
                  track('reminder_time', { kind: 'morning', hour: morning ?? -1 });
                }}
                styles={styles}
              />
              <Pressable onPress={onTest} disabled={!reminders.permission} style={{ marginTop: 12 }}>
                <Text style={[styles.link, !reminders.permission && { opacity: 0.4 }]}>{s.sendTest}</Text>
              </Pressable>
            </>
          )}
        </Section>

        {/* Fiabilitatea notificărilor (Android) */}
        {isAndroid && (
          <Section title={s.reliabilityTitle} styles={styles}>
            <Text style={styles.small}>{s.reliabilityText}</Text>
            <View style={[styles.chips, { marginTop: 12 }]}>
              <Pressable
                onPress={() => openAndroidSetting(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS)}
                style={styles.tonalButton}
              >
                <Text style={styles.tonalButtonText}>🔋 {s.batterySettings}</Text>
              </Pressable>
              {canExactAlarm && (
                <Pressable
                  onPress={() => openAndroidSetting(IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM, true)}
                  style={styles.tonalButton}
                >
                  <Text style={styles.tonalButtonText}>⏰ {s.exactAlarms}</Text>
                </Pressable>
              )}
            </View>
            <Pressable onPress={() => setShowTips(!showTips)} style={{ marginTop: 12 }}>
              <Text style={styles.link}>
                {showTips ? '▾' : '▸'} Samsung · Xiaomi · Huawei
              </Text>
            </Pressable>
            {showTips && <Text style={[styles.small, { marginTop: 8, lineHeight: 19 }]}>{s.phoneTips}</Text>}
          </Section>
        )}

        {/* Programul */}
        <Section title={s.sectionSchedule} styles={styles}>
          <Text style={styles.small}>
            {s.scheduleVersion(data.dataset.version, fullDate(lang, data.dataset.updated))}
          </Text>
          <View style={[styles.row, { marginTop: 12 }]}>
            <Pressable onPress={onCheck} disabled={update === 'checking'} style={styles.tonalButton}>
              <Text style={styles.tonalButtonText}>🔄 {s.checkUpdates}</Text>
            </Pressable>
          </View>
          {update && (
            <Text style={[styles.small, { marginTop: 8 }]}>
              {update === 'checking'
                ? s.checking
                : update === 'updated'
                  ? s.updateUpdated
                  : update === 'current'
                    ? s.updateCurrent
                    : s.updateError}
            </Text>
          )}
        </Section>

        {/* Despre */}
        <Section title={s.sectionAbout} styles={styles}>
          <Pressable
            onPress={() => {
              track('share_app', { source: 'settings' });
              Share.share({ message: s.shareAppMessage(DOWNLOAD_URL) }).catch(() => undefined);
            }}
            style={styles.listItem}
          >
            <Text style={styles.body}>📤 {s.shareApp}</Text>
          </Pressable>
          <View style={[styles.row, styles.listItem]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.body}>📊 {s.analytics}</Text>
              <Text style={styles.small}>{s.analyticsDesc}</Text>
            </View>
            <Switch
              value={settings.analyticsEnabled}
              onValueChange={(v) => {
                if (!v) track('analytics_disabled');
                settings.setAnalyticsEnabled(v);
              }}
              trackColor={{ true: theme.primary, false: theme.outline }}
              thumbColor={isAndroid ? theme.surface : undefined}
            />
          </View>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.listItem}>
            <Text style={styles.body}>🔒 {s.privacy}</Text>
          </Pressable>
          <Text style={[styles.small, { marginTop: 8 }]}>
            {s.appVersion(Application.nativeApplicationVersion ?? '—')}
          </Text>
          <Text style={[styles.small, { marginTop: 8, lineHeight: 18 }]}>{s.sourceNote}</Text>
          <Pressable onPress={() => Linking.openURL(OFFICIAL_SOURCE_URL)} style={styles.listItem}>
            <Text style={styles.link}>🏛️ {s.officialSource} ↗</Text>
          </Pressable>
        </Section>
      </ScrollView>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function Section({ title, styles, children }: { title: string; styles: Styles; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ label, selected, onPress, styles }: { label: string; selected: boolean; onPress: () => void; styles: Styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function HourPicker(props: {
  label: string;
  value: ReminderHour;
  options: number[];
  offLabel: string;
  onChange: (v: ReminderHour) => void;
  styles: Styles;
}) {
  const { label, value, options, offLabel, onChange, styles } = props;
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        <Chip label={offLabel} selected={value === null} onPress={() => onChange(null)} styles={styles} />
        {options.map((h) => (
          <Chip key={h} label={hourLabel(h)} selected={value === h} onPress={() => onChange(h)} styles={styles} />
        ))}
      </View>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
    title: { flex: 1, fontSize: 24, fontWeight: '800', color: t.text },
    close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    closeText: { fontSize: 22, color: t.text },
    card: { backgroundColor: t.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: t.outline },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: t.primary, marginBottom: 10, letterSpacing: 0.3 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    body: { fontSize: 15, color: t.text },
    small: { fontSize: 13, color: t.textMuted },
    label: { fontSize: 13, fontWeight: '600', color: t.text, marginBottom: 6 },
    link: { fontSize: 14, fontWeight: '700', color: t.primary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderWidth: 1,
      borderColor: t.outline,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: t.surface,
    },
    chipSelected: { backgroundColor: t.primaryContainer, borderColor: t.primaryContainer },
    chipText: { fontSize: 13, color: t.text },
    chipTextSelected: { color: t.onPrimaryContainer, fontWeight: '700' },
    tonalButton: { backgroundColor: t.primaryContainer, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
    tonalButtonText: { fontSize: 13, fontWeight: '700', color: t.onPrimaryContainer },
    listItem: { paddingVertical: 10 },
    warning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.errorContainer,
      borderRadius: 12,
      padding: 10,
      marginTop: 12,
    },
    warningText: { fontSize: 12, color: t.onErrorContainer },
    warningButton: { backgroundColor: t.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
    warningButtonText: { fontSize: 13, fontWeight: '700', color: t.primary },
  });
}
