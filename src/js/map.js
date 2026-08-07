/* ==========================================================================
   PROJECT HUNT - CONSTRUTOR DO MAPA 3D (Three.js WebGL)
   Gera o cenário 3D com 5 Geradores, 8 Ganchos, 12 Pallets, 10 Janelas e 2 Portões.
   ========================================================================== */

class Map3D {
  constructor(scene) {
    this.scene = scene;
    this.mapSize = 80;

    this.generators = [];
    this.hooks = [];
    this.pallets = [];
    this.windows = [];
    this.exitGates = [];
    this.obstacles = [];

    this.buildEnvironment();
    this.spawnMapObjects();
  }

  buildEnvironment() {
    // 1. Névoa de Terror Escura (Dark Horror Fog)
    this.scene.fog = new THREE.FogExp2(0x060810, 0.035);

    // 2. Iluminação do Cenário
    const ambientLight = new THREE.AmbientLight(0x1a2035, 0.6); // Luz azulada soturna
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x4466aa, 0.8); // Luz da Lua
    moonLight.position.set(30, 50, -20);
    moonLight.castShadow = true;
    this.scene.add(moonLight);

    // 3. Chão / Terreno do Mapa
    const groundGeo = new THREE.PlaneGeometry(this.mapSize, this.mapSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 4. Muros de Contenção do Mapa (Bordas)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.8 });
    const half = this.mapSize / 2;

    const wallN = new THREE.Mesh(new THREE.BoxGeometry(this.mapSize, 8, 2), wallMat);
    wallN.position.set(0, 4, -half);
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(this.mapSize, 8, 2), wallMat);
    wallS.position.set(0, 4, half);
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(2, 8, this.mapSize), wallMat);
    wallE.position.set(half, 4, 0);
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(2, 8, this.mapSize), wallMat);
    wallW.position.set(-half, 4, 0);

    this.scene.add(wallN, wallS, wallE, wallW);
    this.obstacles.push(wallN, wallS, wallE, wallW);
  }

  spawnMapObjects() {
    // A. 5 GERADORES (Posicionados estrategicamente)
    const genCoords = [
      { x: -25, z: -25 },
      { x: 25, z: -25 },
      { x: 0, z: 0 },
      { x: -25, z: 25 },
      { x: 25, z: 25 }
    ];

    genCoords.forEach((pos, idx) => {
      const genObj = this.createGeneratorMesh(pos.x, pos.z, idx + 1);
      this.generators.push(genObj);
    });

    // B. 8 GANCHOS DE SACRIFÍCIO
    const hookCoords = [
      { x: -30, z: -10 }, { x: 30, z: -10 },
      { x: -10, z: -30 }, { x: 10, z: -30 },
      { x: -30, z: 10 },  { x: 30, z: 10 },
      { x: -10, z: 30 },  { x: 10, z: 30 }
    ];

    hookCoords.forEach((pos, idx) => {
      const hookObj = this.createHookMesh(pos.x, pos.z, idx + 1);
      this.hooks.push(hookObj);
    });

    // C. 12 PALLETS DE MADEIRA
    const palletCoords = [
      { x: -18, z: -15 }, { x: 18, z: -15 }, { x: -5, z: -20 }, { x: 5, z: -20 },
      { x: -15, z: 5 },   { x: 15, z: 5 },   { x: -20, z: 18 }, { x: 20, z: 18 },
      { x: -8, z: 22 },   { x: 8, z: 22 },   { x: -28, z: -2 }, { x: 28, z: -2 }
    ];

    palletCoords.forEach((pos, idx) => {
      const palletObj = this.createPalletMesh(pos.x, pos.z, idx + 1);
      this.pallets.push(palletObj);
    });

    // D. 10 JANELAS / MUROS DE SALTO
    const windowCoords = [
      { x: -15, z: -28 }, { x: 15, z: -28 }, { x: -28, z: -15 }, { x: 28, z: -15 },
      { x: -15, z: 28 },  { x: 15, z: 28 },  { x: -28, z: 15 },  { x: 28, z: 15 },
      { x: 0, z: -12 },   { x: 0, z: 12 }
    ];

    windowCoords.forEach((pos, idx) => {
      const windowObj = this.createWindowMesh(pos.x, pos.z, idx + 1);
      this.windows.push(windowObj);
    });

    // E. 2 PORTÕES DE SAÍDA (Lado Norte e Lado Sul)
    const gateNorth = this.createExitGateMesh(0, -39, 'NORTE');
    const gateSouth = this.createExitGateMesh(0, 39, 'SUL');
    this.exitGates.push(gateNorth, gateSouth);

    // F. ÁRVORES E PEDRAS DE OBSTÁCULO
    this.createScatteredTreesAndRocks();
  }

  // Criador de Malha do Gerador
  createGeneratorMesh(x, z, id) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Base de metal
    const baseGeo = new THREE.BoxGeometry(3, 2, 3);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333b4d, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1;
    group.add(base);

    // Pistões/Motor
    const engineGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x556677 });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.y = 2.5;
    group.add(engine);

    // Luz de topo indicador de progresso (Amarela ➔ Verde quando concluído)
    const lightGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const topLight = new THREE.Mesh(lightGeo, lightMat);
    topLight.position.y = 3.5;
    group.add(topLight);

    const pointLight = new THREE.PointLight(0xffaa00, 1, 10);
    pointLight.position.y = 3.5;
    group.add(pointLight);

    this.scene.add(group);

    return {
      id,
      mesh: group,
      x, z,
      progress: 0,
      completed: false,
      topLight,
      pointLight
    };
  }

  // Criador de Malha do Gancho de Sacrifício
  createHookMesh(x, z, id) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Poste de madeira
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.3, 4.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3d2612, roughness: 0.9 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.25;
    group.add(pole);

    // Gancho de metal curvo
    const hookGeo = new THREE.TorusGeometry(0.5, 0.08, 8, 16, Math.PI);
    const hookMat = new THREE.MeshStandardMaterial({ color: 0x880015, metalness: 0.9 });
    const hook = new THREE.Mesh(hookGeo, hookMat);
    hook.position.set(0.4, 3.8, 0);
    hook.rotation.z = Math.PI / 2;
    group.add(hook);

    this.scene.add(group);

    return {
      id,
      mesh: group,
      x, z,
      occupiedBy: null
    };
  }

  // Criador de Malha do Pallet de Madeira
  createPalletMesh(x, z, id) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Pallet em pé (pronto para ser derrubado)
    const palletGeo = new THREE.BoxGeometry(0.3, 2.4, 2.0);
    const palletMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.8 });
    const pallet = new THREE.Mesh(palletGeo, palletMat);
    pallet.position.y = 1.2;
    group.add(pallet);

    this.scene.add(group);

    return {
      id,
      mesh: group,
      x, z,
      dropped: false,
      destroyed: false
    };
  }

  // Criador de Malha da Janela
  createWindowMesh(x, z, id) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Muro de pedra com vão de janela no meio
    const wallGeoL = new THREE.BoxGeometry(1.5, 3, 0.4);
    const wallGeoR = new THREE.BoxGeometry(1.5, 3, 0.4);
    const sillGeo  = new THREE.BoxGeometry(1.0, 1.0, 0.4);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x222a38, roughness: 0.9 });

    const wallL = new THREE.Mesh(wallGeoL, wallMat);
    wallL.position.set(-1.25, 1.5, 0);

    const wallR = new THREE.Mesh(wallGeoR, wallMat);
    wallR.position.set(1.25, 1.5, 0);

    const sill = new THREE.Mesh(sillGeo, wallMat);
    sill.position.set(0, 0.5, 0); // Vão da janela acima do sill

    group.add(wallL, wallR, sill);
    this.scene.add(group);

    return { id, mesh: group, x, z };
  }

  // Criador de Malha do Portão de Saída
  createExitGateMesh(x, z, name) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const frameGeo = new THREE.BoxGeometry(6, 5, 0.6);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.9 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 2.5;
    group.add(frame);

    // Luz de estado do portão (Vermelho ➔ Verde)
    const bulbGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const lightBulb = new THREE.Mesh(bulbGeo, bulbMat);
    lightBulb.position.set(0, 4.8, 0.4);
    group.add(lightBulb);

    this.scene.add(group);

    return {
      name,
      mesh: group,
      x, z,
      openProgress: 0,
      isOpen: false,
      lightBulb
    };
  }

  // Árvores e Obstáculos espalhados
  createScatteredTreesAndRocks() {
    const treeGeo = new THREE.ConeGeometry(2, 6, 6);
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 2, 6);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x0b2416, roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2e1c0c });

    for (let i = 0; i < 20; i++) {
      const rx = (Math.random() - 0.5) * 60;
      const rz = (Math.random() - 0.5) * 60;

      // Evita spawn em cima do centro
      if (Math.hypot(rx, rz) < 8) continue;

      const group = new THREE.Group();
      group.position.set(rx, 0, rz);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1;
      const leaves = new THREE.Mesh(treeGeo, treeMat);
      leaves.position.y = 4;

      group.add(trunk, leaves);
      this.scene.add(group);
      this.obstacles.push(group);
    }
  }
}
