/**
 * Pulso — RN equivalent of the web pulso heartbeat ring CSS animation.
 *
 * Two concentric circles that expand + fade in a lub-dub-rest cycle
 * while playing. Reanimated `withRepeat` keeps the animation on the
 * UI thread.
 */

import { useEffect } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { StyleSheet, View } from 'react-native'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated'

interface PulsoProps {
  active: boolean
  accent: string
  size?: number
}

interface RingProps {
  active: boolean
  accent: string
  delay: number
}

function Ring({ active, accent, delay }: RingProps) {
  const scale = useSharedValue(0.6)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withDelay(
          delay,
          withSequence(
            withTiming(1.4, { duration: 800 }),
            withTiming(0.6, { duration: 0 }),
          ),
        ),
        -1,
        false,
      )
      opacity.value = withRepeat(
        withDelay(
          delay,
          withSequence(
            withTiming(0.6, { duration: 0 }),
            withTiming(0, { duration: 800 }),
          ),
        ),
        -1,
        false,
      )
    } else {
      cancelAnimation(scale)
      cancelAnimation(opacity)
      scale.value = withTiming(0.6, { duration: 200 })
      opacity.value = withTiming(0, { duration: 200 })
    }
    return () => {
      cancelAnimation(scale)
      cancelAnimation(opacity)
    }
  }, [active, delay, scale, opacity])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[styles.ring, { borderColor: accent }, style]}
      pointerEvents="none"
    />
  )
}

export function Pulso({ active, accent, size = 80 }: PulsoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Ring active={active} accent={accent} delay={0} />
      <Ring active={active} accent={accent} delay={400} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    borderWidth: 2,
  },
})
