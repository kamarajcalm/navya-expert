class LocalCache {
  constructor() { }

  get(item) {
    return window.localStorage.getItem(item);
  }

  set(item, value) {
    window.localStorage.setItem(item, value);
  }

  remove(item) {
    window.localStorage.removeItem(item);
  }

  clear(item) {
    window.localStorage.clear();
  }
}

export default new LocalCache();
