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

// ─── SLOT timery – časy uloženy jako timestamps ───────────────
let slotSpinsLeft = 10;
let slotCooldownEnd = 0; // timestamp kdy skončí cooldown

let ultimateSpinsLeft = 10;
let ultimateCooldownEnd = 0; // timestamp kdy skončí cooldown

let buyMultiplier = 1;

let unlockedAchievements = new Set();
let totalCoinsEarned = 0;
let bossesDefeated = 0;
let bossKills = { corn: 0, ladych: 0, shifi: 0, olga: 0 };

// ─── RESEARCH BONUSY ─────────────────────────────────────────
const researchBonuses = {
  clickMult:    1,
  incomeMult:   1,
  bossReward:   1,
  slotWinMult:  1,
  horseMult:    1,
};

// ─── VÝZKUM DEFINICE ─────────────────────────────────────────
const RESEARCH_DEFS = [
  { id:"r_income1",  cat:"Produkce", icon:"⚡", name:"Efektivní Kotle",      desc:"Základní zlepšení všech příjmů.",          effect:"+10% příjem /sec",  cost:500000,   timeSec:60,  bonus:()=>{ researchBonuses.incomeMult  *= 1.10; }, requires:[] },
  { id:"r_income2",  cat:"Produkce", icon:"🔥", name:"Kotlisova Pec",         desc:"Pokročilé vytápění zvyšuje příjmy.",        effect:"+20% příjem /sec",  cost:2000000,  timeSec:180, bonus:()=>{ researchBonuses.incomeMult  *= 1.20; }, requires:["r_income1"] },
  { id:"r_income3",  cat:"Produkce", icon:"🏭", name:"Průmyslová Revoluce",   desc:"Masivní navýšení produkce.",               effect:"+40% příjem /sec",  cost:20000000, timeSec:600, bonus:()=>{ researchBonuses.incomeMult  *= 1.40; }, requires:["r_income2"] },
  { id:"r_click1",   cat:"Klikání",  icon:"👆", name:"Pep Prsty",             desc:"Trénink pro rychlejší klikání.",            effect:"+5 coinů/klik",     cost:100000,   timeSec:30,  bonus:()=>{ researchBonuses.clickMult  += 5; },    requires:[] },
  { id:"r_click2",   cat:"Klikání",  icon:"✋", name:"Ládychova Ruka",        desc:"Silnější údery přinášejí více coinů.",      effect:"+20 coinů/klik",    cost:800000,   timeSec:120, bonus:()=>{ researchBonuses.clickMult  += 20; },   requires:["r_click1"] },
  { id:"r_click3",   cat:"Klikání",  icon:"🤜", name:"Kotlisův Pěstní Úder", desc:"Monumentální síla kliku.",                 effect:"+100 coinů/klik",   cost:10000000, timeSec:360, bonus:()=>{ researchBonuses.clickMult  += 100; },  requires:["r_click2"] },
  { id:"r_horse1",   cat:"Stáj",     icon:"🐎", name:"Lepší Seno",            desc:"Koně jsou spokojení a vydělávají víc.",     effect:"+15% příjem stáje", cost:200000,   timeSec:45,  bonus:()=>{ researchBonuses.horseMult  *= 1.15; }, requires:[] },
  { id:"r_horse2",   cat:"Stáj",     icon:"🦄", name:"Shifiny Genetika",      desc:"Šlechtění výkonnějších koní.",             effect:"+30% příjem stáje", cost:3000000,  timeSec:240, bonus:()=>{ researchBonuses.horseMult  *= 1.30; }, requires:["r_horse1"] },
  { id:"r_boss1",    cat:"Bossové",  icon:"⚔️", name:"Antikorová Zbroj",      desc:"Lépe se bráníš boss útokům.",             effect:"+15% boss reward",  cost:1000000,  timeSec:90,  bonus:()=>{ researchBonuses.bossReward *= 1.15; }, requires:[] },
  { id:"r_boss2",    cat:"Bossové",  icon:"🗡️", name:"Ládychův Meč",          desc:"Silnější klik na bosse.",                  effect:"+30% boss reward",  cost:8000000,  timeSec:300, bonus:()=>{ researchBonuses.bossReward *= 1.30; }, requires:["r_boss1"] },
  { id:"r_slot1",    cat:"Gambling", icon:"🎰", name:"Šťastná Ruka",          desc:"Lepší šance v automatech.",               effect:"+10% výhry slotů",  cost:500000,   timeSec:60,  bonus:()=>{ researchBonuses.slotWinMult*= 1.10; }, requires:[] },
  { id:"r_slot2",    cat:"Gambling", icon:"💎", name:"Kotlisův Systém",       desc:"Pokročilá analýza automatů.",              effect:"+25% výhry slotů",  cost:5000000,  timeSec:240, bonus:()=>{ researchBonuses.slotWinMult*= 1.25; }, requires:["r_slot1"] },
];

let researchDone    = new Set();
let researchActive  = null;
let researchTimerInterval = null;

function canResearch(def) { return def.requires.every(r => researchDone.has(r)); }

function startResearch(id) {
  if (researchActive) { showToast("Výzkum už probíhá!"); return; }
  if (researchDone.has(id)) { showToast("Výzkum už dokončen!"); return; }
  const def = RESEARCH_DEFS.find(d => d.id === id);
  if (!def) return;
  if (!canResearch(def)) { showToast("Nejprve dokonči předchozí výzkum!"); return; }
  if (coins < def.cost) { showToast("Nemáš dost coinů!"); return; }
  coins -= def.cost;
  researchActive = { id, endsAt: Date.now() + def.timeSec * 1000 };
  startResearchTimer(); renderResearchModal(); update(); saveGame();
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
      renderResearchModal(); update(); saveGame();
    } else { renderResearchModal(); }
  }, 1000);
}

function openResearch() { renderResearchModal(); document.getElementById("researchModal").style.display = "flex"; }

function renderResearchModal() {
  const list = document.getElementById("researchList");
  const cats = [...new Set(RESEARCH_DEFS.map(d => d.cat))];
  let html = "";
  cats.forEach(cat => {
    html += `<div class="researchCategory"><div class="researchCatTitle">${cat}</div>`;
    RESEARCH_DEFS.filter(d => d.cat === cat).forEach(def => {
      const done   = researchDone.has(def.id);
      const active = researchActive && researchActive.id === def.id;
      const locked = !canResearch(def) && !done;
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
      const stateClass = done ? "researchDone" : (active ? "researchAvail" : (locked ? "researchLocked" : "researchAvail"));
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

// ═══════════════════════════════════════
//  TAJNÝ OBCHOD
// ═══════════════════════════════════════
let secretShopActive    = false;
let secretShopCountdown = 0;
let secretShopDeals     = [];
let secretShopInterval  = null;
let secretShopTimer     = null;

const SECRET_DEALS_POOL = [
  { id:"deal_double",   icon:"✨", name:"2× Coins x2 ZDARMA",  desc:"Aktivuje 2× coins boost na 60 sekund!", origCost:"80 000", saleCost:0,       saleLabel:"ZDARMA", action:()=>{ doubleCoins=true; doubleCoinsTimer=60; activateDoubleCoinTimer(); showToast("✨ 2× Coins aktivován na 60s!"); } },
  { id:"deal_coins1",   icon:"💰", name:"Balík 500K Coinů",    desc:"Přímý bonus do peněženky.",             origCost:"1M",     saleCost:200000,  saleLabel:"200K",   action:()=>{ coins+=500000; totalCoinsEarned+=500000; showToast("💰 +500 000 coinů!"); } },
  { id:"deal_coins2",   icon:"💎", name:"Balík 5M Coinů",      desc:"Masivní bonus pro zkušené hráče.",      origCost:"8M",     saleCost:2000000, saleLabel:"2M",     action:()=>{ coins+=5000000; totalCoinsEarned+=5000000; showToast("💎 +5 000 000 coinů!"); } },
  { id:"deal_spins",    icon:"🎰", name:"10 Extra Spinů",      desc:"Doplní spiny v automatu na max.",       origCost:"150K",   saleCost:50000,   saleLabel:"50K",    action:()=>{ slotSpinsLeft=10; slotCooldownEnd=0; showToast("🎰 Spiny doplněny!"); } },
  { id:"deal_ultspins", icon:"👑", name:"5 Ultimate Spinů",    desc:"Doplní ultimate spiny.",                origCost:"300K",   saleCost:100000,  saleLabel:"100K",   action:()=>{ ultimateSpinsLeft=Math.min(10,ultimateSpinsLeft+5); ultimateCooldownEnd=0; showToast("👑 +5 Ultimate Spinů!"); } },
  { id:"deal_horse",    icon:"🐎", name:"Kůň Zdarma",          desc:"Přidá nového koně do stáje bez ceny.", origCost:"Různé",  saleCost:0,       saleLabel:"ZDARMA", action:()=>{ if(stableHorses.length<MAX_HORSES){ const i=stableHorses.length; stableHorses.push({name:HORSE_NAMES[i]||"Kůň"+(i+1),emoji:HORSE_EMOJIS[i]||"🐎",level:1,income:100*(i+1)}); showToast("🐎 Nový kůň přidán do stáje!"); } else showToast("Stáj je plná!"); } },
  { id:"deal_boost",    icon:"⚡", name:"Mega Boost 5 minut",  desc:"+500% příjmu na 5 minut.",              origCost:"2M",     saleCost:500000,  saleLabel:"500K",   action:()=>{ activateMegaBoost(300); showToast("⚡ Mega Boost aktivován na 5 minut!"); } },
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
  const delay = (600 + Math.floor(Math.random() * 300)) * 1000;
  if (secretShopTimer) clearTimeout(secretShopTimer);
  secretShopTimer = setTimeout(() => triggerSecretShop(), delay);
}

function triggerSecretShop() {
  const shuffled = [...SECRET_DEALS_POOL].sort(() => Math.random() - .5);
  secretShopDeals = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
  secretShopDeals.forEach(d => d.bought = false);
  secretShopActive    = true;
  secretShopCountdown = 180;

  const btn = document.getElementById("secretShopTriggerBtn");
  if (btn) { btn.classList.add("secretShopPulse"); btn.innerText = "🤫 Tajný Obchod"; }

  // Zobraz výrazné upozornění
  showSecretShopNotification();

  if (secretShopInterval) clearInterval(secretShopInterval);
  secretShopInterval = setInterval(() => {
    secretShopCountdown--;
    const cdEl = document.getElementById("secretCountdownEl");
    if (cdEl) cdEl.innerText = "Zavírá za " + secretShopCountdown + "s";
    updateSecretNotifCountdown();
    if (secretShopCountdown <= 0) closeSecretShop();
  }, 1000);
}

function showSecretShopNotification() {
  const notif = document.getElementById("secretShopNotif");
  if (notif) {
    notif.style.display = "flex";
    setTimeout(() => notif.classList.add("secretNotifVisible"), 10);
  }
}

function dismissSecretNotif() {
  const notif = document.getElementById("secretShopNotif");
  if (notif) { notif.classList.remove("secretNotifVisible"); setTimeout(() => notif.style.display = "none", 400); }
  openSecretShop();
}

function closeSecretNotif() {
  const notif = document.getElementById("secretShopNotif");
  if (notif) { notif.classList.remove("secretNotifVisible"); setTimeout(() => notif.style.display = "none", 400); }
}

function updateSecretNotifCountdown() {
  const el = document.getElementById("secretNotifCountdown");
  if (el) el.innerText = secretShopCountdown + "s";
}

function openSecretShop() {
  if (!secretShopActive) { showToast("Tajný obchod je zatím zavřený. Počkej..."); return; }
  let dealsHtml = secretShopDeals.map((d, i) => `
    <div class="secretDealItem">
      <div class="secretDealIcon">${d.icon}</div>
      <div class="secretDealInfo">
        <div class="secretDealName">${d.name}</div>
        <div class="secretDealDesc">${d.desc}</div>
        <div class="secretDealOrig">Normálně: ${d.origCost}</div>
        <div class="secretDealSale">Dnes jen: ${d.saleLabel}</div>
      </div>
      <button class="secretDealBuyBtn" id="secretDeal-${i}" onclick="buySecretDeal(${i})" ${d.bought ? "disabled" : ""}>
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
  closeSecretNotif();
  const btn = document.getElementById("secretShopTriggerBtn");
  if (btn) { btn.classList.remove("secretShopPulse"); btn.innerText = "🤫 Tajný Obchod"; }
  scheduleSecretShop();
}

// ═══════════════════════════════════════
//  BOSS TYPY
// ═══════════════════════════════════════
const BOSS_TYPES = {
  corn:   { id:"corn",   name:"Kukuřičný Démon",  emoji:"🌽", warning:"⚠️ KUKUŘIČNÝ DÉMON ÚTOČÍ! ⚠️",    subtitle:"Klikej na démona než uteče!",          tip:"Výhra: ~60s příjmu | Prohra: −8% coinů",   bgGrad:"linear-gradient(145deg,rgba(80,20,0,0.97),rgba(30,0,0,0.99))",      borderColor:"rgba(255,120,0,0.6)",  glowColor:"rgba(255,80,0,0.5)",    hpBarColor:"linear-gradient(90deg,#ff4400,#ffaa00,#ffe566)", timerColor:"#ffe066", hitParticles:["💥","🌽","✨","⚡"],   hpMult:3, rewardMult:60,  stealPct:0.08, bossTimer:30, defeatMsg:(r)=>`🌽 DÉMON PORAŽEN! +${formatCoins(r)} coinů!`,           escapeMsg:(s)=>`🌽 Démon utekl a ukradl ${formatCoins(s)} coinů!` },
  ladych: { id:"ladych", name:"Ládychův Traktor",  emoji:"🚜", warning:"🚜 LÁDYCHŮV TRAKTOR PŘIJÍŽDÍ! 🚜", subtitle:"Zastav traktor dřív než tě přejede!",  tip:"Výhra: ~80s příjmu | Prohra: −12% coinů",  bgGrad:"linear-gradient(145deg,rgba(5,30,5,0.97),rgba(0,15,0,0.99))",       borderColor:"rgba(80,220,80,0.6)",  glowColor:"rgba(50,200,50,0.5)",   hpBarColor:"linear-gradient(90deg,#1a7a00,#5dcc00,#aaff44)", timerColor:"#aaff66", hitParticles:["🔧","💨","🌾","💥"],   hpMult:4, rewardMult:80,  stealPct:0.12, bossTimer:30, defeatMsg:(r)=>`🚜 TRAKTOR ZASTAVEN! +${formatCoins(r)} coinů!`,          escapeMsg:(s)=>`🚜 Ládych tě přejel a vzal ${formatCoins(s)} coinů!` },
  shifi:  { id:"shifi",  name:"Shifin Duch",       emoji:"👻", warning:"👻 SHIFIN DUCH SE ZJEVUJE! 👻",    subtitle:"Exorcizuj ducha dřív než zmizí!",      tip:"Výhra: ~100s příjmu | Prohra: −15% coinů", bgGrad:"linear-gradient(145deg,rgba(20,0,50,0.97),rgba(5,0,30,0.99))",       borderColor:"rgba(180,80,255,0.6)", glowColor:"rgba(150,50,255,0.5)",  hpBarColor:"linear-gradient(90deg,#6600cc,#aa44ff,#dd99ff)", timerColor:"#cc88ff", hitParticles:["👻","💜","✨","🔮"],   hpMult:5, rewardMult:100, stealPct:0.15, bossTimer:30, defeatMsg:(r)=>`👻 DUCH VYHNÁN! +${formatCoins(r)} coinů!`,              escapeMsg:(s)=>`👻 Shifin duch ukradl ${formatCoins(s)} coinů z druhé dimenze!` },
  olga:   { id:"olga",   name:"Olga Kunysová",     emoji:"👩‍🦳", warning:"💀 OLGA KUNYSOVÁ ÚTOČÍ! 💀",    subtitle:"Olga se zbláznila! Exorcizuj ji rychle!", tip:"Výhra: ~150s příjmu | Prohra: −25% coinů", bgGrad:"linear-gradient(145deg,rgba(60,0,40,0.97),rgba(30,0,20,0.99))",     borderColor:"rgba(255,50,200,0.6)", glowColor:"rgba(220,0,180,0.5)",   hpBarColor:"linear-gradient(90deg,#8b0057,#dd0099,#ff66cc)", timerColor:"#ff99ee", hitParticles:["💥","👩‍🦳","💫","🩸"], hpMult:8, rewardMult:150, stealPct:0.25, bossTimer:25, defeatMsg:(r)=>`👩‍🦳 OLGA ZKROCENA! +${formatCoins(r)} coinů!`,          escapeMsg:(s)=>`💀 Olga Kunysová zničila ${formatCoins(s)} coinů!` },
};

let bossActive = false;
let currentBossType = null;
let bossHP = 0, bossMaxHP = 0, bossTimer2 = 0;
let bossInterval = null;

function spawnBoss(typeId) {
  if (bossActive) return;
  const boss = BOSS_TYPES[typeId]; if (!boss) return;
  bossActive = true; currentBossType = boss;
  bossMaxHP = Math.max(20, Math.floor(perSec * boss.hpMult + stableHorses.reduce((a,h)=>a+h.income,0)*boss.hpMult + 30));
  bossHP = bossMaxHP; bossTimer2 = boss.bossTimer;
  const overlay = document.getElementById("bossOverlay");
  const box = overlay.querySelector(".bossBox");
  box.style.background = boss.bgGrad; box.style.borderColor = boss.borderColor;
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
  renderBoss(); overlay.style.display = "flex";
  overlay.classList.add("bossAppear"); setTimeout(()=>overlay.classList.remove("bossAppear"), 600);
  if (bossInterval) clearInterval(bossInterval);
  bossInterval = setInterval(()=>{ bossTimer2--; renderBoss(); if(bossTimer2<=0) bossEscape(); }, 1000);
}

function clickBoss() {
  if (!bossActive || !currentBossType) return;
  bossHP -= Math.max(1, Math.floor(bossMaxHP / 25));
  spawnBossHitParticle();
  const emojiEl = document.getElementById("bossEmojiEl");
  emojiEl.classList.add("bossHit"); setTimeout(()=>emojiEl.classList.remove("bossHit"),150);
  renderBoss(); if (bossHP <= 0) bossDefeat();
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
  document.getElementById("bossTimerText").innerText = "⏱ "+bossTimer2+"s";
  const col = currentBossType ? currentBossType.timerColor : "#ffe066";
  document.getElementById("bossTimerText").style.color = bossTimer2<=10 ? "#ff4444" : col;
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
    p.className = "bossParticle"; p.innerText = emojis[Math.floor(Math.random()*emojis.length)];
    p.style.left = (rect.left+rect.width/2+(Math.random()-.5)*100)+"px";
    p.style.top  = (rect.top+rect.height/2+(Math.random()-.5)*80)+"px";
    document.body.appendChild(p); setTimeout(()=>p.remove(), 700);
  }
}

function showFloatingText(msg, color) {
  const el = document.createElement("div");
  el.className = "floatingText"; el.innerText = msg; el.style.color = color;
  el.style.top = (window.innerHeight/2-60)+"px"; el.style.left = "50%";
  document.body.appendChild(el); setTimeout(()=>el.remove(), 2400);
}

function openBossInfo() {
  const map = { corn:"killsCorn", ladych:"killsLadych", shifi:"killsShifi", olga:"killsOlga" };
  for (const [id, elId] of Object.entries(map)) {
    const el = document.getElementById(elId); if (el) el.innerText = (bossKills[id]||0)+"× poražen";
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
  p.style.top  = (rect.top+rect.height/2)+"px";
  document.body.appendChild(p); setTimeout(()=>p.remove(), 900);
}

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
  activateDoubleCoinTimer(); update(); saveGame();
}

// ─── TICKET ──────────────────────────────
function buyTicket() {
  document.getElementById("ticketResult").innerText = "";
  document.getElementById("ticketModal").style.display = "flex";
}
function confirmTicket() {
  if (coins < 250000) { document.getElementById("ticketResult").innerText = "❌ Nemáš dost coinů!"; return; }
  coins -= 250000;
  const rng = Math.random(); let msg = "";
  if (rng < 0.15)       { const w=5000000; coins+=w; totalCoinsEarned+=w; msg="🎉 VÝHRA! +5 000 000 coins!"; }
  else if (rng < 0.50)  { const w=500000;  coins+=w; totalCoinsEarned+=w; msg="😐 Malá výhra... +500 000 coins."; }
  else                  { msg="💀 Smůla! Ztratil jsi vsázku."; }
  document.getElementById("ticketResult").innerText = msg;
  update(); saveGame();
}

// ═══════════════════════════════════════
//  SLOT – 10 spinů / 5 MINUT (timer přežije reload)
// ═══════════════════════════════════════
let currentBet = 0;

function openSlotMachine() {
  currentBet = 0;
  document.getElementById("slotBetDisplay").innerText = "Vsazeno: 0";
  document.getElementById("slotResult").innerText = "";
  document.getElementById("customBet").value = "";
  updateSlotSpinInfo();
  document.getElementById("slotModal").style.display = "flex";
}

function getSlotCooldownLeft() {
  if (!slotCooldownEnd) return 0;
  return Math.max(0, Math.ceil((slotCooldownEnd - Date.now()) / 1000));
}

function updateSlotSpinInfo() {
  const el = document.getElementById("slotSpinInfo"); if (!el) return;
  const secsLeft = getSlotCooldownLeft();
  if (secsLeft > 0) {
    const mins = Math.floor(secsLeft/60), secs = secsLeft%60;
    el.innerText = "⏳ Čekej "+mins+":"+String(secs).padStart(2,"0");
    el.style.color = "#ff6666";
  } else {
    if (slotCooldownEnd > 0 && secsLeft <= 0) { slotSpinsLeft = 10; slotCooldownEnd = 0; saveGame(); }
    el.innerText = "🎲 Zbývá spinů: "+slotSpinsLeft+" / 10";
    el.style.color = slotSpinsLeft > 3 ? "#39ff6b" : "#ffaa44";
  }
}

function setBet(amount) { currentBet = amount; document.getElementById("slotBetDisplay").innerText = "Vsazeno: "+formatCoins(currentBet); }
function setCustomBet() {
  const val = parseInt(document.getElementById("customBet").value);
  if (isNaN(val)||val<=0) { document.getElementById("slotResult").innerText="❌ Zadej platné číslo!"; return; }
  currentBet=val; document.getElementById("slotBetDisplay").innerText="Vsazeno: "+formatCoins(currentBet);
}

function runSlot() {
  const secsLeft = getSlotCooldownLeft();
  if (secsLeft > 0) { const m=Math.floor(secsLeft/60),s=secsLeft%60; document.getElementById("slotResult").innerText="⏳ Čekej "+m+":"+String(s).padStart(2,"0")+"!"; return; }
  if (slotSpinsLeft <= 0) { slotCooldownEnd = Date.now() + 5*60*1000; saveGame(); updateSlotSpinInfo(); return; }
  if (currentBet<=0||currentBet>coins) { document.getElementById("slotResult").innerText=currentBet<=0?"❌ Zvol sázku!":"❌ Nemáš dost coinů!"; return; }
  coins -= currentBet; slotSpinsLeft--;
  const rng = Math.random(); let msg = "";
  if (rng<0.50)       { msg="😢 Prohra. Ztratil jsi "+formatCoins(currentBet); }
  else if (rng<0.75)  { const w=Math.floor(currentBet*2*researchBonuses.slotWinMult); coins+=w; totalCoinsEarned+=w; msg="🎉 Výhra 2x! +"+formatCoins(w); }
  else if (rng<0.90)  { const w=Math.floor(currentBet*3*researchBonuses.slotWinMult); coins+=w; totalCoinsEarned+=w; msg="🔥 Výhra 3x! +"+formatCoins(w); }
  else                { const w=Math.floor(currentBet*10*researchBonuses.slotWinMult); coins+=w; totalCoinsEarned+=w; msg="💎 JACKPOT 10x! +"+formatCoins(w); }
  document.getElementById("slotResult").innerText = msg;
  if (slotSpinsLeft <= 0) { slotCooldownEnd = Date.now() + 5*60*1000; saveGame(); }
  updateSlotSpinInfo(); update(); saveGame();
}

// ═══════════════════════════════════════
//  ULTIMATE SLOT – 10 spinů / 10 MINUT (timer přežije reload)
// ═══════════════════════════════════════
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

function getUltimateCooldownLeft() {
  if (!ultimateCooldownEnd) return 0;
  return Math.max(0, Math.ceil((ultimateCooldownEnd - Date.now()) / 1000));
}

function updateUltimateSpinInfo() {
  const el = document.getElementById("ultimateSpinInfo"); if (!el) return;
  const secsLeft = getUltimateCooldownLeft();
  if (secsLeft > 0) {
    const mins = Math.floor(secsLeft/60), secs = secsLeft%60;
    el.innerText = "⏳ Čekej "+mins+":"+String(secs).padStart(2,"0");
    el.style.color="#ff6666";
  } else {
    if (ultimateCooldownEnd > 0 && secsLeft <= 0) { ultimateSpinsLeft = 10; ultimateCooldownEnd = 0; saveGame(); }
    el.innerText = "👑 Zbývá spinů: "+ultimateSpinsLeft+" / 10";
    el.style.color = ultimateSpinsLeft > 3 ? "#ffd700" : "#ffaa44";
  }
}

function setUltimateBet(amount) { ultimateBet=amount; document.getElementById("ultimateBetDisplay").innerText="Vsazeno: "+formatCoins(ultimateBet); }
function setUltimateCustomBet() {
  const val=parseInt(document.getElementById("ultimateCustomBet").value);
  if (isNaN(val)||val<500000) { document.getElementById("ultimateResult").innerText="❌ Min. vklad je 500 000!"; return; }
  ultimateBet=val; document.getElementById("ultimateBetDisplay").innerText="Vsazeno: "+formatCoins(ultimateBet);
}

function spinUltimate() {
  const secsLeft = getUltimateCooldownLeft();
  if (secsLeft > 0) { document.getElementById("ultimateResult").innerText="⏳ Automat se dobíjí!"; return; }
  if (ultimateSpinsLeft <= 0) { ultimateCooldownEnd = Date.now() + 10*60*1000; saveGame(); updateUltimateSpinInfo(); return; }
  if (ultimateBet<500000) { document.getElementById("ultimateResult").innerText="❌ Min. vklad je 500 000!"; return; }
  if (ultimateBet>coins) { document.getElementById("ultimateResult").innerText="❌ Nemáš dost coinů!"; return; }
  coins -= ultimateBet; ultimateSpinsLeft--;
  updateUltimateSpinInfo();
  document.getElementById("spinBtn").disabled = true;
  document.getElementById("ultimateResult").innerText = "";
  let ticks = 0;
  const interval = setInterval(()=>{
    ticks++;
    ["reel1","reel2","reel3"].forEach(id=>{ document.getElementById(id).innerText=ULTIMATE_SYMBOLS[Math.floor(Math.random()*ULTIMATE_SYMBOLS.length)]; });
    if (ticks >= 20) {
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
      if (ultimateSpinsLeft<=0) { ultimateCooldownEnd = Date.now() + 10*60*1000; saveGame(); }
      updateUltimateSpinInfo(); update(); saveGame();
    }
  }, 80);
  update();
}

// Tick pro slot timery (aby se UI updatovalo každou sekundu i bez otevřeného modalu)
setInterval(()=>{
  updateSlotSpinInfo();
  updateUltimateSpinInfo();
}, 1000);

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
  setInterval(()=>{ msgIdx=(msgIdx+1)%messages.length; const el=document.getElementById("blimpBannerText"); if(el) el.textContent=messages[msgIdx]; },4000);
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

function formatCoins(n) {
  if (n>=1e12) return (n/1e12).toFixed(2)+"T";
  if (n>=1e9)  return (n/1e9).toFixed(2)+"B";
  if (n>=1e6)  return (n/1e6).toFixed(2)+"M";
  if (n>=1000) return (n/1000).toFixed(1)+"K";
  return String(Math.floor(n));
}

// ═══════════════════════════════════════
//  ACHIEVEMENTS
// ═══════════════════════════════════════
const ACHIEVEMENT_DEFS = [
  { id:"coins1k",    label:"💰 1K Coins",                  check:()=>totalCoinsEarned>=1000 },
  { id:"coins100k",  label:"💵 100K Coins",                check:()=>totalCoinsEarned>=100000 },
  { id:"coins1m",    label:"🔥 1M Coins",                  check:()=>totalCoinsEarned>=1000000 },
  { id:"coins1b",    label:"💎 1B Coins",                  check:()=>totalCoinsEarned>=1000000000 },
  { id:"ufo",        label:"🛸 UFO Vlastník",              check:()=>hasUFO },
  { id:"garage",     label:"🚗 Garáž Kotlise",             check:()=>hasGarageKotlise },
  { id:"car",        label:"🏎️ Kotlise Auto",              check:()=>hasKotliseCar },
  { id:"stajnik",    label:"🐎 Stájník",                   check:()=>stableHorses.length>0 },
  { id:"horse6",     label:"🐴 Plná Stáj",                 check:()=>stableHorses.length>=6 },
  { id:"boss1",      label:"🌽 První Boss Poražen",        check:()=>bossesDefeated>=1 },
  { id:"boss5",      label:"👹 5× Boss Poražen",           check:()=>bossesDefeated>=5 },
  { id:"boss10",     label:"💀 10× Boss Poražen",          check:()=>bossesDefeated>=10 },
  { id:"cornKill",   label:"🌽 Kukuřičný Démon Poražen",   check:()=>(bossKills.corn||0)>=1 },
  { id:"ladychKill", label:"🚜 Ládychův Traktor Zastaven", check:()=>(bossKills.ladych||0)>=1 },
  { id:"shifiKill",  label:"👻 Shifin Duch Vyhnán",        check:()=>(bossKills.shifi||0)>=1 },
  { id:"olgaKill",   label:"👩‍🦳 Olga Kunysová Zkrocena",  check:()=>(bossKills.olga||0)>=1 },
  { id:"olgaKill3",  label:"💀 Olga 3× Zkrocena",          check:()=>(bossKills.olga||0)>=3 },
  { id:"lvl50",      label:"⭐ Kůň Max Level",             check:()=>stableHorses.some(h=>h.level>=50) },
  { id:"research1",  label:"🔬 První Výzkum Dokončen",     check:()=>researchDone.size>=1 },
  { id:"research5",  label:"🧪 5 Výzkumů Dokončeno",       check:()=>researchDone.size>=5 },
  { id:"secretShop", label:"🤫 Tajný Obchod Navštíven",    check:()=>secretShopActive },
  { id:"fisher1",    label:"🎣 První Ryba Chycena",        check:()=>totalFishCaught>=1 },
  { id:"fisher10",   label:"🐟 10 Ryb Chyceno",            check:()=>totalFishCaught>=10 },
  { id:"invest1",    label:"📈 První Investice",           check:()=>totalInvestments>=1 },
  { id:"kabinet1",   label:"🎓 Kabinet Navštíven",         check:()=>peptalkVisits>=1 },
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

// ═══════════════════════════════════════
//  RYBNÍK 🎣
// ═══════════════════════════════════════
const FISH_TYPES = [
  { id:"kapr",    name:"Kapr",        emoji:"🐟", rarity:"common",    rarityLabel:"Obyčejná", baseValue:50,    weight:50 },
  { id:"stika",   name:"Štika",       emoji:"🐠", rarity:"common",    rarityLabel:"Obyčejná", baseValue:80,    weight:40 },
  { id:"sumec",   name:"Sumec",       emoji:"🐡", rarity:"uncommon",  rarityLabel:"Neobvyklá",baseValue:200,   weight:25 },
  { id:"pstruh",  name:"Pstruh",      emoji:"🦈", rarity:"uncommon",  rarityLabel:"Neobvyklá",baseValue:350,   weight:20 },
  { id:"lossos",  name:"Losos",       emoji:"🐬", rarity:"rare",      rarityLabel:"Vzácná",   baseValue:1000,  weight:10 },
  { id:"uhor",    name:"Úhoř",        emoji:"🐍", rarity:"rare",      rarityLabel:"Vzácná",   baseValue:1500,  weight:8  },
  { id:"krab",    name:"Krab Kotlis", emoji:"🦀", rarity:"epic",      rarityLabel:"Epická",   baseValue:5000,  weight:4  },
  { id:"zlatykapr",name:"Zlatý Kapr", emoji:"✨", rarity:"legendary", rarityLabel:"Legendární",baseValue:25000, weight:1  },
];

const RARITY_COLORS = { common:"#aaa", uncommon:"#4caf50", rare:"#2196f3", epic:"#9c27b0", legendary:"#ff9800" };

const FISHING_RODS = [
  { id:"rod0", name:"Větev od Ládycha",  emoji:"🌿", cost:0,       cooldownMult:1.0,  rarityBonus:0,   owned:true },
  { id:"rod1", name:"Bambusová Tyč",     emoji:"🎋", cost:5000,    cooldownMult:0.85, rarityBonus:5,   owned:false },
  { id:"rod2", name:"Pep Prut",          emoji:"🎣", cost:50000,   cooldownMult:0.65, rarityBonus:15,  owned:false },
  { id:"rod3", name:"Kotlisův Speciál",  emoji:"🏆", cost:500000,  cooldownMult:0.45, rarityBonus:30,  owned:false },
  { id:"rod4", name:"Zlatá Šifka",       emoji:"⭐", cost:5000000, cooldownMult:0.25, rarityBonus:50,  owned:false },
];

const FISHING_BAITS = [
  { id:"bait0", name:"Žížala",           emoji:"🪱", cost:0,      rarityBonus:0,  owned:true,  infinite:true },
  { id:"bait1", name:"Kukuřice",         emoji:"🌽", cost:500,    rarityBonus:10, owned:false, count:0 },
  { id:"bait2", name:"Kotlisova Slanina",emoji:"🥓", cost:5000,   rarityBonus:25, owned:false, count:0 },
  { id:"bait3", name:"Magická Nástraha", emoji:"💎", cost:50000,  rarityBonus:50, owned:false, count:0 },
];

let fishInventory   = []; // { id, name, emoji, rarity, value, count }
let fishCooldown    = 0;  // seconds remaining
let fishCooldownMax = 3;  // seconds
let fishCooldownInterval = null;
let selectedRodIdx  = 0;
let selectedBaitIdx = 0;
let totalFishCaught = 0;

function openFishing() {
  renderFishingModal();
  document.getElementById("fishingModal").style.display = "flex";
}

function renderFishingModal() {
  renderRodList();
  renderBaitList();
  renderFishInventory();
  updateFishSellTotal();
}

function renderRodList() {
  const el = document.getElementById("rodList"); if (!el) return;
  el.innerHTML = FISHING_RODS.map((r,i) => {
    const selected = selectedRodIdx === i;
    const canAfford = coins >= r.cost;
    if (!r.owned) {
      return `<button class="fishGearBtn ${selected?'fishGearSelected':''}" onclick="buyRod(${i})">
        ${r.emoji} ${r.name}<br>
        <span style="font-size:10px;color:#ffd700">${formatCoins(r.cost)} coins</span>
      </button>`;
    }
    return `<button class="fishGearBtn ${selected?'fishGearSelected':''}" onclick="selectRod(${i})">
      ${r.emoji} ${r.name}<br>
      <span style="font-size:10px;color:#39ff6b">-${Math.round((1-r.cooldownMult)*100)}% čas | +${r.rarityBonus}% vzácnost</span>
    </button>`;
  }).join("");
}

function renderBaitList() {
  const el = document.getElementById("baitList"); if (!el) return;
  el.innerHTML = FISHING_BAITS.map((b,i) => {
    const selected = selectedBaitIdx === i;
    if (!b.owned && !b.infinite) {
      return `<button class="fishGearBtn" onclick="buyBait(${i})">
        ${b.emoji} ${b.name}<br>
        <span style="font-size:10px;color:#ffd700">${formatCoins(b.cost)} / kus | +${b.rarityBonus}% vzácnost</span>
      </button>`;
    }
    return `<button class="fishGearBtn ${selected?'fishGearSelected':''}" onclick="selectBait(${i})">
      ${b.emoji} ${b.name}${b.infinite?'':' ('+b.count+')'}
      <br><span style="font-size:10px;color:#39ff6b">+${b.rarityBonus}% vzácnost</span>
    </button>`;
  }).join("");
}

function buyRod(idx) {
  const r = FISHING_RODS[idx];
  if (r.owned) { selectRod(idx); return; }
  if (coins < r.cost) { showToast("Nemáš dost coinů!"); return; }
  coins -= r.cost; r.owned = true;
  selectRod(idx); renderRodList(); update(); saveGame();
}

function buyBait(idx) {
  const b = FISHING_BAITS[idx];
  if (coins < b.cost) { showToast("Nemáš dost coinů!"); return; }
  coins -= b.cost; b.owned = true; b.count = (b.count||0) + 5;
  selectBait(idx); renderBaitList(); update(); saveGame();
}

function selectRod(idx)  { selectedRodIdx  = idx; renderRodList(); }
function selectBait(idx) { selectedBaitIdx = idx; renderBaitList(); }

function castLine() {
  if (fishCooldown > 0) return;
  const rod  = FISHING_RODS[selectedRodIdx]  || FISHING_RODS[0];
  const bait = FISHING_BAITS[selectedBaitIdx] || FISHING_BAITS[0];

  // Consume bait if not infinite
  if (!bait.infinite) {
    if (!bait.owned || bait.count <= 0) { showToast("Nemáš návnadu! Kup ji v obchodě."); return; }
    bait.count--;
    if (bait.count <= 0) { bait.owned = false; selectedBaitIdx = 0; }
    renderBaitList();
  }

  // Calculate which fish to catch
  const rarityBonus = rod.rarityBonus + bait.rarityBonus;
  const fish = pickFish(rarityBonus);
  totalFishCaught++;

  // Show catch animation
  showFishCatch(fish);
  addFishToInventory(fish);
  renderFishInventory();
  updateFishSellTotal();

  // Start cooldown
  fishCooldownMax = Math.max(1, Math.round(3 * rod.cooldownMult));
  fishCooldown = fishCooldownMax;
  startFishCooldown();
  checkAchievements(); update(); saveGame();
}

function pickFish(rarityBonus) {
  // Adjust weights based on rarity bonus
  let pool = FISH_TYPES.map(f => {
    let w = f.weight;
    if (f.rarity !== "common") w = w * (1 + rarityBonus / 100);
    return { ...f, w };
  });
  const total = pool.reduce((s,f) => s+f.w, 0);
  let rng = Math.random() * total;
  for (const f of pool) { rng -= f.w; if (rng <= 0) return f; }
  return pool[0];
}

function addFishToInventory(fish) {
  // Fish value scales with coins (richer player = more valuable fish)
  const scaleMult = Math.max(1, Math.log10(Math.max(100, coins)) / 2);
  const value = Math.floor(fish.baseValue * scaleMult);
  const existing = fishInventory.find(f => f.id === fish.id);
  if (existing) { existing.count++; existing.value = value; }
  else fishInventory.push({ id:fish.id, name:fish.name, emoji:fish.emoji, rarity:fish.rarity, rarityLabel:fish.rarityLabel, value, count:1 });
}

function renderFishInventory() {
  const grid = document.getElementById("fishInventoryGrid"); if (!grid) return;
  const count = document.getElementById("fishInvCount"); if (count) count.innerText = "("+fishInventory.reduce((s,f)=>s+f.count,0)+")";
  if (fishInventory.length === 0) { grid.innerHTML = `<div style="color:#555;font-size:12px;padding:10px">Zatím žádné ryby. Jdi rybařit!</div>`; return; }
  grid.innerHTML = fishInventory.map(f => `
    <div class="fishItem" style="border-color:${RARITY_COLORS[f.rarity]}">
      <div class="fishEmoji">${f.emoji}</div>
      <div class="fishName">${f.name}</div>
      <div class="fishRarity" style="color:${RARITY_COLORS[f.rarity]}">${f.rarityLabel}</div>
      <div class="fishValue">${formatCoins(f.value)} coins</div>
      <div class="fishCount">×${f.count}</div>
    </div>
  `).join("");
}

function updateFishSellTotal() {
  const total = fishInventory.reduce((s,f) => s + f.value * f.count, 0);
  const el = document.getElementById("fishSellTotal"); if (el) el.innerText = formatCoins(total);
}

function sellAllFish() {
  const total = fishInventory.reduce((s,f) => s + f.value * f.count, 0);
  if (total === 0) { showToast("Nemáš co prodat!"); return; }
  coins += total; totalCoinsEarned += total;
  fishInventory = [];
  renderFishInventory(); updateFishSellTotal();
  showToast("🎣 Bicák koupil ryby za "+formatCoins(total)+" coins!");
  update(); saveGame();
}

function showFishCatch(fish) {
  const pond = document.getElementById("fishingPond"); if (!pond) return;
  const label = document.getElementById("pondLabel"); if (label) label.innerText = fish.emoji+" "+fish.name+" ("+fish.rarityLabel+")!";
  setTimeout(()=>{ if (label) label.innerText = "🎣 KLIKNI PRO RYBAŘENÍ"; }, 2000);
}

function startFishCooldown() {
  const fill = document.getElementById("fishingCoolFill");
  const text = document.getElementById("fishingCoolText");
  if (fishCooldownInterval) clearInterval(fishCooldownInterval);
  fishCooldownInterval = setInterval(()=>{
    fishCooldown--;
    const pct = (fishCooldown / fishCooldownMax) * 100;
    if (fill) fill.style.width = pct+"%";
    if (text) text.innerText = fishCooldown > 0 ? "Čekej... "+fishCooldown+"s" : "Připraveno k rybaření!";
    if (fishCooldown <= 0) { clearInterval(fishCooldownInterval); if (fill) fill.style.width="100%"; }
  }, 1000);
}

// ═══════════════════════════════════════
//  INVESTICE 📈
// ═══════════════════════════════════════
const INVEST_DEFS = [
  { id:"inv_corn",   name:"Kukuřičné Pole",     emoji:"🌽", desc:"Nízké riziko, stabilní výnos.",         cost:10000,    minMult:1.1,  maxMult:1.4,  failChance:0.05, durationSec:30,  risk:"Nízké",  riskColor:"#4caf50" },
  { id:"inv_horse",  name:"Dostihový Kůň",       emoji:"🐎", desc:"Střední riziko, dobrý výnos.",          cost:100000,   minMult:1.3,  maxMult:2.0,  failChance:0.15, durationSec:60,  risk:"Střední",riskColor:"#ffaa00" },
  { id:"inv_traktor",name:"Ládychův Traktor",    emoji:"🚜", desc:"Traktor vydělá nebo shoří.",            cost:500000,   minMult:1.5,  maxMult:3.0,  failChance:0.25, durationSec:90,  risk:"Střední",riskColor:"#ffaa00" },
  { id:"inv_bazar",  name:"Kotlisův Bazar",      emoji:"🛒", desc:"Riziková investice s velkým výnosem.", cost:1000000,  minMult:2.0,  maxMult:5.0,  failChance:0.35, durationSec:120, risk:"Vysoké", riskColor:"#ff6644" },
  { id:"inv_ufo",    name:"UFO Technologie",     emoji:"🛸", desc:"Extrémní riziko, extrémní odměna.",    cost:10000000, minMult:3.0,  maxMult:10.0, failChance:0.50, durationSec:180, risk:"Extrémní",riskColor:"#ff2244" },
  { id:"inv_olga",   name:"Olgino Impérium",     emoji:"👩‍🦳",desc:"Legendární investice. Nebo zkáza.",   cost:50000000, minMult:5.0,  maxMult:20.0, failChance:0.60, durationSec:300, risk:"Legendární",riskColor:"#cc00ff" },
];

let activeInvestments = []; // { defId, endsAt, cost, result (null until done) }
let totalInvestments  = 0;
let investTimerInterval = null;

function openInvest() {
  renderInvestModal();
  document.getElementById("investModal").style.display = "flex";
  if (!investTimerInterval) {
    investTimerInterval = setInterval(()=>{ checkInvestments(); renderInvestModal(); }, 1000);
  }
}

function checkInvestments() {
  let changed = false;
  activeInvestments.forEach(inv => {
    if (inv.result !== null) return;
    if (Date.now() >= inv.endsAt) {
      const def = INVEST_DEFS.find(d => d.id === inv.defId);
      if (!def) return;
      const failed = Math.random() < def.failChance;
      if (failed) {
        inv.result = { success:false, profit:0, msg:"💸 Investice selhala! Ztratil jsi "+formatCoins(inv.cost) };
      } else {
        const mult = def.minMult + Math.random() * (def.maxMult - def.minMult);
        const payout = Math.floor(inv.cost * mult);
        const profit = payout - inv.cost;
        coins += payout; totalCoinsEarned += payout;
        inv.result = { success:true, profit, msg:"📈 Výnos "+mult.toFixed(1)+"x! +"+formatCoins(profit)+" zisk!" };
      }
      showAchievementPopup(inv.result.msg);
      changed = true;
    }
  });
  if (changed) { update(); saveGame(); }
}

function makeInvestment(defId) {
  const def = INVEST_DEFS.find(d => d.id === defId); if (!def) return;
  if (coins < def.cost) { showToast("Nemáš dost coinů!"); return; }
  // Max 1 aktivní investice stejného typu
  if (activeInvestments.some(i => i.defId === defId && i.result === null)) {
    showToast("Tato investice už probíhá!"); return;
  }
  coins -= def.cost;
  activeInvestments.push({ defId, endsAt: Date.now() + def.durationSec * 1000, cost: def.cost, result: null });
  totalInvestments++;
  renderInvestModal(); update(); saveGame();
}

function clearFinishedInvestments() {
  activeInvestments = activeInvestments.filter(i => i.result === null);
  renderInvestModal(); saveGame();
}

function renderInvestModal() {
  const grid = document.getElementById("investGrid"); if (!grid) return;
  const portfolio = document.getElementById("investPortfolio");
  const activeList = document.getElementById("investActiveList");

  // Active investments
  const active = activeInvestments.filter(i => i.result === null);
  const finished = activeInvestments.filter(i => i.result !== null);

  if (active.length > 0 || finished.length > 0) {
    portfolio.style.display = "block";
    let html = active.map(inv => {
      const def = INVEST_DEFS.find(d => d.id === inv.defId);
      const secsLeft = Math.max(0, Math.ceil((inv.endsAt - Date.now()) / 1000));
      const mins = Math.floor(secsLeft/60), secs = secsLeft%60;
      return `<div class="investActiveItem">
        ${def.emoji} <strong>${def.name}</strong> – sázka: ${formatCoins(inv.cost)}
        <span class="investTimer">⏳ ${mins}:${String(secs).padStart(2,"0")}</span>
      </div>`;
    }).join("");
    html += finished.map(inv => `
      <div class="investFinishedItem ${inv.result.success?'investWin':'investLose'}">
        ${inv.result.msg}
      </div>
    `).join("");
    if (finished.length > 0) html += `<button class="investClearBtn" onclick="clearFinishedInvestments()">Vymazat výsledky</button>`;
    activeList.innerHTML = html;
  } else {
    portfolio.style.display = "none";
  }

  // Investment options
  grid.innerHTML = INVEST_DEFS.map(def => {
    const isActive = activeInvestments.some(i => i.defId === def.id && i.result === null);
    const canAfford = coins >= def.cost;
    const durMins = Math.floor(def.durationSec/60), durSecs = def.durationSec%60;
    return `<div class="investCard ${isActive?'investActive':''}">
      <div class="investCardIcon">${def.emoji}</div>
      <div class="investCardInfo">
        <div class="investCardName">${def.name}</div>
        <div class="investCardDesc">${def.desc}</div>
        <div class="investCardStats">
          <span style="color:${def.riskColor}">⚠️ ${def.risk}</span>
          <span>📈 ${def.minMult}x–${def.maxMult}x</span>
          <span>⏱ ${durMins > 0 ? durMins+"m " : ""}${durSecs > 0 ? durSecs+"s" : ""}</span>
          <span>💀 ${Math.round(def.failChance*100)}% fail</span>
        </div>
      </div>
      <button class="investBtn ${canAfford?'investCanAfford':''}" onclick="makeInvestment('${def.id}')" ${isActive?'disabled':''}>
        ${isActive ? '⏳ Probíhá' : 'INVESTUJ<br><span style="font-size:11px">'+formatCoins(def.cost)+'</span>'}
      </button>
    </div>`;
  }).join("");
}

// ═══════════════════════════════════════
//  KABINET / PEPTALK 🎓
// ═══════════════════════════════════════
const PEPTALK_QUESTIONS = [
  { q:"Kolik má Česká republika krajů?",    a:["13","14","15","16"],      correct:1, reward:5000 },
  { q:"Co je hlavní město Francie?",        a:["Berlín","Madrid","Paříž","Řím"], correct:2, reward:3000 },
  { q:"Kolik je 7 × 8?",                   a:["54","56","58","60"],      correct:1, reward:2000 },
  { q:"Kdo napsal Babičku?",               a:["Němcová","Čapek","Mácha","Neruda"], correct:0, reward:4000 },
  { q:"Jaký je chemický vzorec vody?",      a:["CO2","H2O","NaCl","O2"], correct:1, reward:6000 },
  { q:"Kolik noh má pavouk?",              a:["6","8","10","12"],        correct:1, reward:3500 },
  { q:"Který rok byl konec 2. světové války?",a:["1943","1944","1945","1946"],correct:2,reward:8000},
  { q:"Co je největší oceán?",             a:["Atlantický","Indický","Tichý","Arktický"],correct:2,reward:5000},
  { q:"Kolik bitů má 1 bajt?",             a:["4","6","8","16"],        correct:2, reward:7000 },
  { q:"Jak se jmenuje ředitel Pep Clickeru?", a:["Kotlise","Ládych","Šifka","Kunys"], correct:0, reward:10000 },
  { q:"Kolik planet má Sluneční soustava?", a:["7","8","9","10"],        correct:1, reward:4000 },
  { q:"Jaký je nejdelší řeka světa?",      a:["Amazonka","Nil","Volha","Jang-c'-ťiang"],correct:1,reward:5000},
  { q:"Co znamená zkratka CPU?",           a:["Centrální procesorová jednotka","Jednotka zpracování grafiky","Hlavní paměť","Síťová karta"],correct:0,reward:6000},
  { q:"Kolik minut má hodina?",            a:["50","55","60","65"],     correct:2, reward:1000 },
  { q:"Kdo namaloval Mona Lisu?",          a:["Picasso","da Vinci","van Gogh","Rembrandt"],correct:1,reward:7000},
];

let peptalkState     = "idle"; // idle | question | result | cooldown
let peptalkQIdx      = -1;
let peptalkStreak    = 0;
let peptalkVisits    = 0;
let peptalkCooldownEnd = 0;

function openPeptalk() {
  peptalkVisits++;
  checkAchievements();
  if (peptalkCooldownEnd > Date.now()) {
    const secsLeft = Math.ceil((peptalkCooldownEnd - Date.now()) / 1000);
    const mins = Math.floor(secsLeft/60), secs = secsLeft%60;
    document.getElementById("peptalkQuestion").innerText = "Ředitel je zaneprázdněn...";
    document.getElementById("peptalkSubtext").innerText  = "Vrať se za "+mins+":"+String(secs).padStart(2,"0");
    document.getElementById("peptalkAnswers").innerHTML  = "";
    document.getElementById("peptalkResult").style.display = "none";
    document.getElementById("peptalkProgress").innerText = "";
    document.getElementById("peptalkModal").style.display = "flex";
    return;
  }
  startPeptalk();
  document.getElementById("peptalkModal").style.display = "flex";
}

function startPeptalk() {
  peptalkStreak = 0;
  nextPeptalkQuestion();
}

function nextPeptalkQuestion() {
  peptalkQIdx = Math.floor(Math.random() * PEPTALK_QUESTIONS.length);
  const q = PEPTALK_QUESTIONS[peptalkQIdx];
  document.getElementById("peptalkQuestion").innerText = q.q;
  document.getElementById("peptalkSubtext").innerText  = "Odměna za správnou odpověď: "+formatCoins(q.reward * (1 + peptalkStreak * 0.5))+" coinů";
  document.getElementById("peptalkProgress").innerText = peptalkStreak > 0 ? "🔥 Série: "+peptalkStreak : "";
  document.getElementById("peptalkResult").style.display = "none";
  document.getElementById("peptalkNPC").innerText = "👨‍💼";
  const answersEl = document.getElementById("peptalkAnswers");
  answersEl.innerHTML = q.a.map((ans, i) =>
    `<button class="peptalkAnswerBtn" onclick="answerPeptalk(${i})">${ans}</button>`
  ).join("");
  peptalkState = "question";
}

function answerPeptalk(idx) {
  const q    = PEPTALK_QUESTIONS[peptalkQIdx];
  const resultEl = document.getElementById("peptalkResult");
  const answersEl = document.getElementById("peptalkAnswers");
  // Disable all buttons
  answersEl.querySelectorAll("button").forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.style.background = "rgba(57,255,107,0.3)";
    else if (i === idx && idx !== q.correct) btn.style.background = "rgba(255,50,50,0.3)";
  });

  if (idx === q.correct) {
    peptalkStreak++;
    const reward = Math.floor(q.reward * (1 + (peptalkStreak-1) * 0.5));
    coins += reward; totalCoinsEarned += reward;
    document.getElementById("peptalkNPC").innerText = "🎉";
    resultEl.innerText = "✅ Správně! +"+formatCoins(reward)+" coinů! (Série: "+peptalkStreak+"×)";
    resultEl.style.color = "#39ff6b";
    resultEl.style.display = "block";
    update(); saveGame();
    setTimeout(() => {
      if (peptalkStreak >= 5) {
        resultEl.innerText = "🏆 PERFEKTNÍ SÉRIE 5! Bonus: +"+formatCoins(q.reward*5)+" coinů!";
        const bonus = q.reward * 5;
        coins += bonus; totalCoinsEarned += bonus;
        peptalkStreak = 0;
        peptalkCooldownEnd = Date.now() + 5*60*1000; // 5 min cooldown po sérii
        update(); saveGame();
        setTimeout(() => closeModal("peptalkModal"), 2500);
      } else {
        nextPeptalkQuestion();
      }
    }, 1500);
  } else {
    peptalkStreak = 0;
    document.getElementById("peptalkNPC").innerText = "😤";
    resultEl.innerText = "❌ Špatně! Správně bylo: "+q.a[q.correct];
    resultEl.style.color = "#ff4444";
    resultEl.style.display = "block";
    peptalkCooldownEnd = Date.now() + 2*60*1000; // 2 min cooldown po prohře
    update();
    setTimeout(() => {
      answersEl.innerHTML = `<button class="peptalkAnswerBtn" onclick="nextPeptalkQuestion()" style="background:rgba(255,255,255,0.1)">Zkusit znovu</button>`;
    }, 1500);
  }
}

// ═══════════════════════════════════════
//  SAVE / LOAD
// ═══════════════════════════════════════
function saveGame() {
  if (!userKey) return;
  localStorage.setItem(userKey+"_save", JSON.stringify({
    coins, perSec, upgrades, upgradeCounts,
    hasUFO, hasGarageKotlise, hasKotliseCar, hasElectroBoiler,
    stableHorses,
    slotSpinsLeft, slotCooldownEnd,
    ultimateSpinsLeft, ultimateCooldownEnd,
    unlockedAchievements:[...unlockedAchievements],
    totalCoinsEarned, bossesDefeated, bossKills,
    researchDone:[...researchDone], researchActive, researchBonuses,
    // fishing
    fishInventory, totalFishCaught, selectedRodIdx, selectedBaitIdx,
    fishingRodsOwned: FISHING_RODS.map(r=>r.owned),
    fishingBaits: FISHING_BAITS.map(b=>({owned:b.owned,count:b.count||0})),
    // investments
    activeInvestments, totalInvestments,
    // peptalk
    peptalkVisits, peptalkCooldownEnd,
  }));
}

function loadGame() {
  const raw = localStorage.getItem(userKey+"_save"); if (!raw) return;
  try {
    const d = JSON.parse(raw);
    coins=d.coins||0; perSec=d.perSec||0;
    hasUFO=d.hasUFO||false; hasGarageKotlise=d.hasGarageKotlise||false;
    hasKotliseCar=d.hasKotliseCar||false; hasElectroBoiler=d.hasElectroBoiler||false;
    stableHorses=d.stableHorses||[];

    // Slot timery – loaded as timestamps
    slotSpinsLeft=d.slotSpinsLeft??10;
    slotCooldownEnd=d.slotCooldownEnd||0;
    ultimateSpinsLeft=d.ultimateSpinsLeft??10;
    ultimateCooldownEnd=d.ultimateCooldownEnd||0;

    // Check if cooldowns already expired
    if (slotCooldownEnd > 0 && Date.now() >= slotCooldownEnd) { slotSpinsLeft=10; slotCooldownEnd=0; }
    if (ultimateCooldownEnd > 0 && Date.now() >= ultimateCooldownEnd) { ultimateSpinsLeft=10; ultimateCooldownEnd=0; }

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

    // Fishing
    if (d.fishInventory) fishInventory=d.fishInventory;
    if (d.totalFishCaught) totalFishCaught=d.totalFishCaught;
    if (d.selectedRodIdx !== undefined) selectedRodIdx=d.selectedRodIdx;
    if (d.selectedBaitIdx !== undefined) selectedBaitIdx=d.selectedBaitIdx;
    if (d.fishingRodsOwned) d.fishingRodsOwned.forEach((owned,i)=>{ if(FISHING_RODS[i]) FISHING_RODS[i].owned=owned; });
    if (d.fishingBaits) d.fishingBaits.forEach((b,i)=>{ if(FISHING_BAITS[i]){ FISHING_BAITS[i].owned=b.owned; FISHING_BAITS[i].count=b.count; } });

    // Investments
    if (d.activeInvestments) activeInvestments=d.activeInvestments;
    if (d.totalInvestments) totalInvestments=d.totalInvestments;
    // Check investments that finished while offline
    checkInvestments();

    // Peptalk
    if (d.peptalkVisits) peptalkVisits=d.peptalkVisits;
    if (d.peptalkCooldownEnd) peptalkCooldownEnd=d.peptalkCooldownEnd;

    renderPrices();
  } catch(e) { console.error("Load error:",e); }
}
