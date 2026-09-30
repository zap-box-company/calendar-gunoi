import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';
import type { WidgetState } from './state';

export const WIDGET_NAME = 'NextPickup';

const c = (hex: string) => hex as ColorProp;

/** Widgetul „Următoarea ridicare” de pe ecranul principal al telefonului. */
export function NextPickupWidget({ state }: { state: WidgetState }) {
  if (state.kind !== 'next') {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: c('#2E7D32'),
          borderRadius: 24,
          padding: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text="🗑️" style={{ fontSize: 28 }} />
        <TextWidget
          text={state.message}
          style={{ fontSize: 14, color: c('#FFFFFF'), textAlign: 'center', marginTop: 6 }}
          maxLines={3}
        />
        {state.kind === 'none' && (
          <TextWidget text={state.street} style={{ fontSize: 11, color: c('#E8F5E9'), marginTop: 4 }} maxLines={1} />
        )}
      </FlexWidget>
    );
  }

  const on = c(state.on);
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: { from: c(state.colors[0]), to: c(state.colors[1]), orientation: 'TL_BR' },
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget text={state.label} style={{ fontSize: 10, color: on, letterSpacing: 0.1 }} />
        <TextWidget text={state.when} style={{ fontSize: 26, fontWeight: '700', color: on }} maxLines={1} />
        <TextWidget text={state.date} style={{ fontSize: 13, color: on }} maxLines={1} />
      </FlexWidget>
      <FlexWidget
        style={{
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
          width: 'match_parent',
        }}
      >
        {state.lines.map((line) => (
          <TextWidget
            key={line}
            text={line}
            style={{ fontSize: 13, fontWeight: '600', color: c('#1B1B1B') }}
            maxLines={1}
            truncate="END"
          />
        ))}
        <TextWidget
          text={state.street}
          style={{ fontSize: 11, color: c('#555555') }}
          maxLines={1}
          truncate="END"
        />
      </FlexWidget>
    </FlexWidget>
  );
}
