// Enhanced clicker.js - WITH ARTIFACTS SYSTEM AND ALL FIXES
const SAVE_KEY = "clickerSave_v10";
const AUTOSAVE_INTERVAL_MS = 60000;
const PRESTIGE_BASE = 1e6;
const PRESTIGE_MULT_PER_POINT = 0.05;
const ASCENSION_BASE_REQUIREMENT = 100000;
const TRANSCENSION_REQUIREMENT = 30;
const COMBO_TIMEOUT = 2000;
const COMBO_THRESHOLD = 5;
const MAX_COMBO_LEVEL = 20;
const ARTIFACT_SHARD_CHANCE = 0.00001; // 1 in 100,000

let state = {
  points: 0,
  clickPower: 1,
  multiplier: 1,
  version: 10,
  totalClicks: 0,
  totalPointsEarned: 0,
  totalUpgradesBought: 0,
  prestigePoints: 0,
  goldenClicks: 0,
  totalPrestiges: 0,
  totalAscensions: 0,
  totalTranscensions: 0,
  ascensionLevel: 0,
  transcensionTokens: 0,
  comboUpgradeLevel: 0,
  lastSaveTime: Date.now(),
  playTime: 0,
  theme: 'dark',
  soundEnabled: true,
  particlesEnabled: true,
  toastsEnabled: true,
  bugToastEnabled: true,
  goldenToastEnabled: true,
  lastDailyReward: 0,
  dailyStreak: 0,
  goldenUnlocked: false,
  comboUnlocked: false,
  currentCosmetic: 'default',
  ownedCosmetics: ['default'],
  bulkBuyAmount: 1,
  artifactShards: 0,
  artifactsDiscovered: false,
  unlockedArtifacts: [],
  prestigePointsDiscovered: false,
  ascensionLevelDiscovered: false,
  transcensionTokensDiscovered: false,
};

const COSMETICS = [
  { id: 'default', name: 'Classic Cyan', className: '', cost: 0, costType: 'free', desc: 'The original circle' },
  { id: 'emerald', name: 'Emerald Dream', className: 'circle-emerald', cost: 5, costType: 'ascension', desc: 'A verdant green circle' },
  { id: 'violet', name: 'Violet Storm', className: 'circle-violet', cost: 5, costType: 'ascension', desc: 'A mystical purple circle' },
  { id: 'amber', name: 'Amber Glow', className: 'circle-amber', cost: 5, costType: 'ascension', desc: 'A golden amber circle' },
  { id: 'galaxy', name: 'Galaxy Spiral', className: 'circle-galaxy', cost: 25, costType: 'ascension', desc: 'A cosmic galaxy swirl', isImage: true },
  { id: 'secret', name: '???', className: 'circle-secret', cost: 0, costType: 'secret', desc: 'How did you find this?', secret: true },
];

const ARTIFACTS = [
  // Common (5)
  { id: 'pottery', name: 'Ancient Pottery', rarity: 'common', icon: '🏺', desc: 'A weathered clay pot' },
  { id: 'coin', name: 'Old Coin', rarity: 'common', icon: '🪙', desc: 'A tarnished copper coin' },
  { id: 'scroll', name: 'Torn Scroll', rarity: 'common', icon: '📜', desc: 'Faded ancient writings' },
  { id: 'bone', name: 'Fossil Fragment', rarity: 'common', icon: '🦴', desc: 'Prehistoric remains' },
  { id: 'shell', name: 'Pearl Shell', rarity: 'common', icon: '🐚', desc: 'An iridescent seashell' },
  
  // Rare (5)
  { id: 'statue', name: 'Stone Statue', rarity: 'rare', icon: '🗿', desc: 'A mysterious carved figure' },
  { id: 'gem', name: 'Gemstone', rarity: 'rare', icon: '💎', desc: 'A brilliant cut jewel' },
  { id: 'mask', name: 'Ritual Mask', rarity: 'rare', icon: '🎭', desc: 'An ornate ceremonial mask' },
  { id: 'compass', name: 'Golden Compass', rarity: 'rare', icon: '🧭', desc: 'Always points true' },
  { id: 'hourglass', name: 'Crystal Hourglass', rarity: 'rare', icon: '⏳', desc: 'Time flows differently' },
  
  // Legendary (3)
  { id: 'crown', name: 'Royal Crown', rarity: 'legendary', icon: '👑', desc: 'Worn by ancient kings' },
  { id: 'sword', name: 'Legendary Blade', rarity: 'legendary', icon: '⚔️', desc: 'Forged in dragon fire' },
  { id: 'orb', name: 'Crystal Orb', rarity: 'legendary', icon: '🔮', desc: 'Sees all possible futures' },
  
  // Mythic (2)
  { id: 'phoenix', name: 'Phoenix Feather', rarity: 'mythic', icon: '🪶', desc: 'Burns with eternal flame' },
  { id: 'star', name: 'Fallen Star', rarity: 'mythic', icon: '⭐', desc: 'A fragment of the cosmos' },
  
  // Eternal (1)
  { id: 'infinity', name: 'Infinity Stone', rarity: 'eternal', icon: '💠', desc: 'Contains the power of eternity itself' },
];

const RARITY_CHANCES = {
  common: 0.50,
  rare: 0.30,
  legendary: 0.15,
  mythic: 0.04,
  eternal: 0.01
};

const UPGRADES = [
  { id: "idle1", name: "Idle Worker", desc: "+0.5 points/sec", baseCost: 100, costMult: 1.8, type: "idle", effect: 0.5, category: "workers", unlockAfter: null },
  { id: "auto1", name: "Auto-clicker", desc: "+1 points/sec", baseCost: 800, costMult: 2.0, type: "idle", effect: 1, category: "workers", unlockAfter: 5 },
  { id: "idle2", name: "Idle Factory", desc: "+3 points/sec", baseCost: 5000, costMult: 1.9, type: "idle", effect: 3, category: "workers", unlockAfter: 8 },
  { id: "idle3", name: "Mega Generator", desc: "+10 points/sec", baseCost: 25000, costMult: 1.8, type: "idle", effect: 10, category: "workers", unlockAfter: 12 },
  { id: "click1", name: "Better Cursor", desc: "+1 click power", baseCost: 50, costMult: 1.9, type: "click", effect: 1, category: "clicks", unlockAfter: null },
  { id: "click2", name: "Super Cursor", desc: "+3 click power", baseCost: 3000, costMult: 2.0, type: "click", effect: 3, category: "clicks", unlockAfter: 8 },
  { id: "combo1", name: "Combo Master", desc: "Unlock combo system (click fast for bonus)", baseCost: 150000, costMult: 999, type: "special_combo", effect: 1, category: "clicks", unlockAfter: 15, oneTime: true, maxLevel: 1 },
  { id: "combo_upgrade", name: "Combo Limit +50", desc: "Increase max combo by 50", baseCost: 250000, costMult: 2.5, type: "combo_limit", effect: 50, category: "clicks", unlockAfter: 18, maxLevel: 20 },
  { id: "golden1", name: "Golden Touch", desc: "Unlock golden clicks (5% chance for 10x)", baseCost: 100000, costMult: 999, type: "special_golden", effect: 0.05, category: "clicks", unlockAfter: 15, oneTime: true, maxLevel: 1 },
  { id: "golden2", name: "Golden Boost", desc: "+5% golden click chance", baseCost: 500000, costMult: 3.5, type: "special", effect: 0.05, category: "clicks", unlockAfter: 18 },
  { id: "multi1", name: "Multiplier", desc: "x1.15 global multiplier", baseCost: 500, costMult: 2.5, type: "multi", effect: 1.15, category: "multipliers", unlockAfter: 5 },
  { id: "multi2", name: "Big Multiplier", desc: "x1.3 global multiplier", baseCost: 50000, costMult: 2.8, type: "multi", effect: 1.3, category: "multipliers", unlockAfter: 12 },
];

const PRESTIGE_UPGRADES = [
  { id: "pp_click", name: "Eternal Click", desc: "Start with +10 click power per level", baseCost: 1, costMult: 5.0, type: "start_click", effect: 10, oneTime: false },
  { id: "pp_idle", name: "Eternal Idle", desc: "Start with +10 idle/sec per level", baseCost: 1, costMult: 5.0, type: "start_idle", effect: 10, oneTime: false },
  { id: "pp_multi", name: "Eternal Multi", desc: "Permanent x1.5 multiplier per level", baseCost: 2, costMult: 8.0, type: "permanent_multi", effect: 1.5, oneTime: false },
  { id: "pp_golden_unlock", name: "Golden Touch", desc: "Unlock golden clicks permanently", baseCost: 5, costMult: 999, type: "golden_unlock", effect: 1, oneTime: true, maxLevel: 1 },
  { id: "pp_combo_unlock", name: "Combo Master", desc: "Unlock combo system permanently", baseCost: 5, costMult: 999, type: "combo_unlock", effect: 1, oneTime: true, maxLevel: 1 },
  { id: "pp_golden", name: "Golden Blessing", desc: "+10% golden click chance", baseCost: 10, costMult: 999, type: "golden_boost", effect: 0.1, oneTime: true, maxLevel: 1 },
  { id: "pp_offline", name: "Offline Bonus", desc: "2x offline progress", baseCost: 20, costMult: 999, type: "offline_boost", effect: 2, oneTime: true, maxLevel: 1 },
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
  { id: "artifact1", name: "Archaeologist", desc: "Find your first artifact shard", check: () => state.artifactShards >= 1, reward: { type: "points", amount: 100000 } },
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

function getTranscensionMultiplier() {
  const tokens = state.transcensionTokens || 0;
  return 1 + (tokens * 5);
}

function getAscensionMultiplier() {
  const level = state.ascensionLevel || 0;
  const transcensionMult = getTranscensionMultiplier();
  return (1 + (level * 0.5)) * transcensionMult;
}

function getAscensionCost() {
  const level = state.ascensionLevel || 0;
  return Math.floor(ASCENSION_BASE_REQUIREMENT * Math.pow(1.5, level));
}

function getComboLimit() {
  const baseLimit = 50;
  const comboUpgrade = upgrades.find(u => u.id === "combo_upgrade");
  if (!comboUpgrade) return baseLimit;
  
  const upgradeLevel = Math.min(comboUpgrade.level, MAX_COMBO_LEVEL);
  return baseLimit + (upgradeLevel * 50);
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
  
  // FIXED: Correct combo calculation
  const comboLimit = getComboLimit();
  let comboMult = 1;
  if (state.comboUnlocked && comboCount >= COMBO_THRESHOLD) {
    const comboBonus = Math.min(comboCount, comboLimit) - COMBO_THRESHOLD + 1;
    comboMult = 1 + (comboBonus * 0.5);
  }
  
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

function shouldHideUpgrade(upgrade) {
  // Hide Golden Touch if permanent version is owned
  if (upgrade.id === "golden1") {
    const ppGoldenUnlock = prestigeUpgrades.find(p => p.id === "pp_golden_unlock");
    if (ppGoldenUnlock && ppGoldenUnlock.level >= 1) return true;
  }
  
  // Hide Combo Master if permanent version is owned
  if (upgrade.id === "combo1") {
    const ppComboUnlock = prestigeUpgrades.find(p => p.id === "pp_combo_unlock");
    if (ppComboUnlock && ppComboUnlock.level >= 1) return true;
  }
  
  return false;
}

function pushToast(text, ttl = 2200, type = "") {
  if (!state.toastsEnabled) return;
  
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

function rollArtifact() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
    cumulative += chance;
    if (rand <= cumulative) {
      const artifactsOfRarity = ARTIFACTS.filter(a => a.rarity === rarity && !state.unlockedArtifacts.includes(a.id));
      if (artifactsOfRarity.length === 0) {
        const allOfRarity = ARTIFACTS.filter(a => a.rarity === rarity);
        return allOfRarity[Math.floor(Math.random() * allOfRarity.length)];
      }
      return artifactsOfRarity[Math.floor(Math.random() * artifactsOfRarity.length)];
    }
  }
  
  const commonArtifacts = ARTIFACTS.filter(a => a.rarity === 'common');
  return commonArtifacts[Math.floor(Math.random() * commonArtifacts.length)];
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
  const achProgressFill = document.getElementById("ach-progress-fill");
  const achProgressText = document.getElementById("ach-progress-text");
  const prestigePointsEl = document.getElementById("prestige-points");
  const prestigePointsHud = document.getElementById("prestige-points-hud");
  const ppBalance = document.getElementById("pp-balance");
  const prestigeCurrent = document.getElementById("prestige-current");
  const prestigePotentialEl = document.getElementById("prestige-potential");
  const doPrestigeBtn = document.getElementById("do-prestige");
  const prestigeBoostEl = document.getElementById("prestige-boost");
  const prestigeTabBtn = document.getElementById("prestige-tab-btn");

  const ascensionLevelEl = document.getElementById("ascension-level");
  const ascensionLevelHud = document.getElementById("ascension-level-hud");
  const ascensionLevelDisplay = document.getElementById("ascension-level-display");
  const ascensionPPDisplay = document.getElementById("ascension-pp-display");
  const ascensionCostEl = document.getElementById("ascension-cost");
  const doAscensionBtn = document.getElementById("do-ascension");
  const ascensionPanel = document.getElementById("ascension-panel");
  const ascensionBoostEl = document.getElementById("ascension-boost");
  const ascensionTabBtn = document.getElementById("ascension-tab-btn");

  const transcensionTokensHud = document.getElementById("transcension-tokens-hud");
  const transcensionTokensDisplay = document.getElementById("transcension-tokens-display");
  const transcensionAscDisplay = document.getElementById("transcension-asc-display");
  const transcensionCostEl = document.getElementById("transcension-cost");
  const doTranscensionBtn = document.getElementById("do-transcension");
  const transcensionPanel = document.getElementById("transcension-panel");
  const transcensionBoostEl = document.getElementById("transcension-boost");
  const transcensionTabBtn = document.getElementById("transcension-tab-btn");

  const artifactSideSection = document.getElementById("artifact-side-section");
  const artifactShardsSide = document.getElementById("artifact-shards-side");

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

  // Side panel modals
  const cosmeticsModal = document.getElementById("cosmetics-modal");
  const cosmeticsClose = document.getElementById("cosmetics-close");
  const achievementsModal = document.getElementById("achievements-modal");
  const achievementsClose = document.getElementById("achievements-close");
  const statsModal = document.getElementById("stats-modal");
  const statsClose = document.getElementById("stats-close");
  const settingsModal = document.getElementById("settings-modal");
  const settingsClose = document.getElementById("settings-close");
  
  // Artifacts modals
  const artifactsModal = document.getElementById("artifacts-modal");
  const artifactsClose = document.getElementById("artifacts-close");
  const buyScratchoffBtn = document.getElementById("buy-scratchoff");
  const openMuseumBtn = document.getElementById("open-museum");
  const scratchoffFullscreen = document.getElementById("scratchoff-fullscreen");
  const closeScratchoffBtn = document.getElementById("close-scratchoff");
  const museumFullscreen = document.getElementById("museum-fullscreen");
  const closeMuseumBtn = document.getElementById("close-museum");

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
  const toastsToggle = document.getElementById("toasts-toggle");
  const bugToastToggle = document.getElementById("bug-toast-toggle");
  const goldenToastToggle = document.getElementById("golden-toast-toggle");let blackjackState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    currentBet: 0,
    gameActive: false,
    dealerRevealed: false
  };

  // Side panel button handlers
  document.querySelectorAll(".side-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.sidetab;
      
      if (tab === "cosmetics") {
        cosmeticsModal.classList.add("active");
        renderCosmetics();
      } else if (tab === "achievements") {
        achievementsModal.classList.add("active");
        renderAchievements();
      } else if (tab === "stats") {
        statsModal.classList.add("active");
        updateStatsModal();
      } else if (tab === "settings") {
        settingsModal.classList.add("active");
      } else if (tab === "artifacts") {
        artifactsModal.classList.add("active");
        updateArtifactsModal();
      }
    });
  });

  // Close modal handlers
  if (cosmeticsClose) cosmeticsClose.addEventListener("click", () => cosmeticsModal.classList.remove("active"));
  if (achievementsClose) achievementsClose.addEventListener("click", () => achievementsModal.classList.remove("active"));
  if (statsClose) statsClose.addEventListener("click", () => statsModal.classList.remove("active"));
  if (settingsClose) settingsClose.addEventListener("click", () => settingsModal.classList.remove("active"));
  if (artifactsClose) artifactsClose.addEventListener("click", () => artifactsModal.classList.remove("active"));

  // Bulk buy functionality
  document.querySelectorAll(".bulk-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".bulk-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const amount = btn.dataset.amount;
      state.bulkBuyAmount = amount === "max" ? "max" : parseInt(amount);
      renderShops();
    });
  });

  secretCosmeticBtn.addEventListener("click", () => {
    if (!state.ownedCosmetics.includes('secret')) {
      state.ownedCosmetics.push('secret');
      pushToast("🎨 Secret cosmetic unlocked!", 3000, "golden");
      renderCosmetics();
      saveGame();
    }
  });

  // Artifacts functionality
  buyScratchoffBtn.addEventListener("click", () => {
    if (state.artifactShards < 3) {
      pushToast("Need 3 Artifact Shards!");
      return;
    }
    
    state.artifactShards -= 3;
    artifactsModal.classList.remove("active");
    openScratchoff();
    updateUI();
    saveGame();
  });

  openMuseumBtn.addEventListener("click", () => {
    artifactsModal.classList.remove("active");
    openMuseum();
  });

  closeScratchoffBtn.addEventListener("click", () => {
    scratchoffFullscreen.classList.remove("active");
  });

  closeMuseumBtn.addEventListener("click", () => {
    museumFullscreen.classList.remove("active");
  });

  function openScratchoff() {
    scratchoffFullscreen.classList.add("active");
    
    const canvas = document.getElementById("scratchoff-canvas");
    const ctx = canvas.getContext("2d");
    const resultDiv = document.getElementById("scratchoff-result");
    
    resultDiv.classList.remove("show", "common", "rare", "legendary", "mythic", "eternal");
    resultDiv.textContent = "";
    
    const artifact = rollArtifact();
    const isNew = !state.unlockedArtifacts.includes(artifact.id);
    
    // Draw scratch-off covering
    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add texture pattern
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 60}, ${120 + Math.random() * 60}, ${120 + Math.random() * 60}, 0.3)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 20, 20);
    }
    
    ctx.font = "bold 24px Inter";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH TO REVEAL", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Inter";
    ctx.fillText("✨ ARTIFACT ✨", canvas.width / 2, canvas.height / 2 + 20);
    
    let isScratching = false;
    let scratchedPixels = 0;
    const totalPixels = canvas.width * canvas.height;
    
    function scratch(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) transparent++;
      }
      
      scratchedPixels = transparent;
      
      if (scratchedPixels / totalPixels > 0.6) {
        revealArtifact();
      }
    }
    
    function revealArtifact() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw artifact reveal
      ctx.globalCompositeOperation = "source-over";
      
      // Background gradient based on rarity
      const gradients = {
        common: ["#9ca3af", "#6b7280"],
        rare: ["#3b82f6", "#1e40af"],
        legendary: ["#a855f7", "#7c3aed"],
        mythic: ["#fbbf24", "#f59e0b"],
        eternal: ["#ec4899", "#a855f7"]
      };
      
      const [color1, color2] = gradients[artifact.rarity];
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw artifact icon
      ctx.font = "120px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(artifact.icon, canvas.width / 2, canvas.height / 2 - 40);
      
      // Draw artifact name
      ctx.font = "bold 28px Inter";
      ctx.fillStyle = "#fff";
      ctx.fillText(artifact.name, canvas.width / 2, canvas.height / 2 + 80);
      
      // Draw rarity
      ctx.font = "bold 18px Inter";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(artifact.rarity.toUpperCase(), canvas.width / 2, canvas.height / 2 + 115);
      
      // Add to unlocked artifacts if new
      if (isNew) {
        state.unlockedArtifacts.push(artifact.id);
        resultDiv.textContent = `🎉 NEW! ${artifact.name} - ${artifact.desc}`;
        pushToast(`New artifact discovered: ${artifact.name}!`, 4000, "cosmic");
      } else {
        resultDiv.textContent = `Duplicate: ${artifact.name} - ${artifact.desc}`;
        pushToast(`Found duplicate: ${artifact.name}`, 3000);
      }
      
      resultDiv.classList.add("show", artifact.rarity);
      
      playBeep("golden");
      saveGame();
      checkAchievements();
      
      canvas.style.cursor = "default";
      canvas.onmousedown = null;
      canvas.onmousemove = null;
      canvas.onmouseup = null;
    }
    
    canvas.onmousedown = (e) => {
      isScratching = true;
      const rect = canvas.getBoundingClientRect();
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    };
    
    canvas.onmousemove = (e) => {
      if (isScratching) {
        const rect = canvas.getBoundingClientRect();
        scratch(e.clientX - rect.left, e.clientY - rect.top);
      }
    };
    
    canvas.onmouseup = () => {
      isScratching = false;
    };
    
    canvas.onmouseleave = () => {
      isScratching = false;
    };
  }

  function openMuseum() {
    museumFullscreen.classList.add("active");
    renderMuseum();
  }

  function renderMuseum() {
    const totalArtifacts = ARTIFACTS.length;
    const collectedArtifacts = state.unlockedArtifacts.length;
    const percentage = Math.floor((collectedArtifacts / totalArtifacts) * 100);
    
    document.getElementById("museum-collected").textContent = collectedArtifacts;
    document.getElementById("museum-total").textContent = totalArtifacts;
    document.getElementById("museum-percentage").textContent = `${percentage}%`;
    
    const rarities = ['common', 'rare', 'legendary', 'mythic', 'eternal'];
    
    rarities.forEach(rarity => {
      const grid = document.getElementById(`museum-${rarity}`);
      if (!grid) return;
      
      grid.innerHTML = "";
      const artifactsOfRarity = ARTIFACTS.filter(a => a.rarity === rarity);
      
      artifactsOfRarity.forEach(artifact => {
        const isUnlocked = state.unlockedArtifacts.includes(artifact.id);
        
        const item = document.createElement("div");
        item.className = `museum-item ${!isUnlocked ? "locked" : ""}`;
        
        item.innerHTML = `
          <div class="museum-item-icon">${isUnlocked ? artifact.icon : "❓"}</div>
          <div class="museum-item-name">${isUnlocked ? artifact.name : "???"}</div>
          <div class="museum-item-rarity rarity-${rarity}">${rarity.toUpperCase()}</div>
        `;
        
        grid.appendChild(item);
      });
    });
  }

  function updateArtifactsModal() {
    const shardsDisplay = document.getElementById("artifact-shards-display");
    if (shardsDisplay) {
      shardsDisplay.textContent = state.artifactShards || 0;
    }
    
    if (buyScratchoffBtn) {
      buyScratchoffBtn.disabled = state.artifactShards < 3;
    }
  }

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
      scratchoffFullscreen.classList.remove("active");
      museumFullscreen.classList.remove("active");
      dailyModal.classList.remove("active");
      importModal.classList.remove("active");
      cosmeticsModal.classList.remove("active");
      achievementsModal.classList.remove("active");
      statsModal.classList.remove("active");
      settingsModal.classList.remove("active");
      artifactsModal.classList.remove("active");
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
      if (btn.classList.contains("locked")) return;
      
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
    
    COSMETICS.filter(c => !c.secret).forEach(cosmetic => {
      const card = document.createElement("div");
      card.className = "upgrade-card cosmetic-upgrade";
      
      const owned = state.ownedCosmetics.includes(cosmetic.id);
      const equipped = state.currentCosmetic === cosmetic.id;
      
      if (owned) {
        card.classList.add("cosmetic-card-owned");
      }
      
      const previewClass = cosmetic.className || '';
      
      card.innerHTML = `
        <div class="row">
          <div style="flex:1">
            <div class="cosmetic-preview ${previewClass}"></div>
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
      
      const previewClass = owned ? secretCosmetic.className : '';
      
      card.innerHTML = `
        <div class="row">
          <div style="flex:1">
            <div class="cosmetic-preview ${previewClass}"></div>
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
      pushToast(`${cosmetic.name} purchased!`, 3000, "success");
      
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
    
    pushToast(`Equipped ${cosmetic.name}`, 2000, "success");
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
    
    const percentage = Math.floor((unlocked / achievements.length) * 100);
    if (achProgressFill) {
      achProgressFill.style.width = `${percentage}%`;
    }
    if (achProgressText) {
      achProgressText.textContent = `${percentage}%`;
    }}

  function markAchievementUnlocked(a) {
    a.unlocked = true;
    applyAchievementReward(a.reward);
    const displayName = a.secret && a.unlockName ? a.unlockName : a.name;
    pushToast(`Achievement: ${displayName}`, 3000, "success");
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
      if (!state.prestigePointsDiscovered) state.prestigePointsDiscovered = true;
    } else if (reward.type === "clickPower") {
      state.clickPower += (reward.amount || 0);
    }
    updateUI();
  }

  function updateStatsModal() {
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
  }

  function getBulkBuyCost(upgrade) {
    if (state.bulkBuyAmount === "max") {
      let totalCost = 0;
      let tempCost = upgrade.cost;
      let count = 0;
      
      while (state.points >= totalCost + tempCost && count < 1000) {
        totalCost += tempCost;
        tempCost = Math.ceil(tempCost * upgrade.costMult);
        count++;
      }
      
      return { cost: totalCost, amount: count };
    } else {
      let totalCost = 0;
      let tempCost = upgrade.cost;
      
      for (let i = 0; i < state.bulkBuyAmount; i++) {
        totalCost += tempCost;
        tempCost = Math.ceil(tempCost * upgrade.costMult);
      }
      
      return { cost: totalCost, amount: state.bulkBuyAmount };
    }
  }

function renderShopCategory(category, gridElement) {
  gridElement.innerHTML = "";
  const categoryUpgrades = upgrades.filter(u => u.category === category && isUpgradeUnlocked(u) && !shouldHideUpgrade(u));
  
  categoryUpgrades.forEach(u => {
    if (u.oneTime && u.level >= 1) return;
    
    const card = document.createElement("div");
    card.className = "upgrade-card";
    
    // FIXED: Don't show effect text for combo_limit upgrades
    let effectText = "";
    if (u.type === "idle") effectText = `+${formatNumber(u.effect)}/s`;
    else if (u.type === "click") effectText = `+${formatNumber(u.effect)} power`;
    else if (u.type === "multi") effectText = `x${u.effect}`;
    else if (u.type === "combo_limit" || u.type === "special" || u.type === "special_golden" || u.type === "special_combo") {
      effectText = "";
    }
    
    const bulkInfo = !u.oneTime ? getBulkBuyCost(u) : { cost: u.cost, amount: 1 };
    const displayCost = bulkInfo.cost;
    const displayAmount = bulkInfo.amount;
    
    const buyText = state.bulkBuyAmount === "max" ? `Buy ${displayAmount}` : 
                    state.bulkBuyAmount === 1 ? "Buy" : `Buy ${displayAmount}`;
    
    const canAfford = state.points >= displayCost && displayAmount > 0;
    
    // Show max level if it exists
    let levelDisplay = '';
    if (!u.oneTime && u.maxLevel) {
      levelDisplay = `<div class="upgrade-desc">Lvl: <span id="lvl-${u.id}">${u.level}</span>/${u.maxLevel}</div>`;
    } else if (!u.oneTime) {
      levelDisplay = `<div class="upgrade-desc">Lvl: <span id="lvl-${u.id}">${u.level}</span></div>`;
    } else if (u.maxLevel) {
      levelDisplay = `<div class="upgrade-desc">Lvl: <span id="lvl-${u.id}">${u.level}</span>/${u.maxLevel}</div>`;
    }
    
    card.innerHTML = `
      <div class="row">
        <div>
          <div class="upgrade-title">${u.name} ${effectText}</div>
          <div class="upgrade-desc">${u.desc}</div>
        </div>
        <div style="text-align:right">
          <div class="upgrade-cost" id="cost-${u.id}">${formatNumber(displayCost)}</div>
          <div style="height:4px"></div>
          <button class="buy-btn" id="buy-${u.id}" ${!canAfford ? 'disabled' : ''}>${buyText}</button>
          ${levelDisplay}
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
      
      // Show max level if it exists
      let levelDisplay = '';
      if (!isOneTime && u.maxLevel) {
        levelDisplay = `<div class="upgrade-desc">Lvl: <span id="lvl-pp-${u.id}">${u.level}</span>/${u.maxLevel}</div>`;
      } else if (!isOneTime) {
        levelDisplay = `<div class="upgrade-desc">Lvl: <span id="lvl-pp-${u.id}">${u.level}</span></div>`;
      } else if (u.maxLevel) {
        levelDisplay = `<div class="upgrade-desc">Lvl: <span id="lvl-pp-${u.id}">${u.level}</span>/${u.maxLevel}</div>`;
      }
      
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
            ${levelDisplay}
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
      
      if (costEl) {
        const bulkInfo = !u.oneTime ? getBulkBuyCost(u) : { cost: u.cost, amount: 1 };
        costEl.textContent = formatNumber(bulkInfo.cost);
      }
      
      if (lvlEl) lvlEl.textContent = u.level;
      
      if (buyBtn && isUpgradeUnlocked(u)) {
        const bulkInfo = !u.oneTime ? getBulkBuyCost(u) : { cost: u.cost, amount: 1 };
        const canAfford = state.points >= bulkInfo.cost && bulkInfo.amount > 0;
        buyBtn.disabled = !canAfford;
        
        if (!u.oneTime) {
          const buyText = state.bulkBuyAmount === "max" ? `Buy ${bulkInfo.amount}` : 
                          state.bulkBuyAmount === 1 ? "Buy" : `Buy ${bulkInfo.amount}`;
          buyBtn.textContent = buyText;
        }
      }
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
    
    const bulkInfo = !up.oneTime ? getBulkBuyCost(up) : { cost: up.cost, amount: 1 };
    
    if (state.points < bulkInfo.cost) {
      pushToast("Not enough points");
      return;
    }
    
    state.points -= bulkInfo.cost;
    up.level += bulkInfo.amount;
    state.totalUpgradesBought = (state.totalUpgradesBought || 0) + bulkInfo.amount;

    if (up.type === "click") state.clickPower += up.effect * bulkInfo.amount;
    else if (up.type === "multi") state.multiplier *= Math.pow(up.effect, bulkInfo.amount);
    else if (up.type === "special_golden") {
      state.goldenUnlocked = true;
      pushToast("Golden clicks unlocked!", 3000, "success");
    }
    else if (up.type === "special_combo") {
      state.comboUnlocked = true;
      pushToast("Combo system unlocked!", 3000, "success");
    }
    else if (up.type === "combo_limit") {
      state.comboUpgradeLevel = up.level;
    }

    if (up.costMult !== 999) {
      for (let i = 0; i < bulkInfo.amount; i++) {
        up.cost = Math.ceil(up.cost * up.costMult);
      }
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
      pushToast("Golden clicks unlocked permanently!", 3000, "success");
    } else if (up.type === "combo_unlock") {
      state.comboUnlocked = true;
      pushToast("Combo system unlocked permanently!", 3000, "success");
    }
    
    pushToast(`Purchased: ${up.name}`, 2000, "success");
    playBeep("purchase");
    
    if (!up.oneTime && up.costMult !== 999) {
      up.cost = Math.ceil(up.cost * up.costMult);
    }
    
    renderPrestigeShop();
    renderShops(); // Re-render shops to hide upgrades if permanent versions bought
    updateUI();
    saveGame();
  }

  function onCircleClick(clientX, clientY) {
    const isGolden = state.goldenUnlocked && Math.random() < getGoldenChance();
    const isArtifactShard = Math.random() < ARTIFACT_SHARD_CHANCE;
    const mult = isGolden ? 10 : 1;
    const gained = calcClickPower() * mult;
    
    state.points += gained;
    state.totalClicks = (state.totalClicks || 0) + 1;
    state.totalPointsEarned = (state.totalPointsEarned || 0) + gained;
    
    if (isArtifactShard) {
      state.artifactShards = (state.artifactShards || 0) + 1;
      
      if (!state.artifactsDiscovered) {
        state.artifactsDiscovered = true;
        artifactSideSection.style.display = "block";
        pushToast("✨ ARTIFACT SHARD DISCOVERED! Check the Artifacts tab!", 5000, "cosmic");
      } else {
        pushToast("✨ Artifact Shard found!", 3000, "cosmic");
      }
      
      if (state.particlesEnabled) {
        spawnParticles(clientX, clientY, 25, false, true);
      }
      playBeep("golden");
    }
    
    if (isGolden) {
      state.goldenClicks = (state.goldenClicks || 0) + 1;
      goldenActive = true;
      circle.classList.add("golden");
      setTimeout(() => {
        circle.classList.remove("golden");
        goldenActive = false;
      }, 500);
      playBeep("golden");
      if (state.goldenToastEnabled) {
        pushToast(`GOLDEN! +${formatNumber(gained)}`, 1500, "golden");
      }
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
    if (state.particlesEnabled && !isArtifactShard) {
      spawnParticles(clientX, clientY, Math.min(15, Math.ceil(gained / 10)), isGolden, false);
    }
    if (!isGolden && !isArtifactShard) playBeep("click");
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
    // FIXED: Show actual combo multiplier correctly
    const comboLimit = getComboLimit();
    const displayCombo = Math.min(comboCount, comboLimit) - COMBO_THRESHOLD + 2;
    comboValue.textContent = displayCombo;
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

  function spawnParticles(clientX, clientY, count = 6, golden = false, cosmic = false) {
    const rect = particleLayer.getBoundingClientRect();
    const layerX = clientX - rect.left;
    const layerY = clientY - rect.top;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      if (cosmic) p.classList.add("cosmic");
      else if (golden) p.classList.add("golden");
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
    
    if (!state.prestigePointsDiscovered) state.prestigePointsDiscovered = true;

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

    pushToast(`Prestiged! +${potential} PP`, 3000, "success");
    updateUI();
    renderShops();
    checkAchievements();
    updateTabLocks();
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
    
    if (!state.ascensionLevelDiscovered) state.ascensionLevelDiscovered = true;
    
    state.points = 0;
    state.clickPower = 1;
    state.multiplier = 1;
    state.prestigePoints = 0;
    
    state.goldenUnlocked = false;
    state.comboUnlocked = false;

    upgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });
    prestigeUpgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });

    pushToast(`Ascended to Level ${newLevel}! ${multiplier.toFixed(2)}x multiplier gained!`, 4000, "golden");
    updateUI();
    renderShops();
    renderPrestigeShop();
    renderCosmetics();
    updateAscensionUI();
    updateTranscensionUI();
    updateTabLocks();
    checkAchievements();
    saveGame();
  }

  doAscensionBtn.addEventListener("click", () => doAscension());

  function updateTranscensionUI() {
    if (transcensionTokensDisplay) transcensionTokensDisplay.textContent = state.transcensionTokens || 0;
    if (transcensionAscDisplay) transcensionAscDisplay.textContent = state.ascensionLevel || 0;
    
    const cost = TRANSCENSION_REQUIREMENT;
    if (transcensionCostEl) transcensionCostEl.textContent = cost;
    
    const canTranscend = (state.ascensionLevel || 0) >= cost;
    if (doTranscensionBtn) doTranscensionBtn.disabled = !canTranscend;
    
    if (transcensionPanel) {
      if (canTranscend) {
        transcensionPanel.classList.remove("locked");
      } else {
        transcensionPanel.classList.add("locked");
      }
    }
    
    if (transcensionBoostEl) {
      transcensionBoostEl.textContent = getTranscensionMultiplier().toFixed(2);
    }
  }

  function doTranscension() {
    const cost = TRANSCENSION_REQUIREMENT;
    if ((state.ascensionLevel || 0) < cost) {
      pushToast(`Need ${cost} Ascension Levels to Transcend`);
      return;
    }
    
    const newTokens = (state.transcensionTokens || 0) + 1;
    const multiplier = getTranscensionMultiplier() + 5;
    
    if (!confirm(`Transcend reality for 1 Eternal Token? This will give you a massive ${multiplier.toFixed(2)}x multiplier but reset EVERYTHING except cosmetics and artifacts.`)) return;

    state.transcensionTokens = newTokens;
    state.totalTranscensions = (state.totalTranscensions || 0) + 1;
    
    if (!state.transcensionTokensDiscovered) state.transcensionTokensDiscovered = true;
    
    state.points = 0;
    state.clickPower = 1;
    state.multiplier = 1;
    state.prestigePoints = 0;
    state.ascensionLevel = 0;
    
    state.goldenUnlocked = false;
    state.comboUnlocked = false;
    state.comboUpgradeLevel = 0;

    upgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });
    prestigeUpgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });

    pushToast(`Transcended! Gained 1 Eternal Token! ${multiplier.toFixed(2)}x multiplier!`, 4000, "golden");
    updateUI();
    renderShops();
    renderPrestigeShop();
    updateAscensionUI();
    updateTranscensionUI();
    updateTabLocks();
    checkAchievements();
    saveGame();
  }

  doTranscensionBtn.addEventListener("click", () => doTranscension());

  function updateTabLocks() {
    const hasPrestiged = (state.totalPrestiges || 0) > 0;
    const hasAscended = (state.totalAscensions || 0) > 0;
    
    if (prestigeTabBtn) {
      prestigeTabBtn.classList.remove("locked");
    }
    
    if (ascensionTabBtn) {
      if (hasPrestiged) {
        ascensionTabBtn.classList.remove("locked");
      } else {
        ascensionTabBtn.classList.add("locked");
      }
    }
    
    if (transcensionTabBtn) {
      if (hasAscended) {
        transcensionTabBtn.classList.remove("locked");
      } else {
        transcensionTabBtn.classList.add("locked");
      }
    }
    
    // Currency HUD visibility - once discovered, always shown
    if (prestigePointsHud) {
      if (state.prestigePointsDiscovered) {
        prestigePointsHud.classList.remove("hidden");
      } else {
        prestigePointsHud.classList.add("hidden");
      }
    }
    
    if (ascensionLevelHud) {
      if (state.ascensionLevelDiscovered) {
        ascensionLevelHud.classList.remove("hidden");
      } else {
        ascensionLevelHud.classList.add("hidden");
      }
    }
    
    if (transcensionTokensHud) {
      if (state.transcensionTokensDiscovered) {
        transcensionTokensHud.classList.remove("hidden");
      } else {
        transcensionTokensHud.classList.add("hidden");
      }
    }
    
    // Artifact side section visibility
    if (artifactSideSection) {
      if (state.artifactsDiscovered) {
        artifactSideSection.style.display = "block";
      } else {
        artifactSideSection.style.display = "none";
      }
    }
    
    // Golden Chance visibility - only show if player actually owns the upgrade
    if (goldenChanceDiv) {
      const hasGoldenUpgrade = upgrades.find(u => u.id === "golden1" && u.level >= 1);
      const ppGoldenUnlock = prestigeUpgrades.find(p => p.id === "pp_golden_unlock" && p.level >= 1);
      
      if ((hasGoldenUpgrade || ppGoldenUnlock) && state.goldenUnlocked) {
        goldenChanceDiv.style.display = "block";
      } else {
        goldenChanceDiv.style.display = "none";
      }
    }
  }

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
      pushToast(`Correct! Number was ${target}. +50K!`, 3000, "golden");
    } else {
      pushToast(`Wrong! Number was ${target}`, 2000);
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
      if (!state.bulkBuyAmount) state.bulkBuyAmount = 1;
      if (!state.transcensionTokens) state.transcensionTokens = 0;
      if (!state.totalTranscensions) state.totalTranscensions = 0;
      if (!state.comboUpgradeLevel) state.comboUpgradeLevel = 0;
      if (!state.artifactShards) state.artifactShards = 0;
      if (state.artifactsDiscovered === undefined) state.artifactsDiscovered = false;
      if (!state.unlockedArtifacts) state.unlockedArtifacts = [];
      if (state.prestigePointsDiscovered === undefined) state.prestigePointsDiscovered = false;
      if (state.ascensionLevelDiscovered === undefined) state.ascensionLevelDiscovered = false;
      if (state.transcensionTokensDiscovered === undefined) state.transcensionTokensDiscovered = false;
      if (state.toastsEnabled === undefined) state.toastsEnabled = true;
      if (state.bugToastEnabled === undefined) state.bugToastEnabled = true;
      if (state.goldenToastEnabled === undefined) state.goldenToastEnabled = true;
      
      importModal.classList.remove("active");
      importText.value = "";
      updateUI();
      renderShops();
      renderPrestigeShop();
      renderCosmetics();
      renderAchievements();
      updateAscensionUI();
      updateTranscensionUI();
      updateTabLocks();
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

  toastsToggle.addEventListener("change", () => {
    state.toastsEnabled = toastsToggle.checked;
    saveGame();
  });

  bugToastToggle.addEventListener("change", () => {
    state.bugToastEnabled = bugToastToggle.checked;
    saveGame();
  });

  goldenToastToggle.addEventListener("change", () => {
    state.goldenToastEnabled = goldenToastToggle.checked;
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
      if (!state.bulkBuyAmount) state.bulkBuyAmount = 1;
      if (!state.transcensionTokens) state.transcensionTokens = 0;
      if (!state.totalTranscensions) state.totalTranscensions = 0;
      if (!state.comboUpgradeLevel) state.comboUpgradeLevel = 0;
      if (!state.artifactShards) state.artifactShards = 0;
      if (state.artifactsDiscovered === undefined) state.artifactsDiscovered = false;
      if (!state.unlockedArtifacts) state.unlockedArtifacts = [];
      if (state.prestigePointsDiscovered === undefined) state.prestigePointsDiscovered = false;
      if (state.ascensionLevelDiscovered === undefined) state.ascensionLevelDiscovered = false;
      if (state.transcensionTokensDiscovered === undefined) state.transcensionTokensDiscovered = false;
      if (state.toastsEnabled === undefined) state.toastsEnabled = true;
      if (state.bugToastEnabled === undefined) state.bugToastEnabled = true;
      if (state.goldenToastEnabled === undefined) state.goldenToastEnabled = true;
      
      // Auto-discover currencies if player already has them
      if (state.prestigePoints > 0 || state.totalPrestiges > 0) {
        state.prestigePointsDiscovered = true;
      }
      if (state.ascensionLevel > 0 || state.totalAscensions > 0) {
        state.ascensionLevelDiscovered = true;
      }
      if (state.transcensionTokens > 0 || state.totalTranscensions > 0) {
        state.transcensionTokensDiscovered = true;
      }
      if (state.artifactShards > 0) {
        state.artifactsDiscovered = true;
      }
      
      document.body.className = `theme-${state.theme || 'dark'}`;
      soundToggle.checked = state.soundEnabled !== false;
      particlesToggle.checked = state.particlesEnabled !== false;
      toastsToggle.checked = state.toastsEnabled !== false;
      bugToastToggle.checked = state.bugToastEnabled !== false;
      goldenToastToggle.checked = state.goldenToastEnabled !== false;
      document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.theme === (state.theme || 'dark'));
      });
      
      const ppGoldenUnlock = prestigeUpgrades.find(p => p.id === "pp_golden_unlock");
      const ppComboUnlock = prestigeUpgrades.find(p => p.id === "pp_combo_unlock");
      
      if ((ppGoldenUnlock && ppGoldenUnlock.level >= 1) || state.goldenUnlocked) {
        state.goldenUnlocked = true;
      }
      
      if ((ppComboUnlock && ppComboUnlock.level >= 1) || state.comboUnlocked) {
        state.comboUnlocked = true;
      }
      
      equipCosmetic(state.currentCosmetic);
      
      updateUI();
      renderAchievements();
      updateAscensionUI();
      updateTranscensionUI();
      updateTabLocks();
      return true;
    } catch (e) {
      console.warn("Load failed", e);
      return false;
    }
  }

  function resetGame() {
    if (!confirm("Reset ALL progress including prestige, ascension, transcension AND artifacts?")) return;
    state = { 
      points: 0, clickPower: 1, multiplier: 1, version: 10, 
      totalClicks: 0, totalPointsEarned: 0, totalUpgradesBought: 0, 
      prestigePoints: 0, goldenClicks: 0, totalPrestiges: 0, totalAscensions: 0, totalTranscensions: 0,
      ascensionLevel: 0, transcensionTokens: 0, comboUpgradeLevel: 0,
      lastSaveTime: Date.now(), playTime: 0, theme: 'dark',
      soundEnabled: true, particlesEnabled: true, toastsEnabled: true,
      bugToastEnabled: true, goldenToastEnabled: true,
      lastDailyReward: 0, dailyStreak: 0,
      goldenUnlocked: false, comboUnlocked: false,
      currentCosmetic: 'default',
      ownedCosmetics: ['default'],
      bulkBuyAmount: 1,
      artifactShards: 0,
      artifactsDiscovered: false,
      unlockedArtifacts: [],
      prestigePointsDiscovered: false,
      ascensionLevelDiscovered: false,
      transcensionTokensDiscovered: false,
    };
    upgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });
    prestigeUpgrades.forEach(u => { u.level = 0; u.cost = u.baseCost; });
    achievements.forEach(a => a.unlocked = false);
    localStorage.removeItem(SAVE_KEY);
    goldenChanceDiv.style.display = "none";
    artifactSideSection.style.display = "none";
    updateUI();
    renderShops();
    renderPrestigeShop();
    renderCosmetics();
    renderAchievements();
    updateAscensionUI();
    updateTranscensionUI();
    updateTabLocks();
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
    
    if (document.getElementById("transcension-tokens")) {
      document.getElementById("transcension-tokens").textContent = state.transcensionTokens || 0;
    }
    
    if (artifactShardsSide) {
      artifactShardsSide.textContent = state.artifactShards || 0;
    }
    
    if (prestigeBoostEl) {
      const prestigeBoost = (1 + (state.prestigePoints || 0) * PRESTIGE_MULT_PER_POINT);
      prestigeBoostEl.textContent = prestigeBoost.toFixed(2);
    }
    
    if (state.goldenUnlocked) {
      if (goldenPct) goldenPct.textContent = (getGoldenChance() * 100).toFixed(1);
    }
    
    updateShopButtons();
    updateBlackjackUI();
    updateAscensionUI();
    updateTranscensionUI();
    updateTabLocks();
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
  updateTranscensionUI();
  updateTabLocks();
  startAutosave();
  
  setTimeout(() => {
    const lastDaily = state.lastDailyReward || 0;
    const hoursSince = (Date.now() - lastDaily) / (1000 * 60 * 60);
    if (hoursSince >= 20) {
      pushToast("Daily reward available!", 3000, "success");
    }
  }, 2000);
  
  function spawnBug() {
    if (activeBugs.length >= 3) return;
    
    const bug = document.createElement("div");
    bug.className = "bug-creature";
    bug.textContent = "🪳";
    
    const edge = Math.floor(Math.random() * 4);
    const maxX = window.innerWidth - 40;
    const maxY = window.innerHeight - 40;
    
    let startX, startY, targetX, targetY;
    
    switch(edge) {
      case 0:
        startX = Math.random() * maxX;
        startY = -40;
        break;
      case 1:
        startX = window.innerWidth;
        startY = Math.random() * maxY;
        break;
      case 2:
        startX = Math.random() * maxX;
        startY = window.innerHeight;
        break;
      case 3:
        startX = -40;
        startY = Math.random() * maxY;
        break;
    }
    
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
      speed: 0.003,
      alive: true,
      escaping: false,
      spawnTime: Date.now()
    };
    
    activeBugs.push(bugData);
    
    bug.addEventListener("click", () => {
      if (!bugData.alive) return;
      bugData.alive = false;
      
      const baseReward = Math.max(100, state.points * 0.01);
      const reward = Math.floor(baseReward * (1 + Math.random()));
      
      state.points += reward;
      state.totalPointsEarned += reward;
      
      bug.classList.add("bug-squished");
      if (state.bugToastEnabled) {
        pushToast(`Squished! +${formatNumber(reward)}`, 2000, "success");
      }
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
      
      const timeAlive = (currentTime - bugData.spawnTime) / 1000;
      
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
        bugData.speed = 0.003;
      }
      
      bugData.progress += bugData.speed;
      
      const x = bugData.startX + (bugData.targetX - bugData.startX) * bugData.progress;
      const y = bugData.startY + (bugData.targetY - bugData.startY) * bugData.progress;
      
      bugData.element.style.left = x + "px";
      bugData.element.style.top = y + "px";
      
      const dx = bugData.targetX - bugData.startX;
      const dy = bugData.targetY - bugData.startY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      bugData.element.style.transform = `rotate(${angle + 90}deg)`;
      
      if (x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50) {
        if (bugData.element.parentNode) {
          bugData.element.parentNode.removeChild(bugData.element);
        }
        activeBugs = activeBugs.filter(b => b !== bugData);
      }
    });
  }
  
  function startBugSpawns() {
    bugSpawnTimer = setInterval(() => {
      const chance = .15;
      if (Math.random() < chance) {
        spawnBug();
      }
    }, 10000);
  }
  
  function bugAnimationLoop() {
    updateBugs();
    requestAnimationFrame(bugAnimationLoop);
  }
  
  startBugSpawns();
  bugAnimationLoop();
});
