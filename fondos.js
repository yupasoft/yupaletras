/* =====================================================================
   YUPALETRAS · Fondos incluidos (Yupasoft)
   Escenas dibujadas por código en SVG (1280×720): no son fotos, no pesan y no tienen derechos de terceros.
   Cada una tiene versión quieta (miniaturas, PowerPoint, PDF) y con movimiento (pantalla de proyección):
   el movimiento son animaciones CSS dentro del propio SVG, solo de opacidad y posición.

     YLFondos.lista            [{ id, nombre }]
     YLFondos.tiene(id)        ¿existe esa escena?
     YLFondos.uri(id, mover)   la imagen como data:image/svg+xml (lista para url("…") o para <img>)
   ===================================================================== */
(function () {
  'use strict';
  // Números al azar repetibles: la misma escena sale siempre igual
  function azar(semilla) { let s = semilla >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const n = v => Math.round(v * 10) / 10;
  const grad = (id, paradas, vertical) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical === false ? 1 : 0}" y2="${vertical === false ? 0 : 1}">${paradas.map(p => `<stop offset="${p[0]}" stop-color="${p[1]}"${p[2] != null ? ` stop-opacity="${p[2]}"` : ''}/>`).join('')}</linearGradient>`;
  const halo = (id, color, op) => `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op == null ? 1 : op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  // Rayos que salen de un punto
  function rayos(cx, cy, cuantos, ancho, largo, op) {
    let r = '';
    for (let i = 0; i < cuantos; i++) {
      const a = i * 2 * Math.PI / cuantos, b = a + ancho * Math.PI / 180;
      r += `<polygon points="${cx},${cy} ${n(cx + Math.cos(a) * largo)},${n(cy + Math.sin(a) * largo)} ${n(cx + Math.cos(b) * largo)},${n(cy + Math.sin(b) * largo)}"/>`;
    }
    return `<g fill="#fff" opacity="${op}">${r}</g>`;
  }
  // Silueta de cerros: una línea quebrada suave cerrada hasta abajo
  function cerros(semilla, base, alto, paso, color) {
    const r = azar(semilla); let d = `M-20,720 L-20,${n(base)}`;
    for (let x = -20 + paso; x <= 1300 + paso; x += paso) d += ` Q${n(x - paso / 2)},${n(base - alto * (0.25 + 0.75 * r()))} ${n(x)},${n(base - alto * 0.35 * r())}`;
    return `<path d="${d} L1320,720 Z" fill="${color}"/>`;
  }
  function picos(semilla, base, alto, paso, color) {
    const r = azar(semilla); let d = `M-20,720 L-20,${n(base)}`;
    for (let x = -20; x <= 1320; x += paso) d += ` L${n(x + paso * (0.35 + 0.3 * r()))},${n(base - alto * (0.45 + 0.55 * r()))} L${n(x + paso)},${n(base - alto * 0.2 * r())}`;
    return `<path d="${d} L1320,720 Z" fill="${color}"/>`;
  }
  function estrellas(semilla, cuantas, hastaY) {
    const r = azar(semilla); let s = '';
    for (let i = 0; i < cuantas; i++) s += `<circle class="t${i % 5}" cx="${n(r() * 1280)}" cy="${n(r() * hastaY)}" r="${n(0.6 + r() * r() * 2)}"/>`;
    return `<g fill="#fff">${s}</g>`;
  }
  const TITILAR = '.t0,.t1,.t2,.t3,.t4{animation:tw 3.2s ease-in-out infinite alternate}.t1{animation-delay:-.7s;animation-duration:4.1s}.t2{animation-delay:-1.6s;animation-duration:2.6s}.t3{animation-delay:-2.3s;animation-duration:5s}.t4{animation-delay:-3s;animation-duration:3.7s}@keyframes tw{from{opacity:.2}to{opacity:1}}';

  const ESCENAS = {
    amanecer: {
      nombre: 'Amanecer',
      css: '.g{animation:pu 7s ease-in-out infinite alternate}@keyframes pu{from{opacity:.7}to{opacity:1}}.r{transform-origin:640px 600px;animation:gi 120s linear infinite}@keyframes gi{to{transform:rotate(360deg)}}',
      d: () => grad('c', [[0, '#081a3a'], [0.42, '#2f3a7c'], [0.68, '#b65a4e'], [0.86, '#f0a257'], [1, '#ffd78a']]) + halo('s', '#fff1c0', 0.95),
      c: () => '<rect width="1280" height="720" fill="url(#c)"/>'
        + `<g class="r">${rayos(640, 600, 14, 7, 1200, 0.07)}</g>`
        + '<circle class="g" cx="640" cy="600" r="460" fill="url(#s)"/>'
        + cerros(11, 560, 110, 210, '#4a3566') + cerros(23, 610, 90, 170, '#2b2350') + cerros(37, 665, 70, 140, '#131231')
    },
    cruz: {
      nombre: 'Cruz al atardecer',
      css: '.g{animation:pu 6s ease-in-out infinite alternate}@keyframes pu{from{opacity:.65}to{opacity:1}}.r{transform-origin:640px 320px;animation:gi 100s linear infinite}@keyframes gi{to{transform:rotate(360deg)}}',
      d: () => grad('c', [[0, '#150d30'], [0.4, '#54286a'], [0.72, '#d2603f'], [1, '#f6b469']]) + halo('s', '#ffe6a8', 0.9),
      c: () => '<rect width="1280" height="720" fill="url(#c)"/>'
        + `<g class="r">${rayos(640, 320, 16, 6, 1100, 0.08)}</g>`
        + '<circle class="g" cx="640" cy="320" r="380" fill="url(#s)"/>'
        + cerros(51, 600, 60, 260, '#2a1838')
        + '<path d="M-20,720 L-20,640 Q320,560 640,470 Q960,560 1300,640 L1300,720 Z" fill="#0c0917"/>'
        + '<rect x="627" y="205" width="26" height="275" fill="#0c0917"/><rect x="566" y="268" width="148" height="24" fill="#0c0917"/>'
    },
    noche: {
      nombre: 'Noche estrellada',
      css: TITILAR + '.g{animation:pu 8s ease-in-out infinite alternate}@keyframes pu{from{opacity:.6}to{opacity:1}}',
      d: () => grad('c', [[0, '#02040f'], [0.55, '#0a1a3c'], [1, '#1c3d69']]) + halo('s', '#dfe9ff', 0.55),
      c: () => '<rect width="1280" height="720" fill="url(#c)"/>' + estrellas(7, 130, 560)
        + '<circle class="g" cx="1010" cy="165" r="150" fill="url(#s)"/><circle cx="1010" cy="165" r="44" fill="#f3f0dc"/>'
        + picos(61, 600, 150, 190, '#0b1730') + picos(73, 660, 110, 150, '#050a17')
    },
    montanas: {
      nombre: 'Montañas',
      css: '.m1{animation:n1 34s ease-in-out infinite alternate}.m2{animation:n2 46s ease-in-out infinite alternate}@keyframes n1{from{transform:translateX(-90px)}to{transform:translateX(90px)}}@keyframes n2{from{transform:translateX(110px)}to{transform:translateX(-110px)}}',
      d: () => grad('c', [[0, '#0c2444'], [0.5, '#2c5a88'], [1, '#86b0d2']]) + halo('s', '#ffffff', 0.5),
      c: () => '<rect width="1280" height="720" fill="url(#c)"/>'
        + picos(81, 470, 230, 260, '#5c86ae') + '<ellipse class="m1" cx="420" cy="470" rx="620" ry="70" fill="url(#s)"/>'
        + picos(93, 540, 200, 210, '#3a648d') + '<ellipse class="m2" cx="900" cy="550" rx="700" ry="60" fill="url(#s)"/>'
        + picos(105, 620, 170, 170, '#1d3f63') + picos(117, 690, 120, 130, '#0b2038')
    },
    rayos: {
      nombre: 'Rayos de luz',
      css: '.h{transform-origin:640px -80px;animation:ba 18s ease-in-out infinite alternate}@keyframes ba{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}.h polygon{animation:pu 5s ease-in-out infinite alternate}.h polygon:nth-child(2n){animation-duration:7.5s;animation-delay:-2s}.h polygon:nth-child(3n){animation-duration:9s;animation-delay:-4s}@keyframes pu{from{opacity:.35}to{opacity:1}}',
      d: () => '<radialGradient id="c" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#3c78b8"/><stop offset="0.5" stop-color="#0d2547"/><stop offset="1" stop-color="#040915"/></radialGradient>'
        + grad('z', [[0, '#ffffff', 0.34], [1, '#ffffff', 0]]),
      c: () => {
        let p = ''; const x = [[-520, -330], [-250, -120], [-60, 70], [150, 300], [380, 470], [560, 760]];
        for (const [a, b] of x) p += `<polygon points="${620 + a * 0.06},-80 ${660 + b * 0.06},-80 ${640 + b * 1.25},760 ${640 + a * 1.25},760" fill="url(#z)"/>`;
        return '<rect width="1280" height="720" fill="url(#c)"/><g class="h">' + p + '</g>';
      }
    },
    luces: {
      nombre: 'Luces',
      css: '.b{animation:fl 18s ease-in-out infinite alternate}.b:nth-child(2n){animation-duration:25s;animation-delay:-6s}.b:nth-child(3n){animation-duration:14s;animation-delay:-9s}.b:nth-child(5n){animation-duration:31s;animation-delay:-3s}@keyframes fl{from{transform:translate(0,40px)}to{transform:translate(18px,-60px)}}',
      d: () => grad('c', [[0, '#160d2b'], [0.55, '#3b1d4c'], [1, '#7b3d3f']]) + halo('a', '#ffd9a0') + halo('b', '#ffffff') + halo('e', '#ff9fb1'),
      c: () => {
        const r = azar(131); let s = '';
        for (let i = 0; i < 30; i++) s += `<circle class="b" cx="${n(r() * 1280)}" cy="${n(r() * 720)}" r="${n(22 + r() * 80)}" fill="url(#${'abe'[i % 3]})" opacity="${n(0.12 + r() * 0.3)}"/>`;
        return '<rect width="1280" height="720" fill="url(#c)"/><g>' + s + '</g>';
      }
    },
    aurora: {
      nombre: 'Aurora',
      css: TITILAR + '.u1{animation:a1 22s ease-in-out infinite alternate}.u2{animation:a2 30s ease-in-out infinite alternate}.u3{animation:a3 26s ease-in-out infinite alternate}@keyframes a1{from{transform:translate(-80px,10px);opacity:.55}to{transform:translate(90px,-20px);opacity:1}}@keyframes a2{from{transform:translate(100px,-10px);opacity:1}to{transform:translate(-90px,25px);opacity:.5}}@keyframes a3{from{transform:translate(-40px,20px);opacity:.6}to{transform:translate(60px,-15px);opacity:1}}',
      d: () => grad('c', [[0, '#01060f'], [0.6, '#06182b'], [1, '#0c2c3c']]) + halo('a', '#2ED3B7', 0.75) + halo('b', '#5b7cfa', 0.6) + halo('e', '#b45cff', 0.5),
      c: () => '<rect width="1280" height="720" fill="url(#c)"/>' + estrellas(151, 70, 420)
        + '<g transform="rotate(-10 640 300)"><ellipse class="u1" cx="520" cy="250" rx="760" ry="120" fill="url(#a)"/><ellipse class="u2" cx="820" cy="330" rx="680" ry="95" fill="url(#b)"/><ellipse class="u3" cx="420" cy="390" rx="560" ry="80" fill="url(#e)"/></g>'
        + picos(163, 640, 120, 170, '#040b14') + picos(171, 690, 80, 120, '#02060c')
    },
    aguas: {
      nombre: 'Aguas',
      css: '.o{animation:ol 26s linear infinite}.o:nth-child(2n){animation-duration:38s}.o:nth-child(3n){animation-duration:19s;animation-direction:reverse}@keyframes ol{to{transform:translateX(-320px)}}.g{animation:pu 9s ease-in-out infinite alternate}@keyframes pu{from{opacity:.55}to{opacity:1}}',
      d: () => grad('c', [[0, '#051b29'], [0.5, '#0a3f50'], [1, '#106672']]) + halo('s', '#bff3ee', 0.45),
      c: () => {
        let s = '';
        const ola = (y, alto, op) => { let d = `M-20,${y}`; for (let x = -20; x <= 1620; x += 320) d += ` q80,${-alto} 160,0 t160,0`; return `<path class="o" d="${d} L1640,720 L-20,720 Z" fill="#fff" opacity="${op}"/>`; };
        [[300, 26, 0.05], [390, 30, 0.06], [470, 24, 0.07], [550, 34, 0.08], [630, 28, 0.1]].forEach(o => { s += ola(o[0], o[1], o[2]); });
        return '<rect width="1280" height="720" fill="url(#c)"/><ellipse class="g" cx="640" cy="120" rx="620" ry="260" fill="url(#s)"/><g>' + s + '</g>';
      }
    }
  };

  const memo = {};
  function uri(id, mover) {
    const e = ESCENAS[id]; if (!e) return '';
    const k = id + (mover ? '+' : '');
    if (!memo[k]) memo[k] = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" preserveAspectRatio="xMidYMid slice">'
      + (mover ? '<style>' + e.css + '</style>' : '') + '<defs>' + e.d() + '</defs>' + e.c() + '</svg>');
    return memo[k];
  }
  window.YLFondos = {
    lista: Object.keys(ESCENAS).map(id => ({ id, nombre: ESCENAS[id].nombre })),
    tiene: id => Object.prototype.hasOwnProperty.call(ESCENAS, id || ''),
    uri
  };
})();
