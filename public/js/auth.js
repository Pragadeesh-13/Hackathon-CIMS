// Auth Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active form
            authForms.forEach(form => form.classList.remove('active'));
            document.getElementById(tabName + 'Form').classList.add('active');
        });
    });

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            showLoading(this.querySelector('.auth-btn'));
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();
            
            if (response.ok) {
                showToast('Login successful! Redirecting...', 'success');
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                showToast(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            hideLoading(this.querySelector('.auth-btn'));
        }
    });

    // Signup form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // Password confirmation check
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        const signupData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            role: formData.get('role'),
            password: password
        };

        try {
            showLoading(this.querySelector('.auth-btn'));
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });

            const result = await response.json();
            
            if (response.ok) {
                showToast('Account created successfully! You can now login.', 'success');
                // Switch to login tab
                tabButtons[0].click();
                // Pre-fill email
                document.getElementById('loginEmail').value = signupData.email;
                // Clear form
                this.reset();
            } else {
                showToast(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            hideLoading(this.querySelector('.auth-btn'));
        }
    });

    // Demo credential buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.demo-account')) {
            const demoText = e.target.closest('.demo-account').textContent;
            if (demoText.includes('pharmacist@clinic.com')) {
                document.getElementById('loginEmail').value = 'pharmacist@clinic.com';
                document.getElementById('loginPassword').value = 'password123';
            } else if (demoText.includes('admin@clinic.com')) {
                document.getElementById('loginEmail').value = 'admin@clinic.com';
                document.getElementById('loginPassword').value = 'admin123';
            }
        }
    });

    // Check if already logged in
    if (localStorage.getItem('authToken')) {
        window.location.href = '/';
    }
});

// Utility functions
function showLoading(button) {
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
    button.setAttribute('data-original-text', originalText);
}

function hideLoading(button) {
    button.disabled = false;
    button.innerHTML = button.getAttribute('data-original-text');
}

function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Form validation
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Real-time validation
document.addEventListener('input', function(e) {
    if (e.target.type === 'email') {
        const isValid = validateEmail(e.target.value);
        e.target.classList.toggle('success', isValid && e.target.value);
        e.target.classList.toggle('error', !isValid && e.target.value);
    }
    
    if (e.target.type === 'password') {
        const isValid = validatePassword(e.target.value);
        e.target.classList.toggle('success', isValid);
        e.target.classList.toggle('error', !isValid && e.target.value);
    }
});
