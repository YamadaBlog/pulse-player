/**
 * PulseFabRN — React Native floating action button.
 *
 * Equivalent of the web `<pulse-fab>` Custom Element. Renders a
 * circular button with the current cover art, pulso heartbeat ring
 * (when active), and optional drag-to-reposition + persisted
 * position via AsyncStorage.
 *
 * v3.0.0-rc.1 ships the basic FAB (cover + tap-to-toggle + pulso).
 * Drag-to-reposition + the radial menu land in subsequent patches —
 * react-native-gesture-handler's PanGestureHandler integration needs
 * a setup pass per Expo SDK version.
 */

import { useEffect, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { PulseFabRNProps } from '../types'
import { CoverArt } from './CoverArt'
import { Pulso } from './Pulso'
import { resolveVariant } from './variants'
import { usePulseAudioRN } from '../hooks/usePulseAudio'

export function PulseFabRN({
  variant = 'midnight',
  pulso = false,
  onPlay,
  onPause,
  onTrackChange,
  onError,
  style,
}: PulseFabRNProps) {
  const { accent } = useMemo(() => resolveVariant(variant), [variant])
  const audio = usePulseAudioRN()

  useEffect(() => {
    const offs: Array<() => void> = []
    if (onPlay) offs.push(audio.subscribe('play', onPlay))
    if (onPause) offs.push(audio.subscribe('pause', onPause))
    if (onTrackChange) offs.push(audio.subscribe('trackchange', onTrackChange))
    if (onError) offs.push(audio.subscribe('error', onError))
    return () => {
      for (const off of offs) off()
    }
  }, [audio, onPlay, onPause, onTrackChange, onError])

  const isPlaying = audio.isPlaying
  const track = audio.track

  return (
    <View style={[styles.container, style]} testID="pulse-fab-wrapper">
      {pulso && <Pulso active={isPlaying} accent={accent} size={72} />}
      <Pressable
        style={[styles.fab, { borderColor: accent }]}
        onPress={audio.toggle}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityState={{ pressed: isPlaying }}
        testID="pulse-fab"
      >
        {track.cover ? (
          <CoverArt src={track.cover} size={56} accent={accent} />
        ) : (
          <Text style={[styles.fallback, { color: accent }]}>♪</Text>
        )}
        <View style={[styles.iconOverlay, { borderColor: accent }]}>
          <Text style={[styles.iconText, { color: accent }]}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0B23',
  },
  fallback: {
    fontSize: 28,
  },
  iconOverlay: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#05050A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 11,
  },
})
