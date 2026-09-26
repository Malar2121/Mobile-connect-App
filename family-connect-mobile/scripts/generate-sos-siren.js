/**
 * Generates assets/sounds/sos-siren.wav: a ~2 s two-tone emergency siren that
 * loops cleanly (used by the live SOS alert). Plain Node, no downloads.
 *
 *   node scripts/generate-sos-siren.js
 *
 * 16-bit PCM, mono, 22050 Hz. Four 0.5 s tones alternating 960 Hz / 770 Hz,
 * each with a short fade in and out so neither the tone changes nor the loop
 * point click.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const TONES_HZ = [960, 770, 960, 770];
const TONE_SECONDS = 0.5;
const FADE_SECONDS = 0.012;
const VOLUME = 0.95;

const toneSamples = Math.round(SAMPLE_RATE * TONE_SECONDS);
const fadeSamples = Math.round(SAMPLE_RATE * FADE_SECONDS);
const totalSamples = toneSamples * TONES_HZ.length;
const pcm = Buffer.alloc(totalSamples * 2);

let offset = 0;
for (const hz of TONES_HZ) {
  for (let i = 0; i < toneSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    // A little third harmonic makes it sound more like a siren than a pure beep.
    const wave = Math.sin(2 * Math.PI * hz * t) * 0.8 + Math.sin(2 * Math.PI * hz * 3 * t) * 0.2;
    const fade = Math.min(1, i / fadeSamples, (toneSamples - 1 - i) / fadeSamples);
    pcm.writeInt16LE(Math.round(wave * fade * VOLUME * 32767), offset);
    offset += 2;
  }
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16); // fmt chunk size
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
header.writeUInt16LE(2, 32); // block align
header.writeUInt16LE(16, 34); // bits per sample
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

const out = path.join(__dirname, '..', 'assets', 'sounds', 'sos-siren.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, pcm]));
console.log(`Wrote ${out} (${(44 + pcm.length).toLocaleString()} bytes, ${totalSamples / SAMPLE_RATE}s)`);
