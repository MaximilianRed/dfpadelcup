/*
 * Salvataggio dei tornei nel browser (localStorage).
 * Per la versione WordPress basterà sostituire questo file con uno che
 * chiama le API REST del sito, mantenendo gli stessi metodi.
 */
(function (root) {
  'use strict';

  const INDEX_KEY = 'ppt.index.v1';
  const CURRENT_KEY = 'ppt.current.v1';
  const T_PREFIX = 'ppt.t.';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Salvataggio non riuscito', e);
      return false;
    }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignora */ }
  }

  root.PadelStorage = {
    // Elenco dei tornei salvati: [{ id, name, date, updatedAt }]
    list() {
      return read(INDEX_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
    },

    load(id) {
      return read(T_PREFIX + id, null);
    },

    save(t) {
      t.updatedAt = Date.now();
      const ok = write(T_PREFIX + t.id, t);
      const index = read(INDEX_KEY, []).filter((x) => x.id !== t.id);
      index.push({ id: t.id, name: t.name, date: t.date, updatedAt: t.updatedAt });
      write(INDEX_KEY, index);
      return ok;
    },

    remove(id) {
      remove(T_PREFIX + id);
      write(INDEX_KEY, read(INDEX_KEY, []).filter((x) => x.id !== id));
      if (this.getCurrentId() === id) this.setCurrentId(null);
    },

    getCurrentId() {
      return read(CURRENT_KEY, null);
    },

    setCurrentId(id) {
      if (id) write(CURRENT_KEY, id);
      else remove(CURRENT_KEY);
    },
  };
})(typeof self !== 'undefined' ? self : this);
