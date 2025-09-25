// Environment configuration
const ENV = {
  // Detect if running locally
  isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  
  // Get the base URL dynamically
  getBaseUrl: function() {
    if (this.isLocal) {
      return `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3000}`;
    }
    // In production, use the current origin
    return window.location.origin;
  },
  
  // Get API base URL
  getApiUrl: function() {
    return `${this.getBaseUrl()}/api`;
  },
  
  // Site configuration
  SITE_NAME: 'ATHENA',
  DEFAULT_PRODUCTION_URL: 'https://ueh-athena.vercel.app'
};

// Make it globally available
window.ENV = ENV;

// Log environment for debugging (remove in production if needed)
console.log('Environment:', {
  isLocal: ENV.isLocal,
  baseUrl: ENV.getBaseUrl(),
  apiUrl: ENV.getApiUrl()
});