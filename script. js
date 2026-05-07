let coins = 0;
let perSec = 0;

const coinsText = document.getElementById("coins");
const perSecText = document.getElementById("perSec");
const horseBtn = document.getElementById("horseBtn");

// klikání na koně
horseBtn.addEventListener("click", () => {
coins++;
update();
});

// upgrade: kůň
function buyHorse() {
if (coins >= 50) {
coins -= 50;
perSec += 1;
update();
}
}

// upgrade: stáj
function buyStable() {
if (coins >= 200) {
coins -= 200;
perSec += 5;
update();
}
}

// upgrade: farma
function buyFarm() {
if (coins >= 1000) {
coins -= 1000;
perSec += 20;
update();
}
}

// auto income
setInterval(() => {
coins += perSec;
update();
}, 1000);

// update UI
function update() {
coinsText.innerText = Math.floor(coins) + " Pep Coins";
perSecText.innerText = perSec + " / sec";
}
