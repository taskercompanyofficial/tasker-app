const fs = require('fs');
const path = require('path');

function createWavBuffer(samples, sampleRate = 22050) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intVal = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(intVal), 44 + i * 2);
  }

  return buffer;
}

const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

const sampleRate = 22050;

// 1. Dialtone (Caller ringback: standard 440+480 Hz tone, 1.6s ring, 1.8s pause)
{
  const duration = 3.4;
  const totalSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(totalSamples);
  const ringDuration = 1.6;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    if (t < ringDuration) {
      // 20ms fade in / out
      let env = 1.0;
      if (t < 0.02) env = t / 0.02;
      else if (t > ringDuration - 0.02) env = (ringDuration - t) / 0.02;

      const s = 0.35 * Math.sin(2 * Math.PI * 440 * t) + 0.35 * Math.sin(2 * Math.PI * 480 * t);
      samples[i] = s * env;
    } else {
      samples[i] = 0;
    }
  }

  const wav = createWavBuffer(samples, sampleRate);
  fs.writeFileSync(path.join(soundsDir, 'dialtone.wav'), wav);
  console.log('Generated dialtone.wav (', wav.length, 'bytes )');
}

// 2. Ringtone (Incoming call chime / melody: 3.2s total loop)
{
  const duration = 3.2;
  const totalSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(totalSamples);

  // Sequence of notes: [freq, startTime, duration]
  // Cheerful chime: E5 (659.25), G#5 (830.61), B5 (987.77), E6 (1318.51)
  const notes = [
    [659.25, 0.00, 0.3],
    [830.61, 0.16, 0.3],
    [987.77, 0.32, 0.3],
    [1318.51, 0.48, 0.6],

    [987.77, 0.90, 0.3],
    [1318.51, 1.06, 0.3],
    [1661.22, 1.22, 0.7],

    [1318.51, 1.70, 0.3],
    [987.77, 1.86, 0.3],
    [830.61, 2.02, 0.4],
    [659.25, 2.18, 0.7],
  ];

  for (const [freq, start, dur] of notes) {
    const startSample = Math.floor(start * sampleRate);
    const noteSamples = Math.floor(dur * sampleRate);

    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / sampleRate;
      // Exponential decay envelope
      const env = Math.exp(-4.5 * t);
      // Main tone + subtle harmonics for bell/chime timbre
      const wave =
        0.45 * Math.sin(2 * Math.PI * freq * t) +
        0.20 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.08 * Math.sin(2 * Math.PI * freq * 3 * t);

      samples[idx] += wave * env;
    }
  }

  // Normalize samples to avoid clipping
  let maxAmp = 0;
  for (let i = 0; i < totalSamples; i++) {
    if (Math.abs(samples[i]) > maxAmp) maxAmp = Math.abs(samples[i]);
  }
  if (maxAmp > 0.85) {
    for (let i = 0; i < totalSamples; i++) {
      samples[i] = (samples[i] / maxAmp) * 0.85;
    }
  }

  const wav = createWavBuffer(samples, sampleRate);
  fs.writeFileSync(path.join(soundsDir, 'ringtone.wav'), wav);
  console.log('Generated ringtone.wav (', wav.length, 'bytes )');
}
