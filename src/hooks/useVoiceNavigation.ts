import { useRef, useCallback, useState } from "react";
import type { RouteStep } from "@/components/OpenStreetMap";

export function useVoiceNavigation() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const spokenSteps = useRef<Set<number>>(new Set());
  const synthRef = useRef(window.speechSynthesis);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";
    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const announceStep = useCallback((steps: RouteStep[], index: number) => {
    if (index < 0 || index >= steps.length) return;
    if (spokenSteps.current.has(index)) return;
    spokenSteps.current.add(index);
    setCurrentStepIndex(index);

    const step = steps[index];
    const distText = step.distance >= 1000
      ? `${(step.distance / 1000).toFixed(1)} kilometers`
      : `${Math.round(step.distance)} meters`;
    speak(`${step.instruction}. ${distText}.`);
  }, [speak]);

  const announceETA = useCallback((duration: string, distance: string) => {
    speak(`Estimated arrival in ${duration}. Distance: ${distance}.`);
  }, [speak]);

  const announceArrival = useCallback(() => {
    speak("You have arrived at your destination.");
  }, [speak]);

  const reset = useCallback(() => {
    spokenSteps.current.clear();
    setCurrentStepIndex(0);
    synthRef.current?.cancel();
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev) synthRef.current?.cancel();
      return !prev;
    });
  }, []);

  return {
    voiceEnabled,
    toggleVoice,
    currentStepIndex,
    announceStep,
    announceETA,
    announceArrival,
    reset,
    speak,
  };
}
