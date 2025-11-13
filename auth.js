// =====================
// SUPABASE CONFIGURATION
// =====================
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://yxnrmerxfxnffjvmyoqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bnJtZXJ4ZnhuZmZqdm15b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MDIsImV4cCI6MjA3ODU2NzUwMn0.OtUz7bDP0T6XzCcWPTig0Ivc-cS1F8HMIvPoLVXYsXo';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================
// UI FUNCTIONS
// =====================
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.auth-tab');
    
    // Clear messages
    hideMessages();
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        tabs[1].classList.add('active');
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    hideSuccess();
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.classList.add('show');
    hideError();
}

function hideError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.classList.remove('show');
}

function hideSuccess() {
    const successDiv = document.getElementById('success-message');
    successDiv.classList.remove('show');
}

function hideMessages() {
    hideError();
    hideSuccess();
}

function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Processing...';
    } else {
        button.disabled = false;
        button.innerHTML = buttonId === 'login-btn' ? 'Sign In' : 'Create Account';
    }
}

// =====================
// AUTHENTICATION FUNCTIONS
// =====================
async function handleLogin(event) {
    event.preventDefault();
    hideMessages();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    setButtonLoading('login-btn', true);
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        showSuccess('Login successful! Redirecting...');
        
        // Store user session
        localStorage.setItem('user_session', JSON.stringify(data.session));
        
        // Redirect to designer page after 1 second
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please check your credentials.');
        setButtonLoading('login-btn', false);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    hideMessages();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match!');
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
    }
    
    setButtonLoading('signup-btn', true);
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                }
            }
        });
        
        if (error) throw error;
        
        showSuccess('Account created successfully! Please check your email to verify your account.');
        
        // Clear form
        document.getElementById('signup-form').reset();
        
        // Switch to login tab after 3 seconds
        setTimeout(() => {
            switchTab('login');
            showSuccess('You can now sign in with your credentials.');
        }, 3000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'Signup failed. Please try again.');
    } finally {
        setButtonLoading('signup-btn', false);
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = prompt('Enter your email address:');
    
    if (!email) return;
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        });
        
        if (error) throw error;
        
        showSuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        showError('Failed to send reset email. Please try again.');
    }
}

// =====================
// CHECK EXISTING SESSION
// =====================
async function checkExistingSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
}

// Check for existing session on page load
checkExistingSession();

// =====================
// SESSION MANAGEMENT
// =====================
// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (event === 'SIGNED_IN') {
        localStorage.setItem('user_session', JSON.stringify(session));
    } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user_session');
    }
});