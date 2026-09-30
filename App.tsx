import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Modal, View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { track } from './src/analytics';
import { Street, sectorNumber } from './src/data/sectors';
import HomeScreen from './src/HomeScreen';
import SettingsScreen from './src/SettingsScreen';
import SharePrompt from './src/SharePrompt';
import StreetPicker from './src/StreetPicker';
import { useSettings } from './src/settings';
import { DARK, LIGHT } from './src/theme';
import { useReminders, useScheduleData } from './src/useReminders';

type Overlay = 'street' | 'settings' | null;

export default function App() {
  const theme = useColorScheme() === 'dark' ? DARK : LIGHT;
  const dataReady = useScheduleData();
  const settings = useSettings();
  const reminders = useReminders(settings);
  // Setările se deschid peste ecranul principal; „Schimbă strada” se poate deschide și din ele.
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // „Trimiți unui vecin?” – o singură dată, puțin după ce s-au programat primele mementouri.
  const [shareVisible, setShareVisible] = useState(false);
  const shareDue = !settings.sharePromptShown && (reminders.scheduledCount ?? 0) > 0;
  useEffect(() => {
    if (!shareDue) return;
    const timer = setTimeout(() => setShareVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [shareDue]);

  const chooseStreet = (street: Street, event: 'onboarding_done' | 'street_changed') => {
    settings.setStreet(street.id);
    track(event, { sector: sectorNumber(street) });
  };

  let content;
  if (!settings.loaded || !dataReady) {
    // Setările se citesc într-o fracțiune de secundă; evităm să afișăm onboarding-ul degeaba.
    content = <View style={{ flex: 1, backgroundColor: theme.background }} />;
  } else if (!settings.street) {
    // 1. Prima pornire: alegerea străzii.
    content = (
      <StreetPicker
        mode="onboarding"
        theme={theme}
        lang={settings.lang}
        onLangChange={settings.setLang}
        onConfirm={(street) => chooseStreet(street, 'onboarding_done')}
      />
    );
  } else {
    // 2. Ecranul principal, cu programul străzii alese.
    const street = settings.street;
    content = (
      <>
        <HomeScreen
          theme={theme}
          settings={settings}
          reminders={reminders}
          street={street}
          onChangeStreet={() => setOverlay('street')}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <Modal
          visible={settingsOpen}
          animationType="slide"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setSettingsOpen(false)}
        >
          <SettingsScreen
            theme={theme}
            settings={settings}
            reminders={reminders}
            onChangeStreet={() => setOverlay('street')}
            onClose={() => setSettingsOpen(false)}
          />
          {/* Alegerea străzii deschisă din Setări apare peste ele. */}
          {streetModal(settingsOpen && overlay === 'street')}
        </Modal>
        {streetModal(!settingsOpen && overlay === 'street')}
        <SharePrompt
          visible={shareVisible && !settingsOpen && overlay === null}
          theme={theme}
          lang={settings.lang}
          times={settings.times}
          onClose={() => {
            setShareVisible(false);
            settings.markSharePromptShown();
          }}
        />
      </>
    );
  }

  function streetModal(visible: boolean) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOverlay(null)}
      >
        <StreetPicker
          mode="change"
          theme={theme}
          lang={settings.lang}
          onLangChange={settings.setLang}
          initial={settings.street}
          onCancel={() => setOverlay(null)}
          onConfirm={(street) => {
            chooseStreet(street, 'street_changed');
            setOverlay(null);
          }}
        />
      </Modal>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {content}
    </SafeAreaProvider>
  );
}
