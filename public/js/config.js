// Environment configuration
const ENV = {
  // Detect if running locally
  isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  
  // Get the base URL dynamically
  getBaseUrl: function() {
    if (this.isLocal) {
      // Backend runs on port 3001 in development
      return `${window.location.protocol}//${window.location.hostname}:3001`;
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

// ==============================
// 🔹 Supabase Initialization
// ==============================
const SUPABASE_URL = "https://ktapuasvoisugsrppczx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YXB1YXN2b2lzdWdzcnBwY3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NjYzODMsImV4cCI6MjA3NTE0MjM4M30.hypmyvPXXgzYsG7MtbsvCehjHE23fbxS-sSGa-5DJFY";

// Đảm bảo thư viện Supabase đã được load trước (từ CDN)
if (window.supabase) {
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.supabase = supabaseClient;
  console.log("✅ Supabase initialized:", supabaseClient);
} else {
  console.error("❌ Supabase SDK not loaded. Check your <script src> for @supabase/supabase-js.");
}
