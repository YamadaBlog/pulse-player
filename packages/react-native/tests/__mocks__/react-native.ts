/**
 * Vitest mock for `react-native`. Used only so that importing the
 * package index (which re-exports PulsePlayerRN / PulseFabRN) does
 * not crash in Node. The component tests themselves run via the
 * Expo app, not vitest.
 */

export const View = () => null
export const Text = () => null
export const Image = () => null
export const Pressable = () => null
export const ScrollView = () => null
export const SafeAreaView = () => null
export const StyleSheet = {
  create: <T extends object>(s: T) => s,
}
export const StatusBar = () => null
