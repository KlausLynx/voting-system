export const SERVER_CONFIG = {
  LOCAL: 'http://192.168.0.3:3000',
  PUBLIC: 'https://wholemeal-noncoercively-seymour.ngrok-free.dev',
  
  getServerUrl: () => {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname.startsWith('192.168')) {
      console.log('✓ Using LOCAL server (WiFi)');
      return SERVER_CONFIG.LOCAL;
    }
    
    console.log('✓ Using PUBLIC server (Internet)');
    return SERVER_CONFIG.PUBLIC;
  }
};

// https://wholemeal-noncoercively-seymour.ngrok-free.app/get-centers