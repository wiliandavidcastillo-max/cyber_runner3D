/**
 * CYBER RUNNER 3D - TIENDA, AMBIENTES Y OBSTÁCULOS EN 3D
 */

// DEFINICIÓN DE ENTORNOS
const THEMES = {
  beach: {
    name: 'Playa Paradise',
    skyTop: '#00d2ff',
    skyBottom: '#ffb347',
    groundAlt1: '#ffe066',
    groundAlt2: '#ffd11a',
    roadAlt1: '#3a3a3a',
    roadAlt2: '#2b2b2b',
    borderAlt1: '#00f3ff',
    borderAlt2: '#ffffff'
  },
  aquatic: {
    name: 'Abismo Acuático',
    skyTop: '#000b18',
    skyBottom: '#003366',
    groundAlt1: '#001a33',
    groundAlt2: '#000f1f',
    roadAlt1: '#002244',
    roadAlt2: '#001830',
    borderAlt1: '#00ffff',
    borderAlt2: '#0088cc'
  },
  jungle: {
    name: 'Selva Tropical',
    skyTop: '#0a1f0a',
    skyBottom: '#2d5a27',
    groundAlt1: '#153315',
    groundAlt2: '#0d210d',
    roadAlt1: '#26261f',
    roadAlt2: '#1c1c17',
    borderAlt1: '#33cc33',
    borderAlt2: '#ffcc00'
  }
};

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.state = 'MENU';
    this.roadWidth = 1000;
    this.cameraDepth = 0.8;
    this.segmentLength = 100;
    this.maxSpeed = 6000;

    this.playerX = 0;
    this.position = 0;
    this.speed = 0;
    this.health = 100;
    this.nitro = 100;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;

    // Entornos y Compras
    this.currentThemeKey = 'beach';
    this.unlockedThemes = ['beach'];

    this.keys = { left: false, right: false, accelerate: false, brake: false, nitro: false };
    this.obstacles = [];
    this.coinsList = [];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.buildTrack();
    this.bindEvents();
    this.updateShopUI();
    this.gameLoop();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  buildTrack() {
    this.obstacles = [];
    this.coinsList = [];
    for (let i = 20; i < 300; i += 6) {
      if (Math.random() < 0.5) {
        this.obstacles.push({ z: i * this.segmentLength, lane: (Math.floor(Math.random() * 3) - 1) * 0.5, hit: false });
      }
      if (Math.random() < 0.4) {
        this.coinsList.push({ z: (i + 2) * this.segmentLength, lane: (Math.floor(Math.random() * 3) - 1) * 0.5, collected: false });
      }
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));

    document.getElementById('btn-play').onclick = () => this.startGame();
    document.getElementById('btn-shop').onclick = () => { this.updateShopUI(); this.showScreen('menu-shop'); };
    document.getElementById('btn-controls').onclick = () => this.showScreen('menu-controls');
    document.getElementById('btn-back-controls').onclick = () => this.showScreen('menu-main');
    document.getElementById('btn-back-shop').onclick = () => this.showScreen('menu-main');
    document.getElementById('btn-resume').onclick = () => this.resumeGame();
    document.getElementById('btn-restart-pause').onclick = () => this.startGame();
    document.getElementById('btn-quit').onclick = () => this.showScreen('menu-main');
    document.getElementById('btn-retry').onclick = () => this.startGame();
    document.getElementById('btn-main-menu-go').onclick = () => this.showScreen('menu-main');

    // Botones de compra
    document.getElementById('btn-buy-aquatic').onclick = () => this.buyTheme('aquatic', 10);
    document.getElementById('btn-buy-jungle').onclick = () => this.buyTheme('jungle', 20);

    // Selección de entornos comprados
    document.getElementById('card-beach').onclick = () => this.selectTheme('beach');
    document.getElementById('card-aquatic').onclick = () => { if(this.unlockedThemes.includes('aquatic')) this.selectTheme('aquatic'); };
    document.getElementById('card-jungle').onclick = () => { if(this.unlockedThemes.includes('jungle')) this.selectTheme('jungle'); };

    const bindTouch = (id, keyName) => {
      const btn = document.getElementById(id);
      btn.ontouchstart = (e) => { e.preventDefault(); this.keys[keyName] = true; };
      btn.ontouchend = (e) => { e.preventDefault(); this.keys[keyName] = false; };
      btn.onmousedown = () => { this.keys[keyName] = true; };
      btn.onmouseup = () => { this.keys[keyName] = false; };
    };

    bindTouch('touch-left', 'left');
    bindTouch('touch-right', 'right');
    bindTouch('touch-brake', 'brake');
    bindTouch('touch-nitro', 'nitro');
  }

  buyTheme(key, cost) {
    if (this.coins >= cost && !this.unlockedThemes.includes(key)) {
      this.coins -= cost;
      this.unlockedThemes.push(key);
      this.selectTheme(key);
    } else if (this.coins < cost) {
      alert("¡Te faltan monedas! Junta más jugando.");
    }
  }

  selectTheme(key) {
    if (this.unlockedThemes.includes(key)) {
      this.currentThemeKey = key;
      this.updateShopUI();
    }
  }

  updateShopUI() {
    document.getElementById('shop-coin-count').innerText = `🪙 ${this.coins}`;

    ['beach', 'aquatic', 'jungle'].forEach(key => {
      const card = document.getElementById(`card-${key}`);
      card.classList.remove('active');

      if (this.unlockedThemes.includes(key)) {
        const info = card.querySelector('.theme-info');
        if (key === this.currentThemeKey) {
          card.classList.add('active');
          info.innerHTML = `<h3>${THEMES[key].name}</h3><span class="badge-equipped">EN USO</span>`;
        } else {
          info.innerHTML = `<h3>${THEMES[key].name}</h3><span class="badge-equipped" style="color:#00f3ff">DISPONIBLE</span>`;
        }
      }
    });
  }

  handleKey(e, isPressed) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.keys.accelerate = isPressed; break;
      case 'KeyS': case 'ArrowDown': this.keys.brake = isPressed; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = isPressed; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = isPressed; break;
      case 'Space': this.keys.nitro = isPressed; break;
      case 'KeyP': if (isPressed && this.state === 'PLAYING') this.pauseGame(); break;
    }
  }

  showScreen(id) {
    document.querySelectorAll('.menu-screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
  }

  startGame() {
    this.playerX = 0;
    this.position = 0;
    this.speed = 0;
    this.health = 100;
    this.nitro = 100;
    this.score = 0;
    this.distance = 0;
    this.buildTrack();

    this.state = 'PLAYING';
    document.querySelectorAll('.menu-screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('player-car-wrapper').classList.remove('hidden');

    if ('ontouchstart' in window) {
      document.getElementById('mobile-controls').classList.remove('hidden');
    }
  }

  pauseGame() {
    this.state = 'PAUSED';
    this.showScreen('menu-pause');
  }

  resumeGame() {
    this.state = 'PLAYING';
    document.querySelectorAll('.menu-screen').forEach(s => s.classList.add('hidden'));
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.position += this.speed * dt;
    this.distance += (this.speed * dt) / 100;

    const dx = dt * 1.5;
    if (this.keys.left) this.playerX -= dx;
    if (this.keys.right) this.playerX += dx;
    this.playerX = Math.max(-1.2, Math.min(1.2, this.playerX));

    let maxS = this.maxSpeed;
    if (this.keys.nitro && this.nitro > 0) {
      maxS *= 1.6;
      this.nitro = Math.max(0, this.nitro - dt * 50);
      document.getElementById('player-car-wrapper').classList.add('nitro-active');
    } else {
      this.nitro = Math.min(100, this.nitro + dt * 15);
      document.getElementById('player-car-wrapper').classList.remove('nitro-active');
    }

    if (this.keys.accelerate) this.speed += 2500 * dt;
    else if (this.keys.brake) this.speed -= 5000 * dt;
    else this.speed -= 1500 * dt;

    this.speed = Math.max(0, Math.min(maxS, this.speed));

    const carEl = document.getElementById('player-car');
    const tilt = this.keys.left ? -10 : (this.keys.right ? 10 : 0);
    carEl.style.transform = `rotate(${tilt}deg)`;

    // Colisiones con Obstáculos
    this.obstacles.forEach(obs => {
      if (!obs.hit && Math.abs(obs.z - this.position) < 80) {
        if (Math.abs(this.playerX - obs.lane) < 0.35) {
          obs.hit = true;
          this.health -= 25;
          this.speed *= 0.2;
          this.flash('damage-flash');
          if (this.health <= 0) this.gameOver();
        }
      }
    });

    // Monedas
    this.coinsList.forEach(c => {
      if (!c.collected && Math.abs(c.z - this.position) < 80) {
        if (Math.abs(this.playerX - c.lane) < 0.35) {
          c.collected = true;
          this.coins += 1;
          this.score += 300;
          this.flash('coin-flash');
        }
      }
    });

    this.score += Math.floor((this.speed * dt) / 20);
    this.updateHUD();
  }

  flash(id) {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 120);
  }

  updateHUD() {
    document.getElementById('hud-distance').innerHTML = `${Math.floor(this.distance)} <small>m</small>`;
    document.getElementById('hud-coins').innerText = `🪙 ${this.coins}`;
    document.getElementById('hud-score').innerText = String(this.score).padStart(6, '0');
    document.getElementById('hud-speed').innerText = Math.floor(this.speed / 50);
    document.getElementById('hud-health-bar').style.width = `${this.health}%`;
    document.getElementById('hud-health-num').innerText = `${Math.max(0, this.health)}%`;
    document.getElementById('hud-nitro-bar').style.width = `${this.nitro}%`;
  }

  gameOver() {
    this.state = 'GAMEOVER';
    document.getElementById('go-final-score').innerText = this.score;
    document.getElementById('go-final-distance').innerText = `${Math.floor(this.distance)} m`;
    document.getElementById('go-final-coins').innerText = this.coins;
    this.showScreen('menu-gameover');
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const theme = THEMES[this.currentThemeKey];

    // CIELO SEGÚN ENTORNO
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, theme.skyTop);
    grad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const fov = 0.8;
    const cameraH = 800;
    const centerY = this.canvas.height / 2;
    const centerX = this.canvas.width / 2;

    const renderMax = 60;
    const baseSeg = Math.floor(this.position / this.segmentLength);

    for (let n = renderMax; n > 0; n--) {
      const z1 = (n * this.segmentLength) - (this.position % this.segmentLength);
      const z2 = z1 + this.segmentLength;

      const scale1 = fov / (z1 / cameraH);
      const scale2 = fov / (z2 / cameraH);

      const y1 = centerY + (cameraH * scale1);
      const y2 = centerY + (cameraH * scale2);

      const w1 = this.roadWidth * scale1;
      const w2 = this.roadWidth * scale2;

      const x1 = centerX - (this.playerX * w1);
      const x2 = centerX - (this.playerX * w2);

      // Terreno
      ctx.fillStyle = (baseSeg + n) % 2 === 0 ? theme.groundAlt1 : theme.groundAlt2;
      ctx.fillRect(0, y2, this.canvas.width, y1 - y2);

      // Carretera
      ctx.fillStyle = (baseSeg + n) % 2 === 0 ? theme.roadAlt1 : theme.roadAlt2;
      ctx.beginPath();
      ctx.moveTo(x1 - w1, y1); ctx.lineTo(x1 + w1, y1);
      ctx.lineTo(x2 + w2, y2); ctx.lineTo(x2 - w2, y2);
      ctx.fill();

      // Bordes
      ctx.fillStyle = (baseSeg + n) % 2 === 0 ? theme.borderAlt1 : theme.borderAlt2;
      ctx.fillRect(x1 - w1 - 8, y1, 8, y2 - y1);
      ctx.fillRect(x1 + w1, y1, 8, y2 - y1);
    }

    // OBSTÁCULOS EN 3D MEJORADOS (BARRERAS CON PROFUNDIDAD Y LUZ)
    this.obstacles.forEach(obs => {
      const relZ = obs.z - this.position;
      if (relZ > 20 && relZ < 3000 && !obs.hit) {
        const scale = fov / (relZ / cameraH);
        const y = centerY + (cameraH * scale);
        const w = this.roadWidth * scale;
        const x = centerX - (this.playerX * w) + (obs.lane * w);
        const size = 70 * scale;

        // Cara frontal del cubo
        ctx.fillStyle = '#d63031';
        ctx.fillRect(x - size / 2, y - size, size, size);

        // Borde / Profundidad Superior (3D)
        ctx.fillStyle = '#ff7675';
        ctx.beginPath();
        ctx.moveTo(x - size / 2, y - size);
        ctx.lineTo(x - size / 2 + size * 0.2, y - size - size * 0.2);
        ctx.lineTo(x + size / 2 + size * 0.2, y - size - size * 0.2);
        ctx.lineTo(x + size / 2, y - size);
        ctx.fill();

        // Franjas de advertencia (Líneas amarillas)
        ctx.fillStyle = '#fdcb6e';
        ctx.fillRect(x - size / 3, y - size * 0.7, size / 1.5, size * 0.2);

        // Luz estroboscópica superior
        ctx.fillStyle = '#fffa65';
        ctx.beginPath();
        ctx.arc(x, y - size - size * 0.1, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // MONEDAS
    this.coinsList.forEach(c => {
      const relZ = c.z - this.position;
      if (relZ > 20 && relZ < 3000 && !c.collected) {
        const scale = fov / (relZ / cameraH);
        const y = centerY + (cameraH * scale);
        const w = this.roadWidth * scale;
        const x = centerX - (this.playerX * w) + (c.lane * w);
        const size = 25 * scale;

        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(x, y - size, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  gameLoop() {
    let lastTime = performance.now();
    const frame = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      this.update(dt);
      this.render();

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

window.onload = () => { new GameEngine(); };