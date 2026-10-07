/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState, Difficulty, PlayerStats, SpaceshipSkin } from '../types';
import { sfx } from '../audio';

interface GameCanvasProps {
  gameState: GameState;
  difficulty: Difficulty;
  activeSkin: SpaceshipSkin;
  isPaused: boolean;
  onStatsUpdate: (stats: PlayerStats) => void;
  onGameOver: (finalStats: PlayerStats) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  difficulty,
  activeSkin,
  isPaused,
  onStatsUpdate,
  onGameOver,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for game state tracking inside the Three.js loop without re-triggering React renders
  const stateRef = useRef<{
    gameState: GameState;
    difficulty: Difficulty;
    isPaused: boolean;
    activeSkin: SpaceshipSkin;
    score: number;
    crystals: number;
    energy: number;
    shields: number;
    speed: number;
    distance: number;
    multiplier: number;
    invulnerableTime: number; // Flash when hit
    playerX: number;
    targetPlayerX: number;
    keys: { [key: string]: boolean };
    isPointerDown: boolean;
  }>({
    gameState,
    difficulty,
    isPaused,
    activeSkin,
    score: 0,
    crystals: 0,
    energy: 100,
    shields: 3,
    speed: 1.0,
    distance: 0,
    multiplier: 1,
    invulnerableTime: 0,
    playerX: 0,
    targetPlayerX: 0,
    keys: {},
    isPointerDown: false,
  });

  // Sync React state props to the loop reference
  useEffect(() => {
    stateRef.current.gameState = gameState;
    stateRef.current.difficulty = difficulty;
    stateRef.current.isPaused = isPaused;
    stateRef.current.activeSkin = activeSkin;

    // Adjust speed and consumption based on difficulty
    if (gameState === GameState.PLAYING) {
      if (difficulty === Difficulty.EASY) {
        stateRef.current.speed = 1.0;
      } else if (difficulty === Difficulty.MEDIUM) {
        stateRef.current.speed = 1.35;
      } else {
        stateRef.current.speed = 1.7;
      }
    }
  }, [gameState, difficulty, isPaused, activeSkin]);

  // Handle resetting stats for a fresh run
  const resetGameStats = () => {
    let startSpeed = 1.0;
    if (difficulty === Difficulty.EASY) startSpeed = 1.0;
    else if (difficulty === Difficulty.MEDIUM) startSpeed = 1.35;
    else startSpeed = 1.7;

    stateRef.current.score = 0;
    stateRef.current.crystals = 0;
    stateRef.current.energy = 100;
    stateRef.current.shields = 3;
    stateRef.current.speed = startSpeed;
    stateRef.current.distance = 0;
    stateRef.current.multiplier = 1;
    stateRef.current.invulnerableTime = 0;
    stateRef.current.playerX = 0;
    stateRef.current.targetPlayerX = 0;
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // --- SETUP THREE.JS SCENE ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.007); // Dark slate blue background fog

    // --- CAMERA setup ---
    const camera = new THREE.PerspectiveCamera(
      65,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    // Position camera behind and slightly above the ship looking forward
    camera.position.set(0, 2.5, 7.5);
    camera.lookAt(0, 0.5, -5);

    // --- RENDERER setup ---
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.2); // Soft dark ambient
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x06b6d4, 1.5); // Glowing cyan direction light
    mainLight.position.set(0, 10, 5);
    scene.add(mainLight);

    // Spotlight trailing behind ship to light up track
    const spotlight = new THREE.SpotLight(0x3b82f6, 3, 30, Math.PI / 4, 0.5, 1);
    spotlight.position.set(0, 4, 10);
    spotlight.target.position.set(0, 0, -5);
    scene.add(spotlight);
    scene.add(spotlight.target);

    // Dynamic point light on player spaceship for engine glowing effect
    const shipGlowLight = new THREE.PointLight(0xff00ff, 2, 8);
    scene.add(shipGlowLight);

    // --- INTERACTIVE GROUNDS (Scrolling Cyber Highway) ---
    // We will build a neat dark highway with glowing guardrails and white wireframe grid.
    const highwayWidth = 10;
    const highwayLength = 160;

    const createHighwayGroup = (zOffset: number) => {
      const group = new THREE.Group();

      // Flat road surface
      const roadGeo = new THREE.PlaneGeometry(highwayWidth, highwayLength);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x030712, // Deep black road
        roughness: 0.9,
        metalness: 0.1,
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.y = 0;
      group.add(roadMesh);

      // Glowing Cyan Grid Overlay
      const gridHelper = new THREE.GridHelper(highwayLength, 40, 0x1e293b, 0x0891b2);
      gridHelper.rotation.x = 0;
      gridHelper.position.set(0, 0.01, 0); // Slightly above floor to prevent z-fighting
      group.add(gridHelper);

      // Left glowing guardrail
      const railGeo = new THREE.CylinderGeometry(0.12, 0.12, highwayLength, 8);
      const railMatBlue = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan glow rail
      const leftRail = new THREE.Mesh(railGeo, railMatBlue);
      leftRail.rotation.x = Math.PI / 2;
      leftRail.position.set(-highwayWidth / 2, 0.12, 0);
      group.add(leftRail);

      // Right glowing guardrail
      const rightRail = new THREE.Mesh(railGeo, railMatBlue);
      rightRail.rotation.x = Math.PI / 2;
      rightRail.position.set(highwayWidth / 2, 0.12, 0);
      group.add(rightRail);

      // Lane separator dotted lines (subtle glowing yellow)
      const lineGeo = new THREE.BoxGeometry(0.08, 0.01, 5);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
      for (let l = -highwayLength / 2; l < highwayLength / 2; l += 15) {
        // Left dotted line
        const leftDash = new THREE.Mesh(lineGeo, lineMat);
        leftDash.position.set(-highwayWidth / 4, 0.02, l);
        group.add(leftDash);
        // Right dotted line
        const rightDash = new THREE.Mesh(lineGeo, lineMat);
        rightDash.position.set(highwayWidth / 4, 0.02, l);
        group.add(rightDash);
      }

      group.position.set(0, 0, zOffset);
      return group;
    };

    // We keep 2 identical scrolling highway segments to make them loop infinitely
    const highway1 = createHighwayGroup(0);
    const highway2 = createHighwayGroup(-highwayLength);
    scene.add(highway1);
    scene.add(highway2);

    // --- STARS BACKGROUND (Space Warp Dust) ---
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSpeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Random dispersion around the highway tunnel corridor
      starPositions[i * 3] = (Math.random() - 0.5) * 60;   // X
      starPositions[i * 3 + 1] = Math.random() * 30 - 2;  // Y
      starPositions[i * 3 + 2] = -Math.random() * 150;     // Z
      starSpeeds[i] = Math.random() * 0.4 + 0.1;           // Z Warp Speed
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- SPACESHIP CREATION ---
    const shipGroup = new THREE.Group();

    // Procedural design using simple high-metalness shapes
    const updateShipSkin = (skin: SpaceshipSkin) => {
      // Clear previous spaceship geometry inside group
      while (shipGroup.children.length > 0) {
        shipGroup.remove(shipGroup.children[0]);
      }

      const shipColor = new THREE.Color(skin.color);
      const wingsColor = new THREE.Color(skin.wingColor);
      const glowColor = new THREE.Color(skin.glowColor);

      // 1. Sleek fuselage (cockpit + cone body)
      const bodyGeo = new THREE.ConeGeometry(0.35, 1.6, 6);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: shipColor,
        roughness: 0.25,
        metalness: 0.85,
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.rotation.x = Math.PI / 2; // Point forward (Z-negative)
      bodyMesh.position.set(0, 0.25, 0);
      shipGroup.add(bodyMesh);

      // Cockpit windshield (Glass)
      const glassGeo = new THREE.SphereGeometry(0.18, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.6,
        roughness: 0.05,
      });
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.scale.set(1, 0.7, 1.8);
      glassMesh.position.set(0, 0.42, -0.1);
      shipGroup.add(glassMesh);

      // 2. Wings (Left & Right)
      const wingGeo = new THREE.BoxGeometry(1.2, 0.04, 0.45);
      const wingMat = new THREE.MeshStandardMaterial({
        color: wingsColor,
        roughness: 0.3,
        metalness: 0.8,
      });

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-0.65, 0.2, 0.3);
      leftWing.rotation.y = -0.15; // swept wings
      leftWing.rotation.z = -0.1;
      shipGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(0.65, 0.2, 0.3);
      rightWing.rotation.y = 0.15;
      rightWing.rotation.z = 0.1;
      shipGroup.add(rightWing);

      // 3. Glowing Engine Exhaust Booster
      const boosterGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.3, 8);
      const boosterMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
      });
      const booster = new THREE.Mesh(boosterGeo, boosterMat);
      booster.rotation.x = Math.PI / 2;
      booster.position.set(0, 0.25, 0.8);
      shipGroup.add(booster);

      // Engine Fire Glow Mesh
      const fireGeo = new THREE.ConeGeometry(0.14, 0.5, 8);
      const fireMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.85,
      });
      const fireMesh = new THREE.Mesh(fireGeo, fireMat);
      fireMesh.rotation.x = -Math.PI / 2; // Point exhaust backward
      fireMesh.position.set(0, 0.25, 1.2);
      shipGroup.add(fireMesh);

      // Tail rudder fin
      const finGeo = new THREE.BoxGeometry(0.04, 0.45, 0.3);
      const finMesh = new THREE.Mesh(finGeo, bodyMat);
      finMesh.position.set(0, 0.6, 0.4);
      shipGroup.add(finMesh);

      shipGlowLight.color = glowColor;
    };

    // Build the spaceship model from active skin
    updateShipSkin(stateRef.current.activeSkin);
    scene.add(shipGroup);

    // Position ship initially on the grid floor
    shipGroup.position.set(0, 0.1, 3.5);

    // --- GAMEPLAY SYSTEM POOLS ---
    // Instead of spawning new objects and causing GC hiccups, we keep fixed-length arrays
    // and recycle them dynamically.
    const maxObstacles = 8;
    const maxEnergyOrbs = 5;
    const maxCoins = 6;

    const obstacles: { mesh: THREE.Mesh; active: boolean; lane: number }[] = [];
    const energyOrbs: { mesh: THREE.Mesh; active: boolean; lane: number }[] = [];
    const coins: { mesh: THREE.Mesh; active: boolean; lane: number }[] = [];

    // Geometries & Materials shared for recycling
    const obstacleGeo = new THREE.ConeGeometry(0.45, 0.9, 5); // Spike pyramid shapes
    const obstacleMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Rose pink warning
      emissive: 0x991b1b,
      roughness: 0.1,
      metalness: 0.5,
    });

    const energyGeo = new THREE.DodecahedronGeometry(0.24); // Glowing clean dodecahedrons
    const energyMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Green
    });

    const coinGeo = new THREE.OctahedronGeometry(0.18); // Gold coin octahedrons
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber Gold
      emissive: 0x78350f,
      metalness: 1.0,
      roughness: 0.1,
    });

    // Populate pools
    for (let i = 0; i < maxObstacles; i++) {
      const mesh = new THREE.Mesh(obstacleGeo, obstacleMat);
      mesh.visible = false;
      scene.add(mesh);
      obstacles.push({ mesh, active: false, lane: 0 });
    }

    for (let i = 0; i < maxEnergyOrbs; i++) {
      const mesh = new THREE.Mesh(energyGeo, energyMat);
      mesh.visible = false;
      scene.add(mesh);
      energyOrbs.push({ mesh, active: false, lane: 0 });
    }

    for (let i = 0; i < maxCoins; i++) {
      const mesh = new THREE.Mesh(coinGeo, coinMat);
      mesh.visible = false;
      scene.add(mesh);
      coins.push({ mesh, active: false, lane: 0 });
    }

    // --- PARTICLE PHYSICS SYSTEM (For collection & explosion effects) ---
    const maxParticles = 50;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(maxParticles * 3);
    const particleVelocities = new Float32Array(maxParticles * 3);
    const particleColors = new Float32Array(maxParticles * 3);
    const particleActive = new Uint8Array(maxParticles);
    const particleLife = new Float32Array(maxParticles); // remaining lifetime

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    const triggerParticleBurst = (originX: number, originY: number, originZ: number, hexColor: number, count = 12) => {
      const colorObj = new THREE.Color(hexColor);
      let assigned = 0;

      for (let i = 0; i < maxParticles && assigned < count; i++) {
        if (particleActive[i] === 0) {
          particleActive[i] = 1;
          particleLife[i] = 1.0; // Starts full

          // Set starting position
          particlePositions[i * 3] = originX;
          particlePositions[i * 3 + 1] = originY;
          particlePositions[i * 3 + 2] = originZ;

          // Set random expanding velocities
          particleVelocities[i * 3] = (Math.random() - 0.5) * 12; // Vx
          particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 6 + 2; // Vy (tends to blow upward)
          particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 12; // Vz

          // Set custom color
          particleColors[i * 3] = colorObj.r;
          particleColors[i * 3 + 1] = colorObj.g;
          particleColors[i * 3 + 2] = colorObj.b;

          assigned++;
        }
      }
      particlesGeo.attributes.position.needsUpdate = true;
      particlesGeo.attributes.color.needsUpdate = true;
    };

    // --- RECYCLING SPAWN TRIGGERS ---
    let spawnTimer = 0;
    const getLaneX = (lane: number) => {
      // Lane index -1: Left, 0: Center, 1: Right
      return lane * 2.8;
    };

    const attemptSpawnObstacle = () => {
      const free = obstacles.find((o) => !o.active);
      if (!free) return;

      const randomLane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      
      // Ensure we don't block all lanes instantly
      const blockagesInLane = obstacles.filter(o => o.active && Math.abs(o.mesh.position.z - (-140)) < 15);
      if (blockagesInLane.length >= 2) return; // Prevent absolute dead ends

      free.active = true;
      free.lane = randomLane;
      free.mesh.visible = true;
      // Position far down the highway road
      free.mesh.position.set(getLaneX(randomLane), 0.45, -140);
      free.mesh.rotation.set(0, Math.random() * Math.PI, 0);
    };

    const attemptSpawnEnergyOrb = () => {
      const free = energyOrbs.find((e) => !e.active);
      if (!free) return;

      const randomLane = Math.floor(Math.random() * 3) - 1;
      // Don't spawn collectibles exactly inside an active obstacle z-range
      const conflict = obstacles.some(o => o.active && o.lane === randomLane && o.mesh.position.z < -120);
      if (conflict) return;

      free.active = true;
      free.lane = randomLane;
      free.mesh.visible = true;
      free.mesh.position.set(getLaneX(randomLane), 0.4, -140);
    };

    const attemptSpawnCoin = () => {
      const free = coins.find((c) => !c.active);
      if (!free) return;

      const randomLane = Math.floor(Math.random() * 3) - 1;
      const conflict = obstacles.some(o => o.active && o.lane === randomLane && o.mesh.position.z < -120);
      if (conflict) return;

      free.active = true;
      free.lane = randomLane;
      free.mesh.visible = true;
      free.mesh.position.set(getLaneX(randomLane), 0.5, -140);
    };

    // --- INPUT EVENT HANDLERS ---
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse / Touch sliding tracker on parent container
    const handlePointerDown = () => {
      stateRef.current.isPointerDown = true;
    };

    const handlePointerUp = () => {
      stateRef.current.isPointerDown = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (stateRef.current.gameState !== GameState.PLAYING || stateRef.current.isPaused) return;
      
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;

      // Map client X percentage to a position between left and right walls (-4.5 to 4.5)
      const relativeX = e.clientX - bounds.left;
      const pct = relativeX / bounds.width; // 0 to 1
      const mappedX = (pct - 0.5) * 8.5; // Scale range

      // Smooth clamp to highway boundaries
      stateRef.current.targetPlayerX = Math.max(-4.4, Math.min(4.4, mappedX));
    };

    containerRef.current.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    containerRef.current.addEventListener('pointermove', handlePointerMove);

    // --- RENDER & SIMULATION LOOP ---
    let animationFrameId = 0;
    let lastTime = performance.now();
    let cameraShake = 0;

    const gameLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1); // Clamp delta to avoid huge jumps on frame drops
      lastTime = now;

      const ref = stateRef.current;

      // Handle main game states
      if (ref.gameState === GameState.PLAYING && !ref.isPaused) {
        // --- 1. HANDLE PLAYER MOVEMENT CONTROLS ---
        let steerDir = 0;
        if (ref.keys['ArrowLeft'] || ref.keys['a'] || ref.keys['A']) {
          steerDir = -1;
        } else if (ref.keys['ArrowRight'] || ref.keys['d'] || ref.keys['D']) {
          steerDir = 1;
        }

        // Steer keyboard
        if (steerDir !== 0) {
          const steerSpeed = 6.8 * delta;
          ref.targetPlayerX += steerDir * steerSpeed;
          ref.targetPlayerX = Math.max(-4.4, Math.min(4.4, ref.targetPlayerX));
        }

        // Steer smooth interpolation
        ref.playerX += (ref.targetPlayerX - ref.playerX) * 12.0 * delta;
        shipGroup.position.x = ref.playerX;

        // Space Ship visual Tilt (Z-rotation) based on current velocity slope
        const tiltFactor = -(ref.targetPlayerX - ref.playerX) * 0.35;
        shipGroup.rotation.z += (tiltFactor - shipGroup.rotation.z) * 8.0 * delta;
        // Subtle engine drift yaw
        shipGroup.rotation.y = -(ref.targetPlayerX - ref.playerX) * 0.15;

        // --- 2. UPDATE GAME METRICS OVER TIME ---
        // Distance accumulation (increases with current flight speed)
        const frameDistance = ref.speed * 42 * delta;
        ref.distance += frameDistance;

        // Continuous points accumulation
        ref.score += Math.floor(frameDistance * 0.55 * ref.multiplier);

        // Gradually drain spaceship fuel / energy (consumed faster at higher speeds/difficulties)
        let consumption = 3.8; // easy
        if (ref.difficulty === Difficulty.MEDIUM) consumption = 4.8;
        else if (ref.difficulty === Difficulty.HARD) consumption = 6.2;

        ref.energy -= consumption * delta;
        
        // Update sound engine hum pitch according to flight speed
        sfx.updateEnginePitch(ref.speed / 2.0);

        // Check if fuel is dead empty -> triggers Game Over
        if (ref.energy <= 0) {
          ref.energy = 0;
          sfx.playGameOver();
          sfx.stopEngineHum();
          onGameOver({ ...ref });
        }

        // Slowly increase difficulty speed multiplier over time (keeps it endless!)
        ref.speed += 0.007 * delta;

        // Update score multiplier based on milestones
        if (ref.score > 25000) ref.multiplier = 4;
        else if (ref.score > 10000) ref.multiplier = 3;
        else if (ref.score > 3500) ref.multiplier = 2;

        // Handle hit invulnerability timer countdown
        if (ref.invulnerableTime > 0) {
          ref.invulnerableTime -= delta;
          // Space ship flashing effect
          const flashPhase = Math.floor(now / 70) % 2;
          shipGroup.visible = flashPhase === 0;
        } else {
          shipGroup.visible = true;
        }

        // --- 3. SCROLL THE CYBER HIGHWAY GRID ---
        const scrollSpeed = ref.speed * 30 * delta;
        highway1.position.z += scrollSpeed;
        highway2.position.z += scrollSpeed;

        // Loops segments
        if (highway1.position.z >= highwayLength) {
          highway1.position.z = highway2.position.z - highwayLength;
        }
        if (highway2.position.z >= highwayLength) {
          highway2.position.z = highway1.position.z - highwayLength;
        }

        // Make spotlight glow track ahead of ship
        spotlight.target.position.set(ref.playerX, 0, -20);
        shipGlowLight.position.set(ref.playerX, 0.4, 4.0);

        // --- 4. UPDATE BACKGROUND SPARKLE DUST ---
        const positions = starGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < starCount; i++) {
          // Move stars closer to camera (Z grows positive)
          positions[i * 3 + 2] += starSpeeds[i] * ref.speed * 60 * delta;
          if (positions[i * 3 + 2] > 10) {
            positions[i * 3 + 2] = -150; // Warp back to front
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 30 - 2;
          }
        }
        starGeo.attributes.position.needsUpdate = true;

        // --- 5. GAME OBJECT POOLS LIFECYCLE (Movement & Collisions) ---
        // Spawn scheduler
        spawnTimer += delta;
        let spawnInterval = 0.8 / ref.speed; // Spawn faster as game speeds up
        if (spawnTimer >= spawnInterval) {
          spawnTimer = 0;
          const roll = Math.random();
          if (roll < 0.5) {
            attemptSpawnObstacle();
          } else if (roll < 0.75) {
            attemptSpawnEnergyOrb();
          } else {
            attemptSpawnCoin();
          }
        }

        // Move active obstacles
        obstacles.forEach((o) => {
          if (!o.active) return;
          o.mesh.position.z += scrollSpeed;
          o.mesh.rotation.y += 1.5 * delta;

          // Collision Check
          const distZ = Math.abs(o.mesh.position.z - shipGroup.position.z);
          const distX = Math.abs(o.mesh.position.x - shipGroup.position.x);

          if (distZ < 0.75 && distX < 0.7) {
            // Hit obstacle!
            o.active = false;
            o.mesh.visible = false;
            triggerParticleBurst(o.mesh.position.x, o.mesh.position.y, o.mesh.position.z, 0xf43f5e, 15);

            if (ref.invulnerableTime <= 0) {
              ref.shields -= 1;
              cameraShake = 0.45; // camera shaking force
              
              if (ref.shields <= 0) {
                // Dead crash!
                ref.shields = 0;
                sfx.playCrash();
                sfx.stopEngineHum();
                onGameOver({ ...ref });
              } else {
                // Just lost a shield, triggers warning invulnerability
                sfx.playShieldLost();
                ref.invulnerableTime = 1.6; // 1.6 seconds invulnerable flashing
              }
            }
          }

          // Recycle behind camera
          if (o.mesh.position.z > 12) {
            o.active = false;
            o.mesh.visible = false;
          }
        });

        // Move energy orbs
        energyOrbs.forEach((e) => {
          if (!e.active) return;
          e.mesh.position.z += scrollSpeed;
          e.mesh.rotation.x += 1.8 * delta;
          e.mesh.rotation.y += 1.2 * delta;

          // Collision Check
          const distZ = Math.abs(e.mesh.position.z - shipGroup.position.z);
          const distX = Math.abs(e.mesh.position.x - shipGroup.position.x);

          if (distZ < 0.75 && distX < 0.7) {
            e.active = false;
            e.mesh.visible = false;
            sfx.playCollect();
            triggerParticleBurst(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, 0x10b981, 10);
            
            // Refuel
            ref.energy = Math.min(100, ref.energy + 20); // restored 20%
          }

          // Recycle
          if (e.mesh.position.z > 12) {
            e.active = false;
            e.mesh.visible = false;
          }
        });

        // Move coins (Yellow Crystals)
        coins.forEach((c) => {
          if (!c.active) return;
          c.mesh.position.z += scrollSpeed;
          c.mesh.rotation.y += 2.5 * delta;

          // Collision Check
          const distZ = Math.abs(c.mesh.position.z - shipGroup.position.z);
          const distX = Math.abs(c.mesh.position.x - shipGroup.position.x);

          if (distZ < 0.75 && distX < 0.7) {
            c.active = false;
            c.mesh.visible = false;
            sfx.playCollect();
            triggerParticleBurst(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 0xf59e0b, 10);
            
            // Add coins
            ref.crystals += 1;
          }

          // Recycle
          if (c.mesh.position.z > 12) {
            c.active = false;
            c.mesh.visible = false;
          }
        });

        // --- 6. UPDATE BURST PARTICLE SHAPES ---
        const partPositions = particlesGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < maxParticles; i++) {
          if (particleActive[i] === 1) {
            particleLife[i] -= delta * 1.5; // decay life

            if (particleLife[i] <= 0) {
              particleActive[i] = 0;
              partPositions[i * 3] = 9999; // Move out of screen
              partPositions[i * 3 + 1] = 9999;
              partPositions[i * 3 + 2] = 9999;
            } else {
              // Apply simple drag physics and gravity
              partPositions[i * 3] += particleVelocities[i * 3] * delta;
              partPositions[i * 3 + 1] += particleVelocities[i * 3 + 1] * delta;
              partPositions[i * 3 + 2] += particleVelocities[i * 3 + 2] * delta;

              // Pull downward slightly over time (gravity effect)
              particleVelocities[i * 3 + 1] -= 9.8 * delta;
            }
          }
        }
        particlesGeo.attributes.position.needsUpdate = true;

        // Callback parent with updated state for UI rendering
        onStatsUpdate({
          score: ref.score,
          highScore: 0, // Parent handles keeping track
          crystals: 0,
          sessionCrystals: ref.crystals,
          energy: ref.energy,
          shields: ref.shields,
          speed: ref.speed,
          distance: ref.distance,
          multiplier: ref.multiplier,
        });
      } else {
        // IDLE MENU MODE (Gentle atmospheric ship hovering & stars drifting)
        shipGroup.position.x = 0;
        shipGroup.position.y = 0.25 + Math.sin(now * 0.002) * 0.1; // Gentle sine wave hovering
        shipGroup.rotation.z = Math.sin(now * 0.001) * 0.05; // Gentle wings bobbing
        shipGroup.rotation.y = now * 0.0003; // Gentle slow compass rotation

        // Ambient star scroll in main menu
        const positions = starGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < starCount; i++) {
          positions[i * 3 + 2] += starSpeeds[i] * 3.5 * delta;
          if (positions[i * 3 + 2] > 10) {
            positions[i * 3 + 2] = -150;
          }
        }
        starGeo.attributes.position.needsUpdate = true;

        // Move inactive obstacles / collectibles out of sight
        obstacles.forEach(o => { o.active = false; o.mesh.visible = false; });
        energyOrbs.forEach(e => { e.active = false; e.mesh.visible = false; });
        coins.forEach(c => { c.active = false; c.mesh.visible = false; });
      }

      // --- 7. CAMERA SHAKE / DAMAGE PHYSICS RENDERING ---
      if (cameraShake > 0.01) {
        cameraShake *= 0.9; // decay shake force
        const shakeX = (Math.random() - 0.5) * cameraShake;
        const shakeY = (Math.random() - 0.5) * cameraShake;
        camera.position.set(shakeX, 2.5 + shakeY, 7.5);
      } else {
        camera.position.set(0, 2.5, 7.5);
      }

      // Perform final render
      renderer.render(scene, camera);

      // Recursive tick
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Begin loop
    animationFrameId = requestAnimationFrame(gameLoop);

    // --- RESPONSIVE RESIZING HANDLER (ResizeObserver) ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width && height) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // --- CLEANUP DISPOSALS ON COMPONENT UNMOUNT ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      // Clear sound keys
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (containerRef.current) {
        containerRef.current.removeEventListener('pointerdown', handlePointerDown);
        containerRef.current.removeEventListener('pointermove', handlePointerMove);
      }
      window.removeEventListener('pointerup', handlePointerUp);

      // Dispose Geometries and Materials to prevent web container memory leaks
      [highway1, highway2].forEach((h) => {
        h.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.geometry.dispose();
            if (Array.isArray(node.material)) {
              node.material.forEach((mat) => mat.dispose());
            } else {
              node.material.dispose();
            }
          } else if (node instanceof THREE.LineSegments) {
            node.geometry.dispose();
            if (Array.isArray(node.material)) {
              node.material.forEach((mat) => mat.dispose());
            } else {
              node.material.dispose();
            }
          }
        });
      });

      starGeo.dispose();
      starMat.dispose();
      obstacleGeo.dispose();
      obstacleMat.dispose();
      energyGeo.dispose();
      energyMat.dispose();
      coinGeo.dispose();
      coinMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();

      // Dispose spaceship mesh elements
      shipGroup.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          if (Array.isArray(node.material)) {
            node.material.forEach((mat) => mat.dispose());
          } else {
            node.material.dispose();
          }
        }
      });

      renderer.dispose();
    };
  }, []);

  // Watch skin changes to update active mesh model procedurally inside the running loop
  useEffect(() => {
    if (gameState === GameState.MENU) {
      resetGameStats();
    }
  }, [gameState]);

  return (
    <div
      id="game-canvas-container"
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden cursor-crosshair select-none"
    >
      <canvas id="three-game-canvas" ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
