/**
 * avShim.js — Safe expo-av wrapper
 *
 * expo-av requires the native `ExponentAV` module which is NOT available in
 * Expo Go on Android (SDK 53+). Importing expo-av directly crashes the app at
 * module load time with "[runtime not ready]: Cannot find native module
 * 'ExponentAV'".
 *
 * This shim:
 *  1. Tries to load expo-av at runtime.
 *  2. Returns working implementations when the native module is available.
 *  3. Returns no-op stubs otherwise, so UI degrades gracefully instead of crashing.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// --------------------------------------------------------------------------
// Availability detection — synchronous, cached
// --------------------------------------------------------------------------
let _available = null;

function isAVAvailable() {
  if (_available !== null) return _available;
  try {
    // If the native module doesn't exist this require throws.
    const mod = require('expo-av');
    // Verify the Audio API surface exists (belt-and-suspenders).
    _available = !!(mod && mod.Audio);
  } catch {
    _available = false;
  }
  return _available;
}

// --------------------------------------------------------------------------
// Lazy getter — returns the real expo-av module (or null)
// --------------------------------------------------------------------------
let _av = null;

function getAV() {
  if (_av) return _av;
  if (!isAVAvailable()) return null;
  try {
    _av = require('expo-av');
  } catch {
    _available = false;
  }
  return _av;
}

// --------------------------------------------------------------------------
// Stub Video component shown when expo-av is unavailable
// --------------------------------------------------------------------------
function VideoUnavailable({ style }) {
  return (
    <View style={[styles.stub, style]}>
      <Text style={styles.stubText}>📹 Video unavailable in Expo Go</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stub: { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  stubText: { color: '#aaa', fontSize: 13 },
});

// --------------------------------------------------------------------------
// Exports — mirrors expo-av's public API
// --------------------------------------------------------------------------

/**
 * `Video` component — real when available, stub otherwise.
 * Usage: same props as expo-av <Video>.
 */
export const Video = React.forwardRef((props, ref) => {
  const av = getAV();
  if (!av) return <VideoUnavailable style={props.style} />;
  const RealVideo = av.Video;
  return <RealVideo ref={ref} {...props} />;
});
Video.displayName = 'Video';

/**
 * `ResizeMode` enum — real when available, fallback strings otherwise.
 */
export const ResizeMode = (() => {
  const av = getAV();
  if (av?.ResizeMode) return av.ResizeMode;
  return { CONTAIN: 'contain', COVER: 'cover', STRETCH: 'stretch', NONE: 'none' };
})();

/**
 * `Audio` namespace — real when available, no-op stubs otherwise.
 */
export const Audio = (() => {
  const av = getAV();
  if (av?.Audio) return av.Audio;

  // Stub — all methods silently fail / return safe defaults
  const noop = async () => ({});
  class StubRecording {
    prepareToRecordAsync = noop;
    startAsync = noop;
    stopAndUnloadAsync = noop;
    getURI = () => null;
    getStatusAsync = async () => ({ durationMillis: 0 });
  }
  class StubSound {
    static createAsync = async () => ({ sound: new StubSound(), status: {} });
    playAsync = noop;
    pauseAsync = noop;
    stopAsync = noop;
    unloadAsync = noop;
    setRateAsync = noop;
    getStatusAsync = async () => ({});
    setOnPlaybackStatusUpdate = () => {};
  }

  return {
    requestPermissionsAsync: noop,
    setAudioModeAsync: noop,
    Sound: StubSound,
    Recording: StubRecording,
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
  };
})();
