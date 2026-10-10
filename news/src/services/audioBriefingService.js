/**
 * MICROSERVICE 7: Hands-Free Audio News Anchor & Article TTS Service
 * ------------------------------------------------------------------
 * Responsibility:
 *   - Converts any single article or a Top-5 India + Macro News Briefing
 *     into clear spoken audio using the browser's Web Speech Synthesis API.
 *   - Prioritizes natural English (India / UK / US) voices.
 *   - Supports variable playback rate (1x, 1.25x, 1.5x) and clean cancellation.
 * Isolation:
 *   - Zero external dependencies. Safe fallback when speechSynthesis is unavailable.
 */

import { intelligenceService } from "./intelligenceService.js";

class AudioBriefingService {
  constructor() {
    this.rate = 1.05;
    this.isPlaying = false;
    this.activeTitle = "";
    this.mode = "idle"; // "idle" | "single" | "briefing"
    this.listeners = new Set();
  }

  isSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch {
        // Ignore listener errors
      }
    });
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      activeTitle: this.activeTitle,
      mode: this.mode,
      rate: this.rate,
    };
  }

  setRate(newRate) {
    this.rate = Number(newRate) || 1.0;
    this.notify();
  }

  pickPreferredVoice() {
    if (!this.isSupported()) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    return (
      voices.find((v) => /en[-_]?IN/i.test(v.lang)) ||
      voices.find((v) => /en[-_]?GB/i.test(v.lang) && /natural|online|google/i.test(v.name)) ||
      voices.find((v) => /en/i.test(v.lang)) ||
      voices[0]
    );
  }

  stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this.activeTitle = "";
    this.mode = "idle";
    this.notify();
  }

  speakArticle(article) {
    if (!this.isSupported() || !article) return;

    if (this.isPlaying && this.activeTitle === article.title) {
      this.stop();
      return;
    }

    this.stop();

    const brief = intelligenceService.generateExecutiveBrief(article);
    const scopeIntro =
      article.scope === "INDIA" ? "India National Desk." : "Global Macro Watch.";
    const source = article.source?.name ? `Reported by ${article.source.name}.` : "";
    const textToSpeak = `${scopeIntro} ${source} ${brief.bullets.join(" ")}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voice = this.pickPreferredVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = this.rate;

    this.isPlaying = true;
    this.activeTitle = article.title;
    this.mode = "single";
    this.notify();

    utterance.onend = () => {
      this.isPlaying = false;
      this.activeTitle = "";
      this.mode = "idle";
      this.notify();
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      this.activeTitle = "";
      this.mode = "idle";
      this.notify();
    };

    window.speechSynthesis.speak(utterance);
  }

  playTopBriefing(articles = [], count = 5) {
    if (!this.isSupported()) return;

    if (this.isPlaying && this.mode === "briefing") {
      this.stop();
      return;
    }

    this.stop();

    const topStories = articles.slice(0, count);
    if (!topStories.length) return;

    this.isPlaying = true;
    this.mode = "briefing";
    this.activeTitle = `Top ${topStories.length} India & Macro Radio Briefing`;
    this.notify();

    const segments = [
      {
        title: "NewsMag Radio Intro",
        text: `Welcome to your NewsMag Live Audio Briefing. Here are the top ${topStories.length} India and Global Macro headlines right now.`,
      },
      ...topStories.map((art, idx) => {
        const tag = art.scope === "INDIA" ? "From the India Desk" : "On the Global Macro Wire";
        const source = art.source?.name ? `via ${art.source.name}` : "";
        const brief = intelligenceService.generateExecutiveBrief(art);
        return {
          title: art.title,
          text: `Story ${idx + 1}. ${tag} ${source}. ${art.title}. ${brief.impact.whyItMatters}`,
        };
      }),
      {
        title: "Briefing Complete",
        text: "That concludes your live NewsMag briefing.",
      },
    ];

    let index = 0;
    const speakNext = () => {
      if (!this.isPlaying || index >= segments.length) {
        this.isPlaying = false;
        this.activeTitle = "";
        this.mode = "idle";
        this.notify();
        return;
      }

      const seg = segments[index++];
      this.activeTitle = seg.title;
      this.notify();

      const utterance = new SpeechSynthesisUtterance(seg.text);
      const voice = this.pickPreferredVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = this.rate;

      utterance.onend = () => speakNext();
      utterance.onerror = () => speakNext();

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  }
}

export const audioBriefingService = new AudioBriefingService();
export default audioBriefingService;
