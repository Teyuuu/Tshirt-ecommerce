// =====================
// SUPABASE CONFIGURATION
// =====================
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
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    setButtonLoading('login-btn', true);
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        // Store user session
        localStorage.setItem('user_session', JSON.stringify(data.session));
        
        // Show success and redirect
        await Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: 'Redirecting to dashboard...',
            timer: 1500,
            showConfirmButton: false
        });
        
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        setButtonLoading('login-btn', false);
        
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: error.message || 'Please check your credentials and try again.',
            confirmButtonText: 'OK'
        });
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Passwords Do Not Match',
            text: 'Please make sure both passwords are identical.',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        Swal.fire({
            icon: 'error',
            title: 'Weak Password',
            text: 'Password must be at least 6 characters long.',
            confirmButtonText: 'OK'
        });
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
        
        // Clear form
        document.getElementById('signup-form').reset();
        
        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            html: `
                <p>Your account has been created successfully!</p>
                <p style="margin-top: 10px; color: #666;">Please check your email to verify your account.</p>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#045490'
        });
        
        // Switch to login tab
        switchTab('login');
        
        Swal.fire({
            icon: 'info',
            title: 'Ready to Sign In',
            text: 'You can now sign in with your credentials.',
            timer: 3000,
            showConfirmButton: false
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Signup Failed',
            text: error.message || 'Failed to create account. Please try again.',
            confirmButtonText: 'OK'
        });
    } finally {
        setButtonLoading('signup-btn', false);
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const { value: email } = await Swal.fire({
        title: 'Reset Password',
        input: 'email',
        inputLabel: 'Enter your email address',
        inputPlaceholder: 'your.email@example.com',
        showCancelButton: true,
        confirmButtonText: 'Send Reset Link',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#045490',
        inputValidator: (value) => {
            if (!value) {
                return 'Please enter your email address!';
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Please enter a valid email address!';
            }
        }
    });
    
    if (!email) return;
    
    try {
        // Show loading
        Swal.fire({
            title: 'Sending...',
            text: 'Please wait while we send the reset link.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        });
        
        if (error) throw error;
        
        Swal.fire({
            icon: 'success',
            title: 'Email Sent!',
            html: `
                <p>Password reset email has been sent to:</p>
                <p style="font-weight: 600; margin-top: 10px;">${email}</p>
                <p style="margin-top: 10px; color: #666;">Please check your inbox and follow the instructions.</p>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#045490'
        });
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Reset Failed',
            text: 'Failed to send reset email. Please try again.',
            confirmButtonText: 'OK'
        });
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