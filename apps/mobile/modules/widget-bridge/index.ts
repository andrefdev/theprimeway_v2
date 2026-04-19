import { requireOptionalNativeModule } from 'expo-modules-core';

interface WidgetBridgeNative {
  writeSnapshot(json: string): void;
  readPendingActions(): string;
  clearPendingActions(): void;
  reloadWidgets(): void;
}

const native = requireOptionalNativeModule<WidgetBridgeNative>('WidgetBridgeModule');

export function writeSnapshot(json: string): void {
  native?.writeSnapshot(json);
}

export function readPendingActions(): string {
  return native?.readPendingActions() ?? '[]';
}

export function clearPendingActions(): void {
  native?.clearPendingActions();
}

export function reloadWidgets(): void {
  native?.reloadWidgets();
}

export const isAvailable = native != null;
