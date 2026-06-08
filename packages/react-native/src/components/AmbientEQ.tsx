/**
 * AmbientEQ — RN equivalent of the web ambient-eq CSS animation.
 *
 * 12 vertical bars that loop a stagger animation while playing. Uses
 * Reanimated `withRepeat` so the animation runs off the UI thread —
 * no JS-thread cost, no rerender per frame.
 */

import { useEffect } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — react-native is a peer dep
import { StyleSheet, View } from 'react-native'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — react-native-reanimated is a peer dep
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'

interface AmbientEQProps {
  active: boolean
  accent: string
  barCount?: number
}

interface BarProps {
  active: boolean
  accent: string
  delay: number
}

function Bar({ active, accent, delay }: BarProps) {
  const scale = useSharedValue(0.3)

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withTiming(1, { duration: 600 + delay * 30 }),
        -1,
        true,
      )
    } else {
      cancelAnimation(scale)
      scale.value = withTiming(0.3, { duration: 200 })
    }
    return () => {
      cancelAnimation(scale)
    }
  }, [active, delay, scale])

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }))

  return <Animated.View style={[styles.bar, { backgroundColor: accent }, style]} />
}

export function AmbientEQ({ active, accent, barCount = 12 }: AmbientEQProps) {
  return (
    <View style={styles.row} pointerEvents="none">
      {Array.from({ length: barCount }).map((_, i) => (
        <Bar key={i} active={active} accent={accent} delay={i} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    opacity: 0.45,
  },
  bar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
})
