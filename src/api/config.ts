export const getApiBase = () => {
  // Check if running inside a native mobile environment (Capacitor)
  const isNative = !!(window as any).Capacitor;
  if (isNative) {
    // REPLACE this with your live production Vercel URL
    return 'https://fundkosh.vercel.app/api';
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';
};

export const getGroqApiUrl = () => {
  const isNative = !!(window as any).Capacitor;
  if (isNative) {
    // REPLACE this with your live production Vercel URL
    return 'https://fundkosh.vercel.app/api/groq/chat';
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/groq/chat'
    : '/api/groq/chat';
};
