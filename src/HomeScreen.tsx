import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { track } from './analytics';
import { availableUpdate } from './appUpdate';
import { DateKey, Pickup, Schedule, WASTE_TYPES, WasteType, daysBetween, fromKey, toKey } from './data/schedule';
import { Street, scheduleFor, sectorNumber, useData } from './data/sectors';
import { openIcs, saveIcs, shareIcs } from './ics';
import {
  Lang,
  fullDate,
  hourLabel,
  longDate,
  monthTitle,
  relativeDay,
  reminderSummary,
  shortDate,
  strings,
} from './i18n';
import { nextReminder } from './notifications';
import { Settings } from './settings';
import { Theme, WASTE_PALETTE } from './theme';
import { Reminders } from './useReminders';

type Entry = { kind: 'pickup'; pickup: Pickup; date: DateKey } | { kind: 'exception'; date: DateKey };

/** Ora la care începe colectarea – ținta numărătorii inverse. */
const PICKUP_HOUR = 6;

/** Lista dinamică: ridicările străzii de azi până la sfârșitul programului. */
function buildEntries(schedule: Schedule, filter: WasteType | null, today: DateKey): Entry[] {
  const pickups: Entry[] = schedule.pickups
    .filter((p) => p.date >= today && (!filter || p.type === filter))
    .map((p) => ({ kind: 'pickup', pickup: p, date: p.date }));
  const exceptions: Entry[] =
    filter === 'residual'
      ? []
      : schedule.exceptions.filter((d) => d >= today).map((date) => ({ kind: 'exception', date }));
  return [...pickups, ...exceptions].sort((a, b) => a.date.localeCompare(b.date));
}

function notify(message: string) {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert(message);
}

interface Props {
  theme: Theme;
  settings: Settings;
  reminders: Reminders;
  street: Street;
  onChangeStreet: () => void;
  onOpenSettings: () => void;
}

export default function HomeScreen({ theme, settings, reminders, street, onChangeStreet, onOpenSettings }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const data = useData();
  const { lang, times, doneDates } = settings;
  const s = strings(lang);
  const schedule = scheduleFor(street, data);

  // Ceasul ecranului – actualizat la fiecare 30 s pentru numărătoarea inversă.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    const sub = AppState.addEventListener('change', (st) => st === 'active' && setNow(new Date()));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  const today = toKey(now);

  const [filter, setFilter] = useState<WasteType | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const runExport = useCallback(
    async (action: 'open' | 'save' | 'share') => {
      setMenuOpen(false);
      const input = { lang, street, times };
      track('ics_export', { action });
      try {
        if (action === 'open') await openIcs(input);
        if (action === 'share') await shareIcs(input);
        if (action === 'save' && (await saveIcs(input))) notify(strings(lang).savedIcs);
      } catch {
        notify(strings(lang).exportFailed);
      }
    },
    [lang, street, times],
  );

  const sections = useMemo(() => {
    const entries = buildEntries(schedule, filter, today);
    const byMonth = new Map<string, Entry[]>();
    for (const e of entries) {
      const month = e.date.slice(0, 7);
      byMonth.set(month, [...(byMonth.get(month) ?? []), e]);
    }
    return [...byMonth.entries()].map(([month, items]) => ({
      title: monthTitle(lang, `${month}-01`),
      data: items,
    }));
  }, [schedule, filter, today, lang]);

  const showBatteryTip =
    Platform.OS === 'android' && !settings.batteryTipDismissed && settings.notificationsEnabled && !!reminders.permission;

  const update = availableUpdate(data);

  const header = (
    <View style={{ gap: 12 }}>
      {update && (
        <Pressable
          style={[styles.card, styles.updateCard]}
          onPress={() => {
            track('update_clicked', { to: update.version });
            Linking.openURL(update.url);
          }}
          accessibilityRole="button"
        >
          <View style={styles.row}>
            <Text style={{ fontSize: 26, marginRight: 12 }}>⬆️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.updateTitle}>{s.updateTitle(update.version)}</Text>
              <Text style={styles.updateText}>{s.updateText}</Text>
            </View>
          </View>
          <View style={styles.updateButton}>
            <Text style={styles.updateButtonText}>{s.updateButton}</Text>
          </View>
        </Pressable>
      )}
      <NextPickupHero
        now={now}
        lang={lang}
        schedule={schedule}
        doneDates={doneDates}
        onDone={settings.setDone}
        styles={styles}
      />
      <TypeTiles today={today} lang={lang} schedule={schedule} styles={styles} />
      <ReminderStatus
        lang={lang}
        styles={styles}
        now={now}
        schedule={schedule}
        settings={settings}
        permission={reminders.permission}
        onAllow={reminders.askPermission}
        onOpenSettings={onOpenSettings}
      />
      {showBatteryTip && (
        <View style={[styles.card, styles.tipCard]}>
          <Text style={styles.h3}>🔋 {s.reliabilityTitle}</Text>
          <Text style={[styles.muted, { marginTop: 4 }]}>{s.reliabilityText}</Text>
          <View style={[styles.row, { gap: 16, marginTop: 10, justifyContent: 'flex-end' }]}>
            <Pressable onPress={settings.dismissBatteryTip} hitSlop={8}>
              <Text style={[styles.link, { color: theme.textMuted }]}>{s.later}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                settings.dismissBatteryTip();
                onOpenSettings();
              }}
              hitSlop={8}
            >
              <Text style={styles.link}>{s.check}</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={{ marginTop: 8 }}>
        <Text style={styles.h2}>{s.upcomingPickups}</Text>
        {schedule.lastDate && <Text style={styles.muted}>{s.untilDate(fullDate(lang, schedule.lastDate))}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          <Chip label={s.all} selected={filter === null} onPress={() => setFilter(null)} styles={styles} />
          {WASTE_TYPES.map((type) => (
            <Chip
              key={type}
              label={`${WASTE_PALETTE[type].emoji} ${s.waste[type].title}`}
              selected={filter === type}
              onPress={() => setFilter(filter === type ? null : type)}
              styles={styles}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Bara de sus: strada selectată */}
      <View style={styles.topBar}>
        <Pressable style={{ flex: 1 }} onPress={onChangeStreet} accessibilityRole="button" accessibilityLabel={s.changeStreet}>
          <Text style={styles.appTitle}>Calendar Gunoi</Text>
          <View style={styles.streetChip}>
            <Text style={styles.streetChipText} numberOfLines={1}>
              📍 {s.street(street.name)} · {s.sector(sectorNumber(street, data))}
            </Text>
            <Text style={styles.streetChipEdit}>✎</Text>
          </View>
        </Pressable>
        <Pressable onPress={onOpenSettings} hitSlop={10} style={styles.iconButton} accessibilityLabel={s.settings}>
          <Text style={styles.iconButtonText}>⚙️</Text>
        </Pressable>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} style={styles.iconButton} accessibilityLabel={s.moreOptions}>
          <Text style={styles.iconButtonText}>⋮</Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(e) => `${e.date}-${e.kind === 'pickup' ? e.pickup.type : 'exception'}`}
        stickySectionHeadersEnabled
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={[styles.muted, styles.empty]}>{s.empty}</Text>}
        renderSectionHeader={({ section }) => <Text style={styles.monthHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            {item.kind === 'pickup' ? (
              <PickupCard pickup={item.pickup} today={today} lang={lang} styles={styles} />
            ) : (
              <ExceptionCard date={item.date} today={today} lang={lang} styles={styles} />
            )}
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 100 }}
      />

      {/* Butonul de export */}
      <Pressable
        onPress={() => runExport('open')}
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 20, opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.fabText}>📅  {s.exportButton}</Text>
      </Pressable>

      {/* Meniul ⋮ */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            {(
              [
                ['street', `📍  ${s.changeStreet}`, onChangeStreet],
                ['settings', `⚙️  ${s.settings}`, onOpenSettings],
                ['open', `📅  ${s.openInCalendar}`, () => runExport('open')],
                ['save', `💾  ${s.saveIcs}`, () => runExport('save')],
                ['share', `📤  ${s.shareIcs}`, () => runExport('share')],
              ] as const
            ).map(([key, label, action]) => (
              <Pressable
                key={key}
                onPress={() => {
                  setMenuOpen(false);
                  action();
                }}
                style={styles.sheetItem}
              >
                <Text style={styles.sheetText}>{label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setMenuOpen(false)} style={styles.sheetItem}>
              <Text style={[styles.sheetText, styles.muted]}>{s.cancel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

// ---------------------------------------------------------------------------------------------
// „Următoarea ridicare”
// ---------------------------------------------------------------------------------------------

function NextPickupHero(props: {
  now: Date;
  lang: Lang;
  schedule: Schedule;
  doneDates: DateKey[];
  onDone: (date: DateKey, done: boolean) => void;
  styles: Styles;
}) {
  const { now, lang, schedule, doneDates, onDone, styles } = props;
  const s = strings(lang);
  const today = toKey(now);
  const next = schedule.nextPickupDay(today);

  if (!next) {
    return (
      <View style={styles.card}>
        <Text style={styles.h3}>{s.noMorePickups}</Text>
      </View>
    );
  }

  const [date, pickups] = next;
  const types = pickups.map((p) => p.type);
  const colors = types.flatMap((t) => WASTE_PALETTE[t].colors) as [string, string, ...string[]];
  const on = WASTE_PALETTE[types[0]].on;

  const target = fromKey(date);
  target.setHours(PICKUP_HOUR, 0, 0, 0);
  const minutes = Math.floor((target.getTime() - now.getTime()) / 60_000);

  // „Am scos-o” are sens cu o zi înainte și în dimineața ridicării.
  const soon = daysBetween(today, date) <= 1;
  const done = doneDates.includes(date);

  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <Text style={[styles.heroLabel, { color: on }]}>{s.nextPickup}</Text>
      <Text style={[styles.heroTitle, { color: on }]}>{relativeDay(lang, date, today)}</Text>
      <Text style={[styles.heroDate, { color: on }]}>{longDate(lang, date)}</Text>

      <View style={{ gap: 8, marginTop: 12 }}>
        {pickups.map((p) => (
          <View key={p.type} style={styles.heroType}>
            <Text style={{ fontSize: 24 }}>{WASTE_PALETTE[p.type].emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTypeTitle}>{s.waste[p.type].container}</Text>
              <Text style={styles.heroTypeSub}>{s.waste[p.type].title}</Text>
              {p.note && <Text style={styles.heroTypeNote}>ℹ️ {p.note[lang]}</Text>}
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 14 }}>
        {minutes < 0 ? (
          <Text style={[styles.heroNote, { color: on }]}>{s.pickupToday}</Text>
        ) : (
          <>
            <View style={[styles.row, { gap: 8 }]}>
              <CountdownBox value={Math.floor(minutes / 1440)} label={s.unitDays} on={on} styles={styles} />
              <CountdownBox value={Math.floor(minutes / 60) % 24} label={s.unitHours} on={on} styles={styles} />
              <CountdownBox value={minutes % 60} label={s.unitMin} on={on} styles={styles} />
            </View>
            <Text style={[styles.heroSmall, { color: on }]}>{s.untilPickup}</Text>
          </>
        )}
      </View>

      {soon && (
        <Pressable
          onPress={() => {
            onDone(date, !done);
            if (!done) track('done_pressed', { source: 'app' });
          }}
          style={({ pressed }) => [styles.doneButton, done && styles.doneButtonActive, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityState={{ checked: done }}
        >
          <Text style={styles.doneText}>{done ? s.doneLabel : s.markDone}</Text>
          {done && <Text style={styles.doneUndo}>{s.undo}</Text>}
        </Pressable>
      )}
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------------------------
// Starea mementourilor (detaliile sunt în Setări)
// ---------------------------------------------------------------------------------------------

function ReminderStatus(props: {
  lang: Lang;
  styles: Styles;
  now: Date;
  schedule: Schedule;
  settings: Settings;
  permission: boolean | null;
  onAllow: () => void;
  onOpenSettings: () => void;
}) {
  const { lang, styles, now, schedule, settings, permission } = props;
  const s = strings(lang);
  const enabled = settings.notificationsEnabled;
  const next = enabled ? nextReminder(schedule, settings.times, settings.doneDates, now) : undefined;

  return (
    <Pressable style={styles.card} onPress={props.onOpenSettings}>
      <View style={styles.row}>
        <Text style={{ fontSize: 22, marginRight: 12 }}>{enabled ? '🔔' : '🔕'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.h3}>{s.notifications}</Text>
          <Text style={styles.muted}>{enabled ? reminderSummary(lang, settings.times) : s.remindersOff}</Text>
          {enabled && permission !== false && (
            <Text style={styles.small}>
              {next ? s.nextReminder(`${shortDate(lang, toKey(next.at))}, ${hourLabel(next.at.getHours())}`) : s.noReminders}
            </Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      {enabled && permission === false && (
        <View style={styles.warning}>
          <Text style={[styles.warningText, { flex: 1 }]}>⚠️ {s.notificationsBlocked}</Text>
          <Pressable onPress={props.onAllow} style={styles.warningButton}>
            <Text style={styles.warningButtonText}>{s.allow}</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function CountdownBox({ value, label, on, styles }: { value: number; label: string; on: string; styles: Styles }) {
  return (
    <View style={[styles.countBox, { backgroundColor: on === '#FFFFFF' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' }]}>
      <Text style={[styles.countValue, { color: on }]}>{value}</Text>
      <Text style={[styles.countLabel, { color: on }]}>{label}</Text>
    </View>
  );
}

/** Grilă 2×2 cu următoarea dată pentru fiecare tip de deșeu. */
function TypeTiles({ today, lang, schedule, styles }: { today: DateKey; lang: Lang; schedule: Schedule; styles: Styles }) {
  const s = strings(lang);
  return (
    <View style={styles.tiles}>
      {WASTE_TYPES.map((type) => {
        const next = schedule.nextFor(type, today);
        return (
          <View key={type} style={styles.tile}>
            <LinearGradient colors={WASTE_PALETTE[type].colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tileStripe} />
            <View style={{ padding: 12 }}>
              <View style={[styles.row, { gap: 6 }]}>
                <Text style={{ fontSize: 18 }}>{WASTE_PALETTE[type].emoji}</Text>
                <Text style={[styles.tileTitle, { flex: 1 }]} numberOfLines={2}>
                  {s.waste[type].title}
                </Text>
              </View>
              <Text style={styles.tileDate}>{next ? shortDate(lang, next) : '—'}</Text>
              <Text style={styles.tileRel}>{next ? relativeDay(lang, next, today) : s.noDateLeft}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
// ---------------------------------------------------------------------------------------------
// Lista cronologică
// ---------------------------------------------------------------------------------------------

function Chip({ label, selected, onPress, styles }: { label: string; selected: boolean; onPress: () => void; styles: Styles }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function DayPill({ date, today, lang, styles }: { date: DateKey; today: DateKey; lang: Lang; styles: Styles }) {
  const isToday = daysBetween(today, date) === 0;
  return (
    <View style={[styles.pill, isToday && styles.pillToday]}>
      <Text style={[styles.pillText, isToday && styles.pillTextToday]}>{relativeDay(lang, date, today)}</Text>
    </View>
  );
}

function PickupCard(props: { pickup: Pickup; today: DateKey; lang: Lang; styles: Styles }) {
  const { pickup, today, lang, styles } = props;
  const { date, type, note } = pickup;
  const s = strings(lang);
  const palette = WASTE_PALETTE[type];
  return (
    <View style={[styles.pickupCard, date === today && styles.pickupCardToday]}>
      <LinearGradient colors={palette.colors} style={styles.stripe} />
      <LinearGradient colors={palette.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubble}>
        <Text style={{ fontSize: 22 }}>{palette.emoji}</Text>
      </LinearGradient>
      <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12 }}>
        <Text style={styles.h3}>{s.waste[type].title}</Text>
        <Text style={styles.muted}>{s.waste[type].container}</Text>
        <Text style={styles.small}>{longDate(lang, date)}</Text>
        {note && <Text style={styles.note}>ℹ️ {note[lang]}</Text>}
      </View>
      <View style={{ paddingRight: 12 }}>
        <DayPill date={date} today={today} lang={lang} styles={styles} />
      </View>
    </View>
  );
}

function ExceptionCard({ date, today, lang, styles }: { date: DateKey; today: DateKey; lang: Lang; styles: Styles }) {
  const s = strings(lang);
  return (
    <View style={[styles.card, styles.exceptionCard]}>
      <Text style={{ fontSize: 20, marginRight: 12 }}>⚠️</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.exceptionTitle}>{s.exception}</Text>
        <Text style={styles.exceptionDate}>{longDate(lang, date)}</Text>
      </View>
      <DayPill date={date} today={today} lang={lang} styles={styles} />
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Stiluri
// ---------------------------------------------------------------------------------------------

function makeStyles(t: Theme) {
  const shadow = Platform.select({
    android: { elevation: 2 },
    default: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  });
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    row: { flexDirection: 'row', alignItems: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
    appTitle: { fontSize: 22, fontWeight: '700', color: t.text },
    streetChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    streetChipText: { fontSize: 13, color: t.primary, fontWeight: '600', flexShrink: 1 },
    streetChipEdit: { fontSize: 13, color: t.primary },
    note: { fontSize: 12, color: t.textMuted, marginTop: 4, fontStyle: 'italic' },
    h2: { fontSize: 20, fontWeight: '700', color: t.text },
    h3: { fontSize: 16, fontWeight: '600', color: t.text },
    muted: { fontSize: 13, color: t.textMuted },
    small: { fontSize: 12, color: t.text, marginTop: 2 },
    link: { fontSize: 14, fontWeight: '600', color: t.primary },
    empty: { textAlign: 'center', padding: 24 },

    langSwitch: { flexDirection: 'row', backgroundColor: t.surfaceHigh, borderRadius: 20, padding: 3 },
    langOption: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 17 },
    langOptionActive: { backgroundColor: t.primary },
    langText: { fontSize: 12, fontWeight: '700', color: t.textMuted },
    langTextActive: { color: t.onPrimary },
    iconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    iconButtonText: { fontSize: 22, color: t.text, fontWeight: '700' },

    card: { backgroundColor: t.surface, borderRadius: 20, padding: 16, ...shadow },

    hero: { borderRadius: 28, padding: 22 },
    heroLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, opacity: 0.85 },
    heroTitle: { fontSize: 38, fontWeight: '800', marginTop: 2 },
    heroDate: { fontSize: 17, fontWeight: '500' },
    heroType: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(255,255,255,0.88)',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    heroTypeTitle: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
    heroTypeSub: { fontSize: 12, color: '#444' },
    heroTypeNote: { fontSize: 12, color: '#5D4037', marginTop: 4 },
    heroNote: { fontSize: 15, fontWeight: '700' },
    heroSmall: { fontSize: 12, marginTop: 6, opacity: 0.85 },
    countBox: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 64 },
    countValue: { fontSize: 24, fontWeight: '800' },
    countLabel: { fontSize: 11, opacity: 0.9 },

    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tile: { flexBasis: '47%', flexGrow: 1, backgroundColor: t.surface, borderRadius: 20, overflow: 'hidden', ...shadow },
    tileStripe: { height: 6 },
    tileTitle: { fontSize: 13, fontWeight: '600', color: t.text },
    tileDate: { fontSize: 15, fontWeight: '700', color: t.text, marginTop: 8 },
    tileRel: { fontSize: 12, color: t.primary, marginTop: 2 },

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

    monthHeader: {
      backgroundColor: t.background,
      color: t.primary,
      fontWeight: '700',
      fontSize: 14,
      paddingVertical: 8,
    },
    pickupCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surface,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      ...shadow,
    },
    pickupCardToday: { borderColor: t.primary },
    stripe: { width: 6, alignSelf: 'stretch' },
    bubble: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
    pill: { backgroundColor: t.surfaceHigh, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    pillToday: { backgroundColor: t.primary },
    pillText: { fontSize: 11, fontWeight: '600', color: t.text },
    pillTextToday: { color: t.onPrimary },

    exceptionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.errorContainer },
    exceptionTitle: { fontSize: 14, fontWeight: '700', color: t.onErrorContainer },
    exceptionDate: { fontSize: 12, color: t.onErrorContainer, marginTop: 2 },

    fab: {
      position: 'absolute',
      right: 16,
      backgroundColor: t.primaryContainer,
      borderRadius: 18,
      paddingHorizontal: 20,
      paddingVertical: 16,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    fabText: { fontSize: 15, fontWeight: '700', color: t.onPrimaryContainer },

    tipCard: { borderWidth: 1, borderColor: t.primaryContainer },
    updateCard: { backgroundColor: t.primaryContainer },
    updateTitle: { fontSize: 16, fontWeight: '800', color: t.onPrimaryContainer },
    updateText: { fontSize: 13, color: t.onPrimaryContainer, marginTop: 2 },
    updateButton: {
      backgroundColor: t.primary,
      borderRadius: 14,
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 12,
    },
    updateButtonText: { fontSize: 15, fontWeight: '700', color: t.onPrimary },
    chevron: { fontSize: 26, color: t.textMuted, marginLeft: 8 },
    doneButton: {
      marginTop: 14,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    doneButtonActive: { backgroundColor: '#C8EDC4' },
    doneText: { fontSize: 14, fontWeight: '700', color: '#1B5E20', flexShrink: 1 },
    doneUndo: { fontSize: 13, fontWeight: '600', color: '#2E7D32', textDecorationLine: 'underline', marginLeft: 8 },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12 },
    sheetItem: { paddingHorizontal: 24, paddingVertical: 16 },
    sheetText: { fontSize: 16, color: t.text },
  });
}
