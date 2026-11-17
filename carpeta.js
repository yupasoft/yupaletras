/* =====================================================================
   YUPALETRAS · Carpeta de esta computadora (Yupasoft)
   Además de la carpeta de Drive, cada equipo puede elegir una carpeta propia: del disco o de la red
   (por ejemplo, la del servidor). De ahí se leen solo fotos y videos, también de sus subcarpetas.
   Los PowerPoint NO se leen de aquí (decisión de Christian, 2026-11-16): van en la carpeta de Drive,
   donde se proyectan tal como son. Nada se sube: los archivos se abren donde están. El navegador recuerda la carpeta
   en ESTE equipo (IndexedDB); en otro equipo hay que elegirla ahí. Solo Chrome o Edge en computadora.

     YLCarpeta.disponible            → este navegador puede elegir carpetas
     YLCarpeta.elegir()              → abre el selector, guarda la carpeta y la devuelve (null si se cancela)
     YLCarpeta.guardada()            → la carpeta recordada, o null
     YLCarpeta.permiso(h, pedir)     → true si se puede leer (pedir = preguntar al usuario; solo dentro de un clic)
     YLCarpeta.leer(h)               → { items: [{ h, n, c, r, t }], tope }   t: 'f' foto · 'v' video
                                        n = nombre del archivo · c = subcarpeta · r = ruta dentro de la carpeta
     YLCarpeta.olvidar()
   ===================================================================== */
(function () {
  'use strict';
  const BASE = 'yupaletras-carpeta', ALMACEN = 'carpeta', CLAVE = 'raiz';
  const MAX_ARCHIVOS = 5000, MAX_FONDO = 8;
  const TIPOS = [['f', /\.(jpe?g|png|webp|gif|bmp|avif)$/i], ['v', /\.(mp4|m4v|webm|mov|mkv|ogv)$/i]];
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
    leer,
    async olvidar() { await operar('readwrite', s => s.delete(CLAVE)); }
  };
})();
