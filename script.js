// ═══════════════════════════════════════
//  PEP CLICKER 2.0 – script.js
// ═══════════════════════════════════════

let coins = 0;
let perSec = 0;
let doubleCoins = false;
let doubleCoinsTimer = 0;
let userKey = "";

// Nemovitosti
let hasUFO = false;
let hasGarageKotlise = false;

// UI refs
const coinsText  = document.getElementById("coins");
const statsText  = document.getElementById("stats");
const horseBtn   = document.getElementById("horseBtn");

// ─── UPGRADES ───────────────────────────
const upgradeDefaults = {
  horse:        { cost: 50,          income: 1       },
  stable:       { cost: 200,         income: 5       },
  farm:         { cost: 1000,        income: 20      },
  naraz1:       { cost: 50000,       income: 500     },
  naraz2:       { cost: 250000,      income: 2000    },
  kotliseBazeny:{ cost: 1000000,     income: 8000    },
  workshop:     { cost: 5000000,     income: 25000   },
  rodokmeny:    { cost: 100000000,   income: 500000  },
};

const upgrades = JSON.parse(JSON.stringify(upgradeDefaults));

// ─── LOGIN ───────────────────────────────
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return;

  userKey = username + "_" + password;

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("game").style.display     = "flex";

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

// ─── BUY UPGRADE ─────────────────────────
function buyUpgrade(name) {
  const upg = upgrades[name];
  if (!upg || coins < upg.cost) return;

  coins   -= upg.cost;
  perSec  += upg.income;
  upg.cost = Math.floor(upg.cost * 1.15);  // 1.15x růst ceny

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
  if (rng < 0.33) {
    coins += 5000000;
    msg = "🎉 VÝHRA! +5 000 000 coins!";
  } else if (rng < 0.66) {
    msg = "😐 Nic...";
  } else {
    msg = "😅 Tentokrát nic neztrácíš.";
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
  document.getElementById("slotModal").style.display = "flex";
}

function setBet(amount) {
  currentBet = amount;
  document.getElementById("slotBetDisplay").innerText =
    "Vsazeno: " + formatCoins(currentBet);
}

function setCustomBet() {
  const val = parseInt(document.getElementById("customBet").value);
  if (isNaN(val) || val <= 0) {
    document.getElementById("slotResult").innerText = "❌ Zadej platné číslo!";
    return;
  }
  currentBet = val;
  document.getElementById("slotBetDisplay").innerText =
    "Vsazeno: " + formatCoins(currentBet);
}

function runSlot() {
  if (currentBet <= 0 || currentBet > coins) {
    document.getElementById("slotResult").innerText =
      currentBet <= 0 ? "❌ Zvol sázku!" : "❌ Nemáš dost coinů!";
    return;
  }

  coins -= currentBet;

  const rng = Math.random();
  let msg = "";
  if (rng < 0.4) {
    msg = "😢 Prohra. Ztratil jsi " + formatCoins(currentBet);
  } else if (rng < 0.7) {
    coins += currentBet * 2;
    msg = "🎉 Výhra 2x! +" + formatCoins(currentBet * 2);
  } else if (rng < 0.9) {
    coins += currentBet * 3;
    msg = "🔥 Výhra 3x! +" + formatCoins(currentBet * 3);
  } else {
    coins += currentBet * 10;
    msg = "💎 JACKPOT 10x! +" + formatCoins(currentBet * 10);
  }

  document.getElementById("slotResult").innerText = msg;
  update();
  saveGame();
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
  document.getElementById("ultimateBetDisplay").innerText =
    "Vsazeno: " + formatCoins(ultimateBet);
}

function setUltimateCustomBet() {
  const val = parseInt(document.getElementById("ultimateCustomBet").value);
  if (isNaN(val) || val < 500000) {
    document.getElementById("ultimateResult").innerText = "❌ Min. vklad je 500 000!";
    return;
  }
  ultimateBet = val;
  document.getElementById("ultimateBetDisplay").innerText =
    "Vsazeno: " + formatCoins(ultimateBet);
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

  // Animace - točení reelů
  let ticks = 0;
  const maxTicks = 20;
  const interval = setInterval(() => {
    ticks++;
    document.getElementById("reel1").innerText =
      ULTIMATE_SYMBOLS[Math.floor(Math.random() * ULTIMATE_SYMBOLS.length)];
    document.getElementById("reel2").innerText =
      ULTIMATE_SYMBOLS[Math.floor(Math.random() * ULTIMATE_SYMBOLS.length)];
    document.getElementById("reel3").innerText =
      ULTIMATE_SYMBOLS[Math.floor(Math.random() * ULTIMATE_SYMBOLS.length)];

    if (ticks >= maxTicks) {
      clearInterval(interval);

      // Finální výsledek – náhodný symbol pro každý reel
      const rng = Math.random();
      let symIdx;
      // Váhy: 0x=40%, 2x=25%, 5x=18%, 10x=10%, 25x=5%, 50x=2%
      if      (rng < 0.40) symIdx = 0;
      else if (rng < 0.65) symIdx = 1;
      else if (rng < 0.83) symIdx = 2;
      else if (rng < 0.93) symIdx = 3;
      else if (rng < 0.98) symIdx = 4;
      else                 symIdx = 5;

      // Pokud výhra, všechny tři stejné
      let s1, s2, s3;
      if (symIdx === 0) {
        // Prohra – různé symboly
        s1 = ULTIMATE_SYMBOLS[0];
        s2 = ULTIMATE_SYMBOLS[1];
        s3 = ULTIMATE_SYMBOLS[2];
      } else {
        s1 = s2 = s3 = ULTIMATE_SYMBOLS[symIdx];
      }

      document.getElementById("reel1").innerText = s1;
      document.getElementById("reel2").innerText = s2;
      document.getElementById("reel3").innerText = s3;

      const mult   = SYMBOL_MULT[symIdx];
      const payout = ultimateBet * mult;
      coins += payout;

      let msg = "";
      if (mult === 0) {
        msg = "💀 Prohra! Ztratil jsi " + formatCoins(ultimateBet);
      } else {
        msg = "🎉 VÝHRA " + mult + "x! +" + formatCoins(payout) + " coins!";
      }
      document.getElementById("ultimateResult").innerText = msg;
      document.getElementById("spinBtn").disabled = false;
      update();
      saveGame();
    }
  }, 80);

  update();
}

// ─── UFO (NEMOVITOST) ────────────────────
function buyUFO() {
  if (hasUFO) { alert("UFO už vlastníš!"); return; }
  if (coins < 10000000000) { alert("Nemáš dost coinů! (10 000 000 000)"); return; }
  coins -= 10000000000;
  hasUFO = true;
  alert("🛸 UFO zakoupeno! +100M coins/min");
  update();
  saveGame();
}

function buyGarageKotlise() {
  if (hasGarageKotlise) { alert("Garáž Kotlise už vlastníš!"); return; }
  if (coins < 5000000000) { alert("Nemáš dost coinů! (5 000 000 000)"); return; }
  coins -= 5000000000;
  hasGarageKotlise = true;
  alert("🚗 Garáž Kotlise zakoupena! +50M coins/min");
  update();
  saveGame();
}

function openNemovitosti() {
  let html = "";
  if (hasUFO) html += "<div class='nemItem'>🛸 UFO – +100M coins/min</div>";
  if (hasGarageKotlise) html += "<div class='nemItem'>🚗 Garáž Kotlise – +50M coins/min</div>";
  if (!hasUFO && !hasGarageKotlise) html = "<p style='color:#888'>Žádné nemovitosti.</p>";
  document.getElementById("nemovitostiList").innerHTML = html;
  document.getElementById("nemovitostiModal").style.display = "flex";
}

// ─── INFO ────────────────────────────────
function openInfo() {
  document.getElementById("infoModal").style.display = "flex";
}

// ─── MODAL HELPERS ───────────────────────
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// Klik mimo modal ho zavře
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

// ─── AUTO INCOME ─────────────────────────
setInterval(() => {
  let income = perSec;
  if (doubleCoins) income *= 2;

  // Nemovitosti: per minute = per second / 60
  if (hasUFO)           income += 100000000 / 60;
  if (hasGarageKotlise) income += 50000000  / 60;

  coins += income;
  update();
}, 1000);

// Auto-save každých 5 sekund
setInterval(() => { saveGame(); }, 5000);

// ─── UPDATE ──────────────────────────────
function update() {
  coinsText.innerText = formatCoins(Math.floor(coins));

  let effectivePerSec = perSec;
  if (hasUFO)           effectivePerSec += 100000000 / 60;
  if (hasGarageKotlise) effectivePerSec += 50000000  / 60;
  if (doubleCoins)      effectivePerSec *= 2;

  let statsStr = "Výdělek za sekundu: " + formatCoins(Math.floor(effectivePerSec));
  if (doubleCoins) statsStr += " (2x – " + doubleCoinsTimer + "s)";
  statsText.innerText = statsStr;

  // UFO tlačítka barvy
  const ufoBtn = document.getElementById("ufoPrestigeBtn");
  if (ufoBtn) ufoBtn.classList.toggle("canAfford", coins >= 10000000000 && !hasUFO);
  if (hasUFO) { ufoBtn.style.opacity = "0.5"; ufoBtn.style.cursor = "default"; }

  const garBtn = document.getElementById("garageKotliseBtn");
  if (garBtn) garBtn.classList.toggle("canAfford", coins >= 5000000000 && !hasGarageKotlise);
  if (hasGarageKotlise) { garBtn.style.opacity = "0.5"; garBtn.style.cursor = "default"; }

  checkAchievements();
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
  };
  for (const [elId, key] of Object.entries(map)) {
    const el = document.getElementById(elId);
    if (el && upgrades[key]) el.innerText = formatCoins(upgrades[key].cost);
  }
}

// ─── SAVE ─────────────────────────────────
function saveGame() {
  if (!userKey) return;
  const data = {
    coins, perSec, upgrades, hasUFO, hasGarageKotlise
  };
  localStorage.setItem(userKey + "_save", JSON.stringify(data));
}

// ─── LOAD ─────────────────────────────────
function loadGame() {
  const raw = localStorage.getItem(userKey + "_save");
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    coins = data.coins || 0;
    perSec = data.perSec || 0;
    hasUFO = data.hasUFO || false;
    hasGarageKotlise = data.hasGarageKotlise || false;
    if (data.upgrades) Object.assign(upgrades, data.upgrades);
    renderPrices();
  } catch(e) {
    console.error("Load error:", e);
  }
}

// Stará záchrana – kompatibilita se starým formátem
(function migrateOldSave() {
  // pokud existuje starý save, nezasahujeme – nový save ho přepíše
})();
