import * as THREE from 'three';
import { scene, loadTex } from './setup.js';
import { W, COURT_OFFSET } from './config.js';

// ---------- contenedor marítimo = cantina (en el medio) ----------
function stripeTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 32;
  const x = cv.getContext('2d');
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#eeeeee' : '#b8352b'; x.fillRect(i * 32, 0, 32, 32); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function signTex() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160;
  const x = cv.getContext('2d');
  x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, 512, 160);
  x.strokeStyle = '#ffd24a'; x.lineWidth = 8; x.strokeRect(10, 10, 492, 140);
  x.fillStyle = '#ffd24a'; x.font = 'bold 86px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('CANTINA', 256, 88);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeContainer() {
  const cg = new THREE.Group();
  // contenedor marítimo real de 20 pies (ISO): 6,06 × 2,44 × 2,59 m
  const L = 6.06, D = 2.44, Ht = 2.59;

  // cuerpo: chapa acanalada tipo contenedor (rojo óxido)
  const cArm = loadTex('corrugated_iron_02_arm_1k.jpg', false, 8, 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: loadTex('corrugated_iron_02_diff_1k.jpg', true, 8, 2),
    normalMap: loadTex('corrugated_iron_02_nor_gl_1k.jpg', false, 8, 2),
    roughnessMap: cArm, metalnessMap: cArm,
    color: 0xb23a2e, roughness: 1, metalness: 0.5,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, Ht, D), bodyMat);
  body.position.y = Ht / 2; body.castShadow = true; body.receiveShadow = true;
  cg.add(body);

  // marco/esquineros del contenedor
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a1c16, roughness: 0.55, metalness: 0.6 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.2, Ht, 0.2), frameMat);
    c.position.set(sx * (L / 2 - 0.1), Ht / 2, sz * (D / 2 - 0.1)); c.castShadow = true; cg.add(c);
  });
  // rieles superior e inferior
  [-1, 1].forEach(sz => {
    [0.1, Ht - 0.1].forEach(yy => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.2, 0.2), frameMat);
      rail.position.set(0, yy, sz * (D / 2 - 0.1)); cg.add(rail);
    });
  });

  // ventana de atención en el lado LARGO (cara +Z) — con el contenedor "de costadito"
  // (rotado 90°) esta cara queda mirando al pasillo/mesas, no a las canchas
  const fz = D / 2;
  const opening = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.25, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x0e1116, roughness: 0.5, metalness: 0.3 }));
  opening.position.set(0, 1.5, fz + 0.02); cg.add(opening);
  // mostrador que sale hacia adelante
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xb9b2a6, roughness: 0.5, metalness: 0.2 }));
  counter.position.set(0, 0.98, fz + 0.33); counter.castShadow = true; cg.add(counter);
  [-0.95, 0.95].forEach(cx => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.98, 0.1), frameMat);
    leg.position.set(cx, 0.49, fz + 0.58); cg.add(leg);
  });
  // toldo a rayas hacia adelante
  const awn = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 1.4),
    new THREE.MeshStandardMaterial({ map: stripeTex(), roughness: 0.8 }));
  awn.position.set(0, 2.3, fz + 0.6); awn.rotation.x = 0.3; awn.castShadow = true; cg.add(awn);

  // cartel CANTINA arriba de la ventana, misma cara
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.95),
    new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.6 }));
  sign.position.set(0, 2.15, fz + 0.02);
  cg.add(sign);

  return cg;
}

export function buildCantina() {
  const cantina = makeContainer();
  // de costadito: rotado 90° para que el lado LARGO (6 m) quede de frente al pasillo/mesas,
  // no la punta corta
  cantina.rotation.y = Math.PI / 2;
  // al fondo del pasillo entre las canchas (el centro queda libre para mesas y sillas)
  cantina.position.set(-(W / 2 - 6), 0, COURT_OFFSET / 2);
  scene.add(cantina);
  return cantina;
}
