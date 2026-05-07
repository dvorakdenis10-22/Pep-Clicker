let coins = 0;
let perSec = 0;
let userKey = "";

// UI
const coinsText = document.getElementById("coins");
const perSecText = document.getElementById("perSec");
const horseBtn = document.getElementById("horseBtn");

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

// klik
horseBtn.addEventListener("click", () => {
coins++;
update();
saveGame();
});

// upgrady
function buyHorse() {
if (coins >= 50) {
coins -= 50;
perSec += 1;
update();
saveGame();
}
}

function buyStable() {
if (coins >= 200) {
coins -= 200;
perSec += 5;
update();
saveGame();
}
}

function buyFarm() {
if (coins >= 1000) {
coins -= 1000;
perSec += 20;
update();
saveGame();
}
}

// auto income
setInterval(() => {
coins += perSec;
update();
saveGame();
}, 1000);

// update UI
function update() {
coinsText.innerText = Math.floor(coins) + " Pep Coins";
perSecText.innerText = perSec + " / sec";
}

// SAVE
function saveGame() {
if (!userKey) return;

localStorage.setItem(userKey + "_coins", coins);
localStorage.setItem(userKey + "_perSec", perSec);
}

// LOAD
function loadGame() {
const savedCoins = localStorage.getItem(userKey + "_coins");
const savedPerSec = localStorage.getItem(userKey + "_perSec");

if (savedCoins !== null) coins = Number(savedCoins);
if (savedPerSec !== null) perSec = Number(savedPerSec);
}
