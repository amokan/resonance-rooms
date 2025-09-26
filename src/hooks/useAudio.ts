import { useState, useCallback, useEffect, useRef } from 'react';
import type { UserData } from './useRoom';

export const useAudio = (users: Map<string, UserData>) => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioSupported, setAudioSupported] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [filterFrequency, setFilterFrequency] = useState(3500);
  const [reverbEnabled, setReverbEnabled] = useState(true);
  const [volume, setVolume] = useState(0.6);
  const [reverbDecay, setReverbDecay] = useState(1.7);
  const [reverbWetness, setReverbWetness] = useState(0.75);
  const [envelopeEnabled, setEnvelopeEnabled] = useState(true);
  const [attackTime, setAttackTime] = useState(0.005);
  const [releaseTime, setReleaseTime] = useState(0.05);
  const [triggerRate, setTriggerRate] = useState(3.0);

  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const envelopeGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);

  // Create a simple reverb impulse response
  const createReverbImpulse = (context: AudioContext, duration: number, decay: number): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      }
    }

    return impulse;
  };

  const generateBytebeatFormula = (users: Map<string, UserData>, t: number): number => {
    const participants = Array.from(users.values()).filter(user => !user.isViewer);
    if (participants.length === 0) return 0;

    let result = 0;

    for (let i = 0; i < participants.length && i < 10; i++) {
      const user = participants[i];
      const x = Math.floor(user.x / 10);
      const y = Math.floor(user.y / 10);

      // const formula1 = (t * x) & (t >> y);
      const formula1 = (t * x) & (t >> (y + (x % 32)));
      // const formula2 = (t >> (x % 8)) ^ (t * (y % 16));
      const formula2 = (t >> (x % 8)) ^ (t * (y % 16));
      const formula3 = ((t * x) >> (y % 12)) & ((t >> 4) * (x % 8));

      result ^= (formula1 + formula2 + formula3) % 256;
    }

    return result / 256;
  };

  const createBytebeatBuffer = useCallback((duration: number): AudioBuffer | null => {
    if (!audioContext) return null;

    const sampleRate = audioContext.sampleRate;
    const bufferLength = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferLength; i++) {
      const t = Math.floor((i / sampleRate) * 8000);
      const sample = generateBytebeatFormula(users, t);
      data[i] = (sample - 0.5) * 0.3;
    }

    return buffer;
  }, [audioContext, users]);

  const checkAudioSupport = () => {
    const hasAudioContext = !!(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    setAudioSupported(hasAudioContext);
    return hasAudioContext;
  };

  const startAudio = useCallback(async () => {
    if (!audioSupported) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      setAudioContext(ctx);

      // Create audio processing chain: source → envelope → filter → reverb → gain → destination

      // Envelope gain node for AR envelope
      const envelopeGain = ctx.createGain();
      envelopeGain.gain.value = envelopeEnabled ? 0 : 1; // Start at 0 if envelope enabled, 1 if disabled
      envelopeGainRef.current = envelopeGain;

      // Low-pass filter to soften harsh edges
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = filterFrequency;
      filterNode.Q.value = 1;
      filterNodeRef.current = filterNode;

      // Reverb for spatial depth
      const reverbNode = ctx.createConvolver();
      reverbNode.buffer = createReverbImpulse(ctx, 2, reverbDecay);
      reverbNodeRef.current = reverbNode;

      // Dry/wet mix for reverb
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      dryGain.gain.value = reverbEnabled ? (1.0 - reverbWetness) : 1.0;
      wetGain.gain.value = reverbEnabled ? reverbWetness : 0.0;
      dryGainRef.current = dryGain;
      wetGainRef.current = wetGain;

      // Final output gain
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      gainNodeRef.current = gainNode;

      // Connect the audio chain
      // Envelope → Filter → dry/wet split
      envelopeGain.connect(filterNode);
      filterNode.connect(dryGain);
      filterNode.connect(reverbNode);
      reverbNode.connect(wetGain);

      // Mix dry and wet signals
      dryGain.connect(gainNode);
      wetGain.connect(gainNode);

      // Final output
      gainNode.connect(ctx.destination);

      setAudioEnabled(true);
    } catch (error) {
      console.error('Failed to start audio:', error);
      setAudioSupported(false);
    }
  }, [audioSupported, filterFrequency, reverbDecay, reverbWetness, reverbEnabled, volume, envelopeEnabled]);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setAudioEnabled(false);
  }, [audioContext]);

  // Initialize audio support check
  useEffect(() => {
    checkAudioSupport();
  }, []);

  // Update filter frequency when changed
  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.value = filterFrequency;
    }
  }, [filterFrequency]);

  // Update reverb enable/disable when changed
  useEffect(() => {
    if (dryGainRef.current && wetGainRef.current) {
      dryGainRef.current.gain.value = reverbEnabled ? (1.0 - reverbWetness) : 1.0;
      wetGainRef.current.gain.value = reverbEnabled ? reverbWetness : 0.0;
    }
  }, [reverbEnabled, reverbWetness]);

  // Update volume when changed
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Update reverb decay when changed (requires recreating reverb node)
  useEffect(() => {
    if (audioContext && reverbNodeRef.current && audioEnabled) {
      const newReverbNode = audioContext.createConvolver();
      newReverbNode.buffer = createReverbImpulse(audioContext, 2, reverbDecay);

      // Reconnect the audio chain with new reverb node
      if (filterNodeRef.current && wetGainRef.current) {
        // Disconnect old reverb
        reverbNodeRef.current.disconnect();
        // Connect new reverb
        filterNodeRef.current.connect(newReverbNode);
        newReverbNode.connect(wetGainRef.current);
        reverbNodeRef.current = newReverbNode;
      }
    }
  }, [reverbDecay, audioContext, audioEnabled]);

  // Update envelope enabled/disabled state
  useEffect(() => {
    if (envelopeGainRef.current) {
      if (!envelopeEnabled) {
        // Disable envelope - set to full volume
        envelopeGainRef.current.gain.cancelScheduledValues(audioContext?.currentTime || 0);
        envelopeGainRef.current.gain.setValueAtTime(1, audioContext?.currentTime || 0);
      }
    }
  }, [envelopeEnabled, audioContext]);

  // Audio generation loop
  useEffect(() => {
    if (!audioEnabled || !audioContext || !gainNodeRef.current || !envelopeGainRef.current) return;

    const playBytebeatLoop = () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }

      const buffer = createBytebeatBuffer(0.5);
      if (!buffer) return;

      // Ensure envelope gain node belongs to current audio context
      if (!envelopeGainRef.current || envelopeGainRef.current.context !== audioContext) {
        return;
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(envelopeGainRef.current); // Connect to envelope instead of filter
      source.start();

      audioSourceRef.current = source;
    };

    playBytebeatLoop();
    const interval = setInterval(playBytebeatLoop, 500);

    return () => {
      clearInterval(interval);
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
    };
  }, [audioEnabled, audioContext, users, createBytebeatBuffer]);

  // Separate envelope triggering logic
  useEffect(() => {
    if (!audioEnabled || !audioContext || !envelopeGainRef.current || !envelopeEnabled) return;

    const triggerEnvelope = () => {
      const now = audioContext.currentTime;
      const gain = envelopeGainRef.current!.gain;

      // Cancel any existing automation
      gain.cancelScheduledValues(now);

      // Set to 0 and then create attack/release envelope
      gain.setValueAtTime(0, now);
      gain.linearRampToValueAtTime(1, now + attackTime);
      gain.linearRampToValueAtTime(0, now + attackTime + releaseTime);
    };

    // Trigger envelope immediately
    triggerEnvelope();

    // Set up repeating triggers based on trigger rate
    const triggerIntervalMs = 1000 / triggerRate;
    const envelopeInterval = setInterval(triggerEnvelope, triggerIntervalMs);

    return () => {
      clearInterval(envelopeInterval);
    };
  }, [audioEnabled, audioContext, envelopeEnabled, attackTime, releaseTime, triggerRate]);

  return {
    audioEnabled,
    audioSupported,
    startAudio,
    stopAudio,
    filterFrequency,
    setFilterFrequency,
    reverbEnabled,
    setReverbEnabled,
    volume,
    setVolume,
    reverbDecay,
    setReverbDecay,
    reverbWetness,
    setReverbWetness,
    envelopeEnabled,
    setEnvelopeEnabled,
    attackTime,
    setAttackTime,
    releaseTime,
    setReleaseTime,
    triggerRate,
    setTriggerRate,
  };
};
