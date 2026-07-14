import * as THREE from 'three';
import { scene } from './setup.js';
import { postMat } from './materials.js';
import { W, H, COURT_OFFSET } from './config.js';
import { FENCE_Z1, FENCE_Z2 } from './terrain.js';

// ---------- torres de iluminación (coords de mundo, después de clonar las canchas) ----------
export const lampTargets = [];

function buildTower(x, z, aims, opts = {}) {
  const factor = opts.factor ?? 1;          // multiplicador de intensidad (slider lo respeta)
  const angle = opts.angle ?? Math.PI / 3;  // apertura del cono
  const h = 9;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, h, 12), postMat);
  pole.position.set(x, h / 2, z); pole.castShadow = true; scene.add(pole);
  aims.forEach(aim => {
    const head = new THREE.Group();
    head.position.set(x, h, z);
    // brazo que separa el cabezal del poste (hacia su cancha)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), postMat);
    arm.rotation.x = Math.PI / 2; arm.position.set(0, 0, 0.55);
    head.add(arm);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.35, metalness: 0.95 }));
    housing.position.set(0, 0, 1.1);
    head.add(housing);
    for (let i = -1; i <= 1; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 1 }));
      b.position.set(i * 0.6, 0, 1.1 + 0.33);
      head.add(b);
    }
    head.lookAt(aim.tx, 1, aim.tz);
    scene.add(head);
    const spot = new THREE.SpotLight(0xfff4e0, 0, 90, angle, 0.7, 1.0);
    spot.position.set(x, h, z);
    spot.target.position.set(aim.tx, 0, aim.tz);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.userData.factor = factor;
    scene.add(spot); scene.add(spot.target);
    lampTargets.push(spot);
  });
}

export function buildTowers() {
  const court1Z = 0, court2Z = COURT_OFFSET;
  const zc = (court1Z + court2Z) / 2;            // línea divisoria
  const towerXs = [-W / 2 - 2, 0, W / 2 + 2];
  const fenceX = W / 2 + 2;   // columna pegada a la reja (lado Av. 25 de Septiembre / Alvear)
  const wallX = -W / 2 - 2;   // columna pegada al lindero/mural (lado López) — 2026-07-13
  const edgeXs = [fenceX, wallX];
  const aimFor = (x, z, cz) => ({ tx: x * 0.5, tz: cz + (z - cz) * 0.45 });

  towerXs.forEach(x => {
    // ⭐ en las columnas pegadas a un borde (reja de Alvear/25Sept, o lindero/mural de López),
    // las 2 torres EXTERNAS se corren a las puntas reales de ese borde en vez de ir pegadas a
    // cada arco — así queda libre el medio para los portones (2026-07-13).
    const zOut1 = x === fenceX ? FENCE_Z1 : court1Z - (H / 2 + 2);
    const zOut2 = x === fenceX ? FENCE_Z2 : court2Z + (H / 2 + 2);

    // torres externas: 1 cabezal mirando a su cancha
    buildTower(x, zOut1, [aimFor(x, zOut1, court1Z)]);
    buildTower(x, zOut2, [aimFor(x, zOut2, court2Z)]);

    if (edgeXs.includes(x)) {
      // ⭐ en estas columnas la torre central NO puede ser una sola (quedaba pegada al borde/portón)
      // — se divide en 2 postes de un solo cabezal, uno por cancha, flanqueando el pasillo en vez
      // de compartir un único poste doble en el medio (2026-07-13).
      const zSplit1 = court1Z + (H / 2 + 2), zSplit2 = court2Z - (H / 2 + 2);
      buildTower(x, zSplit1, [aimFor(x, zSplit1, court1Z)]);
      buildTower(x, zSplit2, [aimFor(x, zSplit2, court2Z)]);
    } else {
      // torre central UNIFICADA: doble cabezal, cono angosto y atenuado (evita doble luz en el medio)
      buildTower(x, zc, [aimFor(x, zc, court1Z), aimFor(x, zc, court2Z)], { factor: 0.55, angle: Math.PI / 4.5 });
    }
  });
}
