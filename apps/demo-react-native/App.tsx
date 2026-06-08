/**
 * @pulse-music/demo-react-native — Expo demo app for the RN renderer.
 *
 * Boots a single screen showing:
 *   - PulsePlayerRN inline card with a 3-track demo playlist
 *   - PulseFabRN bottom-right floating action button
 *   - Variant picker at the top (3 named themes)
 *
 * Run with:  npm run android   (boots emulator + bundles)
 *            npm run ios       (macOS only)
 *            npm run web       (Expo web target — works on any OS)
 */

import { useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import { PulsePlayerRN, PulseFabRN } from '@pulse-music/react-native'
import type { PulseVariant } from '@pulse-music/react-native'

const VARIANTS: PulseVariant[] = ['midnight', 'sunset', 'vinyl']

export default function App() {
  const [variant, setVariant] = useState<PulseVariant>('midnight')

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Pulse RN demo</Text>
        <Text style={styles.subtitle}>
          @pulse-music/react-native · v3.0.0-rc.1
        </Text>

        <View style={styles.pickerRow}>
          {VARIANTS.map((v) => (
            <Pressable
              key={v}
              style={[
                styles.pickerChip,
                v === variant ? styles.pickerChipActive : null,
              ]}
              onPress={() => setVariant(v)}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${v} theme`}
            >
              <Text
                style={[
                  styles.pickerChipLabel,
                  v === variant ? styles.pickerChipLabelActive : null,
                ]}
              >
                {v}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.playerWrap}>
          <PulsePlayerRN
            variant={variant}
            ambientEq
            onPlay={({ track }) => {
              // eslint-disable-next-line no-console
              console.log('[demo] play:', track.title)
            }}
          />
        </View>

        <Text style={styles.note}>
          Tap the play button to start. The ambient EQ bars run via
          Reanimated off the UI thread.
        </Text>
      </ScrollView>

      <PulseFabRN variant={variant} pulso />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05050A',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  h1: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    marginBottom: 24,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pickerChipActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  pickerChipLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  pickerChipLabelActive: {
    color: '#FFFFFF',
  },
  playerWrap: {
    marginBottom: 20,
  },
  note: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    lineHeight: 20,
  },
})
