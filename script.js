let coins = 0;
let perSec = 0;
let prestigeLevel = 0;

let doubleCoins = false;

let userKey = "";

// UI
const coinsText = document.getElementById("coins");
const statsText = document.getElementById("stats");
const horseBtn = document.getElementById("horseBtn");

// LOGIN
function login() {

const username =
document.getElementById("username").value;

const password =
document.getElementById("password").value;

if (!username || !password) return;

userKey = username + "_" + password;

document.getElementById("loginBox").style.display = "none";
document.getElementById("game").style.display = "block";

// Firebase load se volá z module scriptu
}

// CLICK
horseBtn.addEventListener("click", () => {

let gain = 1 + prestigeLevel;
coins += gain;

createParticle();

update();
saveGame();
});

// PARTICLE
function createParticle() {
const p = document.createElement("div");
p.innerText = "+1";

p.style.position = "absolute";
p.style.left = Math.random() * 250 + 100 + "px";
p.style.top = Math.random() * 250 + 250 + "px";
p.style.fontWeight = "bold";

document.body.appendChild(p);

setTimeout(() => p.remove(), 500);
}

// SOUND
document.getElementById("pepBtn").addEventListener("click", () => {
const sound = document.getElementById("horseSound");
sound.currentTime = 0;
sound.play();
});

// UPGRADES
const upgrades = {
horse: { cost: 50, income: 1 },
stable: { cost: 200, income: 5 },
farm: { cost: 1000, income: 20 },
workshop: { cost: 5000000, income: 25000 },
garage: { cost: 25000000, income: 125000 },
rodokmeny: { cost: 100000000, income: 500000 }
};

// BUY
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
}
}

function slotMachine() {

const bet = Number(prompt("Kolik chceš vsadit?"));

if (bet <= 0 || bet > coins) return;

coins -= bet;

const rng = Math.random();

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

const rarities = ["Common","Rare","Epic","Legendary","Mythic"];

const rarity = rarities[Math.floor(Math.random() * rarities.length)];

document.getElementById("horseRarity").innerText = rarity + " Horse";

update();
}
}

// UFO
function buyUFOPrestige() {

if (coins >= 10000000000) {

coins -= 10000000000;
prestigeLevel += 5;

alert("🛸 UFO PRESTIGE: " + prestigeLevel);

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

Object.keys(upgrades).forEach(key => {
if (key === "horse") upgrades[key].cost = 50;
if (key === "stable") upgrades[key].cost = 200;
if (key === "farm") upgrades[key].cost = 1000;
if (key === "workshop") upgrades[key].cost = 5000000;
if (key === "garage") upgrades[key].cost = 25000000;
if (key === "rodokmeny") upgrades[key].cost = 100000000;
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

// UPDATE
function update() {

coinsText.innerText = formatCoins(Math.floor(coins));
statsText.innerText = "Výdělek za sekundu: " + formatCoins(perSec);

document.getElementById("prestigeLevel").innerText = "Level: " + prestigeLevel;

checkAchievements();
}

// FORMAT
function formatCoins(n) {
if (n >= 1e9) return (n/1e9).toFixed(2)+"B";
if (n >= 1e6) return (n/1e6).toFixed(2)+"M";
if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
return n;
}

// ACHIEVEMENTS
function checkAchievements() {

let html = "";

if (coins >= 1000) html += "💰 1K Coins<br>";
if (coins >= 1000000) html += "🔥 1M Coins<br>";
if (coins >= 1000000000) html += "💎 1B Coins<br>";
if (prestigeLevel >= 1) html += "⭐ Prestige I<br>";
if (prestigeLevel >= 5) html += "🛸 UFO Prestige<br>";

document.getElementById("achievementList").innerHTML = html;
}
