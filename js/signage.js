import * as THREE from 'three';
import { scene, renderer } from './setup.js';
import { W, H, COURT_OFFSET } from './config.js';
import { postMat } from './materials.js';

// ---------- cartel del complejo: "LA DIVIDIDA F6" ----------
function signNameTex() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256;
  const x = cv.getContext('2d');
  x.fillStyle = '#0f2e1f'; x.fillRect(0, 0, 1024, 256);
  x.fillStyle = '#ffd24a'; x.fillRect(0, 0, 1024, 14); x.fillRect(0, 242, 1024, 14);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#ffffff'; x.font = 'bold 120px Arial, sans-serif';
  x.fillText('LA DIVIDIDA', 512, 98);
  x.fillStyle = '#ffd24a'; x.font = 'bold 66px Arial, sans-serif';
  x.fillText('— F6 —', 512, 190);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function makeSign() {
  const g = new THREE.Group();
  const sw = 9, sh = 2.2, postH = 5;
  [-1, 1].forEach(s => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, postH + sh, 12), postMat);
    p.position.set(s * (sw / 2 - 0.4), (postH + sh) / 2, 0); p.castShadow = true; g.add(p);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x0f2e1f, roughness: 0.6, metalness: 0.1 }));
  board.position.set(0, postH + sh / 2, 0); board.castShadow = true; g.add(board);
  const tex = signNameTex();
  [-1, 1].forEach(s => {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.2, sh - 0.2),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
    face.position.set(0, postH + sh / 2, s * 0.14);
    if (s < 0) face.rotation.y = Math.PI;
    g.add(face);
  });
  return g;
}

export function buildComplexSign() {
  const sign = makeSign();
  sign.position.set(0, -0.05, -(H / 2 + 4)); // al frente del predio
  scene.add(sign);
  return sign;
}

// ---------- cotas / medidas (tipo plano) ----------
function makeLabel(text) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 72;
  const x = cv.getContext('2d');
  x.fillStyle = 'rgba(18,22,28,0.88)'; x.fillRect(0, 0, 256, 72);
  x.strokeStyle = '#ffe24a'; x.lineWidth = 4; x.strokeRect(2, 2, 252, 68);
  x.fillStyle = '#ffe24a'; x.font = 'bold 40px Arial, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 38);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(4.2, 1.2, 1);
  return sp;
}

export function buildDimensions() {
  const dimsGroup = new THREE.Group();
  scene.add(dimsGroup);

  function makeDimension(ax, az, bx, bz, text) {
    const y = 0.15, col = 0xffe24a;
    const lineMat = new THREE.LineBasicMaterial({ color: col, depthTest: false });
    const add = pts => dimsGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    add([new THREE.Vector3(ax, y, az), new THREE.Vector3(bx, y, bz)]);
    const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len, t = 0.7; // perpendicular para los topes
    [[ax, az], [bx, bz]].forEach(([cx, cz]) =>
      add([new THREE.Vector3(cx + px * t, y, cz + pz * t), new THREE.Vector3(cx - px * t, y, cz - pz * t)]));
    const lab = makeLabel(text);
    lab.position.set((ax + bx) / 2, 1.1, (az + bz) / 2);
    dimsGroup.add(lab);
  }

  // medidas principales
  makeDimension(-W / 2, -(H / 2 + 2.5), W / 2, -(H / 2 + 2.5), W + ' m');          // largo cancha
  makeDimension(-(W / 2 + 2.5), -H / 2, -(W / 2 + 2.5), H / 2, H + ' m');          // ancho cancha
  makeDimension(W / 2 + 2.5, H / 2, W / 2 + 2.5, COURT_OFFSET - H / 2, (COURT_OFFSET - H) + ' m'); // pasillo central
  makeDimension(W / 2 + 4.5, -(H / 2 + 2), W / 2 + 4.5, COURT_OFFSET + H / 2 + 2, (COURT_OFFSET + H + 4) + ' m'); // largo predio
  makeDimension(-W / 2, COURT_OFFSET + H / 2 + 4, W / 2, COURT_OFFSET + H / 2 + 4, (W + 4) + ' m'); // ancho predio

  return dimsGroup;
}
