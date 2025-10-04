// Enhanced clicker.js - WITH COSMETICS & IMPROVED PROGRESSION
const SAVE_KEY = "clickerSave_v7";
const AUTOSAVE_INTERVAL_MS = 60000;
const PRESTIGE_BASE = 1e6;
const PRESTIGE_MULT_PER_POINT = 0.05;
const ASCENSION_BASE_REQUIREMENT = 100000;
const COMBO_TIMEOUT = 2000;
const COMBO_THRESHOLD = 5;

let state = {
  points: 0,
  clickPower: 1,
  multiplier: 1,
  version: 7,
  totalClicks: 0,
  totalPointsEarned: 0,
  totalUpgradesBought: 0,
  prestigePoints: 0,
  goldenClicks: 0,
  totalPrestiges: 0,
  totalAscensions: 0,
  ascensionLevel: 0,
  lastSaveTime: Date.now(),
  playTime: 0,
  theme: 'dark',
  soundEnabled: true,
  particlesEnabled: true,
  lastDailyReward: 0,
  dailyStreak: 0,
  goldenUnlocked: false,
  comboUnlocked: false,
  currentCosmetic: 'default',
  ownedCosmetics: ['default'],
};

const COSMETICS = [
  { id: 'default', name: 'Classic Cyan', className: '', cost: 0, costType: 'free', desc: 'The original circle' },
  { id: 'crimson', name: 'Crimson Blaze', className: 'circle-crimson', cost: 5, costType: 'ascension', desc: 'A fiery red circle' },
  { id: 'emerald', name: 'Emerald Dream', className: 'circle-emerald', cost: 5, costType: 'ascension', desc: 'A verdant green circle' },
  { id: 'violet', name: 'Violet Storm', className: 'circle-violet', cost: 5, costType: 'ascension', desc: 'A mystical purple circle' },
  { id: 'amber', name: 'Amber Glow', className: 'circle-amber', cost: 5, costType: 'ascension', desc: 'A golden amber circle' },
  { id: 'secret', name: '???', className: 'circle-secret', cost: 0, costType: 'secret', desc: 'How did you find this?', secret: true },
];

const UPGRADES = [
  { id: "idle1", name: "Idle Worker", desc: "+0.5 points/sec", baseCost: 100, costMult: 1.8, type: "idle", effect: 0.5, category: "workers", unlockAfter: null },
  { id: "auto1", name: "Auto-clicker", desc: "+1 points/sec", baseCost: 800, costMult: 2.0, type: "idle", effect: 1, category: "workers", unlockAfter: 5 },
  { id: "idle2", name: "Idle Factory", desc: "+3 points/sec", baseCost: 5000, costMult: 1.9, type: "idle", effect: 3, category: "workers", unlockAfter: 8 },
  { id: "idle3", name: "Mega Generator", desc: "+10 points/sec", baseCost: 25000, costMult: 1.8, type: "idle", effect: 10, category: "workers", unlockAfter: 12 },
  { id: "click1", name: "Better Cursor", desc: "+1 click power", baseCost: 50, costMult: 1.9, type: "click", effect: 1, category: "clicks", unlockAfter: null },
  { id: "click2", name: "Super Cursor", desc: "+3 click power", baseCost: 3000, costMult: 2.0, type: "click", effect: 3, category: "clicks", unlockAfter: 8 },
  { id: "combo1", name: "Combo Master", desc: "Unlock combo system (click fast for bonus)", baseCost: 150000, costMult: 999, type: "special_combo", effect: 1, category: "clicks", unlockAfter: 15, oneTime: true },
  { id: "golden1", name: "Golden Touch", desc: "Unlock golden clicks (5% chance for 10x)", baseCost: 100000, costMult: 999, type: "special_golden", effect: 0.05, category: "clicks", unlockAfter: 15, oneTime: true },
  { id: "golden2", name: "Golden Boost", desc: "+5% golden click chance", baseCost: 500000, costMult: 3.5, type: "special", effect: 0.05, category: "clicks", unlockAfter: 18 },
  { id: "multi1", name: "Multiplier", desc: "x1.15 global multiplier", baseCost: 500, costMult: 2.5, type: "multi", effect: 1.15, category: "multipliers", unlockAfter: 5 },
  { id: "multi2", name: "Big Multiplier", desc: "x1.3 global multiplier", baseCost: 50000, costMult: 2.8, type: "multi", effect: 1.3, category: "multipliers", unlockAfter: 12 },
];

const PRESTIGE_UPGRADES = [
  { id: "pp_click", name: "Eternal Click", desc: "Start with +10 click power per level", baseCost: 1, costMult: 5.0, type: "start_click", effect: 10, oneTime: false },
  { id: "pp_idle", name: "Eternal Idle", desc: "Start with +10 idle/sec per level", baseCost: 1, costMult: 5.0, type: "start_idle", effect: 10, oneTime: false },
  { id: "pp_multi", name: "Eternal Multi", desc: "Permanent x1.5 multiplier per level", baseCost: 2, costMult: 8.0, type: "permanent_multi", effect: 1.5, oneTime: false },
  { id: "pp_golden_unlock", name: "Golden Touch", desc: "Unlock golden clicks permanently", baseCost: 5, costMult: 999, type: "golden_unlock", effect: 1, oneTime: true },
  { id: "pp_combo_unlock", name: "Combo Master", desc: "Unlock combo system permanently", baseCost: 5, costMult: 999, type: "combo_unlock", effect: 1, oneTime: true },
  { id: "pp_golden", name: "Golden Blessing", desc: "+10% golden click chance", baseCost: 10, costMult: 999, type: "golden_boost", effect: 0.1, oneTime: true },
  { id: "pp_offline", name: "Offline Bonus", desc: "2x offline progress", baseCost: 20, costMult: 999, type: "offline_boost", effect: 2, oneTime: true },
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
  { id: "idle50", name: "Idle Starter", desc: "50 idle/sec", check: () => calcTotalIdle() >= 50, reward: { type: "points", amount: 5000 } },
  { id: "idle500", name: "Idle King", desc: "500 idle/sec", check: () => calcTotalIdle() >= 500, reward: { type: "prestigePoints", amount: 2 } },
  { id: "idle5k", name: "Idle God", desc: "5,000 idle/sec", check: () => calcTotalIdle() >= 5000, reward: { type: "prestigePoints", amount: 5 } },
  { id: "golden10", name: "Golden Touch", desc: "Get 10 golden clicks", check: () => state.goldenClicks >= 10, reward: { type: "points", amount: 10000 } },
  { id: "golden100", name: "Golden Master", desc: "Get 100 golden clicks", check: () => state.goldenClicks >= 100, reward: { type: "prestigePoints", amount: 3 } },
  { id: "prestige1", name: "Ascended", desc: "Prestige once", check: () => state.totalPrestiges >= 1, reward: { type: "points", amount: 50000 } },
  { id: "prestige5", name: "Veteran", desc: "Prestige 5 times", check: () => state.totalPrestiges >= 5, reward: { type: "prestigePoints", amount: 5 } },
  { id: "daily7", name: "Dedicated", desc: "7 day streak", check: () => state.dailyStreak >= 7, reward: { type: "prestigePoints", amount: 2 }, secret: false },
  { id: "secret1", name: "???", desc: "Hidden achievement", unlockName: "Speed Demon", unlockDesc: "Click 10,000 times total", check: () => state.totalClicks >= 10000, reward: { type: "prestigePoints", amount: 10 }, secret: true },
  { id: "secret2", name: "???", desc: "Hidden achievement", unlockName: "Trillionaire", unlockDesc: "Reach 1 trillion points", check: () => state.points >= 1e12, reward: { type: "prestigePoints", amount: 15 }, secret: true },
];

let upgrades = UPGRADES.map(u => ({ ...u, level: 0, cost: u.baseCost }));
let prestigeUpgrades = PRESTIGE_UPGRADES.map(u => ({ ...u, level: 0, cost: u.baseCost }));
let achievements = ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));

let comboCount = 0;
let comboTimer = null;
let goldenActive = false;
let activeBugs = [];
let bugSpawnTimer = null;

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
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc","Ud","Dd","Td","Qad","Qid","Sxd","Spd","Ocd","Nod","Vg","Uvg"];
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

function getAscensionMultiplier() {
  const level = state.ascensionLevel || 0;
  return 1 + (level * 0.5);
}

function getAscensionCost() {
  const level = state.ascensionLevel || 0;
  return Math.floor(ASCENSION_BASE_REQUIREMENT * Math.pow(1.5, level));
}

function calcTotalIdleRaw(s = state) {
  let total = 0;
  upgrades.forEach(u => { if (u.type === "idle") total += (u.effect * u.level); });
  const ppBonus = prestigeUpgrades.find(p => p.id === "pp_idle");
  if (ppBonus && ppBonus.level > 0) total += ppBonus.effect * ppBonus.level;
  return total;
}

function calcTotalIdle() {
  const raw = calcTotalIdleRaw();
  let mult = state.multiplier;
  const ppMulti = prestigeUpgrades.find(p => p.id === "pp_multi");
  if (ppMulti && ppMulti.level > 0) {
    mult *= Math.pow(ppMulti.effect, ppMulti.level);
  }
  const prestigeMult = (1 + (state.prestigePoints || 0) * PRESTIGE_MULT_PER_POINT);
  const ascensionMult = getAscensionMultiplier();
  return raw * mult * prestigeMult * ascensionMult;
}

function calcClickPower() {
  let base = state.clickPower;
  const ppBonus = prestigeUpgrades.find(p => p.id === "pp_click");
  if (ppBonus && ppBonus.level > 0) base += ppBonus.effect * ppBonus.level;
  
  let mult = state.multiplier;
  const ppMulti = prestigeUpgrades.find(p => p.id === "pp_multi");
  if (ppMulti && ppMulti.level > 0) {
    mult *= Math.pow(ppMulti.effect, ppMulti.level);
  }
  
  const prestigeMult = (1 + (state.prestigePoints || 0) * PRESTIGE_MULT_PER_POINT);
  const comboMult = (state.comboUnlocked && comboCount >= COMBO_THRESHOLD) ? (1 + (comboCount - COMBO_THRESHOLD + 1) * 0.5) : 1;
  const ascensionMult = getAscensionMultiplier();
  
  return base * mult * prestigeMult * comboMult * ascensionMult;
}

function getGoldenChance() {
  if (!state.goldenUnlocked) return 0;
  
  let chance = 0.05;
  upgrades.forEach(u => { 
    if (u.type === "special" && u.id === "golden2") {
      chance += u.effect * u.level; 
    }
  });
  const ppGolden = prestigeUpgrades.find(p => p.id === "pp_golden");
  if (ppGolden && ppGolden.level > 0) chance += ppGolden.effect;
  return Math.min(chance, 0.5);
}

function isUpgradeUnlocked(upgrade) {
  if (upgrade.unlockAfter === null) return true;
  return state.totalUpgradesBought >= upgrade.unlockAfter;
}

function pushToast(text, ttl = 2200, type = "") {
  const toastLayer = document.getElementById("toast-layer");
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
  const cosmeticsGrid = document.getElementById("cosmetics-grid");
  const totalIdleEl = document.getElementById("total-idle");
  const saveBtn = document.getElementById("save-btn");
  const resetBtn = document.getElementById("reset-btn");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const autosaveToggle = document.getElementById("autosave-toggle");
  const particleLayer = document.getElementById("particle-layer");
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
  const prestigeBoostEl = document.getElementById("prestige-boost");

  const ascensionLevelEl = document.getElementById("ascension-level");
  const ascensionLevelDisplay = document.getElementById("ascension-level-display");
  const ascensionPPDisplay = document.getElementById("ascension-pp-display");
  const ascensionCostEl = document.getElementById("ascension-cost");
  const doAscensionBtn = document.getElementById("do-ascension");
  const ascensionPanel = document.getElementById("ascension-panel");
  const ascensionBoostEl = document.getElementById("ascension-boost");

  const dailyBtn = document.getElementById("daily-btn");
  const dailyModal = document.getElementById("daily-modal");
  const dailyClose = document.getElementById("daily-close");
  const dailyContent = document.getElementById("daily-content");

  const importModal = document.getElementById("import-modal");
  const importClose = document.getElementById("import-close");
  const importText = document.getElementById("import-text");
  const importConfirm = document.getElementById("import-confirm");

  const creditsBtn = document.getElementById("credits-btn");
  const creditsModal = document.getElementById("credits-modal");
  const creditsClose = document.getElementById("credits-close");
  const secretCosmeticBtn = document.getElementById("secret-cosmetic-btn");

  const guessBtn = document.getElementById("guess-btn");
  const guessInput = document.getElementById("guess-input");

  const blackjackFullscreen = document.getElementById("blackjack-fullscreen");
  const openBlackjackBtn = document.getElementById("open-blackjack");
  const closeBlackjackBtn = document.getElementById("close-blackjack");
  const blackjackBalance = document.getElementById("blackjack-balance");
  const blackjackCurrentBet = document.getElementById("blackjack-current-bet");
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

  let blackjackState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    currentBet: 0,
    gameActive: false,
    dealerRevealed: false
  };

  secretCosmeticBtn.addEventListener("click", () => {
    if (!state.ownedCosmetics.includes('secret')) {
      state.ownedCosmetics.push('secret');
      pushToast("🎨 Secret cosmetic unlocked!", 3000, "golden");
      renderCosmetics();
      saveGame();
    }
  });

  openBlackjackBtn.addEventListener("click", () => {
    blackjackFullscreen.classList.add("active");
    updateBlackjackUI();
  });

  closeBlackjackBtn.addEventListener("click", () => {
    blackjackFullscreen.classList.remove("active");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      blackjackFullscreen.classList.remove("active");
      dailyModal.classList.remove("active");
      importModal.classList.remove("active");
      if (creditsModal) creditsModal.classList.remove("active");
    }
  });

  function updateBlackjackUI() {
    if (blackjackBalance) blackjackBalance.textContent = formatNumber(Math.floor(state.points));
    if (blackjackCurrentBet) blackjackCurrentBet.textContent = formatNumber(blackjackState.currentBet);
  }

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
    playerCards.innerHTML = '';
    dealerCards.innerHTML = '';
    
    blackjackState.playerHand.forEach(card => {
      playerCards.appendChild(renderCard(card));
    });
    
    blackjackState.dealerHand.forEach((card, index) => {
      const faceDown = index === 0 && blackjackState.gameActive && !blackjackState.dealerRevealed;
      dealerCards.appendChild(renderCard(card, faceDown));
    });
    
    const playerVal = calculateHandValue(blackjackState.playerHand);
    playerValue.textContent = `(${playerVal})`;
    
    if (blackjackState.dealerRevealed || !blackjackState.gameActive) {
      const dealerVal = calculateHandValue(blackjackState.dealerHand);
      dealerValue.textContent = `(${dealerVal})`;
    } else {
      dealerValue.textContent = '';
    }
    
    updateBlackjackUI();
  }

  function dealBlackjack() {
    const bet = parseInt(betInput.value);
    
    if (isNaN(bet) || bet < 100 || bet > 1000000000) {
      pushToast("Bet must be between 100 and 1,000,000,000");
      return;
    }
    
    if (state.points < bet) {
      pushToast("Not enough points!");
      return;
    }
    
    state.points -= bet;
    blackjackState.currentBet = bet;
    
    blackjackState.deck = createDeck();
    blackjackState.playerHand = [blackjackState.deck.pop(), blackjackState.deck.pop()];
    blackjackState.dealerHand = [blackjackState.deck.pop(), blackjackState.deck.pop()];
    blackjackState.gameActive = true;
    blackjackState.dealerRevealed = false;
    
    updateBlackjackDisplay();
    blackjackResult.classList.remove('show', 'win', 'lose', 'push');
    
    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = state.points < bet ? true : false;
    dealBtn.disabled = true;
    
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

  function renderCosmetics() {
    cosmeticsGrid.innerHTML = "";
    
    // Regular cosmetics first
    COSMETICS.filter(c => !c.secret).forEach(cosmetic => {
      const card = document.createElement("div");
      card.className = "upgrade-card cosmetic-upgrade";
      
      const owned = state.ownedCosmetics.includes(cosmetic.id);
      const equipped = state.currentCosmetic === cosmetic.id;
      
      if (owned) {
        card.classList.add("cosmetic-card-owned");
      }
      
      const previewStyle = cosmetic.className ? `class="${cosmetic.className}"` : '';
      
      card.innerHTML = `
        <div class="row">
          <div style="flex:1">
            <div class="cosmetic-preview" ${previewStyle}></div>
            <div class="upgrade-title" style="text-align:center">${cosmetic.name}</div>
            <div class="upgrade-desc" style="text-align:center">${cosmetic.desc}</div>
          </div>
        </div>
        <div style="text-align:center;margin-top:8px">
          ${!owned && cosmetic.costType === 'ascension' ? `<div class="upgrade-cost" style="margin-bottom:8px">${cosmetic.cost} Ascension Levels</div>` : ''}
          <button class="buy-btn" id="cosmetic-${cosmetic.id}" ${owned ? (equipped ? 'disabled' : '') : (cosmetic.costType === 'free' ? 'disabled' : '')} style="width:100%">
            ${equipped ? 'Equipped' : (owned ? 'Equip' : (cosmetic.costType === 'free' ? 'Default' : 'Buy'))}
          </button>
        </div>
      `;
      
      cosmeticsGrid.appendChild(card);
      
      const btn = card.querySelector(`#cosmetic-${cosmetic.id}`);
      if (btn && !btn.disabled) {
        btn.addEventListener("click", () => {
          if (owned) {
            equipCosmetic(cosmetic.id);
          } else {
            buyCosmetic(cosmetic.id);
          }
        });
      }
    });
    
    // Secret cosmetic at the end
    const secretCosmetic = COSMETICS.find(c => c.secret);
    if (secretCosmetic) {
      const owned = state.ownedCosmetics.includes(secretCosmetic.id);
      const equipped = state.currentCosmetic === secretCosmetic.id;
      
      const card = document.createElement("div");
      card.className = "upgrade-card cosmetic-upgrade";
      
      if (!owned) {
        card.classList.add("cosmetic-card-secret");
      } else {
        card.classList.add("cosmetic-card-owned", "unlocked");
      }
      
      const previewStyle = owned ? `class="${secretCosmetic.className}"` : '';
      
      card.innerHTML = `
        <div class="row">
          <div style="flex:1">
            <div class="cosmetic-preview" ${previewStyle}></div>
            <div class="upgrade-title" style="text-align:center">${owned ? secretCosmetic.name : '???'}</div>
            <div class="upgrade-desc" style="text-align:center">${owned ? secretCosmetic.desc : 'Secret cosmetic'}</div>
          </div>
        </div>
        <div style="text-align:center;margin-top:8px">
          <button class="buy-btn" id="cosmetic-${secretCosmetic.id}" ${owned ? (equipped ? 'disabled' : '') : 'disabled'} style="width:100%">
            ${equipped ? 'Equipped' : (owned ? 'Equip' : '???')}
          </button>
        </div>
      `;
      
      cosmeticsGrid.appendChild(card);
      
      if (owned) {
        const btn = card.querySelector(`#cosmetic-${secretCosmetic.id}`);
        if (btn && !btn.disabled) {
          btn.addEventListener("click", () => equipCosmetic(secretCosmetic.id));
        }
      }
    }
  }

  function buyCosmetic(id) {
    const cosmetic = COSMETICS.find(c => c.id === id);
    if (!cosmetic) return;
    
    if (cosmetic.costType === 'ascension') {
      if (state.ascensionLevel < cosmetic.cost) {
        pushToast(`Need ${cosmetic.cost} ascension levels`);
        return;
      }
      
      if (!confirm(`Buy ${cosmetic.name} for ${cosmetic.cost} ascension levels? This will reduce your ascension level and its bonuses.`)) return;
      
      state.ascensionLevel -= cosmetic.cost;
      state.ownedCosmetics.push(id);
      pushToast(`🎨 ${cosmetic.name} purchased!`, 3000, "success");
      
      renderCosmetics();
      updateUI();
      saveGame();
    }
  }

  function equipCosmetic(id) {
    state.currentCosmetic = id;
    const cosmetic = COSMETICS.find(c => c.id === id);
    
    circle.className = '';
    if (cosmetic && cosmetic.className) {
      circle.classList.add(cosmetic.className);
    }
    
    pushToast(`🎨 Equipped ${cosmetic.name}`, 2000, "success");
    renderCosmetics();
    saveGame();
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
      const displayName = (a.secret && !a.unlocked) ? a.name : (a.unlocked && a.secret && a.unlockName) ? a.unlockName : a.name;
      const displayDesc = (a.secret && !a.unlocked) ? a.desc : (a.unlocked && a.secret && a.unlockDesc) ? a.unlockDesc : a.desc;
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
    const displayName = a.secret && a.unlockName ? a.unlockName : a.name;
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
      if (u.oneTime && u.level >= 1) return;
      
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
            ${!u.oneTime ? `<div class="upgrade-desc">Lvl: <span id="lvl-${u.id}">${u.level}</span></div>` : ''}
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
      if (u.oneTime && u.level >= 1) return;
      
      const card = document.createElement("div");
      card.className = "upgrade-card prestige-upgrade";
      
      const isOneTime = u.oneTime;
      const isOwned = u.level >= 1 && isOneTime;
      
      card.innerHTML = `
        <div class="row">
          <div>
            <div class="upgrade-title">${u.name}</div>
            <div class="upgrade-desc">${u.desc}</div>
          </div>
          <div style="text-align:right">
            <div class="upgrade-cost">${formatNumber(u.cost)} PP</div>
            <div style="height:4px"></div>
            <button class="buy-btn" id="buy-pp-${u.id}" ${isOwned ? 'disabled' : ''}>${isOwned ? 'Owned' : 'Buy'}</button>
            ${!isOneTime ? `<div class="upgrade-desc">Lvl: <span id="lvl-pp-${u.id}">${u.level}</span></div>` : ''}
          </div>
        </div>
      `;
      prestigeShopGrid.appendChild(card);
      if (!isOwned) {
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
    
    prestigeUpgrades.forEach(u => {
      const buyBtn = document.getElementById(`buy-pp-${u.id}`);
      const lvlEl = document.getElementById(`lvl-pp-${u.id}`);
      if (lvlEl) lvlEl.textContent = u.level;
      if (buyBtn && !(u.oneTime && u.level >= 1)) {
        buyBtn.disabled = state.prestigePoints < u.cost;
      }
    });
  }

  function tryBuy(id) {
    const up = upgrades.find(x => x.id === id);
    if (!up || !isUpgradeUnlocked(up)) return;
    if (up.oneTime && up.level >= 1) return;
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

    if (up.costMult !== 999) {
      up.cost = Math.ceil(up.cost * up.costMult);
    }
    
    playBeep("purchase");
    updateUI();
    renderShops();
    checkAchievements();
    saveGame();
  }

  function tryBuyPrestige(id) {
    const up = prestigeUpgrades.find(x => x.id === id);
    if (!up) return;
    if (up.oneTime && up.level >= 1) return;
    if (state.prestigePoints < up.cost) {
      pushToast("Not enough Prestige Points");
      return;
    }
    state.prestigePoints -= up.cost;
    up.level += 1;
    
    if (up.type === "golden_unlock") {
      state.goldenUnlocked = true;
      goldenChanceDiv.style.display = "block";
      pushToast("✨ Golden clicks unlocked permanently!", 3000, "success");
    } else if (up.type === "combo_unlock") {
      state.comboUnlocked = true;
      pushToast("🔥 Combo system unlocked permanently!", 3000, "success");
    }
    
    pushToast(`Purchased: ${up.name}`, 2000, "success");
    playBeep("purchase");
    
    if (!up.oneTime && up.costMult !== 999) {
      up.cost = Math.ceil(up.cost * up.costMult);
    }
    
    renderPrestigeShop();
    updateUI();
    saveGame();
  }

  function onCircleClick(clientX, clientY) {
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
  }, 1000);

  function calculatePrestigePotential() {
    return Math.floor((state.points || 0) / PRESTIGE_BASE);
  }

  function doPrestige() {
    const potential = calculatePrestigePotential();
    if (potential <= 0) {
      pushToast("Need at least 1M points to Prestige");
      return;
    }
    if (!confirm(`Prestige for ${potential} PP? Resets most progress but keeps prestige upgrades.`)) return;

    state.prestigePoints = (state.prestigePoints || 0) + potential;
    state.totalPrestiges = (state.totalPrestiges || 0) + 1;

    state.points = 0;
    state.clickPower = 1;
    state.multiplier = 1;

    const ppGoldenUnlock = prestigeUpgrades.find(p => p.id === "pp_golden_unlock");
    const ppComboUnlock = prestigeUpgrades.find(p => p.id === "pp_combo_unlock");
    
    if (!ppGoldenUnlock || ppGoldenUnlock.level === 0) {
      state.goldenUnlocked = false;
    }
    if (!ppComboUnlock || ppComboUnlock.level === 0) {
      state.comboUnlocked = false;
    }

    upgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });

    pushToast(`🚀 Prestiged! +${potential} PP`, 3000, "success");
    updateUI();
    renderShops();
    checkAchievements();
    saveGame();
  }

  doPrestigeBtn.addEventListener("click", () => doPrestige());

  function updateAscensionUI() {
    if (ascensionLevelDisplay) ascensionLevelDisplay.textContent = state.ascensionLevel || 0;
    if (ascensionPPDisplay) ascensionPPDisplay.textContent = formatNumber(state.prestigePoints || 0);
    
    const cost = getAscensionCost();
    if (ascensionCostEl) ascensionCostEl.textContent = formatNumber(cost);
    
    const canAscend = (state.prestigePoints || 0) >= cost;
    if (doAscensionBtn) doAscensionBtn.disabled = !canAscend;
    
    if (ascensionPanel) {
      if (canAscend) {
        ascensionPanel.classList.remove("locked");
      } else {
        ascensionPanel.classList.add("locked");
      }
    }
    
    if (ascensionBoostEl) {
      ascensionBoostEl.textContent = getAscensionMultiplier().toFixed(2);
    }
  }

  function doAscension() {
    const cost = getAscensionCost();
    if ((state.prestigePoints || 0) < cost) {
      pushToast(`Need ${formatNumber(cost)} Prestige Points to Ascend`);
      return;
    }
    
    const newLevel = (state.ascensionLevel || 0) + 1;
    const multiplier = getAscensionMultiplier() + 0.5;
    
    if (!confirm(`Ascend to level ${newLevel}? This will give you a permanent ${multiplier.toFixed(2)}x multiplier to ALL gains but reset ALL progress including prestige points and upgrades.`)) return;

    state.ascensionLevel = newLevel;
    state.totalAscensions = (state.totalAscensions || 0) + 1;
    
    state.points = 0;
    state.clickPower = 1;
    state.multiplier = 1;
    state.prestigePoints = 0;
    
    state.goldenUnlocked = false;
    state.comboUnlocked = false;

    upgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });
    prestigeUpgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });

    pushToast(`🌟 Ascended to Level ${newLevel}! ${multiplier.toFixed(2)}x multiplier gained!`, 4000, "golden");
    updateUI();
    renderShops();
    renderPrestigeShop();
    renderCosmetics();
    updateAscensionUI();
    checkAchievements();
    saveGame();
  }

  doAscensionBtn.addEventListener("click", () => doAscension());

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

  if (creditsBtn && creditsModal && creditsClose) {
    creditsBtn.addEventListener("click", () => {
      creditsModal.classList.add("active");
    });
    creditsClose.addEventListener("click", () => {
      creditsModal.classList.remove("active");
    });
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

  guessBtn.addEventListener("click", guessNumber);

  function exportSave() {
    const data = btoa(JSON.stringify({
      state,
      upgrades: upgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
      prestigeUpgrades: prestigeUpgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
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
          if (u) {
            u.level = pu.level || 0;
            u.cost = pu.cost || u.baseCost;
          }
        });
      }
      if (data.achievements) {
        data.achievements.forEach(a => {
          const ac = achievements.find(x => x.id === a.id);
          if (ac) ac.unlocked = a.unlocked;
        });
      }
      
      if (!state.ownedCosmetics) state.ownedCosmetics = ['default'];
      if (!state.currentCosmetic) state.currentCosmetic = 'default';
      
      importModal.classList.remove("active");
      importText.value = "";
      updateUI();
      renderShops();
      renderPrestigeShop();
      renderCosmetics();
      renderAchievements();
      updateAscensionUI();
      equipCosmetic(state.currentCosmetic);
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

  function saveGame() {
    const payload = {
      state,
      upgrades: upgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
      prestigeUpgrades: prestigeUpgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
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
          if (ppOffline && ppOffline.level >= 1) offlineMult = ppOffline.effect;
          
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
          if (u) {
            u.level = pu.level ?? (pu.owned ? 1 : 0);
            u.cost = pu.cost ?? u.baseCost;
          }
        });
      }
      if (payload.achievements) {
        payload.achievements.forEach(a => {
          const ac = achievements.find(x => x.id === a.id);
          if (ac) ac.unlocked = !!a.unlocked;
        });
      }
      
      if (!state.ownedCosmetics) state.ownedCosmetics = ['default'];
      if (!state.currentCosmetic) state.currentCosmetic = 'default';
      
      document.body.className = `theme-${state.theme || 'dark'}`;
      soundToggle.checked = state.soundEnabled !== false;
      particlesToggle.checked = state.particlesEnabled !== false;
      document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.theme === (state.theme || 'dark'));
      });
      
      const ppGoldenUnlock = prestigeUpgrades.find(p => p.id === "pp_golden_unlock");
      const ppComboUnlock = prestigeUpgrades.find(p => p.id === "pp_combo_unlock");
      
      if ((ppGoldenUnlock && ppGoldenUnlock.level >= 1) || state.goldenUnlocked) {
        state.goldenUnlocked = true;
        goldenChanceDiv.style.display = "block";
      }
      
      if ((ppComboUnlock && ppComboUnlock.level >= 1) || state.comboUnlocked) {
        state.comboUnlocked = true;
      }
      
      equipCosmetic(state.currentCosmetic);
      
      updateUI();
      renderAchievements();
      updateAscensionUI();
      return true;
    } catch (e) {
      console.warn("Load failed", e);
      return false;
    }
  }

  function resetGame() {
    if (!confirm("Reset ALL progress including prestige and ascension?")) return;
    state = { 
      points: 0, clickPower: 1, multiplier: 1, version: 7, 
      totalClicks: 0, totalPointsEarned: 0, totalUpgradesBought: 0, 
      prestigePoints: 0, goldenClicks: 0, totalPrestiges: 0, totalAscensions: 0,
      ascensionLevel: 0,
      lastSaveTime: Date.now(), playTime: 0, theme: 'dark',
      soundEnabled: true, particlesEnabled: true,
      lastDailyReward: 0, dailyStreak: 0,
      goldenUnlocked: false, comboUnlocked: false,
      currentCosmetic: 'default',
      ownedCosmetics: ['default']
    };
    upgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });
    prestigeUpgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });
    achievements.forEach(a => a.unlocked = false);
    localStorage.removeItem(SAVE_KEY);
    goldenChanceDiv.style.display = "none";
    updateUI();
    renderShops();
    renderPrestigeShop();
    renderCosmetics();
    renderAchievements();
    updateAscensionUI();
    equipCosmetic('default');
    pushToast("Progress reset");
  }

  function updateUI() {
    if (pointsDisplay) pointsDisplay.textContent = formatNumber(Math.floor(state.points || 0));
    if (clickDisplay) clickDisplay.textContent = formatNumber(calcClickPower());
    const totalIdleValue = calcTotalIdle();
    if (idleDisplay) idleDisplay.textContent = formatNumber(totalIdleValue);
    
    let displayMult = state.multiplier;
    const ppMulti = prestigeUpgrades.find(p => p.id === "pp_multi");
    if (ppMulti && ppMulti.level > 0) {
      displayMult *= Math.pow(ppMulti.effect, ppMulti.level);
    }
    displayMult *= (1 + (state.prestigePoints || 0) * PRESTIGE_MULT_PER_POINT);
    displayMult *= getAscensionMultiplier();
    
    if (multDisplay) multDisplay.textContent = displayMult.toFixed(2);
    if (totalIdleEl) totalIdleEl.textContent = formatNumber(totalIdleValue);
    if (prestigePointsEl) prestigePointsEl.textContent = formatNumber(state.prestigePoints || 0);
    if (ppBalance) ppBalance.textContent = formatNumber(state.prestigePoints || 0);
    if (prestigeCurrent) prestigeCurrent.textContent = formatNumber(state.points || 0);
    if (prestigePotentialEl) prestigePotentialEl.textContent = calculatePrestigePotential();
    if (ascensionLevelEl) ascensionLevelEl.textContent = state.ascensionLevel || 0;
    
    if (prestigeBoostEl) {
      const prestigeBoost = (1 + (state.prestigePoints || 0) * PRESTIGE_MULT_PER_POINT);
      prestigeBoostEl.textContent = prestigeBoost.toFixed(2);
    }
    
    if (state.goldenUnlocked) {
      if (goldenPct) goldenPct.textContent = (getGoldenChance() * 100).toFixed(1);
    }
    
    document.getElementById("stat-clicks").textContent = formatNumber(state.totalClicks || 0);
    document.getElementById("stat-earned").textContent = formatNumber(state.totalPointsEarned || 0);
    document.getElementById("stat-upgrades").textContent = state.totalUpgradesBought || 0;
    document.getElementById("stat-golden").textContent = state.goldenClicks || 0;
    document.getElementById("stat-playtime").textContent = formatTime(state.playTime || 0);
    document.getElementById("stat-prestiges").textContent = state.totalPrestiges || 0;
    document.getElementById("stat-ascensions").textContent = state.totalAscensions || 0;
    
    const cpm = state.playTime > 0 ? Math.floor((state.totalClicks || 0) / (state.playTime / 60)) : 0;
    document.getElementById("stat-cpm").textContent = formatNumber(cpm);
    
    const clickSpeed = state.playTime > 0 ? ((state.totalClicks || 0) / (state.playTime * 60)).toFixed(2) : "0";
    document.getElementById("stat-clickspeed").textContent = clickSpeed;
    
    updateShopButtons();
    updateBlackjackUI();
    updateAscensionUI();
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
  renderCosmetics();
  renderAchievements();
  loadGame();
  updateUI();
  updateAscensionUI();
  startAutosave();
  
  setTimeout(() => {
    const lastDaily = state.lastDailyReward || 0;
    const hoursSince = (Date.now() - lastDaily) / (1000 * 60 * 60);
    if (hoursSince >= 20) {
      pushToast("🎁 Daily reward available!", 3000, "success");
    }
  }, 2000);
  
  // Bug spawn system
  function spawnBug() {
    if (activeBugs.length >= 3) return; // Max 3 bugs at once
    
    const bug = document.createElement("div");
    bug.className = "bug-creature";
    bug.textContent = "🪳";
    
    // Random starting position (edge of screen)
    const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    const maxX = window.innerWidth - 40;
    const maxY = window.innerHeight - 40;
    
    let startX, startY, targetX, targetY;
    
    switch(edge) {
      case 0: // top
        startX = Math.random() * maxX;
        startY = -40;
        break;
      case 1: // right
        startX = window.innerWidth;
        startY = Math.random() * maxY;
        break;
      case 2: // bottom
        startX = Math.random() * maxX;
        startY = window.innerHeight;
        break;
      case 3: // left
        startX = -40;
        startY = Math.random() * maxY;
        break;
    }
    
    // Random target position on screen
    targetX = Math.random() * (maxX - 100) + 50;
    targetY = Math.random() * (maxY - 100) + 50;
    
    bug.style.left = startX + "px";
    bug.style.top = startY + "px";
    
    document.body.appendChild(bug);
    
    const bugData = {
      element: bug,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      speed: 0.003, // Slower speed
      alive: true,
      escaping: false,
      spawnTime: Date.now()
    };
    
    activeBugs.push(bugData);
    
    // Click handler
    bug.addEventListener("click", () => {
      if (!bugData.alive) return;
      bugData.alive = false;
      
      // Calculate reward based on game progress
      const baseReward = Math.max(100, state.points * 0.01);
      const reward = Math.floor(baseReward * (1 + Math.random()));
      
      state.points += reward;
      state.totalPointsEarned += reward;
      
      bug.classList.add("bug-squished");
      pushToast(`🪳 Squished! +${formatNumber(reward)}`, 2000, "success");
      playBeep("golden");
      
      setTimeout(() => {
        if (bug.parentNode) bug.parentNode.removeChild(bug);
        activeBugs = activeBugs.filter(b => b !== bugData);
      }, 400);
      
      updateUI();
      saveGame();
    });
  }
  
  function updateBugs() {
    const currentTime = Date.now();
    
    activeBugs.forEach(bugData => {
      if (!bugData.alive) return;
      
      const timeAlive = (currentTime - bugData.spawnTime) / 1000; // seconds
      
      // After 5 seconds, start escaping
      if (timeAlive >= 5 && !bugData.escaping) {
        bugData.escaping = true;
        
        const currentX = bugData.startX + (bugData.targetX - bugData.startX) * bugData.progress;
        const currentY = bugData.startY + (bugData.targetY - bugData.startY) * bugData.progress;
        const maxX = window.innerWidth - 40;
        const maxY = window.innerHeight - 40;
        
        const distToLeft = currentX;
        const distToRight = maxX - currentX;
        const distToTop = currentY;
        const distToBottom = maxY - currentY;
        
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        if (minDist === distToLeft) bugData.targetX = -40;
        else if (minDist === distToRight) bugData.targetX = window.innerWidth;
        else if (minDist === distToTop) bugData.targetY = -40;
        else bugData.targetY = window.innerHeight;
        
        bugData.startX = currentX;
        bugData.startY = currentY;
        bugData.progress = 0;
        bugData.speed = 0.003; // Same speed for escape
      }
      
      bugData.progress += bugData.speed;
      
      // Update position
      const x = bugData.startX + (bugData.targetX - bugData.startX) * bugData.progress;
      const y = bugData.startY + (bugData.targetY - bugData.startY) * bugData.progress;
      
      bugData.element.style.left = x + "px";
      bugData.element.style.top = y + "px";
      
      // Calculate angle for rotation
      const dx = bugData.targetX - bugData.startX;
      const dy = bugData.targetY - bugData.startY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Rotate bug to face direction of movement
      bugData.element.style.transform = `rotate(${angle + 90}deg)`;
      
      // Remove if off screen
      if (x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50) {
        if (bugData.element.parentNode) {
          bugData.element.parentNode.removeChild(bugData.element);
        }
        activeBugs = activeBugs.filter(b => b !== bugData);
      }
    });
  }
  
  // Start bug spawn timer
  function startBugSpawns() {
    bugSpawnTimer = setInterval(() => {
      const chance = .15; // 15% chance every 10 seconds
      if (Math.random() < chance) {
        spawnBug();
      }
    }, 10000);
  }
  
  // Animation loop for bugs
  function bugAnimationLoop() {
    updateBugs();
    requestAnimationFrame(bugAnimationLoop);
  }
  
  startBugSpawns();
  bugAnimationLoop();
});
