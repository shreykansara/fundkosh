const API_BASE = 'http://localhost:5000/api';

export interface BhashiniConfig {
  pipelineInferenceAPIEndPoint?: {
    callbackUrl: string;
    inferenceApiKey?: {
      name: string;
      value: string;
    };
  };
  pipelineResponseConfig?: Array<{
    taskType: 'asr' | 'translation' | 'tts';
    config: Array<{
      serviceId: string;
      modelId: string;
      language: {
        sourceLanguage: string;
        targetLanguage?: string;
      };
    }>;
  }>;
}

export const bhashiniClient = {
  /**
   * Fetches pipeline configs from the backend proxy
   */
  async getPipelineConfig(): Promise<BhashiniConfig> {
    const res = await fetch(`${API_BASE}/bhashini/pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch pipeline config');
    }
    return await res.json();
  },

  /**
   * Proxies ASR (Speech-to-Text) through the backend
   */
  async speechToText(
    audioBase64: string,
    sourceLang: string,
    config: BhashiniConfig
  ): Promise<string> {
    const callbackUrl = config.pipelineInferenceAPIEndPoint?.callbackUrl;
    const authHeader = config.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;
    
    // Find service ID for ASR and specified language
    const asrTask = config.pipelineResponseConfig?.find(t => t.taskType === 'asr');
    const serviceConfig = asrTask?.config.find(c => c.language.sourceLanguage === sourceLang) 
      || asrTask?.config[0];
    
    if (!callbackUrl || !serviceConfig) {
      throw new Error('Invalid Bhashini pipeline config for ASR');
    }

    const res = await fetch(`${API_BASE}/bhashini/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        computeUrl: callbackUrl,
        authorization: authHeader,
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: { sourceLanguage: sourceLang },
              serviceId: serviceConfig.serviceId
            }
          }
        ],
        inputData: {
          audio: [{ audioContent: audioBase64 }]
        }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'ASR compute failed');
    }

    const data = await res.json();
    const text = data?.pipelineResponse?.[0]?.output?.[0]?.source;
    if (!text) {
      throw new Error('No transcript returned from Bhashini');
    }
    return text;
  },

  /**
   * Proxies Translation (NMT) through the backend
   */
  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    config: BhashiniConfig
  ): Promise<string> {
    const callbackUrl = config.pipelineInferenceAPIEndPoint?.callbackUrl;
    const authHeader = config.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;
    
    const transTask = config.pipelineResponseConfig?.find(t => t.taskType === 'translation');
    const serviceConfig = transTask?.config.find(c => 
      c.language.sourceLanguage === sourceLang && c.language.targetLanguage === targetLang
    ) || transTask?.config[0];

    if (!callbackUrl || !serviceConfig) {
      throw new Error('Invalid Bhashini pipeline config for Translation');
    }

    const res = await fetch(`${API_BASE}/bhashini/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        computeUrl: callbackUrl,
        authorization: authHeader,
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: { 
                sourceLanguage: sourceLang,
                targetLanguage: targetLang
              },
              serviceId: serviceConfig.serviceId
            }
          }
        ],
        inputData: {
          input: [{ source: text }]
        }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Translation compute failed');
    }

    const data = await res.json();
    const translated = data?.pipelineResponse?.[0]?.output?.[0]?.target;
    if (!translated) {
      throw new Error('No translation returned from Bhashini');
    }
    return translated;
  },

  /**
   * Proxies TTS (Text-to-Speech) through the backend
   * Returns base64 string representing audio/wav content
   */
  async textToSpeech(
    text: string,
    lang: string,
    config: BhashiniConfig
  ): Promise<string> {
    const callbackUrl = config.pipelineInferenceAPIEndPoint?.callbackUrl;
    const authHeader = config.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;
    
    const ttsTask = config.pipelineResponseConfig?.find(t => t.taskType === 'tts');
    const serviceConfig = ttsTask?.config.find(c => c.language.sourceLanguage === lang) 
      || ttsTask?.config[0];

    if (!callbackUrl || !serviceConfig) {
      throw new Error('Invalid Bhashini pipeline config for TTS');
    }

    const res = await fetch(`${API_BASE}/bhashini/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        computeUrl: callbackUrl,
        authorization: authHeader,
        pipelineTasks: [
          {
            taskType: 'tts',
            config: {
              language: { sourceLanguage: lang },
              serviceId: serviceConfig.serviceId,
              gender: 'female'
            }
          }
        ],
        inputData: {
          input: [{ source: text }]
        }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'TTS compute failed');
    }

    const data = await res.json();
    const audioContent = data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
    if (!audioContent) {
      throw new Error('No audio content returned from Bhashini');
    }
    return audioContent;
  }
};
