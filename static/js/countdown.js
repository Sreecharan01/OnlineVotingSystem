/* ============================================
   ElectVote - Countdown Timer
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initCountdowns();
});

function initCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');

    timers.forEach(timer => {
        const endDateStr = timer.getAttribute('data-end');
        if (!endDateStr) return;

        const endDate = new Date(endDateStr);

        function updateTimer() {
            const now = new Date();
            const diff = endDate - now;

            if (diff <= 0) {
                timer.innerHTML = '<span class="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3">Election Ended</span>';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const daysEl = timer.querySelector('.days');
            const hoursEl = timer.querySelector('.hours');
            const minutesEl = timer.querySelector('.minutes');
            const secondsEl = timer.querySelector('.seconds');

            if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        }

        updateTimer();
        setInterval(updateTimer, 1000);
    });
}

/**
 * Format remaining time as a string
 */
function formatTimeRemaining(endDate) {
    const now = new Date();
    const diff = new Date(endDate) - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Less than an hour';
}
