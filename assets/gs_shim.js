// gs_shim.js - Cloudflare static pages shim for google.script.run
// This file maps old Apps Script client calls (google.script.run.*) to fetch('/api?...').
// It keeps existing page JS unchanged (so you don't have to rewrite each HTML).

(() => {
  const API_BASE = "/api";

  const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

  function toQuery(params) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      usp.set(k, String(v));
    }
    return usp.toString();
  }

  async function callApi(name, args) {
    // Always force api=1 for Apps Script JSON mode
    const params = { api: "1" };

    // Accept both `action` and `fn` on backend; use action for consistency
    params.action = name;

    // Compatibility: some pages call submitBossDrop (old name)
    if (name === "submitBossDrop") {
      params.action = "submitDrop";
      params.type = "boss";
    }

    // 1) If first arg is an object -> treat as named params payload
    if (params.action === "submitDrop" && !("type" in params)) { params.type = "monster"; }

    if (args && args.length === 1 && isPlainObject(args[0])) {
      Object.assign(params, args[0]);
    } else {
      // 2) Otherwise, map positional args to expected parameter names
      switch (name) {
        case "getMonsterConfig":
        case "getMonsterStats":
          params.monster = args[0];
          break;
        case "getBossConfig":
        case "getBossStats":
          params.boss = args[0];
          break;
        case "getPlayerMonsterStats":
          params.player = args[0];
          params.monster = args[1];
          break;
        case "getPlayerBossStats":
          params.player = args[0];
          params.boss = args[1];
          break;
        default:
          // fallback: keep arg0, arg1... (debugEcho etc.)
          if (args && args.length) {
            args.forEach((v, i) => (params["arg" + i] = v));
          }
      }
    }

    const url = `${API_BASE}?${toQuery(params)}`;
    const resp = await fetch(url, { method: "GET", credentials: "omit" });
    const text = await resp.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error("API 回傳非 JSON：" + text.slice(0, 200));
    }

    if (!json || json.ok !== true) {
      throw new Error((json && json.error) ? json.error : "API failed");
    }
    return json.data;
  }

  function makeRunner() {
    const state = { ok: null, fail: null };

    const proxy = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "withSuccessHandler") {
            return (fn) => {
              state.ok = fn;
              return proxy;
            };
          }
          if (prop === "withFailureHandler") {
            return (fn) => {
              state.fail = fn;
              return proxy;
            };
          }
          // Actual API function call
          return (...args) => {
            callApi(String(prop), args)
              .then((data) => state.ok && state.ok(data))
              .catch((err) => state.fail && state.fail(err));
          };
        },
      }
    );
    return proxy;
  }

  // Provide a minimal google.script.run implementation
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = makeRunner();

  // Optional helper (useful for debugging)
  window.__gsCallApi = callApi;
})();
