/* ==========================================================================
   CYBER DEFENDER - MOTOR PRINCIPAL E CONTROLADOR DE ESTADOS
   Gerencia o loop principal, colisões, ondas de inimigos, UI e tela responsiva.
   ========================================================================== */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Estados: 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.state = 'MENU';

    this.keys = {};
    this.player = null;
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particleSystem = new ParticleSystem();

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('cyberdefender_highscore') || '0', 10);
    this.wave = 1;
    this.multiplier = 1.0;

    this.waveSpawnTimer = 0;
    this.enemiesToSpawn = 0;
    this.bossActive = false;

    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;

    this.initUI();
    this.initInputs();
    this.particleSystem.initStars(this.width, this.height);

    // Loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initUI() {
    // Referências DOM
    this.hudOverlay = document.getElementById('hudOverlay');
    this.menuOverlay = document.getElementById('menuOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');
    this.gddModal = document.getElementById('gddModal');
    this.gitModal = document.getElementById('gitModal');

    this.hudScore = document.getElementById('hudScore');
    this.hudWave = document.getElementById('hudWave');
    this.hudMultiplier = document.getElementById('hudMultiplier');
    this.hudHighScore = document.getElementById('hudHighScore');
    this.healthFill = document.getElementById('healthFill');
    this.energyFill = document.getElementById('energyFill');

    // Botões
    document.getElementById('btnStartGame').onclick = () => this.startGame();
    document.getElementById('btnResume').onclick = () => this.resumeGame();
    document.getElementById('btnRestartPause').onclick = () => this.startGame();
    document.getElementById('btnQuitMenu').onclick = () => this.showMenu();
    document.getElementById('btnRestartGame').onclick = () => this.startGame();
    document.getElementById('btnGameOverMenu').onclick = () => this.showMenu();

    // Som
    document.getElementById('btnSoundToggle').onclick = () => {
      const isMuted = soundManager.toggleMute();
      document.getElementById('soundIcon').innerText = isMuted ? '🔇' : '🔊';
    };

    // Modais
    document.getElementById('btnGDDModal').onclick = () => this.gddModal.classList.remove('hidden');
    document.getElementById('btnCloseGDD').onclick = () => this.gddModal.classList.add('hidden');
    document.getElementById('btnCloseGDD2').onclick = () => this.gddModal.classList.add('hidden');

    document.getElementById('btnGitHelp').onclick = () => this.gitModal.classList.remove('hidden');
    document.getElementById('btnCloseGit').onclick = () => this.gitModal.classList.add('hidden');
    document.getElementById('btnCloseGit2').onclick = () => this.gitModal.classList.add('hidden');

    this.updateHUD();
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Atalho de Pausa (P ou Esc)
      if ((e.code === 'KeyP' || e.code === 'Escape') && this.state === 'PLAYING') {
        this.pauseGame();
      } else if ((e.code === 'KeyP' || e.code === 'Escape') && this.state === 'PAUSED') {
        this.resumeGame();
      }

      // Espaço para Atirar ou Iniciar
      if (e.code === 'Space') {
        if (this.state === 'MENU') this.startGame();
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Clique no Canvas para atirar
    this.canvas.addEventListener('mousedown', () => {
      if (this.state === 'PLAYING' && this.player && this.player.canShoot(performance.now())) {
        const newBullets = this.player.shoot(performance.now());
        this.bullets.push(...newBullets);
        soundManager.playLaser();
      }
    });
  }

  startGame() {
    this.state = 'PLAYING';
    this.player = new Player(this.width, this.height);
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.score = 0;
    this.wave = 1;
    this.multiplier = 1.0;
    this.bossActive = false;

    this.enemiesToSpawn = 10;
    this.waveSpawnTimer = 0;

    this.menuOverlay.classList.remove('active');
    this.menuOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    this.hudOverlay.classList.remove('hidden');

    this.updateHUD();
  }

  pauseGame() {
    this.state = 'PAUSED';
    this.pauseOverlay.classList.remove('hidden');
  }

  resumeGame() {
    this.state = 'PLAYING';
    this.pauseOverlay.classList.add('hidden');
  }

  showMenu() {
    this.state = 'MENU';
    this.hudOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    this.menuOverlay.classList.remove('hidden');
    this.menuOverlay.classList.add('active');
  }

  gameOver() {
    this.state = 'GAMEOVER';
    soundManager.playExplosion(true);
    this.triggerShake(20, 30);

    const isNewRecord = this.score > this.highScore;
    if (isNewRecord) {
      this.highScore = this.score;
      localStorage.setItem('cyberdefender_highscore', this.highScore.toString());
    }

    document.getElementById('finalScore').innerText = this.score.toLocaleString();
    document.getElementById('finalWave').innerText = this.wave;
    document.getElementById('newRecordBadge').innerText = isNewRecord ? 'SIM! 🎉' : 'NÃO';

    this.hudOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.remove('hidden');
  }

  triggerShake(intensity = 10, duration = 15) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  spawnWaveLogic() {
    if (this.bossActive) return;

    if (this.enemiesToSpawn > 0) {
      this.waveSpawnTimer += 1;
      if (this.waveSpawnTimer > 40) {
        this.waveSpawnTimer = 0;
        const x = Math.random() * (this.width - 120) + 60;
        
        let type = 'scout';
        const rand = Math.random();
        if (rand > 0.65) type = 'chaser';
        if (rand > 0.88) type = 'heavy';

        this.enemies.push(new Enemy(x, -40, type, this.wave));
        this.enemiesToSpawn -= 1;
      }
    } else if (this.enemies.length === 0) {
      // Onda Concluída! Avança para a próxima
      this.wave += 1;
      this.particleSystem.addFloatingText(this.width / 2 - 80, this.height / 2, `ONDA ${this.wave}`, '#ff0077');
      soundManager.playPowerup();

      if (this.wave % 5 === 0) {
        // Onda de Chefão
        this.bossActive = true;
        this.enemies.push(new Enemy(this.width / 2, -100, 'boss', this.wave));
        soundManager.playBossAlarm();
      } else {
        this.enemiesToSpawn = 10 + this.wave * 4;
      }
    }
  }

  update(now) {
    this.particleSystem.updateStars(this.width, this.height);
    this.particleSystem.update();

    if (this.state !== 'PLAYING') return;

    // Atualiza Jogador
    this.player.update(this.keys, this.particleSystem);

    // Disparo Automático (Segurando Espaço)
    if (this.keys['Space'] && this.player.canShoot(now)) {
      const newBullets = this.player.shoot(now);
      this.bullets.push(...newBullets);
      soundManager.playLaser();
    }

    // Gerenciador de Ondas
    this.spawnWaveLogic();

    // Atualiza Tiros
    for (let b of this.bullets) {
      b.update(this.width, this.height);
    }

    // Tiros dos Inimigos
    for (let e of this.enemies) {
      e.update(this.width, this.height, this.player.x, this.player.y);
      const enemyBullets = e.shoot(now);
      if (enemyBullets.length > 0) {
        this.bullets.push(...enemyBullets);
      }
    }

    // Atualiza Powerups
    for (let p of this.powerups) {
      p.update(this.height);
    }

    // --- SISTEMA DE COLISÕES ---
    this.checkCollisions();

    // Limpeza de entidades mortas
    this.bullets = this.bullets.filter(b => !b.markedForDeletion);
    this.enemies = this.enemies.filter(e => !e.markedForDeletion);
    this.powerups = this.powerups.filter(p => !p.markedForDeletion);

    // Checagem de Morte do Jogador
    if (this.player.health <= 0) {
      this.particleSystem.createExplosion(this.player.x, this.player.y, '#00f0ff', 50, true);
      this.gameOver();
    }

    this.updateHUD();
  }

  checkCollisions() {
    // 1. Tiros do Jogador vs Inimigos
    for (let b of this.bullets) {
      if (!b.isPlayer || b.markedForDeletion) continue;

      for (let e of this.enemies) {
        if (e.markedForDeletion) continue;

        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < (b.width / 2 + e.width / 2)) {
          b.markedForDeletion = true;
          e.hp -= 1;
          soundManager.playHit();
          this.particleSystem.createExplosion(b.x, b.y, b.color, 5);

          if (e.hp <= 0) {
            e.markedForDeletion = true;
            soundManager.playExplosion(e.type === 'boss');
            this.triggerShake(e.type === 'boss' ? 15 : 6, 12);
            this.particleSystem.createExplosion(e.x, e.y, e.color, 20, e.type === 'boss');

            const gainedPoints = Math.floor(e.scoreValue * this.multiplier);
            this.score += gainedPoints;
            this.particleSystem.addFloatingText(e.x, e.y, `+${gainedPoints}`, '#00f0ff');

            if (e.type === 'boss') this.bossActive = false;

            // Chance de dropar PowerUp
            if (Math.random() < 0.25 || e.type === 'boss') {
              const types = ['shield', 'triple', 'beam', 'health'];
              const chosenType = types[Math.floor(Math.random() * types.length)];
              this.powerups.push(new PowerUp(e.x, e.y, chosenType));
            }
          }
        }
      }
    }

    // 2. Tiros de Inimigos vs Jogador
    for (let b of this.bullets) {
      if (b.isPlayer || b.markedForDeletion) continue;

      const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      if (dist < (b.width / 2 + this.player.width / 2)) {
        b.markedForDeletion = true;
        this.player.takeDamage(12);
        soundManager.playHit();
        this.triggerShake(8, 10);
        this.particleSystem.createExplosion(this.player.x, this.player.y, '#ff0055', 10);
      }
    }

    // 3. Colisão Física Inimigo vs Jogador
    for (let e of this.enemies) {
      if (e.markedForDeletion) continue;

      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist < (e.width / 2 + this.player.width / 2)) {
        e.markedForDeletion = true;
        this.player.takeDamage(25);
        soundManager.playExplosion(false);
        this.triggerShake(12, 14);
        this.particleSystem.createExplosion(this.player.x, this.player.y, '#ff0055', 20);
      }
    }

    // 4. Coleta de Power-ups pelo Jogador
    for (let p of this.powerups) {
      if (p.markedForDeletion) continue;

      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist < (p.size + this.player.width / 2)) {
        p.markedForDeletion = true;
        soundManager.playPowerup();

        if (p.type === 'shield') {
          this.player.shieldActive = true;
          this.player.shieldTimer = 350; // ~6 segundos
          this.particleSystem.addFloatingText(this.player.x, this.player.y - 30, 'ESCUDO ATIVO!', '#00f0ff');
        } else if (p.type === 'triple') {
          this.player.weaponType = 'triple';
          this.player.weaponTimer = 400;
          this.particleSystem.addFloatingText(this.player.x, this.player.y - 30, 'TIRO TRIPLO!', '#ff0077');
        } else if (p.type === 'beam') {
          this.player.weaponType = 'beam';
          this.player.weaponTimer = 300;
          this.particleSystem.addFloatingText(this.player.x, this.player.y - 30, 'SUPER LASER!', '#ffb700');
        } else if (p.type === 'health') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
          this.particleSystem.addFloatingText(this.player.x, this.player.y - 30, '+35 ESCUDO', '#00ff88');
        }
      }
    }
  }

  updateHUD() {
    if (this.hudScore) this.hudScore.innerText = this.score.toString().padStart(6, '0');
    if (this.hudWave) this.hudWave.innerText = this.wave.toString();
    if (this.hudMultiplier) this.hudMultiplier.innerText = `x${this.multiplier.toFixed(1)}`;
    if (this.hudHighScore) this.hudHighScore.innerText = this.highScore.toString().padStart(6, '0');

    if (this.player) {
      if (this.healthFill) this.healthFill.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
      if (this.energyFill) this.energyFill.style.width = `${(this.player.energy / this.player.maxEnergy) * 100}%`;
    }
  }

  draw() {
    this.ctx.save();

    // Aplica Tremor de Tela (Screen Shake)
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= 1;
      const dx = (Math.random() - 0.5) * this.screenShakeIntensity;
      const dy = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // Fundo Negro Limpo
    this.ctx.fillStyle = '#04060d';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Desenha Estrelas do Fundo
    this.particleSystem.drawStars(this.ctx);

    // Desenha Entidades
    for (let p of this.powerups) p.draw(this.ctx);
    for (let b of this.bullets) b.draw(this.ctx);
    for (let e of this.enemies) e.draw(this.ctx);

    if (this.player && (this.state === 'PLAYING' || this.state === 'PAUSED')) {
      this.player.draw(this.ctx);
    }

    // Desenha Partículas e Textos
    this.particleSystem.draw(this.ctx);

    this.ctx.restore();
  }

  loop(timestamp) {
    const delta = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    this.update(timestamp);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Inicialização do Jogo quando a página carrega
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
