import * as THREE from 'three';
import { scene, loadTex } from './setup.js';
import { W, H, COURT_OFFSET } from './config.js';

// ---------- mesas y sillas (zona de estar en el centro) ----------
// materiales compartidos (se cargan una sola vez)
const furnWoodArm = loadTex('fine_grained_wood_arm_1k.jpg', false, 1, 1);
const furnWoodMat = new THREE.MeshStandardMaterial({
  map: loadTex('fine_grained_wood_col_1k.jpg', true, 1, 1),
  normalMap: loadTex('fine_grained_wood_nor_gl_1k.jpg', false, 1, 1),
  roughnessMap: furnWoodArm,
  color: 0xffffff, roughness: 1, metalness: 0,
});
const furnMetalMat = new THREE.MeshStandardMaterial({ color: 0x2c3035, roughness: 0.45, metalness: 0.85 });

// textura de sombrilla: gajos de color + trama de lino real (composición multiply)
function makeUmbrellaTex() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const x = cv.getContext('2d');
  const gajos = 16, gw = cv.width / gajos;
  for (let i = 0; i < gajos; i++) { x.fillStyle = i % 2 ? '#eeeeee' : '#c0392b'; x.fillRect(i * gw, 0, gw, cv.height); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.75;
    for (let a = 0; a < cv.width; a += img.width) for (let b = 0; b < cv.height; b += img.height) x.drawImage(img, a, b);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    tex.needsUpdate = true;
  };
  img.src = 'textures/rough_linen_diff_1k.jpg';
  return tex;
}
const umbrellaMat = new THREE.MeshStandardMaterial({
  map: makeUmbrellaTex(),
  normalMap: loadTex('rough_linen_nor_gl_1k.jpg', false, 5, 5),
  roughnessMap: loadTex('rough_linen_arm_1k.jpg', false, 5, 5),
  roughness: 1, metalness: 0, side: THREE.DoubleSide,
});
umbrellaMat.normalScale = new THREE.Vector2(1.6, 1.6);

function makeTableSet(umbrella) {
  const g = new THREE.Group();
  const woodMat = furnWoodMat;
  const metalMat = furnMetalMat;

  // mesa redonda
  const topY = 0.74, topR = 0.45;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(topR, topR, 0.05, 24), woodMat);
  top.position.y = topY; top.castShadow = true; g.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, topY, 10), metalMat);
  stem.position.y = topY / 2; g.add(stem);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.04, 16), metalMat);
  foot.position.y = 0.02; g.add(foot);

  // 4 sillas
  const seatY = 0.46, ringR = 0.82;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const cx = Math.cos(a) * ringR, cz = Math.sin(a) * ringR;
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), woodMat);
    seat.position.y = seatY; seat.castShadow = true; chair.add(seat);
    const cleg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, seatY, 8), metalMat);
    cleg.position.y = seatY / 2; chair.add(cleg);
    const cfoot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 12), metalMat);
    cfoot.position.y = 0.015; chair.add(cfoot);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.04), woodMat);
    back.position.set(0, seatY + 0.2, 0.16); chair.add(back);
    chair.position.set(cx, 0, cz);
    chair.rotation.y = Math.atan2(cx, cz); // respaldo hacia afuera
    g.add(chair);
  }

  // sombrilla opcional
  if (umbrella) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 10), metalMat);
    pole.position.y = topY + 1.15; g.add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 8), umbrellaMat);
    canopy.position.y = topY + 2.2; canopy.castShadow = true; g.add(canopy);
  }
  return g;
}

export function buildTables() {
  const tableXs = [-3, 1.5, 6, 10.5, 15];
  tableXs.forEach((tx, i) => {
    const set = makeTableSet(i % 2 === 0);
    set.position.set(tx, -0.05, COURT_OFFSET / 2);
    scene.add(set);
  });
}

// ---------- tribunitas chiquitas de metal (entre los postes) ----------
const blFrameMat = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.4, metalness: 0.9 });
const blSeatMat = new THREE.MeshStandardMaterial({
  map: loadTex('fine_grained_wood_col_1k.jpg', true, 5, 0.4),
  normalMap: loadTex('fine_grained_wood_nor_gl_1k.jpg', false, 5, 0.4),
  roughnessMap: loadTex('fine_grained_wood_arm_1k.jpg', false, 5, 0.4),
  color: 0xffffff, roughness: 1, metalness: 0,
});
function makeBleacher(w) {
  const g = new THREE.Group();
  const rows = 3, rise = 0.4, run = 0.55;
  for (let i = 0; i < rows; i++) {
    const h = (i + 1) * rise, z = -i * run;
    // tabla de asiento
    const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.3), blSeatMat);
    seat.position.set(0, h, z); seat.castShadow = true; g.add(seat);
    // patas metálicas a cada lado
    [-w / 2 + 0.12, w / 2 - 0.12].forEach(sx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.05), blFrameMat);
      leg.position.set(sx, h / 2, z); leg.castShadow = true; g.add(leg);
    });
  }
  // largueros diagonales laterales (estructura)
  const dz = (rows - 1) * run, dy = (rows - 1) * rise;
  const len = Math.hypot(dz, dy) + 0.35;
  [-w / 2 + 0.12, w / 2 - 0.12].forEach(sx => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, len), blFrameMat);
    rail.position.set(sx, rise + dy / 2, -dz / 2);
    rail.rotation.x = Math.atan2(dy, dz);
    g.add(rail);
  });
  return g;
}

export function buildBleachers() {
  // una tribunita en cada vano entre postes, lado externo de cada cancha
  const bleacherXs = [-8, 0, 8];
  bleacherXs.forEach(bx => {
    const b1 = makeBleacher(5);
    b1.position.set(bx, -0.05, -(H / 2 + 1.0)); // cancha 1, mira +z
    scene.add(b1);
    const b2 = makeBleacher(5);
    b2.position.set(bx, -0.05, COURT_OFFSET + (H / 2 + 1.0)); // cancha 2, mira -z
    b2.rotation.y = Math.PI;
    scene.add(b2);
  });
}
