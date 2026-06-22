// Vitest setup: in-memory chrome.storage + chrome.alarms mocks.
// Supports the full surface RateCache needs: get(null|string|array|object),
// set, remove(string|array), clear.

function makeStorageArea() {
  return {
    data: {},
    async get(keys) {
      if (keys === null || keys === undefined) {
        return { ...this.data };
      }
      if (Array.isArray(keys)) {
        const out = {};
        for (const k of keys) {
          if (this.data[k] !== undefined) out[k] = this.data[k];
        }
        return out;
      }
      if (typeof keys === 'object') {
        // keys is a defaults object
        const out = { ...keys };
        for (const k of Object.keys(keys)) {
          if (this.data[k] !== undefined) out[k] = this.data[k];
        }
        return out;
      }
      return this.data[keys] !== undefined ? { [keys]: this.data[keys] } : {};
    },
    async set(obj) {
      Object.assign(this.data, obj);
    },
    async remove(keys) {
      const arr = Array.isArray(keys) ? keys : [keys];
      for (const k of arr) delete this.data[k];
    },
    async clear() {
      this.data = {};
    }
  };
}

const local = makeStorageArea();
const sync = makeStorageArea();

globalThis.chrome = {
  storage: { local, sync },
  alarms: {
    _alarms: {},
    async create(name, info) {
      this._alarms[name] = info;
    },
    async clear(name) {
      delete this._alarms[name];
      return true;
    },
    async clearAll() {
      this._alarms = {};
      return true;
    },
    async getAll() {
      return Object.entries(this._alarms).map(([name, info]) => ({
        name,
        ...info
      }));
    },
    onAlarm: { addListener() {} }
  }
};

// Helper for tests to start from a clean store.
globalThis.__resetChromeStorage = () => {
  local.data = {};
  sync.data = {};
};
