const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

export interface BhashiniConfig {
  configured?: boolean;
}

export const bhashiniClient = {
  /**
   * Fetches pipeline status from the backend proxy
   */
  async getPipelineConfig(): Promise<BhashiniConfig> {
    const res = await fetch(`${API_BASE}/bhashini/pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch pipeline status');
    }
    return await res.json();
  },

  /**
   * Proxies ASR (Speech-to-Text) through the backend
   */
  async speechToText(
    audioBase64: string,
    sourceLang: string,
    config?: BhashiniConfig
  ): Promise<string> {
    const res = await fetch(`${API_BASE}/bhashini/asr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioContent: audioBase64,
        language: sourceLang
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'ASR failed');
    }

    const data = await res.json();
    return data.text;
  },

  /**
   * Proxies Translation (NMT) through the backend
   */
  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    config?: BhashiniConfig
  ): Promise<string> {
    const res = await fetch(`${API_BASE}/bhashini/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Translation failed');
    }

    const data = await res.json();
    return data.translatedText;
  },

  /**
   * Proxies TTS (Text-to-Speech) through the backend
   * Returns base64 string representing audio/wav content
   */
  async textToSpeech(
    text: string,
    lang: string,
    config?: BhashiniConfig
  ): Promise<string> {
    const res = await fetch(`${API_BASE}/bhashini/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: lang
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'TTS failed');
    }

    const data = await res.json();
    return data.audioContent;
  }
};
