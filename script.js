let coins = 0;
let perSec = 0;
let prestigeLevel = 0;
let doubleCoins = false;

let userKey = "";

// UI
const coinsText = document.getElementById("coins");
const statsText = document.getElementById("stats");
const horseBtn = document.getElementById("horseBtn");

// UPGRADES
const upgrades = {
horse: { cost: 50, income: 1 },
stable: { cost: 200, income: 5 },
farm: { cost: 1000, income: 20 },
workshop: { cost: 5000000, income: 25000 },
garage: { cost: 25000000, income: 125000 },
rodokmeny: { cost: 100000000, income: 500000 }
};

// LOGIN
function login() {
const username = document.getElementById("username").value;
const password = document.getElementById("password").value;

if (!username || !password) return;

userKey = username + "_" + password;

document.getElementById("loginBox").style.display = "none";
document.getElementById("game").style.display = "block";

loadGame();
update();
}

// CLICK
horseBtn?.addEventListener("click", () => {
let gain = 1 + prestigeLevel;
coins += gain;

update();
saveGame();
});

// BUY UPGRADES
function buyUpgrade(name) {
const upg = upgrades[name];

if (coins >= upg.cost) {
coins -= upg.cost;
perSec += upg.income;

upg.cost = Math.floor(upg.cost * 1.5);

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

const rng = Math.random();

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
saveGame();
}
}

function slotMachine() {
const bet = Number(prompt("Kolik chceš vsadit?"));

if (!bet || bet <= 0 || bet > coins) return;

coins -= bet;

const rng = Math.random();

if (rng >= 0.7) coins += bet * 2;
if (rng >= 0.9) coins += bet * 10;

update();
saveGame();
}

function openLootbox() {
if (coins >= 500000) {
coins -= 500000;

const rarities = ["Common", "Rare", "Epic", "Legendary", "Mythic"];

const rarity = rarities[Math.floor(Math.random() * rarities.length)];

document.getElementById("horseRarity").innerText =
rarity + " Horse";

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

Object.keys(upgrades).forEach(k => {
const base = {
horse: 50,
stable: 200,
farm: 1000,
workshop: 5000000,
garage: 25000000,
rodokmeny: 100000000
};

upgrades[k].cost = base[k];
});

renderPrices();
update();
saveGame();
}
}

// AUTO INCOME
setInterval(() => {
let income = perSec;
if (doubleCoins) income *= 2;

coins += income;

update();
saveGame();
}, 1000);

// UPDATE UI
function update() {
if (coinsText) coinsText.innerText = format(coins);
if (statsText) statsText.innerText = "Výdělek: " + perSec + "/s";

document.getElementById("prestigeLevel").innerText =
"Level: " + prestigeLevel;
}

// FORMAT
function format(n) {
if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
return n;
}

// SAVE (LOCAL)
function saveGame() {
if (!userKey) return;

localStorage.setItem(userKey + "_coins", coins);
localStorage.setItem(userKey + "_perSec", perSec);
localStorage.setItem(userKey + "_prestige", prestigeLevel);
localStorage.setItem(userKey + "_upgrades", JSON.stringify(upgrades));
}

// LOAD (LOCAL)
function loadGame() {
coins = Number(localStorage.getItem(userKey + "_coins")) || 0;
perSec = Number(localStorage.getItem(userKey + "_perSec")) || 0;
prestigeLevel = Number(localStorage.getItem(userKey + "_prestige")) || 0;

const up = localStorage.getItem(userKey + "_upgrades");
if (up) Object.assign(upgrades, JSON.parse(up));

renderPrices();
}

// PRICES
function renderPrices() {
const set = (id, val) => {
const el = document.getElementById(id);
if (el) el.innerText = format(val);
};

set("horsePrice", upgrades.horse.cost);
set("stablePrice", upgrades.stable.cost);
set("farmPrice", upgrades.farm.cost);
set("workshopPrice", upgrades.workshop.cost);
set("garagePrice", upgrades.garage.cost);
set("rodokmenPrice", upgrades.rodokmeny.cost);
}
