let hasChromeStorage = false;
try {
  hasChromeStorage = !!chrome.storage.sync.get;
} catch (e) {}

class Config {
  constructor(defaults, localStorageNamespace) {
    this.defaults = defaults;
    this.keys = Array.from(Object.keys(defaults));
    this.data = Object.assign({}, defaults);
    this.localStorageNamespace = localStorageNamespace;
  }
  load() {
    return new Promise(resolve => {
      if (hasChromeStorage) {
        chrome.storage.sync.get(this.keys, data => {
          this.data = Object.assign({}, this.data, data);
          resolve();
        });
      } else {
        this.keys.forEach(key => {
          this.data[key] = localStorage[`${this.localStorageNamespace}:${key}`];
        });
        resolve();
      }
    });
  }
  save() {
    return new Promise(resolve => {
      if (hasChromeStorage) {
        chrome.storage.sync.set(this.data, () => {
          resolve();
        });
      } else {
        this.keys.forEach(key => {
          localStorage[`${this.localStorageNamespace}:${key}`] = this.data[key];
        });
        resolve();
      }
    });
  }
}
