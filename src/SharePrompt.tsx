import { useMemo } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { track } from './analytics';
import { DOWNLOAD_URL } from './config';
import { Lang, reminderSummary, strings } from './i18n';
import { ReminderTimes } from './settings';
import { Theme } from './theme';

interface Props {
  visible: boolean;
  theme: Theme;
  lang: Lang;
  times: ReminderTimes;
  onClose: () => void;
}

/** Apare o singură dată, după ce s-au programat primele mementouri. */
export default function SharePrompt({ visible, theme, lang, times, onClose }: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const s = strings(lang);

  const onShare = async () => {
    onClose();
    track('share_app', { source: 'prompt' });
    await Share.share({ message: s.shareAppMessage(DOWNLOAD_URL) }).catch(() => undefined);
  };

  const onLater = () => {
    onClose();
    track('share_prompt_dismissed');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.emoji}>🏘️</Text>
          <Text style={styles.title}>{s.sharePromptTitle}</Text>
          <Text style={styles.text}>{s.sharePromptText(reminderSummary(lang, times))}</Text>
          <Pressable onPress={onShare} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}>
            <Text style={styles.primaryText}>📤  {s.sharePromptShare}</Text>
          </Pressable>
          <Pressable onPress={onLater} style={styles.secondary} hitSlop={8}>
            <Text style={styles.secondaryText}>{s.later}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
    dialog: { backgroundColor: t.surface, borderRadius: 28, padding: 24, alignItems: 'center' },
    emoji: { fontSize: 44 },
    title: { fontSize: 22, fontWeight: '800', color: t.text, marginTop: 8, textAlign: 'center' },
    text: { fontSize: 15, color: t.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 21 },
    primary: {
      backgroundColor: t.primary,
      borderRadius: 16,
      paddingVertical: 14,
      alignSelf: 'stretch',
      alignItems: 'center',
      marginTop: 20,
    },
    primaryText: { fontSize: 16, fontWeight: '700', color: t.onPrimary },
    secondary: { paddingVertical: 12, marginTop: 4 },
    secondaryText: { fontSize: 15, fontWeight: '600', color: t.textMuted },
  });
}
