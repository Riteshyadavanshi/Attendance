import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Reliable top inset on Android (status bar) and iOS notch. */
export function useSafeInsets() {
  const insets = useSafeAreaInsets();
  const androidStatus = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const top = Math.max(insets.top, androidStatus);

  return {
    top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
  };
}
