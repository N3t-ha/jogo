/* ==========================================================================
   CYBER DEFENDER - MOTOR DE PARTÍCULAS E POEIRA ESPACIAL
   Efeitos visuais dinâmicos (rastro de motores, explosões, estrelas).
   ========================================================================== */

class Particle {
  constructor(x, y, color, vx, vy, size, life, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.shape = shape;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
    this.size *= 0.96; // Encolhimento gradual
  }

  draw(ctx) {
    if (this.life <= 0 || this.size <= 0.1) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    ctx.beginPath();
    if (this.shape === 'square') {
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    } else {
      ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.stars = [];
    this.floatTexts = [];
  }

  initStars(width, height, count = 120) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.5,
        color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#00f0ff' : '#ff0077')
      });
    }
  }

  updateStars(width, height) {
    for (let star of this.stars) {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    }
  }

  drawStars(ctx) {
    ctx.save();
    for (let star of this.stars) {
      ctx.fillStyle = star.color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Explosão brilhante
  createExplosion(x, y, color = '#ffb700', count = 25, isBig = false) {
    const scale = isBig ? 2 : 1;
    for (let i = 0; i < count * scale; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 6 + 2) * scale;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = (Math.random() * 5 + 2) * scale;
      const life = Math.random() * 30 + 20;

      this.particles.push(new Particle(x, y, color, vx, vy, size, life));
    }
  }

  // Rastro do Propulsor (Thruster Trail)
  createThrusterTrail(x, y, color = '#00f0ff') {
    const vx = (Math.random() - 0.5) * 1.5;
    const vy = Math.random() * 3 + 2; // Partículas caindo para trás
    const size = Math.random() * 4 + 2;
    const life = Math.random() * 15 + 10;
    this.particles.push(new Particle(x, y, color, vx, vy, size, life));
  }

  // Texto Flutuante de Pontuação
  addFloatingText(x, y, text, color = '#00f0ff') {
    this.floatTexts.push({
      x, y, text, color,
      vy: -1.5,
      alpha: 1,
      life: 40
    });
  }

  update() {
    // Atualiza partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0 || p.size <= 0.1) {
        this.particles.splice(i, 1);
      }
    }

    // Atualiza textos flutuantes
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y += ft.vy;
      ft.life -= 1;
      ft.alpha = ft.life / 40;
      if (ft.life <= 0) {
        this.floatTexts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (let p of this.particles) {
      p.draw(ctx);
    }

    // Desenha textos flutuantes
    ctx.save();
    for (let ft of this.floatTexts) {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }
}
