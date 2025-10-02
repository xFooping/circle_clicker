// Enhanced clicker.js - ORGANIZED SHOPS VERSION
const SAVE_KEY = "clickerSave_v5";
const AUTOSAVE_INTERVAL_MS = 5000;
const PRESTIGE_BASE = 1e6;
const PRESTIGE_MULT_PER_POINT = 0.05;
const COMBO_TIMEOUT = 2000;
const COMBO_THRESHOLD = 5;

// Anti-autoclicker settings
const MAX_CLICKS_PER_SECOND = 20;
const AUTOCLICKER_CHECK_WINDOW = 1000;
const AUTOCLICKER_PENALTY_DURATION = 5000;

let state = {
  points: 0,
  clickPower: 1,
  multiplier: 1,
  version: 5,
  totalClicks: 0,
  totalPointsEarned: 0,
  totalUpgradesBought: 0,
  prestigePoints: 0,
  goldenClicks: 0,
  totalPrestiges: 0,
  lastSaveTime: Date.now(),
  playTime: 0,
  theme: 'dark',
  soundEnabled: true,
  particlesEnabled: true,
  lastDailyReward: 0,
  dailyStreak: 0,
  wheelCooldown: 0,
  goldenUnlocked: false,
  comboUnlocked: false,
  clickHistory: [],
  autoclickerPenalty: 0,
};

const UPGRADES = [
  // WORKERS (idle production) - slower idle gains
  { id: "idle1", name: "Idle Worker", desc: "+0.5 points/sec", baseCost: 100, costMult: 1.8, type: "idle", effect: 0.5, category: "workers", unlockAfter: null },
  { id: "auto1", name: "Auto-clicker", desc: "+1 points/sec", baseCost: 800, costMult: 2.0, type: "idle", effect: 1, category: "workers", unlockAfter: 5 },
  { id: "idle2", name: "Idle Factory", desc: "+3 points/sec", baseCost: 5000, costMult: 1.9, type: "idle", effect: 3, category: "workers", unlockAfter: 8 },
  { id: "idle3", name: "Mega Generator", desc: "+10 points/sec", baseCost: 25000, costMult: 1.8, type: "idle", effect: 10, category: "workers", unlockAfter: 12 },
  
  // CLICK UPGRADES - slower click power gains
  { id: "click1", name: "Better Cursor", desc: "+1 click power", baseCost: 50, costMult: 1.9, type: "click", effect: 1, category: "clicks", unlockAfter: null },
  { id: "click2", name: "Super Cursor", desc: "+3 click power", baseCost: 3000, costMult: 2.0, type: "click", effect: 3, category: "clicks", unlockAfter: 8 },
  { id: "combo1", name: "Combo Master", desc: "Unlock combo system (click fast for bonus)", baseCost: 150000, costMult: 999, type: "special_combo", effect: 1, category: "clicks", unlockAfter: 15 },
  { id: "golden1", name: "Golden Touch", desc: "Unlock golden clicks (5% chance for 10x)", baseCost: 100000, costMult: 999, type: "special_golden", effect: 0.05, category: "clicks", unlockAfter: 15 },
  { id: "golden2", name: "Golden Boost", desc: "+5% golden click chance", baseCost: 500000, costMult: 3.5, type: "special", effect: 0.05, category: "clicks", unlockAfter: 18 },
  
  // MULTIPLIERS - smaller multiplier gains
  { id: "multi1", name: "Multiplier", desc: "x1.15 global multiplier", baseCost: 500, costMult: 2.5, type: "multi", effect: 1.15, category: "multipliers", unlockAfter: 5 },
  { id: "multi2", name: "Big Multiplier", desc: "x1.3 global multiplier", baseCost: 50000, costMult: 2.8, type: "multi", effect: 1.3, category: "multipliers", unlockAfter: 12 },
];

const PRESTIGE_UPGRADES = [
  { id: "pp_click", name: "Eternal Click", desc: "Start with +10 click power", cost: 1, type: "start_click", effect: 10 },
  { id: "pp_idle", name: "Eternal Idle", desc: "Start with +10 idle/sec", cost: 1, type: "start_idle", effect: 10 },
  { id: "pp_multi", name: "Eternal Multi", desc: "Permanent x1.5 multiplier", cost: 2, type: "permanent_multi", effect: 1.5 },
  { id: "pp_golden", name: "Golden Blessing", desc: "+10% golden click chance", cost: 3, type: "golden_boost", effect: 0.1 },
  { id: "pp_offline", name: "Offline Bonus", desc: "2x offline progress", cost: 2, type: "offline_boost", effect: 2 },
];

const ACHIEVEMENTS = [
  { id: "clicks10", name: "First Steps", desc: "Click 10 times", check: () => state.totalClicks >= 10, reward: { type: "points", amount: 100 } },
  { id: "clicks100", name: "Click Addict", desc: "Click 100 times", check: () => state.totalClicks >= 100, reward: { type: "points", amount: 500 } },
  { id: "clicks1000", name: "Click Master", desc: "Click 1,000 times", check: () => state.totalClicks >= 1000, reward: { type: "prestigePoints", amount: 1 } },
  { id: "points1k", name: "Getting Rich", desc: "Earn 1,000 total points", check: () => state.totalPointsEarned >= 1000, reward: { type: "points", amount: 200 } },
  { id: "points1m", name: "Millionaire", desc: "Earn 1M total points", check: () => state.totalPointsEarned >= 1e6, reward: { type: "prestigePoints", amount: 1 } },
  { id: "points1b", name: "Billionaire", desc: "Earn 1B total points", check: () => state.totalPointsEarned >= 1e9, reward: { type: "prestigePoints", amount: 5 } },
  { id: "buy5upg", name: "Shopper", desc: "Buy 5 upgrades", check: () => state.totalUpgradesBought >= 5, reward: { type: "points", amount: 1000 } },
  { id: "buy25upg", name: "Big Spender", desc: "Buy 25 upgrades", check: () => state.totalUpgradesBought >= 25, reward: { type: "prestigePoints", amount: 1 } },
  { id: "idle50", name: "Idle Starter", desc: "50 idle/sec", check: () => calcTotalIdleRaw() >= 50, reward: { type: "points", amount: 5000 } },
  { id: "idle500", name: "Idle King", desc: "500 idle/sec", check: () => calcTotalIdleRaw() >= 500, reward: { type: "prestigePoints", amount: 2 } },
  { id: "golden10", name: "Golden Touch", desc: "Get 10 golden clicks", check: () => state.goldenClicks >= 10, reward: { type: "points", amount: 10000 } },
  { id: "golden100", name: "Golden Master", desc: "Get 100 golden clicks", check: () => state.goldenClicks >= 100, reward: { type: "prestigePoints", amount: 3 } },
  { id: "prestige1", name: "Ascended", desc: "Prestige once", check: () => state.totalPrestiges >= 1, reward: { type: "points", amount: 50000 } },
  { id: "prestige5", name: "Veteran", desc: "Prestige 5 times", check: () => state.totalPrestiges >= 5, reward: { type: "prestigePoints", amount: 5 } },
  { id: "daily7", name: "Dedicated", desc: "7 day streak", check: () => state.dailyStreak >= 7, reward: { type: "prestigePoints", amount: 2 }, secret: false },
  { id: "secret1", name: "???", desc: "Hidden achievement", check: () => state.totalClicks >= 10000, reward: { type: "prestigePoints", amount: 10 }, secret: true },
  { id: "secret2", name: "???", desc: "Hidden achievement", check: () => state.points >= 1e12, reward: { type: "prestigePoints", amount: 15 }, secret: true },
];

let upgrades = UPGRADES.map(u => ({ ...u, level: 0, cost: u.baseCost }));
let prestigeUpgrades = PRESTIGE_UPGRADES.map(u => ({ ...u, owned: false }));
let achievements = ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));

let comboCount = 0;
let comboTimer = null;
let goldenActive = false;

function trimTrailingZeros(str) {
  return str.replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'');
}

function formatNumber(n) {
  if (typeof n !== 'number' || !isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs < 1000) {
    if (Math.abs(Math.round(n) - n) < 1e-9) return String(Math.round(n));
    const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
    return trimTrailingZeros(n.toFixed(decimals));
  }
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc"];
  let num = n;
  let unitIndex = -1;
  while (Math.abs(num) >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  const decimals = Math.abs(num) >= 100 ? 0 : Math.abs(num) >= 10 ? 1 : 2;
  return `${trimTrailingZeros(num.toFixed(decimals))}${units[unitIndex] || ""}`;
}

function formatTime(minutes) {
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function calcTotalIdleRaw(s = state) {
  let total = 0;
  upgrades.forEach(u => { if (u.type === "idle") total += (u.effect * u.level); });
  const ppBonus = prestigeUpgrades.find(p => p.id === "pp_idle");
  if (ppBonus && ppBonus.owned) total += ppBonus.effect;
  return total;
}

function calcTotalIdle() {
  const raw = calcTotalIdleRaw();
  let mult = state.multiplier;
  const ppMulti = prestigeUpgrades.find(p => p.id === "pp_multi");
  if (ppMulti && ppMulti.owned) mult *= ppMulti.effect;
  const prestigeMult = (1 + (state.prestigePoints || 0) * PRESTIGE_MULT_PER_POINT);
  return raw * mult * prestigeMult;
}

function calcClickPower() {
  let base = state.clickPower;
  const ppBonus = prestigeUpgrades.find(p => p.id === "pp_click");
  if (ppBonus && ppBonus.owned) base += ppBonus.effect;
  
  let mult = state.multiplier;
  const ppMulti = prestigeUpgrades.find(p => p.id === "pp_multi");
  if (ppMulti && ppMulti.owned) mult *= ppMulti.effect;
  
  const prestigeMult = (1 + (state.prestigePoints || 0) * PRESTIGE_MULT_PER_POINT);
  
  // Combo only applies if unlocked
  const comboMult = (state.comboUnlocked && comboCount >= COMBO_THRESHOLD) ? (1 + (comboCount - COMBO_THRESHOLD + 1) * 0.5) : 1;
  
  return base * mult * prestigeMult * comboMult;
}

function getGoldenChance() {
  if (!state.goldenUnlocked) return 0;
  
  let chance = 0.05; // Base 5% from golden1 upgrade
  upgrades.forEach(u => { 
    if (u.type === "special" && u.id === "golden2") {
      chance += u.effect * u.level; 
    }
  });
  const ppGolden = prestigeUpgrades.find(p => p.id === "pp_golden");
  if (ppGolden && ppGolden.owned) chance += ppGolden.effect;
  return Math.min(chance, 0.5);
}

function isUpgradeUnlocked(upgrade) {
  if (upgrade.unlockAfter === null) return true;
  return state.totalUpgradesBought >= upgrade.unlockAfter;
}

// Anti-autoclicker detection
function checkAutoclicker() {
  const now = Date.now();
  state.clickHistory = state.clickHistory.filter(t => now - t < AUTOCLICKER_CHECK_WINDOW);
  
  if (state.clickHistory.length >= MAX_CLICKS_PER_SECOND) {
    return true;
  }
  return false;
}

function applyAutoclickerPenalty() {
  state.autoclickerPenalty = Date.now() + AUTOCLICKER_PENALTY_DURATION;
  const modal = document.getElementById("autoclicker-modal");
  if (modal) modal.classList.add("active");
  pushToast("⚠️ Autoclicker detected! Clicks disabled for 5s", 3000, "warning");
}

document.addEventListener("DOMContentLoaded", () => {
  const circle = document.getElementById("circle");
  const pointsDisplay = document.getElementById("points-display");
  const clickDisplay = document.getElementById("click-display");
  const idleDisplay = document.getElementById("idle-display");
  const multDisplay = document.getElementById("mult-display");
  const workersGrid = document.getElementById("workers-grid");
  const clicksGrid = document.getElementById("clicks-grid");
  const multipliersGrid = document.getElementById("multipliers-grid");
  const prestigeShopGrid = document.getElementById("prestige-shop-grid");
  const totalIdleEl = document.getElementById("total-idle");
  const saveBtn = document.getElementById("save-btn");
  const resetBtn = document.getElementById("reset-btn");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const autosaveToggle = document.getElementById("autosave-toggle");
  const particleLayer = document.getElementById("particle-layer");
  const toastLayer = document.getElementById("toast-layer");
  const comboMeter = document.getElementById("combo-meter");
  const comboValue = document.getElementById("combo-value");
  const goldenChanceDiv = document.getElementById("golden-chance");
  const goldenPct = document.getElementById("golden-pct");

  const achGrid = document.getElementById("ach-grid");
  const achCount = document.getElementById("ach-count");
  const achTotal = document.getElementById("ach-total");
  const prestigePointsEl = document.getElementById("prestige-points");
  const ppBalance = document.getElementById("pp-balance");
  const prestigeCurrent = document.getElementById("prestige-current");
  const prestigePotentialEl = document.getElementById("prestige-potential");
  const doPrestigeBtn = document.getElementById("do-prestige");

  const dailyBtn = document.getElementById("daily-btn");
  const dailyModal = document.getElementById("daily-modal");
  const dailyClose = document.getElementById("daily-close");
  const dailyContent = document.getElementById("daily-content");

  const importModal = document.getElementById("import-modal");
  const importClose = document.getElementById("import-close");
  const importText = document.getElementById("import-text");
  const importConfirm = document.getElementById("import-confirm");

  const autoclickerModal = document.getElementById("autoclicker-modal");
  const autoclickerClose = document.getElementById("autoclicker-close");

  // Credits modal elements (new)
  const creditsBtn = document.getElementById("credits-btn");
  const creditsModal = document.getElementById("credits-modal");
  const creditsClose = document.getElementById("credits-close");

  const spinWheel = document.getElementById("spin-wheel");
  const wheel = document.getElementById("wheel");
  const wheelCooldown = document.getElementById("wheel-cooldown");
  const guessBtn = document.getElementById("guess-btn");
  const guessInput = document.getElementById("guess-input");

  const dealBtn = document.getElementById("deal-btn");
  const hitBtn = document.getElementById("hit-btn");
  const standBtn = document.getElementById("stand-btn");
  const doubleBtn = document.getElementById("double-btn");
  const betInput = document.getElementById("bet-input");
  const dealerCards = document.getElementById("dealer-cards");
  const playerCards = document.getElementById("player-cards");
  const dealerValue = document.getElementById("dealer-value");
  const playerValue = document.getElementById("player-value");
  const blackjackResult = document.getElementById("blackjack-result");

  const soundToggle = document.getElementById("sound-toggle");
  const particlesToggle = document.getElementById("particles-toggle");

  // Blackjack game state
  let blackjackState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    currentBet: 0,
    gameActive: false,
    dealerRevealed: false
  };

  function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (let suit of suits) {
      for (let rank of ranks) {
        const isRed = suit === '♥' || suit === '♦';
        deck.push({ rank, suit, isRed });
      }
    }
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  function getCardValue(card) {
    if (card.rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    return parseInt(card.rank);
  }

  function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    
    for (let card of hand) {
      const cardValue = getCardValue(card);
      value += cardValue;
      if (card.rank === 'A') aces++;
    }
    
    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  }

  function renderCard(card, faceDown = false) {
    const cardEl = document.createElement('div');
    cardEl.className = `playing-card ${faceDown ? 'back' : (card.isRed ? 'red' : 'black')}`;
    if (!faceDown) {
      cardEl.textContent = `${card.rank}${card.suit}`;
    }
    return cardEl;
  }

  function updateBlackjackDisplay() {
    // Clear previous cards
    playerCards.innerHTML = '';
    dealerCards.innerHTML = '';
    
    // Render player cards
    blackjackState.playerHand.forEach(card => {
      playerCards.appendChild(renderCard(card));
    });
    
    // Render dealer cards (first card face down if game active and not revealed)
    blackjackState.dealerHand.forEach((card, index) => {
      const faceDown = index === 0 && blackjackState.gameActive && !blackjackState.dealerRevealed;
      dealerCards.appendChild(renderCard(card, faceDown));
    });
    
    // Update values
    const playerVal = calculateHandValue(blackjackState.playerHand);
    playerValue.textContent = `(${playerVal})`;
    
    if (blackjackState.dealerRevealed || !blackjackState.gameActive) {
      const dealerVal = calculateHandValue(blackjackState.dealerHand);
      dealerValue.textContent = `(${dealerVal})`;
    } else {
      dealerValue.textContent = '';
    }
  }

  function dealBlackjack() {
    const bet = parseInt(betInput.value);
    
    if (isNaN(bet) || bet < 100 || bet > 100000) {
      pushToast("Bet must be between 100 and 100,000");
      return;
    }
    
    if (state.points < bet) {
      pushToast("Not enough points!");
      return;
    }
    
    // Deduct bet
    state.points -= bet;
    blackjackState.currentBet = bet;
    
    // Create new deck and deal
    blackjackState.deck = createDeck();
    blackjackState.playerHand = [blackjackState.deck.pop(), blackjackState.deck.pop()];
    blackjackState.dealerHand = [blackjackState.deck.pop(), blackjackState.deck.pop()];
    blackjackState.gameActive = true;
    blackjackState.dealerRevealed = false;
    
    updateBlackjackDisplay();
    blackjackResult.classList.remove('show', 'win', 'lose', 'push');
    
    // Enable game buttons
    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = state.points < bet ? true : false;
    dealBtn.disabled = true;
    
    // Check for blackjack
    const playerVal = calculateHandValue(blackjackState.playerHand);
    if (playerVal === 21) {
      endBlackjackGame();
    }
    
    playBeep("purchase");
    updateUI();
  }

  function hitBlackjack() {
    if (!blackjackState.gameActive) return;
    
    blackjackState.playerHand.push(blackjackState.deck.pop());
    updateBlackjackDisplay();
    
    const playerVal = calculateHandValue(blackjackState.playerHand);
    
    // Disable double down after first hit
    doubleBtn.disabled = true;
    
    if (playerVal > 21) {
      endBlackjackGame();
    } else if (playerVal === 21) {
      standBlackjack();
    }
    
    playBeep("click");
  }

  function standBlackjack() {
    if (!blackjackState.gameActive) return;
    
    blackjackState.dealerRevealed = true;
    updateBlackjackDisplay();
    
    // Dealer draws until 17 or higher
    let dealerVal = calculateHandValue(blackjackState.dealerHand);
    
    const dealerDrawInterval = setInterval(() => {
      if (dealerVal < 17) {
        blackjackState.dealerHand.push(blackjackState.deck.pop());
        dealerVal = calculateHandValue(blackjackState.dealerHand);
        updateBlackjackDisplay();
      } else {
        clearInterval(dealerDrawInterval);
        endBlackjackGame();
      }
    }, 600);
    
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
  }

  function doubleDownBlackjack() {
    if (!blackjackState.gameActive) return;
    
    const additionalBet = blackjackState.currentBet;
    
    if (state.points < additionalBet) {
      pushToast("Not enough points to double down!");
      return;
    }
    
    state.points -= additionalBet;
    blackjackState.currentBet *= 2;
    
    // Hit once then stand
    blackjackState.playerHand.push(blackjackState.deck.pop());
    updateBlackjackDisplay();
    updateUI();
    
    const playerVal = calculateHandValue(blackjackState.playerHand);
    
    if (playerVal > 21) {
      endBlackjackGame();
    } else {
      standBlackjack();
    }
    
    playBeep("purchase");
  }

  function endBlackjackGame() {
    blackjackState.gameActive = false;
    blackjackState.dealerRevealed = true;
    updateBlackjackDisplay();
    
    const playerVal = calculateHandValue(blackjackState.playerHand);
    const dealerVal = calculateHandValue(blackjackState.dealerHand);
    
    let result = '';
    let resultClass = '';
    let winnings = 0;
    
    // Check for blackjack (21 with 2 cards)
    const playerBlackjack = playerVal === 21 && blackjackState.playerHand.length === 2;
    const dealerBlackjack = dealerVal === 21 && blackjackState.dealerHand.length === 2;
    
    if (playerVal > 21) {
      result = `Bust! You lose ${formatNumber(blackjackState.currentBet)} points`;
      resultClass = 'lose';
    } else if (dealerVal > 21) {
      winnings = blackjackState.currentBet * 2;
      result = `Dealer busts! You win ${formatNumber(blackjackState.currentBet)} points`;
      resultClass = 'win';
    } else if (playerBlackjack && !dealerBlackjack) {
      winnings = Math.floor(blackjackState.currentBet * 2.5);
      result = `BLACKJACK! You win ${formatNumber(blackjackState.currentBet * 1.5)} points`;
      resultClass = 'win';
    } else if (playerVal > dealerVal) {
      winnings = blackjackState.currentBet * 2;
      result = `You win ${formatNumber(blackjackState.currentBet)} points!`;
      resultClass = 'win';
    } else if (playerVal < dealerVal) {
      result = `You lose ${formatNumber(blackjackState.currentBet)} points`;
      resultClass = 'lose';
    } else {
      winnings = blackjackState.currentBet;
      result = `Push! ${formatNumber(blackjackState.currentBet)} points returned`;
      resultClass = 'push';
    }
    
    state.points += winnings;
    
    blackjackResult.textContent = result;
    blackjackResult.classList.add('show', resultClass);
    
    // Disable game buttons, enable deal
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    dealBtn.disabled = false;
    
    if (winnings > blackjackState.currentBet) {
      playBeep("golden");
    } else if (winnings > 0) {
      playBeep("purchase");
    }
    
    updateUI();
    saveGame();
  }

  dealBtn.addEventListener("click", dealBlackjack);
  hitBtn.addEventListener("click", hitBlackjack);
  standBtn.addEventListener("click", standBlackjack);
  doubleBtn.addEventListener("click", doubleDownBlackjack);

  // Main tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const t = btn.dataset.tab;
      const target = document.getElementById(`tab-${t}`);
      if (target) target.classList.add("active");
    });
  });

  // Shop subtabs
  const shopSubtabButtons = document.querySelectorAll(".shop-subtab-btn");
  const shopSubtabPanels = document.querySelectorAll(".shop-subtab-panel");
  shopSubtabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      shopSubtabButtons.forEach(b => b.classList.remove("active"));
      shopSubtabPanels.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const t = btn.dataset.shop;
      const target = document.getElementById(`shop-${t}`);
      if (target) target.classList.add("active");
    });
  });

  const audioCtx = (typeof AudioContext !== "undefined") ? new AudioContext() : null;
  function playBeep(type = "click") {
    if (!audioCtx || !state.soundEnabled) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type === "purchase" ? "sawtooth" : type === "golden" ? "triangle" : "sine";
    o.frequency.value = type === "purchase" ? 880 : type === "golden" ? 1200 : 440;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    o.stop(now + 0.16);
  }

  function renderAchievements() {
    achGrid.innerHTML = "";
    let unlocked = 0;
    achievements.forEach(a => {
      const card = document.createElement("div");
      card.className = "ach-card";
      if (a.secret && !a.unlocked) card.classList.add("secret");
      if (a.unlocked) {
        card.classList.add("unlocked");
        unlocked++;
      } else {
        card.classList.add("ach-locked");
      }
      const displayName = (a.secret && !a.unlocked) ? "???" : a.name;
      const displayDesc = (a.secret && !a.unlocked) ? "Hidden achievement" : a.desc;
      card.innerHTML = `
        <div>
          <div class="ach-name">${displayName}</div>
          <div class="ach-desc">${displayDesc}</div>
        </div>
        <div class="ach-icon">${a.unlocked ? "✅" : "🔒"}</div>
      `;
      achGrid.appendChild(card);
    });
    achCount.textContent = unlocked;
    achTotal.textContent = achievements.length;
  }

  function markAchievementUnlocked(a) {
    a.unlocked = true;
    applyAchievementReward(a.reward);
    const displayName = a.name;
    pushToast(`🏆 Achievement: ${displayName}`, 3000, "success");
    playBeep("purchase");
  }

  function checkAchievements() {
    let unlockedAny = false;
    achievements.forEach(a => {
      try {
        if (!a.unlocked && typeof a.check === "function" && a.check()) {
          markAchievementUnlocked(a);
          unlockedAny = true;
        }
      } catch (err) {
        console.warn("Achievement check error", err);
      }
    });
    if (unlockedAny) {
      renderAchievements();
      saveGame();
    }
  }

  function applyAchievementReward(reward) {
    if (!reward) return;
    if (reward.type === "points") {
      state.points += (reward.amount || 0);
    } else if (reward.type === "prestigePoints") {
      state.prestigePoints = (state.prestigePoints || 0) + (reward.amount || 0);
    } else if (reward.type === "clickPower") {
      state.clickPower += (reward.amount || 0);
    }
    updateUI();
  }

  function renderShopCategory(category, gridElement) {
    gridElement.innerHTML = "";
    const categoryUpgrades = upgrades.filter(u => u.category === category && isUpgradeUnlocked(u));
    
    categoryUpgrades.forEach(u => {
      const card = document.createElement("div");
      card.className = "upgrade-card";
      
      let effectText = "";
      if (u.type === "idle") effectText = `+${formatNumber(u.effect)}/s`;
      else if (u.type === "click") effectText = `+${formatNumber(u.effect)} power`;
      else if (u.type === "multi") effectText = `x${u.effect}`;
      else if (u.type === "special" || u.type === "special_golden" || u.type === "special_combo") {
        effectText = "";
      }
      
      card.innerHTML = `
        <div class="row">
          <div>
            <div class="upgrade-title">${u.name} ${effectText}</div>
            <div class="upgrade-desc">${u.desc}</div>
          </div>
          <div style="text-align:right">
            <div class="upgrade-cost" id="cost-${u.id}">${formatNumber(u.cost)}</div>
            <div style="height:4px"></div>
            <button class="buy-btn" id="buy-${u.id}">Buy</button>
            <div class="upgrade-desc">Lvl: <span id="lvl-${u.id}">${u.level}</span></div>
          </div>
        </div>
      `;
      gridElement.appendChild(card);
      
      const buyBtn = card.querySelector(`#buy-${u.id}`);
      buyBtn.addEventListener("click", () => tryBuy(u.id));
    });
  }

  function renderShops() {
    renderShopCategory("workers", workersGrid);
    renderShopCategory("clicks", clicksGrid);
    renderShopCategory("multipliers", multipliersGrid);
    updateShopButtons();
  }

  function renderPrestigeShop() {
    prestigeShopGrid.innerHTML = "";
    prestigeUpgrades.forEach(u => {
      const card = document.createElement("div");
      card.className = "upgrade-card prestige-upgrade";
      card.innerHTML = `
        <div class="row">
          <div>
            <div class="upgrade-title">${u.name}</div>
            <div class="upgrade-desc">${u.desc}</div>
          </div>
          <div style="text-align:right">
            <div class="upgrade-cost">${u.cost} PP</div>
            <div style="height:4px"></div>
            <button class="buy-btn" id="buy-pp-${u.id}" ${u.owned ? 'disabled' : ''}>${u.owned ? 'Owned' : 'Buy'}</button>
          </div>
        </div>
      `;
      prestigeShopGrid.appendChild(card);
      if (!u.owned) {
        const buyBtn = card.querySelector(`#buy-pp-${u.id}`);
        buyBtn.addEventListener("click", () => tryBuyPrestige(u.id));
      }
    });
  }

  function updateShopButtons() {
    upgrades.forEach(u => {
      const buyBtn = document.getElementById(`buy-${u.id}`);
      const costEl = document.getElementById(`cost-${u.id}`);
      const lvlEl = document.getElementById(`lvl-${u.id}`);
      if (costEl) costEl.textContent = formatNumber(u.cost);
      if (lvlEl) lvlEl.textContent = u.level;
      if (buyBtn && isUpgradeUnlocked(u)) buyBtn.disabled = state.points < u.cost;
    });
  }

  function tryBuy(id) {
    const up = upgrades.find(x => x.id === id);
    if (!up || !isUpgradeUnlocked(up)) return;
    if (state.points < up.cost) {
      pushToast("Not enough points");
      return;
    }
    state.points -= up.cost;
    up.level += 1;
    state.totalUpgradesBought = (state.totalUpgradesBought || 0) + 1;

    if (up.type === "click") state.clickPower += up.effect;
    else if (up.type === "multi") state.multiplier *= up.effect;
    else if (up.type === "special_golden") {
      state.goldenUnlocked = true;
      goldenChanceDiv.style.display = "block";
      pushToast("✨ Golden clicks unlocked!", 3000, "success");
    }
    else if (up.type === "special_combo") {
      state.comboUnlocked = true;
      pushToast("🔥 Combo system unlocked!", 3000, "success");
    }

    // One-time purchases don't scale
    if (up.costMult !== 999) {
      up.cost = Math.ceil(up.cost * up.costMult);
    }
    
    playBeep("purchase");
    updateUI();
    renderShops(); // Re-render to show newly unlocked upgrades
    checkAchievements();
    saveGame();
  }

  function tryBuyPrestige(id) {
    const up = prestigeUpgrades.find(x => x.id === id);
    if (!up || up.owned) return;
    if (state.prestigePoints < up.cost) {
      pushToast("Not enough Prestige Points");
      return;
    }
    state.prestigePoints -= up.cost;
    up.owned = true;
    pushToast(`Purchased: ${up.name}`, 2000, "success");
    playBeep("purchase");
    renderPrestigeShop();
    updateUI();
    saveGame();
  }

  function onCircleClick(clientX, clientY) {
    // Check autoclicker penalty
    if (Date.now() < state.autoclickerPenalty) {
      return;
    }
    
    // Track click for autoclicker detection
    state.clickHistory.push(Date.now());
    
    if (checkAutoclicker()) {
      applyAutoclickerPenalty();
      return;
    }
    
    const isGolden = state.goldenUnlocked && Math.random() < getGoldenChance();
    const mult = isGolden ? 10 : 1;
    const gained = calcClickPower() * mult;
    
    state.points += gained;
    state.totalClicks = (state.totalClicks || 0) + 1;
    state.totalPointsEarned = (state.totalPointsEarned || 0) + gained;
    
    if (isGolden) {
      state.goldenClicks = (state.goldenClicks || 0) + 1;
      goldenActive = true;
      circle.classList.add("golden");
      setTimeout(() => {
        circle.classList.remove("golden");
        goldenActive = false;
      }, 500);
      playBeep("golden");
      pushToast(`✨ GOLDEN! +${formatNumber(gained)}`, 1500, "golden");
    }

    // Combo only works if unlocked
    if (state.comboUnlocked) {
      comboCount++;
      updateCombo();
      clearTimeout(comboTimer);
      comboTimer = setTimeout(() => {
        comboCount = 0;
        updateCombo();
      }, COMBO_TIMEOUT);
    }

    animatePop(circle);
    if (state.particlesEnabled) {
      spawnParticles(clientX, clientY, Math.min(15, Math.ceil(gained / 10)), isGolden);
    }
    if (!isGolden) playBeep("click");
    updateUI();
    checkAchievements();
  }

  function updateCombo() {
    if (!state.comboUnlocked) {
      comboMeter.classList.remove("active");
      circle.classList.remove("combo-active");
      return;
    }
    
    if (comboCount >= COMBO_THRESHOLD) {
      comboMeter.classList.add("active");
      comboValue.textContent = (comboCount - COMBO_THRESHOLD + 2);
      circle.classList.add("combo-active");
    } else {
      comboMeter.classList.remove("active");
      circle.classList.remove("combo-active");
    }
  }

  function animatePop(el) {
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }

  function spawnParticles(clientX, clientY, count = 6, golden = false) {
    const rect = particleLayer.getBoundingClientRect();
    const layerX = clientX - rect.left;
    const layerY = clientY - rect.top;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      if (golden) p.classList.add("golden");
      else if (comboCount >= COMBO_THRESHOLD * 2) p.classList.add("rainbow");
      p.style.left = `${layerX + (Math.random() * 50 - 25)}px`;
      p.style.top = `${layerY + (Math.random() * 50 - 25)}px`;
      p.style.width = `${8 + Math.random() * 12}px`;
      p.style.height = p.style.width;
      particleLayer.appendChild(p);
      setTimeout(() => { if (p && p.parentNode) p.parentNode.removeChild(p); }, 800);
    }
  }

  setInterval(() => {
    const idle = calcTotalIdle();
    if (idle > 0) {
      state.points += idle;
      state.totalPointsEarned = (state.totalPointsEarned || 0) + idle;
      if (state.particlesEnabled && idle > 10) {
        const cRect = circle.getBoundingClientRect();
        spawnParticles(cRect.left + cRect.width / 2, cRect.top + cRect.height / 2, Math.min(8, Math.ceil(idle / 50)));
      }
      updateUI();
      checkAchievements();
    }
    state.playTime += 1/60;
    if (state.wheelCooldown > 0) {
      state.wheelCooldown = Math.max(0, state.wheelCooldown - 1);
      updateWheelCooldown();
    }
  }, 1000);

  function calculatePrestigePotential() {
    return Math.floor((state.points || 0) / PRESTIGE_BASE);
  }

  function doPrestige() {
    const potential = calculatePrestigePotential();
    if (potential <= 0) {
      pushToast("Need at least 1M points to Ascend");
      return;
    }
    if (!confirm(`Ascend for ${potential} PP? Resets most progress.`)) return;

    state.prestigePoints = (state.prestigePoints || 0) + potential;
    state.totalPrestiges = (state.totalPrestiges || 0) + 1;

    state.points = 0;
    state.clickPower = 1;
    state.multiplier = 1;
    state.totalClicks = 0;
    state.totalPointsEarned = 0;
    state.totalUpgradesBought = 0;
    state.goldenUnlocked = false;
    state.comboUnlocked = false;

    upgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });

    pushToast(`🚀 Ascended! +${potential} PP`, 3000, "success");
    updateUI();
    renderShops();
    checkAchievements();
    saveGame();
  }

  doPrestigeBtn.addEventListener("click", () => doPrestige());

  function showDailyReward() {
    const now = Date.now();
    const lastReward = state.lastDailyReward || 0;
    const hoursSince = (now - lastReward) / (1000 * 60 * 60);
    
    if (hoursSince < 20) {
      const hoursLeft = Math.ceil(20 - hoursSince);
      dailyContent.innerHTML = `
        <div style="text-align:center;padding:20px">
          <div style="font-size:48px;margin-bottom:12px">⏰</div>
          <div>Come back in ${hoursLeft} hours</div>
        </div>
      `;
      dailyModal.classList.add("active");
      return;
    }

    if (hoursSince > 48) state.dailyStreak = 0;

    state.dailyStreak = (state.dailyStreak || 0) + 1;
    state.lastDailyReward = now;

    const reward = 1000 * state.dailyStreak;
    state.points += reward;

    dailyContent.innerHTML = `
      <div class="daily-reward">
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:64px">🎁</div>
          <div class="streak-display">Day ${state.dailyStreak}</div>
          <div style="color:var(--muted);font-size:14px">Login Streak</div>
        </div>
        <div style="text-align:center;font-size:20px;font-weight:700;color:var(--success)">
          +${formatNumber(reward)} Points!
        </div>
      </div>
    `;
    dailyModal.classList.add("active");
    saveGame();
    updateUI();
    checkAchievements();
  }

  dailyBtn.addEventListener("click", showDailyReward);
  dailyClose.addEventListener("click", () => dailyModal.classList.remove("active"));
  autoclickerClose.addEventListener("click", () => autoclickerModal.classList.remove("active"));

  // Credits modal logic (new)
  if (creditsBtn && creditsModal && creditsClose) {
    creditsBtn.addEventListener("click", () => {
      creditsModal.classList.add("active");
    });
    creditsClose.addEventListener("click", () => {
      creditsModal.classList.remove("active");
    });
  }

  // Allow ESC to close modals (keeps behavior consistent for all modals)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dailyModal.classList.remove("active");
      importModal.classList.remove("active");
      autoclickerModal.classList.remove("active");
      if (creditsModal) creditsModal.classList.remove("active");
    }
  });

  function spinWheelGame() {
    if (state.points < 10000) {
      pushToast("Need 10,000 points to spin");
      return;
    }
    if (state.wheelCooldown > 0) {
      pushToast("Wheel on cooldown");
      return;
    }

    state.points -= 10000;
    state.wheelCooldown = 60;
    
    const prizes = [
      { name: "5K", value: 5000 },
      { name: "10K", value: 10000 },
      { name: "25K", value: 25000 },
      { name: "50K", value: 50000 },
      { name: "100K", value: 100000 },
      { name: "1PP", value: -1 },
    ];
    
    const spins = 5 + Math.floor(Math.random() * 3);
    const rotation = spins * 360 + Math.floor(Math.random() * 360);
    wheel.style.transform = `rotate(${rotation}deg)`;
    
    spinWheel.disabled = true;
    
    setTimeout(() => {
      const finalAngle = rotation % 360;
      const segment = Math.floor(finalAngle / 60);
      const prize = prizes[segment];
      
      if (prize.value === -1) {
        state.prestigePoints += 1;
        pushToast(`🎡 Won 1 Prestige Point!`, 3000, "golden");
      } else {
        state.points += prize.value;
        pushToast(`🎡 Won ${formatNumber(prize.value)} points!`, 3000, "success");
      }
      
      spinWheel.disabled = false;
      updateUI();
      saveGame();
    }, 3000);
    
    playBeep("purchase");
  }

  function guessNumber() {
    if (state.points < 5000) {
      pushToast("Need 5,000 points to play");
      return;
    }
    
    const guess = parseInt(guessInput.value);
    if (isNaN(guess) || guess < 1 || guess > 10) {
      pushToast("Enter a number 1-10");
      return;
    }
    
    state.points -= 5000;
    const target = Math.floor(Math.random() * 10) + 1;
    
    if (guess === target) {
      state.points += 50000;
      pushToast(`🎯 Correct! Number was ${target}. +50K!`, 3000, "golden");
    } else {
      pushToast(`❌ Wrong! Number was ${target}`, 2000);
    }
    
    guessInput.value = "";
    updateUI();
    saveGame();
  }

  spinWheel.addEventListener("click", spinWheelGame);
  guessBtn.addEventListener("click", guessNumber);

  function updateWheelCooldown() {
    if (state.wheelCooldown > 0) {
      wheelCooldown.textContent = `Cooldown: ${state.wheelCooldown}s`;
      spinWheel.disabled = true;
    } else {
      wheelCooldown.textContent = "";
      spinWheel.disabled = false;
    }
  }

  function exportSave() {
    const data = btoa(JSON.stringify({
      state,
      upgrades: upgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
      prestigeUpgrades: prestigeUpgrades.map(u => ({ id: u.id, owned: u.owned })),
      achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
    }));
    
    navigator.clipboard.writeText(data).then(() => {
      pushToast("Save copied to clipboard!", 2000, "success");
    }).catch(() => {
      prompt("Copy this save data:", data);
    });
  }

  function importSave() {
    importModal.classList.add("active");
  }

  function confirmImport() {
    try {
      const data = JSON.parse(atob(importText.value.trim()));
      if (data.state) state = Object.assign(state, data.state);
      if (data.upgrades) {
        data.upgrades.forEach(su => {
          const u = upgrades.find(x => x.id === su.id);
          if (u) { u.level = su.level; u.cost = su.cost; }
        });
      }
      if (data.prestigeUpgrades) {
        data.prestigeUpgrades.forEach(pu => {
          const u = prestigeUpgrades.find(x => x.id === pu.id);
          if (u) u.owned = pu.owned;
        });
      }
      if (data.achievements) {
        data.achievements.forEach(a => {
          const ac = achievements.find(x => x.id === a.id);
          if (ac) ac.unlocked = a.unlocked;
        });
      }
      importModal.classList.remove("active");
      importText.value = "";
      updateUI();
      renderShops();
      renderPrestigeShop();
      renderAchievements();
      saveGame();
      pushToast("Save imported!", 2000, "success");
    } catch (e) {
      pushToast("Invalid save data", 2000);
    }
  }

  exportBtn.addEventListener("click", exportSave);
  importBtn.addEventListener("click", importSave);
  importClose.addEventListener("click", () => importModal.classList.remove("active"));
  importConfirm.addEventListener("click", confirmImport);

  soundToggle.addEventListener("change", () => {
    state.soundEnabled = soundToggle.checked;
    saveGame();
  });

  particlesToggle.addEventListener("change", () => {
    state.particlesEnabled = particlesToggle.checked;
    saveGame();
  });

  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const theme = btn.dataset.theme;
      document.body.className = `theme-${theme}`;
      state.theme = theme;
      saveGame();
    });
  });

  function pushToast(text, ttl = 2200, type = "") {
    if (!toastLayer) return;
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = text;
    toastLayer.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 420);
    }, ttl);
  }

  function saveGame() {
    const payload = {
      state,
      upgrades: upgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
      prestigeUpgrades: prestigeUpgrades.map(u => ({ id: u.id, owned: u.owned })),
      achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      if (saveBtn) {
        saveBtn.textContent = "💾 Saved";
        setTimeout(() => (saveBtn.textContent = "💾 Save"), 1200);
      }
    } catch (e) {
      console.warn("Save failed", e);
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const payload = JSON.parse(raw);
      
      if (payload.state) {
        const timeDiff = Date.now() - (payload.timestamp || Date.now());
        const offlineMinutes = Math.floor(timeDiff / 60000);
        
        if (offlineMinutes > 5) {
          let offlineMult = 1;
          const ppOffline = prestigeUpgrades.find(p => p.id === "pp_offline");
          if (ppOffline && ppOffline.owned) offlineMult = ppOffline.effect;
          
          const idleRate = calcTotalIdle();
          const offlineGain = idleRate * offlineMinutes * 60 * 0.5 * offlineMult;
          
          if (offlineGain > 0) {
            payload.state.points = (payload.state.points || 0) + offlineGain;
            pushToast(`Offline for ${formatTime(offlineMinutes)}: +${formatNumber(offlineGain)} points`, 4000, "success");
          }
        }
        
        state = Object.assign(state, payload.state);
      }
      if (payload.upgrades) {
        payload.upgrades.forEach(su => {
          const u = upgrades.find(x => x.id === su.id);
          if (u) { u.level = su.level ?? u.level; u.cost = su.cost ?? u.cost; }
        });
      }
      if (payload.prestigeUpgrades) {
        payload.prestigeUpgrades.forEach(pu => {
          const u = prestigeUpgrades.find(x => x.id === pu.id);
          if (u) u.owned = pu.owned;
        });
      }
      if (payload.achievements) {
        payload.achievements.forEach(a => {
          const ac = achievements.find(x => x.id === a.id);
          if (ac) ac.unlocked = !!a.unlocked;
        });
      }
      
      document.body.className = `theme-${state.theme || 'dark'}`;
      soundToggle.checked = state.soundEnabled !== false;
      particlesToggle.checked = state.particlesEnabled !== false;
      document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.theme === (state.theme || 'dark'));
      });
      
      // Show golden chance if unlocked
      if (state.goldenUnlocked) {
        goldenChanceDiv.style.display = "block";
      }
      
      updateUI();
      renderAchievements();
      return true;
    } catch (e) {
      console.warn("Load failed", e);
      return false;
    }
  }

  function resetGame() {
    if (!confirm("Reset ALL progress including prestige?")) return;
    state = { 
      points: 0, clickPower: 1, multiplier: 1, version: 5, 
      totalClicks: 0, totalPointsEarned: 0, totalUpgradesBought: 0, 
      prestigePoints: 0, goldenClicks: 0, totalPrestiges: 0,
      lastSaveTime: Date.now(), playTime: 0, theme: 'dark',
      soundEnabled: true, particlesEnabled: true,
      lastDailyReward: 0, dailyStreak: 0, wheelCooldown: 0,
      goldenUnlocked: false, comboUnlocked: false,
      clickHistory: [], autoclickerPenalty: 0
    };
    upgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });
    prestigeUpgrades.forEach(u => u.owned = false);
    achievements.forEach(a => a.unlocked = false);
    localStorage.removeItem(SAVE_KEY);
    goldenChanceDiv.style.display = "none";
    updateUI();
    renderShops();
    renderPrestigeShop();
    renderAchievements();
    pushToast("Progress reset");
  }

  function updateUI() {
    if (pointsDisplay) pointsDisplay.textContent = formatNumber(Math.floor(state.points || 0));
    if (clickDisplay) clickDisplay.textContent = formatNumber(calcClickPower());
    const totalIdleValue = calcTotalIdle();
    if (idleDisplay) idleDisplay.textContent = formatNumber(totalIdleValue);
    
    let displayMult = state.multiplier;
    const ppMulti = prestigeUpgrades.find(p => p.id === "pp_multi");
    if (ppMulti && ppMulti.owned) displayMult *= ppMulti.effect;
    displayMult *= (1 + (state.prestigePoints || 0) * PRESTIGE_MULT_PER_POINT);
    
    if (multDisplay) multDisplay.textContent = displayMult.toFixed(2);
    if (totalIdleEl) totalIdleEl.textContent = formatNumber(totalIdleValue);
    if (prestigePointsEl) prestigePointsEl.textContent = state.prestigePoints || 0;
    if (ppBalance) ppBalance.textContent = state.prestigePoints || 0;
    if (prestigeCurrent) prestigeCurrent.textContent = formatNumber(state.points || 0);
    if (prestigePotentialEl) prestigePotentialEl.textContent = calculatePrestigePotential();
    
    if (state.goldenUnlocked) {
      if (goldenPct) goldenPct.textContent = (getGoldenChance() * 100).toFixed(1);
    }
    
    document.getElementById("stat-clicks").textContent = formatNumber(state.totalClicks || 0);
    document.getElementById("stat-earned").textContent = formatNumber(state.totalPointsEarned || 0);
    document.getElementById("stat-upgrades").textContent = state.totalUpgradesBought || 0;
    document.getElementById("stat-golden").textContent = state.goldenClicks || 0;
    document.getElementById("stat-playtime").textContent = formatTime(state.playTime || 0);
    document.getElementById("stat-prestiges").textContent = state.totalPrestiges || 0;
    
    // Calculate clicks per minute
    const cpm = state.playTime > 0 ? Math.floor((state.totalClicks || 0) / (state.playTime / 60)) : 0;
    document.getElementById("stat-cpm").textContent = formatNumber(cpm);
    
    // Calculate average click speed (clicks per second)
    const clickSpeed = state.playTime > 0 ? ((state.totalClicks || 0) / (state.playTime * 60)).toFixed(2) : "0";
    document.getElementById("stat-clickspeed").textContent = clickSpeed;
    
    updateShopButtons();
    if (circle) circle.textContent = "";
  }

  circle.addEventListener("click", (e) => onCircleClick(e.clientX, e.clientY));
  circle.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const rect = circle.getBoundingClientRect();
      onCircleClick(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  });

  saveBtn.addEventListener("click", saveGame);
  resetBtn.addEventListener("click", resetGame);
  autosaveToggle.addEventListener("change", () => startAutosave());

  let autosaveTimer = null;
  function startAutosave() {
    if (autosaveTimer) clearInterval(autosaveTimer);
    autosaveTimer = setInterval(() => {
      if (autosaveToggle.checked) saveGame();
    }, AUTOSAVE_INTERVAL_MS);
  }

  window.addEventListener("beforeunload", () => {
    if (autosaveToggle.checked) saveGame();
  });

  renderShops();
  renderPrestigeShop();
  renderAchievements();
  loadGame();
  updateUI();
  startAutosave();
  
  setTimeout(() => {
    const lastDaily = state.lastDailyReward || 0;
    const hoursSince = (Date.now() - lastDaily) / (1000 * 60 * 60);
    if (hoursSince >= 20) {
      pushToast("🎁 Daily reward available!", 3000, "success");
    }
  }, 2000);
});
