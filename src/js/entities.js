/* ==========================================================================
   PROJECT HUNT - ENTIDADES 3D DO JOGO (Assassino & IA dos Sobreviventes)
   Lógica do Assassino (Humano) e IA de Sobreviventes (FSM com ganchos e Mori).
   ========================================================================== */

// --- ASSASSINO (JOGADOR HUMANO - 1ª PESSOA) ---
class Killer3D {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    this.speed = 0.22; // Equivale a 4.6 m/s
    this.x = 0;
    this.y = 1.8; // Altura dos olhos
    this.z = 25;

    this.pitch = 0;
    this.yaw = 0;

    this.isCarrying = null; // Referência do sobrevivente sendo carregado
    this.isAttacking = false;
    this.attackCooldown = 0;

    // Lanternas / Luz de foco do Assassino
    this.spotLight = new THREE.SpotLight(0xff1a3c, 2, 25, Math.PI / 6, 0.5);
    this.spotLight.position.set(0, 1.8, 0);
    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);
  }

  update(keys, mouseDelta, map3D) {
    if (this.attackCooldown > 0) this.attackCooldown -= 1;

    // Rotação da câmera (PointerLock Mouse)
    if (mouseDelta) {
      this.yaw -= mouseDelta.x * 0.002;
      this.pitch -= mouseDelta.y * 0.002;
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    }

    // Vetores de Movimentação WASD em 3D
    let moveForward = 0;
    let moveRight = 0;

    if (keys['KeyW'] || keys['ArrowUp']) moveForward += 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveForward -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveRight -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveRight += 1;

    // Reduz velocidade se estiver carregando um sobrevivente
    let currentSpeed = this.isCarrying ? this.speed * 0.75 : this.speed;

    const dirX = Math.sin(this.yaw) * moveForward + Math.cos(this.yaw) * moveRight;
    const dirZ = Math.cos(this.yaw) * moveForward - Math.sin(this.yaw) * moveRight;

    this.x += dirX * currentSpeed;
    this.z -= dirZ * currentSpeed;

    // Restrição de limites do mapa
    const half = map3D.mapSize / 2 - 2;
    this.x = Math.max(-half, Math.min(half, this.x));
    this.z = Math.max(-half, Math.min(half, this.z));

    // Atualiza posição da câmera 3D
    this.camera.position.set(this.x, this.y, this.z);

    const targetX = this.x - Math.sin(this.yaw) * Math.cos(this.pitch);
    const targetY = this.y + Math.sin(this.pitch);
    const targetZ = this.z - Math.cos(this.yaw) * Math.cos(this.pitch);

    this.camera.lookAt(targetX, targetY, targetZ);

    // Atualiza lanterna spotlight
    this.spotLight.position.set(this.x, this.y, this.z);
    this.spotLight.target.position.set(targetX, targetY, targetZ);

    // Atualiza posição do sobrevivente carregado no ombro
    if (this.isCarrying) {
      this.isCarrying.mesh.position.set(this.x + Math.sin(this.yaw) * 0.8, this.y, this.z - Math.cos(this.yaw) * 0.8);
    }
  }

  attack() {
    if (this.attackCooldown > 0) return false;
    this.attackCooldown = 40;
    this.isAttacking = true;
    soundManager.playSlash();
    return true;
  }
}

// --- SOBREVIVENTE CONTROLADO POR IA (FSM) ---
class SurvivorAI3D {
  constructor(scene, id, x, z) {
    this.scene = scene;
    this.id = id;
    this.name = `Sobrevivente #${id}`;

    this.x = x;
    this.y = 1.0;
    this.z = z;
    this.speed = 0.16; // Sobrevivente 4.0 m/s

    // Estados da IA FSM: 'PATROL', 'REPAIRING', 'FLEEING', 'RESCUING', 'OPENING_GATE', 'ESCAPED'
    this.aiState = 'PATROL';

    // Estados de Saúde: 'Healthy', 'Wounded', 'Downed', 'Carried', 'Hooked', 'Dead'
    this.healthState = 'Healthy';

    this.hookCount = 0; // 0 ➔ 1 ➔ 2 (Mori liberado)
    this.targetGenerator = null;
    this.targetHook = null;

    this.mesh = this.createMesh();
    this.mesh.position.set(this.x, this.y, this.z);
    this.scene.add(this.mesh);
  }

  createMesh() {
    const group = new THREE.Group();

    // Corpo humanoid simples
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.0;
    group.add(head);

    this.bodyMat = bodyMat;
    return group;
  }

  update(killer, map3D, onNoisePing) {
    if (this.healthState === 'Dead' || this.healthState === 'Carried' || this.aiState === 'ESCAPED') return;

    // Se estiver no gancho, não se move
    if (this.healthState === 'Hooked') return;

    // Se estiver Caído (Downed), rasteja devagar
    if (this.healthState === 'Downed') {
      this.speed = 0.04;
    } else {
      this.speed = 0.16;
    }

    const distToKiller = Math.hypot(this.x - killer.x, this.z - killer.z);

    // --- MÁQUINA DE ESTADOS FINITOS (FSM) ---

    // 1. Reação ao Assassino (FLEEING)
    if (distToKiller < 18 && this.healthState !== 'Downed') {
      this.aiState = 'FLEEING';
    }

    if (this.aiState === 'FLEEING') {
      // Foge na direção oposta ao assassino
      const dx = this.x - killer.x;
      const dz = this.z - killer.z;
      const len = Math.hypot(dx, dz) || 1;

      this.x += (dx / len) * this.speed;
      this.z += (dz / len) * this.speed;

      if (distToKiller > 25) {
        this.aiState = 'PATROL';
      }
    } else if (this.aiState === 'PATROL') {
      // Encontra o gerador não concluído mais próximo
      if (!this.targetGenerator || this.targetGenerator.completed) {
        this.targetGenerator = map3D.generators.find(g => !g.completed);
      }

      if (this.targetGenerator) {
        const dx = this.targetGenerator.x - this.x;
        const dz = this.targetGenerator.z - this.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 2.0) {
          this.x += (dx / dist) * this.speed;
          this.z += (dz / dist) * this.speed;
        } else {
          this.aiState = 'REPAIRING';
        }
      }
    } else if (this.aiState === 'REPAIRING') {
      if (this.targetGenerator && !this.targetGenerator.completed) {
        this.targetGenerator.progress += 0.12; // Avanço no gerador

        // Chance aleatória de falhar no Skill Check
        if (Math.random() < 0.003) {
          soundManager.playSkillCheckFail();
          if (onNoisePing) onNoisePing(this.x, this.z);
        }

        if (this.targetGenerator.progress >= 100) {
          this.targetGenerator.progress = 100;
          this.targetGenerator.completed = true;
          this.targetGenerator.topLight.material.color.setHex(0x00ff88);
          this.targetGenerator.pointLight.color.setHex(0x00ff88);
          this.aiState = 'PATROL';
        }
      } else {
        this.aiState = 'PATROL';
      }
    }

    // Restrição dos limites do mapa
    const half = map3D.mapSize / 2 - 2;
    this.x = Math.max(-half, Math.min(half, this.x));
    this.z = Math.max(-half, Math.min(half, this.z));

    this.mesh.position.set(this.x, this.y, this.z);
    this.updateVisualState();
  }

  updateVisualState() {
    if (this.healthState === 'Healthy') {
      this.bodyMat.color.setHex(0x00ff88);
    } else if (this.healthState === 'Wounded') {
      this.bodyMat.color.setHex(0xffaa00);
    } else if (this.healthState === 'Downed') {
      this.bodyMat.color.setHex(0xff1a3c);
      this.mesh.rotation.z = Math.PI / 2; // Deitado no chão
    } else if (this.healthState === 'Hooked') {
      this.bodyMat.color.setHex(0xb800ff);
    } else if (this.healthState === 'Dead') {
      this.bodyMat.color.setHex(0x333344);
    }
  }

  takeHit() {
    if (this.healthState === 'Healthy') {
      this.healthState = 'Wounded';
      soundManager.playHitSound();
      return 'wounded';
    } else if (this.healthState === 'Wounded') {
      this.healthState = 'Downed';
      soundManager.playHitSound();
      return 'downed';
    }
    return null;
  }
}
