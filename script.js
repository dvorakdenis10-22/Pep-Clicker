let coins = 0;
let perSec = 0;

// načtení hry
loadGame();

const coinsText = document.getElementById("coins");
const perSecText = document.getElementById("perSec");
const horseBtn = document.getElementById("horseBtn");

// klikání
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
localStorage.setItem("coins", coins);
localStorage.setItem("perSec", perSec);
}

// LOAD
function loadGame() {
let savedCoins = localStorage.getItem("coins");
let savedPerSec = localStorage.getItem("perSec");

if (savedCoins !== null) coins = Number(savedCoins);
if (savedPerSec !== null) perSec = Number(savedPerSec);
}
