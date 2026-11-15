/* =====================================================================
   YUPALETRAS · Carpeta de esta computadora (Yupasoft)
   Además de la carpeta de Drive, cada equipo puede elegir una carpeta propia: del disco o de la red
   (por ejemplo, la del servidor). De ahí se leen solo PowerPoint (.pptx), fotos y videos, también de
   sus subcarpetas. Nada se sube: los archivos se abren donde están. El navegador recuerda la carpeta
   en ESTE equipo (IndexedDB); en otro equipo hay que elegirla ahí. Solo Chrome o Edge en computadora.

     YLCarpeta.disponible            → este navegador puede elegir carpetas
     YLCarpeta.elegir()              → abre el selector, guarda la carpeta y la devuelve (null si se cancela)
     YLCarpeta.guardada()            → la carpeta recordada, o null
     YLCarpeta.permiso(h, pedir)     → true si se puede leer (pedir = preguntar al usuario; solo dentro de un clic)
     YLCarpeta.leer(h)               → { items: [{ h, n, c, r, t }], tope }   t: 'p' PowerPoint · 'f' foto · 'v' video
                                        n = nombre del archivo · c = subcarpeta · r = ruta dentro de la carpeta
     YLCarpeta.olvidar()
     YLCarpeta.leerPptx(archivo)     → { todas, diapos }  el texto de cada diapositiva (igual que la función yl-drive)
   ===================================================================== */
(function () {
  'use strict';
  const BASE = 'yupaletras-carpeta', ALMACEN = 'carpeta', CLAVE = 'raiz';
  const MAX_ARCHIVOS = 5000, MAX_FONDO = 8, MAX_DIAPOS = 300;
  const TIPOS = [['p', /\.(pptx|ppsx)$/i], ['f', /\.(jpe?g|png|webp|gif|bmp|avif)$/i], ['v', /\.(mp4|m4v|webm|mov|mkv|ogv)$/i]];
  const tipoDe = n => { for (const [t, re] of TIPOS) if (re.test(n)) return t; return null; };

  function abrir() {
    return new Promise((ok, mal) => {
      const r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ALMACEN)) r.result.createObjectStore(ALMACEN); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error || new Error('No se pudo abrir el almacén de este equipo.'));
    });
  }
  async function operar(modo, f) {
    const db = await abrir();
    try {
      return await new Promise((ok, mal) => {
        const tx = db.transaction(ALMACEN, modo); let res;
        const r = f(tx.objectStore(ALMACEN));
        if (r) r.onsuccess = () => { res = r.result; };
        tx.oncomplete = () => ok(res);
        tx.onerror = tx.onabort = () => mal(tx.error || new Error('No se pudo completar'));
      });
    } finally { db.close(); }
  }

  /* ---------- Leer la carpeta ---------- */
  async function leer(raiz) {
    const items = []; let tope = false;
    const cola = [{ h: raiz, c: '', f: 0 }];
    while (cola.length && !tope) {
      const d = cola.shift();
      try {
        for await (const [n, h] of d.h.entries()) {
          if (n[0] === '.' || n[0] === '$' || n.startsWith('~$')) continue;      // ocultos y temporales de Office
          if (h.kind === 'directory') { if (d.f < MAX_FONDO) cola.push({ h, c: d.c ? d.c + '/' + n : n, f: d.f + 1 }); continue; }
          const t = tipoDe(n); if (!t) continue;
          if (items.length >= MAX_ARCHIVOS) { tope = true; break; }
          items.push({ h, n, c: d.c, r: d.c ? d.c + '/' + n : n, t });
        }
      } catch (e) { if (d.h === raiz) throw e; }      // una subcarpeta sin permiso no detiene la lectura
    }
    items.sort((a, b) => a.r.localeCompare(b.r, 'es', { numeric: true, sensitivity: 'base' }));
    return { items, tope };
  }

  /* ---------- PowerPoint: es un ZIP; se abren solo las partes con el texto de las diapositivas ---------- */
  const bytes = async b => new Uint8Array(await b.arrayBuffer());
  async function indice(archivo) {
    const fin = await bytes(archivo.slice(Math.max(0, archivo.size - 65558))), v = new DataView(fin.buffer);
    let p = -1; for (let i = fin.length - 22; i >= 0; i--) if (v.getUint32(i, true) === 0x06054b50) { p = i; break; }
    if (p < 0) throw new Error('Ese archivo no es un PowerPoint (.pptx) válido.');
    const tam = v.getUint32(p + 12, true), pos = v.getUint32(p + 16, true);
    if (pos === 0xFFFFFFFF || tam > 32 * 1024 * 1024) throw new Error('Ese PowerPoint es demasiado grande para leerlo.');
    const cd = await bytes(archivo.slice(pos, pos + tam)), w = new DataView(cd.buffer), dec = new TextDecoder(), r = new Map();
    for (let i = 0; i + 46 <= cd.length && w.getUint32(i, true) === 0x02014b50;) {
      const nl = w.getUint16(i + 28, true);
      r.set(dec.decode(cd.subarray(i + 46, i + 46 + nl)), { met: w.getUint16(i + 10, true), ct: w.getUint32(i + 20, true), ut: w.getUint32(i + 24, true), off: w.getUint32(i + 42, true) });
      i += 46 + nl + w.getUint16(i + 30, true) + w.getUint16(i + 32, true);
    }
    return r;
  }
  async function parte(archivo, e) {
    if (!e || e.ut > 8 * 1024 * 1024) return '';
    const c = await bytes(archivo.slice(e.off, e.off + 30)), v = new DataView(c.buffer);
    if (c.length < 30 || v.getUint32(0, true) !== 0x04034b50) return '';
    const ini = e.off + 30 + v.getUint16(26, true) + v.getUint16(28, true), b = archivo.slice(ini, ini + e.ct);
    if (e.met === 0) return new TextDecoder().decode(await b.arrayBuffer());
    if (e.met !== 8 || !('DecompressionStream' in window)) return '';
    return await new Response(b.stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  }
  const XML = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const desXml = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; }
    return XML[e.toLowerCase()] || m;
  });
  async function leerPptx(archivo) {
    const z = await indice(archivo), leerP = n => parte(archivo, z.get(n));
    // Orden real: presentation.xml lista los r:id y el .rels dice a qué archivo apunta cada uno
    const destino = {};
    for (const m of (await leerP('ppt/_rels/presentation.xml.rels')).matchAll(/<Relationship\b[^>]*>/g)) {
      const id = /\bId="([^"]+)"/.exec(m[0]), tg = /\bTarget="([^"]+)"/.exec(m[0]);
      if (id && tg && /slides\/slide\d+\.xml$/.test(tg[1])) destino[id[1]] = 'ppt/' + tg[1].replace(/^\/?(ppt\/)?/, '');
    }
    let orden = [];
    for (const m of (await leerP('ppt/presentation.xml')).matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)) if (destino[m[1]]) orden.push(destino[m[1]]);
    const num = n => parseInt(n.match(/(\d+)\.xml$/)[1], 10);
    if (!orden.length) orden = [...z.keys()].filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
    const todas = [];
    for (const n of orden.slice(0, MAX_DIAPOS)) {
      const x = await leerP(n);
      if (!x || /<p:sld\b[^>]*\bshow="0"/.test(x)) continue;      // diapositiva oculta
      const lineas = [];
      for (const p of x.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g)) {
        let t = '';
        for (const r of p[1].matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>|<a:br\b[^>]*\/?>/g)) t += r[1] !== undefined ? desXml(r[1]) : '\n';
        for (const l of t.split(/[\n\u000b]/)) { const s = l.replace(/\s+/g, ' ').trim(); if (s) lineas.push(s.slice(0, 300)); }
      }
      todas.push(lineas.slice(0, 40));
    }
    return { todas, diapos: todas.filter(l => l.length) };
  }

  window.YLCarpeta = {
    disponible: typeof window.showDirectoryPicker === 'function' && 'indexedDB' in window,
    async elegir() {
      let h;
      try { h = await window.showDirectoryPicker({ id: 'yupaletras', mode: 'read' }); }
      catch (e) { if (e && e.name === 'AbortError') return null; throw new Error('No se pudo abrir esa carpeta. Prueba con otra (el navegador no deja elegir carpetas del sistema).'); }
      await operar('readwrite', s => s.put(h, CLAVE));
      return h;
    },
    async guardada() { const h = await operar('readonly', s => s.get(CLAVE)); return h && h.kind === 'directory' ? h : null; },
    async permiso(h, pedir) {
      const o = { mode: 'read' };
      if (!h.queryPermission) return true;
      if (await h.queryPermission(o) === 'granted') return true;
      return !!pedir && await h.requestPermission(o) === 'granted';
    },
    leer, leerPptx,
    async olvidar() { await operar('readwrite', s => s.delete(CLAVE)); }
  };
})();
