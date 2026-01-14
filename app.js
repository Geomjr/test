// ========================================
// Solstice Finance - Application Logic
// ========================================

// State Management
const state = {
    currentPage: 'dashboard',
    walletConnected: false,
    walletAddress: null,
    lockTab: 'lock',
    balances: {
        USX: 0,
        eUSX: 0,
        USDC: 0,
        SOL: 0
    },
    flares: 0,
    multiplier: 1
};

// DOM Elements
const elements = {
    sidebar: document.querySelector('.sidebar'),
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    connectWalletBtn: document.getElementById('connectWalletBtn'),
    walletModal: document.getElementById('walletModal'),
    lockTabs: document.querySelectorAll('.lock-tab'),
    lockForm: document.getElementById('lock-form'),
    unlockForm: document.getElementById('unlock-form'),
    swapTabs: document.querySelectorAll('.swap-tab')
};

// Initialize Application
function init() {
    setupNavigation();
    setupWalletConnection();
    setupLockTabs();
    setupSwapTabs();
    setupMobileMenu();
    setupActionButtons();
    startPriceAnimation();
}

// Navigation
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });

    // Handle navigation from buttons with data-page attribute
    document.querySelectorAll('[data-page]').forEach(btn => {
        if (!btn.classList.contains('nav-item')) {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                navigateTo(page);
            });
        }
    });
}

function navigateTo(page) {
    // Update state
    state.currentPage = page;

    // Update nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Update pages
    elements.pages.forEach(p => {
        const pageId = p.id.replace('-page', '');
        p.classList.toggle('hidden', pageId !== page);
    });

    // Close mobile menu
    elements.sidebar.classList.remove('open');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Wallet Connection
function setupWalletConnection() {
    elements.connectWalletBtn.addEventListener('click', openWalletModal);

    // Wallet options
    document.querySelectorAll('.wallet-option').forEach(option => {
        option.addEventListener('click', () => {
            simulateWalletConnection(option.querySelector('span').textContent);
        });
    });
}

function openWalletModal() {
    elements.walletModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeWalletModal() {
    elements.walletModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.getElementById('walletModal')?.addEventListener('click', (e) => {
    if (e.target === elements.walletModal) {
        closeWalletModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.walletModal.classList.contains('hidden')) {
        closeWalletModal();
    }
});

function simulateWalletConnection(walletName) {
    // Simulate connection loading
    const btn = elements.connectWalletBtn;
    btn.innerHTML = `
        <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10" stroke-dasharray="50" stroke-dashoffset="20"/>
        </svg>
        <span>Connecting...</span>
    `;

    setTimeout(() => {
        state.walletConnected = true;
        state.walletAddress = generateRandomAddress();
        state.flares = 1000; // Initial flares for connecting

        updateWalletUI();
        closeWalletModal();
        showNotification(`Connected to ${walletName}`, 'success');
    }, 1500);
}

function generateRandomAddress() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function updateWalletUI() {
    const btn = elements.connectWalletBtn;
    if (state.walletConnected) {
        const shortAddress = state.walletAddress.slice(0, 4) + '...' + state.walletAddress.slice(-4);
        btn.innerHTML = `
            <div class="wallet-connected-icon"></div>
            <span>${shortAddress}</span>
        `;
        btn.style.background = 'var(--bg-tertiary)';
        btn.style.color = 'var(--text-primary)';
        btn.style.border = '1px solid var(--border-secondary)';
        btn.style.boxShadow = 'none';

        // Update all disabled buttons
        document.querySelectorAll('.swap-btn, .lock-btn').forEach(b => {
            b.disabled = false;
            b.textContent = b.closest('.swap-card') ? 'Swap' : 'Confirm';
        });

        // Update Flares display
        updateFlaresDisplay();

        // Update referral code
        updateReferralCode();
    }
}

function updateFlaresDisplay() {
    // Update flares in stats card
    const flaresValue = document.querySelector('.stat-icon.flares-icon')?.closest('.stat-card')?.querySelector('.stat-main-value');
    if (flaresValue) {
        flaresValue.textContent = state.flares.toLocaleString();
    }

    // Update flares in earn flares page
    const flaresStatValue = document.querySelector('.flares-stats-card .flares-stat-value');
    if (flaresStatValue) {
        flaresStatValue.textContent = state.flares.toLocaleString();
    }

    // Update footer message
    const flaresFooter = document.querySelector('.stat-icon.flares-icon')?.closest('.stat-card')?.querySelector('.stat-card-footer span');
    if (flaresFooter && state.walletConnected) {
        flaresFooter.textContent = 'Earning active';
    }
}

function updateReferralCode() {
    const codeDisplay = document.querySelector('.referral-code-display');
    const copyBtn = codeDisplay?.querySelector('.copy-btn');
    const placeholder = codeDisplay?.querySelector('.code-placeholder');

    if (state.walletConnected && placeholder) {
        const referralCode = generateReferralCode();
        placeholder.textContent = referralCode;
        placeholder.classList.remove('code-placeholder');
        placeholder.style.fontWeight = '600';
        placeholder.style.color = 'var(--text-primary)';
        copyBtn.disabled = false;

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(referralCode);
            showNotification('Referral code copied!', 'success');
        });
    }
}

function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Lock/Unlock Tabs
function setupLockTabs() {
    elements.lockTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            state.lockTab = tabType;

            // Update tab styles
            elements.lockTabs.forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tabType);
            });

            // Show/hide forms
            if (tabType === 'lock') {
                elements.lockForm?.classList.remove('hidden');
                elements.unlockForm?.classList.add('hidden');
            } else {
                elements.lockForm?.classList.add('hidden');
                elements.unlockForm?.classList.remove('hidden');
            }
        });
    });
}

// Swap Tabs
function setupSwapTabs() {
    elements.swapTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.swapTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
}

// Mobile Menu
function setupMobileMenu() {
    elements.mobileMenuBtn?.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.sidebar.contains(e.target) &&
            !elements.mobileMenuBtn.contains(e.target) &&
            elements.sidebar.classList.contains('open')) {
            elements.sidebar.classList.remove('open');
        }
    });
}

// Action Buttons
function setupActionButtons() {
    // Swap direction button
    const swapDirectionBtn = document.querySelector('.swap-direction-btn');
    swapDirectionBtn?.addEventListener('click', () => {
        const tokenSelects = document.querySelectorAll('.token-select');
        if (tokenSelects.length >= 2) {
            // Animate rotation
            swapDirectionBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                swapDirectionBtn.style.transform = '';
            }, 300);

            // Swap tokens (visual only)
            const temp = tokenSelects[0].innerHTML;
            tokenSelects[0].innerHTML = tokenSelects[1].innerHTML;
            tokenSelects[1].innerHTML = temp;
        }
    });

    // Amount inputs
    document.querySelectorAll('.amount-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value) || 0;
            updateReceiveAmount(e.target, value);
        });
    });

    // Max buttons
    document.querySelectorAll('.max-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.walletConnected) {
                const input = btn.closest('.swap-input, .lock-input')?.querySelector('.amount-input');
                if (input) {
                    // Simulate max balance
                    const maxBalance = Math.random() * 1000;
                    input.value = maxBalance.toFixed(2);
                    input.dispatchEvent(new Event('input'));
                }
            } else {
                showNotification('Please connect wallet first', 'warning');
            }
        });
    });

    // Partner code input
    const codeInput = document.querySelector('.code-input');
    const applyCodeBtn = codeInput?.nextElementSibling;
    applyCodeBtn?.addEventListener('click', () => {
        const code = codeInput.value.trim().toUpperCase();
        if (code === 'ORCA' || code === 'RAYDIUM') {
            state.flares += 1000;
            updateFlaresDisplay();
            showNotification(`Partner code ${code} applied! +1,000 Flares`, 'success');
            codeInput.value = '';
        } else if (code) {
            showNotification('Invalid partner code', 'error');
        }
    });
}

function updateReceiveAmount(input, value) {
    const card = input.closest('.swap-card, .lock-card');
    const receivePreview = card?.querySelector('.receive-amount .amount');
    if (receivePreview) {
        // Calculate receive amount based on exchange rate
        const rate = state.lockTab === 'lock' ? 0.9596 : 1.0421;
        const receiveValue = value * rate;
        receivePreview.textContent = `~${receiveValue.toFixed(2)}`;
    }

    // For swap card, update the output input
    if (card?.classList.contains('swap-card')) {
        const outputInput = card.querySelectorAll('.amount-input')[1];
        if (outputInput) {
            outputInput.value = value.toFixed(2);
        }
    }
}

// Price Animation
function startPriceAnimation() {
    setInterval(() => {
        // Simulate small price changes
        const statValues = document.querySelectorAll('.stat-main-value');
        statValues.forEach(el => {
            if (el.textContent.startsWith('$1.0')) {
                const currentPrice = parseFloat(el.textContent.replace('$', ''));
                const change = (Math.random() - 0.5) * 0.001;
                const newPrice = Math.max(1.0, currentPrice + change);
                el.textContent = '$' + newPrice.toFixed(4);
            }
        });

        // Update TVL slightly
        const tvlValue = document.querySelector('.tvl-value');
        if (tvlValue) {
            const currentTvl = parseFloat(tvlValue.textContent.replace(/[$M,]/g, ''));
            const tvlChange = (Math.random() - 0.5) * 0.5;
            const newTvl = currentTvl + tvlChange;
            tvlValue.textContent = '$' + newTvl.toFixed(2) + 'M';
        }
    }, 5000);
}

// Notifications
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    existingNotification?.remove();

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '&#10003;' : type === 'error' ? '&#10005;' : type === 'warning' ? '&#9888;' : '&#8505;'}
            </span>
            <span class="notification-message">${message}</span>
        </div>
    `;

    // Style notification
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: type === 'success' ? 'rgba(0, 212, 170, 0.95)' :
                   type === 'error' ? 'rgba(255, 92, 92, 0.95)' :
                   type === 'warning' ? 'rgba(255, 184, 77, 0.95)' : 'rgba(92, 158, 255, 0.95)',
        color: type === 'warning' ? '#1a1a25' : '#fff',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: '9999',
        animation: 'slideIn 0.3s ease',
        fontWeight: '500',
        fontSize: '0.9rem',
        maxWidth: '400px'
    });

    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .notification-icon {
                font-size: 1.2rem;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add spinning animation for loading states
const spinStyle = document.createElement('style');
spinStyle.textContent = `
    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .wallet-connected-icon {
        width: 8px;
        height: 8px;
        background: var(--success);
        border-radius: 50%;
    }
`;
document.head.appendChild(spinStyle);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Export for global access
window.closeWalletModal = closeWalletModal;
window.navigateTo = navigateTo;
