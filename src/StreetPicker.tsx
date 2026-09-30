import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LOCATION, fromKey } from './data/schedule';
import { Street, matchesStreet, useData } from './data/sectors';
import { Lang, strings } from './i18n';
import { Theme } from './theme';

interface Props {
  theme: Theme;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  /** „onboarding” = prima pornire; „change” = schimbarea străzii din aplicație. */
  mode: 'onboarding' | 'change';
  initial?: Street;
  onConfirm: (street: Street) => void;
  onCancel?: () => void;
}

export default function StreetPicker({ theme, lang, onLangChange, mode, initial, onConfirm, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const s = strings(lang);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Street | undefined>(initial);
  const data = useData();

  const sections = useMemo(
    () =>
      Object.values(data.sectors)
        .sort((a, b) => a.number - b.number)
        .map((sector) => {
          // Ziua pubelei negre/maro, dedusă din prima ridicare a sectorului.
          const first = sector.schedule.pickups.find((p) => p.type === 'residual');
          const weekday = first ? s.weekdays[fromKey(first.date).getDay()] : '';
          return {
            title: s.sector(sector.number),
            hint: weekday ? s.sectorHint(weekday) : '',
            data: data.streets.filter((st) => st.sector === sector.id && matchesStreet(st, query)),
          };
        })
        .filter((sec) => sec.data.length > 0),
    [query, s, data],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.topRow}>
          {mode === 'change' ? (
            <Pressable onPress={onCancel} hitSlop={12} accessibilityLabel={s.cancel} style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <View style={styles.langSwitch}>
            {(['ro', 'en'] as Lang[]).map((l) => (
              <Pressable
                key={l}
                onPress={() => onLangChange(l)}
                style={[styles.langOption, lang === l && styles.langOptionActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: lang === l }}
              >
                <Text style={[styles.langText, lang === l && styles.langTextActive]}>{l.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {mode === 'onboarding' ? (
          <>
            <View style={styles.logo}>
              <Text style={{ fontSize: 34 }}>🗑️</Text>
            </View>
            <Text style={styles.title}>{s.welcomeTitle}</Text>
            <Text style={styles.subtitle}>
              Calendar Gunoi · {LOCATION}
            </Text>
            <Text style={styles.body}>{s.welcomeText}</Text>
          </>
        ) : (
          <Text style={styles.title}>{s.changeStreet}</Text>
        )}

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={s.searchStreet}
          placeholderTextColor={theme.textMuted}
          style={styles.search}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(st) => st.id}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>{s.noStreetFound}</Text>}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionHint}>{section.hint}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const active = selected?.id === item.id;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              style={[styles.item, active && styles.itemActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.itemText, active && styles.itemTextActive]}>{s.street(item.name)}</Text>
            </Pressable>
          );
        }}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => selected && onConfirm(selected)}
          disabled={!selected}
          style={({ pressed }) => [styles.button, !selected && styles.buttonDisabled, pressed && { opacity: 0.85 }]}
        >
          <Text style={[styles.buttonText, !selected && styles.buttonTextDisabled]}>
            {mode === 'onboarding' ? s.continue : s.save}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    header: { paddingHorizontal: 16, paddingTop: 8 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    closeText: { fontSize: 22, color: t.text },
    langSwitch: { flexDirection: 'row', backgroundColor: t.surfaceHigh, borderRadius: 20, padding: 3 },
    langOption: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 17 },
    langOptionActive: { backgroundColor: t.primary },
    langText: { fontSize: 12, fontWeight: '700', color: t.textMuted },
    langTextActive: { color: t.onPrimary },
    logo: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: t.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    title: { fontSize: 28, fontWeight: '800', color: t.text, marginTop: 12 },
    subtitle: { fontSize: 13, color: t.primary, fontWeight: '600', marginTop: 2 },
    body: { fontSize: 15, color: t.textMuted, marginTop: 8, lineHeight: 21 },
    search: {
      marginTop: 16,
      marginBottom: 4,
      backgroundColor: t.surface,
      borderColor: t.outline,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      fontSize: 16,
      color: t.text,
    },
    sectionHeader: { backgroundColor: t.background, paddingTop: 14, paddingBottom: 6 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: t.primary },
    sectionHint: { fontSize: 12, color: t.textMuted },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.outline,
      paddingHorizontal: 14,
      paddingVertical: 13,
      marginBottom: 6,
    },
    itemActive: { borderColor: t.primary, backgroundColor: t.primaryContainer },
    itemText: { fontSize: 15, color: t.text, flex: 1 },
    itemTextActive: { color: t.onPrimaryContainer, fontWeight: '700' },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: t.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: { borderColor: t.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary },
    empty: { textAlign: 'center', color: t.textMuted, padding: 24 },
    footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.outline, backgroundColor: t.background },
    button: { backgroundColor: t.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    buttonDisabled: { backgroundColor: t.surfaceHigh },
    buttonText: { fontSize: 16, fontWeight: '700', color: t.onPrimary },
    buttonTextDisabled: { color: t.textMuted },
  });
}
