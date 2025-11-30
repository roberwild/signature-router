'use client';

import { useCallback, useRef } from 'react';

// Extend Window interface to include webkit audio context
interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function useNotificationSound() {
  const _audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotification = useCallback(() => {
    try {
      // Create a simple notification sound using Web Audio API
      const windowWithWebkit = window as WindowWithWebkitAudioContext;
      const AudioContextConstructor = window.AudioContext || windowWithWebkit.webkitAudioContext;

      if (!AudioContextConstructor) {
        console.warn('Web Audio API not supported in this browser');
        return;
      }

      const audioContext = new AudioContextConstructor();
      
      // Create oscillator for the beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure the sound
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      // Envelope for the sound (fade in and out)
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      
      // Play the sound
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      
      // Clean up
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 300);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  return { playNotification };
}