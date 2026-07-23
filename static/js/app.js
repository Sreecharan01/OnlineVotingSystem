/* ============================================
   ElectVote - Main Application JavaScript
   ============================================ */

// ─── Page Loader ───────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 500);
    }
});

// ─── Dark Mode Toggle ──────────────────────────
function toggleDarkMode() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('electvote-theme', newTheme);

    // Update icon
    const toggleBtns = document.querySelectorAll('#darkModeToggle i, [onclick="toggleDarkMode()"] i');
    toggleBtns.forEach(icon => {
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// Apply saved theme on load
(function() {
    const savedTheme = localStorage.getItem('electvote-theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
})();

// ─── Toast Notifications ───────────────────────
function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        'success': 'fa-check-circle',
        'danger': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };

    const bgColors = {
        'success': '#10B981',
        'danger': '#EF4444',
        'warning': '#F59E0B',
        'info': '#4F46E5'
    };

    const toastId = 'toast-' + Date.now();
    const icon = icons[type] || icons['info'];
    const bgColor = bgColors[type] || bgColors['info'];

    const toastHTML = `
        <div id="${toastId}" class="toast custom-toast show" role="alert" style="border-left: 4px solid ${bgColor};">
            <div class="toast-body d-flex align-items-center">
                <i class="fas ${icon} me-2" style="color: ${bgColor}; font-size: 1.1rem;"></i>
                <span class="flex-fill">${message}</span>
                <button type="button" class="btn-close btn-close-sm ms-2" onclick="this.closest('.toast').remove()"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.transition = 'opacity 0.3s, transform 0.3s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// ─── Password Toggle ───────────────────────────
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('button i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ─── Smooth Scroll ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            const offset = 80;
            const targetPos = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: targetPos, behavior: 'smooth' });

            // Close mobile nav
            const navCollapse = document.querySelector('.navbar-collapse.show');
            if (navCollapse) {
                const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                if (bsCollapse) bsCollapse.hide();
            }
        }
    });
});

// ─── Confirm Delete ────────────────────────────
function confirmDelete(message) {
    return confirm(message || 'Are you sure you want to delete this item?');
}

// ─── Form Validation Feedback ──────────────────
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

            // Re-enable after 5 seconds (failsafe)
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 5000);
        }
    });
});

// ─── Number Format ─────────────────────────────
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ─── Active Nav Link ───────────────────────────
(function() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
})();
