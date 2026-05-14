// ═══════════════════════════════════════
//  PEP CLICKER 2.0 – script.js (updated)
// ═══════════════════════════════════════

let coins = 0;
let perSec = 0;
let doubleCoins = false;
let doubleCoinsTimer = 0;
let userKey = "";

// Nemovitosti
let hasUFO = false;
let hasGarageKotlise = false;
let hasKotliseCar = false;   // nové Kotlise auto
let hasElectroBoiler = false; // elektrokotel upgrade

// Stáj – koně
let stableHorses = []; // max 6, každý má { name, level, income, emoji }
const MAX_HORSES = 6;
const MAX_HORSE_LEVEL = 50;

// Slot machine omezení
let slotSpinsLeft = 10;
let slotCooldownActive = false;
let slotCooldownSeconds = 0;

// Nákupní množství upgrade
let buyMultiplier = 1; // 1, 5, 10, 20, 50

// UI refs
const coinsText = document.getElementById("coins");
const statsText = document.getElementById("stats");
const horseBtn  = document.getElementById("horseBtn");

// ─── UPGRADES ───────────────────────────
const upgradeDefaults = {
  horse:         { cost: 50,          income: 1       },
  stable:        { cost: 200,         income: 5       },
  farm:          { cost: 1000,        income: 20      },
  naraz1:        { cost: 50000,       income: 500     },
  naraz2:        { cost: 250000,      income: 2000    },
  kotliseBazeny: { cost: 1000000,     income: 8000    },
  workshop:      { cost: 5000000,     income: 25000   },
  rodokmeny:     { cost: 100000000,   income: 500000  },
  olga:          { cost: 500000,      income: 3000    }, // Olga Kunysová
  elektrokotel:  { cost: 2000000,     income: 10000   }, // Elektrokotel
};

const upgradeCounts = {}; // počet zakoupených
const upgrades = JSON.parse(JSON.stringify(upgradeDefaults));
Object.keys(upgradeDefaults).forEach(k => { upgradeCounts[k] = 0; });

// ─── LOGIN ───────────────────────────────
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return;
  userKey = username + "_" + password;
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("game").style.display = "flex";
  loadGame();
  update();
  startAirship();
}

// ─── CLICK ───────────────────────────────
horseBtn.addEventListener("click", () => {
  coins += 1;
  spawnCoinParticle();
  update();
  saveGame();
});

function spawnCoinParticle() {
  const p = document.createElement("div");
  p.className = "coinParticle";
  p.innerText = "🪙";
  p.style.left = (horseBtn.getBoundingClientRect().left + 80) + "px";
  p.style.top  = (horseBtn.getBoundingClientRect().top  + 80) + "px";
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 900);
}

// ─── PEP BUTTON ──────────────────────────
document.getElementById("pepBtn").addEventListener("click", () => {
  const s = document.getElementById("horseSound");
  s.currentTime = 0;
  s.play();
});

// ─── BUY MULTIPLIER ──────────────────────
function setBuyMultiplier(n) {
  buyMultiplier = n;
  document.querySelectorAll(".buyMultBtn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.mul) === n);
  });
  renderPrices();
}

// Cena za nákup x kusů při exponenciálním zdražování (faktor 1.15)
function calcBulkCost(name, count) {
  const upg = upgrades[name];
  if (!upg) return Infinity;
  let total = 0;
  let cost = upg.cost;
  for (let i = 0; i < count; i++) {
    total += cost;
    cost = Math.floor(cost * 1.15);
  }
  return total;
}

// ─── BUY UPGRADE ─────────────────────────
function buyUpgrade(name) {
  const count = buyMultiplier;
  const totalCost = calcBulkCost(name, count);
  if (coins < totalCost) return;

  coins -= totalCost;

  // Posuneme cenu o count kroků
  for (let i = 0; i < count; i++) {
    perSec += upgrades[name].income;
    upgrades[name].cost = Math.floor(upgrades[name].cost * 1.15);
    upgradeCounts[name] = (upgradeCounts[name] || 0) + 1;
  }

  renderPrices();
  update();
  saveGame();
}

// ─── 2× PEP COINS ────────────────────────
function buyDoubleCoins() {
  if (coins < 40000) return;
  coins -= 40000;
  doubleCoins = true;
  doubleCoinsTimer = 30;
  if (window._doubleCoinInterval) clearInterval(window._doubleCoinInterval);
  window._doubleCoinInterval = setInterval(() => {
    doubleCoinsTimer--;
    update();
    if (doubleCoinsTimer <= 0) {
      doubleCoins = false;
      clearInterval(window._doubleCoinInterval);
      update();
    }
  }, 1000);
  update();
  saveGame();
}

// ─── TICKET ──────────────────────────────
function buyTicket() {
  document.getElementById("ticketResult").innerText = "";
  document.getElementById("ticketModal").style.display = "flex";
}

function confirmTicket() {
  if (coins < 250000) {
    document.getElementById("ticketResult").innerText = "❌ Nemáš dost coinů!";
    return;
  }
  coins -= 250000;
  const rng = Math.random();
  let msg = "";
  // Snížená šance na výhru: 15% výhra, 50% nic, 35% malá výhra
  if (rng < 0.15) {
    coins += 5000000;
    msg = "🎉 VÝHRA! +5 000 000 coins!";
  } else if (rng < 0.50) {
    coins += 500000;
    msg = "😐 Malá výhra... +500 000 coins.";
  } else {
    msg = "💀 Smůla! Ztratil jsi vsázku.";
  }
  document.getElementById("ticketResult").innerText = msg;
  update();
  saveGame();
}

// ─── AUTOMAT (SLOT MACHINE) ───────────────
let currentBet = 0;

function openSlotMachine() {
  currentBet = 0;
  document.getElementById("slotBetDisplay").innerText = "Vsazeno: 0";
  document.getElementById("slotResult").innerText = "";
  document.getElementById("customBet").value = "";
  updateSlotSpinInfo();
  document.getElementById("slotModal").style.display = "flex";
}

function updateSlotSpinInfo() {
  const el = document.getElementById("slotSpinInfo");
  if (!el) return;
  if (slotCooldownActive) {
    el.innerText = "⏳ Čekej " + slotCooldownSeconds + "s na další spiny";
    el.style.color = "#ff6666";
  } else {
    el.innerText = "🎲 Zbývá spinů: " + slotSpinsLeft + " / 10";
    el.style.color = slotSpinsLeft > 3 ? "#86efac" : "#ffaa44";
  }
}

function setBet(amount) {
  currentBet = amount;
  document.getElementById("slotBetDisplay").innerText = "Vsazeno: " + formatCoins(currentBet);
}

function setCustomBet() {
  const val = parseInt(document.getElementById("customBet").value);
  if (isNaN(val) || val <= 0) {
    document.getElementById("slotResult").innerText = "❌ Zadej platné číslo!";
    return;
  }
  currentBet = val;
  document.getElementById("slotBetDisplay").innerText = "Vsazeno: " + formatCoins(currentBet);
}

function runSlot() {
  if (slotCooldownActive) {
    document.getElementById("slotResult").innerText = "⏳ Čekej " + slotCooldownSeconds + "s!";
    return;
  }
  if (slotSpinsLeft <= 0) {
    startSlotCooldown();
    return;
  }
  if (currentBet <= 0 || currentBet > coins) {
    document.getElementById("slotResult").innerText =
      currentBet <= 0 ? "❌ Zvol sázku!" : "❌ Nemáš dost coinů!";
    return;
  }

  coins -= currentBet;
  slotSpinsLeft--;

  const rng = Math.random();
  let msg = "";
  if (rng < 0.50) {
    msg = "😢 Prohra. Ztratil jsi " + formatCoins(currentBet);
  } else if (rng < 0.75) {
    coins += currentBet * 2;
    msg = "🎉 Výhra 2x! +" + formatCoins(currentBet * 2);
  } else if (rng < 0.90) {
    coins += currentBet * 3;
    msg = "🔥 Výhra 3x! +" + formatCoins(currentBet * 3);
  } else {
    coins += currentBet * 10;
    msg = "💎 JACKPOT 10x! +" + formatCoins(currentBet * 10);
  }

  document.getElementById("slotResult").innerText = msg;

  if (slotSpinsLeft <= 0) startSlotCooldown();

  updateSlotSpinInfo();
  update();
  saveGame();
}

function startSlotCooldown() {
  slotCooldownActive = true;
  slotCooldownSeconds = 600; // 10 minut
  updateSlotSpinInfo();
  if (window._slotCooldownInterval) clearInterval(window._slotCooldownInterval);
  window._slotCooldownInterval = setInterval(() => {
    slotCooldownSeconds--;
    updateSlotSpinInfo();
    if (slotCooldownSeconds <= 0) {
      slotCooldownActive = false;
      slotSpinsLeft = 10;
      clearInterval(window._slotCooldownInterval);
      updateSlotSpinInfo();
    }
  }, 1000);
}

// ─── ULTIMATE AUTOMAT ────────────────────
let ultimateBet = 0;
const ULTIMATE_SYMBOLS = ["🔴", "🟡", "🟠", "🟢", "💎", "👑"];
const SYMBOL_MULT       = [0,    2,    5,    10,   25,   50  ];

function openUltimateSlot() {
  ultimateBet = 0;
  document.getElementById("ultimateBetDisplay").innerText = "Vsazeno: 0";
  document.getElementById("ultimateResult").innerText = "";
  document.getElementById("ultimateCustomBet").value = "";
  document.getElementById("reel1").innerText = "❓";
  document.getElementById("reel2").innerText = "❓";
  document.getElementById("reel3").innerText = "❓";
  document.getElementById("ultimateModal").style.display = "flex";
}

function setUltimateBet(amount) {
  ultimateBet = amount;
  document.getElementById("ultimateBetDisplay").innerText = "Vsazeno: " + formatCoins(ultimateBet);
}

function setUltimateCustomBet() {
  const val = parseInt(document.getElementById("ultimateCustomBet").value);
  if (isNaN(val) || val < 500000) {
    document.getElementById("ultimateResult").innerText = "❌ Min. vklad je 500 000!";
    return;
  }
  ultimateBet = val;
  document.getElementById("ultimateBetDisplay").innerText = "Vsazeno: " + formatCoins(ultimateBet);
}

function spinUltimate() {
  if (ultimateBet < 500000) {
    document.getElementById("ultimateResult").innerText = "❌ Min. vklad je 500 000!";
    return;
  }
  if (ultimateBet > coins) {
    document.getElementById("ultimateResult").innerText = "❌ Nemáš dost coinů!";
    return;
  }
  coins -= ultimateBet;
  document.getElementById("spinBtn").disabled = true;
  document.getElementById("ultimateResult").innerText = "";

  let ticks = 0;
  const maxTicks = 20;
  const interval = setInterval(() => {
    ticks++;
    document.getElementById("reel1").innerText = ULTIMATE_SYMBOLS[Math.floor(Math.random() * ULTIMATE_SYMBOLS.length)];
    document.getElementById("reel2").innerText = ULTIMATE_SYMBOLS[Math.floor(Math.random() * ULTIMATE_SYMBOLS.length)];
    document.getElementById("reel3").innerText = ULTIMATE_SYMBOLS[Math.floor(Math.random() * ULTIMATE_SYMBOLS.length)];

    if (ticks >= maxTicks) {
      clearInterval(interval);
      const rng = Math.random();
      let symIdx;
      // Snížená šance – 50% prohra
      if      (rng < 0.50) symIdx = 0;
      else if (rng < 0.70) symIdx = 1;
      else if (rng < 0.84) symIdx = 2;
      else if (rng < 0.93) symIdx = 3;
      else if (rng < 0.98) symIdx = 4;
      else                 symIdx = 5;

      let s1, s2, s3;
      if (symIdx === 0) {
        s1 = ULTIMATE_SYMBOLS[0]; s2 = ULTIMATE_SYMBOLS[1]; s3 = ULTIMATE_SYMBOLS[2];
      } else {
        s1 = s2 = s3 = ULTIMATE_SYMBOLS[symIdx];
      }
      document.getElementById("reel1").innerText = s1;
      document.getElementById("reel2").innerText = s2;
      document.getElementById("reel3").innerText = s3;

      const mult = SYMBOL_MULT[symIdx];
      const payout = ultimateBet * mult;
      coins += payout;

      let msg = mult === 0
        ? "💀 Prohra! Ztratil jsi " + formatCoins(ultimateBet)
        : "🎉 VÝHRA " + mult + "x! +" + formatCoins(payout) + " coins!";
      document.getElementById("ultimateResult").innerText = msg;
      document.getElementById("spinBtn").disabled = false;
      update();
      saveGame();
    }
  }, 80);
  update();
}

// ─── NEMOVITOSTI ─────────────────────────
function buyUFO() {
  if (hasUFO) { alert("UFO už vlastníš!"); return; }
  if (coins < 10000000000) { alert("Nemáš dost coinů! (10B)"); return; }
  coins -= 10000000000;
  hasUFO = true;
  alert("🛸 UFO zakoupeno! +100M coins / 30s");
  update(); saveGame();
}

function buyGarageKotlise() {
  if (hasGarageKotlise) { alert("Garáž Kotlise už vlastníš!"); return; }
  if (coins < 5000000000) { alert("Nemáš dost coinů! (5B)"); return; }
  coins -= 5000000000;
  hasGarageKotlise = true;
  alert("🚗 Garáž Kotlise zakoupena! +50M coins / 30s");
  update(); saveGame();
}

function buyKotliseCar() {
  if (hasKotliseCar) { alert("Kotlise Auto už vlastníš!"); return; }
  if (coins < 60000) { alert("Nemáš dost coinů! (60 000)"); return; }
  coins -= 60000;
  hasKotliseCar = true;
  alert("🏎️ Kotlise Auto zakoupeno! +3 000 coins / 30s");
  update(); saveGame();
}

function openNemovitosti() {
  let html = "";
  if (hasUFO)           html += "<div class='nemItem'>🛸 UFO – +100M coins / 30s</div>";
  if (hasGarageKotlise) html += "<div class='nemItem'>🚗 Garáž Kotlise – +50M coins / 30s</div>";
  if (hasKotliseCar)    html += "<div class='nemItem'>🏎️ Kotlise Auto – +3 000 coins / 30s</div>";
  if (!hasUFO && !hasGarageKotlise && !hasKotliseCar) html = "<p style='color:#888'>Žádné nemovitosti.</p>";
  document.getElementById("nemovitostiList").innerHTML = html;
  document.getElementById("nemovitostiModal").style.display = "flex";
}

// ─── STÁJ – SHIFINY DOUČKO ───────────────
const HORSE_NAMES = ["Blesk", "Hrom", "Vítr", "Pepík", "Kotlík", "Šifka"];
const HORSE_EMOJIS = ["🐎", "🐴", "🦄", "🐗", "🐂", "🦓"];

function openStable() {
  renderStableModal();
  document.getElementById("stableModal").style.display = "flex";
}

function renderStableModal() {
  const listEl = document.getElementById("stableHorseList");
  const tutoEl = document.getElementById("stableTutoringArea");

  // Koupit nového koně
  let addHtml = "";
  if (stableHorses.length < MAX_HORSES) {
    const newHorseCost = 10000 * Math.pow(2, stableHorses.length);
    addHtml = `<button class="stableAddBtn" onclick="addHorse()">
      ➕ Přidat koně (${formatCoins(newHorseCost)} coins)
    </button>`;
  } else {
    addHtml = `<p style="color:#888;font-size:13px;text-align:center">Stáj je plná! (max ${MAX_HORSES})</p>`;
  }

  // Seznam koní
  let horsesHtml = stableHorses.map((h, i) => {
    const lvl = h.level;
    const maxed = lvl >= MAX_HORSE_LEVEL;
    const levelCost = Math.floor(500 * Math.pow(1.2, lvl));
    return `<div class="stableHorseCard">
      <span class="stableHorseEmoji">${h.emoji}</span>
      <div class="stableHorseInfo">
        <div class="stableHorseName">${h.name}</div>
        <div class="stableHorseStats">Lvl ${lvl} / ${MAX_HORSE_LEVEL} &nbsp;|&nbsp; +${formatCoins(h.income)}/30s</div>
        <div class="stableHorseLvlBar"><div class="stableHorseLvlFill" style="width:${(lvl/MAX_HORSE_LEVEL)*100}%"></div></div>
      </div>
      ${maxed
        ? `<div class="stableLvlBtn maxed">MAX</div>`
        : `<button class="stableLvlBtn" onclick="levelHorse(${i})">
            Doučko<br><small>${formatCoins(levelCost)}</small>
           </button>`
      }
    </div>`;
  }).join("");

  listEl.innerHTML = addHtml + (horsesHtml || `<p style="color:#888;font-size:13px;text-align:center;margin-top:12px">Zatím nemáš žádného koně.<br>Kup prvního výše!</p>`);
}

function addHorse() {
  if (stableHorses.length >= MAX_HORSES) return;
  const cost = 10000 * Math.pow(2, stableHorses.length);
  if (coins < cost) { alert("Nemáš dost coinů!"); return; }
  coins -= cost;
  const idx = stableHorses.length;
  stableHorses.push({
    name: HORSE_NAMES[idx] || "Kůň " + (idx + 1),
    emoji: HORSE_EMOJIS[idx] || "🐎",
    level: 1,
    income: 100 * (idx + 1) // základní income
  });
  renderStableModal();
  update();
  saveGame();
}

function levelHorse(idx) {
  const h = stableHorses[idx];
  if (!h || h.level >= MAX_HORSE_LEVEL) return;
  const cost = Math.floor(500 * Math.pow(1.2, h.level));
  if (coins < cost) { alert("Nemáš dost coinů!"); return; }
  coins -= cost;
  h.level++;
  h.income = Math.floor(h.income * 1.10); // každý level +10% income
  renderStableModal();
  update();
  saveGame();
}

// ─── INFO ────────────────────────────────
function openInfo() {
  document.getElementById("infoModal").style.display = "flex";
}

// ─── MODAL HELPERS ───────────────────────
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

document.querySelectorAll(".modal").forEach(m => {
  m.addEventListener("click", e => {
    if (e.target === m) m.style.display = "none";
  });
});

// ─── VZDUCHOLOD ──────────────────────────
function startAirship() {
  const ship = document.getElementById("airship");
  ship.style.display = "block";
  let x = -300;
  const move = () => {
    x += 1.2;
    ship.style.left = x + "px";
    if (x > window.innerWidth + 100) x = -350;
    requestAnimationFrame(move);
  };
  move();
}

// ─── AUTO INCOME (každých 30 sekund pro nemovitosti) ──────────────────
// Upgrady přidávají per/sec, nemovitosti každých 30s
setInterval(() => {
  let income = perSec;
  if (doubleCoins) income *= 2;
  // Koně – income za 30s, takže per sec = income/30
  stableHorses.forEach(h => { income += h.income / 30; });
  coins += income;
  update();
}, 1000);

// Nemovitosti – každých 30 sekund
setInterval(() => {
  let bonus = 0;
  if (hasUFO)           bonus += 100000000;
  if (hasGarageKotlise) bonus += 50000000;
  if (hasKotliseCar)    bonus += 3000;
  if (bonus > 0) {
    coins += bonus;
    update();
  }
}, 30000);

// Auto-save
setInterval(() => { saveGame(); }, 5000);

// ─── UPDATE ──────────────────────────────
function update() {
  coinsText.innerText = formatCoins(Math.floor(coins));

  let effectivePerSec = perSec;
  stableHorses.forEach(h => { effectivePerSec += h.income / 30; });
  if (doubleCoins) effectivePerSec *= 2;

  let statsStr = "Výdělek za sekundu: " + formatCoins(Math.floor(effectivePerSec));
  if (doubleCoins) statsStr += " (2x – " + doubleCoinsTimer + "s)";
  statsText.innerText = statsStr;

  // UFO / Garáž tlačítka
  const ufoBtn = document.getElementById("ufoPrestigeBtn");
  if (ufoBtn) {
    ufoBtn.classList.toggle("canAfford", coins >= 10000000000 && !hasUFO);
    if (hasUFO) { ufoBtn.style.opacity = "0.5"; ufoBtn.style.cursor = "default"; }
  }
  const garBtn = document.getElementById("garageKotliseBtn");
  if (garBtn) {
    garBtn.classList.toggle("canAfford", coins >= 5000000000 && !hasGarageKotlise);
    if (hasGarageKotlise) { garBtn.style.opacity = "0.5"; garBtn.style.cursor = "default"; }
  }
  const carBtn = document.getElementById("kotliseCarBtn");
  if (carBtn) {
    carBtn.classList.toggle("canAfford", coins >= 60000 && !hasKotliseCar);
    if (hasKotliseCar) { carBtn.style.opacity = "0.5"; carBtn.style.cursor = "default"; }
  }

  checkAchievements();
  renderPrices();
}

// ─── FORMAT ──────────────────────────────
function formatCoins(n) {
  if (n >= 1000000000000) return (n / 1000000000000).toFixed(2) + "T";
  if (n >= 1000000000)    return (n / 1000000000).toFixed(2) + "B";
  if (n >= 1000000)       return (n / 1000000).toFixed(2) + "M";
  if (n >= 1000)          return (n / 1000).toFixed(1) + "K";
  return String(Math.floor(n));
}

// ─── ACHIEVEMENTS ────────────────────────
function checkAchievements() {
  let html = "";
  if (coins >= 1000)          html += "💰 1K Coins<br>";
  if (coins >= 1000000)       html += "🔥 1M Coins<br>";
  if (coins >= 1000000000)    html += "💎 1B Coins<br>";
  if (hasUFO)                 html += "🛸 UFO Vlastník<br>";
  if (hasGarageKotlise)       html += "🚗 Garáž Kotlise<br>";
  if (hasKotliseCar)          html += "🏎️ Kotlise Auto<br>";
  if (stableHorses.length > 0) html += "🐎 Stájník<br>";
  document.getElementById("achievementList").innerHTML = html;
}

// ─── RENDER PRICES ───────────────────────
function renderPrices() {
  const map = {
    horsePrice:       "horse",
    stablePrice:      "stable",
    farmPrice:        "farm",
    naraz1Price:      "naraz1",
    naraz2Price:      "naraz2",
    kotliseBazenPrice:"kotliseBazeny",
    workshopPrice:    "workshop",
    rodokmenPrice:    "rodokmeny",
    olgaPrice:        "olga",
    elektrokotelPrice:"elektrokotel",
  };
  for (const [elId, key] of Object.entries(map)) {
    const el = document.getElementById(elId);
    if (!el || !upgrades[key]) continue;
    const total = calcBulkCost(key, buyMultiplier);
    el.innerText = formatCoins(total) + (buyMultiplier > 1 ? " (x" + buyMultiplier + ")" : "");
  }
}

// ─── SAVE ─────────────────────────────────
function saveGame() {
  if (!userKey) return;
  const data = {
    coins, perSec, upgrades, upgradeCounts,
    hasUFO, hasGarageKotlise, hasKotliseCar, hasElectroBoiler,
    stableHorses,
    slotSpinsLeft, slotCooldownActive, slotCooldownSeconds,
  };
  localStorage.setItem(userKey + "_save", JSON.stringify(data));
}

// ─── LOAD ─────────────────────────────────
function loadGame() {
  const raw = localStorage.getItem(userKey + "_save");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    coins            = data.coins            || 0;
    perSec           = data.perSec           || 0;
    hasUFO           = data.hasUFO           || false;
    hasGarageKotlise = data.hasGarageKotlise || false;
    hasKotliseCar    = data.hasKotliseCar    || false;
    hasElectroBoiler = data.hasElectroBoiler || false;
    stableHorses     = data.stableHorses     || [];
    slotSpinsLeft    = (data.slotSpinsLeft !== undefined) ? data.slotSpinsLeft : 10;
    slotCooldownActive   = data.slotCooldownActive   || false;
    slotCooldownSeconds  = data.slotCooldownSeconds  || 0;
    if (data.upgrades)      Object.assign(upgrades, data.upgrades);
    if (data.upgradeCounts) Object.assign(upgradeCounts, data.upgradeCounts);
    renderPrices();
    // Obnoví cooldown pokud byl aktivní
    if (slotCooldownActive && slotCooldownSeconds > 0) startSlotCooldown();
  } catch(e) {
    console.error("Load error:", e);
  }
}
