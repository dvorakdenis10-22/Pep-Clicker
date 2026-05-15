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
let hasKotliseCar = false;
let hasElectroBoiler = false;

// Stáj – koně (income je /sec)
let stableHorses = [];
const MAX_HORSES = 6;
const MAX_HORSE_LEVEL = 50;

// Slot machine
let slotSpinsLeft = 10;
let slotCooldownActive = false;
let slotCooldownSeconds = 0;

// Nákupní množství
let buyMultiplier = 1;

// Achievements – permanentní set
let unlockedAchievements = new Set();
// Tracking pro achievementy (total earned, ne aktuální coins)
let totalCoinsEarned = 0;
let bossesDefeated = 0;

// ─── KUKUŘIČNÝ DÉMON BOSS ───────────────
let bossActive = false;
let bossHP = 0;
let bossMaxHP = 0;
let bossTimer = 0;       // čas do útěku v sekundách
let bossNextIn = 0;      // čas do dalšího spawnu
let bossInterval = null;

function spawnBoss() {
  if (bossActive) return;
  bossActive = true;
  bossMaxHP = Math.max(20, Math.floor(perSec * 3 + stableHorses.reduce((a,h)=>a+h.income,0) * 3 + 30));
  bossHP = bossMaxHP;
  bossTimer = 30; // 30 sekund na poražení
  renderBoss();
  document.getElementById("bossOverlay").style.display = "flex";
  document.getElementById("bossOverlay").classList.add("bossAppear");
  setTimeout(() => document.getElementById("bossOverlay").classList.remove("bossAppear"), 600);

  if (bossInterval) clearInterval(bossInterval);
  bossInterval = setInterval(() => {
    bossTimer--;
    renderBoss();
    if (bossTimer <= 0) bossEscape();
  }, 1000);
}

function clickBoss() {
  if (!bossActive) return;
  bossHP -= Math.max(1, Math.floor(bossMaxHP / 25));
  spawnBossHitParticle();
  document.getElementById("bossEmoji").classList.add("bossHit");
  setTimeout(() => document.getElementById("bossEmoji").classList.remove("bossHit"), 150);
  renderBoss();
  if (bossHP <= 0) bossDefeat();
}

function bossDefeat() {
  clearInterval(bossInterval);
  bossActive = false;
  bossesDefeated++;
  const reward = Math.floor(perSec * 60 + stableHorses.reduce((a,h)=>a+h.income,0) * 60 + 5000);
  coins += reward;
  totalCoinsEarned += reward;
  document.getElementById("bossOverlay").style.display = "none";
  showFloatingText("🌽 DÉMON PORAŽEN! +" + formatCoins(reward) + " coinů!", "#ffe066", true);
  checkAchievements();
  scheduleBoss();
  update();
  saveGame();
}

function bossEscape() {
  clearInterval(bossInterval);
  bossActive = false;
  const stolen = Math.floor(coins * 0.08 + 1000);
  coins = Math.max(0, coins - stolen);
  document.getElementById("bossOverlay").style.display = "none";
  showFloatingText("🌽 Démon utekl a ukradl " + formatCoins(stolen) + " coinů!", "#ff4444", false);
  scheduleBoss();
  update();
  saveGame();
}

function renderBoss() {
  const pct = Math.max(0, bossHP / bossMaxHP);
  document.getElementById("bossHPBar").style.width = (pct * 100) + "%";
  document.getElementById("bossHPText").innerText = formatCoins(Math.max(0,bossHP)) + " / " + formatCoins(bossMaxHP);
  document.getElementById("bossTimerText").innerText = "⏱ " + bossTimer + "s";
  const timerEl = document.getElementById("bossTimerText");
  timerEl.style.color = bossTimer <= 10 ? "#ff4444" : "#ffe066";
}

function scheduleBoss() {
  const delay = (120 + Math.floor(Math.random() * 120)) * 1000; // 2–4 minuty
  bossNextIn = Math.floor(delay / 1000);
  setTimeout(spawnBoss, delay);
}

function spawnBossHitParticle() {
  const el = document.getElementById("bossEmoji");
  const rect = el.getBoundingClientRect();
  const emojis = ["💥","🌽","✨","⚡"];
  for (let i = 0; i < 3; i++) {
    const p = document.createElement("div");
    p.className = "bossParticle";
    p.innerText = emojis[Math.floor(Math.random()*emojis.length)];
    p.style.left = (rect.left + rect.width/2 + (Math.random()-0.5)*80) + "px";
    p.style.top  = (rect.top  + rect.height/2 + (Math.random()-0.5)*60) + "px";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function showFloatingText(msg, color, positive) {
  const el = document.createElement("div");
  el.className = "floatingText";
  el.innerText = msg;
  el.style.color = color;
  el.style.top = (window.innerHeight / 2 - 60) + "px";
  el.style.left = "50%";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ─── UI refs ─────────────────────────────
const coinsText = document.getElementById("coins");
const statsText = document.getElementById("stats");
const horseBtn  = document.getElementById("horseBtn");

// ─── UPGRADES ───────────────────────────
const upgradeDefaults = {
  horse:         { cost: 50,        income: 1      },
  stable:        { cost: 200,       income: 5      },
  farm:          { cost: 1000,      income: 20     },
  naraz1:        { cost: 50000,     income: 500    },
  naraz2:        { cost: 250000,    income: 2000   },
  kotliseBazeny: { cost: 1000000,   income: 8000   },
  workshop:      { cost: 5000000,   income: 25000  },
  rodokmeny:     { cost: 100000000, income: 500000 },
  olga:          { cost: 500000,    income: 3000   },
  elektrokotel:  { cost: 2000000,   income: 10000  },
};

const upgradeCounts = {};
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
  setTimeout(scheduleBoss, 15000); // první boss za 15 sekund od startu
}

// ─── CLICK ───────────────────────────────
horseBtn.addEventListener("click", () => {
  coins += 1;
  totalCoinsEarned += 1;
  spawnCoinParticle();
  update();
  saveGame();
});

function spawnCoinParticle() {
  const p = document.createElement("div");
  p.className = "coinParticle";
  p.innerText = "🪙";
  const rect = horseBtn.getBoundingClientRect();
  p.style.left = (rect.left + rect.width/2 + (Math.random()-0.5)*60) + "px";
  p.style.top  = (rect.top  + rect.height/2) + "px";
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 900);
}

// ─── PEP ─────────────────────────────────
document.getElementById("pepBtn").addEventListener("click", () => {
  const s = document.getElementById("horseSound");
  s.currentTime = 0; s.play();
  document.getElementById("pepBtn").classList.add("pepPop");
  setTimeout(() => document.getElementById("pepBtn").classList.remove("pepPop"), 200);
});

// ─── BUY MULTIPLIER ──────────────────────
function setBuyMultiplier(n) {
  buyMultiplier = n;
  document.querySelectorAll(".buyMultBtn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.mul) === n);
  });
  renderPrices();
}

function calcBulkCost(name, count) {
  const upg = upgrades[name];
  if (!upg) return Infinity;
  let total = 0, cost = upg.cost;
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
  if (coins < totalCost) {
    // Shake animace
    const btn = document.getElementById("shopBtn-" + name);
    if (btn) { btn.classList.add("cantAffordShake"); setTimeout(()=>btn.classList.remove("cantAffordShake"),400); }
    return;
  }
  coins -= totalCost;
  for (let i = 0; i < count; i++) {
    perSec += upgrades[name].income;
    upgrades[name].cost = Math.floor(upgrades[name].cost * 1.15);
    upgradeCounts[name] = (upgradeCounts[name] || 0) + 1;
  }
  // Nákup animace
  const btn = document.getElementById("shopBtn-" + name);
  if (btn) { btn.classList.add("buyFlash"); setTimeout(()=>btn.classList.remove("buyFlash"),400); }
  renderPrices();
  update();
  saveGame();
}

// ─── 2× COINS ────────────────────────────
function buyDoubleCoins() {
  if (coins < 40000) return;
  coins -= 40000;
  doubleCoins = true;
  doubleCoinsTimer = 30;
  if (window._doubleCoinInterval) clearInterval(window._doubleCoinInterval);
  window._doubleCoinInterval = setInterval(() => {
    doubleCoinsTimer--;
    update();
    if (doubleCoinsTimer <= 0) { doubleCoins = false; clearInterval(window._doubleCoinInterval); update(); }
  }, 1000);
  update(); saveGame();
}

// ─── TICKET ──────────────────────────────
function buyTicket() {
  document.getElementById("ticketResult").innerText = "";
  document.getElementById("ticketModal").style.display = "flex";
}

function confirmTicket() {
  if (coins < 250000) { document.getElementById("ticketResult").innerText = "❌ Nemáš dost coinů!"; return; }
  coins -= 250000;
  const rng = Math.random();
  let msg = "";
  if (rng < 0.15) { coins += 5000000; totalCoinsEarned += 5000000; msg = "🎉 VÝHRA! +5 000 000 coins!"; }
  else if (rng < 0.50) { coins += 500000; totalCoinsEarned += 500000; msg = "😐 Malá výhra... +500 000 coins."; }
  else { msg = "💀 Smůla! Ztratil jsi vsázku."; }
  document.getElementById("ticketResult").innerText = msg;
  update(); saveGame();
}

// ─── SLOT MACHINE ────────────────────────
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
    el.innerText = "⏳ Čekej " + slotCooldownSeconds + "s";
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
  if (isNaN(val) || val <= 0) { document.getElementById("slotResult").innerText = "❌ Zadej platné číslo!"; return; }
  currentBet = val;
  document.getElementById("slotBetDisplay").innerText = "Vsazeno: " + formatCoins(currentBet);
}

function runSlot() {
  if (slotCooldownActive) { document.getElementById("slotResult").innerText = "⏳ Čekej " + slotCooldownSeconds + "s!"; return; }
  if (slotSpinsLeft <= 0) { startSlotCooldown(); return; }
  if (currentBet <= 0 || currentBet > coins) {
    document.getElementById("slotResult").innerText = currentBet <= 0 ? "❌ Zvol sázku!" : "❌ Nemáš dost coinů!";
    return;
  }
  coins -= currentBet; slotSpinsLeft--;
  const rng = Math.random();
  let msg = "";
  if (rng < 0.50) { msg = "😢 Prohra. Ztratil jsi " + formatCoins(currentBet); }
  else if (rng < 0.75) { coins += currentBet*2; totalCoinsEarned += currentBet*2; msg = "🎉 Výhra 2x! +" + formatCoins(currentBet*2); }
  else if (rng < 0.90) { coins += currentBet*3; totalCoinsEarned += currentBet*3; msg = "🔥 Výhra 3x! +" + formatCoins(currentBet*3); }
  else { coins += currentBet*10; totalCoinsEarned += currentBet*10; msg = "💎 JACKPOT 10x! +" + formatCoins(currentBet*10); }
  document.getElementById("slotResult").innerText = msg;
  if (slotSpinsLeft <= 0) startSlotCooldown();
  updateSlotSpinInfo(); update(); saveGame();
}

function startSlotCooldown() {
  slotCooldownActive = true; slotCooldownSeconds = 600;
  updateSlotSpinInfo();
  if (window._slotCooldownInterval) clearInterval(window._slotCooldownInterval);
  window._slotCooldownInterval = setInterval(() => {
    slotCooldownSeconds--;
    updateSlotSpinInfo();
    if (slotCooldownSeconds <= 0) { slotCooldownActive = false; slotSpinsLeft = 10; clearInterval(window._slotCooldownInterval); updateSlotSpinInfo(); }
  }, 1000);
}

// ─── ULTIMATE SLOT ───────────────────────
let ultimateBet = 0;
const ULTIMATE_SYMBOLS = ["🔴","🟡","🟠","🟢","💎","👑"];
const SYMBOL_MULT       = [0,   2,   5,   10,  25,  50 ];

function openUltimateSlot() {
  ultimateBet = 0;
  document.getElementById("ultimateBetDisplay").innerText = "Vsazeno: 0";
  document.getElementById("ultimateResult").innerText = "";
  document.getElementById("ultimateCustomBet").value = "";
  ["reel1","reel2","reel3"].forEach(id => document.getElementById(id).innerText = "❓");
  document.getElementById("ultimateModal").style.display = "flex";
}

function setUltimateBet(amount) {
  ultimateBet = amount;
  document.getElementById("ultimateBetDisplay").innerText = "Vsazeno: " + formatCoins(ultimateBet);
}

function setUltimateCustomBet() {
  const val = parseInt(document.getElementById("ultimateCustomBet").value);
  if (isNaN(val) || val < 500000) { document.getElementById("ultimateResult").innerText = "❌ Min. vklad je 500 000!"; return; }
  ultimateBet = val;
  document.getElementById("ultimateBetDisplay").innerText = "Vsazeno: " + formatCoins(ultimateBet);
}

function spinUltimate() {
  if (ultimateBet < 500000) { document.getElementById("ultimateResult").innerText = "❌ Min. vklad je 500 000!"; return; }
  if (ultimateBet > coins)  { document.getElementById("ultimateResult").innerText = "❌ Nemáš dost coinů!"; return; }
  coins -= ultimateBet;
  document.getElementById("spinBtn").disabled = true;
  document.getElementById("ultimateResult").innerText = "";
  let ticks = 0;
  const interval = setInterval(() => {
    ticks++;
    ["reel1","reel2","reel3"].forEach(id => {
      document.getElementById(id).innerText = ULTIMATE_SYMBOLS[Math.floor(Math.random()*ULTIMATE_SYMBOLS.length)];
    });
    if (ticks >= 20) {
      clearInterval(interval);
      const rng = Math.random();
      let symIdx;
      if      (rng < 0.50) symIdx = 0;
      else if (rng < 0.70) symIdx = 1;
      else if (rng < 0.84) symIdx = 2;
      else if (rng < 0.93) symIdx = 3;
      else if (rng < 0.98) symIdx = 4;
      else                 symIdx = 5;
      let s1, s2, s3;
      if (symIdx === 0) { s1 = ULTIMATE_SYMBOLS[0]; s2 = ULTIMATE_SYMBOLS[1]; s3 = ULTIMATE_SYMBOLS[2]; }
      else { s1 = s2 = s3 = ULTIMATE_SYMBOLS[symIdx]; }
      document.getElementById("reel1").innerText = s1;
      document.getElementById("reel2").innerText = s2;
      document.getElementById("reel3").innerText = s3;
      const mult = SYMBOL_MULT[symIdx];
      const payout = ultimateBet * mult;
      coins += payout;
      if (payout > 0) totalCoinsEarned += payout;
      document.getElementById("ultimateResult").innerText = mult === 0
        ? "💀 Prohra! Ztratil jsi " + formatCoins(ultimateBet)
        : "🎉 VÝHRA " + mult + "x! +" + formatCoins(payout) + " coins!";
      document.getElementById("spinBtn").disabled = false;
      update(); saveGame();
    }
  }, 80);
  update();
}

// ─── NEMOVITOSTI ─────────────────────────
function buyUFO() {
  if (hasUFO) { showToast("UFO už vlastníš!"); return; }
  if (coins < 10000000000) { showToast("Nemáš dost coinů! (10B)"); return; }
  coins -= 10000000000; hasUFO = true;
  animateBuy("ufoPrestigeBtn");
  showToast("🛸 UFO zakoupeno! +100M coins / 30s");
  update(); saveGame();
}

function buyGarageKotlise() {
  if (hasGarageKotlise) { showToast("Garáž Kotlise už vlastníš!"); return; }
  if (coins < 5000000000) { showToast("Nemáš dost coinů! (5B)"); return; }
  coins -= 5000000000; hasGarageKotlise = true;
  animateBuy("garageKotliseBtn");
  showToast("🚗 Garáž Kotlise zakoupena! +50M coins / 30s");
  update(); saveGame();
}

function buyKotliseCar() {
  if (hasKotliseCar) { showToast("Kotlise Auto už vlastníš!"); return; }
  if (coins < 60000) { showToast("Nemáš dost coinů! (60 000)"); return; }
  coins -= 60000; hasKotliseCar = true;
  animateBuy("kotliseCarBtn");
  showToast("🏎️ Kotlise Auto zakoupeno! +3 000 coins / 30s");
  update(); saveGame();
}

function animateBuy(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("buyFlash");
  setTimeout(() => el.classList.remove("buyFlash"), 500);
}

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("toastShow"), 10);
  setTimeout(() => { t.classList.remove("toastShow"); setTimeout(() => t.remove(), 400); }, 2500);
}

function openNemovitosti() {
  let html = "";
  if (hasKotliseCar)    html += "<div class='nemItem nemCar'>🏎️ Kotlise Auto – +3 000 coins / 30s</div>";
  if (hasGarageKotlise) html += "<div class='nemItem nemGarage'>🚗 Garáž Kotlise – +50M coins / 30s</div>";
  if (hasUFO)           html += "<div class='nemItem nemUfo'>🛸 UFO – +100M coins / 30s</div>";
  if (!hasUFO && !hasGarageKotlise && !hasKotliseCar) html = "<p style='color:#888;text-align:center;padding:20px'>Žádné nemovitosti.</p>";
  document.getElementById("nemovitostiList").innerHTML = html;
  document.getElementById("nemovitostiModal").style.display = "flex";
}

// ─── STÁJ ────────────────────────────────
const HORSE_NAMES  = ["Blesk","Hrom","Vítr","Pepík","Kotlík","Šifka"];
const HORSE_EMOJIS = ["🐎","🐴","🦄","🐗","🐂","🦓"];

function openStable() {
  renderStableModal();
  document.getElementById("stableModal").style.display = "flex";
}

function renderStableModal() {
  const listEl = document.getElementById("stableHorseList");

  let addHtml = "";
  if (stableHorses.length < MAX_HORSES) {
    const newHorseCost = 10000 * Math.pow(2, stableHorses.length);
    addHtml = `<button class="stableAddBtn" onclick="addHorse()">
      ➕ Přidat koně &nbsp;<span class="stableAddCost">${formatCoins(newHorseCost)} coins</span>
    </button>`;
  } else {
    addHtml = `<div class="stableFullMsg">🏠 Stáj je plná! (max ${MAX_HORSES})</div>`;
  }

  const horsesHtml = stableHorses.map((h, i) => {
    const lvl = h.level;
    const maxed = lvl >= MAX_HORSE_LEVEL;
    const levelCost = Math.floor(500 * Math.pow(1.2, lvl));
    const pct = (lvl / MAX_HORSE_LEVEL) * 100;
    return `<div class="stableHorseCard" id="horseCard-${i}">
      <div class="stableHorseLeft">
        <div class="stableHorseEmoji">${h.emoji}</div>
        <div class="stableHorseLvlBadge">Lv${lvl}</div>
      </div>
      <div class="stableHorseInfo">
        <div class="stableHorseName">${h.name}</div>
        <div class="stableHorseIncome">+${formatCoins(h.income)}/sec</div>
        <div class="stableHorseLvlBar">
          <div class="stableHorseLvlFill" style="width:${pct}%"></div>
        </div>
        <div class="stableHorseLvlText">${lvl} / ${MAX_HORSE_LEVEL}</div>
      </div>
      ${maxed
        ? `<div class="stableLvlBtn maxed">✨ MAX</div>`
        : `<button class="stableLvlBtn" onclick="levelHorse(${i})">
             Doučko<br><span class="lvlCost">${formatCoins(levelCost)}</span>
           </button>`}
    </div>`;
  }).join("");

  listEl.innerHTML = addHtml + (horsesHtml || `<div class="stableEmptyMsg">🐴 Zatím nemáš žádného koně.<br>Kup prvního výše!</div>`);
}

function addHorse() {
  if (stableHorses.length >= MAX_HORSES) return;
  const cost = 10000 * Math.pow(2, stableHorses.length);
  if (coins < cost) { showToast("Nemáš dost coinů!"); return; }
  coins -= cost;
  const idx = stableHorses.length;
  stableHorses.push({ name: HORSE_NAMES[idx]||"Kůň "+(idx+1), emoji: HORSE_EMOJIS[idx]||"🐎", level: 1, income: 100*(idx+1) });
  renderStableModal();
  update(); saveGame();
}

function levelHorse(idx) {
  const h = stableHorses[idx];
  if (!h || h.level >= MAX_HORSE_LEVEL) return;
  const cost = Math.floor(500 * Math.pow(1.2, h.level));
  if (coins < cost) { showToast("Nemáš dost coinů!"); return; }
  coins -= cost;
  h.level++;
  h.income = Math.floor(h.income * 1.10);
  // Animace karty
  const card = document.getElementById("horseCard-" + idx);
  if (card) { card.classList.add("levelUpFlash"); setTimeout(()=>card.classList.remove("levelUpFlash"), 600); }
  renderStableModal();
  update(); saveGame();
}

// ─── INFO ────────────────────────────────
function openInfo() { document.getElementById("infoModal").style.display = "flex"; }

// ─── MODAL HELPERS ───────────────────────
function closeModal(id) { document.getElementById(id).style.display = "none"; }

document.querySelectorAll(".modal").forEach(m => {
  m.addEventListener("click", e => { if (e.target === m) m.style.display = "none"; });
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
  // Koně přidávají /sec přímo
  stableHorses.forEach(h => { income += h.income; });
  coins += income;
  totalCoinsEarned += income;
  update();
}, 1000);

// Nemovitosti – každých 30s
setInterval(() => {
  let bonus = 0;
  if (hasUFO)           bonus += 100000000;
  if (hasGarageKotlise) bonus += 50000000;
  if (hasKotliseCar)    bonus += 3000;
  if (bonus > 0) { coins += bonus; totalCoinsEarned += bonus; update(); }
}, 30000);

// Auto-save
setInterval(() => { saveGame(); }, 5000);

// ─── UPDATE ──────────────────────────────
function update() {
  coinsText.innerText = formatCoins(Math.floor(coins));

  let effectivePerSec = perSec;
  stableHorses.forEach(h => { effectivePerSec += h.income; });
  if (doubleCoins) effectivePerSec *= 2;

  let statsStr = "Výdělek za sekundu: " + formatCoins(Math.floor(effectivePerSec));
  if (doubleCoins) statsStr += " (2× – " + doubleCoinsTimer + "s)";
  statsText.innerText = statsStr;

  // Nemovitosti – canAfford + owned
  updateNemBtn("ufoPrestigeBtn",    !hasUFO,           coins >= 10000000000);
  updateNemBtn("garageKotliseBtn",  !hasGarageKotlise, coins >= 5000000000);
  updateNemBtn("kotliseCarBtn",     !hasKotliseCar,    coins >= 60000);

  checkAchievements();
  renderPrices();
}

function updateNemBtn(id, notOwned, canAfford) {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (!notOwned) {
    btn.style.opacity = "0.45";
    btn.style.cursor = "default";
    btn.classList.remove("canAfford");
  } else {
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    btn.classList.toggle("canAfford", canAfford);
  }
}

// ─── FORMAT ──────────────────────────────
function formatCoins(n) {
  if (n >= 1e12) return (n/1e12).toFixed(2)+"T";
  if (n >= 1e9)  return (n/1e9).toFixed(2)+"B";
  if (n >= 1e6)  return (n/1e6).toFixed(2)+"M";
  if (n >= 1000) return (n/1000).toFixed(1)+"K";
  return String(Math.floor(n));
}

// ─── ACHIEVEMENTS ────────────────────────
const ACHIEVEMENT_DEFS = [
  { id:"coins1k",    label:"💰 1K Coins",         check: ()=> totalCoinsEarned >= 1000 },
  { id:"coins100k",  label:"💵 100K Coins",        check: ()=> totalCoinsEarned >= 100000 },
  { id:"coins1m",    label:"🔥 1M Coins",          check: ()=> totalCoinsEarned >= 1000000 },
  { id:"coins1b",    label:"💎 1B Coins",          check: ()=> totalCoinsEarned >= 1000000000 },
  { id:"ufo",        label:"🛸 UFO Vlastník",      check: ()=> hasUFO },
  { id:"garage",     label:"🚗 Garáž Kotlise",     check: ()=> hasGarageKotlise },
  { id:"car",        label:"🏎️ Kotlise Auto",      check: ()=> hasKotliseCar },
  { id:"stajnik",    label:"🐎 Stájník",           check: ()=> stableHorses.length > 0 },
  { id:"horse6",     label:"🐴 Plná Stáj",         check: ()=> stableHorses.length >= 6 },
  { id:"boss1",      label:"🌽 Démon Přemožen",    check: ()=> bossesDefeated >= 1 },
  { id:"boss5",      label:"👹 Démon Poražen 5×",  check: ()=> bossesDefeated >= 5 },
  { id:"lvl50",      label:"⭐ Kůň Max Level",     check: ()=> stableHorses.some(h=>h.level>=50) },
];

function checkAchievements() {
  let changed = false;
  ACHIEVEMENT_DEFS.forEach(def => {
    if (!unlockedAchievements.has(def.id) && def.check()) {
      unlockedAchievements.add(def.id);
      changed = true;
      // Popup notifikace
      showAchievementPopup(def.label);
    }
  });
  renderAchievements();
  if (changed) saveGame();
}

function renderAchievements() {
  const html = ACHIEVEMENT_DEFS
    .filter(d => unlockedAchievements.has(d.id))
    .map(d => `<div class="achievItem">${d.label}</div>`)
    .join("");
  document.getElementById("achievementList").innerHTML = html || "<span style='color:#555;font-size:12px'>Zatím žádné...</span>";
}

function showAchievementPopup(label) {
  const el = document.createElement("div");
  el.className = "achievPopup";
  el.innerHTML = `🏆 Achievement odemčen!<br><strong>${label}</strong>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("achievPopupShow"), 10);
  setTimeout(() => { el.classList.remove("achievPopupShow"); setTimeout(()=>el.remove(), 500); }, 3000);
}

// ─── RENDER PRICES ───────────────────────
function renderPrices() {
  const map = {
    horsePrice:"horse", stablePrice:"stable", farmPrice:"farm",
    naraz1Price:"naraz1", naraz2Price:"naraz2",
    kotliseBazenPrice:"kotliseBazeny", workshopPrice:"workshop",
    rodokmenPrice:"rodokmeny", olgaPrice:"olga", elektrokotelPrice:"elektrokotel",
  };
  for (const [elId, key] of Object.entries(map)) {
    const el = document.getElementById(elId);
    if (!el || !upgrades[key]) continue;
    const total = calcBulkCost(key, buyMultiplier);
    const canAfford = coins >= total;
    el.innerText = formatCoins(total) + (buyMultiplier > 1 ? " (×"+buyMultiplier+")" : "");
    // Zbarví cenu
    el.style.color = canAfford ? "#86efac" : "#ff6666";
    const btn = document.getElementById("shopBtn-"+key);
    if (btn) btn.classList.toggle("shopAffordable", canAfford);
  }
}

// ─── SAVE / LOAD ─────────────────────────
function saveGame() {
  if (!userKey) return;
  localStorage.setItem(userKey+"_save", JSON.stringify({
    coins, perSec, upgrades, upgradeCounts,
    hasUFO, hasGarageKotlise, hasKotliseCar, hasElectroBoiler,
    stableHorses, slotSpinsLeft, slotCooldownActive, slotCooldownSeconds,
    unlockedAchievements: [...unlockedAchievements],
    totalCoinsEarned, bossesDefeated,
  }));
}

function loadGame() {
  const raw = localStorage.getItem(userKey+"_save");
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    coins            = d.coins            || 0;
    perSec           = d.perSec           || 0;
    hasUFO           = d.hasUFO           || false;
    hasGarageKotlise = d.hasGarageKotlise || false;
    hasKotliseCar    = d.hasKotliseCar    || false;
    hasElectroBoiler = d.hasElectroBoiler || false;
    stableHorses     = d.stableHorses     || [];
    slotSpinsLeft    = d.slotSpinsLeft    ?? 10;
    slotCooldownActive  = d.slotCooldownActive  || false;
    slotCooldownSeconds = d.slotCooldownSeconds || 0;
    totalCoinsEarned = d.totalCoinsEarned || 0;
    bossesDefeated   = d.bossesDefeated   || 0;
    if (d.unlockedAchievements) unlockedAchievements = new Set(d.unlockedAchievements);
    if (d.upgrades)      Object.assign(upgrades, d.upgrades);
    if (d.upgradeCounts) Object.assign(upgradeCounts, d.upgradeCounts);
    renderPrices();
    if (slotCooldownActive && slotCooldownSeconds > 0) startSlotCooldown();
  } catch(e) { console.error("Load error:", e); }
}
