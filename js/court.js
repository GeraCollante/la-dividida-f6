import * as THREE from 'three';
import { renderer, loadTex } from './setup.js';
import { W, H, fenceH } from './config.js';
import { fenceTex, fenceMat, fencePanel, postMat, gateFrameMat } from './materials.js';

// ---------- textura del campo (líneas, generada en canvas) ----------
function makeFieldTexture() {
  const c = document.createElement('canvas');
  const scale = 50;            // px por metro
  c.width = W * scale;
  c.height = H * scale;
  const ctx = c.getContext('2d');

  // fondo transparente: las líneas van encima del pasto real
  ctx.clearRect(0, 0, c.width, c.height);

  // líneas blancas
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = scale * 0.12;
  const m = scale * 0.7; // margen

  // borde
  ctx.strokeRect(m, m, c.width - 2 * m, c.height - 2 * m);
  // línea media
  ctx.beginPath();
  ctx.moveTo(c.width / 2, m);
  ctx.lineTo(c.width / 2, c.height - m);
  ctx.stroke();
  // círculo central
  ctx.beginPath();
  ctx.arc(c.width / 2, c.height / 2, scale * 3, 0, Math.PI * 2);
  ctx.stroke();
  // punto central
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(c.width / 2, c.height / 2, scale * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // áreas rectangulares (estilo fútbol): área grande + área chica
  const ay = c.height / 2;
  const pD = scale * 5,  pW = scale * 12;   // área grande: 5m fondo × 12m ancho
  const gD = scale * 2,  gW = scale * 6;    // área chica:  2m fondo × 6m ancho
  // izquierda
  ctx.strokeRect(m, ay - pW / 2, pD, pW);
  ctx.strokeRect(m, ay - gW / 2, gD, gW);
  // derecha
  ctx.strokeRect(c.width - m - pD, ay - pW / 2, pD, pW);
  ctx.strokeRect(c.width - m - gD, ay - gW / 2, gD, gW);
  // puntos de penal (a 7m del arco)
  ctx.beginPath(); ctx.arc(m + scale * 7, ay, scale * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.width - m - scale * 7, ay, scale * 0.18, 0, Math.PI * 2); ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function post(court, x, z, h = fenceH + 0.3) {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, h, 10), postMat);
  p.position.set(x, h / 2, z);
  p.castShadow = true;
  court.add(p);
}

// portón de la jaula (abre hacia adentro)
function makeGate(dw) {
  const gate = new THREE.Group();
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.12, fenceH, 0.12), gateFrameMat); postL.position.set(0, fenceH / 2, 0);
  const postR = new THREE.Mesh(new THREE.BoxGeometry(0.12, fenceH, 0.12), gateFrameMat); postR.position.set(dw, fenceH / 2, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(dw, 0.12, 0.12), gateFrameMat); top.position.set(dw / 2, fenceH, 0);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(dw, 0.12, 0.12), gateFrameMat); bot.position.set(dw / 2, 0.06, 0);
  [postL, postR, top, bot].forEach(p => { p.castShadow = true; gate.add(p); });
  const t = fenceTex.clone(); t.needsUpdate = true; t.repeat.set(dw / 2, fenceH / 2);
  const mat = fenceMat.clone(); mat.map = t;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(dw, fenceH), mat);
  mesh.position.set(dw / 2, fenceH / 2, 0);
  gate.add(mesh);
  return gate;
}

// ---------- arco con red ----------
function makeGoal(court, side) {
  const g = new THREE.Group();
  const gw = 4, gh = 2, gd = 1.4; // ancho, alto, profundidad (arco F6)
  const barMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1 });
  const r = 0.07;
  // postes
  [-1, 1].forEach(s => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, gh, 12), barMat);
    c.position.set(0, gh / 2, s * gw / 2); c.castShadow = true; g.add(c);
  });
  // travesaño
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(r, r, gw, 12), barMat);
  cross.rotation.x = Math.PI / 2; cross.position.set(0, gh, 0); cross.castShadow = true; g.add(cross);

  // ---- red que cuelga del travesaño y cae al piso (estilo tela) ----
  const nc = document.createElement('canvas'); nc.width = nc.height = 128;
  const nx = nc.getContext('2d');
  nx.clearRect(0, 0, 128, 128);
  nx.strokeStyle = '#f4f4f4'; nx.lineWidth = 1.4;
  for (let i = 0; i <= 128; i += 9) {
    nx.beginPath(); nx.moveTo(i, 0); nx.lineTo(i, 128); nx.stroke();
    nx.beginPath(); nx.moveTo(0, i); nx.lineTo(128, i); nx.stroke();
  }
  const netTexBase = new THREE.CanvasTexture(nc);
  netTexBase.wrapS = netTexBase.wrapT = THREE.RepeatWrapping;
  netTexBase.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const netMaterial = () => new THREE.MeshStandardMaterial({
    map: netTexBase, transparent: true, alphaTest: 0.42,
    side: THREE.DoubleSide, roughness: 0.85, metalness: 0,
  });

  // perfil lateral: del travesaño (0,gh) cae con panza hasta el piso (-gd,0)
  const P0 = { x: 0, y: gh }, C = { x: -gd * 0.55, y: gh * 0.28 }, P1 = { x: -gd, y: 0 };
  const profile = t => {
    const m = 1 - t;
    return {
      x: m * m * P0.x + 2 * m * t * C.x + t * t * P1.x,
      y: m * m * P0.y + 2 * m * t * C.y + t * t * P1.y,
    };
  };
  const cell = 0.13; // tamaño del cuadro de la red (m)
  const nu = 28, nv = 18;

  // superficie principal (techo + fondo cayendo) con hamaca entre postes
  {
    const posA = [], uvA = [], idxA = [];
    for (let j = 0; j <= nv; j++) {
      const t = j / nv, p = profile(t);
      for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        const z = (u - 0.5) * gw;
        const sag = Math.sin(Math.PI * u) * Math.sin(Math.PI * t) * gh * 0.10;
        posA.push(p.x, p.y - sag, z);
        uvA.push(u * gw / cell, t * (gh + gd) / cell);
      }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c2 = a + nu + 1, d = c2 + 1;
      idxA.push(a, c2, b, b, c2, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvA, 2));
    geo.setIndex(idxA); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, netMaterial());
    mesh.castShadow = true; g.add(mesh);
  }

  // laterales: triángulo curvo entre poste, piso y la caída de la red
  [-1, 1].forEach(s => {
    const posS = [s === 1 ? 0 : 0, 0, s * gw / 2], uvS = [0, 0], idxS = [];
    for (let j = 0; j <= nv; j++) {
      const p = profile(j / nv);
      posS.push(p.x, p.y, s * gw / 2);
      uvS.push(-p.x / cell, p.y / cell);
    }
    for (let j = 1; j <= nv; j++) idxS.push(0, j, j + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posS, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvS, 2));
    geo.setIndex(idxS); geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, netMaterial()));
  });

  g.position.set(side * (W / 2 - 0.7), 0, 0);
  if (side < 0) g.rotation.y = Math.PI;
  court.add(g);
}

// ---------- construye un grupo de cancha completo (pasto + jaula + arcos + pelota) ----------
export function buildCourt() {
  const court = new THREE.Group();

  // pasto sintético (textura real con relieve)
  const gr = [W / 2.5, H / 2.5];
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshStandardMaterial({
      map: loadTex('leafy_grass_diff_1k.jpg', true, gr[0], gr[1]),
      normalMap: loadTex('leafy_grass_nor_gl_1k.jpg', false, gr[0], gr[1]),
      roughnessMap: loadTex('leafy_grass_rough_1k.jpg', false, gr[0], gr[1]),
      color: 0x5f9248, roughness: 1, metalness: 0,
    })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  court.add(grass);

  // líneas blancas (overlay encima del pasto)
  const lines = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshStandardMaterial({
      map: makeFieldTexture(), transparent: true, roughness: 0.85,
      polygonOffset: true, polygonOffsetFactor: -2,
    })
  );
  lines.rotation.x = -Math.PI / 2;
  lines.position.y = 0.012;
  court.add(lines);

  // base/borde de cemento real alrededor (vereda 2m)
  const br = [(W + 4) / 3, (H + 4) / 3];
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(W + 4, 0.4, H + 4),
    new THREE.MeshStandardMaterial({
      map: loadTex('anti_slip_concrete_diff_1k.jpg', true, br[0], br[1]),
      normalMap: loadTex('anti_slip_concrete_nor_gl_1k.jpg', false, br[0], br[1]),
      roughness: 1, metalness: 0,
    })
  );
  base.position.y = -0.21;
  base.receiveShadow = true;
  court.add(base);

  // ---------- jaula perimetral (2026-07-13: sin techo, 6 m fijos) ----------
  const dw = 2.4;              // ancho de la puerta
  const doorCx = W / 2 - 7;   // posición de la puerta sobre el lado frontal
  const group = new THREE.Group();

  // lado frontal (z = -H/2) con hueco para la puerta
  {
    const z = -H / 2;
    const leftEnd = doorCx - dw / 2;
    const rightStart = doorCx + dw / 2;
    const leftLen = leftEnd - (-W / 2);
    const rightLen = (W / 2) - rightStart;
    const left = fencePanel(leftLen, fenceH, leftLen / 2);
    left.position.set((-W / 2 + leftEnd) / 2, fenceH / 2, z);
    group.add(left);
    const right = fencePanel(rightLen, fenceH, rightLen / 2);
    right.position.set((rightStart + W / 2) / 2, fenceH / 2, z);
    group.add(right);
  }
  // lado trasero (z = +H/2) completo
  {
    const p = fencePanel(W, fenceH, W / 2);
    p.position.set(0, fenceH / 2, H / 2);
    group.add(p);
  }

  const gate = makeGate(dw);
  gate.position.set(doorCx - dw / 2, 0, -H / 2);
  gate.rotation.y = -1.15; // abierto hacia el interior de la cancha
  court.add(gate);

  // anchos (lados de 16)
  [-1, 1].forEach(s => {
    const p = fencePanel(H, fenceH, H / 2);
    p.rotation.y = Math.PI / 2;
    p.position.set(s * W / 2, fenceH / 2, 0);
    group.add(p);
  });
  court.add(group);

  // (2026-07-13: se decidió NO poner red de techo — la jaula queda solo perimetral a 6 m)

  // postes del alambrado
  for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 5) { post(court, x, -H / 2); post(court, x, H / 2); }
  for (let z = -H / 2; z <= H / 2 + 0.01; z += H / 4) { post(court, -W / 2, z); post(court, W / 2, z); }
  // postes a los lados de la puerta
  post(court, doorCx - dw / 2, -H / 2);
  post(court, doorCx + dw / 2, -H / 2);

  // arcos con red
  makeGoal(court, 1);
  makeGoal(court, -1);

  // pelota
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
  );
  ball.position.set(2, 0.22, -3); ball.castShadow = true;
  court.add(ball);

  return court;
}
