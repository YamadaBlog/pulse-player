/**
 * Vitest mock for react-native-reanimated. Returns no-op shared values
 * and animated views so the index can be imported in Node.
 */

const View = () => null

const Animated = {
  View,
  Text: () => null,
}

export default Animated

export const useSharedValue = (v: number) => ({ value: v })
export const useAnimatedStyle = (_cb: () => object) => ({})
export const withRepeat = (v: unknown, _times: number, _yo?: boolean) => v
export const withTiming = (v: number, _opts?: object) => v
export const withSequence = (...args: unknown[]) => args[0]
export const withDelay = (_delay: number, v: unknown) => v
export const cancelAnimation = (_v: unknown) => undefined
