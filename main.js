import { scene } from './js/setup.js';
import { COURT_OFFSET } from './js/config.js';
import { buildCourt } from './js/court.js';
import { buildTowers } from './js/towers.js';
import { buildGround } from './js/site.js';
import { buildCantina } from './js/cantina.js';
import { buildTables, buildBleachers } from './js/furniture.js';
import { buildCorridorFence } from './js/perimeter.js';
import { buildComplexSign, buildDimensions } from './js/signage.js';
import { setDay } from './js/lighting.js';
import { setupUI } from './js/ui.js';

// ---------- las dos canchas (paralelas, la segunda es un clon de la primera) ----------
const court1 = buildCourt();
scene.add(court1);
const court2 = court1.clone();
court2.position.z = COURT_OFFSET;
scene.add(court2);

// ---------- torres de iluminación (coords de mundo, usan las dos canchas ya ubicadas) ----------
buildTowers();

// ---------- terreno, cantina, mobiliario, cerco del pasillo, cartel y cotas ----------
buildGround();
buildCantina();
buildTables();
buildBleachers();
buildCorridorFence();
buildComplexSign();
const dimsGroup = buildDimensions();

// ---------- luces / día-noche ----------
setDay();

// ---------- UI (botones, slider, resize, loop) ----------
setupUI(dimsGroup);
