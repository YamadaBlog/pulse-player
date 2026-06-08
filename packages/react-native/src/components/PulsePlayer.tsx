/**
 * PulsePlayerRN — React Native inline player card.
 *
 * Equivalent of the web `<pulse-player>` Custom Element. Renders:
 *   - Cover art (left)
 *   - Title + artist + time + progress bar (centre column)
 *   - Play/pause + prev + next buttons (right column)
 *   - Optional ambient EQ overlay (12 bars, Reanimated)
 *
 * Props mirror the documented `PulsePlayerRNProps` interface.
 */

import { useEffect, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { PulsePlayerRNProps } from '../types'
import { AmbientEQ } from './AmbientEQ'
import { CoverArt } from './CoverArt'
import { resolveVariant } from './variants'
import { usePulseAudioRN } from '../hooks/usePulseAudio'
import { getSharedEngineRN } from '../utils/audioEngine'

export function PulsePlayerRN({
  variant = 'midnight',
  accentColor,
  tracks,
  ambientEq = false,
  onPlay,
  onPause,
  onTrackChange,
  onError,
  style,
}: PulsePlayerRNProps) {
  const { bg, accent } = useMemo(() => resolveVariant(variant, accentColor), [variant, accentColor])
  const audio = usePulseAudioRN()

  useEffect(() => {
    if (tracks && tracks.length) {
      const engine = getSharedEngineRN()
      engine.setAudioTracks(tracks)
    }
  }, [tracks])

  useEffect(() => {
    audio.setAmbientEq(ambientEq)
  }, [ambientEq, audio])

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
  const progressPercent = audio.progress

  return (
    <View
      style={[styles.card, { backgroundColor: bg }, style]}
      accessibilityRole="none"
      accessibilityLabel={`Now playing: ${track.title}${track.artist ? ', by ' + track.artist : ''}`}
      testID="pulse-player"
    >
      {ambientEq && <AmbientEQ active={isPlaying} accent={accent} />}

      <View style={styles.row}>
        <CoverArt src={track.cover} size={56} accent={accent} />

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          {track.artist ? (
            <Text style={styles.artist} numberOfLines={1}>
              {track.artist}
            </Text>
          ) : null}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(0, Math.min(100, progressPercent))}%`, backgroundColor: accent },
              ]}
            />
          </View>
          <Text style={styles.time}>
            {audio.fmt(audio.currentTime)} / {audio.fmt(audio.duration)}
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            style={styles.btn}
            onPress={audio.prev}
            accessibilityRole="button"
            accessibilityLabel="Previous track"
            testID="pulse-prev"
          >
            <Text style={styles.btnLabel}>⏮</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnMain, { borderColor: accent }]}
            onPress={audio.toggle}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            accessibilityState={{ pressed: isPlaying }}
            testID="pulse-toggle"
          >
            <Text style={[styles.btnLabel, { color: accent }]}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            onPress={audio.next}
            accessibilityRole="button"
            accessibilityLabel="Next track"
            testID="pulse-next"
          >
            <Text style={styles.btnLabel}>⏭</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  artist: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
  },
  time: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMain: {
    borderWidth: 1.5,
  },
  btnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
})
