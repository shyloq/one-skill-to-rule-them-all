// Versioned app storage with migrations. Works in the browser (window.Store) and Node.
// v2 (key "meal-planner-v2"): {prefs, ids, checked}. v3 adds a fitness profile and target overrides.
(function (root) {
  const KEY = "meal-planner-v3", OLD_KEYS = ["meal-planner-v2"], VERSION = 3;

  const defaults = () => ({ version: VERSION, profile: null, overrides: {}, prefs: null, ids: null, checked: [] });

  // Turns any known stored shape into the current one. Unknown shapes become defaults.
  function migrate(raw) {
    if (!raw || typeof raw !== "object") return defaults();
    if (raw.version === VERSION) return { ...defaults(), ...raw };
    if (raw.prefs && Array.isArray(raw.ids) && raw.ids.every(Array.isArray)) {
      return { ...defaults(), prefs: raw.prefs, ids: raw.ids, checked: Array.isArray(raw.checked) ? raw.checked : [] };
    }
    return defaults();
  }

  // backend: anything with getItem/setItem (localStorage); falls back to memory if it throws.
  function create(backend) {
    const mem = {};
    const read = (k) => { try { const v = backend.getItem(k); return v === null || v === undefined ? mem[k] || null : v; } catch (e) { return mem[k] || null; } };
    const write = (k, v) => { mem[k] = v; try { backend.setItem(k, v); } catch (e) {} };
    const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
    return {
      load() {
        const cur = parse(read(KEY));
        if (cur) return migrate(cur);
        for (const k of OLD_KEYS) { // migrate once; the old key is left in place as a backup
          const old = parse(read(k));
          if (old) { const s = migrate(old); write(KEY, JSON.stringify(s)); return s; }
        }
        return defaults();
      },
      save(state) { write(KEY, JSON.stringify({ ...state, version: VERSION })); },
    };
  }

  const api = { KEY, VERSION, defaults, migrate, create };
  root.Store = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
