let coins = 0;
let perSec = 0;

let userKey = "";

let doubleCoins = false;

// UI

const coinsText =
document.getElementById("coins");

const horseBtn =
document.getElementById("horseBtn");

const statsText =
document.getElementById("stats");

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

// HORSE CLICK

horseBtn.addEventListener("click", () => {

let gain = 1;

if (doubleCoins)
gain *= 2;

coins += gain;

update();
saveGame();
});

// PEP SOUND BUTTON

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

pedigree: {
cost: 100000000,
income: 500000
}
};

// BUY UPGRADE

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

// DOUBLE COINS

function buyDoubleCoins() {

if (coins >= 40000) {

coins -= 40000;

doubleCoins = true;

update();

setTimeout(() => {

doubleCoins = false;

}, 30000);
}
}

// TICKET

function buyTicket() {

if (coins >= 250000) {

coins -= 250000;

const rng =
Math.random();

if (rng < 0.33) {

coins += 5000000;

alert("Vyhrál jsi 5 000 000!");

} else if (rng < 0.66) {

alert("Nic jsi nevyhrál.");

} else {

coins = 0;

alert("Točka ti vymazala coiny!");
}

update();
saveGame();
}
}

// SLOT MACHINE

function slotMachine() {

const bet =
Number(prompt("Kolik chceš vsadit?"));

if (
bet > coins ||
bet <= 0 ||
bet > 30000000
) return;

coins -= bet;

const rng =
Math.random();

if (rng < 0.4) {

alert("Prohrál jsi.");

} else if (rng < 0.7) {

coins += bet * 2;

alert("2x výhra!");

} else if (rng < 0.9) {

coins += bet * 3;

alert("3x výhra!");

} else {

coins += bet * 10;

alert("10x JACKPOT!");
}

update();
saveGame();
}

// UFO

function buyUFO() {

if (coins >= 10000000000) {

alert("DOHRÁL JSI HRU 🚀");

localStorage.clear();

coins = 0;
perSec = 0;

update();
}
}

// AUTO MONEY

setInterval(() => {

coins += perSec;

update();
saveGame();

}, 1000);

// UPDATE

function update() {

coinsText.innerText =
Math.floor(coins);

statsText.innerText =
"Výdělek za sekundu: " + perSec;
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

const savedUpgrades =
localStorage.getItem(
userKey + "_upgrades"
);

if (savedCoins !== null)
coins = Number(savedCoins);

if (savedPerSec !== null)
perSec = Number(savedPerSec);

if (savedUpgrades !== null)
Object.assign(
upgrades,
JSON.parse(savedUpgrades)
);

renderPrices();
}

// RENDER PRICES

function renderPrices() {

document.getElementById("horsePrice").innerText =
upgrades.horse.cost;

document.getElementById("stablePrice").innerText =
upgrades.stable.cost;

document.getElementById("farmPrice").innerText =
upgrades.farm.cost;

document.getElementById("workshopPrice").innerText =
upgrades.workshop.cost;

document.getElementById("garagePrice").innerText =
upgrades.garage.cost;

document.getElementById("pedigreePrice").innerText =
upgrades.pedigree.cost;
}
