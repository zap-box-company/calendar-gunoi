/** Partea nativă a widgetului – se încarcă doar în APK (vezi `index.ts`). */
import { requestWidgetUpdate } from 'react-native-android-widget';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { NextPickupWidget, WIDGET_NAME } from './NextPickupWidget';
import { WidgetState, loadWidgetState } from './state';

/** Android cere widgetul: la adăugare, la redimensionare și periodic (la 30 de minute). */
export async function widgetTaskHandler({ widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED') return;
  renderWidget(<NextPickupWidget state={await loadWidgetState()} />);
}

/** Redesenează widgetul imediat (ex. după schimbarea străzii). */
export async function refreshWidget(state: WidgetState) {
  await requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: () => <NextPickupWidget state={state} />,
  });
}
