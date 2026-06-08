/**
 * CoverArt — RN equivalent of the web cover art component.
 *
 * Renders an `Image` (if cover URL provided) with a fallback to a
 * subtle gradient-tinted rectangle (using a solid accent-derived fill
 * since native gradients require a peer dep we deliberately don't
 * pull). Square aspect-ratio mirrors the web chrome.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — react-native is a peer dep
import { Image, StyleSheet, View } from 'react-native'

interface CoverArtProps {
  src?: string
  size?: number
  accent: string
}

export function CoverArt({ src, size = 64, accent }: CoverArtProps) {
  if (!src) {
    return (
      <View
        style={[
          styles.fallback,
          { width: size, height: size, backgroundColor: accent + '33' },
        ]}
      />
    )
  }
  return (
    <Image
      source={{ uri: src }}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  )
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 8,
  },
  fallback: {
    borderRadius: 8,
  },
})
