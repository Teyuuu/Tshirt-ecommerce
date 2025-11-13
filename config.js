// =============================================
// CANVAS & COTTON - SUPABASE CONFIGURATION
// =============================================
// 
// INSTRUCTIONS:
// 1. Create a Supabase project at https://supabase.com
// 2. Go to Settings → API in your Supabase dashboard
// 3. Copy your Project URL and anon/public key
// 4. Replace the values below with your actual credentials
// 5. Save this file as 'config.js' in your project root
// 6. Include it BEFORE other scripts in your HTML files
//
// =============================================

const SUPABASE_CONFIG = {
    // Your Supabase Project URL
    // Example: 'https://abcdefghijklmnop.supabase.co'
    url: 'https://yxnrmerxfxnffjvmyoqn.supabase.co',
    
    // Your Supabase anon/public key
    // Example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bnJtZXJ4ZnhuZmZqdm15b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MDIsImV4cCI6MjA3ODU2NzUwMn0.OtUz7bDP0T6XzCcWPTig0Ivc-cS1F8HMIvPoLVXYsXo',
    
    // Optional: Configure auto-save interval (in milliseconds)
    // Default: 10000 (10 seconds)
    autoSaveInterval: 10000,
    
    // Optional: Enable debug logging
    debug: false
};

// Initialize Supabase client (don't modify this)
let supabaseClient = null;

function initializeSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase SDK not loaded. Make sure to include the CDN script.');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        
        if (SUPABASE_CONFIG.debug) {
            console.log('Supabase client initialized');
        }
    }
    
    return supabaseClient;
}

// Export for use in other files
const getSupabaseClient = () => supabaseClient || initializeSupabase();

// =============================================
// VALIDATION
// =============================================
function validateConfig() {
    const errors = [];
    
    if (SUPABASE_CONFIG.url === 'https://yxnrmerxfxnffjvmyoqn.supabase.co') {
        errors.push('Please update SUPABASE_CONFIG.url with your actual Supabase project URL');
    }
    
    if (SUPABASE_CONFIG.anonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bnJtZXJ4ZnhuZmZqdm15b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MDIsImV4cCI6MjA3ODU2NzUwMn0.OtUz7bDP0T6XzCcWPTig0Ivc-cS1F8HMIvPoLVXYsXo') {
        errors.push('Please update SUPABASE_CONFIG.anonKey with your actual Supabase anon key');
    }
    
    if (!SUPABASE_CONFIG.url.includes('supabase.co')) {
        errors.push('Invalid Supabase URL format');
    }
    
    if (errors.length > 0) {
        console.error('❌ Supabase Configuration Errors:');
        errors.forEach(error => console.error('   - ' + error));
        console.error('\n📖 Please check the setup guide at: https://supabase.com/docs');
        return false;
    }
    
    if (SUPABASE_CONFIG.debug) {
        console.log('✅ Supabase configuration validated successfully');
    }
    
    return true;
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (validateConfig()) {
            initializeSupabase();
        }
    });
}