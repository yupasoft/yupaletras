/* =====================================================================
   YUPALETRAS · Videos de fondo de este equipo (Yupasoft)
   Los videos que una iglesia carga para usar de fondo se quedan en ESTA computadora, dentro del
   navegador (IndexedDB). No se suben a Yupasoft ni viajan a otros equipos: así cada iglesia usa
   los videos que ella misma consiguió, con el permiso que ella tenga.
   Lo usan la página (para guardarlos y listarlos) y la ventana de proyección (para reproducirlos).

     YLVideos.listar()                       → [{ id, nombre, tam, mini, poster }]   (sin el video)
     YLVideos.guardar(archivo, {nombre, mini, poster}) → { id, nombre, tam, mini, poster }
     YLVideos.archivo(id)                    → Blob del video, o null si no está en este equipo
     YLVideos.borrar(id)
   ===================================================================== */
(function () {
  'use strict';
  const BASE = 'yupaletras', ALMACEN = 'videos';
  function abrir() {
    return new Promise((ok, mal) => {
      if (!('indexedDB' in window)) { mal(new Error('Este navegador no puede guardar videos.')); return; }
      const r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ALMACEN)) r.result.createObjectStore(ALMACEN, { keyPath: 'id' }); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error || new Error('No se pudo abrir el almacén de videos.'));
    });
  }
  // Una operación = una transacción; se resuelve cuando la transacción termina de verdad
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
  const ficha = v => ({ id: v.id, nombre: v.nombre, tam: v.tam, mini: v.mini, poster: v.poster });
  const nuevoId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  window.YLVideos = {
    async listar() { const t = await operar('readonly', s => s.getAll()); return (t || []).sort((a, b) => (a.creado || 0) - (b.creado || 0)).map(ficha); },
    async guardar(archivo, datos) {
      const v = { id: nuevoId(), nombre: String(datos.nombre || 'Video').slice(0, 60), tam: archivo.size, tipo: archivo.type, mini: datos.mini, poster: datos.poster, creado: Date.now(), blob: archivo };
      try { await operar('readwrite', s => s.put(v)); }
      catch (e) { throw new Error(/quota/i.test(String(e && (e.name || e.message))) ? 'No hay espacio en este equipo para guardar ese video. Borra alguno o usa uno más liviano.' : 'No se pudo guardar el video en este equipo.'); }
      // Se pide al navegador que no borre estos datos por su cuenta si falta espacio (puede negarse; no es un error)
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
      return ficha(v);
    },
    async archivo(id) { if (!id) return null; const v = await operar('readonly', s => s.get(id)); return v && v.blob ? v.blob : null; },
    async borrar(id) { await operar('readwrite', s => s.delete(id)); }
  };
})();
