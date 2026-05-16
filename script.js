// ═══════════════════════════════════════
//  PEP CLICKER 2.0 – script.js
// ═══════════════════════════════════════

let coins = 0;
let perSec = 0;
let doubleCoins = false;
let doubleCoinsTimer = 0;
let userKey = "";

let hasUFO = false;
let hasGarageKotlise = false;
let hasKotliseCar = false;
let hasElectroBoiler = false;

let stableHorses = [];
const MAX_HORSES = 6;
const MAX_HORSE_LEVEL = 50;

let slotSpinsLeft = 10;
let slotCooldownActive = false;
let slotCooldownSeconds = 0;

// ─── ULTIMATE SLOT – 10 spinů / 30 minut ──
let ultimateSpinsLeft = 10;
let ultimateCooldownActive = false;
let ultimateCooldownSeconds = 0;

let buyMultiplier = 1;

let unlockedAchievements = new Set();
let totalCoinsEarned = 0;
let bossesDefeated = 0;
let bossKills = { corn: 0, ladych: 0, shifi: 0, olga: 0 };

// ─── RESEARCH BONUSY (globální multiplikatéry) ───────────────
const researchBonuses = {
  clickMult:    1,    // klikání
  incomeMult:   1,    // celkový příjem /sec
  bossReward:   1,    // reward od bossů
  slotWinMult:  1,    // výhry ze slotů
  horseMult:    1,    // příjem stáje
};

// ─── VÝZKUM DEFINICE ─────────────────────────────────────────
const RESEARCH_DEFS = [
  // PRODUKCE
  { id:"r_income1",   cat:"Produkce", icon:"⚡", name:"Efektivní Kotle",       desc:"Základní zlepšení všech příjmů.",            effect:"+10% příjem /sec",   cost:500000,   timeSec:60,    bonus:()=>{ researchBonuses.incomeMult   *= 1.10; }, requires:[] },
  { id:"r_income2",   cat:"Produkce", icon:"🔥", name:"Kotlisova Pec",          desc:"Pokročilé vytápění zvyšuje příjmy.",          effect:"+20% příjem /sec",   cost:2000000,  timeSec:180,   bonus:()=>{ researchBonuses.incomeMult   *= 1.20; }, requires:["r_income1"] },
  { id:"r_income3",   cat:"Produkce", icon:"🏭", name:"Průmyslová Revoluce",    desc:"Masivní navýšení produkce.",                  effect:"+40% příjem /sec",   cost:20000000, timeSec:600,   bonus:()=>{ researchBonuses.incomeMult   *= 1.40; }, requires:["r_income2"] },
  // KLIKÁNÍ
  { id:"r_click1",    cat:"Klikání",  icon:"👆", name:"Pep Prsty",              desc:"Trénink pro rychlejší klikání.",              effect:"+5 coinů/klik",      cost:100000,   timeSec:30,    bonus:()=>{ researchBonuses.clickMult   += 5; }, requires:[] },
  { id:"r_click2",    cat:"Klikání",  icon:"✋", name:"Ládychova Ruka",         desc:"Silnější údery přinášejí více coinů.",        effect:"+20 coinů/klik",     cost:800000,   timeSec:120,   bonus:()=>{ researchBonuses.clickMult   += 20; }, requires:["r_click1"] },
  { id:"r_click3",    cat:"Klikání",  icon:"🤜", name:"Kotlisův Pěstní Úder",  desc:"Monumentální síla kliku.",                   effect:"+100 coinů/klik",    cost:10000000, timeSec:360,   bonus:()=>{ researchBonuses.clickMult   += 100; }, requires:["r_click2"] },
  // STÁJ
  { id:"r_horse1",    cat:"Stáj",     icon:"🐎", name:"Lepší Seno",             desc:"Koně jsou spokojení a vydělávají víc.",       effect:"+15% příjem stáje",  cost:200000,   timeSec:45,    bonus:()=>{ researchBonuses.horseMult   *= 1.15; }, requires:[] },
  { id:"r_horse2",    cat:"Stáj",     icon:"🦄", name:"Shifiny Genetika",       desc:"Šlechtění výkonnějších koní.",                effect:"+30% příjem stáje",  cost:3000000,  timeSec:240,   bonus:()=>{ researchBonuses.horseMult   *= 1.30; }, requires:["r_horse1"] },
  // BOSSOVÉ
  { id:"r_boss1",     cat:"Bossové",  icon:"⚔️", name:"Antikorová Zbroj",       desc:"Lépe se bráníš boss útokům.",                effect:"+15% boss reward",   cost:1000000,  timeSec:90,    bonus:()=>{ researchBonuses.bossReward  *= 1.15; }, requires:[] },
  { id:"r_boss2",     cat:"Bossové",  icon:"🗡️", name:"Ládychův Meč",           desc:"Silnější klik na bosse.",                     effect:"+30% boss reward",   cost:8000000,  timeSec:300,   bonus:()=>{ researchBonuses.bossReward  *= 1.30; }, requires:["r_boss1"] },
  // GAMBLING
  { id:"r_slot1",     cat:"Gambling", icon:"🎰", name:"Šťastná Ruka",           desc:"Lepší šance v automatech.",                  effect:"+10% výhry slotů",   cost:500000,   timeSec:60,    bonus:()=>{ researchBonuses.slotWinMult *= 1.10; }, requires:[] },
  { id:"r_slot2",     cat:"Gambling", icon:"💎", name:"Kotlisův Systém",        desc:"Pokročilá analýza automatů.",                effect:"+25% výhry slotů",   cost:5000000,  timeSec:240,   bonus:()=>{ researchBonuses.slotWinMult *= 1.25; }, requires:["r_slot1"] },
];

let researchDone    = new Set();     // dokončené výzkumy
let researchActive  = null;          // { id, endsAt }  – aktivní výzkum
let researchTimerInterval = null;

function canResearch(def) {
  return def.requires.every(r => researchDone.has(r));
}

function startResearch(id) {
  if (researchActive) { showToast("Výzkum už probíhá!"); return; }
  if (researchDone.has(id)) { showToast("Výzkum už dokončen!"); return; }
  const def = RESEARCH_DEFS.find(d => d.id === id);
  if (!def) return;
  if (!canResearch(def)) { showToast("Nejprve dokonči předchozí výzkum!"); return; }
  if (coins < def.cost) {
    showToast("Nemáš dost coinů!"); return;
  }
  coins -= def.cost;
  const endsAt = Date.now() + def.timeSec * 1000;
  researchActive = { id, endsAt };
  startResearchTimer();
  renderResearchModal();
  update(); saveGame();
}

function startResearchTimer() {
  if (researchTimerInterval) clearInterval(researchTimerInterval);
  researchTimerInterval = setInterval(() => {
    if (!researchActive) { clearInterval(researchTimerInterval); return; }
    if (Date.now() >= researchActive.endsAt) {
      const def = RESEARCH_DEFS.find(d => d.id === researchActive.id);
      if (def) { def.bonus(); researchDone.add(def.id); }
      showAchievementPopup("🔬 Výzkum dokončen: " + def.name);
      researchActive = null;
      clearInterval(researchTimerInterval);
      renderResearchModal();
      update(); saveGame();
    } else {
      renderResearchModal();
    }
  }, 1000);
}

function openResearch() {
  renderResearchModal();
  document.getElementById("researchModal").style.display = "flex";
}

function renderResearchModal() {
  const list = document.getElementById("researchList");
  const cats = [...new Set(RESEARCH_DEFS.map(d => d.cat))];
  let html = "";
  cats.forEach(cat => {
    html += `<div class="researchCategory"><div class="researchCatTitle">${cat}</div>`;
    RESEARCH_DEFS.filter(d => d.cat === cat).forEach(def => {
      const done    = researchDone.has(def.id);
      const active  = researchActive && researchActive.id === def.id;
      const locked  = !canResearch(def) && !done;
      const avail   = !done && !active && !locked;
      let stateClass = done ? "researchDone" : (active ? "researchAvail" : (locked ? "researchLocked" : "researchAvail"));
      let actionHtml = "";
      if (done) {
        actionHtml = `<div class="researchDoneBadge">✅ Hotovo</div>`;
      } else if (active) {
        const secsLeft = Math.max(0, Math.ceil((researchActive.endsAt - Date.now()) / 1000));
        const mins = Math.floor(secsLeft / 60), secs = secsLeft % 60;
        actionHtml = `<div class="researchTimerWrap"><span class="researchTimerText">${mins}:${String(secs).padStart(2,"0")}</span><span class="researchTimerSub">zbývá</span></div>`;
      } else if (locked) {
        actionHtml = `<div style="font-size:11px;color:rgba(255,255,255,0.25);text-align:center">🔒 zamčeno</div>`;
      } else {
        actionHtml = `<button class="researchBtn" onclick="startResearch('${def.id}')">Zkoumat<br><span style="font-size:10px;color:rgba(191,95,255,0.65)">${formatCoins(def.cost)}</span></button>`;
      }
      html += `<div class="researchItem ${stateClass}">
        <div class="researchItemIcon">${def.icon}</div>
        <div class="researchItemInfo">
          <div class="researchItemName">${def.name}</div>
          <div class="researchItemDesc">${def.desc}</div>
          <div class="researchItemEffect">${def.effect}</div>
        </div>
        <div class="researchTimerWrap">${actionHtml}</div>
      </div>`;
    });
    html += `</div>`;
  });
  list.innerHTML = html;
}

// ─── TAJNÝ OBCHOD ────────────────────────────────────────────
let secretShopActive   = false;
let secretShopCountdown = 0;
let secretShopDeals    = [];
let secretShopInterval = null;
let secretShopTimer    = null;

const SECRET_DEALS_POOL = [
  { id:"deal_double",    icon:"✨", name:"2× Coins x2 ZDARMA",  desc:"Aktivuje 2× coins boost na 60 sekund!", origCost:"80 000", saleCost:0,      saleLabel:"ZDARMA", action:()=>{ doubleCoins=true; doubleCoinsTimer=60; activateDoubleCoinTimer(); showToast("✨ 2× Coins aktivován na 60s!"); } },
  { id:"deal_coins1",    icon:"💰", name:"Balík 500K Coinů",     desc:"Přímý bonus do peněženky.",            origCost:"1M",     saleCost:200000, saleLabel:"200K",   action:()=>{ coins+=500000; totalCoinsEarned+=500000; showToast("💰 +500 000 coinů!"); } },
  { id:"deal_coins2",    icon:"💎", name:"Balík 5M Coinů",       desc:"Masivní bonus pro zkušené hráče.",     origCost:"8M",     saleCost:2000000, saleLabel:"2M",    action:()=>{ coins+=5000000; totalCoinsEarned+=5000000; showToast("💎 +5 000 000 coinů!"); } },
  { id:"deal_spins",     icon:"🎰", name:"10 Extra Spinů",       desc:"Doplní spiny v automatu na max.",      origCost:"150K",   saleCost:50000,  saleLabel:"50K",    action:()=>{ slotSpinsLeft=10; slotCooldownActive=false; showToast("🎰 Spiny doplněny!"); } },
  { id:"deal_ultspins",  icon:"👑", name:"5 Ultimate Spinů",     desc:"Doplní ultimate spiny.",               origCost:"300K",   saleCost:100000, saleLabel:"100K",   action:()=>{ ultimateSpinsLeft=Math.min(10,ultimateSpinsLeft+5); ultimateCooldownActive=false; showToast("👑 +5 Ultimate Spinů!"); } },
  { id:"deal_horse",     icon:"🐎", name:"Kůň Zdarma",           desc:"Přidá nového koně do stáje bez ceny.", origCost:"Různé",  saleCost:0,      saleLabel:"ZDARMA", action:()=>{ if(stableHorses.length < MAX_HORSES){ const i=stableHorses.length; stableHorses.push({name:HORSE_NAMES[i]||"Kůň"+(i+1),emoji:HORSE_EMOJIS[i]||"🐎",level:1,income:100*(i+1)}); showToast("🐎 Nový kůň přidán do stáje!"); } else showToast("Stáj je plná!"); } },
  { id:"deal_boost",     icon:"⚡", name:"Mega Boost 5 minut",   desc:"+500% příjmu na 5 minut.",             origCost:"2M",     saleCost:500000, saleLabel:"500K",   action:()=>{ activateMegaBoost(300); showToast("⚡ Mega Boost aktivován na 5 minut!"); } },
];

let megaBoostActive = false;
let megaBoostTimer  = 0;

function activateMegaBoost(seconds) {
  megaBoostActive = true; megaBoostTimer = seconds;
  if (window._megaBoostInterval) clearInterval(window._megaBoostInterval);
  window._megaBoostInterval = setInterval(() => {
    megaBoostTimer--;
    if (megaBoostTimer <= 0) { megaBoostActive = false; clearInterval(window._megaBoostInterval); update(); }
    else update();
  }, 1000);
}

function activateDoubleCoinTimer() {
  if (window._doubleCoinInterval) clearInterval(window._doubleCoinInterval);
  window._doubleCoinInterval = setInterval(() => {
    doubleCoinsTimer--;
    update();
    if (doubleCoinsTimer <= 0) { doubleCoins = false; clearInterval(window._doubleCoinInterval); update(); }
  }, 1000);
}

function scheduleSecretShop() {
  const delay = (600 + Math.floor(Math.random() * 300)) * 1000; // 10–15 min
  if (secretShopTimer) clearTimeout(secretShopTimer);
  secretShopTimer = setTimeout(() => triggerSecretShop(), delay);
}

function triggerSecretShop() {
  // Vyber 2–3 náhodné dealy
  const shuffled = [...SECRET_DEALS_POOL].sort(() => Math.random()-.5);
  secretShopDeals = shuffled.slice(0, 2 + Math.floor(Math.random()*2));
  secretShopDeals.forEach(d => d.bought = false);
  secretShopActive   = true;
  secretShopCountdown = 180; // 3 minuty

  // Zobraz červenou tečku na tlačítku
  const btn = document.getElementById("secretShopTriggerBtn");
  if (btn) { btn.classList.add("secretShopPulse"); btn.innerText = "🤫 Tajný Obchod"; }

  showAchievementPopup("🤫 Tajný Obchod je otevřen! (3 min)");

  if (secretShopInterval) clearInterval(secretShopInterval);
  secretShopInterval = setInterval(() => {
    secretShopCountdown--;
    const cdEl = document.getElementById("secretCountdownEl");
    if (cdEl) cdEl.innerText = "Zavírá za " + secretShopCountdown + "s";
    if (secretShopCountdown <= 0) {
      closeSecretShop();
    }
  }, 1000);
}

function openSecretShop() {
  if (!secretShopActive) {
    showToast("Tajný obchod je zatím zavřený. Počkej...");
    return;
  }
  const mins = Math.floor(secretShopCountdown/60), secs = secretShopCountdown%60;
  let dealsHtml = secretShopDeals.map((d,i) => `
    <div class="secretDealItem">
      <div class="secretDealIcon">${d.icon}</div>
      <div class="secretDealInfo">
        <div class="secretDealName">${d.name}</div>
        <div class="secretDealDesc">${d.desc}</div>
        <div class="secretDealOrig">Normálně: ${d.origCost}</div>
        <div class="secretDealSale">Dnes jen: ${d.saleLabel}</div>
      </div>
      <button class="secretDealBuyBtn" id="secretDeal-${i}" onclick="buySecretDeal(${i})" ${d.bought?"disabled":""}>
        ${d.bought ? "✅ Koupeno" : "KOUPIT"}
      </button>
    </div>
  `).join("");

  document.getElementById("secretCountdownEl").innerText = "Zavírá za " + secretShopCountdown + "s";
  document.getElementById("secretDealsList").innerHTML = dealsHtml;
  document.getElementById("secretShopModal").style.display = "flex";
}

function buySecretDeal(idx) {
  const deal = secretShopDeals[idx];
  if (!deal || deal.bought) return;
  if (deal.saleCost > 0 && coins < deal.saleCost) { showToast("Nemáš dost coinů!"); return; }
  if (deal.saleCost > 0) coins -= deal.saleCost;
  deal.action();
  deal.bought = true;
  const btn = document.getElementById("secretDeal-" + idx);
  if (btn) { btn.disabled = true; btn.innerText = "✅ Koupeno"; }
  update(); saveGame();
}

function closeSecretShop() {
  secretShopActive = false;
  if (secretShopInterval) clearInterval(secretShopInterval);
  document.getElementById("secretShopModal").style.display = "none";
  const btn = document.getElementById("secretShopTriggerBtn");
  if (btn) { btn.classList.remove("secretShopPulse"); btn.innerText = "🤫 Tajný Obchod"; }
  scheduleSecretShop();
}

// ═══════════════════════════════════════
//  BOSS TYPY
// ═══════════════════════════════════════
const BOSS_TYPES = {
  corn: {
    id:"corn", name:"Kukuřičný Démon", emoji:"🌽",
    warning:"⚠️ KUKUŘIČNÝ DÉMON ÚTOČÍ! ⚠️",
    subtitle:"Klikej na démona než uteče!",
    tip:"Výhra: ~60s příjmu | Prohra: −8% coinů",
    bgGrad:"linear-gradient(145deg,rgba(80,20,0,0.97),rgba(30,0,0,0.99))",
    borderColor:"rgba(255,120,0,0.6)", glowColor:"rgba(255,80,0,0.5)",
    hpBarColor:"linear-gradient(90deg,#ff4400,#ffaa00,#ffe566)", timerColor:"#ffe066",
    hitParticles:["💥","🌽","✨","⚡"],
    hpMult:3, rewardMult:60, stealPct:0.08, bossTimer:30,
    defeatMsg:(r)=>`🌽 DÉMON PORAŽEN! +${formatCoins(r)} coinů!`,
    escapeMsg:(s)=>`🌽 Démon utekl a ukradl ${formatCoins(s)} coinů!`,
  },
  ladych: {
    id:"ladych", name:"Ládychův Traktor", emoji:"🚜",
    warning:"🚜 LÁDYCHŮV TRAKTOR PŘIJÍŽDÍ! 🚜",
    subtitle:"Zastav traktor dřív než tě přejede!",
    tip:"Výhra: ~80s příjmu | Prohra: −12% coinů",
    bgGrad:"linear-gradient(145deg,rgba(5,30,5,0.97),rgba(0,15,0,0.99))",
    borderColor:"rgba(80,220,80,0.6)", glowColor:"rgba(50,200,50,0.5)",
    hpBarColor:"linear-gradient(90deg,#1a7a00,#5dcc00,#aaff44)", timerColor:"#aaff66",
    hitParticles:["🔧","💨","🌾","💥"],
    hpMult:4, rewardMult:80, stealPct:0.12, bossTimer:30,
    defeatMsg:(r)=>`🚜 TRAKTOR ZASTAVEN! +${formatCoins(r)} coinů!`,
    escapeMsg:(s)=>`🚜 Ládych tě přejel a vzal ${formatCoins(s)} coinů!`,
  },
  shifi: {
    id:"shifi", name:"Shifin Duch", emoji:"👻",
    warning:"👻 SHIFIN DUCH SE ZJEVUJE! 👻",
    subtitle:"Exorcizuj ducha dřív než zmizí!",
    tip:"Výhra: ~100s příjmu | Prohra: −15% coinů",
    bgGrad:"linear-gradient(145deg,rgba(20,0,50,0.97),rgba(5,0,30,0.99))",
    borderColor:"rgba(180,80,255,0.6)", glowColor:"rgba(150,50,255,0.5)",
    hpBarColor:"linear-gradient(90deg,#6600cc,#aa44ff,#dd99ff)", timerColor:"#cc88ff",
    hitParticles:["👻","💜","✨","🔮"],
    hpMult:5, rewardMult:100, stealPct:0.15, bossTimer:30,
    defeatMsg:(r)=>`👻 DUCH VYHNÁN! +${formatCoins(r)} coinů!`,
    escapeMsg:(s)=>`👻 Shifin duch ukradl ${formatCoins(s)} coinů z druhé dimenze!`,
  },
  olga: {
    id:"olga", name:"Olga Kunysová", emoji:"👩‍🦳",
    warning:"💀 OLGA KUNYSOVÁ ÚTOČÍ! 💀",
    subtitle:"Olga se zbláznila! Exorcizuj ji rychle!",
    tip:"Výhra: ~150s příjmu | Prohra: −25% coinů",
    bgGrad:"linear-gradient(145deg,rgba(60,0,40,0.97),rgba(30,0,20,0.99))",
    borderColor:"rgba(255,50,200,0.6)", glowColor:"rgba(220,0,180,0.5)",
    hpBarColor:"linear-gradient(90deg,#8b0057,#dd0099,#ff66cc)", timerColor:"#ff99ee",
    hitParticles:["💥","👩‍🦳","💫","🩸"],
    hpMult:8, rewardMult:150, stealPct:0.25, bossTimer:25,
    defeatMsg:(r)=>`👩‍🦳 OLGA ZKROCENA! +${formatCoins(r)} coinů!`,
    escapeMsg:(s)=>`💀 Olga Kunysová zničila ${formatCoins(s)} coinů!`,
  },
};

let bossActive = false;
let currentBossType = null;
let bossHP = 0;
let bossMaxHP = 0;
let bossTimer = 0;
let bossInterval = null;

function spawnBoss(typeId) {
  if (bossActive) return;
  const boss = BOSS_TYPES[typeId]; if (!boss) return;
  bossActive = true; currentBossType = boss;
  bossMaxHP = Math.max(20, Math.floor(perSec * boss.hpMult + stableHorses.reduce((a,h)=>a+h.income,0)*boss.hpMult + 30));
  bossHP = bossMaxHP;
  bossTimer = boss.bossTimer;
  const overlay = document.getElementById("bossOverlay");
  const box = overlay.querySelector(".bossBox");
  box.style.background = boss.bgGrad;
  box.style.borderColor = boss.borderColor;
  box.style.border = "2px solid " + boss.borderColor;
  box.style.boxShadow = `0 0 80px ${boss.glowColor}, 0 24px 80px rgba(0,0,0,0.9)`;
  document.getElementById("bossWarningText").innerText = boss.warning;
  document.getElementById("bossWarningText").style.color = boss.timerColor;
  document.getElementById("bossNameEl").innerText = boss.name;
  document.getElementById("bossEmojiEl").innerText = boss.emoji;
  document.getElementById("bossEmojiEl").style.filter = `drop-shadow(0 0 30px ${boss.glowColor})`;
  document.getElementById("bossSubtitleEl").innerText = boss.subtitle;
  document.getElementById("bossTipEl").innerText = boss.tip;
  document.getElementById("bossHPBar").style.background = boss.hpBarColor;
  renderBoss();
  overlay.style.display = "flex";
  overlay.classList.add("bossAppear");
  setTimeout(()=>overlay.classList.remove("bossAppear"),600);
  if (bossInterval) clearInterval(bossInterval);
  bossInterval = setInterval(()=>{ bossTimer--; renderBoss(); if(bossTimer<=0) bossEscape(); },1000);
}

function clickBoss() {
  if (!bossActive || !currentBossType) return;
  bossHP -= Math.max(1, Math.floor(bossMaxHP / 25));
  spawnBossHitParticle();
  const emojiEl = document.getElementById("bossEmojiEl");
  emojiEl.classList.add("bossHit"); setTimeout(()=>emojiEl.classList.remove("bossHit"),150);
  renderBoss();
  if (bossHP <= 0) bossDefeat();
}

function bossDefeat() {
  clearInterval(bossInterval); bossActive = false; bossesDefeated++;
  const boss = currentBossType;
  bossKills[boss.id] = (bossKills[boss.id]||0) + 1;
  let reward = Math.floor((perSec * boss.rewardMult + stableHorses.reduce((a,h)=>a+h.income,0)*boss.rewardMult + 5000) * researchBonuses.bossReward);
  coins += reward; totalCoinsEarned += reward;
  document.getElementById("bossOverlay").style.display = "none";
  showFloatingText(boss.defeatMsg(reward), boss.timerColor);
  checkAchievements(); scheduleBoss(); update(); saveGame();
}

function bossEscape() {
  clearInterval(bossInterval); bossActive = false;
  const boss = currentBossType;
  const stolen = Math.floor(coins * boss.stealPct + 1000);
  coins = Math.max(0, coins - stolen);
  document.getElementById("bossOverlay").style.display = "none";
  showFloatingText(boss.escapeMsg(stolen), "#ff4444");
  scheduleBoss(); update(); saveGame();
}

function renderBoss() {
  const pct = Math.max(0, bossHP/bossMaxHP);
  document.getElementById("bossHPBar").style.width = (pct*100)+"%";
  document.getElementById("bossHPText").innerText = formatCoins(Math.max(0,bossHP))+" / "+formatCoins(bossMaxHP);
  document.getElementById("bossTimerText").innerText = "⏱ "+bossTimer+"s";
  const col = currentBossType ? currentBossType.timerColor : "#ffe066";
  document.getElementById("bossTimerText").style.color = bossTimer<=10 ? "#ff4444" : col;
}

function scheduleBoss() {
  const delay = (120 + Math.floor(Math.random()*120)) * 1000;
  setTimeout(()=>{
    const rng = Math.random();
    let pick = rng < 0.10 ? "olga" : ["corn","ladych","shifi"][Math.floor(Math.random()*3)];
    spawnBoss(pick);
  }, delay);
}

function spawnBossHitParticle() {
  if (!currentBossType) return;
  const el = document.getElementById("bossEmojiEl");
  const rect = el.getBoundingClientRect();
  const emojis = currentBossType.hitParticles;
  for (let i=0; i<4; i++) {
    const p = document.createElement("div");
    p.className = "bossParticle";
    p.innerText = emojis[Math.floor(Math.random()*emojis.length)];
    p.style.left = (rect.left+rect.width/2+(Math.random()-.5)*100)+"px";
    p.style.top  = (rect.top +rect.height/2+(Math.random()-.5)*80)+"px";
    document.body.appendChild(p);
    setTimeout(()=>p.remove(), 700);
  }
}

function showFloatingText(msg, color) {
  const el = document.createElement("div");
  el.className = "floatingText"; el.innerText = msg; el.style.color = color;
  el.style.top = (window.innerHeight/2-60)+"px"; el.style.left = "50%";
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 2400);
}

function openBossInfo() {
  const map = { corn:"killsCorn", ladych:"killsLadych", shifi:"killsShifi", olga:"killsOlga" };
  for (const [id, elId] of Object.entries(map)) {
    const el = document.getElementById(elId);
    if (el) el.innerText = (bossKills[id]||0)+"× poražen";
  }
  document.getElementById("bossInfoModal").style.display = "flex";
}

// ─── UI refs ─────────────────────────────
const coinsText = document.getElementById("coins");
const statsText = document.getElementById("stats");
const horseBtn  = document.getElementById("horseBtn");

// ─── UPGRADES ────────────────────────────
const upgradeDefaults = {
  horse:         { cost:50,        income:1      },
  stable:        { cost:200,       income:5      },
  farm:          { cost:1000,      income:20     },
  naraz1:        { cost:50000,     income:500    },
  naraz2:        { cost:250000,    income:2000   },
  kotliseBazeny: { cost:1000000,   income:8000   },
  workshop:      { cost:5000000,   income:25000  },
  rodokmeny:     { cost:100000000, income:500000 },
  olga:          { cost:500000,    income:3000   },
  elektrokotel:  { cost:2000000,   income:10000  },
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
  scheduleSecretShop();
  setTimeout(()=>{
    const types = ["corn","ladych","shifi"];
    spawnBoss(types[Math.floor(Math.random()*types.length)]);
  }, 20000);
}

// ─── CLICK ───────────────────────────────
horseBtn.addEventListener("click", () => {
  const bonus = Math.floor(researchBonuses.clickMult);
  coins += bonus; totalCoinsEarned += bonus;
  spawnCoinParticle(); update(); saveGame();
});

function spawnCoinParticle() {
  const p = document.createElement("div");
  p.className = "coinParticle"; p.innerText = "🪙";
  const rect = horseBtn.getBoundingClientRect();
  p.style.left = (rect.left+rect.width/2+(Math.random()-.5)*60)+"px";
  p.style.top  = (rect.top +rect.height/2)+"px";
  document.body.appendChild(p);
  setTimeout(()=>p.remove(), 900);
}

// ─── PEP ─────────────────────────────────
document.getElementById("pepBtn").addEventListener("click", ()=>{
  const s = document.getElementById("horseSound");
  s.currentTime = 0; s.play();
  document.getElementById("pepBtn").classList.add("pepPop");
  setTimeout(()=>document.getElementById("pepBtn").classList.remove("pepPop"), 200);
});

// ─── BUY MULTIPLIER ──────────────────────
function setBuyMultiplier(n) {
  buyMultiplier = n;
  document.querySelectorAll(".buyMultBtn").forEach(btn=>{
    btn.classList.toggle("active", parseInt(btn.dataset.mul)===n);
  });
  renderPrices();
}

function calcBulkCost(name, count) {
  const upg = upgrades[name]; if (!upg) return Infinity;
  let total=0, cost=upg.cost;
  for (let i=0; i<count; i++) { total+=cost; cost=Math.floor(cost*1.15); }
  return total;
}

// ─── BUY UPGRADE ─────────────────────────
function buyUpgrade(name) {
  const totalCost = calcBulkCost(name, buyMultiplier);
  if (coins < totalCost) {
    const btn = document.getElementById("shopBtn-"+name);
    if (btn) { btn.classList.add("cantAffordShake"); setTimeout(()=>btn.classList.remove("cantAffordShake"),400); }
    return;
  }
  coins -= totalCost;
  for (let i=0; i<buyMultiplier; i++) {
    perSec += upgrades[name].income * researchBonuses.incomeMult;
    upgrades[name].cost = Math.floor(upgrades[name].cost*1.15);
    upgradeCounts[name] = (upgradeCounts[name]||0)+1;
  }
  const btn = document.getElementById("shopBtn-"+name);
  if (btn) { btn.classList.add("buyFlash"); setTimeout(()=>btn.classList.remove("buyFlash"),400); }
  renderPrices(); update(); saveGame();
}

// ─── 2× COINS ────────────────────────────
function buyDoubleCoins() {
  if (coins < 40000) return;
  coins -= 40000; doubleCoins = true; doubleCoinsTimer = 30;
  activateDoubleCoinTimer();
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
  if (rng < 0.15) { const w=5000000; coins+=w; totalCoinsEarned+=w; msg="🎉 VÝHRA! +5 000 000 coins!"; }
  else if (rng < 0.50) { const w=500000; coins+=w; totalCoinsEarned+=w; msg="😐 Malá výhra... +500 000 coins."; }
  else { msg="💀 Smůla! Ztratil jsi vsázku."; }
  document.getElementById("ticketResult").innerText = msg;
  update(); saveGame();
}

// ─── SLOT ────────────────────────────────
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
  const el = document.getElementById("slotSpinInfo"); if (!el) return;
  if (slotCooldownActive) { el.innerText = "⏳ Čekej "+slotCooldownSeconds+"s"; el.style.color="#ff6666"; }
  else { el.innerText = "🎲 Zbývá spinů: "+slotSpinsLeft+" / 10"; el.style.color=slotSpinsLeft>3?"#39ff6b":"#ffaa44"; }
}
function setBet(amount) { currentBet = amount; document.getElementById("slotBetDisplay").innerText = "Vsazeno: "+formatCoins(currentBet); }
function setCustomBet() {
  const val = parseInt(document.getElementById("customBet").value);
  if (isNaN(val)||val<=0) { document.getElementById("slotResult").innerText="❌ Zadej platné číslo!"; return; }
  currentBet=val; document.getElementById("slotBetDisplay").innerText="Vsazeno: "+formatCoins(currentBet);
}
function runSlot() {
  if (slotCooldownActive) { document.getElementById("slotResult").innerText="⏳ Čekej "+slotCooldownSeconds+"s!"; return; }
  if (slotSpinsLeft<=0) { startSlotCooldown(); return; }
  if (currentBet<=0||currentBet>coins) { document.getElementById("slotResult").innerText=currentBet<=0?"❌ Zvol sázku!":"❌ Nemáš dost coinů!"; return; }
  coins-=currentBet; slotSpinsLeft--;
  const rng=Math.random(); let msg="";
  if (rng<0.50) { msg="😢 Prohra. Ztratil jsi "+formatCoins(currentBet); }
  else if (rng<0.75) { const w=Math.floor(currentBet*2*researchBonuses.slotWinMult); coins+=w; totalCoinsEarned+=w; msg="🎉 Výhra 2x! +"+formatCoins(w); }
  else if (rng<0.90) { const w=Math.floor(currentBet*3*researchBonuses.slotWinMult); coins+=w; totalCoinsEarned+=w; msg="🔥 Výhra 3x! +"+formatCoins(w); }
  else { const w=Math.floor(currentBet*10*researchBonuses.slotWinMult); coins+=w; totalCoinsEarned+=w; msg="💎 JACKPOT 10x! +"+formatCoins(w); }
  document.getElementById("slotResult").innerText=msg;
  if (slotSpinsLeft<=0) startSlotCooldown();
  updateSlotSpinInfo(); update(); saveGame();
}
function startSlotCooldown() {
  slotCooldownActive=true; slotCooldownSeconds=600; updateSlotSpinInfo();
  if (window._slotCooldownInterval) clearInterval(window._slotCooldownInterval);
  window._slotCooldownInterval=setInterval(()=>{
    slotCooldownSeconds--; updateSlotSpinInfo();
    if (slotCooldownSeconds<=0) { slotCooldownActive=false; slotSpinsLeft=10; clearInterval(window._slotCooldownInterval); updateSlotSpinInfo(); }
  },1000);
}

// ─── ULTIMATE SLOT – s omezením 10/30min ──
let ultimateBet = 0;
const ULTIMATE_SYMBOLS = ["🔴","🟡","🟠","🟢","💎","👑"];
const SYMBOL_MULT       = [0,    2,    5,   10,  25,  50 ];

function openUltimateSlot() {
  ultimateBet = 0;
  document.getElementById("ultimateBetDisplay").innerText = "Vsazeno: 0";
  document.getElementById("ultimateResult").innerText = "";
  document.getElementById("ultimateCustomBet").value = "";
  ["reel1","reel2","reel3"].forEach(id=>document.getElementById(id).innerText="❓");
  updateUltimateSpinInfo();
  document.getElementById("ultimateModal").style.display = "flex";
}

function updateUltimateSpinInfo() {
  const el = document.getElementById("ultimateSpinInfo"); if (!el) return;
  if (ultimateCooldownActive) {
    const mins = Math.floor(ultimateCooldownSeconds/60), secs = ultimateCooldownSeconds%60;
    el.innerText = "⏳ Čekej "+mins+":"+String(secs).padStart(2,"0");
    el.style.color="#ff6666";
  } else {
    el.innerText = "👑 Zbývá spinů: "+ultimateSpinsLeft+" / 10";
    el.style.color = ultimateSpinsLeft>3 ? "#ffd700" : "#ffaa44";
  }
}

function setUltimateBet(amount) { ultimateBet=amount; document.getElementById("ultimateBetDisplay").innerText="Vsazeno: "+formatCoins(ultimateBet); }
function setUltimateCustomBet() {
  const val=parseInt(document.getElementById("ultimateCustomBet").value);
  if (isNaN(val)||val<500000) { document.getElementById("ultimateResult").innerText="❌ Min. vklad je 500 000!"; return; }
  ultimateBet=val; document.getElementById("ultimateBetDisplay").innerText="Vsazeno: "+formatCoins(ultimateBet);
}

function spinUltimate() {
  if (ultimateCooldownActive) { document.getElementById("ultimateResult").innerText="⏳ Automat se dobíjí!"; return; }
  if (ultimateSpinsLeft<=0) { startUltimateCooldown(); return; }
  if (ultimateBet<500000) { document.getElementById("ultimateResult").innerText="❌ Min. vklad je 500 000!"; return; }
  if (ultimateBet>coins) { document.getElementById("ultimateResult").innerText="❌ Nemáš dost coinů!"; return; }
  coins-=ultimateBet; ultimateSpinsLeft--;
  updateUltimateSpinInfo();
  document.getElementById("spinBtn").disabled=true;
  document.getElementById("ultimateResult").innerText="";
  let ticks=0;
  const interval=setInterval(()=>{
    ticks++;
    ["reel1","reel2","reel3"].forEach(id=>{ document.getElementById(id).innerText=ULTIMATE_SYMBOLS[Math.floor(Math.random()*ULTIMATE_SYMBOLS.length)]; });
    if (ticks>=20) {
      clearInterval(interval);
      const rng=Math.random(); let symIdx;
      if      (rng<0.50) symIdx=0;
      else if (rng<0.70) symIdx=1;
      else if (rng<0.84) symIdx=2;
      else if (rng<0.93) symIdx=3;
      else if (rng<0.98) symIdx=4;
      else               symIdx=5;
      let s1,s2,s3;
      if (symIdx===0) { s1=ULTIMATE_SYMBOLS[0]; s2=ULTIMATE_SYMBOLS[1]; s3=ULTIMATE_SYMBOLS[2]; }
      else { s1=s2=s3=ULTIMATE_SYMBOLS[symIdx]; }
      document.getElementById("reel1").innerText=s1;
      document.getElementById("reel2").innerText=s2;
      document.getElementById("reel3").innerText=s3;
      const mult=SYMBOL_MULT[symIdx];
      const payout=Math.floor(ultimateBet*mult*researchBonuses.slotWinMult);
      coins+=payout; if (payout>0) totalCoinsEarned+=payout;
      document.getElementById("ultimateResult").innerText=mult===0?"💀 Prohra! Ztratil jsi "+formatCoins(ultimateBet):"🎉 VÝHRA "+mult+"x! +"+formatCoins(payout)+" coins!";
      document.getElementById("spinBtn").disabled=false;
      if (ultimateSpinsLeft<=0) startUltimateCooldown();
      updateUltimateSpinInfo();
      update(); saveGame();
    }
  },80);
  update();
}

function startUltimateCooldown() {
  ultimateCooldownActive=true; ultimateCooldownSeconds=1800; // 30 minut
  updateUltimateSpinInfo();
  if (window._ultimateCooldownInterval) clearInterval(window._ultimateCooldownInterval);
  window._ultimateCooldownInterval=setInterval(()=>{
    ultimateCooldownSeconds--; updateUltimateSpinInfo();
    if (ultimateCooldownSeconds<=0) {
      ultimateCooldownActive=false; ultimateSpinsLeft=10;
      clearInterval(window._ultimateCooldownInterval);
      updateUltimateSpinInfo();
      showToast("👑 Ultimate Automat dobito! 10 spinů připraveno.");
    }
  },1000);
}

// ─── NEMOVITOSTI ─────────────────────────
function buyUFO() {
  if (hasUFO) { showToast("UFO už vlastníš!"); return; }
  if (coins < 10000000000) { showToast("Nemáš dost coinů! (10B)"); return; }
  coins-=10000000000; hasUFO=true; animateBuy("ufoPrestigeBtn");
  showToast("🛸 UFO zakoupeno! +100M coins / 30s"); update(); saveGame();
}
function buyGarageKotlise() {
  if (hasGarageKotlise) { showToast("Garáž Kotlise už vlastníš!"); return; }
  if (coins < 5000000000) { showToast("Nemáš dost coinů! (5B)"); return; }
  coins-=5000000000; hasGarageKotlise=true; animateBuy("garageKotliseBtn");
  showToast("🚗 Garáž Kotlise zakoupena! +50M coins / 30s"); update(); saveGame();
}
function buyKotliseCar() {
  if (hasKotliseCar) { showToast("Kotlise Auto už vlastníš!"); return; }
  if (coins < 60000) { showToast("Nemáš dost coinů! (60 000)"); return; }
  coins-=60000; hasKotliseCar=true; animateBuy("kotliseCarBtn");
  showToast("🏎️ Kotlise Auto zakoupeno! +3 000 coins / 30s"); update(); saveGame();
}
function animateBuy(id) {
  const el=document.getElementById(id); if (!el) return;
  el.classList.add("buyFlash"); setTimeout(()=>el.classList.remove("buyFlash"),500);
}
function showToast(msg) {
  const t=document.createElement("div"); t.className="toast"; t.innerText=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add("toastShow"),10);
  setTimeout(()=>{ t.classList.remove("toastShow"); setTimeout(()=>t.remove(),400); },2500);
}
function openNemovitosti() {
  let html="";
  if (hasKotliseCar)    html+="<div class='nemItem nemCar'>🏎️ Kotlise Auto – +3 000 coins / 30s</div>";
  if (hasGarageKotlise) html+="<div class='nemItem nemGarage'>🚗 Garáž Kotlise – +50M coins / 30s</div>";
  if (hasUFO)           html+="<div class='nemItem nemUfo'>🛸 UFO – +100M coins / 30s</div>";
  if (!hasUFO && !hasGarageKotlise && !hasKotliseCar) html="<p style='color:#666;text-align:center;padding:18px'>Žádné nemovitosti.</p>";
  document.getElementById("nemovitostiList").innerHTML=html;
  document.getElementById("nemovitostiModal").style.display="flex";
}

// ─── STÁJ ────────────────────────────────
const HORSE_NAMES  = ["Blesk","Hrom","Vítr","Pepík","Kotlík","Šifka"];
const HORSE_EMOJIS = ["🐎","🐴","🦄","🐗","🐂","🦓"];
function openStable() { renderStableModal(); document.getElementById("stableModal").style.display="flex"; }
function renderStableModal() {
  const listEl = document.getElementById("stableHorseList");
  let addHtml = stableHorses.length < MAX_HORSES
    ? `<button class="stableAddBtn" onclick="addHorse()">➕ Přidat koně &nbsp;<span class="stableAddCost">${formatCoins(10000*Math.pow(2,stableHorses.length))} coins</span></button>`
    : `<div class="stableFullMsg">🏠 Stáj je plná! (max ${MAX_HORSES})</div>`;
  const horsesHtml = stableHorses.map((h,i)=>{
    const lvl=h.level, maxed=lvl>=MAX_HORSE_LEVEL;
    const levelCost=Math.floor(500*Math.pow(1.2,lvl));
    const effectiveIncome=Math.floor(h.income*researchBonuses.horseMult*(megaBoostActive?6:1));
    return `<div class="stableHorseCard" id="horseCard-${i}">
      <div class="stableHorseLeft"><div class="stableHorseEmoji">${h.emoji}</div><div class="stableHorseLvlBadge">Lv${lvl}</div></div>
      <div class="stableHorseInfo">
        <div class="stableHorseName">${h.name}</div>
        <div class="stableHorseIncome">+${formatCoins(effectiveIncome)}/sec</div>
        <div class="stableHorseLvlBar"><div class="stableHorseLvlFill" style="width:${(lvl/MAX_HORSE_LEVEL)*100}%"></div></div>
        <div class="stableHorseLvlText">${lvl} / ${MAX_HORSE_LEVEL}</div>
      </div>
      ${maxed ? `<div class="stableLvlBtn maxed">✨ MAX</div>`
              : `<button class="stableLvlBtn" onclick="levelHorse(${i})">Doučko<br><span class="lvlCost">${formatCoins(levelCost)}</span></button>`}
    </div>`;
  }).join("");
  listEl.innerHTML = addHtml + (horsesHtml || `<div class="stableEmptyMsg">🐴 Zatím nemáš žádného koně.<br>Kup prvního výše!</div>`);
}
function addHorse() {
  if (stableHorses.length>=MAX_HORSES) return;
  const cost=10000*Math.pow(2,stableHorses.length);
  if (coins<cost) { showToast("Nemáš dost coinů!"); return; }
  coins-=cost;
  const idx=stableHorses.length;
  stableHorses.push({ name:HORSE_NAMES[idx]||"Kůň "+(idx+1), emoji:HORSE_EMOJIS[idx]||"🐎", level:1, income:100*(idx+1) });
  renderStableModal(); update(); saveGame();
}
function levelHorse(idx) {
  const h=stableHorses[idx]; if (!h||h.level>=MAX_HORSE_LEVEL) return;
  const cost=Math.floor(500*Math.pow(1.2,h.level));
  if (coins<cost) { showToast("Nemáš dost coinů!"); return; }
  coins-=cost; h.level++; h.income=Math.floor(h.income*1.10);
  const card=document.getElementById("horseCard-"+idx);
  if (card) { card.classList.add("levelUpFlash"); setTimeout(()=>card.classList.remove("levelUpFlash"),600); }
  renderStableModal(); update(); saveGame();
}

// ─── INFO ─────────────────────────────────
function openInfo() { document.getElementById("infoModal").style.display="flex"; }

// ─── MODAL HELPERS ───────────────────────
function closeModal(id) { document.getElementById(id).style.display="none"; }
document.querySelectorAll(".modal").forEach(m=>{
  m.addEventListener("click", e=>{ if(e.target===m) m.style.display="none"; });
});

// ─── VZDUCHOLOD ──────────────────────────
function startAirship() {
  const container = document.getElementById("airship");
  container.style.display="block";
  const messages=["KUNYS","PEP CLICKER 2.0","KLIKEJ KONĚ","KOTLISE AUTO","SHIFINY STÁJ","POZOR NA BOSSE!","OLGA KUNYSOVÁ!","VÝZKUM ODEMČEN!"];
  let msgIdx=0;
  const BLIMP_W=340,BANNER_W=220,TOTAL_W=BLIMP_W+BANNER_W+60;
  container.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="${TOTAL_W}" height="130" viewBox="0 0 ${TOTAL_W} 130">
    <line x1="${BLIMP_W-10}" y1="90" x2="${BLIMP_W+55}" y2="75" stroke="#aaa" stroke-width="1.5" opacity="0.7"/>
    <rect x="${BLIMP_W+55}" y="58" width="${BANNER_W}" height="36" rx="5" fill="#fffbe6" stroke="#e0b800" stroke-width="2"/>
    <text id="blimpBannerText" x="${BLIMP_W+55+BANNER_W/2}" y="81" font-family="'Bungee',cursive" font-size="15" font-weight="bold" fill="#b8860b" text-anchor="middle" letter-spacing="2">KUNYS</text>
    <polygon points="${BLIMP_W+55},58 ${BLIMP_W+55},68 ${BLIMP_W+65},63" fill="#e0b800"/>
    <polygon points="${BLIMP_W+55+BANNER_W},58 ${BLIMP_W+55+BANNER_W},68 ${BLIMP_W+45+BANNER_W},63" fill="#e0b800"/>
    <ellipse cx="155" cy="62" rx="145" ry="52" fill="url(#blimpGrad)"/>
    <ellipse cx="120" cy="42" rx="80" ry="22" fill="rgba(255,255,255,0.18)" transform="rotate(-8,120,42)"/>
    <ellipse cx="155" cy="62" rx="145" ry="52" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
    <clipPath id="blimpClip"><ellipse cx="155" cy="62" rx="145" ry="52"/></clipPath>
    <rect x="40" y="10" width="18" height="104" fill="rgba(255,0,0,0.25)" clip-path="url(#blimpClip)"/>
    <rect x="88" y="10" width="18" height="104" fill="rgba(255,0,0,0.25)" clip-path="url(#blimpClip)"/>
    <rect x="200" y="10" width="18" height="104" fill="rgba(255,0,0,0.25)" clip-path="url(#blimpClip)"/>
    <rect x="248" y="10" width="18" height="104" fill="rgba(255,0,0,0.25)" clip-path="url(#blimpClip)"/>
    <rect x="110" y="108" width="90" height="22" rx="11" fill="#2a2a4a" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <circle cx="128" cy="119" r="6" fill="#87ceeb" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
    <circle cx="148" cy="119" r="6" fill="#87ceeb" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
    <circle cx="168" cy="119" r="6" fill="#87ceeb" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
    <circle cx="188" cy="119" r="6" fill="#87ceeb" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
    <line x1="130" y1="108" x2="130" y2="114" stroke="#888" stroke-width="1.5"/>
    <line x1="155" y1="108" x2="155" y2="114" stroke="#888" stroke-width="1.5"/>
    <line x1="180" y1="108" x2="180" y2="114" stroke="#888" stroke-width="1.5"/>
    <polygon points="10,62 35,42 35,82" fill="#c0392b" opacity="0.85"/>
    <polygon points="10,62 35,48 8,30" fill="#e74c3c" opacity="0.7"/>
    <polygon points="10,62 35,76 8,94" fill="#e74c3c" opacity="0.7"/>
    <g><animateTransform attributeName="transform" type="rotate" from="0 295 62" to="360 295 62" dur="0.6s" repeatCount="indefinite"/>
      <ellipse cx="295" cy="50" rx="4" ry="10" fill="#555" opacity="0.8"/>
      <ellipse cx="295" cy="74" rx="4" ry="10" fill="#555" opacity="0.8"/>
      <ellipse cx="283" cy="62" rx="10" ry="4" fill="#555" opacity="0.8"/>
      <ellipse cx="307" cy="62" rx="10" ry="4" fill="#555" opacity="0.8"/>
    </g>
    <circle cx="295" cy="62" r="5" fill="#333"/>
    <text x="155" y="68" font-family="'Bungee',cursive" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.9)" text-anchor="middle" letter-spacing="3" stroke="rgba(0,0,0,0.2)" stroke-width="1">PEP CLICKER</text>
    <defs><linearGradient id="blimpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e8e8e8"/><stop offset="35%" stop-color="#c0c0c0"/><stop offset="100%" stop-color="#888"/>
    </linearGradient></defs>
  </svg>`;
  let x=-TOTAL_W-50;
  container.style.top=(55+Math.random()*40)+"px";
  setInterval(()=>{
    msgIdx=(msgIdx+1)%messages.length;
    const el=document.getElementById("blimpBannerText");
    if(el) el.textContent=messages[msgIdx];
  },4000);
  const move=()=>{ x+=1.4; container.style.left=x+"px"; if(x>window.innerWidth+100){x=-TOTAL_W-50;container.style.top=(55+Math.random()*60)+"px";} requestAnimationFrame(move); };
  move();
}

// ─── AUTO INCOME ─────────────────────────
setInterval(()=>{
  let income = perSec * researchBonuses.incomeMult;
  if (doubleCoins) income *= 2;
  if (megaBoostActive) income *= 6;
  stableHorses.forEach(h=>{ income += h.income * researchBonuses.horseMult * (megaBoostActive?6:1); });
  coins += income; totalCoinsEarned += income; update();
}, 1000);

setInterval(()=>{
  let bonus=0;
  if (hasUFO)           bonus+=100000000;
  if (hasGarageKotlise) bonus+=50000000;
  if (hasKotliseCar)    bonus+=3000;
  if (bonus>0) { coins+=bonus; totalCoinsEarned+=bonus; update(); }
}, 30000);

setInterval(()=>{ saveGame(); }, 5000);

// ─── UPDATE ──────────────────────────────
function update() {
  coinsText.innerText = formatCoins(Math.floor(coins));
  let effectivePerSec = perSec * researchBonuses.incomeMult;
  stableHorses.forEach(h=>{ effectivePerSec += h.income * researchBonuses.horseMult; });
  if (doubleCoins) effectivePerSec *= 2;
  if (megaBoostActive) effectivePerSec *= 6;
  let statsStr = "Výdělek: "+formatCoins(Math.floor(effectivePerSec))+"/sec";
  if (doubleCoins) statsStr += "  ✨2×("+doubleCoinsTimer+"s)";
  if (megaBoostActive) statsStr += "  ⚡MEGA("+megaBoostTimer+"s)";
  statsText.innerText = statsStr;
  updateNemBtn("ufoPrestigeBtn",    !hasUFO,           coins>=10000000000);
  updateNemBtn("garageKotliseBtn",  !hasGarageKotlise, coins>=5000000000);
  updateNemBtn("kotliseCarBtn",     !hasKotliseCar,    coins>=60000);
  checkAchievements(); renderPrices();
}
function updateNemBtn(id, notOwned, canAfford) {
  const btn=document.getElementById(id); if (!btn) return;
  if (!notOwned) { btn.style.opacity="0.4"; btn.style.cursor="default"; btn.classList.remove("canAfford"); }
  else { btn.style.opacity="1"; btn.style.cursor="pointer"; btn.classList.toggle("canAfford",canAfford); }
}

// ─── FORMAT ──────────────────────────────
function formatCoins(n) {
  if (n>=1e12) return (n/1e12).toFixed(2)+"T";
  if (n>=1e9)  return (n/1e9).toFixed(2)+"B";
  if (n>=1e6)  return (n/1e6).toFixed(2)+"M";
  if (n>=1000) return (n/1000).toFixed(1)+"K";
  return String(Math.floor(n));
}

// ─── ACHIEVEMENTS ────────────────────────
const ACHIEVEMENT_DEFS = [
  { id:"coins1k",    label:"💰 1K Coins",                  check:()=>totalCoinsEarned>=1000 },
  { id:"coins100k",  label:"💵 100K Coins",                 check:()=>totalCoinsEarned>=100000 },
  { id:"coins1m",    label:"🔥 1M Coins",                   check:()=>totalCoinsEarned>=1000000 },
  { id:"coins1b",    label:"💎 1B Coins",                   check:()=>totalCoinsEarned>=1000000000 },
  { id:"ufo",        label:"🛸 UFO Vlastník",               check:()=>hasUFO },
  { id:"garage",     label:"🚗 Garáž Kotlise",              check:()=>hasGarageKotlise },
  { id:"car",        label:"🏎️ Kotlise Auto",               check:()=>hasKotliseCar },
  { id:"stajnik",    label:"🐎 Stájník",                    check:()=>stableHorses.length>0 },
  { id:"horse6",     label:"🐴 Plná Stáj",                  check:()=>stableHorses.length>=6 },
  { id:"boss1",      label:"🌽 První Boss Poražen",         check:()=>bossesDefeated>=1 },
  { id:"boss5",      label:"👹 5× Boss Poražen",            check:()=>bossesDefeated>=5 },
  { id:"boss10",     label:"💀 10× Boss Poražen",           check:()=>bossesDefeated>=10 },
  { id:"cornKill",   label:"🌽 Kukuřičný Démon Poražen",    check:()=>(bossKills.corn||0)>=1 },
  { id:"ladychKill", label:"🚜 Ládychův Traktor Zastaven",  check:()=>(bossKills.ladych||0)>=1 },
  { id:"shifiKill",  label:"👻 Shifin Duch Vyhnán",         check:()=>(bossKills.shifi||0)>=1 },
  { id:"olgaKill",   label:"👩‍🦳 Olga Kunysová Zkrocena",   check:()=>(bossKills.olga||0)>=1 },
  { id:"olgaKill3",  label:"💀 Olga 3× Zkrocena",           check:()=>(bossKills.olga||0)>=3 },
  { id:"lvl50",      label:"⭐ Kůň Max Level",              check:()=>stableHorses.some(h=>h.level>=50) },
  { id:"research1",  label:"🔬 První Výzkum Dokončen",      check:()=>researchDone.size>=1 },
  { id:"research5",  label:"🧪 5 Výzkumů Dokončeno",        check:()=>researchDone.size>=5 },
  { id:"secretShop", label:"🤫 Tajný Obchod Navštíven",     check:()=>secretShopActive },
];

function checkAchievements() {
  let changed=false;
  ACHIEVEMENT_DEFS.forEach(def=>{
    if (!unlockedAchievements.has(def.id)&&def.check()) {
      unlockedAchievements.add(def.id); changed=true;
      showAchievementPopup(def.label);
    }
  });
  renderAchievements();
  if (changed) saveGame();
}
function renderAchievements() {
  const html=ACHIEVEMENT_DEFS.filter(d=>unlockedAchievements.has(d.id)).map(d=>`<div class="achievItem">${d.label}</div>`).join("");
  document.getElementById("achievementList").innerHTML=html||"<span style='color:#444;font-size:11px'>Zatím žádné...</span>";
}
function showAchievementPopup(label) {
  const el=document.createElement("div"); el.className="achievPopup";
  el.innerHTML=`🏆 Achievement!<br><strong>${label}</strong>`;
  document.body.appendChild(el);
  setTimeout(()=>el.classList.add("achievPopupShow"),10);
  setTimeout(()=>{ el.classList.remove("achievPopupShow"); setTimeout(()=>el.remove(),500); },3000);
}

// ─── RENDER PRICES ───────────────────────
function renderPrices() {
  const map={horsePrice:"horse",stablePrice:"stable",farmPrice:"farm",naraz1Price:"naraz1",naraz2Price:"naraz2",kotliseBazenPrice:"kotliseBazeny",workshopPrice:"workshop",rodokmenPrice:"rodokmeny",olgaPrice:"olga",elektrokotelPrice:"elektrokotel"};
  for (const [elId,key] of Object.entries(map)) {
    const el=document.getElementById(elId); if (!el||!upgrades[key]) continue;
    const total=calcBulkCost(key,buyMultiplier), canAfford=coins>=total;
    el.innerText=formatCoins(total)+(buyMultiplier>1?" (×"+buyMultiplier+")":"");
    el.style.color=canAfford?"#39ff6b":"#ff4466";
    const btn=document.getElementById("shopBtn-"+key);
    if (btn) btn.classList.toggle("shopAffordable",canAfford);
  }
}

// ─── SAVE / LOAD ─────────────────────────
function saveGame() {
  if (!userKey) return;
  localStorage.setItem(userKey+"_save", JSON.stringify({
    coins, perSec, upgrades, upgradeCounts,
    hasUFO, hasGarageKotlise, hasKotliseCar, hasElectroBoiler,
    stableHorses, slotSpinsLeft, slotCooldownActive, slotCooldownSeconds,
    ultimateSpinsLeft, ultimateCooldownActive, ultimateCooldownSeconds,
    unlockedAchievements:[...unlockedAchievements],
    totalCoinsEarned, bossesDefeated, bossKills,
    researchDone:[...researchDone], researchActive,
    researchBonuses,
  }));
}

function loadGame() {
  const raw=localStorage.getItem(userKey+"_save"); if (!raw) return;
  try {
    const d=JSON.parse(raw);
    coins=d.coins||0; perSec=d.perSec||0;
    hasUFO=d.hasUFO||false; hasGarageKotlise=d.hasGarageKotlise||false;
    hasKotliseCar=d.hasKotliseCar||false; hasElectroBoiler=d.hasElectroBoiler||false;
    stableHorses=d.stableHorses||[]; slotSpinsLeft=d.slotSpinsLeft??10;
    slotCooldownActive=d.slotCooldownActive||false; slotCooldownSeconds=d.slotCooldownSeconds||0;
    ultimateSpinsLeft=d.ultimateSpinsLeft??10;
    ultimateCooldownActive=d.ultimateCooldownActive||false;
    ultimateCooldownSeconds=d.ultimateCooldownSeconds||0;
    totalCoinsEarned=d.totalCoinsEarned||0; bossesDefeated=d.bossesDefeated||0;
    if (d.bossKills) Object.assign(bossKills,d.bossKills);
    if (d.unlockedAchievements) unlockedAchievements=new Set(d.unlockedAchievements);
    if (d.upgrades) Object.assign(upgrades,d.upgrades);
    if (d.upgradeCounts) Object.assign(upgradeCounts,d.upgradeCounts);
    if (d.researchDone) researchDone=new Set(d.researchDone);
    if (d.researchActive) {
      researchActive=d.researchActive;
      if (Date.now() < researchActive.endsAt) startResearchTimer();
      else {
        const def=RESEARCH_DEFS.find(x=>x.id===researchActive.id);
        if (def) { def.bonus(); researchDone.add(def.id); }
        researchActive=null;
      }
    }
    if (d.researchBonuses) Object.assign(researchBonuses,d.researchBonuses);
    renderPrices();
    if (slotCooldownActive&&slotCooldownSeconds>0) startSlotCooldown();
    if (ultimateCooldownActive&&ultimateCooldownSeconds>0) startUltimateCooldown();
  } catch(e) { console.error("Load error:",e); }
}
