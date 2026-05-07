let coins = 0;
let perSec = 0;

// UI

const coinsText = document.getElementById("coins");
const horseBtn = document.getElementById("horseBtn");

// CLICK

horseBtn.addEventListener("click", () => {
coins++;

update();
saveGame();
});

// UPGRADES

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

// AUTO INCOME

setInterval(() => {
coins += perSec;

update();
saveGame();
}, 1000);

// UPDATE

function update() {
coinsText.innerText = Math.floor(coins);
}

// SAVE

function saveGame() {
localStorage.setItem("pepCoins", coins);
localStorage.setItem("pepPerSec", perSec);
}

// LOAD

function loadGame() {
const savedCoins = localStorage.getItem("pepCoins");
const savedPerSec = localStorage.getItem("pepPerSec");

if (savedCoins !== null) {
coins = Number(savedCoins);
}

if (savedPerSec !== null) {
perSec = Number(savedPerSec);
}
}

// START

loadGame();
update();

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
