export const SERVER_CONFIG = {
  LOCAL: 'http://192.168.0.3:3000',
  PUBLIC: 'https://wholemeal-noncoercively-seymour.ngrok-free.dev',
  
  getServerUrl: async () => {
    // If accessing from Vercel (not localhost), use PUBLIC
    if (window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('192.168')) {
      console.log('✓ Using PUBLIC server (Internet via ngrok)');
      return SERVER_CONFIG.PUBLIC;
    }
    
    // Try local first for WiFi users
    try {
      const response = await fetch(`${SERVER_CONFIG.LOCAL}/get-centers`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.ok) {
        console.log('✓ Using LOCAL server (WiFi)');
        return SERVER_CONFIG.LOCAL;
      }
    } catch (error) {
      console.log('⚠️ Local not reachable, using public...', error);
    }
    
    console.log('✓ Using PUBLIC server (ngrok)');
    return SERVER_CONFIG.PUBLIC;
  }
};