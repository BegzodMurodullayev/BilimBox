(function () {
  const USER_KEY = 'bb_user_v1';
  const STATS_KEY = 'bb_stats_v1';
  const CURRENT_BOOK_KEY = 'bb_current_book_v1';

  function normalize(input) {
    return String(input || '')
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/\/\.\//g, '/')
      .replace(/\/$/, '') || '/';
  }

  function dirnameOf(file) {
    const normalized = normalize(file);
    const parts = normalized.split('/');
    parts.pop();
    return parts.join('/') || '/';
  }

  function joinPath() {
    const parts = Array.from(arguments).filter(Boolean);
    const joined = parts.join('/');
    return normalize(joined);
  }

  function fileToUrl(filePath) {
    const normalized = normalize(filePath);
    if (normalized.startsWith('/')) return normalized;
    return '/' + normalized;
  }

  function loadJsonSafe(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadSessionJsonSafe(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function getUser() {
    return loadJsonSafe(USER_KEY, { ism: null });
  }

  function saveUser(ism) {
    saveJson(USER_KEY, { ism });
  }

  function getStats() {
    return loadJsonSafe(STATS_KEY, []);
  }

  function saveStatsEntry(payload) {
    const list = getStats();
    list.push({
      bolim: payload && payload.bolim ? String(payload.bolim) : 'nomalum',
      togriler: Number(payload && payload.togri) || 0,
      xatolar: Number(payload && payload.xato) || 0,
      sana: new Date().toISOString()
    });
    saveJson(STATS_KEY, list);
  }

  function routeFor(page) {
    return {
      menu: '/ui/menu.html',
      oyinlar: '/bolimlar/oyinlar/index.html',
      kutubxona: '/bolimlar/kutubxona/index.html',
      zakovat: '/bolimlar/zakovat/index.html',
      evrika: '/bolimlar/evrika/index.html',
      reyting: '/bolimlar/reyting/index.html',
      sozlamalar: '/bolimlar/sozlamalar/index.html'
    }[page];
  }

  function routeForGame(page) {
    return {
      raqam_top: '/bolimlar/oyinlar/raqam_top/index.html',
      x_o: '/bolimlar/oyinlar/x_o/index.html',
      tez_hisob: '/bolimlar/oyinlar/tez_hisob/index.html',
      xotira: '/bolimlar/oyinlar/xotira/index.html',
      sudoku: '/bolimlar/oyinlar/sudoku/index.html'
    }[page];
  }

  function navigate(target) {
    if (!target) return;
    window.location.href = target;
  }

  function readTextSync(filePath) {
    const normalized = normalize(filePath);
    if (window.__BB_FILE_TEXT && Object.prototype.hasOwnProperty.call(window.__BB_FILE_TEXT, normalized)) {
      return window.__BB_FILE_TEXT[normalized];
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', fileToUrl(normalized), false);
    try {
      xhr.send(null);
    } catch (error) {
      throw new Error('File read failed: ' + normalized);
    }
    if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 0) {
      return xhr.responseText;
    }
    throw new Error('File read failed: ' + normalized);
  }

  const bridge = {
    currentDir: '/',
    init(dir) {
      this.currentDir = normalize(dir);
      window.__dirname = this.currentDir;
      document.documentElement.classList.add('bb-mobile-shell');
    },
    resolveFileUrl(filePath) {
      return fileToUrl(filePath);
    },
    path: {
      join() {
        return normalize(joinPath.apply(null, arguments));
      }
    },
    fs: {
      existsSync(filePath) {
        const normalized = normalize(filePath);
        return Boolean(
          window.__BB_FILE_TEXT && Object.prototype.hasOwnProperty.call(window.__BB_FILE_TEXT, normalized)
        ) || Boolean(
          window.__BB_DIRS && Object.prototype.hasOwnProperty.call(window.__BB_DIRS, normalized)
        );
      },
      readFileSync(filePath) {
        return readTextSync(filePath);
      },
      readdirSync(dirPath) {
        const normalized = normalize(dirPath);
        return window.__BB_DIRS && window.__BB_DIRS[normalized] ? window.__BB_DIRS[normalized].slice() : [];
      }
    },
    ipcRenderer: {
      invoke(channel, payload) {
        switch (channel) {
          case 'save-ism':
            saveUser(payload);
            navigate('/ui/menu.html');
            return Promise.resolve({ ok: true });
          case 'update-ism':
            saveUser(payload);
            return Promise.resolve({ ok: true, ism: payload });
          case 'get-ism':
            return Promise.resolve(getUser().ism || null);
          case 'get-app-stats':
            return Promise.resolve({ ism: getUser().ism || null, statistika: getStats() });
          case 'save-app-stats':
            saveStatsEntry(payload || {});
            return Promise.resolve({ ok: true });
          case 'clear-app-stats':
            saveJson(STATS_KEY, []);
            return Promise.resolve({ ok: true });
          case 'reset-user':
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(STATS_KEY);
            navigate('/ui/kirish.html');
            return Promise.resolve({ ok: true });
          case 'kitob-och':
            sessionStorage.setItem(CURRENT_BOOK_KEY, JSON.stringify(payload || null));
            navigate('/bolimlar/kutubxona/reader.html');
            return Promise.resolve({ ok: true });
          case 'joriy-kitob-olish':
            return Promise.resolve(loadSessionJsonSafe(CURRENT_BOOK_KEY, null));
          case 'goto':
            navigate(routeFor(payload));
            return Promise.resolve({ ok: true });
          case 'goto-oyinlar':
            navigate(routeForGame(payload));
            return Promise.resolve({ ok: true });
          case 'close-app':
          case 'minimize-app':
          case 'toggle-maximize-app':
          case 'is-maximized-app':
            return Promise.resolve({ ok: false, mobile: true });
          default:
            return Promise.resolve({ ok: false, unknown: channel });
        }
      }
    }
  };

  window.BilimBoxBridge = bridge;
  window.require = function (name) {
    if (name === 'electron') return { ipcRenderer: bridge.ipcRenderer };
    if (name === 'fs') return bridge.fs;
    if (name === 'path') return bridge.path;
    throw new Error('Unsupported module on mobile web: ' + name);
  };
})();
