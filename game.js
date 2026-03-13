const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let coins = 0;
let highScore = localStorage.getItem('zombieRunnerHighScore') || 0;
let gameSpeed = 5;
let groundY = canvas.height - 80;
let coinArray = [];

// Ship state
let ship = null;
let inShip = false;
let shipFuel = 100;
const maxShipFuel = 100;

// Rocket booster state
let boosterFuel = 100;
const maxBoosterFuel = 100;
let boosterActive = false;

// Laser eyes state
let lasers = [];
let laserCooldown = 0;
const laserCooldownMax = 15; // frames between shots

// X-Wing laser state
let shipLasers = [];
let shipLaserCooldown = 0;
const shipLaserCooldownMax = 8; // faster fire rate for X-Wing
let shipLaserCannon = 0; // cycles through 4 cannons

// Player health
let playerHealth = 100;
const maxPlayerHealth = 100;
let damageFlash = 0; // screen flash when hit

// Hulk enemy state
let hulks = [];
let lastHulkSpawnTime = 0;

// Lava fireball state
let fireballs = [];
let lastFireballTime = 0;

// Parallax & visual state
let bgOff1 = 0;
let bgOff2 = 0;
let embers = [];

// Gigantamax Charizard state
let charizards = [];
let lastCharizardSpawnTime = 0;
let charizardFireballs = [];

// Gyarados state
let gyaradosList = [];
let lastGyaradosSpawnTime = 0;
let hyperBeams = [];

// Screen shake state
let screenShake = 0;
let screenShakeIntensity = 0;

// Controls
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    shift: false,
    shoot: false,
    dig: false
};

function resetInputState() {
    for (const key of Object.keys(keys)) {
        keys[key] = false;
    }
}

// Music system
let audioCtx = null;
let musicPlaying = false;
let musicInterval = null;

document.getElementById('highScore').textContent = highScore;

// Pixel art drawing helper
function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

// Draw Luke Skywalker (X-Wing pilot) - smooth gradient version
function drawZombie(x, y, frame) {
    const bob = Math.sin(frame * 0.3) * 2;
    ctx.save();

    // === BOOSTER FLAME ===
    if (boosterActive && boosterFuel > 0) {
        const fl = 10 + Math.random() * 14;
        const flG = ctx.createLinearGradient(x + 11, y + 48 + bob, x + 11, y + 52 + fl + bob);
        flG.addColorStop(0, '#ffffaa'); flG.addColorStop(0.3, '#ff9900');
        flG.addColorStop(0.8, '#ff3300'); flG.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = flG;
        ctx.beginPath(); ctx.ellipse(x + 11, y + 50 + fl * 0.5 + bob, 5, fl * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        if (frame % 4 === 0) {
            ctx.fillStyle = 'rgba(130,130,130,0.22)';
            ctx.beginPath(); ctx.arc(x + 11 + (Math.random() - 0.5) * 6, y + 54 + fl + bob, 4, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Booster pack
    const bpG = ctx.createLinearGradient(x - 3, y + 20, x + 7, y + 38);
    bpG.addColorStop(0, '#555'); bpG.addColorStop(1, '#222');
    ctx.fillStyle = bpG;
    ctx.beginPath(); ctx.roundRect(x - 3, y + 20 + bob, 9, 18, 3); ctx.fill();
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.ellipse(x + 1, y + 39 + bob, 4, 2, 0, 0, Math.PI * 2); ctx.fill();

    // === LEGS ===
    const legSw = Math.sin(frame * 0.3) * 5;
    const legG = ctx.createLinearGradient(x + 4, y + 37, x + 28, y + 37);
    legG.addColorStop(0, '#9e4810'); legG.addColorStop(0.5, '#c05a18'); legG.addColorStop(1, '#9e4810');
    ctx.fillStyle = legG;
    ctx.beginPath(); ctx.roundRect(x + 5, y + 38 + bob, 10, 16 + legSw, [2, 2, 4, 4]); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 16, y + 38 + bob, 10, 16 - legSw, [2, 2, 4, 4]); ctx.fill();
    const bootG = ctx.createLinearGradient(0, y + 51, 0, y + 59);
    bootG.addColorStop(0, '#2a2a2a'); bootG.addColorStop(1, '#111');
    ctx.fillStyle = bootG;
    ctx.beginPath(); ctx.roundRect(x + 3, y + 52 + bob + legSw, 13, 7, [1, 1, 4, 4]); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 14, y + 52 + bob - legSw, 13, 7, [1, 1, 4, 4]); ctx.fill();

    // === BODY (orange flight suit) ===
    const suitG = ctx.createLinearGradient(x + 4, y + 14, x + 30, y + 38);
    suitG.addColorStop(0, '#e87030'); suitG.addColorStop(0.45, '#cc5a20'); suitG.addColorStop(1, '#993a10');
    ctx.fillStyle = suitG;
    ctx.beginPath(); ctx.roundRect(x + 5, y + 16 + bob, 21, 24, [3, 3, 2, 2]); ctx.fill();
    ctx.fillStyle = 'rgba(255,160,80,0.18)';
    ctx.beginPath(); ctx.roundRect(x + 6, y + 17 + bob, 7, 9, 2); ctx.fill();
    ctx.fillStyle = '#777';
    ctx.beginPath(); ctx.roundRect(x + 8, y + 18 + bob, 15, 9, 2); ctx.fill();
    ctx.fillStyle = '#44aaff'; ctx.fillRect(x + 9, y + 20 + bob, 5, 4);
    ctx.fillStyle = '#ff4444'; ctx.fillRect(x + 16, y + 20 + bob, 5, 4);
    const beltG = ctx.createLinearGradient(0, y + 38, 0, y + 42);
    beltG.addColorStop(0, '#ddd'); beltG.addColorStop(1, '#999');
    ctx.fillStyle = beltG;
    ctx.beginPath(); ctx.roundRect(x + 5, y + 38 + bob, 21, 4, 2); ctx.fill();

    // === ARMS ===
    const armSw = Math.sin(frame * 0.2) * 8;
    const armG = ctx.createLinearGradient(0, 0, 8, 19);
    armG.addColorStop(0, '#cc5a20'); armG.addColorStop(1, '#993a10');
    ctx.save();
    ctx.translate(x + 3, y + 18 + bob); ctx.rotate(armSw * 0.04 + 0.25);
    ctx.fillStyle = armG;
    ctx.beginPath(); ctx.roundRect(-3, 0, 8, 19, [3, 3, 2, 2]); ctx.fill();
    ctx.fillStyle = '#d4a080'; ctx.beginPath(); ctx.ellipse(1, 20, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x + 23, y + 18 + bob); ctx.rotate(-armSw * 0.04 - 0.1);
    const armG2 = ctx.createLinearGradient(0, 0, 8, 19);
    armG2.addColorStop(0, '#cc5a20'); armG2.addColorStop(1, '#993a10');
    ctx.fillStyle = armG2;
    ctx.beginPath(); ctx.roundRect(-1, 0, 8, 19, [3, 3, 2, 2]); ctx.fill();
    ctx.fillStyle = '#d4a080'; ctx.beginPath(); ctx.ellipse(3, 20, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // === HELMET ===
    const helmG = ctx.createRadialGradient(x + 12, y + 5 + bob, 1, x + 15, y + 9 + bob, 14);
    helmG.addColorStop(0, '#f8f8f8'); helmG.addColorStop(0.6, '#e0e0e0'); helmG.addColorStop(1, '#b0b0b0');
    ctx.fillStyle = helmG;
    ctx.beginPath(); ctx.ellipse(x + 15, y + 9 + bob, 13, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.arc(x + 15, y + 1 + bob, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5555';
    ctx.beginPath(); ctx.arc(x + 15, y + 1 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.ellipse(x + 6, y + 15 + bob, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 24, y + 15 + bob, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    // === VISOR ===
    ctx.fillStyle = '#06061e';
    ctx.beginPath(); ctx.ellipse(x + 15, y + 11 + bob, 9, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    const visG = ctx.createLinearGradient(x + 7, y + 7 + bob, x + 16, y + 12 + bob);
    visG.addColorStop(0, 'rgba(100,140,255,0.55)'); visG.addColorStop(1, 'rgba(50,80,200,0)');
    ctx.fillStyle = visG;
    ctx.beginPath(); ctx.ellipse(x + 11, y + 9 + bob, 5, 2.5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8b880';
    ctx.beginPath(); ctx.ellipse(x + 15, y + 15 + bob, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    // Laser eye glow
    const glA = laserCooldown === 0 ? (Math.sin(frame * 0.3) * 0.3 + 0.6) : (laserCooldown / laserCooldownMax * 0.9);
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
    ctx.fillStyle = `rgba(255,60,0,${glA})`;
    ctx.beginPath(); ctx.ellipse(x + 9, y + 11 + bob, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 21, y + 11 + bob, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
}

// Draw laser beam - smooth gradient
function drawLaser(laser) {
    ctx.save();
    const g = ctx.createLinearGradient(laser.x, 0, laser.x + laser.width, 0);
    g.addColorStop(0, 'rgba(255,50,50,0.5)'); g.addColorStop(0.5, '#ff2222'); g.addColorStop(1, '#ffffff');
    ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(laser.x, laser.y + 1.5); ctx.lineTo(laser.x + laser.width, laser.y + 1.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,180,180,0.5)'; ctx.lineWidth = 1.5; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(laser.x, laser.y + 1.5); ctx.lineTo(laser.x + laser.width, laser.y + 1.5); ctx.stroke();
    const tG = ctx.createRadialGradient(laser.x + laser.width, laser.y + 1.5, 0, laser.x + laser.width, laser.y + 1.5, 9);
    tG.addColorStop(0, 'rgba(255,220,220,0.9)'); tG.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = tG; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(laser.x + laser.width, laser.y + 1.5, 9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// Draw X-Wing laser bolt - smooth green gradient
function drawShipLaser(laser) {
    ctx.save();
    const g = ctx.createLinearGradient(laser.x, 0, laser.x + laser.width, 0);
    g.addColorStop(0, 'rgba(0,255,80,0.4)'); g.addColorStop(0.6, '#00ff44'); g.addColorStop(1, '#ffffff');
    ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.shadowColor = '#00ff44'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(laser.x, laser.y + 1.5); ctx.lineTo(laser.x + laser.width, laser.y + 1.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(180,255,200,0.45)'; ctx.lineWidth = 1.5; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.moveTo(laser.x, laser.y + 1.5); ctx.lineTo(laser.x + laser.width, laser.y + 1.5); ctx.stroke();
    const tG = ctx.createRadialGradient(laser.x + laser.width, laser.y + 1.5, 0, laser.x + laser.width, laser.y + 1.5, 10);
    tG.addColorStop(0, 'rgba(200,255,220,0.9)'); tG.addColorStop(1, 'rgba(0,255,80,0)');
    ctx.fillStyle = tG; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(laser.x + laser.width, laser.y + 1.5, 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// Draw Skeleton - smooth bone/arc version
function drawSkeleton(x, y, frame) {
    const bob = Math.sin(frame * 0.25) * 2;
    ctx.save();
    ctx.lineCap = 'round';

    // LEGS
    const legSw = Math.sin(frame * 0.3) * 4;
    ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + 13, y + 36 + bob); ctx.lineTo(x + 10, y + 47 + bob + legSw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 10, y + 47 + bob + legSw); ctx.lineTo(x + 9, y + 57 + bob + legSw); ctx.stroke();
    ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(x + 10, y + 47 + bob + legSw, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.arc(x + 10, y + 47 + bob + legSw, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + 21, y + 36 + bob); ctx.lineTo(x + 24, y + 47 + bob - legSw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 24, y + 47 + bob - legSw); ctx.lineTo(x + 25, y + 57 + bob - legSw); ctx.stroke();
    ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(x + 24, y + 47 + bob - legSw, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.arc(x + 24, y + 47 + bob - legSw, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 9, y + 57 + bob + legSw); ctx.lineTo(x + 2, y + 59 + bob + legSw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 25, y + 57 + bob - legSw); ctx.lineTo(x + 32, y + 59 + bob - legSw); ctx.stroke();

    // SPINE + RIBS
    for (let v = 0; v < 4; v++) {
        ctx.fillStyle = v % 2 === 0 ? '#d8d8d8' : '#b0b0b0';
        ctx.beginPath(); ctx.ellipse(x + 17, y + 19 + v * 5 + bob, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#b0b0b0'; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
        const ry = y + 20 + r * 5 + bob;
        ctx.beginPath(); ctx.moveTo(x + 17, ry); ctx.quadraticCurveTo(x + 7, ry - 2, x + 7, ry + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 17, ry); ctx.quadraticCurveTo(x + 27, ry - 2, x + 27, ry + 4); ctx.stroke();
    }
    ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + 7, y + 18 + bob); ctx.lineTo(x + 27, y + 18 + bob); ctx.stroke();

    // ARMS
    const armAn = Math.sin(frame * 0.15) * 3;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 7, y + 18 + bob + armAn); ctx.lineTo(x - 1, y + 29 + bob + armAn); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 1, y + 29 + bob + armAn); ctx.lineTo(x + 1, y + 38 + bob + armAn); ctx.stroke();
    ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(x - 1, y + 29 + bob + armAn, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.arc(x - 1, y + 29 + bob + armAn, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 27, y + 18 + bob - armAn); ctx.lineTo(x + 35, y + 28 + bob - armAn); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 35, y + 28 + bob - armAn); ctx.lineTo(x + 33, y + 37 + bob - armAn); ctx.stroke();
    ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(x + 35, y + 28 + bob - armAn, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.arc(x + 35, y + 28 + bob - armAn, 2.5, 0, Math.PI * 2); ctx.fill();

    // BOW
    ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + 39, y + 27 + bob, 14, -0.8, 0.8); ctx.stroke();
    const bx1 = x + 39 + Math.cos(-0.8) * 14, by1 = y + 27 + bob + Math.sin(-0.8) * 14;
    const bx2 = x + 39 + Math.cos(0.8) * 14, by2 = y + 27 + bob + Math.sin(0.8) * 14;
    ctx.strokeStyle = '#ccccaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();

    // HEAD (skull)
    const skG = ctx.createRadialGradient(x + 14, y + 7 + bob, 1, x + 17, y + 10 + bob, 12);
    skG.addColorStop(0, '#f0f0f0'); skG.addColorStop(0.6, '#d8d8d8'); skG.addColorStop(1, '#a8a8a8');
    ctx.fillStyle = skG;
    ctx.beginPath(); ctx.ellipse(x + 17, y + 9 + bob, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x + 9, y + 12 + bob, 4, 3, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 25, y + 12 + bob, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(x + 11, y + 8 + bob, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 23, y + 8 + bob, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 17, y + 13 + bob, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 9, y + 16 + bob, 17, 4, 1); ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    for (let t = 0; t < 4; t++) { ctx.beginPath(); ctx.roundRect(x + 10 + t * 4, y + 16 + bob, 3, 3, [0, 0, 1, 1]); ctx.fill(); }
    ctx.restore();
}

// Draw Enemy Skeleton - smooth with red glowing eyes
function drawEnemySkeleton(x, y, frame, facingLeft) {
    const bob = Math.sin(frame * 0.3) * 2;
    ctx.save();
    if (facingLeft) { ctx.translate(x + 30, 0); ctx.scale(-1, 1); x = 0; }
    ctx.lineCap = 'round';

    // LEGS
    const legSw = Math.sin(frame * 0.35) * 6;
    ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + 13, y + 36 + bob); ctx.lineTo(x + 10, y + 47 + bob + legSw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 10, y + 47 + bob + legSw); ctx.lineTo(x + 8, y + 57 + bob + legSw); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(x + 10, y + 47 + bob + legSw, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8c8c8'; ctx.beginPath(); ctx.arc(x + 10, y + 47 + bob + legSw, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 21, y + 36 + bob); ctx.lineTo(x + 24, y + 47 + bob - legSw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 24, y + 47 + bob - legSw); ctx.lineTo(x + 26, y + 57 + bob - legSw); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(x + 24, y + 47 + bob - legSw, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8c8c8'; ctx.beginPath(); ctx.arc(x + 24, y + 47 + bob - legSw, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 8, y + 57 + bob + legSw); ctx.lineTo(x + 1, y + 59 + bob + legSw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 26, y + 57 + bob - legSw); ctx.lineTo(x + 33, y + 59 + bob - legSw); ctx.stroke();

    // SPINE + RIBS
    for (let v = 0; v < 4; v++) {
        ctx.fillStyle = v % 2 === 0 ? '#c8c8c8' : '#909090';
        ctx.beginPath(); ctx.ellipse(x + 17, y + 19 + v * 5 + bob, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#909090'; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
        const ry = y + 20 + r * 5 + bob;
        ctx.beginPath(); ctx.moveTo(x + 17, ry); ctx.quadraticCurveTo(x + 7, ry - 2, x + 7, ry + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 17, ry); ctx.quadraticCurveTo(x + 27, ry - 2, x + 27, ry + 4); ctx.stroke();
    }
    ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + 7, y + 18 + bob); ctx.lineTo(x + 27, y + 18 + bob); ctx.stroke();

    // ARMS (aggressive swing)
    const armAn = Math.sin(frame * 0.25) * 6;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 7, y + 18 + bob + armAn); ctx.lineTo(x - 2, y + 30 + bob + armAn); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 2, y + 30 + bob + armAn); ctx.lineTo(x, y + 38 + bob + armAn); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(x - 2, y + 30 + bob + armAn, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8c8c8'; ctx.beginPath(); ctx.arc(x - 2, y + 30 + bob + armAn, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 27, y + 18 + bob - armAn); ctx.lineTo(x + 34, y + 28 + bob - armAn); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 34, y + 28 + bob - armAn); ctx.lineTo(x + 32, y + 35 + bob - armAn); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(x + 34, y + 28 + bob - armAn, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8c8c8'; ctx.beginPath(); ctx.arc(x + 34, y + 28 + bob - armAn, 2.5, 0, Math.PI * 2); ctx.fill();

    // SWORD
    const swG = ctx.createLinearGradient(x + 34, y + 5 - armAn, x + 32, y + 32 - armAn);
    swG.addColorStop(0, '#e0e0e0'); swG.addColorStop(0.5, '#aaaaaa'); swG.addColorStop(1, '#666');
    ctx.fillStyle = swG;
    ctx.beginPath(); ctx.roundRect(x + 32, y + 6 + bob - armAn, 4, 30, 1); ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.roundRect(x + 28, y + 28 + bob - armAn, 12, 4, 2); ctx.fill();

    // HEAD (meaner skull)
    const skG = ctx.createRadialGradient(x + 13, y + 6 + bob, 1, x + 17, y + 9 + bob, 12);
    skG.addColorStop(0, '#e0e0e0'); skG.addColorStop(0.6, '#c8c8c8'); skG.addColorStop(1, '#909090');
    ctx.fillStyle = skG;
    ctx.beginPath(); ctx.ellipse(x + 17, y + 9 + bob, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x + 9, y + 12 + bob, 4, 3, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 25, y + 12 + bob, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    // Red glowing eyes
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 14;
    ctx.fillStyle = '#bb0000';
    ctx.beginPath(); ctx.ellipse(x + 11, y + 8 + bob, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 23, y + 8 + bob, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(x + 11, y + 8 + bob, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 23, y + 8 + bob, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(x + 17, y + 13 + bob, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 9, y + 16 + bob, 17, 4, 1); ctx.fill();
    ctx.fillStyle = '#e0e0e0';
    for (let t = 0; t < 4; t++) { ctx.beginPath(); ctx.roundRect(x + 10 + t * 4, y + 16 + bob, 3, 3, [0, 0, 1, 1]); ctx.fill(); }
    ctx.restore();
}

// Draw gold coin - smooth gradient/glow version
function drawCoin(x, y, frame) {
    const bob = Math.sin(frame * 0.15) * 4;
    const cx = x + 12, cy = y + 12 + bob;
    const r = 11;
    const shimmer = Math.sin(frame * 0.2);

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(cx, cy + r + 4, r * 0.8, 3, 0, 0, Math.PI * 2); ctx.fill();

    // Coin rim (3D edge)
    ctx.fillStyle = '#A0760A';
    ctx.beginPath(); ctx.arc(cx, cy + 2, r + 2, 0, Math.PI * 2); ctx.fill();

    // Main face
    const cG = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, r);
    cG.addColorStop(0, `hsl(48,100%,${68 + shimmer * 12}%)`);
    cG.addColorStop(0.45, '#FFD700');
    cG.addColorStop(0.85, '#C8960C');
    cG.addColorStop(1, '#A07008');
    ctx.fillStyle = cG;
    ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.fill();

    // Highlight
    ctx.fillStyle = `rgba(255,255,210,${0.5 + shimmer * 0.28})`;
    ctx.beginPath(); ctx.ellipse(cx - 3, cy - 4, 5, 3, -0.6, 0, Math.PI * 2); ctx.fill();

    // Star symbol
    ctx.shadowColor = '#88ff44'; ctx.shadowBlur = 6;
    ctx.strokeStyle = '#1a7a1a'; ctx.lineWidth = 1.5;
    const sp = 5, oR = 5, iR = 2.5;
    ctx.beginPath();
    for (let s = 0; s < sp * 2; s++) {
        const a = (s * Math.PI / sp) - Math.PI / 2;
        const rad = s % 2 === 0 ? oR : iR;
        if (s === 0) ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        else ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.stroke();
    ctx.shadowBlur = 0;

    // Sparkles
    if (frame % 30 < 15) {
        ctx.fillStyle = 'rgba(255,255,200,0.85)';
        ctx.beginPath(); ctx.arc(cx - r + 1, cy - r + 1, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r - 2, cy + r - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    }
}

// Draw X-Wing starfighter with a longer Red Five silhouette
function drawShip(x, y, frame, hasPlayer) {
    const bob = Math.sin(frame * 0.1) * 3;
    const engineGlow = Math.sin(frame * 0.25) * 20 + 195;
    const cy = y + 24 + bob;
    const spread = hasPlayer ? 36 : 20;
    const wingRootRear = x + 20;
    const wingRootFront = x + 76;
    const wingTipX = x + 134;
    const cannonTipX = x + 152;
    const engineX = x + 32;
    const fuselageTailX = x + 14;
    const cockpitX = x + 68;
    const astromechX = x + 55;

    const wingCenters = [
        cy - spread - 6,
        cy - spread * 0.42 - 5,
        cy + spread * 0.42 + 5,
        cy + spread + 6
    ];
    const wingThickness = [11, 8, 8, 11];
    const wingSlant = [-10, -4, 4, 10];

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Rear engine block
    const rearG = ctx.createLinearGradient(fuselageTailX, cy - 12, fuselageTailX + 28, cy + 12);
    rearG.addColorStop(0, '#918c7e');
    rearG.addColorStop(0.45, '#cbc6b6');
    rearG.addColorStop(1, '#5f594d');
    ctx.fillStyle = rearG;
    ctx.beginPath();
    ctx.roundRect(fuselageTailX, cy - 13, 28, 26, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(55,50,40,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wings and cannons
    wingCenters.forEach((wingY, idx) => {
        const thickness = wingThickness[idx];
        const slant = wingSlant[idx];
        const topY = wingY - thickness;
        const bottomY = wingY + thickness;

        const wingG = ctx.createLinearGradient(wingRootRear, topY, wingTipX, bottomY);
        wingG.addColorStop(0, '#c9c4b5');
        wingG.addColorStop(0.45, '#f0ebde');
        wingG.addColorStop(1, '#b8b2a4');
        ctx.fillStyle = wingG;
        ctx.beginPath();
        ctx.moveTo(wingRootRear, topY + slant * 0.12);
        ctx.lineTo(wingRootFront, topY);
        ctx.lineTo(wingTipX, wingY - thickness * 0.45);
        ctx.lineTo(wingTipX - 8, wingY + thickness * 0.45);
        ctx.lineTo(wingRootFront, bottomY);
        ctx.lineTo(wingRootRear, bottomY - slant * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(70,62,50,0.45)';
        ctx.lineWidth = 0.9;
        ctx.stroke();

        // Red Five striping
        ctx.fillStyle = '#c53a24';
        ctx.beginPath();
        ctx.moveTo(wingRootRear + 14, wingY - thickness * 0.35);
        ctx.lineTo(wingRootFront + 8, wingY - thickness * 0.48);
        ctx.lineTo(wingTipX - 18, wingY - thickness * 0.22);
        ctx.lineTo(wingTipX - 24, wingY + thickness * 0.05);
        ctx.lineTo(wingRootFront + 10, wingY + thickness * 0.12);
        ctx.lineTo(wingRootRear + 14, wingY + thickness * 0.02);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(82,70,56,0.25)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(wingRootRear + 18, wingY);
        ctx.lineTo(wingTipX - 14, wingY);
        ctx.stroke();
        [0.28, 0.55, 0.76].forEach(t => {
            const px = wingRootRear + (wingTipX - wingRootRear) * t;
            ctx.beginPath();
            ctx.moveTo(px, wingY - thickness * 0.72);
            ctx.lineTo(px + 4, wingY + thickness * 0.72);
            ctx.stroke();
        });

        // Engines mounted on each S-foil
        const nacHalfLen = 16;
        const nacHalfH = 6;
        const nacG = ctx.createLinearGradient(engineX - nacHalfLen, wingY - nacHalfH, engineX + nacHalfLen, wingY + nacHalfH);
        nacG.addColorStop(0, '#7d766a');
        nacG.addColorStop(0.45, '#d1cabd');
        nacG.addColorStop(1, '#5a564c');
        ctx.fillStyle = nacG;
        ctx.beginPath();
        ctx.roundRect(engineX - nacHalfLen, wingY - nacHalfH, nacHalfLen * 2, nacHalfH * 2, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(55,48,40,0.5)';
        ctx.lineWidth = 0.9;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(52,46,38,0.65)';
        ctx.lineWidth = 1.2;
        [0.22, 0.52, 0.78].forEach(t => {
            const bandX = engineX - nacHalfLen + nacHalfLen * 2 * t;
            ctx.beginPath();
            ctx.moveTo(bandX, wingY - nacHalfH);
            ctx.lineTo(bandX, wingY + nacHalfH);
            ctx.stroke();
        });

        const exhaustG = ctx.createRadialGradient(engineX - nacHalfLen - 2, wingY, 0, engineX - nacHalfLen - 2, wingY, 16);
        exhaustG.addColorStop(0, `rgba(${engineGlow}, ${Math.floor(engineGlow * 0.43)}, 40, 0.95)`);
        exhaustG.addColorStop(0.55, `rgba(${Math.floor(engineGlow * 0.58)}, 70, 0, 0.35)`);
        exhaustG.addColorStop(1, 'rgba(255,40,0,0)');
        ctx.fillStyle = exhaustG;
        ctx.beginPath();
        ctx.arc(engineX - nacHalfLen - 2, wingY, 16, 0, Math.PI * 2);
        ctx.fill();

        // Long wingtip cannons
        ctx.strokeStyle = '#c8c2b2';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(wingTipX - 4, wingY);
        ctx.lineTo(cannonTipX, wingY);
        ctx.stroke();
        ctx.fillStyle = '#6f6a5f';
        for (let band = 0; band < 5; band++) {
            const bx = wingTipX + 5 + band * 8;
            ctx.fillRect(bx, wingY - 3, 2.5, 6);
        }
        ctx.fillStyle = '#4b463d';
        ctx.fillRect(cannonTipX - 3, wingY - 3, 6, 6);
        if (hasPlayer && frame % 8 < 4) {
            ctx.fillStyle = '#ff5522';
            ctx.shadowColor = '#ff7722';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cannonTipX, wingY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    // Fuselage body
    const fuselageG = ctx.createLinearGradient(fuselageTailX, cy - 14, x + 156, cy + 14);
    fuselageG.addColorStop(0, '#bbb5a7');
    fuselageG.addColorStop(0.35, '#f1ede2');
    fuselageG.addColorStop(0.75, '#ddd6c8');
    fuselageG.addColorStop(1, '#a49d90');
    ctx.fillStyle = fuselageG;
    ctx.beginPath();
    ctx.moveTo(fuselageTailX + 10, cy - 12);
    ctx.lineTo(x + 64, cy - 14);
    ctx.lineTo(x + 104, cy - 11);
    ctx.lineTo(x + 144, cy - 4);
    ctx.lineTo(x + 156, cy);
    ctx.lineTo(x + 144, cy + 4);
    ctx.lineTo(x + 104, cy + 11);
    ctx.lineTo(x + 64, cy + 14);
    ctx.lineTo(fuselageTailX + 10, cy + 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(68,62,50,0.45)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Orange striping along the nose and cockpit section
    ctx.fillStyle = '#ca3f26';
    ctx.beginPath();
    ctx.moveTo(x + 30, cy - 5);
    ctx.lineTo(x + 88, cy - 6);
    ctx.lineTo(x + 120, cy - 3);
    ctx.lineTo(x + 116, cy + 1);
    ctx.lineTo(x + 88, cy + 1);
    ctx.lineTo(x + 30, cy - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d57a48';
    ctx.fillRect(x + 38, cy - 1, 30, 3);

    // Nose seam and panel lines
    ctx.strokeStyle = 'rgba(68,62,50,0.28)';
    ctx.lineWidth = 0.8;
    [x + 36, x + 58, x + 84, x + 108].forEach(px => {
        ctx.beginPath();
        ctx.moveTo(px, cy - 12);
        ctx.lineTo(px, cy + 12);
        ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(x + 24, cy);
    ctx.lineTo(x + 152, cy);
    ctx.stroke();

    // R2 socket behind canopy
    const r2y = cy - 24;
    const r2G = ctx.createRadialGradient(astromechX + 4, r2y + 3, 0, astromechX + 4, r2y + 4, 9);
    r2G.addColorStop(0, '#ffffff');
    r2G.addColorStop(0.5, '#dce6f7');
    r2G.addColorStop(1, '#7f90b8');
    ctx.fillStyle = r2G;
    ctx.beginPath();
    ctx.ellipse(astromechX + 4, r2y + 5, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bcc7dd';
    ctx.fillRect(astromechX - 1, r2y + 8, 11, 11);
    ctx.fillStyle = '#3b6cb6';
    ctx.fillRect(astromechX, r2y + 10, 9, 2);
    ctx.fillStyle = '#ff3322';
    ctx.beginPath();
    ctx.arc(astromechX + 4, r2y + 6, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit canopy set back from the nose
    const canopyY = cy - 24;
    ctx.fillStyle = '#2b261f';
    ctx.beginPath();
    ctx.moveTo(cockpitX - 3, canopyY + 16);
    ctx.quadraticCurveTo(cockpitX + 18, canopyY - 7, cockpitX + 36, canopyY + 12);
    ctx.quadraticCurveTo(cockpitX + 18, canopyY + 25, cockpitX - 3, canopyY + 16);
    ctx.closePath();
    ctx.fill();

    const canopyG = ctx.createRadialGradient(cockpitX + 12, canopyY + 7, 0, cockpitX + 16, canopyY + 12, 20);
    canopyG.addColorStop(0, '#a6dfff');
    canopyG.addColorStop(0.45, '#2597e4');
    canopyG.addColorStop(1, '#08294f');
    ctx.fillStyle = canopyG;
    ctx.beginPath();
    ctx.moveTo(cockpitX + 1, canopyY + 15);
    ctx.quadraticCurveTo(cockpitX + 18, canopyY - 1, cockpitX + 30, canopyY + 12);
    ctx.quadraticCurveTo(cockpitX + 18, canopyY + 20, cockpitX + 1, canopyY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.beginPath();
    ctx.ellipse(cockpitX + 12, canopyY + 7, 7, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();

    if (hasPlayer) {
        ctx.fillStyle = '#e5e1d7';
        ctx.beginPath();
        ctx.ellipse(cockpitX + 17, canopyY + 12, 5.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dca688';
        ctx.beginPath();
        ctx.ellipse(cockpitX + 17, canopyY + 15, 3.8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Engine flames
    if (hasPlayer) {
        wingCenters.forEach((wingY) => {
            const exhaustX = engineX - 18;
            const flameLen = 20 + Math.random() * 26;
            ctx.strokeStyle = 'rgba(255,145,30,0.9)';
            ctx.lineWidth = 5 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(exhaustX, wingY);
            ctx.lineTo(exhaustX - flameLen, wingY);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,226,120,0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(exhaustX, wingY);
            ctx.lineTo(exhaustX - flameLen * 0.55, wingY);
            ctx.stroke();
        });
    }

    ctx.restore();
}

// Draw pickup ship (floating, waiting to be entered)
function drawPickupShip(x, y, frame) {
    const bobOffset = Math.sin(frame * 0.08) * 8;

    // Glow effect
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    drawShip(x, y + bobOffset, frame, false);
    ctx.shadowBlur = 0;

    // "ENTER" indicator
    if (frame % 60 < 40) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px Courier New';
        ctx.fillText('PRESS E', x + 15, y - 10 + bobOffset);
    }
}

// ===== MUSIC SYSTEM =====
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playNote(frequency, duration, time, type = 'square') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);

    gainNode.gain.setValueAtTime(0.15, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(time);
    oscillator.stop(time + duration);
}

// Pokemon Theme - Gotta Catch Em All
function playPokemonTheme() {
    if (!audioCtx) initAudio();
    const now = audioCtx.currentTime;

    // Tempo: ~136 BPM
    const Q = 0.22;        // quarter note
    const E = Q / 2;       // eighth note
    const H = Q * 2;       // half note
    const DQ = Q * 1.5;    // dotted quarter
    const W = Q * 4;       // whole note

    // Note frequencies
    const F3=175, G3=196, A3=220, B3=247, C4=262, D4=294, E4=330, G4=392, A4=440, B4=494,
          C5=523, D5=587, E5=659, F5=698, G5=784, A5=880, B5=988,
          C6=1047, D6=1175, E6=1319;

    let t = 0;
    const mel = [];
    function n(f, d) { mel.push([f, d, t]); t += d; }
    function r(d) { t += d; }

    // === INTRO FANFARE ===
    n(C5,E); n(E5,E); n(G5,E); n(C6,DQ); r(E); r(Q);

    // === VERSE 1 ===
    // "I wanna be the very best"
    n(E5,Q); n(G5,E); n(E5,Q); n(D5,E);
    n(C5,H); n(D5,Q);
    // "Like no one ever was"
    n(E5,Q); n(G5,E); n(E5,Q); n(D5,E);
    n(C5,Q); n(B4,H); r(E);
    // "To catch them is my real test"
    n(E5,Q); n(G5,E); n(E5,Q); n(D5,E);
    n(C5,Q); n(D5,Q); n(E5,H);
    // "To train them is my cause"
    n(G5,Q); n(A5,E); n(G5,Q); n(E5,E);
    n(D5,Q); n(C5,H); r(Q);

    // === VERSE 2 ===
    // "I will travel across the land"
    n(E5,Q); n(G5,E); n(A5,E); n(G5,Q);
    n(E5,Q); n(D5,Q); n(C5,Q); n(D5,Q);
    // "Searching far and wide"
    n(E5,Q); n(G5,E);
    n(E5,Q); n(D5,Q); n(C5,Q); n(B4,H);
    // "Each Pokemon to understand"
    n(E5,Q); n(G5,E); n(A5,E); n(G5,Q);
    n(E5,Q); n(D5,Q); n(C5,Q); n(D5,Q);
    // "The power that's inside"
    n(G5,Q); n(A5,E);
    n(G5,Q); n(E5,Q); n(D5,Q); n(C5,H); r(Q);

    // === CHORUS TRANSITION: "Pokemon!" ===
    n(G5,E); n(A5,E); n(B5,E); n(C6,Q); r(Q);

    // === CHORUS ===
    // "Gotta catch em all (Pokemon!)"
    n(G5,E); n(G5,E); n(A5,Q); n(G5,Q); n(E5,Q); n(G5,H); r(E);
    n(C6,DQ); n(B5,E); n(A5,Q); n(G5,H);
    // "It's you and me"
    n(G5,E); n(G5,E); n(A5,Q); n(G5,E); n(E5,H); r(Q);
    // "I know it's my destiny"
    n(G5,E); n(G5,E); n(A5,Q); n(G5,Q); n(E5,Q);
    n(G5,E); n(A5,E); n(G5,Q); n(F5,H); r(Q);

    // "Pokemon!" (2nd)
    n(E6,E); n(D6,E); n(C6,Q); r(E);
    // "Oh you're my best friend"
    n(E6,Q); n(D6,Q); n(C6,Q); n(D6,E); n(C6,E); n(B5,H);
    // "In a world we must defend"
    n(G5,Q); n(A5,E); n(B5,E); n(C6,Q); n(D6,Q);
    n(B5,Q); n(A5,Q); n(G5,Q); n(A5,H);

    // "Pokemon!" (3rd)
    n(G5,E); n(A5,E); n(B5,E); n(C6,Q); r(Q);

    // "Gotta catch em all"
    n(G5,E); n(G5,E); n(A5,Q); n(G5,Q); n(E5,Q); n(G5,H); r(E);
    // "A heart so true"
    n(E6,Q); n(D6,Q); n(C6,Q); n(B5,H); r(Q);
    // "Our courage will pull us through"
    n(G5,Q); n(A5,E); n(B5,E); n(C6,Q); n(D6,Q);
    n(E6,Q); n(D6,Q); n(C6,Q); n(B5,H);
    // "You teach me and I'll teach you"
    n(G5,Q); n(A5,E); n(B5,E); n(C6,Q); n(D6,Q);
    n(E6,Q); n(D6,Q); n(C6,Q); n(B5,Q); n(A5,Q);

    // "Pokemon!" (final build)
    n(G5,Q); n(A5,Q); n(B5,Q); n(G5,H); r(Q);

    // "Gotta catch em all - Gotta catch em all - Pokemon!"
    n(G5,E); n(G5,E); n(A5,Q); n(G5,Q); n(E5,Q); n(G5,H); r(E);
    n(G5,E); n(G5,E); n(A5,Q); n(G5,Q); n(E5,Q); n(G5,H); r(Q);
    n(C6,W);

    const totalDuration = t;

    // Play melody (square wave - chiptune style)
    mel.forEach(([freq, dur, time]) => {
        playNote(freq, dur * 0.88, now + time, 'square');
    });

    // Bass line: Am - F - C - G pattern (half-note bass)
    const bassNotes = [A3, F3, C4, G3, A3, F3, G3, G3];
    for (let i = 0; i < Math.ceil(totalDuration / H); i++) {
        playNote(bassNotes[i % bassNotes.length], H * 0.8, now + i * H, 'triangle');
    }

    // Kick drum on beats 1 & 3, snare on 2 & 4
    for (let i = 0; i < Math.ceil(totalDuration / Q); i++) {
        if (i % 4 === 0) playNote(80,  0.09, now + i * Q, 'square'); // kick
        if (i % 4 === 2) playNote(200, 0.07, now + i * Q, 'square'); // snare
    }
    // Eighth-note hi-hat
    for (let i = 0; i < Math.ceil(totalDuration / E); i++) {
        playNote(2800, 0.025, now + i * E, 'square');
    }

    return totalDuration;
}

function toggleMusic() {
    initAudio();
    musicPlaying = !musicPlaying;
    document.getElementById('musicBtn').textContent = musicPlaying ? 'Music: ON' : 'Music: OFF';

    if (musicPlaying) {
        const duration = playPokemonTheme();
        const intervalMs = Math.floor(duration * 1000) + 600;
        musicInterval = setInterval(() => {
            if (musicPlaying && gameRunning) {
                playPokemonTheme();
            }
        }, intervalMs);
    } else {
        if (musicInterval) {
            clearInterval(musicInterval);
            musicInterval = null;
        }
    }
}

// Draw block obstacle - 3D isometric look
function drawBlock(x, y, type) {
    const size = 40;
    const sW = 10, tH = 8; // side width, top height

    let fTop, fBot, topClr, sideClr;
    if (type === 'stone') {
        fTop = '#909090'; fBot = '#5a5a5a'; topClr = '#b8b8b8'; sideClr = '#404040';
    } else if (type === 'cobblestone') {
        fTop = '#807060'; fBot = '#504030'; topClr = '#a09070'; sideClr = '#342818';
    } else {
        fTop = '#2a1858'; fBot = '#0e0820'; topClr = '#3e2880'; sideClr = '#06030f';
    }

    // Right side (darkest)
    ctx.beginPath();
    ctx.moveTo(x + size, y); ctx.lineTo(x + size + sW, y - tH);
    ctx.lineTo(x + size + sW, y + size - tH); ctx.lineTo(x + size, y + size);
    ctx.closePath(); ctx.fillStyle = sideClr; ctx.fill();

    // Top face (lightest)
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + size, y);
    ctx.lineTo(x + size + sW, y - tH); ctx.lineTo(x + sW, y - tH);
    ctx.closePath(); ctx.fillStyle = topClr; ctx.fill();

    // Front face gradient
    const fG = ctx.createLinearGradient(x, y, x + size, y + size);
    fG.addColorStop(0, fTop); fG.addColorStop(1, fBot);
    ctx.fillStyle = fG; ctx.fillRect(x, y, size, size);

    // Front texture details
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
    if (type === 'stone') {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 6); ctx.lineTo(x + 20, y + 18);
        ctx.moveTo(x + 24, y + 22); ctx.lineTo(x + 34, y + 32);
        ctx.moveTo(x + 5, y + 30); ctx.lineTo(x + 16, y + 38);
        ctx.stroke();
    } else if (type === 'cobblestone') {
        ctx.strokeRect(x + 2, y + 2, 16, 14); ctx.strokeRect(x + 20, y + 4, 18, 16);
        ctx.strokeRect(x + 4, y + 20, 20, 12); ctx.strokeRect(x + 26, y + 22, 12, 15);
    } else {
        ctx.shadowColor = '#8844ff'; ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(160, 80, 255, 0.4)';
        ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + 34, y + 34); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 34, y + 6); ctx.lineTo(x + 6, y + 34); ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + size, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + size); ctx.stroke();
    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
}

// Draw burrow trench - exposed tunnel instead of lava
function drawBurrowPit(x, width, frame) {
    const tunnelY = groundY + 10;
    const tunnelDepth = 52;

    const wallG = ctx.createLinearGradient(0, groundY - 2, 0, tunnelY + tunnelDepth);
    wallG.addColorStop(0, '#7b5528');
    wallG.addColorStop(0.28, '#5b3a18');
    wallG.addColorStop(1, '#231409');
    ctx.fillStyle = wallG;
    ctx.fillRect(x, groundY - 2, width, tunnelDepth + 8);

    ctx.beginPath();
    ctx.moveTo(x, groundY + 6);
    for (let i = 0; i <= width; i += 8) {
        const wobble = Math.sin(frame * 0.1 + i * 0.14) * 4;
        ctx.lineTo(x + i, groundY + 7 + wobble);
    }
    ctx.lineTo(x + width, groundY + 26);
    ctx.lineTo(x, groundY + 26);
    ctx.closePath();
    const roofG = ctx.createLinearGradient(0, groundY + 2, 0, groundY + 26);
    roofG.addColorStop(0, '#9b6d34');
    roofG.addColorStop(0.55, '#6e431a');
    roofG.addColorStop(1, '#47280f');
    ctx.fillStyle = roofG;
    ctx.fill();

    const interiorG = ctx.createLinearGradient(0, tunnelY, 0, tunnelY + tunnelDepth);
    interiorG.addColorStop(0, '#221307');
    interiorG.addColorStop(0.4, '#120b04');
    interiorG.addColorStop(1, '#050301');
    ctx.fillStyle = interiorG;
    ctx.fillRect(x + 6, tunnelY + 4, Math.max(0, width - 12), tunnelDepth - 10);

    for (let i = 8; i < width - 8; i += 18) {
        const dirtY = groundY + 8 + Math.sin(frame * 0.12 + i * 0.22) * 3;
        ctx.fillStyle = i % 36 === 0 ? '#c99652' : '#8f6131';
        ctx.beginPath();
        ctx.ellipse(x + i, dirtY, 5, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    const rimG = ctx.createLinearGradient(0, groundY - 8, 0, groundY + 8);
    rimG.addColorStop(0, 'rgba(255,236,186,0)');
    rimG.addColorStop(0.55, 'rgba(255,236,186,0.22)');
    rimG.addColorStop(1, 'rgba(120,72,30,0)');
    ctx.fillStyle = rimG;
    ctx.fillRect(x - 4, groundY - 8, width + 8, 16);
}

// Draw fireball - radial gradient version
function drawFireball(fb) {
    const cx = fb.x + 8, cy = fb.y + 8, r = 8;
    ctx.shadowColor = '#ff5500'; ctx.shadowBlur = 18;
    const fG = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, r * 1.6);
    fG.addColorStop(0, '#ffffcc'); fG.addColorStop(0.2, '#ffdd44');
    fG.addColorStop(0.55, '#ff8800'); fG.addColorStop(0.85, '#ff3300');
    fG.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = fG;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Tendrils
    const t = fb.frame * 0.4;
    for (let i = 0; i < 3; i++) {
        const a = t + i * (Math.PI * 2 / 3);
        const tG = ctx.createRadialGradient(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, 0,
            cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, r * 0.6);
        tG.addColorStop(0, 'rgba(255,190,50,0.7)'); tG.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = tG;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    // Trail
    const tG2 = ctx.createRadialGradient(cx - fb.velocityX * 3, cy - fb.velocityY * 3, 0, cx - fb.velocityX * 3, cy - fb.velocityY * 3, r * 1.2);
    tG2.addColorStop(0, 'rgba(255,120,0,0.4)'); tG2.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = tG2;
    ctx.beginPath(); ctx.arc(cx - fb.velocityX * 3, cy - fb.velocityY * 3, r * 1.2, 0, Math.PI * 2); ctx.fill();
}

// Draw Hulk giant enemy - smooth gradient version
function drawHulk(x, y, frame, hulk) {
    const bobOffset = Math.sin(frame * 0.15) * 3;
    const smashing = hulk.smashTimer > 0;
    const smashOff = smashing ? Math.sin(hulk.smashTimer * 0.5) * 8 : 0;
    const legSwing = Math.sin(frame * 0.2) * 8;
    const armRaise = smashing ? -30 + smashOff : Math.sin(frame * 0.15) * 6;
    const bY = y + bobOffset;

    ctx.save();
    if (hulk.facingLeft) {
        ctx.translate(x + hulk.width, 0);
        ctx.scale(-1, 1);
        x = 0;
    }

    // === LEGS ===
    const lG = ctx.createLinearGradient(0, bY + 85, 0, bY + 128);
    lG.addColorStop(0, '#4aaa2e'); lG.addColorStop(1, '#266018');
    ctx.fillStyle = lG;
    ctx.beginPath(); ctx.roundRect(x + 10, bY + 85 + legSwing, 22, 36, 5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 43, bY + 85 - legSwing, 22, 36, 5); ctx.fill();

    // Torn purple pants
    const pG = ctx.createLinearGradient(0, bY + 72, 0, bY + 96);
    pG.addColorStop(0, '#7845b0'); pG.addColorStop(1, '#48207a');
    ctx.fillStyle = pG;
    ctx.beginPath(); ctx.roundRect(x + 6, bY + 72, 28, 22, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 40, bY + 72, 28, 22, 4); ctx.fill();

    // Feet
    ctx.fillStyle = '#2a6018';
    ctx.beginPath(); ctx.ellipse(x + 21, bY + 122 + legSwing, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 54, bY + 122 - legSwing, 14, 6, 0, 0, Math.PI * 2); ctx.fill();

    // === TORSO ===
    const tG = ctx.createLinearGradient(x + 4, bY + 28, x + 72, bY + 80);
    tG.addColorStop(0, '#52c835'); tG.addColorStop(0.4, '#3a9028'); tG.addColorStop(1, '#286018');
    ctx.fillStyle = tG;
    ctx.beginPath(); ctx.roundRect(x + 4, bY + 28, 67, 50, [8, 8, 4, 4]); ctx.fill();

    // Muscle highlights
    ctx.fillStyle = 'rgba(120,240,70,0.2)';
    ctx.beginPath(); ctx.ellipse(x + 24, bY + 44, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 51, bY + 44, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
    for (let ab = 0; ab < 2; ab++) {
        ctx.fillStyle = 'rgba(90,190,45,0.2)';
        ctx.beginPath(); ctx.ellipse(x + 27, bY + 59 + ab * 8, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 50, bY + 59 + ab * 8, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    }

    // === ARMS ===
    const aLG = ctx.createLinearGradient(x - 14, bY + 30, x + 8, bY + 82);
    aLG.addColorStop(0, '#4db832'); aLG.addColorStop(1, '#286018');
    ctx.fillStyle = aLG;
    ctx.beginPath(); ctx.roundRect(x - 14, bY + 30 + armRaise, 22, 50, 7); ctx.fill();
    ctx.fillStyle = '#235214';
    ctx.beginPath(); ctx.ellipse(x - 3, bY + 80 + armRaise, 13, 10, 0.3, 0, Math.PI * 2); ctx.fill();

    const aRG = ctx.createLinearGradient(x + 66, bY + 30, x + 88, bY + 82);
    aRG.addColorStop(0, '#4db832'); aRG.addColorStop(1, '#286018');
    ctx.fillStyle = aRG;
    ctx.beginPath(); ctx.roundRect(x + 66, bY + 30 - armRaise, 22, 50, 7); ctx.fill();
    ctx.fillStyle = '#235214';
    ctx.beginPath(); ctx.ellipse(x + 77, bY + 80 - armRaise, 13, 10, -0.3, 0, Math.PI * 2); ctx.fill();

    // === HEAD ===
    const hG = ctx.createRadialGradient(x + 35, bY + 14, 2, x + 37, bY + 18, 26);
    hG.addColorStop(0, '#5ed838'); hG.addColorStop(0.5, '#3a9028'); hG.addColorStop(1, '#20600c');
    ctx.fillStyle = hG;
    ctx.beginPath(); ctx.ellipse(x + 37, bY + 18, 26, 22, 0, 0, Math.PI * 2); ctx.fill();

    // Angry brow
    ctx.strokeStyle = '#184a0a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 14, bY + 9); ctx.lineTo(x + 30, bY + 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 60, bY + 9); ctx.lineTo(x + 44, bY + 14); ctx.stroke();

    // Eyes
    ctx.shadowColor = '#ff3300'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(x + 27, bY + 21, 7, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 48, bY + 21, 7, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#180000';
    ctx.beginPath(); ctx.arc(x + 29, bY + 21, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 50, bY + 21, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2200';
    ctx.beginPath(); ctx.arc(x + 29, bY + 21, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 50, bY + 21, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Nose
    ctx.fillStyle = '#286018';
    ctx.beginPath(); ctx.ellipse(x + 37, bY + 28, 5, 4, 0, 0, Math.PI * 2); ctx.fill();

    // Grimacing mouth
    ctx.fillStyle = '#0e1e0a';
    ctx.beginPath();
    ctx.moveTo(x + 22, bY + 32); ctx.quadraticCurveTo(x + 37, bY + 38, x + 53, bY + 32);
    ctx.lineTo(x + 53, bY + 36); ctx.quadraticCurveTo(x + 37, bY + 41, x + 22, bY + 36);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dddddd';
    for (let t = 0; t < 4; t++) {
        ctx.beginPath(); ctx.roundRect(x + 25 + t * 7, bY + 32, 5, 4, 1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x + 25 + t * 7, bY + 36, 5, 4, 1); ctx.fill();
    }

    // Hair
    ctx.fillStyle = '#182018';
    ctx.beginPath(); ctx.ellipse(x + 37, bY - 1, 26, 9, 0, Math.PI, Math.PI * 2); ctx.fill();

    // === SMASH EFFECT ===
    if (smashing && hulk.smashTimer < 10) {
        ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255,210,0,0.45)';
        ctx.fillRect(x - 20, y + 120, hulk.width + 40, 8);
        ctx.fillStyle = 'rgba(255,100,0,0.28)';
        ctx.fillRect(x - 30, y + 115, hulk.width + 60, 6);
        ctx.shadowBlur = 0;
    }

    if (smashing && hulk.smashTimer > 15) {
        ctx.shadowColor = '#00ff00'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText('HULK SMASH!', x + 3, y - 10 + bobOffset);
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// Draw giant Charizard fireball - smooth radial gradient
function drawGiantFireball(fb) {
    const cx = fb.x + 20, cy = fb.y + 20;
    const r = 20 + Math.sin(fb.frame * 0.4) * 3;
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 32;
    const fG = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, r * 1.9);
    fG.addColorStop(0, '#ffffff');
    fG.addColorStop(0.12, '#ffffaa');
    fG.addColorStop(0.35, '#ffcc00');
    fG.addColorStop(0.62, '#ff6600');
    fG.addColorStop(0.86, '#ff2200');
    fG.addColorStop(1, 'rgba(255,30,0,0)');
    ctx.fillStyle = fG;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Outer fire wisps
    const t = fb.frame * 0.35;
    for (let i = 0; i < 5; i++) {
        const a = t + i * (Math.PI * 2 / 5);
        const wx = cx + Math.cos(a) * r * 0.85, wy = cy + Math.sin(a) * r * 0.85;
        const wG = ctx.createRadialGradient(wx, wy, 0, wx, wy, r * 0.65);
        wG.addColorStop(0, 'rgba(255,200,50,0.75)'); wG.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = wG;
        ctx.beginPath(); ctx.arc(wx, wy, r * 0.65, 0, Math.PI * 2); ctx.fill();
    }
    // Trail
    const trG = ctx.createRadialGradient(
        cx - fb.velocityX * 4, cy - fb.velocityY * 4, 0,
        cx - fb.velocityX * 4, cy - fb.velocityY * 4, r * 1.5);
    trG.addColorStop(0, 'rgba(255,140,0,0.45)'); trG.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = trG;
    ctx.beginPath(); ctx.arc(cx - fb.velocityX * 4, cy - fb.velocityY * 4, r * 1.5, 0, Math.PI * 2); ctx.fill();
}

// Draw Gigantamax Charizard - realistic dragon version
function drawGigantamaxCharizard(ch) {
    const x = ch.x;
    const y = ch.y;
    const frame = ch.frame;
    const bo = Math.sin(frame * 0.05) * 8;       // hover bob
    const wf = Math.sin(frame * 0.09) * 14;      // wing flap
    const ft = frame * 0.14;                     // flame anim timer

    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // ── LEFT WING (drawn behind body) ──────────────────────────────────
    const lwX = x + 82, lwY = y + 108 + bo;
    const lwG = ctx.createLinearGradient(lwX - 175, lwY - 60 + wf, lwX + 10, lwY + 110);
    lwG.addColorStop(0, '#050402'); lwG.addColorStop(0.32, '#1b120d');
    lwG.addColorStop(0.68, '#4a1208'); lwG.addColorStop(1, '#d64e10');
    ctx.fillStyle = lwG;
    ctx.beginPath();
    ctx.moveTo(lwX, lwY - 22);
    ctx.bezierCurveTo(lwX - 50, lwY - 65 + wf * 0.6, lwX - 115, lwY - 82 + wf, lwX - 168, lwY - 38 + wf);
    ctx.bezierCurveTo(lwX - 190, lwY + 14 + wf * 0.5, lwX - 178, lwY + 78, lwX - 138, lwY + 135);
    ctx.bezierCurveTo(lwX - 85, lwY + 188, lwX - 32, lwY + 178, lwX, lwY + 142);
    ctx.closePath(); ctx.fill();
    // Membrane shimmer
    const lwHL = ctx.createRadialGradient(lwX - 85, lwY + 55, 5, lwX - 85, lwY + 55, 90);
    lwHL.addColorStop(0, 'rgba(255,110,30,0.24)'); lwHL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lwHL;
    ctx.beginPath();
    ctx.moveTo(lwX, lwY - 22);
    ctx.bezierCurveTo(lwX - 50, lwY - 65 + wf * 0.6, lwX - 115, lwY - 82 + wf, lwX - 168, lwY - 38 + wf);
    ctx.bezierCurveTo(lwX - 190, lwY + 14 + wf * 0.5, lwX - 178, lwY + 78, lwX - 138, lwY + 135);
    ctx.bezierCurveTo(lwX - 85, lwY + 188, lwX - 32, lwY + 178, lwX, lwY + 142);
    ctx.closePath(); ctx.fill();
    // Wing finger bones
    ctx.strokeStyle = '#120b07'; ctx.lineWidth = 3.5;
    ctx.beginPath(); // main arm bone
    ctx.moveTo(lwX, lwY);
    ctx.bezierCurveTo(lwX - 55, lwY - 28 + wf * 0.5, lwX - 120, lwY - 40 + wf, lwX - 168, lwY - 36 + wf);
    ctx.stroke();
    for (let f = 0; f < 3; f++) {
        ctx.lineWidth = 2.8 - f * 0.5;
        const bx = lwX - 60 - f * 28, by = lwY - 22 + wf * 0.3;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx - 28, by + 55 + f * 18, lwX - 95 - f * 22, lwY + 88 + f * 28);
        ctx.stroke();
    }

    // ── TAIL ──────────────────────────────────────────────────────────
    // Draw as a thick stroked bezier that tapers
    const tSX = x + 148, tSY = y + 242 + bo;
    ctx.lineWidth = 24; ctx.strokeStyle = '#31150b';
    ctx.beginPath();
    ctx.moveTo(tSX, tSY);
    ctx.bezierCurveTo(tSX + 38, tSY + 38, tSX + 72, tSY + 62, tSX + 78, tSY + 102);
    ctx.bezierCurveTo(tSX + 82, tSY + 132, tSX + 64, tSY + 158, tSX + 52, tSY + 172);
    ctx.stroke();
    ctx.lineWidth = 10; ctx.strokeStyle = '#a63610';
    ctx.beginPath();
    ctx.moveTo(tSX - 5, tSY + 2);
    ctx.bezierCurveTo(tSX + 32, tSY + 34, tSX + 64, tSY + 56, tSX + 68, tSY + 97);
    ctx.stroke();
    // Dragon tail spade (arrowhead tip)
    {
        const spX = tSX + 52, spY = tSY + 152;
        const spadeG = ctx.createRadialGradient(spX, spY + 8, 2, spX, spY + 14, 26);
        spadeG.addColorStop(0, '#f36b20'); spadeG.addColorStop(0.5, '#8e2608'); spadeG.addColorStop(1, '#2e0d04');
        ctx.fillStyle = spadeG;
        ctx.beginPath();
        ctx.moveTo(spX, spY - 10);                                             // top notch
        ctx.bezierCurveTo(spX + 20, spY + 4, spX + 28, spY + 18, spX, spY + 42);  // right lobe
        ctx.bezierCurveTo(spX - 28, spY + 18, spX - 20, spY + 4, spX, spY - 10);  // left lobe
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#5a1000'; ctx.lineWidth = 1.5; ctx.stroke();
        // Spade highlight
        ctx.fillStyle = 'rgba(255,100,30,0.22)';
        ctx.beginPath();
        ctx.moveTo(spX - 4, spY - 6);
        ctx.bezierCurveTo(spX + 8, spY + 2, spX + 14, spY + 12, spX + 4, spY + 30);
        ctx.bezierCurveTo(spX - 10, spY + 14, spX - 6, spY + 2, spX - 4, spY - 6);
        ctx.closePath(); ctx.fill();
    }
    // Tail flame (animated organic shape)
    const tFX = tSX + 52, tFY = tSY + 182 + bo * 0.25;
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 38;
    const outerGlow = ctx.createRadialGradient(tFX, tFY - 12, 2, tFX, tFY, 36);
    outerGlow.addColorStop(0, 'rgba(255,240,80,0)'); outerGlow.addColorStop(0.4, 'rgba(255,150,0,0.45)');
    outerGlow.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath(); ctx.arc(tFX, tFY, 36, 0, Math.PI * 2); ctx.fill();
    const flameLayers = [
        { r: 20, c0: '#ffffff', c1: '#ffee44', c2: '#ffaa00' },
        { r: 14, c0: '#ffee44', c1: '#ff8800', c2: '#ff3300' },
        { r:  8, c0: '#ff9900', c1: '#ff2200', c2: 'rgba(255,0,0,0)' },
    ];
    for (const fl of flameLayers) {
        const fG = ctx.createRadialGradient(tFX + Math.sin(ft) * 2, tFY - fl.r * 0.4, 0, tFX, tFY, fl.r * 2.4);
        fG.addColorStop(0, fl.c0); fG.addColorStop(0.45, fl.c1); fG.addColorStop(1, fl.c2);
        ctx.fillStyle = fG;
        ctx.beginPath();
        ctx.moveTo(tFX - fl.r, tFY + fl.r * 0.3);
        ctx.quadraticCurveTo(tFX - fl.r * 1.3 + Math.sin(ft + 1) * 4, tFY - fl.r * 1.4, tFX + Math.cos(ft) * fl.r * 0.3, tFY - fl.r * 2.6);
        ctx.quadraticCurveTo(tFX + fl.r * 1.3 + Math.sin(ft + 2) * 4, tFY - fl.r * 1.4, tFX + fl.r, tFY + fl.r * 0.3);
        ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── BODY ─────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(x + 58, y + 98 + bo);
    ctx.bezierCurveTo(x + 18, y + 130 + bo, x + 16, y + 202 + bo, x + 48, y + 252 + bo);
    ctx.bezierCurveTo(x + 72, y + 274 + bo, x + 122, y + 280 + bo, x + 162, y + 268 + bo);
    ctx.bezierCurveTo(x + 198, y + 255 + bo, x + 210, y + 222 + bo, x + 208, y + 182 + bo);
    ctx.bezierCurveTo(x + 205, y + 140 + bo, x + 190, y + 106 + bo, x + 155, y + 92 + bo);
    ctx.bezierCurveTo(x + 128, y + 82 + bo, x + 86, y + 82 + bo, x + 58, y + 98 + bo);
    const bodyG = ctx.createRadialGradient(x + 112, y + 142 + bo, 14, x + 115, y + 158 + bo, 90);
    bodyG.addColorStop(0, '#5a2410'); bodyG.addColorStop(0.34, '#24130b');
    bodyG.addColorStop(0.72, '#120d09'); bodyG.addColorStop(1, '#040302');
    ctx.fillStyle = bodyG; ctx.fill();
    ctx.strokeStyle = 'rgba(255,110,35,0.22)'; ctx.lineWidth = 2.5; ctx.stroke();
    // Belly plate
    ctx.beginPath();
    ctx.moveTo(x + 78, y + 118 + bo);
    ctx.bezierCurveTo(x + 62, y + 158 + bo, x + 65, y + 218 + bo, x + 94, y + 258 + bo);
    ctx.bezierCurveTo(x + 116, y + 272 + bo, x + 148, y + 270 + bo, x + 162, y + 252 + bo);
    ctx.bezierCurveTo(x + 175, y + 230 + bo, x + 170, y + 176 + bo, x + 156, y + 130 + bo);
    ctx.bezierCurveTo(x + 146, y + 105 + bo, x + 118, y + 98 + bo, x + 78, y + 118 + bo);
    const bellyG = ctx.createLinearGradient(x + 78, y + 108 + bo, x + 168, y + 265 + bo);
    bellyG.addColorStop(0, '#f5e8c2'); bellyG.addColorStop(0.5, '#e8d2a2'); bellyG.addColorStop(1, '#c79c54');
    ctx.fillStyle = bellyG; ctx.fill();
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 2; col++) {
            const cx = x + 104 + col * 28 + (row % 2) * 8;
            const cy = y + 142 + row * 30 + bo;
            const diamondG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
            diamondG.addColorStop(0, 'rgba(255,245,180,0.95)');
            diamondG.addColorStop(0.5, 'rgba(255,182,56,0.78)');
            diamondG.addColorStop(1, 'rgba(255,100,0,0)');
            ctx.fillStyle = diamondG;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 12);
            ctx.lineTo(cx + 10, cy);
            ctx.lineTo(cx, cy + 12);
            ctx.lineTo(cx - 10, cy);
            ctx.closePath();
            ctx.fill();
        }
    }
    // Body scale texture (shoulder/back)
    ctx.strokeStyle = 'rgba(255,120,40,0.18)'; ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            const sx = x + 28 + col * 22 + (row % 2) * 11;
            const sy = y + 108 + row * 18 + bo;
            ctx.beginPath(); ctx.arc(sx, sy, 10, 0.3, Math.PI - 0.3); ctx.stroke();
        }
    }

    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 18;
    for (let flare = 0; flare < 2; flare++) {
        const fx = flare === 0 ? x + 58 : x + 168;
        const dir = flare === 0 ? -1 : 1;
        const fy = y + 116 + bo;
        const flareG = ctx.createRadialGradient(fx, fy, 0, fx, fy, 26);
        flareG.addColorStop(0, '#fff4a8');
        flareG.addColorStop(0.38, '#ffb12f');
        flareG.addColorStop(0.75, '#ff5d10');
        flareG.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = flareG;
        ctx.beginPath();
        ctx.moveTo(fx - 7, fy + 8);
        ctx.quadraticCurveTo(fx + dir * 4, fy - 24, fx + dir * 12, fy - 10);
        ctx.quadraticCurveTo(fx + dir * 18, fy - 2, fx + dir * 12, fy + 12);
        ctx.closePath();
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── DORSAL SPINES (along back ridge) ─────────────────────────────
    const spineCount = 6;
    for (let si = 0; si < spineCount; si++) {
        const t = si / (spineCount - 1);
        // Spines run along the top-right back from shoulder to lower back
        const spX = x + 130 + t * 68;
        const spY = y + 88 + t * 32 + bo;
        const spH = 22 - si * 2.5;  // tallest at shoulder, shorter toward tail
        const spW = 6 + si * 0.5;
        const spineG = ctx.createLinearGradient(spX, spY, spX + 3, spY - spH);
        spineG.addColorStop(0, '#3a2800'); spineG.addColorStop(0.5, '#1e1408'); spineG.addColorStop(1, '#0a0804');
        ctx.fillStyle = spineG;
        ctx.beginPath();
        ctx.moveTo(spX - spW * 0.5, spY);
        ctx.bezierCurveTo(spX - spW * 0.4, spY - spH * 0.5, spX - 2, spY - spH * 0.9, spX + 1, spY - spH);
        ctx.bezierCurveTo(spX + 4, spY - spH * 0.9, spX + spW * 0.6, spY - spH * 0.4, spX + spW * 0.5, spY);
        ctx.closePath(); ctx.fill();
        // Spine highlight edge
        ctx.strokeStyle = 'rgba(100,60,10,0.4)'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(spX - spW * 0.3, spY);
        ctx.bezierCurveTo(spX - spW * 0.25, spY - spH * 0.5, spX - 1, spY - spH * 0.92, spX + 1, spY - spH);
        ctx.stroke();
    }

    // ── NECK ─────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 96 + bo);
    ctx.bezierCurveTo(x + 50, y + 72 + bo, x + 48, y + 48 + bo, x + 58, y + 30 + bo);
    ctx.bezierCurveTo(x + 66, y + 18 + bo, x + 82, y + 14 + bo, x + 98, y + 22 + bo);
    ctx.bezierCurveTo(x + 114, y + 30 + bo, x + 118, y + 52 + bo, x + 114, y + 72 + bo);
    ctx.bezierCurveTo(x + 112, y + 88 + bo, x + 100, y + 96 + bo, x + 88, y + 98 + bo);
    ctx.closePath();
    const neckG = ctx.createLinearGradient(x + 52, y + 18 + bo, x + 118, y + 98 + bo);
    neckG.addColorStop(0, '#662713'); neckG.addColorStop(0.48, '#29160d'); neckG.addColorStop(1, '#0b0805');
    ctx.fillStyle = neckG; ctx.fill();
    ctx.strokeStyle = 'rgba(80,12,0,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Neck ridge spines
    for (let nr = 0; nr < 4; nr++) {
        const t = nr / 3;
        const nrX = x + 108 - t * 22;
        const nrY = y + 28 + t * 52 + bo;
        const nrH = 11 + nr * 2;
        const nrG = ctx.createLinearGradient(nrX, nrY, nrX + 4, nrY - nrH);
        nrG.addColorStop(0, '#3a2000'); nrG.addColorStop(1, '#0e0a04');
        ctx.fillStyle = nrG;
        ctx.beginPath();
        ctx.moveTo(nrX - 4, nrY);
        ctx.bezierCurveTo(nrX - 2, nrY - nrH * 0.5, nrX + 2, nrY - nrH * 0.95, nrX + 4, nrY - nrH);
        ctx.bezierCurveTo(nrX + 7, nrY - nrH * 0.9, nrX + 6, nrY - nrH * 0.4, nrX + 4, nrY);
        ctx.closePath(); ctx.fill();
    }

    // ── LEGS ─────────────────────────────────────────────────────────
    const legSw = Math.sin(frame * 0.1) * 4;
    for (let leg = 0; leg < 2; leg++) {
        const lx = leg === 0 ? x + 60 : x + 142;
        const ls = leg === 0 ? legSw : -legSw;
        const thighG = ctx.createLinearGradient(lx, y + 250 + bo, lx + 45, y + 302 + bo);
        thighG.addColorStop(0, '#dd5500'); thighG.addColorStop(1, '#992200');
        ctx.fillStyle = thighG;
        ctx.beginPath();
        ctx.moveTo(lx, y + 254 + bo);
        ctx.bezierCurveTo(lx - 10, y + 265 + bo + ls, lx - 8, y + 288 + bo + ls, lx + 10, y + 302 + bo + ls);
        ctx.bezierCurveTo(lx + 24, y + 310 + bo + ls, lx + 46, y + 306 + bo + ls, lx + 50, y + 292 + bo + ls);
        ctx.bezierCurveTo(lx + 52, y + 276 + bo + ls, lx + 46, y + 258 + bo, lx + 34, y + 250 + bo);
        ctx.closePath(); ctx.fill();
        // Foot
        ctx.fillStyle = '#882200';
        ctx.beginPath(); ctx.ellipse(lx + 26, y + 306 + bo + ls, 22, 11, 0.2, 0, Math.PI * 2); ctx.fill();
        // Claws
        for (let c = 0; c < 3; c++) {
            const cx = lx + 10 + c * 14, cy = y + 318 + bo + ls;
            ctx.fillStyle = c % 2 === 0 ? '#d4b870' : '#c8a840';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 5);
            ctx.bezierCurveTo(cx - 5, cy + 5, cx - 3, cy + 14, cx + 2, cy + 13);
            ctx.bezierCurveTo(cx + 7, cy + 11, cx + 7, cy + 2, cx + 4, cy - 4);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#6a4808'; ctx.lineWidth = 0.7; ctx.stroke();
        }
    }

    // ── ARMS ─────────────────────────────────────────────────────────
    const armSw = Math.sin(frame * 0.08) * 10;
    for (let arm = 0; arm < 2; arm++) {
        const ax = arm === 0 ? x + 28 : x + 160;
        const as = arm === 0 ? armSw : -armSw;
        const armG2 = ctx.createLinearGradient(ax, y + 108 + bo, ax + 30, y + 168 + bo);
        armG2.addColorStop(0, '#dd5500'); armG2.addColorStop(1, '#992200');
        ctx.fillStyle = armG2;
        ctx.beginPath();
        ctx.moveTo(ax + 2, y + 112 + bo + as);
        ctx.bezierCurveTo(ax - 10, y + 132 + bo + as, ax - 8, y + 158 + bo + as, ax + 5, y + 172 + bo + as);
        ctx.bezierCurveTo(ax + 16, y + 180 + bo + as, ax + 34, y + 177 + bo + as, ax + 36, y + 163 + bo + as);
        ctx.bezierCurveTo(ax + 38, y + 148 + bo + as, ax + 32, y + 120 + bo + as, ax + 24, y + 112 + bo);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#882200';
        ctx.beginPath(); ctx.ellipse(ax + 20, y + 174 + bo + as, 17, 10, 0.3, 0, Math.PI * 2); ctx.fill();
        for (let c = 0; c < 2; c++) {
            const cx = ax + 10 + c * 16, cy = y + 186 + bo + as;
            ctx.fillStyle = '#d4b870';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 3);
            ctx.bezierCurveTo(cx - 4, cy + 6, cx - 1, cy + 13, cx + 2, cy + 12);
            ctx.bezierCurveTo(cx + 6, cy + 10, cx + 6, cy + 1, cx + 4, cy - 3);
            ctx.closePath(); ctx.fill();
        }
    }

    // ── HEAD ─────────────────────────────────────────────────────────
    const hx = x + 38, hy = y + bo;
    // Skull
    ctx.beginPath();
    ctx.moveTo(hx + 12, hy + 68);
    ctx.bezierCurveTo(hx + 2, hy + 46, hx, hy + 22, hx + 14, hy + 5);
    ctx.bezierCurveTo(hx + 28, hy - 10, hx + 56, hy - 14, hx + 76, hy - 5);
    ctx.bezierCurveTo(hx + 95, hy + 4, hx + 105, hy + 24, hx + 104, hy + 44);
    ctx.bezierCurveTo(hx + 103, hy + 60, hx + 90, hy + 72, hx + 76, hy + 74);
    ctx.closePath();
    const skullG = ctx.createRadialGradient(hx + 52, hy + 22, 6, hx + 56, hy + 34, 58);
    skullG.addColorStop(0, '#662813'); skullG.addColorStop(0.4, '#26130b');
    skullG.addColorStop(0.78, '#120c08'); skullG.addColorStop(1, '#050302');
    ctx.fillStyle = skullG; ctx.fill();
    ctx.strokeStyle = 'rgba(55,8,0,0.45)'; ctx.lineWidth = 2; ctx.stroke();
    // Upper snout
    ctx.beginPath();
    ctx.moveTo(hx + 14, hy + 50);
    ctx.bezierCurveTo(hx + 4, hy + 42, hx - 14, hy + 41, hx - 36, hy + 46);
    ctx.bezierCurveTo(hx - 59, hy + 50, hx - 78, hy + 58, hx - 86, hy + 69);
    ctx.bezierCurveTo(hx - 84, hy + 81, hx - 67, hy + 86, hx - 44, hy + 84);
    ctx.bezierCurveTo(hx - 16, hy + 81, hx + 5, hy + 76, hx + 12, hy + 67);
    ctx.closePath();
    const snoutG = ctx.createLinearGradient(hx - 86, hy + 48, hx + 18, hy + 76);
    snoutG.addColorStop(0, '#8f3411');
    snoutG.addColorStop(0.34, '#4f1f0f');
    snoutG.addColorStop(0.7, '#1a0d08');
    snoutG.addColorStop(1, '#6b250c');
    ctx.fillStyle = snoutG;
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,10,0,0.45)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Snout bridge and nose ridge
    ctx.strokeStyle = 'rgba(255,138,58,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx + 6, hy + 53);
    ctx.quadraticCurveTo(hx - 18, hy + 47, hx - 58, hy + 58);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx - 14, hy + 56);
    ctx.quadraticCurveTo(hx - 32, hy + 51, hx - 50, hy + 58);
    ctx.stroke();

    // Lower jaw
    ctx.beginPath();
    ctx.moveTo(hx + 8, hy + 67);
    ctx.bezierCurveTo(hx + 1, hy + 79, hx - 18, hy + 92, hx - 40, hy + 95);
    ctx.bezierCurveTo(hx - 64, hy + 97, hx - 80, hy + 91, hx - 82, hy + 82);
    ctx.bezierCurveTo(hx - 79, hy + 72, hx - 67, hy + 67, hx - 52, hy + 65);
    ctx.bezierCurveTo(hx - 31, hy + 63, hx - 8, hy + 62, hx + 8, hy + 64);
    ctx.closePath();
    const jawG = ctx.createLinearGradient(hx - 84, hy + 67, hx + 10, hy + 94);
    jawG.addColorStop(0, '#2a120a');
    jawG.addColorStop(0.45, '#120907');
    jawG.addColorStop(1, '#6a2912');
    ctx.fillStyle = jawG;
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,10,0,0.38)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Nostrils
    ctx.fillStyle = '#2b0200';
    ctx.beginPath();
    ctx.ellipse(hx - 34, hy + 62, 7, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx - 53, hy + 65, 7, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,170,110,0.2)';
    ctx.beginPath();
    ctx.ellipse(hx - 37, hy + 60, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx - 56, hy + 63, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dragon chin/jaw spikes
    ctx.fillStyle = '#252520';
    for (let cs = 0; cs < 3; cs++) {
        const csx = hx - 28 - cs * 13;
        const csy = hy + 88;
        const csh = 15 - cs * 2;
        ctx.beginPath();
        ctx.moveTo(csx - 4, csy);
        ctx.bezierCurveTo(csx - 3, csy + csh * 0.35, csx + 1, csy + csh, csx + 3, csy + csh);
        ctx.bezierCurveTo(csx + 5, csy + csh, csx + 7, csy + csh * 0.35, csx + 5, csy);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a3a33';
    }

    // Bright yellow eyes and ember pupils to match Gigantamax art.
    for (let eye = 0; eye < 2; eye++) {
        const ex = hx + 28 + eye * 38, ey = hy + 30;
        ctx.shadowColor = '#ffbb33'; ctx.shadowBlur = 16;
        const eyeRimG = ctx.createRadialGradient(ex, ey, 0, ex, ey, 14);
        eyeRimG.addColorStop(0, '#fff4b8'); eyeRimG.addColorStop(0.45, '#ffc933');
        eyeRimG.addColorStop(0.8, '#8f4f00'); eyeRimG.addColorStop(1, '#301600');
        ctx.fillStyle = eyeRimG;
        ctx.beginPath(); ctx.ellipse(ex, ey, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
        // Slit pupil
        ctx.shadowBlur = 0; ctx.fillStyle = '#2a0900';
        ctx.beginPath(); ctx.ellipse(ex, ey, 4, 11, 0, 0, Math.PI * 2); ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath(); ctx.ellipse(ex - 4, ey - 4, 4, 3, -0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Angry brows (slant inward = V shape = rage)
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#120800'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(hx + 16, hy + 20); ctx.lineTo(hx + 42, hy + 12); ctx.stroke(); // left brow
    ctx.beginPath(); ctx.moveTo(hx + 56, hy + 12); ctx.lineTo(hx + 82, hy + 22); ctx.stroke(); // right brow
    ctx.strokeStyle = '#3a1800'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(hx + 18, hy + 20); ctx.lineTo(hx + 41, hy + 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 57, hy + 14); ctx.lineTo(hx + 80, hy + 22); ctx.stroke();

    // Swept-back horns (bezier curves)
    const hornDefs = [
        { bx: hx + 36, by: hy + 4, tipX: hx - 2,  tipY: hy - 84, w: 17 },
        { bx: hx + 72, by: hy + 2, tipX: hx + 38, tipY: hy - 88, w: 17 },
    ];
    for (const h of hornDefs) {
        const hornG = ctx.createLinearGradient(h.bx, h.by, h.tipX, h.tipY);
        hornG.addColorStop(0, '#d8d2b8'); hornG.addColorStop(0.6, '#8f8874'); hornG.addColorStop(1, '#2c241b');
        ctx.fillStyle = hornG;
        ctx.beginPath();
        ctx.moveTo(h.bx - h.w / 2, h.by);
        ctx.bezierCurveTo(h.bx - h.w * 0.9, h.by - 22, h.tipX - 5, h.tipY + 12, h.tipX, h.tipY);
        ctx.bezierCurveTo(h.tipX + 4, h.tipY + 10, h.bx + h.w * 0.9, h.by - 16, h.bx + h.w / 2, h.by);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(200,200,200,0.18)';
        ctx.beginPath();
        ctx.moveTo(h.bx - 2, h.by - 2);
        ctx.bezierCurveTo(h.bx - 5, h.by - 18, h.tipX - 3, h.tipY + 16, h.tipX, h.tipY + 6);
        ctx.bezierCurveTo(h.tipX + 1, h.tipY + 12, h.bx + 1, h.by - 14, h.bx + 2, h.by - 2);
        ctx.closePath(); ctx.fill();
        const hornFlame = ctx.createRadialGradient(h.tipX, h.tipY + 4, 0, h.tipX, h.tipY + 4, 16);
        hornFlame.addColorStop(0, 'rgba(255,250,180,0.95)');
        hornFlame.addColorStop(0.45, 'rgba(255,176,45,0.75)');
        hornFlame.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = hornFlame;
        ctx.beginPath();
        ctx.moveTo(h.tipX - 5, h.tipY + 8);
        ctx.quadraticCurveTo(h.tipX, h.tipY - 14, h.tipX + 6, h.tipY + 8);
        ctx.closePath();
        ctx.fill();
    }
    // Smaller side ridges
    for (let sr = 0; sr < 2; sr++) {
        const srx = hx + 16 + sr * 72;
        ctx.fillStyle = '#383838';
        ctx.beginPath();
        ctx.moveTo(srx, hy + 12); ctx.bezierCurveTo(srx - 5, hy + 3, srx - 2, hy - 18, srx + 3, hy - 20);
        ctx.bezierCurveTo(srx + 8, hy - 18, srx + 9, hy - 3, srx + 7, hy + 10);
        ctx.closePath(); ctx.fill();
    }

    // Mouth interior
    if (ch.attackTimer > 0) {
        ctx.fillStyle = '#140000';
        ctx.beginPath();
        ctx.moveTo(hx + 8, hy + 67);
        ctx.bezierCurveTo(hx - 14, hy + 79, hx - 50, hy + 86, hx - 78, hy + 80);
        ctx.bezierCurveTo(hx - 81, hy + 72, hx - 69, hy + 66, hx - 50, hy + 65);
        ctx.bezierCurveTo(hx - 26, hy + 64, hx - 2, hy + 63, hx + 8, hy + 67);
        ctx.closePath(); ctx.fill();
        ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 22;
        const mgG = ctx.createLinearGradient(hx - 82, hy + 64, hx + 8, hy + 82);
        mgG.addColorStop(0, '#ffee66'); mgG.addColorStop(0.42, '#ff9b1f'); mgG.addColorStop(1, '#ff2200');
        ctx.fillStyle = mgG;
        ctx.beginPath();
        ctx.moveTo(hx + 4, hy + 67);
        ctx.bezierCurveTo(hx - 16, hy + 75, hx - 47, hy + 82, hx - 72, hy + 77);
        ctx.bezierCurveTo(hx - 74, hy + 72, hx - 65, hy + 67, hx - 47, hy + 65);
        ctx.bezierCurveTo(hx - 25, hy + 64, hx - 3, hy + 64, hx + 4, hy + 67);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#8e1a09';
        ctx.beginPath();
        ctx.moveTo(hx - 10, hy + 73);
        ctx.quadraticCurveTo(hx - 27, hy + 88, hx - 48, hy + 81);
        ctx.quadraticCurveTo(hx - 30, hy + 72, hx - 10, hy + 73);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f5f0e0';
        for (let f = 0; f < 5; f++) {
            const fx = hx - 2 - f * 15, fy = hy + 66;
            ctx.beginPath();
            ctx.moveTo(fx, fy); ctx.bezierCurveTo(fx - 3, fy + 7, fx - 1, fy + 15, fx + 3, fy + 14);
            ctx.bezierCurveTo(fx + 7, fy + 13, fx + 7, fy + 5, fx + 5, fy);
            ctx.closePath(); ctx.fill();
        }
        for (let f = 0; f < 4; f++) {
            const fx = hx - 12 - f * 14, fy = hy + 81;
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.bezierCurveTo(fx - 2, fy - 6, fx + 1, fy - 12, fx + 5, fy - 12);
            ctx.bezierCurveTo(fx + 8, fy - 11, fx + 8, fy - 5, fx + 6, fy);
            ctx.closePath();
            ctx.fill();
        }
    } else {
        // Angry snarl — mouth slightly open, teeth showing
        ctx.fillStyle = '#0e0000';
        ctx.beginPath();
        ctx.moveTo(hx + 4, hy + 68);
        ctx.bezierCurveTo(hx - 17, hy + 74, hx - 48, hy + 78, hx - 72, hy + 74);
        ctx.bezierCurveTo(hx - 74, hy + 69, hx - 64, hy + 65, hx - 47, hy + 64);
        ctx.bezierCurveTo(hx - 27, hy + 63, hx - 3, hy + 63, hx + 4, hy + 68);
        ctx.closePath(); ctx.fill();
        // Snarl teeth
        ctx.fillStyle = '#f0ece0';
        for (let f = 0; f < 4; f++) {
            const fx = hx - 3 - f * 16, fy = hy + 67;
            ctx.beginPath();
            ctx.moveTo(fx, fy); ctx.bezierCurveTo(fx - 2, fy + 5, fx - 1, fy + 10, fx + 3, fy + 10);
            ctx.bezierCurveTo(fx + 7, fy + 10, fx + 7, fy + 5, fx + 5, fy);
            ctx.closePath(); ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(hx - 70, hy + 70);
        ctx.bezierCurveTo(hx - 76, hy + 78, hx - 75, hy + 86, hx - 67, hy + 85);
        ctx.bezierCurveTo(hx - 61, hy + 84, hx - 60, hy + 77, hx - 63, hy + 71);
        ctx.closePath();
        ctx.fill();
        // Lip line
        ctx.strokeStyle = '#7a1b05'; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(hx + 4, hy + 68);
        ctx.bezierCurveTo(hx - 24, hy + 71, hx - 54, hy + 72, hx - 72, hy + 68);
        ctx.stroke();
    }

    // ── RIGHT WING (front) ────────────────────────────────────────────
    const rwX = x + 122, rwY = y + 108 + bo;
    const rwG = ctx.createLinearGradient(rwX, rwY - 20, rwX + 188, rwY + 105);
    rwG.addColorStop(0, '#d64e10'); rwG.addColorStop(0.35, '#4a1208'); rwG.addColorStop(1, '#050402');
    ctx.fillStyle = rwG;
    ctx.beginPath();
    ctx.moveTo(rwX, rwY - 22);
    ctx.bezierCurveTo(rwX + 52, rwY - 68 - wf * 0.6, rwX + 128, rwY - 84 - wf, rwX + 178, rwY - 48 - wf);
    ctx.bezierCurveTo(rwX + 198, rwY - 4 - wf * 0.5, rwX + 188, rwY + 60, rwX + 150, rwY + 128);
    ctx.bezierCurveTo(rwX + 96, rwY + 186, rwX + 34, rwY + 174, rwX, rwY + 142);
    ctx.closePath(); ctx.fill();
    // Right wing shimmer
    const rwHL = ctx.createRadialGradient(rwX + 88, rwY + 52, 5, rwX + 88, rwY + 52, 88);
    rwHL.addColorStop(0, 'rgba(255,110,30,0.26)'); rwHL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rwHL;
    ctx.beginPath();
    ctx.moveTo(rwX, rwY - 22);
    ctx.bezierCurveTo(rwX + 52, rwY - 68 - wf * 0.6, rwX + 128, rwY - 84 - wf, rwX + 178, rwY - 48 - wf);
    ctx.bezierCurveTo(rwX + 198, rwY - 4 - wf * 0.5, rwX + 188, rwY + 60, rwX + 150, rwY + 128);
    ctx.bezierCurveTo(rwX + 96, rwY + 186, rwX + 34, rwY + 174, rwX, rwY + 142);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#120b07'; ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(rwX, rwY);
    ctx.bezierCurveTo(rwX + 58, rwY - 32 - wf * 0.45, rwX + 128, rwY - 45 - wf, rwX + 178, rwY - 46 - wf);
    ctx.stroke();
    for (let f = 0; f < 3; f++) {
        ctx.lineWidth = 2.8 - f * 0.5;
        const bx = rwX + 62 + f * 28, by = rwY - 24 - wf * 0.3;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 26, by + 52 + f * 18, rwX + 98 + f * 22, rwY + 82 + f * 26);
        ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,140,40,0.35)'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(rwX, rwY - 22);
    ctx.bezierCurveTo(rwX + 52, rwY - 68 - wf * 0.6, rwX + 128, rwY - 84 - wf, rwX + 178, rwY - 48 - wf);
    ctx.stroke();

    // ── GIGANTAMAX FIRE RING ──────────────────────────────────────────
    ctx.shadowColor = '#ff5500'; ctx.shadowBlur = 30;
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + frame * 0.055;
        const rX = x + 115 + Math.cos(angle) * 96;
        const rY = y + 178 + bo + Math.sin(angle) * 58;
        const fSize = 10 + Math.sin(ft + i * 0.55) * 6;
        const rfG = ctx.createRadialGradient(rX, rY - fSize * 0.4, 0, rX, rY, fSize * 1.5);
        rfG.addColorStop(0, '#ffee44'); rfG.addColorStop(0.4, '#ff6600'); rfG.addColorStop(1, 'rgba(255,30,0,0)');
        ctx.fillStyle = rfG;
        ctx.beginPath();
        ctx.moveTo(rX - fSize * 0.7, rY + fSize * 0.2);
        ctx.quadraticCurveTo(rX + Math.sin(ft + i) * fSize * 0.4, rY - fSize * 2, rX + fSize * 0.7, rY + fSize * 0.2);
        ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── HP BAR & LABEL ────────────────────────────────────────────────
    if (ch.hp < 8) {
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 18, y - 58 + bo, 168, 12);
        const hpFrac = ch.hp / 8;
        ctx.fillStyle = hpFrac > 0.5 ? '#44ff44' : hpFrac > 0.25 ? '#ffaa00' : '#ff3333';
        ctx.fillRect(x + 19, y - 57 + bo, Math.floor(166 * hpFrac), 10);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 18, y - 58 + bo, 168, 12);
    }
    if (frame % 120 < 85) {
        ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffaa33'; ctx.font = 'bold 14px Courier New';
        ctx.fillText('G-MAX CHARIZARD', x + 20, y - 66 + bo);
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// Draw Gyarados with a broader maw, pale fins, and plated underbelly
function drawGyarados(gyr) {
    const frame = gyr.frame;
    const hx = gyr.x;
    const hy = gyr.y;
    const bodyWave = Math.sin(frame * 0.09) * 5;

    ctx.save();

    for (let i = 0; i < 10; i++) {
        const segY = hy + 72 + i * 28;
        if (segY > groundY + 70) break;

        const sway = Math.sin(frame * 0.11 + i * 0.72) * (10 + i * 0.9);
        const segX = hx + sway + bodyWave * 0.35 - i * 0.4;
        const segW = Math.max(28, 74 - i * 4.4);
        const segH = Math.max(18, 34 - i * 1.1);
        const rot = -0.08 + Math.sin(frame * 0.05 + i * 0.4) * 0.05;

        ctx.save();
        ctx.translate(segX, segY);
        ctx.rotate(rot);

        const bodyG = ctx.createLinearGradient(-segW * 0.55, -segH, segW * 0.55, segH);
        bodyG.addColorStop(0, '#2f84ff');
        bodyG.addColorStop(0.5, '#1656c7');
        bodyG.addColorStop(1, '#0a2f82');
        ctx.fillStyle = bodyG;
        ctx.beginPath();
        ctx.ellipse(0, 0, segW * 0.52, segH, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f5d08c';
        ctx.beginPath();
        ctx.ellipse(-segW * 0.03, segH * 0.22, segW * 0.28, segH * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.ellipse(-segW * 0.16, -segH * 0.18, segW * 0.18, segH * 0.2, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f4d24e';
        ctx.beginPath();
        ctx.ellipse(-segW * 0.34, 0, segW * 0.08, segH * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(segW * 0.34, 0, segW * 0.08, segH * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (i < 6) {
            ctx.fillStyle = '#f4f4ee';
            ctx.beginPath();
            ctx.moveTo(-5, -segH * 0.58);
            ctx.lineTo(2, -segH * 1.3);
            ctx.lineTo(10, -segH * 0.56);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#9ea8c7';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(2, -segH * 1.18);
            ctx.lineTo(2, -segH * 0.62);
            ctx.stroke();
        }

        ctx.restore();
    }

    const neckG = ctx.createLinearGradient(hx - 42, hy + 48, hx + 30, hy + 118);
    neckG.addColorStop(0, '#2c80f4');
    neckG.addColorStop(0.55, '#1454bd');
    neckG.addColorStop(1, '#0a2d7b');
    ctx.fillStyle = neckG;
    ctx.beginPath();
    ctx.moveTo(hx - 28, hy + 106);
    ctx.quadraticCurveTo(hx - 40, hy + 88, hx - 26, hy + 58);
    ctx.quadraticCurveTo(hx - 5, hy + 30, hx + 25, hy + 44);
    ctx.quadraticCurveTo(hx + 32, hy + 82, hx + 12, hy + 111);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f5d08c';
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy + 102);
    ctx.quadraticCurveTo(hx - 19, hy + 70, hx - 4, hy + 50);
    ctx.quadraticCurveTo(hx + 6, hy + 44, hx + 12, hy + 52);
    ctx.quadraticCurveTo(hx + 12, hy + 83, hx + 4, hy + 104);
    ctx.closePath();
    ctx.fill();

    const headG = ctx.createLinearGradient(hx - 86, hy - 2, hx + 38, hy + 78);
    headG.addColorStop(0, '#2d88ff');
    headG.addColorStop(0.45, '#165ed2');
    headG.addColorStop(1, '#082d79');
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.moveTo(hx - 70, hy + 48);
    ctx.quadraticCurveTo(hx - 98, hy + 27, hx - 84, hy + 7);
    ctx.quadraticCurveTo(hx - 54, hy - 20, hx - 7, hy - 8);
    ctx.quadraticCurveTo(hx + 36, hy + 3, hx + 42, hy + 31);
    ctx.quadraticCurveTo(hx + 32, hy + 63, hx - 8, hy + 70);
    ctx.quadraticCurveTo(hx - 49, hy + 76, hx - 70, hy + 48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#103a95';
    ctx.beginPath();
    ctx.moveTo(hx - 86, hy + 34);
    ctx.quadraticCurveTo(hx - 112, hy + 41, hx - 104, hy + 56);
    ctx.quadraticCurveTo(hx - 84, hy + 68, hx - 51, hy + 59);
    ctx.quadraticCurveTo(hx - 46, hy + 39, hx - 63, hy + 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f2c36e';
    ctx.beginPath();
    ctx.moveTo(hx - 82, hy + 38);
    ctx.quadraticCurveTo(hx - 61, hy + 55, hx - 28, hy + 58);
    ctx.quadraticCurveTo(hx - 3, hy + 58, hx + 18, hy + 45);
    ctx.quadraticCurveTo(hx + 13, hy + 59, hx - 15, hy + 67);
    ctx.quadraticCurveTo(hx - 51, hy + 75, hx - 78, hy + 58);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8f8f2';
    ctx.beginPath();
    ctx.moveTo(hx - 10, hy - 4);
    ctx.lineTo(hx - 1, hy - 58);
    ctx.lineTo(hx + 9, hy - 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 10, hy + 3);
    ctx.lineTo(hx + 24, hy - 44);
    ctx.lineTo(hx + 30, hy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 28, hy + 14);
    ctx.lineTo(hx + 43, hy - 20);
    ctx.lineTo(hx + 46, hy + 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8f8f2';
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy + 17);
    ctx.lineTo(hx - 36, hy + 30);
    ctx.lineTo(hx - 7, hy + 37);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 30, hy + 18);
    ctx.lineTo(hx + 54, hy + 31);
    ctx.lineTo(hx + 25, hy + 39);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = '#ff5a3d';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#f6451f';
    ctx.beginPath();
    ctx.ellipse(hx - 16, hy + 20, 8, 10, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + 18, hy + 18, 8, 10, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#120200';
    ctx.beginPath();
    ctx.ellipse(hx - 17, hy + 21, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + 19, hy + 19, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f5d43d';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 60, hy + 40);
    ctx.quadraticCurveTo(hx - 98, hy + 36 + bodyWave, hx - 115, hy + 58);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx + 40, hy + 36);
    ctx.quadraticCurveTo(hx + 78, hy + 33 - bodyWave, hx + 97, hy + 56);
    ctx.stroke();

    if (gyr.phase === 'attacking') {
        ctx.fillStyle = '#16090d';
        ctx.beginPath();
        ctx.moveTo(hx - 92, hy + 41);
        ctx.quadraticCurveTo(hx - 70, hy + 53, hx - 31, hy + 47);
        ctx.quadraticCurveTo(hx - 72, hy + 70, hx - 98, hy + 55);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#efe7c8';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const toothX = hx - 82 + i * 13;
            ctx.beginPath();
            ctx.moveTo(toothX, hy + 43);
            ctx.lineTo(toothX + 4, hy + 51);
            ctx.stroke();
        }
        for (let i = 0; i < 3; i++) {
            const toothX = hx - 78 + i * 14;
            ctx.beginPath();
            ctx.moveTo(toothX, hy + 57);
            ctx.lineTo(toothX + 4, hy + 50);
            ctx.stroke();
        }

        ctx.shadowColor = '#d7f1ff';
        ctx.shadowBlur = 30;
        const beamCharge = ctx.createLinearGradient(hx - 96, hy + 38, hx - 24, hy + 52);
        beamCharge.addColorStop(0, '#ffffff');
        beamCharge.addColorStop(0.45, '#b6e6ff');
        beamCharge.addColorStop(1, '#6d9fff');
        ctx.fillStyle = beamCharge;
        ctx.beginPath();
        ctx.ellipse(hx - 63, hy + 47, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#d6e7ff';
        ctx.font = 'bold 15px Courier New';
        ctx.shadowColor = '#3d6fff';
        ctx.shadowBlur = 10;
        ctx.fillText('HYPER BEAM!', hx - 63, hy - 48);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = '#17090d';
        ctx.beginPath();
        ctx.moveTo(hx - 89, hy + 42);
        ctx.quadraticCurveTo(hx - 69, hy + 49, hx - 42, hy + 46);
        ctx.quadraticCurveTo(hx - 68, hy + 57, hx - 90, hy + 50);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

// Draw hyper beam (wide horizontal laser)
function drawHyperBeam(beam) {
    const alpha = Math.min(1, beam.duration / 15);
    ctx.shadowColor = '#aaccff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = `rgba(80, 130, 255, ${alpha * 0.6})`;
    ctx.fillRect(beam.x, beam.y - 22, beam.width, 44);
    ctx.fillStyle = `rgba(170, 200, 255, ${alpha * 0.85})`;
    ctx.fillRect(beam.x, beam.y - 11, beam.width, 22);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(beam.x, beam.y - 4, beam.width, 8);
    ctx.shadowBlur = 0;
    // Edge glow
    ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.5})`;
    ctx.fillRect(beam.x, beam.y - 35, beam.width, 12);
    ctx.fillRect(beam.x, beam.y + 22, beam.width, 12);
}

// Dust particles drifting out of burrow trenches
function updateEmbers() {
    for (const pit of lavaPits) {
        if (pit.x > -10 && pit.x < canvas.width && Math.random() < 0.35) {
            const maxLife = 50 + Math.random() * 40;
            embers.push({
                x: pit.x + Math.random() * pit.width,
                y: groundY + 14,
                vx: -0.8 + Math.random() * 1.6,
                vy: -(0.8 + Math.random() * 1.8),
                life: maxLife,
                maxLife: maxLife,
                size: 1.5 + Math.random() * 2.5
            });
        }
    }
    for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx;
        e.y += e.vy;
        e.vy *= 0.98;
        e.vx *= 0.97;
        e.life--;
        if (e.life <= 0) { embers.splice(i, 1); continue; }
        const alpha = e.life / e.maxLife;
        const eG = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 1.4);
        eG.addColorStop(0, `rgba(231,205,152,${alpha})`);
        eG.addColorStop(0.55, `rgba(171,123,67,${alpha * 0.72})`);
        eG.addColorStop(1, 'rgba(95,61,29,0)');
        ctx.fillStyle = eG;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 1.4, 0, Math.PI * 2); ctx.fill();
    }
    if (embers.length > 250) embers.splice(0, embers.length - 250);
}

function spawnHulk() {
    if (hulks.length >= 2) return; // Max 2 hulks at once

    const hulk = {
        x: canvas.width + 60,
        y: groundY - 126, // Hulk is 126px tall
        width: 75,
        height: 126,
        frame: Math.random() * 100,
        velocityX: -(1.5 + Math.random() * 1.5),
        velocityY: 0,
        jumping: false,
        jumpTimer: 60 + Math.random() * 120,
        smashTimer: 0,
        smashCooldown: 0,
        hp: 6,
        invulnerableTimer: 120, // 2 seconds at 60fps
        lifespan: 600, // 10 seconds at 60fps
        facingLeft: true
    };
    hulks.push(hulk);
}

function spawnGigantamaxCharizard() {
    if (charizards.length >= 1) return;
    charizards.push({
        x: canvas.width + 20,       // slides in from right
        y: 20,                       // hovers near top
        width: 200,
        height: 330,
        frame: 0,
        lifespan: 660,               // 11 seconds at 60fps
        fireballTimer: 90,
        attackTimer: 0,
        hp: 8,
        facingLeft: true
    });
}

function spawnGyarados() {
    if (gyaradosList.length >= 1) return;
    // Spawn from somewhere in right half of screen
    const spawnX = canvas.width * 0.45 + Math.random() * (canvas.width * 0.35);
    gyaradosList.push({
        x: spawnX,
        y: groundY + 10,            // starts at ground level (body below)
        velocityY: -9,
        width: 80,
        height: 300,
        frame: 0,
        phase: 'rising',
        attackTimer: 0,
        beamFired: false
    });
}

// Player (Zombie)
const player = {
    x: 150,
    y: groundY - 54,
    width: 30,
    height: 54,
    baseWidth: 30,
    baseHeight: 54,
    burrowHeight: 18,
    velocityY: 0,
    jumping: false,
    jumpCount: 0,
    maxJumps: 2,
    frame: 0,
    digDepth: 0,
    underground: false
};

// Skeleton (chaser) with dynamic movement
const skeleton = {
    x: 30,
    y: groundY - 54,
    baseX: 30,
    baseY: groundY - 54,
    width: 36,
    height: 54,
    frame: 0,
    velocityY: 0,
    jumping: false,
    lungeTimer: 0,
    lungeSpeed: 0,
    bobPhase: 0,
    strafeDir: 1
};

// Obstacles and lava pits
let obstacles = [];
let lavaPits = [];
let enemySkeletons = [];

function spawnObstacle() {
    const types = ['stone', 'cobblestone', 'obsidian'];
    const type = types[Math.floor(Math.random() * types.length)];
    const stackHeight = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < stackHeight; i++) {
        obstacles.push({
            x: canvas.width + 50,
            y: groundY - 40 * (i + 1),
            width: 40,
            height: 40,
            type: type
        });
    }
}

function spawnLavaPit() {
    const width = 60 + Math.random() * 60;
    lavaPits.push({
        x: canvas.width + 50,
        width: width,
        hasGap: true
    });
}

function spawnCoin() {
    // Spawn coins at different heights - some in the air for jumping
    const heights = [
        groundY - 80,   // Low (easy)
        groundY - 130,  // Medium (need to jump)
        groundY - 180,  // High (need good timing)
        groundY - 220   // Very high (double jump)
    ];
    const y = heights[Math.floor(Math.random() * heights.length)];

    coinArray.push({
        x: canvas.width + 50,
        y: y,
        width: 24,
        height: 24,
        collected: false
    });
}

function spawnEnemySkeleton() {
    // Only spawn if we have less than 5 enemy skeletons on screen
    if (enemySkeletons.length >= 5) return;

    const enemySkeleton = {
        x: canvas.width + 50 + Math.random() * 100,
        y: groundY - 54,
        baseY: groundY - 54,
        width: 30,
        height: 54,
        frame: Math.random() * 100,
        velocityX: -(2 + Math.random() * 3), // Moving left (towards player)
        velocityY: 0,
        jumping: false,
        jumpTimer: Math.random() * 60,
        directionTimer: 60 + Math.random() * 120,
        behavior: Math.random() < 0.5 ? 'runner' : 'jumper'
    };
    enemySkeletons.push(enemySkeleton);
}

function spawnShip() {
    // Only spawn if no ship exists and not currently in a ship
    if (ship || inShip) return;

    ship = {
        x: canvas.width + 50,
        y: groundY - 150 - Math.random() * 100,
        width: 70,
        height: 50,
        frame: 0
    };
}

// Ground blocks
function drawGround(frame) {
    // Smooth gradient ground strip
    const gG = ctx.createLinearGradient(0, groundY, 0, groundY + 80);
    gG.addColorStop(0, '#5ca832');
    gG.addColorStop(0.09, '#4a8c28');
    gG.addColorStop(0.13, '#8c5a28');
    gG.addColorStop(0.5, '#6a3e18');
    gG.addColorStop(1, '#3c200a');
    ctx.fillStyle = gG;

    // Draw ground avoiding lava pits
    let prevX = 0;
    const sortedPits = [...lavaPits].sort((a, b) => a.x - b.x);
    for (const pit of sortedPits) {
        if (pit.x > prevX) {
            ctx.fillRect(prevX, groundY, pit.x - prevX, canvas.height - groundY);
        }
        prevX = pit.x + pit.width;
    }
    if (prevX < canvas.width) {
        ctx.fillRect(prevX, groundY, canvas.width - prevX, canvas.height - groundY);
    }

    // Grass surface highlight
    ctx.strokeStyle = 'rgba(130,230,75,0.32)';
    ctx.lineWidth = 2;
    prevX = 0;
    ctx.beginPath();
    for (const pit of sortedPits) {
        if (pit.x > prevX) {
            ctx.moveTo(prevX, groundY + 1);
            ctx.lineTo(pit.x, groundY + 1);
        }
        prevX = pit.x + pit.width;
    }
    if (prevX < canvas.width) {
        ctx.moveTo(prevX, groundY + 1);
        ctx.lineTo(canvas.width, groundY + 1);
    }
    if (sortedPits.length === 0) {
        ctx.moveTo(0, groundY + 1);
        ctx.lineTo(canvas.width, groundY + 1);
    }
    ctx.stroke();

    // Depth lines in dirt
    ctx.lineWidth = 1;
    for (let d = 1; d <= 3; d++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.10 + d * 0.05})`;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 12 * d);
        ctx.lineTo(canvas.width, groundY + 12 * d);
        ctx.stroke();
    }
}

// Background - parallax multi-layer with smooth mountains
function drawBackground() {
    // Deep dark gradient sky
    const skyG = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyG.addColorStop(0, '#080306');
    skyG.addColorStop(0.3, '#170a0e');
    skyG.addColorStop(0.65, '#280f0a');
    skyG.addColorStop(1, '#3c1808');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Distant ember stars
    for (let i = 0; i < 45; i++) {
        const sx = ((i * 193 + bgOff1 * 0.2) % (canvas.width + 10)) - 5;
        const sy = (i * 71) % (groundY * 0.65);
        const sr = 0.5 + (i % 3) * 0.4;
        const alpha = Math.max(0.05, 0.3 + Math.sin(frameCount * 0.04 + i * 1.3) * 0.25);
        ctx.fillStyle = `rgba(255,185,75,${alpha})`;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }

    // Far mountain silhouette (slow parallax)
    ctx.fillStyle = 'rgba(55, 16, 10, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-5, groundY);
    for (let px = 0; px <= canvas.width + 5; px += 2) {
        const my = groundY - 70
            - Math.sin((px + bgOff1 * 0.35) * 0.012) * 55
            - Math.sin((px + bgOff1 * 0.35) * 0.025) * 30;
        ctx.lineTo(px, my);
    }
    ctx.lineTo(canvas.width + 5, groundY);
    ctx.closePath(); ctx.fill();

    // Near hill silhouette (faster parallax)
    ctx.fillStyle = 'rgba(78, 22, 8, 0.78)';
    ctx.beginPath();
    ctx.moveTo(-5, groundY);
    for (let px = 0; px <= canvas.width + 5; px += 2) {
        const hy = groundY - 36
            - Math.sin((px + bgOff2 * 0.65) * 0.018) * 26
            - Math.sin((px + bgOff2 * 0.65) * 0.037) * 12;
        ctx.lineTo(px, hy);
    }
    ctx.lineTo(canvas.width + 5, groundY);
    ctx.closePath(); ctx.fill();

    // Horizon lava glow
    const hG = ctx.createLinearGradient(0, groundY - 50, 0, groundY);
    hG.addColorStop(0, 'rgba(220,55,0,0)');
    hG.addColorStop(0.6, 'rgba(220,55,0,0.07)');
    hG.addColorStop(1, 'rgba(255,80,0,0.22)');
    ctx.fillStyle = hG;
    ctx.fillRect(0, groundY - 50, canvas.width, 50);
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function playerIsUnderground() {
    return !inShip && player.underground;
}

function playerIsBurrowing() {
    return !inShip && (player.underground || player.digDepth > 0.08 || keys.dig);
}

function checkPitCollision() {
    return false;
}

function checkSkeletonCatch() {
    if (playerIsUnderground()) return false;
    return skeleton.x + skeleton.width >= player.x;
}

// Jump
function jump() {
    if (player.jumpCount < player.maxJumps && !playerIsUnderground() && player.digDepth < 0.15) {
        player.velocityY = -15;
        player.jumping = true;
        player.jumpCount++;
    }
}

function drawBurrowingPlayer(playerObj) {
    const sink = playerObj.digDepth * 30;
    const exposed = Math.max(0.08, 1 - playerObj.digDepth);
    const drawY = groundY - playerObj.baseHeight + sink;

    ctx.save();
    ctx.beginPath();
    ctx.rect(playerObj.x - 10, groundY - playerObj.baseHeight * exposed - 12, playerObj.baseWidth + 24, canvas.height);
    ctx.clip();
    drawZombie(playerObj.x, drawY, playerObj.frame);
    ctx.restore();

    const moundX = playerObj.x + playerObj.baseWidth * 0.5;
    const moundY = groundY + 4;
    const moundW = 18 + playerObj.digDepth * 22;
    const moundH = 8 + playerObj.digDepth * 10;
    const moundG = ctx.createLinearGradient(moundX, moundY - moundH, moundX, moundY + moundH);
    moundG.addColorStop(0, '#b58346');
    moundG.addColorStop(0.45, '#7d542a');
    moundG.addColorStop(1, '#4c2f15');
    ctx.fillStyle = moundG;
    ctx.beginPath();
    ctx.ellipse(moundX, moundY, moundW, moundH, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,232,180,0.18)';
    ctx.beginPath();
    ctx.ellipse(moundX - 5, moundY - 2, moundW * 0.52, moundH * 0.45, -0.2, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    if (playerObj.digDepth > 0.55) {
        ctx.fillStyle = '#e9ddbf';
        ctx.beginPath();
        ctx.ellipse(playerObj.x + 23, groundY - 4, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a2412';
        ctx.fillRect(playerObj.x + 21, groundY - 5, 1, 1);
        ctx.fillRect(playerObj.x + 24, groundY - 5, 1, 1);
    }
}

// Game loop
let lastSpawnTime = 0;
let lastCoinSpawnTime = 0;
let lastEnemySkeletonSpawnTime = 0;
let lastShipSpawnTime = 0;
let frameCount = 0;

function gameLoop(timestamp) {
    if (!gameRunning) return;

    if (gamePaused) {
        // Draw pause overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '18px Courier New';
        ctx.fillText('Press P or ESC to resume', canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = 'left';
        requestAnimationFrame(gameLoop);
        return;
    }

    frameCount++;

    // Screen shake
    ctx.save();
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeIntensity;
        const shakeY = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.translate(shakeX, shakeY);
        screenShake--;
        screenShakeIntensity *= 0.9;
    }

    // Advance parallax offsets
    bgOff1 += gameSpeed * 0.3;
    bgOff2 += gameSpeed * 0.7;

    // Clear and draw background
    drawBackground();

    // Keep scroll speed fixed instead of ramping with score.
    gameSpeed = 5;

    // Spawn obstacles
    if (timestamp - lastSpawnTime > 1500 - Math.min(score, 800)) {
        if (Math.random() < 0.6) {
            spawnObstacle();
        } else {
            spawnLavaPit();
        }
        lastSpawnTime = timestamp;
    }

    // Spawn coins more frequently
    if (timestamp - lastCoinSpawnTime > 800) {
        spawnCoin();
        lastCoinSpawnTime = timestamp;
    }

    // Spawn enemy skeletons
    if (timestamp - lastEnemySkeletonSpawnTime > 2000 && enemySkeletons.length < 5) {
        spawnEnemySkeleton();
        lastEnemySkeletonSpawnTime = timestamp;
    }

    // Spawn ship occasionally (first one at 5 seconds, then every 15-25 seconds)
    const shipSpawnDelay = lastShipSpawnTime === 0 ? 5000 : 15000 + Math.random() * 10000;
    if (timestamp - lastShipSpawnTime > shipSpawnDelay && !ship && !inShip) {
        spawnShip();
        lastShipSpawnTime = timestamp;
    }

    // Spawn Hulk (only after score 1000, every 12-20 seconds)
    if (score > 1000 && timestamp - lastHulkSpawnTime > 12000 + Math.random() * 8000 && hulks.length < 2) {
        spawnHulk();
        lastHulkSpawnTime = timestamp;
    }

    // Spawn Gigantamax Charizard (after score 1500, every 18-30 seconds)
    if (score > 1500 && timestamp - lastCharizardSpawnTime > 18000 + Math.random() * 12000 && charizards.length < 1) {
        spawnGigantamaxCharizard();
        lastCharizardSpawnTime = timestamp;
    }

    // Spawn Gyarados (after score 2000, every 20-35 seconds)
    if (score > 2000 && timestamp - lastGyaradosSpawnTime > 20000 + Math.random() * 15000 && gyaradosList.length < 1) {
        spawnGyarados();
        lastGyaradosSpawnTime = timestamp;
    }

    // Update and draw burrow trenches
    for (let i = lavaPits.length - 1; i >= 0; i--) {
        lavaPits[i].x -= gameSpeed;
        drawBurrowPit(lavaPits[i].x, lavaPits[i].width, frameCount);

        if (lavaPits[i].x + lavaPits[i].width < 0) {
            lavaPits.splice(i, 1);
        }
    }

    // Update and draw fireballs
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fb = fireballs[i];
        fb.frame++;
        fb.velocityY += 0.3; // Gravity (slower than player)
        fb.x += fb.velocityX;
        fb.y += fb.velocityY;
        drawFireball(fb);

        // Remove if off screen or below ground
        if (fb.y > groundY + 40 || fb.x < -20 || fb.x > canvas.width + 20) {
            fireballs.splice(i, 1);
            continue;
        }

        // Fireball hits player
        if (!inShip && !playerIsUnderground() && checkCollision(fb, player)) {
            playerHealth -= 10;
            damageFlash = 15;
            fireballs.splice(i, 1);
            if (playerHealth <= 0) {
                endGame();
                return;
            }
            continue;
        }

        // Fireball hits ship (less damage)
        if (inShip && checkCollision(fb, player)) {
            shipFuel -= 8;
            fireballs.splice(i, 1);
        }
    }

    // Draw ground
    drawGround(frameCount);

    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        drawBlock(obstacles[i].x, obstacles[i].y, obstacles[i].type);

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    // Update and draw coins
    for (let i = coinArray.length - 1; i >= 0; i--) {
        coinArray[i].x -= gameSpeed;
        drawCoin(coinArray[i].x, coinArray[i].y, frameCount);

        // Check coin collection
        if (checkCollision(player, coinArray[i])) {
            coins += 1;
            score += 50;
            document.getElementById('coins').textContent = coins;
            coinArray.splice(i, 1);
            continue;
        }

        if (coinArray[i].x + coinArray[i].width < 0) {
            coinArray.splice(i, 1);
        }
    }

    // Update and draw ship (if exists and not in ship)
    if (ship && !inShip) {
        ship.x -= gameSpeed * 0.5;
        ship.frame++;
        drawPickupShip(ship.x, ship.y, ship.frame);

        // Check if player can enter ship
        const shipHitbox = { x: ship.x, y: ship.y, width: ship.width, height: ship.height };
        if (checkCollision(player, shipHitbox)) {
            // Show enter prompt is handled in drawPickupShip
        }

        // Remove ship if off screen
        if (ship.x + ship.width < -50) {
            ship = null;
        }
    }

    // Update and draw enemy skeletons
    for (let i = enemySkeletons.length - 1; i >= 0; i--) {
        const enemy = enemySkeletons[i];
        enemy.frame++;

        // Update direction timer
        enemy.directionTimer--;
        if (enemy.directionTimer <= 0) {
            // Change behavior randomly
            if (Math.random() < 0.4) {
                // Reverse direction briefly
                enemy.velocityX = -enemy.velocityX * 0.5;
            } else {
                // Speed up or slow down
                enemy.velocityX = -(2 + Math.random() * 4);
            }
            enemy.directionTimer = 40 + Math.random() * 80;
        }

        // Jumping behavior
        enemy.jumpTimer--;
        if (enemy.jumpTimer <= 0 && !enemy.jumping) {
            if (enemy.behavior === 'jumper' || Math.random() < 0.3) {
                enemy.velocityY = -10 - Math.random() * 6;
                enemy.jumping = true;
            }
            enemy.jumpTimer = 30 + Math.random() * 90;
        }

        // Apply physics
        enemy.velocityY += 0.7; // Gravity
        enemy.y += enemy.velocityY;
        enemy.x += enemy.velocityX;

        // Also move with game scroll
        enemy.x -= gameSpeed * 0.3;

        // Ground collision
        if (enemy.y >= enemy.baseY) {
            enemy.y = enemy.baseY;
            enemy.velocityY = 0;
            enemy.jumping = false;
        }

        // Keep enemy in bounds (can go slightly off left, bounces on right)
        if (enemy.x > canvas.width - 50) {
            enemy.x = canvas.width - 50;
            enemy.velocityX = -Math.abs(enemy.velocityX);
        }

        // Draw enemy skeleton (facing left if moving left)
        const facingLeft = enemy.velocityX < 0;
        drawEnemySkeleton(enemy.x, enemy.y, enemy.frame, facingLeft);

        // Remove if off screen left
        if (enemy.x + enemy.width < -50) {
            enemySkeletons.splice(i, 1);
            score += 25; // Bonus for surviving past a skeleton
        }
    }

    // Update and draw Hulks
    for (let i = hulks.length - 1; i >= 0; i--) {
        const hulk = hulks[i];
        hulk.frame++;
        hulk.lifespan--;
        if (hulk.invulnerableTimer > 0) hulk.invulnerableTimer--;

        // Move toward player
        hulk.x += hulk.velocityX;
        hulk.x -= gameSpeed * 0.2;
        hulk.facingLeft = hulk.velocityX < 0;

        // Jumping behavior
        hulk.jumpTimer--;
        if (hulk.jumpTimer <= 0 && !hulk.jumping) {
            hulk.velocityY = -14;
            hulk.jumping = true;
            hulk.jumpTimer = 80 + Math.random() * 120;
        }

        // Gravity
        hulk.velocityY += 0.8;
        hulk.y += hulk.velocityY;

        // Ground collision
        if (hulk.y + hulk.height >= groundY) {
            // Ground pound shake when landing from a jump
            if (hulk.jumping && hulk.velocityY > 5) {
                screenShake = 12;
                screenShakeIntensity = 8;
            }
            hulk.y = groundY - hulk.height;
            hulk.velocityY = 0;
            hulk.jumping = false;
        }

        // Smash cooldown
        if (hulk.smashCooldown > 0) hulk.smashCooldown--;
        if (hulk.smashTimer > 0) hulk.smashTimer--;

        // Flash while spawn-invulnerable, then again before despawn.
        if ((hulk.invulnerableTimer > 0 && hulk.frame % 8 < 4) ||
            (hulk.lifespan < 120 && hulk.lifespan % 10 < 5)) {
            ctx.globalAlpha = 0.5;
        }

        // Draw hulk
        drawHulk(hulk.x, hulk.y, hulk.frame, hulk);
        ctx.globalAlpha = 1.0;

        // Timer countdown display
        const secsLeft = Math.ceil(hulk.lifespan / 60);
        if (secsLeft <= 5) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 12px Courier New';
            ctx.fillText(secsLeft + 's', hulk.x + 30, hulk.y - 5);
        }
        if (hulk.invulnerableTimer > 0) {
            ctx.fillStyle = '#aee7ff';
            ctx.font = 'bold 11px Courier New';
            ctx.fillText('IMMUNE', hulk.x + 18, hulk.y - 18);
        }

        // Remove if lifespan expired or off screen
        if (hulk.lifespan <= 0 || hulk.x + hulk.width < -80) {
            hulks.splice(i, 1);
            score += 200;
        }
    }

    // === UPDATE AND DRAW GIGANTAMAX CHARIZARD ===
    for (let i = charizards.length - 1; i >= 0; i--) {
        const ch = charizards[i];
        ch.frame++;
        ch.lifespan--;

        // Slide in from right, then prowl around dynamically
        const baseX = canvas.width - 215;
        if (ch.x > baseX + 5) {
            ch.x -= 4;
        } else {
            // Sinusoidal patrol left/right and up/down
            ch.x = baseX + Math.sin(ch.frame * 0.016) * 90;
            ch.y = 18 + Math.sin(ch.frame * 0.022) * 55;
            // Lunge toward player while attacking
            if (ch.attackTimer > 30) {
                ch.x += (player.x < ch.x ? -2 : 2);
                ch.y += (player.y < ch.y ? -1.5 : 1.5);
            }
        }

        // Fireball attack timer
        ch.fireballTimer--;
        if (ch.fireballTimer <= 0) {
            ch.attackTimer = 45;
            ch.fireballTimer = 55 + Math.floor(Math.random() * 55);

            // Fire 3 giant fireballs aimed at player
            const startX = ch.x + 55;  // from mouth area
            const startY = ch.y + 80 + Math.sin(ch.frame * 0.05) * 8;
            for (let f = 0; f < 3; f++) {
                const targetPX = player.x + player.width / 2;
                const targetPY = player.y + player.height / 2;
                const dx = targetPX - startX;
                const dy = targetPY - startY;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const speed = 5.5 + f * 0.6;
                charizardFireballs.push({
                    x: startX - f * 10,
                    y: startY + f * 18,
                    width: 40,
                    height: 40,
                    velocityX: (dx / len) * speed,
                    velocityY: (dy / len) * speed,
                    frame: f * 8
                });
            }
        }
        if (ch.attackTimer > 0) ch.attackTimer--;

        // Flash before despawn
        if (ch.lifespan < 120 && ch.lifespan % 10 < 5) ctx.globalAlpha = 0.5;
        drawGigantamaxCharizard(ch);
        ctx.globalAlpha = 1.0;

        if (ch.lifespan <= 0) {
            charizards.splice(i, 1);
            score += 300;
        }
    }

    // === UPDATE AND DRAW CHARIZARD FIREBALLS ===
    for (let i = charizardFireballs.length - 1; i >= 0; i--) {
        const fb = charizardFireballs[i];
        fb.frame++;
        fb.x += fb.velocityX;
        fb.y += fb.velocityY;
        fb.velocityY += 0.12; // slight gravity arc
        drawGiantFireball(fb);

        if (fb.x < -60 || fb.x > canvas.width + 60 || fb.y > groundY + 60) {
            charizardFireballs.splice(i, 1);
            continue;
        }
        // Hit player on foot
        if (!inShip && !playerIsUnderground() && checkCollision(fb, player)) {
            playerHealth -= 20;
            damageFlash = 20;
            screenShake = 10;
            screenShakeIntensity = 6;
            charizardFireballs.splice(i, 1);
            if (playerHealth <= 0) { endGame(); return; }
            continue;
        }
        // Hit ship
        if (inShip && checkCollision(fb, player)) {
            shipFuel -= 15;
            charizardFireballs.splice(i, 1);
        }
    }

    // === UPDATE AND DRAW GYARADOS ===
    for (let i = gyaradosList.length - 1; i >= 0; i--) {
        const gyr = gyaradosList[i];
        gyr.frame++;

        if (gyr.phase === 'rising') {
            gyr.y += gyr.velocityY;
            gyr.velocityY += 0.18; // decelerate

            // When it peaks (velocity >= 0), switch to attacking
            if (gyr.velocityY >= 0) {
                gyr.phase = 'attacking';
                gyr.attackTimer = 80;
            }
        } else if (gyr.phase === 'attacking') {
            gyr.attackTimer--;
            if (gyr.attackTimer <= 0 && !gyr.beamFired) {
                gyr.beamFired = true;
                // Fire hyper beam horizontally from mouth to left edge
                const mouthY = gyr.y + 35;
                hyperBeams.push({
                    x: 0,
                    y: mouthY,
                    width: gyr.x + 20,
                    height: 44,
                    duration: 70
                });
                screenShake = 22;
                screenShakeIntensity = 14;
            }
            if (gyr.beamFired && gyr.attackTimer <= -20) {
                gyr.phase = 'falling';
                gyr.velocityY = 4;
            }
        } else { // falling
            gyr.y += gyr.velocityY;
            gyr.velocityY += 0.35;
            if (gyr.y > groundY + 250) {
                gyaradosList.splice(i, 1);
                score += 250;
                continue;
            }
        }

        drawGyarados(gyr);

        // Body collision while rising/falling (hit the head area)
        const gyrHitbox = { x: gyr.x - 38, y: gyr.y, width: 82, height: 65 };
        if (checkCollision(gyrHitbox, player)) {
            if (!inShip && !playerIsUnderground()) {
                playerHealth -= 15;
                damageFlash = 18;
                player.velocityY = -12;
                gyaradosList.splice(i, 1);
                if (playerHealth <= 0) { endGame(); return; }
            }
        }
    }

    // === UPDATE AND DRAW HYPER BEAMS ===
    for (let i = hyperBeams.length - 1; i >= 0; i--) {
        const beam = hyperBeams[i];
        beam.duration--;
        drawHyperBeam(beam);

        // Damage player caught in beam
        const beamHitbox = { x: beam.x, y: beam.y - 22, width: beam.width, height: 44 };
        if (!inShip && !playerIsUnderground() && checkCollision(beamHitbox, player)) {
            playerHealth -= 0.9;
            damageFlash = 5;
            if (playerHealth <= 0) { endGame(); return; }
        }
        if (inShip && checkCollision(beamHitbox, player)) {
            shipFuel -= 0.6;
        }

        if (beam.duration <= 0) hyperBeams.splice(i, 1);
    }

    // Update player
    player.frame++;

    if (inShip) {
        // Flying controls
        const flySpeed = 6;
        if (keys.up && player.y > 20) player.y -= flySpeed;
        if (keys.down && player.y < groundY - 60) player.y += flySpeed;
        if (keys.left && player.x > 50) player.x -= flySpeed;
        if (keys.right && player.x < canvas.width - 100) player.x += flySpeed;

        // Consume fuel
        shipFuel -= 0.15;
        document.getElementById('fuel').textContent = Math.floor(shipFuel);

        // Exit ship if fuel runs out or press E
        if (shipFuel <= 0) {
            inShip = false;
            document.getElementById('fuelDisplay').style.display = 'none';
            player.velocityY = 0;
        }

        // === X-WING LASER FIRING ===
        if (shipLaserCooldown > 0) shipLaserCooldown--;

        if (keys.shoot && shipLaserCooldown === 0) {
            const b = Math.sin(player.frame * 0.1) * 3;
            // Cycle through the 4 X-Wing wingtip cannons.
            const cannonOffsets = [
                { x: 152, y: -18 },  // top outer
                { x: 152, y:  66 },  // bottom outer
                { x: 152, y:   4 },  // top inner
                { x: 152, y:  44 },  // bottom inner
            ];
            const cannon = cannonOffsets[shipLaserCannon % 4];
            shipLasers.push({
                x: player.x + cannon.x,
                y: player.y + cannon.y + b,
                width: 16,
                height: 3,
                speed: 18
            });
            shipLaserCannon++;
            shipLaserCooldown = shipLaserCooldownMax;
        }

        // Draw ship with player
        drawShip(player.x, player.y, player.frame, true);

        // Ship collision box
        player.width = 105;
        player.height = 88;
    } else {
        // === ROCKET BOOSTER LOGIC ===
        boosterActive = keys.shift && boosterFuel > 0 && !playerIsUnderground() && player.digDepth < 0.15;
        if (boosterActive) {
            player.velocityY -= 1.8; // Thrust upward
            if (player.velocityY < -10) player.velocityY = -10; // Cap upward speed
            boosterFuel -= 0.5;
            if (boosterFuel < 0) boosterFuel = 0;
            // Slight horizontal boost forward
            if (keys.right) player.x += 3;
            if (keys.left) player.x -= 3;
            // Keep in bounds
            if (player.y < 10) player.y = 10;
            if (player.x < 30) player.x = 30;
            if (player.x > canvas.width - 60) player.x = canvas.width - 60;
        }

        // Normal ground movement
        player.velocityY += 0.8; // Gravity
        player.y += player.velocityY;

        // Reset player size
        player.width = player.baseWidth;
        player.height = player.baseHeight;

        // Ground collision
        let onGround = false;
        let overPit = false;
        let onBlock = false;

        // Check if player can land on blocks (platforms)
        for (let obs of obstacles) {
            // Check if player is falling onto the top of a block
            if (player.velocityY > 0 && // Falling down
                player.x + player.width > obs.x + 5 && // Overlapping horizontally (with some margin)
                player.x < obs.x + obs.width - 5 &&
                player.y + player.height >= obs.y && // Feet at or below block top
                player.y + player.height <= obs.y + 20) { // But not too far into block

                player.y = obs.y - player.height;
                player.velocityY = 0;
                player.jumping = false;
                player.jumpCount = 0;
                onBlock = true;
                onGround = true;
                break;
            }
        }

        for (let pit of lavaPits) {
            if (player.x + player.width > pit.x && player.x < pit.x + pit.width) {
                overPit = true;
                break;
            }
        }

        if (!onBlock) {
            if (!overPit && player.y + player.height >= groundY) {
                player.y = groundY - player.baseHeight;
                player.velocityY = 0;
                player.jumping = false;
                player.jumpCount = 0;
                onGround = true;
            } else if (overPit && !playerIsBurrowing()) {
                const ditchFloorY = groundY + 46;
                if (player.y + player.height >= ditchFloorY) {
                    player.y = ditchFloorY - player.baseHeight;
                    player.velocityY = 0;
                    player.jumping = false;
                    player.jumpCount = 0;
                    onGround = true;
                }
            }
        }

        const canBurrow = (onGround || overPit) && !onBlock;
        const forcedBurrow = player.digDepth > 0.08 && overPit;
        const wantsDig = (keys.dig && canBurrow) || forcedBurrow;

        if (wantsDig) {
            player.digDepth = Math.min(1, player.digDepth + 0.18);
        } else {
            player.digDepth = Math.max(0, player.digDepth - 0.18);
        }
        player.underground = player.digDepth >= 0.62;

        if (player.digDepth > 0) {
            const burrowHeightDelta = player.baseHeight - player.burrowHeight;
            player.height = player.baseHeight - burrowHeightDelta * player.digDepth;
            player.y = groundY - player.baseHeight + player.digDepth * 30;
            player.velocityY = 0;
            player.jumping = false;
            player.jumpCount = 0;
        }

        // Recharge booster fuel when on ground and not boosting
        if (onGround && !boosterActive && !playerIsUnderground()) {
            boosterFuel += 0.3;
            if (boosterFuel > maxBoosterFuel) boosterFuel = maxBoosterFuel;
        }

        // Update booster UI
        document.getElementById('boosterFuel').textContent = Math.floor(boosterFuel);
        document.getElementById('boosterFuel').style.color = boosterFuel < 20 ? '#ff3333' : '#ff6600';

        // === LASER EYES LOGIC ===
        if (laserCooldown > 0) laserCooldown--;

        if (keys.shoot && laserCooldown === 0 && !playerIsUnderground()) {
            const bobOffset = Math.sin(player.frame * 0.3) * 2;
            // Fire two lasers from each eye
            lasers.push({
                x: player.x + 24,
                y: player.y + 4 + bobOffset,
                width: 20,
                height: 3,
                speed: 14
            });
            lasers.push({
                x: player.x + 24,
                y: player.y + 4 + bobOffset + 3,
                width: 20,
                height: 3,
                speed: 14
            });
            laserCooldown = laserCooldownMax;
        }

        // Update laser status UI
        document.getElementById('laserStatus').textContent = laserCooldown === 0 ? 'READY' : 'CHARGING';
        document.getElementById('laserStatus').style.color = laserCooldown === 0 ? '#ff4444' : '#884444';

        // Draw player
        if (player.digDepth > 0.02) {
            drawBurrowingPlayer(player);
        } else {
            drawZombie(player.x, player.y, player.frame);
        }
    }

    // === UPDATE AND DRAW LASERS ===
    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].x += lasers[i].speed;
        lasers[i].width += 2; // Beam extends as it travels
        drawLaser(lasers[i]);

        // Remove if off screen
        if (lasers[i].x > canvas.width + 20) {
            lasers.splice(i, 1);
            continue;
        }

        // Laser hits enemy skeletons
        for (let j = enemySkeletons.length - 1; j >= 0; j--) {
            if (checkCollision(lasers[i], enemySkeletons[j])) {
                // Destroy enemy with laser!
                enemySkeletons.splice(j, 1);
                score += 75;
                // Remove laser after hit
                lasers.splice(i, 1);
                break;
            }
        }
        if (i >= lasers.length) continue;

        // Laser hits obstacles (destroys them)
        for (let j = obstacles.length - 1; j >= 0; j--) {
            if (checkCollision(lasers[i], obstacles[j])) {
                obstacles.splice(j, 1);
                score += 15;
                lasers.splice(i, 1);
                break;
            }
        }
        if (i >= lasers.length) continue;

        // Laser hits Hulks
        for (let j = hulks.length - 1; j >= 0; j--) {
            if (checkCollision(lasers[i], hulks[j])) {
                hulks[j].x -= 8;
                lasers.splice(i, 1);
                if (hulks[j].invulnerableTimer <= 0) {
                    hulks[j].hp--;
                    score += 20;
                    if (hulks[j].hp <= 0) {
                        hulks.splice(j, 1);
                        score += 250;
                        screenShake = 14;
                        screenShakeIntensity = 9;
                    }
                } else {
                    score += 10;
                }
                break;
            }
        }
        if (i >= lasers.length) continue;

        // Laser hits Gigantamax Charizard
        for (let j = charizards.length - 1; j >= 0; j--) {
            const ch = charizards[j];
            const chHitbox = { x: ch.x + 30, y: ch.y + 80, width: 150, height: 180 };
            if (checkCollision(lasers[i], chHitbox)) {
                ch.hp--;
                ch.x += 12;
                lasers.splice(i, 1);
                score += 50;
                if (ch.hp <= 0) {
                    charizards.splice(j, 1);
                    score += 500;
                    screenShake = 20;
                    screenShakeIntensity = 14;
                }
                break;
            }
        }
        if (i >= lasers.length) continue;

        // Laser delays Gyarados hyper beam
        for (let j = gyaradosList.length - 1; j >= 0; j--) {
            const gyrHitbox = { x: gyaradosList[j].x - 38, y: gyaradosList[j].y, width: 82, height: 65 };
            if (checkCollision(lasers[i], gyrHitbox)) {
                if (gyaradosList[j].phase === 'attacking' && !gyaradosList[j].beamFired) {
                    gyaradosList[j].attackTimer += 25;
                }
                lasers.splice(i, 1);
                score += 30;
                break;
            }
        }
    }

    // === UPDATE AND DRAW X-WING LASERS ===
    for (let i = shipLasers.length - 1; i >= 0; i--) {
        shipLasers[i].x += shipLasers[i].speed;
        drawShipLaser(shipLasers[i]);

        // Remove if off screen
        if (shipLasers[i].x > canvas.width + 20) {
            shipLasers.splice(i, 1);
            continue;
        }

        // Ship laser hits enemy skeletons
        for (let j = enemySkeletons.length - 1; j >= 0; j--) {
            if (checkCollision(shipLasers[i], enemySkeletons[j])) {
                enemySkeletons.splice(j, 1);
                score += 100;
                shipLasers.splice(i, 1);
                break;
            }
        }
        if (i >= shipLasers.length) continue;

        // Ship laser hits obstacles
        for (let j = obstacles.length - 1; j >= 0; j--) {
            if (checkCollision(shipLasers[i], obstacles[j])) {
                obstacles.splice(j, 1);
                score += 20;
                shipLasers.splice(i, 1);
                break;
            }
        }
        if (i >= shipLasers.length) continue;

        // Ship laser hits Hulks
        for (let j = hulks.length - 1; j >= 0; j--) {
            if (checkCollision(shipLasers[i], hulks[j])) {
                hulks[j].x -= 12;
                shipLasers.splice(i, 1);
                if (hulks[j].invulnerableTimer <= 0) {
                    hulks[j].hp -= 2;
                    score += 30;
                    if (hulks[j].hp <= 0) {
                        hulks.splice(j, 1);
                        score += 300;
                        screenShake = 18;
                        screenShakeIntensity = 11;
                    }
                } else {
                    score += 15;
                }
                break;
            }
        }
        if (i >= shipLasers.length) continue;

        // Ship laser hits Gigantamax Charizard (double damage)
        for (let j = charizards.length - 1; j >= 0; j--) {
            const ch = charizards[j];
            const chHitbox = { x: ch.x + 30, y: ch.y + 80, width: 150, height: 180 };
            if (checkCollision(shipLasers[i], chHitbox)) {
                ch.hp -= 2;
                ch.x += 18;
                shipLasers.splice(i, 1);
                score += 100;
                if (ch.hp <= 0) {
                    charizards.splice(j, 1);
                    score += 500;
                    screenShake = 25;
                    screenShakeIntensity = 16;
                }
                break;
            }
        }
        if (i >= shipLasers.length) continue;

        // Ship laser delays Gyarados hyper beam
        for (let j = gyaradosList.length - 1; j >= 0; j--) {
            const gyrHitbox = { x: gyaradosList[j].x - 38, y: gyaradosList[j].y, width: 82, height: 65 };
            if (checkCollision(shipLasers[i], gyrHitbox)) {
                if (gyaradosList[j].phase === 'attacking' && !gyaradosList[j].beamFired) {
                    gyaradosList[j].attackTimer += 35;
                }
                shipLasers.splice(i, 1);
                score += 60;
                break;
            }
        }
    }

    // Update skeleton with dynamic movement
    skeleton.frame++;

    // Base catch-up speed
    const catchUpSpeed = 0.008;
    skeleton.x += catchUpSpeed + skeleton.lungeSpeed;

    // Random lunging behavior
    skeleton.lungeTimer--;
    if (skeleton.lungeTimer <= 0) {
        // Randomly decide to lunge or retreat
        if (Math.random() < 0.3) {
            skeleton.lungeSpeed = 2 + Math.random() * 2; // Lunge forward!
            skeleton.lungeTimer = 20 + Math.random() * 30;
        } else if (Math.random() < 0.2) {
            skeleton.lungeSpeed = -1; // Fall back slightly
            skeleton.lungeTimer = 15;
        } else {
            skeleton.lungeSpeed = 0;
            skeleton.lungeTimer = 60 + Math.random() * 120;
        }
    }

    // Decay lunge speed
    skeleton.lungeSpeed *= 0.95;

    // Keep skeleton from going too far back or catching player too fast
    if (skeleton.x < -20) skeleton.x = -20;
    if (skeleton.x > player.x - 50) skeleton.x = player.x - 50;

    // Jumping behavior - skeleton jumps randomly
    if (!skeleton.jumping && Math.random() < 0.02) {
        skeleton.velocityY = -12 - Math.random() * 5;
        skeleton.jumping = true;
    }

    // Apply gravity to skeleton
    skeleton.velocityY += 0.7;
    skeleton.y += skeleton.velocityY;

    // Ground collision for skeleton
    if (skeleton.y >= skeleton.baseY) {
        skeleton.y = skeleton.baseY;
        skeleton.velocityY = 0;
        skeleton.jumping = false;
    }

    // Bobbing/strafing movement (vertical wobble while chasing)
    skeleton.bobPhase += 0.1;
    const verticalBob = Math.sin(skeleton.bobPhase) * 3;

    // Draw skeleton at calculated position
    drawSkeleton(skeleton.x, skeleton.y + verticalBob, skeleton.frame);

    // Check collisions with obstacles (ship destroys them, player can jump on them)
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (checkCollision(player, obstacles[i])) {
            if (inShip) {
                // Destroy obstacle and lose some fuel
                obstacles.splice(i, 1);
                shipFuel -= 5;
                score += 20;
            }
            // When not in ship, blocks are platforms - no death!
        }
    }

    // Check collision with enemy skeletons
    for (let i = enemySkeletons.length - 1; i >= 0; i--) {
        if (!playerIsUnderground() && checkCollision(player, enemySkeletons[i])) {
            if (inShip) {
                // Destroy skeleton!
                enemySkeletons.splice(i, 1);
                shipFuel -= 10;
                score += 100;
            } else {
                endGame();
                return;
            }
        }
    }

    // Check collision with Hulks
    for (let i = hulks.length - 1; i >= 0; i--) {
        if (!playerIsUnderground() && checkCollision(player, hulks[i])) {
            if (inShip) {
                // HULK SMASH! Destroys the X-Wing and forces player out!
                if (hulks[i].smashCooldown <= 0) {
                    hulks[i].smashTimer = 25;
                    hulks[i].smashCooldown = 60;
                    inShip = false;
                    document.getElementById('fuelDisplay').style.display = 'none';
                    player.y = groundY - player.baseHeight;
                    player.width = player.baseWidth;
                    player.height = player.baseHeight;
                    player.velocityY = -12; // Knocked upward
                    player.digDepth = 0;
                    player.underground = false;
                    playerHealth -= 20; // 20% damage
                    damageFlash = 20;
                    screenShake = 25;
                    screenShakeIntensity = 18;
                    if (playerHealth <= 0) {
                        endGame();
                        return;
                    }
                }
            } else {
                // Hulk smash on foot - 20% damage and knockback
                if (hulks[i].smashCooldown <= 0) {
                    hulks[i].smashTimer = 25;
                    hulks[i].smashCooldown = 60;
                    playerHealth -= 20;
                    damageFlash = 20;
                    screenShake = 25;
                    screenShakeIntensity = 18;
                    player.velocityY = -14; // Knocked way up
                    player.x -= 30; // Knocked back
                    if (player.x < 40) player.x = 40;
                    if (playerHealth <= 0) {
                        endGame();
                        return;
                    }
                }
            }
        }
    }

    if (checkSkeletonCatch()) {
        endGame();
        return;
    }

    // Update health UI
    document.getElementById('healthBar').textContent = Math.max(0, Math.floor(playerHealth));
    const hpColor = playerHealth > 60 ? '#44ff44' : playerHealth > 30 ? '#ffaa00' : '#ff3333';
    document.getElementById('healthBar').style.color = hpColor;

    // Draw health bar on screen (visual bar above UI)
    const barX = canvas.width - 170;
    const barY = 12;
    const barW = 150;
    const barH = 14;
    const hpRatio = Math.max(0, playerHealth / maxPlayerHealth);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpRatio > 0.6 ? '#44ff44' : hpRatio > 0.3 ? '#ffaa00' : '#ff3333';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpRatio, barH - 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Courier New';
    ctx.fillText('HP', barX - 20, barY + 11);

    // Damage flash overlay
    if (damageFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash * 0.02})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        damageFlash--;
    }

    // Update score
    score++;
    document.getElementById('score').textContent = score;

    // Dust particles from trenches
    updateEmbers();

    ctx.restore(); // End screen shake transform

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    resetInputState();
    score = 0;
    coins = 0;
    gameSpeed = 5;
    obstacles = [];
    lavaPits = [];
    coinArray = [];
    enemySkeletons = [];
    hulks = [];
    ship = null;
    inShip = false;
    shipFuel = maxShipFuel;

    player.x = 150;
    player.y = groundY - player.baseHeight;
    player.width = player.baseWidth;
    player.height = player.baseHeight;
    player.velocityY = 0;
    player.jumping = false;
    player.jumpCount = 0;
    player.digDepth = 0;
    player.underground = false;

    // Reset health and state
    playerHealth = maxPlayerHealth;
    damageFlash = 0;
    fireballs = [];
    gamePaused = false;
    screenShake = 0;
    screenShakeIntensity = 0;

    // Reset booster and lasers
    boosterFuel = maxBoosterFuel;
    boosterActive = false;
    lasers = [];
    laserCooldown = 0;
    shipLasers = [];
    shipLaserCooldown = 0;
    shipLaserCannon = 0;

    document.getElementById('fuelDisplay').style.display = 'none';

    skeleton.x = 30;
    skeleton.y = skeleton.baseY;
    skeleton.velocityY = 0;
    skeleton.jumping = false;
    skeleton.lungeTimer = 100;
    skeleton.lungeSpeed = 0;
    skeleton.bobPhase = 0;

    document.getElementById('coins').textContent = '0';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';

    charizards = [];
    charizardFireballs = [];
    gyaradosList = [];
    hyperBeams = [];
    bgOff1 = 0;
    bgOff2 = 0;
    embers = [];

    lastEnemySkeletonSpawnTime = 0;
    lastShipSpawnTime = 0;
    lastHulkSpawnTime = 0;
    lastCharizardSpawnTime = 0;
    lastGyaradosSpawnTime = 0;
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    resetInputState();
    inShip = false;
    document.getElementById('fuelDisplay').style.display = 'none';

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('zombieRunnerHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }

    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coins;
    document.getElementById('gameOver').style.display = 'block';
}

// Event listeners
document.addEventListener('keydown', (e) => {
    // Pause toggle
    if ((e.code === 'KeyP' || e.code === 'Escape') && gameRunning) {
        e.preventDefault();
        gamePaused = !gamePaused;
        return;
    }

    if (gamePaused) return; // Ignore other keys while paused

    if (e.code === 'Space') {
        e.preventDefault();
        if (gameRunning) keys.shoot = true;
    }

    // Movement controls (arrows + WASD)
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        keys.up = true;
        if (gameRunning && !inShip) jump();  // jump when on foot
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        keys.down = true;
        if (gameRunning && !inShip) keys.dig = true;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;

    // Rocket booster
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        keys.shift = true;
    }

    // Enter/Exit ship with E
    if (e.code === 'KeyE' && gameRunning) {
        if (!inShip && ship) {
            // Check if close enough to enter
            const shipHitbox = { x: ship.x, y: ship.y, width: ship.width, height: ship.height };
            const playerHitbox = { x: player.x - 30, y: player.y - 30, width: player.width + 60, height: player.height + 60 };
            if (checkCollision(playerHitbox, shipHitbox)) {
                inShip = true;
                player.x = ship.x;
                player.y = ship.y;
                ship = null;
                shipFuel = maxShipFuel;
                document.getElementById('fuelDisplay').style.display = 'block';
                document.getElementById('fuel').textContent = shipFuel;
            }
        } else if (inShip) {
            // Exit ship
            inShip = false;
            document.getElementById('fuelDisplay').style.display = 'none';
            player.y = groundY - player.baseHeight;
            player.velocityY = 0;
            player.digDepth = 0;
            player.underground = false;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        keys.down = false;
        keys.dig = false;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
    if (e.code === 'Space') keys.shoot = false;
});

window.addEventListener('blur', resetInputState);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetInputState();
});

canvas.addEventListener('click', () => {
    if (gameRunning && !inShip && !playerIsUnderground()) {
        jump();
    }
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('musicBtn').addEventListener('click', toggleMusic);

// Initial draw
drawBackground();
drawGround(0);
drawZombie(player.x, groundY - player.baseHeight, 0);
drawSkeleton(skeleton.x, groundY - 54, 0);
