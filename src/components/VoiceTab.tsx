import React from 'react';
import { Globe, Mic, Volume2, MicOff, Trash2 } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';

interface VoiceTabProps {
  voiceLang: 'HI' | 'MR' | 'EN';
  setVoiceLang: (lang: 'HI' | 'MR' | 'EN') => void;
  voiceHistory: { id: string; user: string; assistant: string; timestamp: number }[];
  setVoiceHistory: React.Dispatch<React.SetStateAction<{ id: string; user: string; assistant: string; timestamp: number }[]>>;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  transcriptInput: string;
  setTranscriptInput: (s: string) => void;
  assistantResponse: string;
  setAssistantResponse: (s: string) => void;
  userQueryText: string;
  setUserQueryText: (s: string) => void;
  startListening: () => void;
  speakText: (text: string, langCode: 'HI' | 'MR' | 'EN') => void;
  handleUserQuery: (queryText: string) => Promise<void>;
  isBlueTheme: boolean;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({
  voiceLang,
  setVoiceLang,
  voiceHistory,
  setVoiceHistory,
  isListening,
  isSpeaking,
  isThinking,
  transcriptInput,
  setTranscriptInput,
  assistantResponse,
  setAssistantResponse,
  userQueryText,
  setUserQueryText,
  startListening,
  speakText,
  handleUserQuery,
  isBlueTheme
}) => {
  const { isDarkMode, getThemeColors } = useRiskTheme();

  const rawThemeColors = getThemeColors();
  const themeColors = isBlueTheme ? (
    isDarkMode ? {
      primary: '#38bdf8',
      cardBg: '#1e293b',
      borderColor: 'rgba(56, 189, 248, 0.2)',
      glowShadow: '0 8px 30px rgba(56, 189, 248, 0.08)',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      textColor: '#38bdf8',
      bodyText: '#f8fafc'
    } : {
      primary: '#0284c7',
      cardBg: '#ffffff',
      borderColor: 'rgba(2, 132, 199, 0.15)',
      glowShadow: '0 8px 30px rgba(2, 132, 199, 0.06)',
      badgeBg: 'rgba(2, 132, 199, 0.1)',
      textColor: '#0284c7',
      bodyText: '#0f172a'
    }
  ) : rawThemeColors;

  const styles: Record<string, React.CSSProperties> = {
    tabContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: { backgroundColor: themeColors.cardBg, borderRadius: 16, padding: 16, border: '1px solid ' + themeColors.borderColor, boxShadow: themeColors.glowShadow },
    input: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, borderRadius: 8, padding: '10px', color: themeColors.bodyText, fontSize: 14, outline: 'none' },
    previewBox: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 10, border: '1px dashed ' + themeColors.borderColor }
  };

  return (
    <div style={styles.tabContainer}>
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(0.95); opacity: 0.85; box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5); }
          70% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 0 24px rgba(56, 189, 248, 0); }
          100% { transform: scale(0.95); opacity: 0.85; box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
        @keyframes listenPulse {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.25); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0.2; }
        }
        @keyframes waveBounce {
          0%, 100% { height: 8px; }
          50% { height: 42px; }
        }
        .orb-active-listening {
          animation: pulseGlow 1.5s infinite ease-in-out;
          background: radial-gradient(circle, #0284c7 0%, #38bdf8 100%) !important;
        }
        .orb-active-speaking {
          animation: pulseGlow 1.2s infinite ease-in-out;
          background: radial-gradient(circle, #10b981 0%, #34d399 100%) !important;
        }
        .orb-thinking {
          animation: spin 1s infinite linear;
          border: 4px dashed #38bdf8 !important;
          background: transparent !important;
        }
        .pulse-ring-1 {
          animation: listenPulse 2s infinite ease-in-out;
        }
        .pulse-ring-2 {
          animation: listenPulse 2s infinite ease-in-out 1s;
        }
        .wave-bar {
          width: 4px;
          border-radius: 2px;
          background-color: #38bdf8;
          display: inline-block;
          margin: 0 3px;
          height: 12px;
        }
        .wave-active {
          animation: waveBounce 1.2s infinite ease-in-out;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Header / Compliance Banner */}
      <div style={{
        ...styles.card,
        borderLeft: '4px solid ' + themeColors.primary,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 4
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} color={themeColors.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: themeColors.textColor }}>
            FundKosh Sahayak • Voice Assistant
          </span>
        </div>
        <p style={{
          margin: 0,
          fontSize: 11,
          color: isDarkMode ? '#94a3b8' : '#64748b',
          lineHeight: '1.4'
        }}>
          <strong>SEBI Compliance Notice:</strong> FundKosh Sahayak acts strictly as a financial information tool. We do not provide personalized financial, investment, or lending advice.
        </p>
      </div>

      {/* Main Assistant Panel */}
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 20 }}>
        
        {/* Language Selection Toggle */}
        <div style={{ display: 'flex', backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderRadius: 24, padding: 3, width: '100%', maxWidth: 320 }}>
          {(['HI', 'MR', 'EN'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => {
                setVoiceLang(lang);
                setAssistantResponse('');
                setUserQueryText('');
              }}
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: voiceLang === lang ? themeColors.primary : 'transparent',
                color: voiceLang === lang ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#475569'),
                fontWeight: 700,
                fontSize: 12,
                padding: '8px 12px',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {lang === 'HI' ? 'Hindi' : lang === 'MR' ? 'Marwadi' : 'English'}
            </button>
          ))}
        </div>

        {/* Glowing Audio Orb and Soundwave animations */}
        <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Outer Listening Pulsing Rings */}
          {isListening && (
            <>
              <div className="pulse-ring-1" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)' }} />
              <div className="pulse-ring-2" style={{ position: 'absolute', width: '80%', height: '80%', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.25)' }} />
            </>
          )}

          {/* Outer Speaking Pulsing Rings */}
          {isSpeaking && (
            <>
              <div className="pulse-ring-1" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }} />
              <div className="pulse-ring-2" style={{ position: 'absolute', width: '80%', height: '80%', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.25)' }} />
            </>
          )}

          {/* Central Interactive Orb Button */}
          <button
            onClick={startListening}
            className={`
              ${isListening ? 'orb-active-listening' : ''} 
              ${isSpeaking ? 'orb-active-speaking' : ''} 
              ${isThinking ? 'orb-thinking' : ''}
            `}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: isDarkMode ? '#1e293b' : '#f0f9ff',
              border: `4px solid ${themeColors.primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.3)',
              zIndex: 10,
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            {isListening ? (
              <Mic size={42} color="#ffffff" />
            ) : isSpeaking ? (
              <Volume2 size={42} color="#ffffff" />
            ) : isThinking ? (
              <span style={{ fontSize: 10, fontWeight: 800, color: themeColors.primary }}>AI...</span>
            ) : (
              <Mic size={42} color={themeColors.primary} />
            )}
          </button>
        </div>

        {/* Status Indicator text */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: themeColors.primary }}>
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isThinking ? 'Processing...' : 'Tap Orb to Speak'}
          </span>
          <p style={{ margin: '4px 0 0 0', fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
            ⚡ Powered by Bhashini AI (Secure Backend Gateway)
          </p>
        </div>

        {/* Bouncing Audio Bars Wave (shown when speaking or listening) */}
        {(isListening || isSpeaking) && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 42 }}>
            <div className={`wave-bar ${isListening || isSpeaking ? 'wave-active' : ''}`} style={{ animationDelay: '0.1s' }} />
            <div className={`wave-bar ${isListening || isSpeaking ? 'wave-active' : ''}`} style={{ animationDelay: '0.3s', backgroundColor: isSpeaking ? '#10b981' : '#38bdf8' }} />
            <div className={`wave-bar ${isListening || isSpeaking ? 'wave-active' : ''}`} style={{ animationDelay: '0.5s', backgroundColor: isSpeaking ? '#059669' : '#0284c7' }} />
            <div className={`wave-bar ${isListening || isSpeaking ? 'wave-active' : ''}`} style={{ animationDelay: '0.2s', backgroundColor: isSpeaking ? '#34d399' : '#60a5fa' }} />
            <div className={`wave-bar ${isListening || isSpeaking ? 'wave-active' : ''}`} style={{ animationDelay: '0.4s' }} />
          </div>
        )}

        {/* Live Transcripts Panels */}
        {(userQueryText || assistantResponse || isThinking) && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            
            {userQueryText && (
              <div style={{ ...styles.previewBox, padding: 10, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>You Asked</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: themeColors.bodyText }}>
                  "{userQueryText}"
                </p>
              </div>
            )}

            {isThinking ? (
              <div style={{ ...styles.previewBox, padding: 10, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderStyle: 'dashed' }}>
                <span style={{ fontSize: 11, color: themeColors.textColor }} className="animate-pulse">Thinking...</span>
              </div>
            ) : assistantResponse && (
              <div style={{
                ...styles.previewBox,
                padding: 12,
                backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.05)' : '#f0f9ff',
                borderColor: themeColors.borderColor,
                borderLeft: '4px solid ' + (assistantResponse.includes('SEBI') || assistantResponse.includes('सेबी') ? '#f59e0b' : themeColors.primary)
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: themeColors.primary, textTransform: 'uppercase' }}>Assistant</span>
                  <button
                    onClick={() => speakText(assistantResponse, voiceLang)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: themeColors.primary,
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Repeat speech"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: themeColors.bodyText, lineHeight: '1.4', fontWeight: 500 }}>
                  {assistantResponse}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Text Input Fallback */}
        <div style={{ width: '100%', borderTop: `1px solid ${themeColors.borderColor}`, paddingTop: 16 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserQuery(transcriptInput);
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              type="text"
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              placeholder="Type query (e.g. check balance)"
              style={{
                ...styles.input,
                flex: 1,
                borderRadius: 12,
                padding: '10px 14px'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: themeColors.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '0 16px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Predefined Suggestion Chips */}
      <div style={{ ...styles.card, borderColor: themeColors.borderColor }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: 10 }}>
          💡 Quick Questions
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(voiceLang === 'EN' ? [
            { text: 'What is my account balance?', q: 'What is my account balance' },
            { text: 'Check my vault savings', q: 'Check my vault savings' },
            { text: 'What is my daily budget?', q: 'What is my daily budget' },
            { text: 'Show upcoming EMIs', q: 'Show upcoming EMIs' },
            { text: 'Give investment advice', q: 'Give investment advice' },
            { text: 'How much do I earn?', q: 'How much do I earn' }
          ] : voiceLang === 'MR' ? [
            { text: 'खाते में कितरा पिया है?', q: 'खाते में कितरा पिया है' },
            { text: 'गुल्लक री बचत कतरी है?', q: 'गुल्लक री बचत कतरी है' },
            { text: 'म्हारो आज रो बजट कितरो है?', q: 'म्हारो आज रो बजट कितरो है' },
            { text: 'लोन री EMI दिखाओ', q: 'लोन री EMI दिखाओ' },
            { text: 'कमाई कटे निवेश करां?', q: 'कमाई कटे निवेश करां' },
            { text: 'बैलेंस कतरो है?', q: 'बैलेंस कतरो है' }
          ] : [
            { text: 'खाता बैलेंस कितना है?', q: 'खाता बैलेंस कितना है' },
            { text: 'गुल्लक में कितनी बचत है?', q: 'गुल्लक में कितनी बचत है' },
            { text: 'मेरा आज का बजट क्या है?', q: 'मेरा आज का बजट क्या है' },
            { text: 'आने वाली EMI दिखाओ', q: 'आने वाली EMI दिखाओ' },
            { text: 'पैसे कहां निवेश करें?', q: 'पैसे कहां निवेश करें' },
            { text: 'दैनिक खर्च सीमा क्या है?', q: 'दैनिक खर्च सीमा क्या है' }
          ]).map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleUserQuery(chip.q)}
              style={{
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: `1px solid ${themeColors.borderColor}`,
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: isDarkMode ? '#cbd5e1' : '#475569',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              💬 {chip.text}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation History Log */}
      {voiceHistory.length > 0 && (
        <div style={{ ...styles.card, borderColor: themeColors.borderColor }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              📜 Conversation Logs
            </span>
            <button
              onClick={() => setVoiceHistory([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Trash2 size={12} /> Clear Logs
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 250, overflowY: 'auto', paddingRight: 4 }}>
            {voiceHistory.map(log => (
              <div
                key={log.id}
                style={{
                  padding: 10,
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                  border: `1px solid ${themeColors.borderColor}`,
                  borderRadius: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: themeColors.bodyText }}>
                    🗣️ User: "{log.user}"
                  </span>
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>
                    {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 4 }}>
                  <button
                    onClick={() => speakText(log.assistant, voiceLang)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: themeColors.primary,
                      cursor: 'pointer',
                      padding: '2px 0 0 0'
                    }}
                  >
                    <Volume2 size={12} />
                  </button>
                  <p style={{ margin: 0, fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#475569', lineHeight: '1.4' }}>
                    🤖 {log.assistant}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};
