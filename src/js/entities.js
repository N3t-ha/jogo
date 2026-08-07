/* ==========================================================================
   CYBER DEFENDER - ENTIDADES DO JOGO
   Classes para Jogador, Tiros, Inimigos (Scouts, Chasers, Heavies, Boss) e Power-ups.
   ========================================================================== */

// --- NAVE DO JOGADOR ---
class Player {
  constructor(canvasWidth, canvasHeight) {
    this.cw = canvasWidth;
    this.ch = canvasHeight;
    this.width = 44;
    this.height = 44;
    this.x = canvasWidth / 2;
    this.y = canvasHeight - 100;
    
    this.speed = 7;
    this.vx = 0;
    this.vy = 0;
    
    this.maxHealth = 100;
    this.health = 100;
    this.maxEnergy = 100;
    this.energy = 100;
    
    this.weaponType = 'single'; // 'single', 'triple', 'beam'
    this.weaponTimer = 0;
    
    this.shieldActive = false;
    this.shieldTimer = 0;
    
    this.lastShootTime = 0;
    this.shootCooldown = 120; // ms
  }

  update(keys, particleSystem) {
    // Movimentação fluida com inércia
    let inputX = 0;
    let inputY = 0;

    if (keys['KeyW'] || keys['ArrowUp']) inputY -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) inputY += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

    // Normalização em movimento diagonal
    if (inputX !== 0 && inputY !== 0) {
      inputX *= 0.7071;
      inputY *= 0.7071;
    }

    // Boost com Shift
    let currentSpeed = this.speed;
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
      if (this.energy > 5) {
        currentSpeed *= 1.6;
        this.energy -= 0.6;
        particleSystem.createThrusterTrail(this.x, this.y + 20, '#ff0077');
      }
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.3); // Recarrega energia
    }

    this.vx = inputX * currentSpeed;
    this.vy = inputY * currentSpeed;

    this.x += this.vx;
    this.y += this.vy;

    // Restrições de borda da tela
    const padding = 24;
    this.x = Math.max(padding, Math.min(this.cw - padding, this.x));
    this.y = Math.max(padding, Math.min(this.ch - padding, this.y));

    // Rastro normal de propulsor
    particleSystem.createThrusterTrail(this.x, this.y + 20, '#00f0ff');

    // Timers de Buffs
    if (this.weaponTimer > 0) {
      this.weaponTimer -= 1;
      if (this.weaponTimer <= 0) this.weaponType = 'single';
    }

    if (this.shieldTimer > 0) {
      this.shieldTimer -= 1;
      if (this.shieldTimer <= 0) this.shieldActive = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Efeito de Escudo Ativo
    if (this.shieldActive) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, this.width * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Corpo da Nave Cyberpunk (Desenho Vetorial Canvas)
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#0a1024';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;

    // Asas e fuselagem
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2); // Bico
    ctx.lineTo(this.width / 2, this.height / 2); // Asa Dir
    ctx.lineTo(this.width / 4, this.height / 3);
    ctx.lineTo(0, this.height / 2.5);
    ctx.lineTo(-this.width / 4, this.height / 3);
    ctx.lineTo(-this.width / 2, this.height / 2); // Asa Esq
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cabine Iluminada (Cockpit)
    ctx.fillStyle = '#ff0077';
    ctx.shadowColor = '#ff0077';
    ctx.beginPath();
    ctx.arc(0, -4, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  canShoot(now) {
    return (now - this.lastShootTime) >= this.shootCooldown;
  }

  shoot(now) {
    this.lastShootTime = now;
    const bullets = [];

    if (this.weaponType === 'single') {
      bullets.push(new Bullet(this.x, this.y - 20, 0, -14, '#00f0ff', true));
    } else if (this.weaponType === 'triple') {
      bullets.push(new Bullet(this.x, this.y - 20, 0, -14, '#00f0ff', true));
      bullets.push(new Bullet(this.x - 12, this.y - 10, -2.5, -13, '#ff0077', true));
      bullets.push(new Bullet(this.x + 12, this.y - 10, 2.5, -13, '#ff0077', true));
    } else if (this.weaponType === 'beam') {
      bullets.push(new Bullet(this.x, this.y - 25, 0, -20, '#ffb700', true, 10, 35));
    }

    return bullets;
  }

  takeDamage(amount) {
    if (this.shieldActive) {
      amount *= 0.25; // Reduz 75% do dano se estiver de escudo
    }
    this.health = Math.max(0, this.health - amount);
  }
}

// --- PROJÉTEIS (TIROS) ---
class Bullet {
  constructor(x, y, vx, vy, color, isPlayer = true, width = 4, height = 14) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.isPlayer = isPlayer;
    this.width = width;
    this.height = height;
    this.markedForDeletion = false;
  }

  update(cw, ch) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -20 || this.x > cw + 20 || this.y < -20 || this.y > ch + 20) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.restore();
  }
}

// --- INIMIGOS ---
class Enemy {
  constructor(x, y, type = 'scout', wave = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.markedForDeletion = false;
    this.time = Math.random() * 100;

    if (type === 'scout') {
      this.width = 30;
      this.height = 30;
      this.hp = 1 + Math.floor(wave * 0.3);
      this.speed = 3 + Math.random() * 1.5;
      this.color = '#ff0077';
      this.scoreValue = 100;
    } else if (type === 'chaser') {
      this.width = 36;
      this.height = 36;
      this.hp = 3 + Math.floor(wave * 0.5);
      this.speed = 2.5;
      this.color = '#ffb700';
      this.scoreValue = 250;
    } else if (type === 'heavy') {
      this.width = 54;
      this.height = 54;
      this.hp = 8 + wave;
      this.speed = 1.2;
      this.color = '#00ff88';
      this.scoreValue = 500;
    } else if (type === 'boss') {
      this.width = 110;
      this.height = 90;
      this.hp = 60 + (wave * 25);
      this.maxHp = this.hp;
      this.speed = 1.5;
      this.color = '#ff0055';
      this.scoreValue = 3000;
      this.direction = 1;
    }
  }

  update(cw, ch, playerX, playerY) {
    this.time += 0.05;

    if (this.type === 'scout') {
      this.y += this.speed;
      this.x += Math.sin(this.time) * 2;
    } else if (this.type === 'chaser') {
      this.y += this.speed * 0.7;
      // Persegue suavemente o jogador
      if (this.x < playerX) this.x += 1;
      else if (this.x > playerX) this.x -= 1;
    } else if (this.type === 'heavy') {
      this.y += this.speed;
    } else if (this.type === 'boss') {
      // Movimento lateral na parte superior
      if (this.y < 120) this.y += 1;
      this.x += this.speed * this.direction;
      if (this.x > cw - 80 || this.x < 80) this.direction *= -1;
    }

    if (this.y > ch + 50) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#090d1a';

    if (this.type === 'scout') {
      ctx.beginPath();
      ctx.moveTo(0, this.height / 2);
      ctx.lineTo(this.width / 2, -this.height / 2);
      ctx.lineTo(-this.width / 2, -this.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'chaser' || this.type === 'heavy') {
      ctx.beginPath();
      ctx.moveTo(0, this.height / 2);
      ctx.lineTo(this.width / 2, 0);
      ctx.lineTo(0, -this.height / 2);
      ctx.lineTo(-this.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'boss') {
      // Nave do Chefão complexa
      ctx.beginPath();
      ctx.moveTo(0, this.height / 2);
      ctx.lineTo(this.width / 2, 0);
      ctx.lineTo(this.width / 3, -this.height / 2);
      ctx.lineTo(-this.width / 3, -this.height / 2);
      ctx.lineTo(-this.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Barra de Vida do Boss
      ctx.restore();
      ctx.save();
      const barW = 100;
      const barH = 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(this.x - barW / 2, this.y - this.height / 2 - 16, barW, barH);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(this.x - barW / 2, this.y - this.height / 2 - 16, barW * (this.hp / this.maxHp), barH);
      ctx.restore();
      return;
    }

    ctx.restore();
  }

  shoot(now) {
    if (this.type === 'heavy' && Math.random() < 0.015) {
      return [new Bullet(this.x, this.y + 20, 0, 7, '#ff0055', false)];
    }
    if (this.type === 'boss' && Math.random() < 0.04) {
      return [
        new Bullet(this.x - 20, this.y + 30, -2, 8, '#ff0077', false),
        new Bullet(this.x, this.y + 35, 0, 9, '#ff0055', false),
        new Bullet(this.x + 20, this.y + 30, 2, 8, '#ff0077', false)
      ];
    }
    return [];
  }
}

// --- POWER-UPS ---
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'shield', 'triple', 'beam', 'health'
    this.size = 20;
    this.speed = 2;
    this.markedForDeletion = false;
    this.time = 0;
  }

  update(ch) {
    this.y += this.speed;
    this.time += 0.08;
    this.x += Math.sin(this.time) * 1.2;

    if (this.y > ch + 30) this.markedForDeletion = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    let color = '#00f0ff';
    let icon = '🛡️';

    if (this.type === 'triple') { color = '#ff0077'; icon = '⚡'; }
    if (this.type === 'beam') { color = '#ffb700'; icon = '💥'; }
    if (this.type === 'health') { color = '#00ff88'; icon = '❤️'; }

    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;

    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 0, 0);

    ctx.restore();
  }
}
