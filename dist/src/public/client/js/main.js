"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new window.bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    if (typeof window.bootstrap !== 'undefined') {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new window.bootstrap.Popover(popoverTriggerEl);
        });
    }
});
window.utils = {
    formatCurrency: function (amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    showNotification: function (message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 250px;';
        notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 150);
        }, 3000);
    },
    confirm: function (message, callback) {
        if (confirm(message)) {
            callback();
        }
    },
    debounce: function (func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    getUserId: function () {
        return parseInt(document.body.dataset.userId || '0') || 0;
    },
    timeSince: function (date) {
        const now = new Date();
        const past = new Date(date);
        const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1)
            return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1)
            return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1)
            return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1)
            return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1)
            return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }
};
window.onerror = function (message, source, lineno, colno, error) {
    console.error('Global error:', message, 'at', source, lineno, colno);
    return false;
};
//# sourceMappingURL=main.js.map