import Voice from 'react-native-voice';
import * as Speech from 'expo-speech';
import { EventEmitter } from 'events';

class VoiceService extends EventEmitter {
  listening = false;

  constructor() {
    super();
    this.onSpeechStart = this.onSpeechStart.bind(this);
    this.onSpeechResults = this.onSpeechResults.bind(this);
    this.onSpeechEnd = this.onSpeechEnd.bind(this);
    this.onSpeechError = this.onSpeechError.bind(this);

    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
  }

  async start(lang = 'en-US') {
    if (this.listening) return;
    this.listening = true;
    await Voice.start(lang);
    this.emit('status', { listening: true });
  }

  async stop() {
    if (!this.listening) return;
    this.listening = false;
    await Voice.stop();
    this.emit('status', { listening: false });
  }

  onSpeechStart() { this.emit('status', { listening: true }); }
  onSpeechEnd()   { this.emit('status', { listening: false }); }

  onSpeechResults(e) {
    const text = (e.value?.[0] || '').trim();
    if (text) this.emit('text', text);
  }

  onSpeechError(e) {
    this.emit('error', e?.error);
    Speech.speak('Sorry, I did not catch that.', { rate: 1.0 });
    this.stop();
  }

  say(text) { Speech.speak(text, { rate: 1.0 }); }
}

export const voice = new VoiceService();
