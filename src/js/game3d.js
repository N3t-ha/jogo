/* ==========================================================================
   PROJECT HUNT - MOTOR PRINCIPAL 3D (Three.js WebGL Engine)
   Integra o loop 3D, PointerLock, regras de partida, ganchos e HUD.
   ========================================================================== */

class GameEngine3D {
  constructor() {
    this.container = document.getElementById('webgl-container');
    
    // Configuração Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Estado da partida: 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.state = 'MENU';

    this.keys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.isPointerLocked = false;

    this.map3D = null;
    this.killer = null;
    this.survivors = [];

    this.matchStartTime = 0;
    this.gensCompleted = 0;
    this.gatesPowered = false;

    this.noiseTimer = 0;

    this.initUI();
    this.initInputs();
    this.initResize();

    // Loop de Animação
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initUI() {
    this.menuOverlay = document.getElementById('menuOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');
    this.hudOverlay = document.getElementById('hudOverlay');
    this.crosshair = document.getElementById('crosshair');
    this.interactionPrompt = document.getElementById('interactionPrompt');
    this.promptText = document.getElementById('promptText');
    this.noiseNotification = document.getElementById('noiseNotification');

    this.gddModal = document.getElementById('gddModal');
    this.gitModal = document.getElementById('gitModal');

    document.getElementById('btnStartGame').onclick = () => this.startGame();
    document.getElementById('btnResume').onclick = () => this.resumeGame();
    document.getElementById('btnRestartPause').onclick = () => this.startGame();
    document.getElementById('btnQuitMenu').onclick = () => this.showMenu();
    document.getElementById('btnRestartGame').onclick = () => this.startGame();
    document.getElementById('btnGameOverMenu').onclick = () => this.showMenu();

    document.getElementById('btnSoundToggle').onclick = () => {
      const isMuted = soundManager.toggleMute();
      document.getElementById('soundIcon').innerText = isMuted ? '🔇' : '🔊';
    };

    document.getElementById('btnGDDModal').onclick = () => this.gddModal.classList.remove('hidden');
    document.getElementById('btnCloseGDD').onclick = () => this.gddModal.classList.add('hidden');
    document.getElementById('btnCloseGDD2').onclick = () => this.gddModal.classList.add('hidden');

    document.getElementById('btnGitHelp').onclick = () => this.gitModal.classList.remove('hidden');
    document.getElementById('btnCloseGit').onclick = () => this.gitModal.classList.add('hidden');
    document.getElementById('btnCloseGit2').onclick = () => this.gitModal.classList.add('hidden');
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if ((e.code === 'KeyP' || e.code === 'Escape') && this.state === 'PLAYING') {
        this.pauseGame();
      }

      if (e.code === 'KeyE' && this.state === 'PLAYING') {
        this.handleInteractionKey();
      }

      if (e.code === 'Space' && this.state === 'PLAYING') {
        this.handleSpaceKey();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer Lock Mouse Controls
    this.container.addEventListener('click', () => {
      if (this.state === 'PLAYING' && !this.isPointerLocked) {
        this.container.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.container);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDelta.x = e.movementX;
        this.mouseDelta.y = e.movementY;
      }
    });

    // Ataque com Clique Esquerdo do Mouse
    window.addEventListener('mousedown', (e) => {
      if (this.state === 'PLAYING' && e.button === 0) {
        if (this.killer && this.killer.attack()) {
          this.checkAttackHits();
        }
      }
    });
  }

  initResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  startGame() {
    this.state = 'PLAYING';
    this.matchStartTime = performance.now();
    this.gensCompleted = 0;
    this.gatesPowered = false;

    // Limpa a cena Three.js
    while(this.scene.children.length > 0){ 
      this.scene.remove(this.scene.children[0]); 
    }

    // Cria o Mapa 3D e Entidades
    this.map3D = new Map3D(this.scene);
    this.killer = new Killer3D(this.scene, this.camera);

    // Cria os 4 Sobreviventes
    this.survivors = [
      new SurvivorAI3D(this.scene, 1, -20, -20),
      new SurvivorAI3D(this.scene, 2, 20, -20),
      new SurvivorAI3D(this.scene, 3, -20, 20),
      new SurvivorAI3D(this.scene, 4, 20, 20)
    ];

    this.menuOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    
    this.hudOverlay.classList.remove('hidden');
    this.crosshair.classList.remove('hidden');

    this.container.requestPointerLock();
  }

  pauseGame() {
    this.state = 'PAUSED';
    document.exitPointerLock();
    this.pauseOverlay.classList.remove('hidden');
  }

  resumeGame() {
    this.state = 'PLAYING';
    this.pauseOverlay.classList.add('hidden');
    this.container.requestPointerLock();
  }

  showMenu() {
    this.state = 'MENU';
    document.exitPointerLock();
    this.hudOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    this.crosshair.classList.add('hidden');
    this.menuOverlay.classList.remove('hidden');
  }

  gameOver(killerWon = true) {
    this.state = 'GAMEOVER';
    document.exitPointerLock();

    const elapsedSeconds = Math.floor((performance.now() - this.matchStartTime) / 1000);
    const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (elapsedSeconds % 60).toString().padStart(2, '0');

    const deadCount = this.survivors.filter(s => s.healthState === 'Dead').length;

    document.getElementById('endTitle').innerText = killerWon ? 'TODOS OS SOBREVIVENTES ELIMINADOS!' : 'SOBREVIVENTES ESCAPARAM!';
    document.getElementById('endSubtitle').innerText = killerWon ? 'Sua caçada foi impiedosa e perfeita.' : 'Pelo menos um sobrevivente abriu os portões e fugiu.';
    document.getElementById('finalKills').innerText = `${deadCount} / 4`;
    document.getElementById('finalGens').innerText = `${this.gensCompleted} / 5`;
    document.getElementById('finalTime').innerText = `${mins}:${secs}`;

    this.hudOverlay.classList.add('hidden');
    this.crosshair.classList.add('hidden');
    this.gameOverOverlay.classList.remove('hidden');
  }

  checkAttackHits() {
    for (let survivor of this.survivors) {
      if (survivor.healthState === 'Dead' || survivor.healthState === 'Hooked') continue;

      const dist = Math.hypot(this.killer.x - survivor.x, this.killer.z - survivor.z);
      if (dist < 2.5) {
        survivor.takeHit();
        break;
      }
    }
  }

  handleInteractionKey() {
    // 1. Se estiver Carregando um Sobrevivente ➔ Procurar Gancho para pendurar
    if (this.killer.isCarrying) {
      const targetHook = this.map3D.hooks.find(h => !h.occupiedBy && Math.hypot(this.killer.x - h.x, this.killer.z - h.z) < 3.0);
      if (targetHook) {
        const survivor = this.killer.isCarrying;
        this.killer.isCarrying = null;

        survivor.healthState = 'Hooked';
        survivor.hookCount += 1;
        targetHook.occupiedBy = survivor;

        survivor.mesh.position.set(targetHook.x, 2.5, targetHook.z);
        soundManager.playHookScream();

        // Se for o 3º gancho, morre imediatamente
        if (survivor.hookCount >= 3) {
          survivor.healthState = 'Dead';
        }
        return;
      }
    }

    // 2. Procurar Sobrevivente Caído no Chão
    const downedSurvivor = this.survivors.find(s => s.healthState === 'Downed' && Math.hypot(this.killer.x - s.x, this.killer.z - s.z) < 2.5);
    
    if (downedSurvivor) {
      // Se Hook Count >= 2 ➔ Execução MORI!
      if (downedSurvivor.hookCount >= 2) {
        downedSurvivor.healthState = 'Dead';
        soundManager.playMoriExecution();
        return;
      } else if (!this.killer.isCarrying) {
        // Carregar no ombro
        this.killer.isCarrying = downedSurvivor;
        downedSurvivor.healthState = 'Carried';
        return;
      }
    }
  }

  handleSpaceKey() {
    // Quebrar Pallet Próximo
    const nearPallet = this.map3D.pallets.find(p => !p.destroyed && Math.hypot(this.killer.x - p.x, this.killer.z - p.z) < 2.5);
    if (nearPallet) {
      nearPallet.destroyed = true;
      this.scene.remove(nearPallet.mesh);
      soundManager.playPalletBreak();
    }
  }

  updateInteractionsPrompt() {
    let prompt = null;

    if (this.killer.isCarrying) {
      const targetHook = this.map3D.hooks.find(h => !h.occupiedBy && Math.hypot(this.killer.x - h.x, this.killer.z - h.z) < 3.0);
      if (targetHook) prompt = '[E] COLOCAR NO GANCHO';
    } else {
      const downed = this.survivors.find(s => s.healthState === 'Downed' && Math.hypot(this.killer.x - s.x, this.killer.z - s.z) < 2.5);
      if (downed) {
        if (downed.hookCount >= 2) prompt = '🩸 [E] EXECUTAR MORI!';
        else prompt = '[E] CARREGAR SOBREVIVENTE';
      } else {
        const pallet = this.map3D.pallets.find(p => !p.destroyed && Math.hypot(this.killer.x - p.x, this.killer.z - p.z) < 2.5);
        if (pallet) prompt = '[ESPAÇO] DESTRUIR PALLET';
      }
    }

    if (prompt) {
      this.promptText.innerText = prompt;
      this.interactionPrompt.classList.remove('hidden');
    } else {
      this.interactionPrompt.classList.add('hidden');
    }
  }

  triggerNoisePing() {
    this.noiseNotification.classList.remove('hidden');
    this.noiseTimer = 60; // 1 segundo
  }

  update(now) {
    if (this.state !== 'PLAYING') return;

    // Atualiza Assassino
    this.killer.update(this.keys, this.mouseDelta, this.map3D);
    this.mouseDelta = { x: 0, y: 0 };

    // Atualiza Sobreviventes IA
    for (let s of this.survivors) {
      s.update(this.killer, this.map3D, (x, z) => this.triggerNoisePing());
    }

    // Cronômetro do aviso de ruído
    if (this.noiseTimer > 0) {
      this.noiseTimer -= 1;
      if (this.noiseTimer <= 0) this.noiseNotification.classList.add('hidden');
    }

    // Calcula Geradores Concluídos
    this.gensCompleted = this.map3D.generators.filter(g => g.completed).length;

    // Energiza Portões após 5 geradores
    if (this.gensCompleted >= 5 && !this.gatesPowered) {
      this.gatesPowered = true;
      soundManager.playGateAlarm();
      for (let gate of this.map3D.exitGates) {
        gate.lightBulb.material.color.setHex(0x00ff88);
      }
    }

    this.updateInteractionsPrompt();
    this.updateHUD();

    // Checagem de Fim de Jogo (Assassino Vence se todos morrerem)
    const deadCount = this.survivors.filter(s => s.healthState === 'Dead').length;
    if (deadCount >= 4) {
      this.gameOver(true);
    }
  }

  updateHUD() {
    document.getElementById('hudGens').innerText = `${5 - this.gensCompleted} / 5`;
    document.getElementById('hudGates').innerText = this.gatesPowered ? 'ENERGIZADOS (ABERTOS)' : 'BLOQUEADOS';

    // Atualiza Cards dos 4 Sobreviventes
    this.survivors.forEach((s, idx) => {
      const card = document.getElementById(`survivorCard${idx + 1}`);
      if (!card) return;

      const healthEl = card.querySelector('.survivor-health');
      healthEl.innerText = this.getHealthLabel(s.healthState);
      healthEl.className = `survivor-health health-${s.healthState.toLowerCase()}`;

      const dots = card.querySelectorAll('.hook-dots .dot');
      dots.forEach((d, dIdx) => {
        if (dIdx < s.hookCount) d.classList.add('filled');
        else d.classList.remove('filled');
      });
    });
  }

  getHealthLabel(state) {
    if (state === 'Healthy') return 'Saudável';
    if (state === 'Wounded') return 'Ferido';
    if (state === 'Downed') return 'Caído';
    if (state === 'Carried') return 'Carregado';
    if (state === 'Hooked') return 'No Gancho';
    if (state === 'Dead') return 'Morto';
    return state;
  }

  draw() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  loop(timestamp) {
    this.update(timestamp);
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// Inicialização do Jogo 3D quando a página carrega
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine3D = new GameEngine3D();
});
