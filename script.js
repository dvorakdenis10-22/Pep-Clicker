let coins = 0;
let perSec = 0;
let prestigeLevel = 0;

let doubleCoins = false;

let userKey = "";

// UI

const coinsText =
document.getElementById("coins");

const statsText =
document.getElementById("stats");

const horseBtn =
document.getElementById("horseBtn");

// LOGIN

function login() {

const username =
document.getElementById("username").value;

const password =
document.getElementById("password").value;

if (!username || !password) return;

userKey =
username + "_" + password;

document.getElementById("loginBox").style.display =
"none";

document.getElementById("game").style.display =
"block";

loadGame();
update();
}

// CLICK

horseBtn.addEventListener("click", () => {

let gain = 1 + prestigeLevel;

coins += gain;

function createParticle() {

const coin =
document.createElement("div");

coin.innerText = "🪙";

coin.style.position = "absolute";

coin.style.left =
(window.innerWidth / 2 - 300) +
Math.random() * 200 + "px";

coin.style.top =
"350px";

coin.style.fontSize = "30px";

coin.style.pointerEvents = "none";

coin.style.transition =
"all 1s linear";

document.body.appendChild(coin);

setTimeout(() => {

coin.style.top = "200px";

coin.style.opacity = "0";

}, 10);

setTimeout(() => {

coin.remove();

}, 1000);
}

update();
saveGame();
});

// PARTICLE

function createParticle() {

const p =
document.createElement("div");

p.innerText = "+1";

p.style.position = "absolute";
p.style.left =
Math.random() * 250 + 100 + "px";

p.style.top =
Math.random() * 250 + 250 + "px";

p.style.fontWeight = "bold";

document.body.appendChild(p);

setTimeout(() => {

p.remove();

}, 500);
}

// SOUND

document
.getElementById("pepBtn")
.addEventListener("click", () => {

const sound =
document.getElementById("horseSound");

sound.currentTime = 0;

sound.play();
});

// UPGRADES

const upgrades = {

horse: {
cost: 50,
income: 1
},

stable: {
cost: 200,
income: 5
},

farm: {
cost: 1000,
income: 20
},

workshop: {
cost: 5000000,
income: 25000
},

garage: {
cost: 25000000,
income: 125000
},

rodokmeny: {
cost: 100000000,
income: 500000
}

};

// BUY

function buyUpgrade(name) {

const upg =
upgrades[name];

if (coins >= upg.cost) {

coins -= upg.cost;

perSec += upg.income;

upg.cost =
Math.floor(upg.cost * 1.5);

renderPrices();

update();
saveGame();
}
}

// SPECIAL

function buyDoubleCoins() {

if (coins >= 40000) {

coins -= 40000;

doubleCoins = true;

setTimeout(() => {

doubleCoins = false;

}, 30000);

update();
}
}

function buyTicket() {

if (coins >= 250000) {

coins -= 250000;

const rng =
Math.random();

if (rng < 0.33) {

coins += 5000000;

alert("VÝHRA 5M");

} else if (rng < 0.66) {

alert("NIC");

} else {

coins = 0;

alert("ZTRATIL JSI COINY");
}

update();
}
}

function slotMachine() {

const bet =
Number(prompt("Kolik chceš vsadit?"));

if (
bet <= 0 ||
bet > coins
) return;

coins -= bet;

const rng =
Math.random();

if (rng < 0.4) {

} else if (rng < 0.7) {

coins += bet * 2;

} else if (rng < 0.9) {

coins += bet * 3;

} else {

coins += bet * 10;
}

update();
}

// LOOTBOX

function openLootbox() {

if (coins >= 500000) {

coins -= 500000;

const rarities = [
"Common",
"Rare",
"Epic",
"Legendary",
"Mythic"
];

const rarity =
rarities[
Math.floor(
Math.random() *
rarities.length
)
];

document
.getElementById("horseRarity")
.innerText =
rarity + " Horse";

update();
}
}

// UFO PRESTIGE SHOP

function buyUFOPrestige() {

if (coins >= 10000000000) {

coins -= 10000000000;

prestigeLevel += 1;

alert(
"🛸 UFO PRESTIGE AKTIVOVÁNO! Prestige level: " +
prestigeLevel
);

update();
saveGame();
}
}

// PRESTIGE

function prestige() {

if (coins >= 10000000) {

prestigeLevel++;

coins = 0;
perSec = 0;

// reset upgrade costs
Object.keys(upgrades).forEach(key => {
const defaults = {
  horse:    { cost: 50,         income: 1      },
  stable:   { cost: 200,        income: 5      },
  farm:     { cost: 1000,       income: 20     },
  workshop: { cost: 5000000,    income: 25000  },
  garage:   { cost: 25000000,   income: 125000 },
  rodokmeny:{ cost: 100000000,  income: 500000 }
};
if (defaults[key]) {
  upgrades[key].cost = defaults[key].cost;
}
});

renderPrices();

alert(
"Prestige level " +
prestigeLevel
);

update();
saveGame();
}
}

// AUTO

setInterval(() => {

let income = perSec;
if (doubleCoins) income *= 2;

coins += income;

update();
saveGame();

}, 1000);

// UPDATE

function update() {

coinsText.innerText =
formatCoins(Math.floor(coins));

statsText.innerText =
"Výdělek za sekundu: " +
formatCoins(perSec);

document
.getElementById("prestigeLevel")
.innerText =
"Level: " + prestigeLevel;

// UFO Prestige button state
const ufoBtn = document.getElementById("ufoPrestigeBtn");
if (ufoBtn) {
  if (coins >= 10000000000) {
    ufoBtn.classList.add("canAfford");
  } else {
    ufoBtn.classList.remove("canAfford");
  }
}

checkAchievements();
}

// FORMAT

function formatCoins(n) {
if (n >= 1000000000) return (n / 1000000000).toFixed(2) + "B";
if (n >= 1000000)    return (n / 1000000).toFixed(2) + "M";
if (n >= 1000)       return (n / 1000).toFixed(1) + "K";
return String(n);
}

// ACHIEVEMENTS

function checkAchievements() {

let html = "";

if (coins >= 1000)
html += "💰 1K Coins<br>";

if (coins >= 1000000)
html += "🔥 1M Coins<br>";

if (coins >= 1000000000)
html += "💎 1B Coins<br>";

if (prestigeLevel >= 1)
html += "⭐ Prestige I<br>";

if (prestigeLevel >= 5)
html += "🛸 UFO Prestige<br>";

document
.getElementById("achievementList")
.innerHTML =
html;
}

// SAVE

function saveGame() {

if (!userKey) return;

localStorage.setItem(
userKey + "_coins",
coins
);

localStorage.setItem(
userKey + "_perSec",
perSec
);

localStorage.setItem(
userKey + "_prestige",
prestigeLevel
);

localStorage.setItem(
userKey + "_upgrades",
JSON.stringify(upgrades)
);
}

// LOAD

function loadGame() {

const savedCoins =
localStorage.getItem(
userKey + "_coins"
);

const savedPerSec =
localStorage.getItem(
userKey + "_perSec"
);

const savedPrestige =
localStorage.getItem(
userKey + "_prestige"
);

const savedUpgrades =
localStorage.getItem(
userKey + "_upgrades"
);

if (savedCoins !== null)
coins = Number(savedCoins);

if (savedPerSec !== null)
perSec = Number(savedPerSec);

if (savedPrestige !== null)
prestigeLevel =
Number(savedPrestige);

if (savedUpgrades !== null)
Object.assign(
upgrades,
JSON.parse(savedUpgrades)
);

renderPrices();
}

// PRICES

function renderPrices() {

document.getElementById("horsePrice").innerText =
formatCoins(upgrades.horse.cost);

document.getElementById("stablePrice").innerText =
formatCoins(upgrades.stable.cost);

document.getElementById("farmPrice").innerText =
formatCoins(upgrades.farm.cost);

document.getElementById("workshopPrice").innerText =
formatCoins(upgrades.workshop.cost);

document.getElementById("garagePrice").innerText =
formatCoins(upgrades.garage.cost);

document.getElementById("rodokmenPrice").innerText =
formatCoins(upgrades.rodokmeny.cost);
}
