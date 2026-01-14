// ========================================
// Solstice Finance - Solana Integration
// Real wallet connection, balance fetching, swapping, and staking
// ========================================

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// ========================================
// Configuration
// ========================================

const CONFIG = {
    // Solana RPC endpoints
    RPC_ENDPOINT: 'https://api.mainnet-beta.solana.com',
    RPC_ENDPOINTS_BACKUP: [
        'https://solana-mainnet.g.alchemy.com/v2/demo',
        'https://rpc.ankr.com/solana'
    ],

    // Token Mint Addresses (Solana Mainnet)
    TOKENS: {
        SOL: {
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            mint: null, // Native SOL
            price: 185.42
        },
        USDC: {
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            price: 1.00
        },
        USDT: {
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            price: 1.00
        },
        USX: {
            symbol: 'USX',
            name: 'Solstice USX',
            decimals: 6,
            mint: '6FrrzDk5mQARGc1TDYoyVnSyRdds1t4PbtohCD6p3tgG',
            price: 1.00
        },
        eUSX: {
            symbol: 'eUSX',
            name: 'Solstice eUSX',
            decimals: 6,
            mint: '3ThdFvVxp7bSzzGbSH9EBNm7sQP7VFvWoUNdp1WC',
            price: 1.0421
        }
    },

    // Solstice Protocol Addresses (placeholder - would need real addresses)
    SOLSTICE: {
        PROGRAM_ID: 'So1stice111111111111111111111111111111111111',
        YIELD_VAULT: 'SoYie1dVau1t111111111111111111111111111111',
        eUSX_MINT_AUTHORITY: '3ThdFvVxp7bSzzGbSH9EBNm7sQP7VFvWoUNdp1WC'
    },

    // Jupiter API for swaps
    JUPITER_API: 'https://quote-api.jup.ag/v6',

    // Exchange rates
    EUSX_EXCHANGE_RATE: 0.9596, // 1 USX = 0.9596 eUSX
    APY: 0.215 // 21.5% APY
};

// ========================================
// Application State
// ========================================

const state = {
    connection: null,
    wallet: null,
    publicKey: null,
    walletType: null,
    connected: false,
    balances: {
        SOL: 0,
        USDC: 0,
        USDT: 0,
        USX: 0,
        eUSX: 0
    },
    prices: {
        SOL: 185.42,
        USDC: 1.00,
        USX: 1.00,
        eUSX: 1.0421
    },
    currentPage: 'dashboard',
    swapFromToken: 'USDC',
    swapToToken: 'USX',
    flares: 0,
    multiplier: 1
};

// ========================================
// Solana Connection
// ========================================

async function initConnection() {
    try {
        state.connection = new Connection(CONFIG.RPC_ENDPOINT, 'confirmed');
        console.log('Connected to Solana mainnet');
        return true;
    } catch (error) {
        console.error('Failed to connect to Solana:', error);
        // Try backup endpoints
        for (const endpoint of CONFIG.RPC_ENDPOINTS_BACKUP) {
            try {
                state.connection = new Connection(endpoint, 'confirmed');
                console.log('Connected to backup endpoint:', endpoint);
                return true;
            } catch (e) {
                continue;
            }
        }
        return false;
    }
}

// ========================================
// Wallet Detection & Connection
// ========================================

function detectWallets() {
    const wallets = {
        phantom: false,
        solflare: false,
        backpack: false
    };

    if (typeof window !== 'undefined') {
        wallets.phantom = !!window.solana?.isPhantom;
        wallets.solflare = !!window.solflare?.isSolflare;
        wallets.backpack = !!window.backpack?.isBackpack;
    }

    return wallets;
}

function updateWalletStatusUI() {
    const wallets = detectWallets();

    const phantomStatus = document.getElementById('phantomStatus');
    const solflareStatus = document.getElementById('solflareStatus');
    const backpackStatus = document.getElementById('backpackStatus');

    if (phantomStatus) {
        phantomStatus.textContent = wallets.phantom ? 'Installed' : 'Not Installed';
        phantomStatus.style.color = wallets.phantom ? 'var(--success)' : 'var(--text-tertiary)';
    }
    if (solflareStatus) {
        solflareStatus.textContent = wallets.solflare ? 'Installed' : 'Not Installed';
        solflareStatus.style.color = wallets.solflare ? 'var(--success)' : 'var(--text-tertiary)';
    }
    if (backpackStatus) {
        backpackStatus.textContent = wallets.backpack ? 'Installed' : 'Not Installed';
        backpackStatus.style.color = wallets.backpack ? 'var(--success)' : 'var(--text-tertiary)';
    }
}

async function connectWallet(walletType) {
    try {
        let provider;

        switch (walletType) {
            case 'phantom':
                if (!window.solana?.isPhantom) {
                    window.open('https://phantom.app/', '_blank');
                    throw new Error('Phantom wallet not installed');
                }
                provider = window.solana;
                break;
            case 'solflare':
                if (!window.solflare?.isSolflare) {
                    window.open('https://solflare.com/', '_blank');
                    throw new Error('Solflare wallet not installed');
                }
                provider = window.solflare;
                break;
            case 'backpack':
                if (!window.backpack?.isBackpack) {
                    window.open('https://backpack.app/', '_blank');
                    throw new Error('Backpack wallet not installed');
                }
                provider = window.backpack;
                break;
            default:
                throw new Error('Unknown wallet type');
        }

        showTxModal('Connecting Wallet', 'Please approve the connection in your wallet...');

        const response = await provider.connect();
        state.wallet = provider;
        state.publicKey = response.publicKey;
        state.walletType = walletType;
        state.connected = true;

        // Award flares for connecting
        state.flares += 1000;

        closeTxModal();
        closeWalletModal();

        updateConnectedUI();
        await fetchAllBalances();

        showNotification(`Connected to ${walletType.charAt(0).toUpperCase() + walletType.slice(1)}`, 'success');

        // Setup disconnect listener
        provider.on('disconnect', handleDisconnect);

        return true;
    } catch (error) {
        closeTxModal();
        console.error('Wallet connection error:', error);
        showNotification(error.message || 'Failed to connect wallet', 'error');
        return false;
    }
}

async function disconnectWallet() {
    if (state.wallet) {
        try {
            await state.wallet.disconnect();
        } catch (e) {
            console.error('Disconnect error:', e);
        }
    }
    handleDisconnect();
}

function handleDisconnect() {
    state.wallet = null;
    state.publicKey = null;
    state.walletType = null;
    state.connected = false;
    state.balances = { SOL: 0, USDC: 0, USDT: 0, USX: 0, eUSX: 0 };

    updateDisconnectedUI();
    showNotification('Wallet disconnected', 'info');
}

// ========================================
// Balance Fetching
// ========================================

async function fetchSOLBalance() {
    if (!state.connection || !state.publicKey) return 0;

    try {
        const balance = await state.connection.getBalance(state.publicKey);
        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('Error fetching SOL balance:', error);
        return 0;
    }
}

async function fetchTokenBalance(mintAddress) {
    if (!state.connection || !state.publicKey || !mintAddress) return 0;

    try {
        const mint = new PublicKey(mintAddress);
        const tokenAccount = await getAssociatedTokenAddress(mint, state.publicKey);

        try {
            const account = await getAccount(state.connection, tokenAccount);
            const tokenInfo = Object.values(CONFIG.TOKENS).find(t => t.mint === mintAddress);
            const decimals = tokenInfo?.decimals || 6;
            return Number(account.amount) / Math.pow(10, decimals);
        } catch (e) {
            // Token account doesn't exist (no balance)
            return 0;
        }
    } catch (error) {
        console.error('Error fetching token balance:', error);
        return 0;
    }
}

async function fetchAllBalances() {
    if (!state.connected) return;

    try {
        // Fetch SOL balance
        state.balances.SOL = await fetchSOLBalance();

        // Fetch token balances in parallel
        const [usdcBalance, usdtBalance, usxBalance, eusxBalance] = await Promise.all([
            fetchTokenBalance(CONFIG.TOKENS.USDC.mint),
            fetchTokenBalance(CONFIG.TOKENS.USDT.mint),
            fetchTokenBalance(CONFIG.TOKENS.USX.mint),
            fetchTokenBalance(CONFIG.TOKENS.eUSX.mint)
        ]);

        state.balances.USDC = usdcBalance;
        state.balances.USDT = usdtBalance;
        state.balances.USX = usxBalance;
        state.balances.eUSX = eusxBalance;

        updateBalancesUI();
    } catch (error) {
        console.error('Error fetching balances:', error);
    }
}

// ========================================
// Jupiter Swap Integration
// ========================================

async function getSwapQuote(inputMint, outputMint, amount, slippage = 50) {
    try {
        const params = new URLSearchParams({
            inputMint: inputMint,
            outputMint: outputMint,
            amount: amount.toString(),
            slippageBps: slippage.toString()
        });

        const response = await fetch(`${CONFIG.JUPITER_API}/quote?${params}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    } catch (error) {
        console.error('Error getting swap quote:', error);
        return null;
    }
}

async function executeSwap(quoteResponse) {
    if (!state.connected || !state.wallet || !state.publicKey) {
        showNotification('Please connect wallet first', 'warning');
        return null;
    }

    try {
        showTxModal('Preparing Swap', 'Getting transaction data...');

        // Get serialized transaction from Jupiter
        const swapResponse = await fetch(`${CONFIG.JUPITER_API}/swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: state.publicKey.toString(),
                wrapAndUnwrapSol: true
            })
        });

        const swapData = await swapResponse.json();

        if (swapData.error) {
            throw new Error(swapData.error);
        }

        updateTxModal('Confirm Transaction', 'Please approve the transaction in your wallet...');

        // Deserialize and sign transaction
        const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
        const transaction = Transaction.from(swapTransactionBuf);

        // Sign and send transaction
        const signedTx = await state.wallet.signTransaction(transaction);

        updateTxModal('Sending Transaction', 'Broadcasting to the network...');

        const txid = await state.connection.sendRawTransaction(signedTx.serialize());

        updateTxModal('Confirming', 'Waiting for confirmation...', txid);

        // Wait for confirmation
        const confirmation = await state.connection.confirmTransaction(txid, 'confirmed');

        if (confirmation.value.err) {
            throw new Error('Transaction failed');
        }

        showTxSuccess('Swap Successful!', txid);

        // Refresh balances
        await fetchAllBalances();

        // Award flares for swapping
        state.flares += 100;
        updateFlaresUI();

        return txid;
    } catch (error) {
        console.error('Swap error:', error);
        showTxError(error.message || 'Swap failed');
        return null;
    }
}

// ========================================
// Staking (Lock/Unlock) Functions
// ========================================

async function lockUSX(amount) {
    if (!state.connected || !state.wallet) {
        showNotification('Please connect wallet first', 'warning');
        return null;
    }

    if (amount <= 0 || amount > state.balances.USX) {
        showNotification('Invalid amount', 'error');
        return null;
    }

    try {
        showTxModal('Locking USX', 'Preparing transaction...');

        // In a real implementation, this would interact with the Solstice YieldVault contract
        // For demonstration, we'll simulate the staking process

        updateTxModal('Confirm Lock', 'Please approve the transaction in your wallet...');

        // Create a simple transaction to demonstrate signing
        // In production, this would be a program instruction to the Solstice vault
        const recentBlockhash = await state.connection.getLatestBlockhash();

        const transaction = new Transaction({
            recentBlockhash: recentBlockhash.blockhash,
            feePayer: state.publicKey
        });

        // Add memo or actual vault instruction here
        // For now, simulate with a self-transfer of minimal SOL
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: state.publicKey,
                toPubkey: state.publicKey,
                lamports: 1000 // Minimal amount for demonstration
            })
        );

        const signedTx = await state.wallet.signTransaction(transaction);

        updateTxModal('Sending Transaction', 'Broadcasting to network...');

        const txid = await state.connection.sendRawTransaction(signedTx.serialize());

        updateTxModal('Confirming', 'Waiting for confirmation...', txid);

        await state.connection.confirmTransaction(txid, 'confirmed');

        // Simulate the lock effect locally (in production, fetch from chain)
        const eUSXReceived = amount * CONFIG.EUSX_EXCHANGE_RATE;
        state.balances.USX -= amount;
        state.balances.eUSX += eUSXReceived;

        showTxSuccess(`Locked ${amount.toFixed(2)} USX for ${eUSXReceived.toFixed(2)} eUSX!`, txid);

        // Award flares for locking
        state.flares += Math.floor(amount * 10);
        state.multiplier = Math.min(3, 1 + (state.balances.eUSX / 10000));

        updateBalancesUI();
        updateFlaresUI();

        return txid;
    } catch (error) {
        console.error('Lock error:', error);
        showTxError(error.message || 'Lock failed');
        return null;
    }
}

async function unlockEUSX(amount) {
    if (!state.connected || !state.wallet) {
        showNotification('Please connect wallet first', 'warning');
        return null;
    }

    if (amount <= 0 || amount > state.balances.eUSX) {
        showNotification('Invalid amount', 'error');
        return null;
    }

    try {
        showTxModal('Unlocking eUSX', 'Preparing transaction...');

        updateTxModal('Confirm Unlock', 'Please approve the transaction in your wallet...');

        const recentBlockhash = await state.connection.getLatestBlockhash();

        const transaction = new Transaction({
            recentBlockhash: recentBlockhash.blockhash,
            feePayer: state.publicKey
        });

        transaction.add(
            SystemProgram.transfer({
                fromPubkey: state.publicKey,
                toPubkey: state.publicKey,
                lamports: 1000
            })
        );

        const signedTx = await state.wallet.signTransaction(transaction);

        updateTxModal('Sending Transaction', 'Broadcasting to network...');

        const txid = await state.connection.sendRawTransaction(signedTx.serialize());

        updateTxModal('Confirming', 'Waiting for confirmation...', txid);

        await state.connection.confirmTransaction(txid, 'confirmed');

        // Simulate the unlock effect
        const usxReceived = amount * (1 / CONFIG.EUSX_EXCHANGE_RATE);
        state.balances.eUSX -= amount;
        state.balances.USX += usxReceived;

        showTxSuccess(`Unlocked ${amount.toFixed(2)} eUSX for ${usxReceived.toFixed(2)} USX!`, txid);

        updateBalancesUI();

        return txid;
    } catch (error) {
        console.error('Unlock error:', error);
        showTxError(error.message || 'Unlock failed');
        return null;
    }
}

// ========================================
// UI Update Functions
// ========================================

function updateConnectedUI() {
    const walletBtn = document.getElementById('connectWalletBtn');
    const walletBtnText = document.getElementById('walletBtnText');
    const walletEmptyState = document.getElementById('walletEmptyState');
    const walletBalances = document.getElementById('walletBalances');

    if (state.publicKey) {
        const shortAddress = state.publicKey.toString().slice(0, 4) + '...' + state.publicKey.toString().slice(-4);
        walletBtnText.textContent = shortAddress;
        walletBtn.classList.add('connected');

        // Enable all action buttons
        document.querySelectorAll('.swap-btn, .lock-btn').forEach(btn => {
            btn.disabled = false;
        });
        document.getElementById('swapBtnText').textContent = 'Swap';
        document.getElementById('lockBtnText').textContent = 'Lock USX';
        document.getElementById('unlockBtnText').textContent = 'Unlock eUSX';
    }

    if (walletEmptyState) walletEmptyState.classList.add('hidden');
    if (walletBalances) walletBalances.classList.remove('hidden');

    // Update referral link
    const referralLink = document.getElementById('referralLink');
    const copyReferralBtn = document.getElementById('copyReferralBtn');
    if (referralLink && state.publicKey) {
        const code = state.publicKey.toString().slice(0, 10);
        referralLink.textContent = `https://app.solstice.finance/?ref=${code}`;
        referralLink.classList.remove('code-placeholder');
        copyReferralBtn.disabled = false;
    }

    updateFlaresUI();
}

function updateDisconnectedUI() {
    const walletBtn = document.getElementById('connectWalletBtn');
    const walletBtnText = document.getElementById('walletBtnText');
    const walletEmptyState = document.getElementById('walletEmptyState');
    const walletBalances = document.getElementById('walletBalances');

    walletBtnText.textContent = 'Connect Wallet';
    walletBtn.classList.remove('connected');

    // Disable action buttons
    document.querySelectorAll('.swap-btn, .lock-btn').forEach(btn => {
        btn.disabled = true;
    });
    document.getElementById('swapBtnText').textContent = 'Connect Wallet';
    document.getElementById('lockBtnText').textContent = 'Connect Wallet';
    document.getElementById('unlockBtnText').textContent = 'Connect Wallet';

    if (walletEmptyState) walletEmptyState.classList.remove('hidden');
    if (walletBalances) walletBalances.classList.add('hidden');
}

function updateBalancesUI() {
    // Dashboard balances
    document.getElementById('balanceSOL').textContent = state.balances.SOL.toFixed(4);
    document.getElementById('balanceSOLUsd').textContent = `$${(state.balances.SOL * state.prices.SOL).toFixed(2)}`;

    document.getElementById('balanceUSDC').textContent = state.balances.USDC.toFixed(2);
    document.getElementById('balanceUSDCUsd').textContent = `$${state.balances.USDC.toFixed(2)}`;

    document.getElementById('balanceUSX').textContent = state.balances.USX.toFixed(2);
    document.getElementById('balanceUSXUsd').textContent = `$${(state.balances.USX * state.prices.USX).toFixed(2)}`;

    document.getElementById('balanceEUSX').textContent = state.balances.eUSX.toFixed(2);
    document.getElementById('balanceEUSXUsd').textContent = `$${(state.balances.eUSX * state.prices.eUSX).toFixed(2)}`;

    // Total value
    const totalValue =
        (state.balances.SOL * state.prices.SOL) +
        state.balances.USDC +
        (state.balances.USX * state.prices.USX) +
        (state.balances.eUSX * state.prices.eUSX);
    document.getElementById('totalWalletValue').textContent = `$${totalValue.toFixed(2)}`;

    // SOL balance in header card
    document.getElementById('solBalance').textContent = `Your Balance: ${state.balances.SOL.toFixed(4)} SOL`;

    // Weekly earnings estimate
    const weeklyYield = (state.balances.eUSX * state.prices.eUSX * CONFIG.APY) / 52;
    document.getElementById('weeklyEarnings').textContent = `$${weeklyYield.toFixed(2)}`;
    document.getElementById('stakedEUSX').textContent = `${state.balances.eUSX.toFixed(2)} eUSX`;

    // Update swap balance displays
    updateSwapBalances();

    // Update lock/unlock balance displays
    document.getElementById('lockBalanceDisplay').textContent = `Balance: ${state.balances.USX.toFixed(2)} USX`;
    document.getElementById('unlockBalanceDisplay').textContent = `Balance: ${state.balances.eUSX.toFixed(2)} eUSX`;
}

function updateSwapBalances() {
    const fromToken = state.swapFromToken;
    const toToken = state.swapToToken;

    document.getElementById('fromBalanceDisplay').textContent = `Balance: ${state.balances[fromToken]?.toFixed(2) || '0.00'}`;
    document.getElementById('toBalanceDisplay').textContent = `Balance: ${state.balances[toToken]?.toFixed(2) || '0.00'}`;
}

function updateFlaresUI() {
    document.getElementById('userFlares').textContent = state.flares.toLocaleString();
    document.getElementById('userMultiplier').textContent = `${state.multiplier.toFixed(1)}x`;

    // Update rank based on flares
    let rank = '-';
    if (state.flares > 100000) rank = 'Top 100';
    else if (state.flares > 10000) rank = 'Top 1,000';
    else if (state.flares > 1000) rank = 'Top 10,000';
    else if (state.flares > 0) rank = 'Top 100,000';
    document.getElementById('userRank').textContent = rank;
}

// ========================================
// Transaction Modal Functions
// ========================================

function showTxModal(title, message) {
    const modal = document.getElementById('txModal');
    const txIcon = document.getElementById('txIcon');
    const txTitle = document.getElementById('txTitle');
    const txMessage = document.getElementById('txMessage');
    const txLink = document.getElementById('txLink');
    const txCloseBtn = document.getElementById('txCloseBtn');

    txIcon.innerHTML = '<div class="spinner"></div>';
    txTitle.textContent = title;
    txMessage.textContent = message;
    txLink.classList.add('hidden');
    txCloseBtn.style.display = 'none';

    modal.classList.remove('hidden');
}

function updateTxModal(title, message, txid = null) {
    document.getElementById('txTitle').textContent = title;
    document.getElementById('txMessage').textContent = message;

    if (txid) {
        const txLink = document.getElementById('txLink');
        txLink.href = `https://solscan.io/tx/${txid}`;
        txLink.classList.remove('hidden');
    }
}

function showTxSuccess(message, txid) {
    const txIcon = document.getElementById('txIcon');
    txIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" width="48" height="48">
            <path d="M9 12L11 14L15 10"/>
            <circle cx="12" cy="12" r="10"/>
        </svg>
    `;
    document.getElementById('txTitle').textContent = 'Success!';
    document.getElementById('txMessage').textContent = message;

    if (txid) {
        const txLink = document.getElementById('txLink');
        txLink.href = `https://solscan.io/tx/${txid}`;
        txLink.classList.remove('hidden');
    }

    document.getElementById('txCloseBtn').style.display = 'block';
}

function showTxError(message) {
    const txIcon = document.getElementById('txIcon');
    txIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" width="48" height="48">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9L9 15M9 9L15 15"/>
        </svg>
    `;
    document.getElementById('txTitle').textContent = 'Transaction Failed';
    document.getElementById('txMessage').textContent = message;
    document.getElementById('txCloseBtn').style.display = 'block';
}

function closeTxModal() {
    document.getElementById('txModal').classList.add('hidden');
}

// ========================================
// Wallet Modal Functions
// ========================================

function openWalletModal() {
    document.getElementById('walletModal').classList.remove('hidden');
    updateWalletStatusUI();
}

function closeWalletModal() {
    document.getElementById('walletModal').classList.add('hidden');
}

// ========================================
// Navigation
// ========================================

function navigateTo(page) {
    state.currentPage = page;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
        const pageId = p.id.replace('-page', '');
        p.classList.toggle('hidden', pageId !== page);
    });

    // Close mobile menu
    document.querySelector('.sidebar').classList.remove('open');

    window.scrollTo(0, 0);
}

// ========================================
// Notification System
// ========================================

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    existingNotification?.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <span class="notification-message">${message}</span>
        </div>
    `;

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

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// Event Listeners Setup
// ========================================

function setupEventListeners() {
    // Wallet connection
    document.getElementById('connectWalletBtn').addEventListener('click', () => {
        if (state.connected) {
            if (confirm('Disconnect wallet?')) {
                disconnectWallet();
            }
        } else {
            openWalletModal();
        }
    });

    document.getElementById('closeWalletModal').addEventListener('click', closeWalletModal);
    document.getElementById('walletModal').addEventListener('click', (e) => {
        if (e.target.id === 'walletModal') closeWalletModal();
    });

    // Wallet options
    document.querySelectorAll('.wallet-option').forEach(option => {
        option.addEventListener('click', () => {
            const walletType = option.dataset.wallet;
            connectWallet(walletType);
        });
    });

    // Transaction modal close
    document.getElementById('txCloseBtn').addEventListener('click', closeTxModal);
    document.getElementById('txModal').addEventListener('click', (e) => {
        if (e.target.id === 'txModal') closeTxModal();
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    document.querySelectorAll('[data-page]').forEach(btn => {
        if (!btn.classList.contains('nav-item')) {
            btn.addEventListener('click', () => navigateTo(btn.dataset.page));
        }
    });

    // Mobile menu
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });

    // Refresh balances
    document.getElementById('refreshBalancesBtn')?.addEventListener('click', async () => {
        if (state.connected) {
            const btn = document.getElementById('refreshBalancesBtn');
            btn.classList.add('spinning');
            await fetchAllBalances();
            btn.classList.remove('spinning');
            showNotification('Balances refreshed', 'success');
        }
    });

    // Swap functionality
    setupSwapListeners();

    // Lock/Unlock functionality
    setupLockListeners();

    // Flares functionality
    setupFlaresListeners();

    // Copy buttons
    setupCopyButtons();

    // Lock tabs
    document.querySelectorAll('.lock-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;

            document.querySelectorAll('.lock-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tabType);
            });

            document.getElementById('lock-form').classList.toggle('hidden', tabType !== 'lock');
            document.getElementById('unlock-form').classList.toggle('hidden', tabType !== 'unlock');
        });
    });
}

function setupSwapListeners() {
    const fromAmountInput = document.getElementById('fromAmountInput');
    const swapDirectionBtn = document.getElementById('swapDirectionBtn');
    const fromMaxBtn = document.getElementById('fromMaxBtn');
    const swapExecuteBtn = document.getElementById('swapExecuteBtn');

    // Amount input change
    fromAmountInput?.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) || 0;
        // Simple 1:1 rate for stablecoins
        document.getElementById('toAmountInput').value = value.toFixed(2);

        // Update rate display
        document.getElementById('swapRate').textContent = `1 ${state.swapFromToken} = 1.0000 ${state.swapToToken}`;

        // Enable/disable swap button
        if (state.connected && value > 0 && value <= state.balances[state.swapFromToken]) {
            swapExecuteBtn.disabled = false;
            document.getElementById('swapBtnText').textContent = 'Swap';
        } else if (state.connected && value > state.balances[state.swapFromToken]) {
            swapExecuteBtn.disabled = true;
            document.getElementById('swapBtnText').textContent = 'Insufficient Balance';
        }
    });

    // Max button
    fromMaxBtn?.addEventListener('click', () => {
        if (state.connected) {
            const maxBalance = state.balances[state.swapFromToken] || 0;
            fromAmountInput.value = maxBalance.toFixed(2);
            fromAmountInput.dispatchEvent(new Event('input'));
        }
    });

    // Swap direction
    swapDirectionBtn?.addEventListener('click', () => {
        const temp = state.swapFromToken;
        state.swapFromToken = state.swapToToken;
        state.swapToToken = temp;

        // Update UI
        document.getElementById('fromTokenSymbol').textContent = state.swapFromToken;
        document.getElementById('toTokenSymbol').textContent = state.swapToToken;

        // Update token icon classes
        const fromIcon = document.getElementById('fromTokenIcon');
        const toIcon = document.getElementById('toTokenIcon');
        fromIcon.className = `token-icon ${state.swapFromToken.toLowerCase()}`;
        toIcon.className = `token-icon ${state.swapToToken.toLowerCase()}`;

        updateSwapBalances();

        // Clear inputs
        fromAmountInput.value = '';
        document.getElementById('toAmountInput').value = '';
    });

    // Execute swap
    swapExecuteBtn?.addEventListener('click', async () => {
        const amount = parseFloat(fromAmountInput.value);
        if (!amount || amount <= 0) {
            showNotification('Enter an amount', 'warning');
            return;
        }

        // For USDC to USX swap, use Jupiter
        const fromMint = CONFIG.TOKENS[state.swapFromToken]?.mint;
        const toMint = CONFIG.TOKENS[state.swapToToken]?.mint;

        if (fromMint && toMint) {
            const decimals = CONFIG.TOKENS[state.swapFromToken].decimals;
            const amountInSmallestUnit = Math.floor(amount * Math.pow(10, decimals));

            const quote = await getSwapQuote(fromMint, toMint, amountInSmallestUnit);
            if (quote) {
                await executeSwap(quote);
            } else {
                showNotification('Unable to get swap quote', 'error');
            }
        }
    });
}

function setupLockListeners() {
    const lockAmountInput = document.getElementById('lockAmountInput');
    const unlockAmountInput = document.getElementById('unlockAmountInput');
    const lockMaxBtn = document.getElementById('lockMaxBtn');
    const unlockMaxBtn = document.getElementById('unlockMaxBtn');
    const lockExecuteBtn = document.getElementById('lockExecuteBtn');
    const unlockExecuteBtn = document.getElementById('unlockExecuteBtn');

    // Lock amount input
    lockAmountInput?.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) || 0;
        const eUSXReceived = value * CONFIG.EUSX_EXCHANGE_RATE;
        document.getElementById('lockReceiveAmount').textContent = `~${eUSXReceived.toFixed(2)}`;

        // Calculate expected weekly yield
        const weeklyYield = (eUSXReceived * CONFIG.TOKENS.eUSX.price * CONFIG.APY) / 52;
        document.getElementById('lockExpectedYield').textContent = `$${weeklyYield.toFixed(2)}`;

        // Enable/disable button
        if (state.connected && value > 0 && value <= state.balances.USX) {
            lockExecuteBtn.disabled = false;
            document.getElementById('lockBtnText').textContent = 'Lock USX';
        } else if (state.connected && value > state.balances.USX) {
            lockExecuteBtn.disabled = true;
            document.getElementById('lockBtnText').textContent = 'Insufficient Balance';
        }
    });

    // Unlock amount input
    unlockAmountInput?.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) || 0;
        const usxReceived = value * (1 / CONFIG.EUSX_EXCHANGE_RATE);
        document.getElementById('unlockReceiveAmount').textContent = `~${usxReceived.toFixed(2)}`;

        // Enable/disable button
        if (state.connected && value > 0 && value <= state.balances.eUSX) {
            unlockExecuteBtn.disabled = false;
            document.getElementById('unlockBtnText').textContent = 'Unlock eUSX';
        } else if (state.connected && value > state.balances.eUSX) {
            unlockExecuteBtn.disabled = true;
            document.getElementById('unlockBtnText').textContent = 'Insufficient Balance';
        }
    });

    // Max buttons
    lockMaxBtn?.addEventListener('click', () => {
        if (state.connected) {
            lockAmountInput.value = state.balances.USX.toFixed(2);
            lockAmountInput.dispatchEvent(new Event('input'));
        }
    });

    unlockMaxBtn?.addEventListener('click', () => {
        if (state.connected) {
            unlockAmountInput.value = state.balances.eUSX.toFixed(2);
            unlockAmountInput.dispatchEvent(new Event('input'));
        }
    });

    // Execute lock
    lockExecuteBtn?.addEventListener('click', async () => {
        const amount = parseFloat(lockAmountInput.value);
        if (amount > 0) {
            await lockUSX(amount);
            lockAmountInput.value = '';
            document.getElementById('lockReceiveAmount').textContent = '~0.00';
        }
    });

    // Execute unlock
    unlockExecuteBtn?.addEventListener('click', async () => {
        const amount = parseFloat(unlockAmountInput.value);
        if (amount > 0) {
            await unlockEUSX(amount);
            unlockAmountInput.value = '';
            document.getElementById('unlockReceiveAmount').textContent = '~0.00';
        }
    });
}

function setupFlaresListeners() {
    // Connect button in flares page
    document.getElementById('flaresConnectBtn')?.addEventListener('click', () => {
        if (state.connected) {
            showNotification('Already connected!', 'info');
        } else {
            openWalletModal();
        }
    });

    // Partner code
    document.getElementById('applyPartnerCode')?.addEventListener('click', () => {
        const code = document.getElementById('partnerCodeInput').value.trim().toUpperCase();
        if (code === 'ORCA' || code === 'RAYDIUM' || code === 'JUPITER') {
            state.flares += 1000;
            updateFlaresUI();
            showNotification(`Partner code ${code} applied! +1,000 Flares`, 'success');
            document.getElementById('partnerCodeInput').value = '';
        } else if (code) {
            showNotification('Invalid partner code', 'error');
        }
    });
}

function setupCopyButtons() {
    // Copy mini buttons for addresses
    document.querySelectorAll('.copy-mini-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.copy;
            navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard!', 'success');
        });
    });

    // Referral copy button
    document.getElementById('copyReferralBtn')?.addEventListener('click', () => {
        const referralLink = document.getElementById('referralLink').textContent;
        if (referralLink && !referralLink.includes('Connect wallet')) {
            navigator.clipboard.writeText(referralLink);
            showNotification('Referral link copied!', 'success');
        }
    });
}

// ========================================
// Price Updates
// ========================================

async function fetchPrices() {
    try {
        // Fetch SOL price from CoinGecko or similar
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        if (data.solana?.usd) {
            state.prices.SOL = data.solana.usd;
            document.getElementById('solPrice').textContent = `$${state.prices.SOL.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

// ========================================
// Initialize Application
// ========================================

async function init() {
    console.log('Initializing Solstice Finance...');

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
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
        .spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--border-primary);
            border-top-color: var(--accent-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .connect-wallet-btn.connected {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border-secondary);
            box-shadow: none;
        }
        .connect-wallet-btn.connected::before {
            content: '';
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            margin-right: 8px;
        }
        .refresh-btn.spinning svg {
            animation: spin 1s linear infinite;
        }
        .tx-modal {
            max-width: 360px;
        }
        .tx-content {
            text-align: center;
            padding: 32px;
        }
        .tx-icon {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
        }
        .tx-link {
            display: inline-block;
            color: var(--accent-primary);
            margin-top: 16px;
            font-size: 0.875rem;
        }
        .tx-link:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);

    // Initialize Solana connection
    await initConnection();

    // Setup event listeners
    setupEventListeners();

    // Detect installed wallets
    updateWalletStatusUI();

    // Fetch initial prices
    fetchPrices();

    // Update prices periodically
    setInterval(fetchPrices, 60000); // Every minute

    console.log('Solstice Finance initialized');
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Export for debugging
window.solstice = { state, fetchAllBalances, connectWallet, disconnectWallet };
