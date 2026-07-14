import * as THREE from 'three';
import { scene, loadTex } from './setup.js';
import { fencePanel, fenceTex, fenceMat, gateFrameMat } from './materials.js';

// ---------- mapeo real (plano-2d) → escena 3D ----------
// plano-2d: LOT 100 m (Este-Oeste, eje X del plano) × 46,7 m (Norte-Sur, eje Y del plano).
// López = plano X=0 (oeste) · Alvear = plano X=100 (este)
// Lindero parcelas 34/35 = plano Y=0 (norte) · Av. 25 de Septiembre = plano Y=46,7 (sur)
// ⭐ Corregido 2026-07-13 (2da vuelta, a pedido directo): las canchas van pegadas a
// CALLE ALVEAR (este), no a López — el lado libre (reserva Fase 2, ~40 m) queda hacia López.
// Cancha 2 termina a ~5 m de Alvear, gap real 12,8 m entre canchas.
// En la escena 3D: cancha1 X:[-20,20] Z:[-10,10] · cancha2 X:[-20,20] Z:[22,42].
export const NORTH_X = -23.35;   // borde norte del lote (lindero) en X de la escena
export const SOUTH_X = 23.35;    // borde sur del lote (Av. 25 de Septiembre)
export const WEST_Z = -53;       // borde oeste del lote (Calle López) — ~40 m libres antes de cancha1
export const EAST_Z = 47;        // borde este del lote (Calle Alvear) — pegada a cancha2 (~5 m)
const STREET_W = 9;              // ancho visual de calle

function labelSprite(text, scaleX = 6, scaleY = 1.1, bg = 'rgba(20,60,30,0.92)') {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
  const x = cv.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 512, 96);
  x.strokeStyle = '#ffffff'; x.lineWidth = 4; x.strokeRect(4, 4, 504, 88);
  x.fillStyle = '#ffffff'; x.font = 'bold 44px Arial, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 256, 48);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(scaleX, scaleY, 1);
  return sp;
}

function asphaltMat(rx, ry) {
  return new THREE.MeshStandardMaterial({
    map: loadTex('anti_slip_concrete_diff_1k.jpg', true, rx, ry),
    normalMap: loadTex('anti_slip_concrete_nor_gl_1k.jpg', false, rx, ry),
    color: 0x3a3d42, roughness: 1, metalness: 0,
  });
}

// ---------- las 3 calles que bordean el predio (López, Alvear, 25 de Septiembre) ----------
export function buildStreets() {
  const spanX = SOUTH_X - NORTH_X; // 46,7 m (norte-sur)
  const spanZ = EAST_Z - WEST_Z;   // 100 m (este-oeste)
  const midX = (NORTH_X + SOUTH_X) / 2;
  const midZ = (WEST_Z + EAST_Z) / 2;

  // Calle López (oeste) — corre Norte-Sur, pegada al borde oeste del lote
  const lopez = new THREE.Mesh(
    new THREE.PlaneGeometry(spanX + STREET_W * 2, STREET_W),
    asphaltMat((spanX + STREET_W * 2) / 3, STREET_W / 3)
  );
  lopez.rotation.x = -Math.PI / 2;
  lopez.position.set(midX, -0.10, WEST_Z - STREET_W / 2);
  lopez.receiveShadow = true;
  scene.add(lopez);
  const lopezLabel = labelSprite('CALLE LÓPEZ');
  lopezLabel.position.set(midX, 2.2, WEST_Z - STREET_W / 2);
  scene.add(lopezLabel);

  // Calle Alvear (este) — corre Norte-Sur, pegada al borde este del lote
  const alvear = new THREE.Mesh(
    new THREE.PlaneGeometry(spanX + STREET_W * 2, STREET_W),
    asphaltMat((spanX + STREET_W * 2) / 3, STREET_W / 3)
  );
  alvear.rotation.x = -Math.PI / 2;
  alvear.position.set(midX, -0.10, EAST_Z + STREET_W / 2);
  alvear.receiveShadow = true;
  scene.add(alvear);
  const alvearLabel = labelSprite('CALLE ALVEAR');
  alvearLabel.position.set(midX, 2.2, EAST_Z + STREET_W / 2);
  scene.add(alvearLabel);

  // Av. 25 de Septiembre (sur) — corre Este-Oeste, pegada al borde sur del lote
  const av25 = new THREE.Mesh(
    new THREE.PlaneGeometry(STREET_W, spanZ + STREET_W * 2),
    asphaltMat(STREET_W / 3, (spanZ + STREET_W * 2) / 3)
  );
  av25.rotation.x = -Math.PI / 2;
  av25.position.set(SOUTH_X + STREET_W / 2, -0.10, midZ);
  av25.receiveShadow = true;
  scene.add(av25);
  const av25Label = labelSprite('AV. 25 DE SEPTIEMBRE', 8, 1.1);
  av25Label.position.set(SOUTH_X + STREET_W / 2, 2.2, midZ);
  scene.add(av25Label);
}

// ---------- texto del mural, fuente "Protest Strike" (Google Fonts, con fallback mientras carga) ----------
function muralTexture(text, fontReady) {
  const cv = document.createElement('canvas');
  cv.width = 2048; cv.height = 512;
  const x = cv.getContext('2d');
  x.clearRect(0, 0, cv.width, cv.height);
  x.fillStyle = '#181818';
  x.font = (fontReady ? '' : 'bold ') + '220px ' + (fontReady ? '"Protest Strike"' : 'Arial, sans-serif');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, cv.width / 2, cv.height / 2 + 10);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildMuralText(z0, z1) {
  const w = Math.min(18, (z1 - z0) - 2), h = w / 4;
  const mat = new THREE.MeshStandardMaterial({
    map: muralTexture('LA DIVIDIDA F6', false),
    transparent: true, roughness: 0.8, metalness: 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.rotation.y = Math.PI / 2;
  mesh.position.set(NORTH_X + 0.16, 3, (z0 + z1) / 2);
  scene.add(mesh);
  // reintenta con la tipografía real una vez que el navegador la termina de cargar
  document.fonts.load('220px "Protest Strike"').then(() => {
    mat.map = muralTexture('LA DIVIDIDA F6', true);
    mat.needsUpdate = true;
  }).catch(() => {});
}

// ---------- lindero norte (parcelas 34/35, vecino) — pared baja + galpón/mural + pared baja ----------
// medido desde la esquina de López (2026-07-11, ver BITACORA.md): 18,81 m pared baja (1,8 m) +
// 22,66 m galpón/mural FIJO (6 m) + ~16 m pared baja (1,8 m); después el lindero queda libre.
// ⭐ Como las canchas quedaron pegadas a Alvear, la pared se dibuja desde la esquina de LÓPEZ hacia
// atrás (mismos 3 tramos y largos), para que quede junto al complejo.
// ⭐⭐ A pedido (2026-07-13): la pared baja 2 se estira hasta topar con López — ya NO queda tramo
// libre. Ojo: esto es una decisión visual, la medida real documentada (~16 m) queda corta frente
// a los ~40 m que hay hasta López; si más adelante se confirma que el lindero real corta antes,
// hay que volver a acortar este tramo.
export function buildLindero() {
  const lowMat = new THREE.MeshStandardMaterial({
    map: loadTex('anti_slip_concrete_diff_1k.jpg', true, 4, 1),
    normalMap: loadTex('anti_slip_concrete_nor_gl_1k.jpg', false, 4, 1),
    color: 0xb5ada0, roughness: 1, metalness: 0,
  });
  // galpón pintado de blanco (mural "LA DIVIDIDA F6") — se saca el mapa difuso (era un óxido
  // oscuro y "blanco" x oscuro seguía dando oscuro); se deja el normal map para el relieve
  // acanalado y el color sólido blanco hace de pintura
  const galponMat = new THREE.MeshStandardMaterial({
    normalMap: loadTex('corrugated_iron_02_nor_gl_1k.jpg', false, 6, 2),
    color: 0xf5f4f0, roughness: 0.85, metalness: 0.1,
  });

  function wallSegment(z0, z1, height, mat) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.25, height, z1 - z0), mat);
    wall.position.set(NORTH_X, height / 2, (z0 + z1) / 2);
    wall.castShadow = true; wall.receiveShadow = true;
    scene.add(wall);
    return wall;
  }

  const zBajo1End = EAST_Z - 18.81;      // desde la esquina de Alvear, hacia López
  const zGalponEnd = zBajo1End - 22.66;

  wallSegment(zBajo1End, EAST_Z, 1.8, lowMat);       // pared baja 1 (junto a Alvear)
  wallSegment(WEST_Z, zGalponEnd, 1.8, lowMat);       // pared baja 2 — estirada hasta topar con López
  // ⭐ el mural NO se corta — el galpón queda sólido y entero (2026-07-13, corregido: el portón
  // de este pasillo es el de la reja perimetral, no uno nuevo acá).
  wallSegment(zGalponEnd, zBajo1End, 6, galponMat);

  buildMuralText(zGalponEnd, zBajo1End);
}

// ---------- reja perimetral de seguridad (2026-07-13, a pedido) ----------
// 45×60 m: arranca en la calle (Alvear) y cierra 3 lados (2 de 45 m + 1 de 60 m) — el 4° lado
// (otro de 60 m) ya lo cierra la pared del lindero (buildLindero, arriba). Postes de HORMIGÓN
// cada 4,5 m, altura 2 m.
const FENCE_H = 2;
const POST_SPACING = 4.5;

function concretePostMat() {
  return new THREE.MeshStandardMaterial({
    map: loadTex('anti_slip_concrete_diff_1k.jpg', true, 1, 2),
    normalMap: loadTex('anti_slip_concrete_nor_gl_1k.jpg', false, 1, 2),
    color: 0xc7c2b8, roughness: 1, metalness: 0,
  });
}

function fencePost(mat, x, z) {
  const h = FENCE_H + 0.2;
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, 0.18), mat);
  p.position.set(x, h / 2 - 0.1, z);
  p.castShadow = true;
  scene.add(p);
}

function postsAlong(mat, x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.round(len / POST_SPACING));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    fencePost(mat, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t);
  }
}

// ---------- portón camionero (2 hojas, 4,5 m totales) ----------
// closedAngle: orientación (rad, sobre Y) de la hoja CERRADA, medida desde +X del mundo.
// swingSign: +1/-1, hacia qué lado gira al abrir.
function truckGateLeaf(hingeX, hingeZ, closedAngle, swingSign, leafW) {
  const g = new THREE.Group();
  const postH = new THREE.Mesh(new THREE.BoxGeometry(0.14, FENCE_H, 0.14), gateFrameMat);
  postH.position.set(0, FENCE_H / 2, 0);
  const postF = new THREE.Mesh(new THREE.BoxGeometry(0.14, FENCE_H, 0.14), gateFrameMat);
  postF.position.set(leafW, FENCE_H / 2, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.1, 0.1), gateFrameMat);
  top.position.set(leafW / 2, FENCE_H, 0);
  [postH, postF, top].forEach(p => { p.castShadow = true; g.add(p); });
  const t = fenceTex.clone(); t.needsUpdate = true; t.repeat.set(leafW / 2, FENCE_H / 2);
  const mat = fenceMat.clone(); mat.map = t;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(leafW, FENCE_H), mat);
  mesh.position.set(leafW / 2, FENCE_H / 2, 0);
  g.add(mesh);
  g.position.set(hingeX, 0, hingeZ);
  g.rotation.y = closedAngle + swingSign * 1.1; // abierto hacia adentro del predio
  scene.add(g);
}

// portón sobre un lado que corre en X (a lo largo del eje X, a Z fija)
function buildTruckGateX(x0, x1, z) {
  const leafW = (x1 - x0) / 2;
  truckGateLeaf(x0, z, 0, 1, leafW);
  truckGateLeaf(x1, z, Math.PI, -1, leafW);
}

// portón sobre un lado que corre en Z (a lo largo del eje Z, a X fija)
// dir=1: abre hacia -X (para la reja de SOUTH_X, el interior del predio queda del lado -X)
// dir=-1: abre hacia +X (para el lindero de NORTH_X, el interior del predio queda del lado +X)
function buildTruckGateZ(x, z0, z1, dir = 1) {
  const leafW = (z1 - z0) / 2;
  truckGateLeaf(x, z0, -Math.PI / 2, -dir, leafW);
  truckGateLeaf(x, z1, Math.PI / 2, dir, leafW);
}

// ---------- cartel LED sobre el portón ("LA DIVIDIDA F6", fondo negro, letras brillantes) ----------
function gateSignTexture(fontReady) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256;
  const x = cv.getContext('2d');
  x.fillStyle = '#050505'; x.fillRect(0, 0, 1024, 256);
  x.fillStyle = '#ffd24a';
  x.font = (fontReady ? '' : 'bold ') + '115px ' + (fontReady ? '"Protest Strike"' : 'Arial, sans-serif');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = '#ffd24a'; x.shadowBlur = 35;
  x.fillText('LA DIVIDIDA F6', 512, 130);
  x.shadowBlur = 0;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildGateSign(x, z0, z1) {
  const postH = 3.6, spanZ = z1 - z0, midZ = (z0 + z1) / 2;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2e33, metalness: 0.5, roughness: 0.5 });
  [z0, z1].forEach(z => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, postH, 0.14), frameMat);
    p.position.set(x, postH / 2, z); p.castShadow = true; scene.add(p);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, spanZ), frameMat);
  beam.position.set(x, postH, midZ); scene.add(beam);

  // fondo negro + letras que brillan (emissive) — se nota fuerte de noche, tipo cartel LED
  // el tablero llena casi todo el marco (antes quedaba "flotando" con mucho margen a los lados)
  const boardZ = spanZ - 0.15, boardH = boardZ / 4.2;
  const boardY = postH - boardH / 2 - 0.04; // pegado al caño superior, sin hueco

  function makeMat(fontReady) {
    const tex = gateSignTexture(fontReady);
    return new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 1.6,
      color: 0x0a0a0a, roughness: 0.7,
    });
  }

  // dos caras separadas (no DoubleSide) para que el texto se lea derecho de los dos lados,
  // como en el cartel del complejo (signage.js)
  const mats = [makeMat(false), makeMat(false)];
  const boards = [1, -1].map((s, i) => {
    const board = new THREE.Mesh(new THREE.PlaneGeometry(boardZ, boardH), mats[i]);
    board.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    board.position.set(x, boardY, midZ);
    scene.add(board);
    return board;
  });

  // reintenta con la tipografía real una vez que el navegador la termina de cargar
  document.fonts.load('115px "Protest Strike"').then(() => {
    boards.forEach(board => {
      board.material.map = gateSignTexture(true);
      board.material.emissiveMap = board.material.map;
      board.material.needsUpdate = true;
    });
  }).catch(() => {});
}

const GATE_W = 4.5; // portón camionero — para que entre camión/máquina grande (motoniveladora, hidrogrúa, etc.)
// bordes Z de la reja de 60 m (lado B) — exportados para que towers.js pueda alinear ahí sus postes
export const FENCE_Z2 = EAST_Z;      // arranca en la calle Alvear
export const FENCE_Z1 = EAST_Z - 60; // 60 m hacia López

export function buildPerimeterFence() {
  const mat = concretePostMat();
  const xA = NORTH_X, xB = SOUTH_X;     // 45 m (span N-S del lote)
  const z2 = FENCE_Z2;
  const z1 = FENCE_Z1;

  // lado A (45 m, sobre la calle Alvear) — corre en X, panel entero (sin portón)
  const a = fencePanel(xB - xA, FENCE_H, (xB - xA) / 3);
  a.position.set((xA + xB) / 2, FENCE_H / 2, z2);
  scene.add(a);
  postsAlong(mat, xA, z2, xB, z2);

  // lado B (60 m, sobre Av. 25 de Septiembre, en X=SOUTH_X) — corre en Z, con el portón camionero
  // ⭐ centro del portón en Z=16 (zc, el centro real del complejo) — ahora que la torre central de
  // esta columna se dividió en 2 (Z=12 y Z=20, ver towers.js), el medio quedó libre y es la
  // posición más simétrica/lógica para el portón (a pedido, 2026-07-13).
  {
    const gateCz = 16;
    const gz0 = gateCz - GATE_W / 2, gz1 = gateCz + GATE_W / 2;
    const nearLen = gz0 - z1, farLen = z2 - gz1;
    const near = fencePanel(nearLen, FENCE_H, nearLen / 3);
    near.rotation.y = Math.PI / 2;
    near.position.set(xB, FENCE_H / 2, (z1 + gz0) / 2);
    scene.add(near);
    const far = fencePanel(farLen, FENCE_H, farLen / 3);
    far.rotation.y = Math.PI / 2;
    far.position.set(xB, FENCE_H / 2, (gz1 + z2) / 2);
    scene.add(far);
    postsAlong(mat, xB, z1, xB, gz0);
    postsAlong(mat, xB, gz1, xB, z2);
    buildTruckGateZ(xB, gz0, gz1);
    buildGateSign(xB, gz0, gz1);
  }

  // lado C (45 m, cierre lejos de la calle) — corre en X
  const c = fencePanel(xB - xA, FENCE_H, (xB - xA) / 3);
  c.position.set((xA + xB) / 2, FENCE_H / 2, z1);
  scene.add(c);
  postsAlong(mat, xA, z1, xB, z1);

  // lado D (60 m, en xA=NORTH_X): ya lo cierra la pared del lindero, no se dibuja
}

// ---------- indicador de norte ----------
export function buildCompass() {
  const n = labelSprite('N ▲', 2.2, 1.1, 'rgba(20,20,20,0.85)');
  n.position.set(NORTH_X - 3, 3, WEST_Z - 3);
  scene.add(n);
}

export function buildTerrain() {
  buildStreets();
  buildLindero();
  buildPerimeterFence();
  buildCompass();
}
