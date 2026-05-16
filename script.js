
// ─── VZDUCHOLOD ──────────────────────────
function startAirship() {
  const ship = document.getElementById("airship");
  ship.style.display = "block";
  let x = -300;
  const container = document.getElementById("airship");
  container.style.display = "block";

  const messages = ["KUNYS", "PEP CLICKER 2.0", "KLIKEJ KONĚ", "KOTLISE AUTO", "SHIFINY STÁJ"];
  let msgIdx = 0;

  const BLIMP_W = 340;
  const BANNER_W = 220;
  const TOTAL_W = BLIMP_W + BANNER_W + 60;

  container.innerHTML = `
    <svg id="blimpSvg" xmlns="http://www.w3.org/2000/svg" width="${TOTAL_W}" height="130" viewBox="0 0 ${TOTAL_W} 130">
      <!-- Baner lano -->
      <line x1="${BLIMP_W - 10}" y1="90" x2="${BLIMP_W + 55}" y2="75" stroke="#aaa" stroke-width="1.5" opacity="0.7"/>
      <!-- Baner -->
      <rect x="${BLIMP_W + 55}" y="58" width="${BANNER_W}" height="36" rx="5"
        fill="#fffbe6" stroke="#e0b800" stroke-width="2"/>
      <text id="blimpBannerText" x="${BLIMP_W + 55 + BANNER_W/2}" y="81"
        font-family="'Fredoka One',cursive" font-size="17" font-weight="bold"
        fill="#b8860b" text-anchor="middle" letter-spacing="2">KUNYS</text>
      <!-- Vlajky na baneru -->
      <polygon points="${BLIMP_W+55},58 ${BLIMP_W+55},68 ${BLIMP_W+65},63" fill="#e0b800"/>
      <polygon points="${BLIMP_W+55+BANNER_W},58 ${BLIMP_W+55+BANNER_W},68 ${BLIMP_W+45+BANNER_W},63" fill="#e0b800"/>

      <!-- Trup vzducholodi -->
      <ellipse cx="155" cy="62" rx="145" ry="52" fill="url(#blimpGrad)"/>
      <!-- Highlight -->
      <ellipse cx="120" cy="42" rx="80" ry="22" fill="rgba(255,255,255,0.18)" transform="rotate(-8,120,42)"/>
      <!-- Spodní část -->
      <ellipse cx="155" cy="62" rx="145" ry="52" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>

      <!-- Pruhy na trupu -->
      <clipPath id="blimpClip">
        <ellipse cx="155" cy="62" rx="145" ry="52"/>
      </clipPath>
      <rect x="40" y="10" width="18" height="104" fill="rgba(255,0,0,0.25)" clip-path="url(#blimpClip)"/>
      <rect x="88" y="10" width="18" height="104" fill="rgba(255,0,0,0.25)" clip-path="url(#blimpClip)"/>
      <rect x="200" y="10" width="18" height="104" fill="rgba(255,0,0,0.25)" clip-path="url(#blimpClip)"/>
      <rect x="248" y="10" width="18" height="104" fill="rgba(255,0,0,0.25)" clip-path="url(#blimpClip)"/>

      <!-- Kabina / gondola -->
      <rect x="110" y="108" width="90" height="22" rx="11" fill="#2a2a4a" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <!-- Okénka -->
      <circle cx="128" cy="119" r="6" fill="#87ceeb" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
      <circle cx="148" cy="119" r="6" fill="#87ceeb" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
      <circle cx="168" cy="119" r="6" fill="#87ceeb" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
      <circle cx="188" cy="119" r="6" fill="#87ceeb" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
      <!-- Gondola laná -->
      <line x1="130" y1="108" x2="130" y2="114" stroke="#888" stroke-width="1.5"/>
      <line x1="155" y1="108" x2="155" y2="114" stroke="#888" stroke-width="1.5"/>
      <line x1="180" y1="108" x2="180" y2="114" stroke="#888" stroke-width="1.5"/>

      <!-- Ocasní ploutve -->
      <polygon points="10,62 35,42 35,82" fill="#c0392b" opacity="0.85"/>
      <polygon points="10,62 35,48 8,30" fill="#e74c3c" opacity="0.7"/>
      <polygon points="10,62 35,76 8,94" fill="#e74c3c" opacity="0.7"/>

      <!-- Vrtule -->
      <g transform="translate(295,62)">
        <animateTransform attributeName="transform" type="rotate" from="0 295 62" to="360 295 62" dur="0.6s" repeatCount="indefinite"/>
        <ellipse cx="295" cy="50" rx="4" ry="10" fill="#555" opacity="0.8"/>
        <ellipse cx="295" cy="74" rx="4" ry="10" fill="#555" opacity="0.8"/>
        <ellipse cx="283" cy="62" rx="10" ry="4" fill="#555" opacity="0.8"/>
        <ellipse cx="307" cy="62" rx="10" ry="4" fill="#555" opacity="0.8"/>
      </g>
      <circle cx="295" cy="62" r="5" fill="#333"/>

      <!-- Nápis na trupu -->
      <text x="155" y="68" font-family="'Fredoka One',cursive" font-size="22" font-weight="bold"
        fill="rgba(255,255,255,0.9)" text-anchor="middle" letter-spacing="3"
        stroke="rgba(0,0,0,0.2)" stroke-width="1">PEP CLICKER</text>

      <defs>
        <linearGradient id="blimpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stop-color="#e8e8e8"/>
          <stop offset="35%"  stop-color="#c0c0c0"/>
          <stop offset="100%" stop-color="#888"/>
        </linearGradient>
      </defs>
    </svg>
  `;

  let x = -TOTAL_W - 50;
  const TOP = 55 + Math.random() * 40;
  container.style.top = TOP + "px";

  // Střídání nápisů na baneru
  setInterval(() => {
    msgIdx = (msgIdx + 1) % messages.length;
    const el = document.getElementById("blimpBannerText");
    if (el) el.textContent = messages[msgIdx];
  }, 4000);

const move = () => {
    x += 1.2;
    ship.style.left = x + "px";
    if (x > window.innerWidth + 100) x = -350;
    x += 1.4;
    container.style.left = x + "px";
    if (x > window.innerWidth + 100) {
      x = -TOTAL_W - 50;
      container.style.top = (55 + Math.random() * 60) + "px";
    }
requestAnimationFrame(move);
};
move();
