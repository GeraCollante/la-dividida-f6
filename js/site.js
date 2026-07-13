import * as THREE from 'three';
import { scene, loadTex } from './setup.js';
import { W, H, COURT_OFFSET } from './config.js';

// ---------- plaza de cemento que une el complejo + suelo de piedra del predio ----------
export function buildGround() {
  // plaza
  const plazaW = (W + 4) + 4, plazaD = (COURT_OFFSET + H + 4) + 6; // predio + margen visual
  const plazaRep = [plazaW / 2.5, plazaD / 2.5];
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(plazaW, 0.4, plazaD),
    new THREE.MeshStandardMaterial({
      map: loadTex('gravel_stones_diff_1k.jpg', true, plazaRep[0], plazaRep[1]),
      normalMap: loadTex('gravel_stones_nor_gl_1k.jpg', false, plazaRep[0], plazaRep[1]),
      roughnessMap: loadTex('gravel_stones_arm_1k.jpg', false, plazaRep[0], plazaRep[1]),
      color: 0xc4c6c8, roughness: 1, metalness: 0,
    })
  );
  plaza.position.set(0, -0.27, COURT_OFFSET / 2);
  plaza.receiveShadow = true;
  scene.add(plaza);

  // suelo de piedra gris del predio
  const pebSize = 150, pebRep = pebSize / 2;
  const pebbles = new THREE.Mesh(
    new THREE.PlaneGeometry(pebSize, pebSize),
    new THREE.MeshStandardMaterial({
      map: loadTex('gravel_stones_diff_1k.jpg', true, pebRep, pebRep),
      normalMap: loadTex('gravel_stones_nor_gl_1k.jpg', false, pebRep, pebRep),
      roughnessMap: loadTex('gravel_stones_arm_1k.jpg', false, pebRep, pebRep),
      color: 0xc4c6c8, roughness: 1, metalness: 0,
    })
  );
  pebbles.rotation.x = -Math.PI / 2;
  pebbles.position.set(0, -0.12, COURT_OFFSET / 2);
  pebbles.receiveShadow = true;
  scene.add(pebbles);
}
