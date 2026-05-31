import process from 'node:process';globalThis._importMeta_={url:import.meta.url,env:process.env};import { tmpdir } from 'node:os';
import { defineEventHandler, handleCacheHeaders, splitCookiesString, createEvent, fetchWithEvent, isEvent, eventHandler, setHeaders, createError, sendRedirect, proxyRequest, getRequestHeader, setResponseHeaders, setResponseStatus, send, getRequestHeaders, setResponseHeader, appendResponseHeader, getRequestURL, getResponseHeader, removeResponseHeader, getQuery as getQuery$1, readBody, createApp, createRouter as createRouter$1, toNodeListener, lazyEventHandler, getResponseStatus, getRouterParam, getResponseStatusText } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/h3/dist/index.mjs';
import { Server } from 'node:http';
import { resolve, dirname, join } from 'node:path';
import crypto$1 from 'node:crypto';
import { parentPort, threadId } from 'node:worker_threads';
import { escapeHtml } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/@vue/shared/dist/shared.cjs.js';
import viteNodeEntry_mjs from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/@nuxt/vite-builder/dist/vite-node-entry.mjs';
import { viteNodeFetch } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/@nuxt/vite-builder/dist/vite-node.mjs';
import { createRenderer, getRequestDependencies, getPreloadLinks, getPrefetchLinks } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import { parseURL, withoutBase, joinURL, getQuery, withQuery, withTrailingSlash, decodePath, withLeadingSlash, withoutTrailingSlash, encodePath, joinRelativeURL } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/ufo/dist/index.mjs';
import { renderToString } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/vue/server-renderer/index.mjs';
import destr, { destr as destr$1 } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/destr/dist/index.mjs';
import { createHooks } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/hookable/dist/index.mjs';
import { createFetch, Headers as Headers$1 } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/ofetch/dist/node.mjs';
import { fetchNodeRequestHandler, callNodeRequestHandler } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/node-mock-http/dist/index.mjs';
import { createStorage, defineDriver, prefixStorage } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/unstorage/dist/index.mjs';
import unstorage_47drivers_47fs from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/unstorage/drivers/fs.mjs';
import fsDriver from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/unstorage/drivers/fs-lite.mjs';
import lruCache from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/unstorage/drivers/lru-cache.mjs';
import { digest, hash as hash$1 } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/ohash/dist/index.mjs';
import { klona } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/klona/dist/index.mjs';
import defu, { defuFn } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/defu/dist/defu.mjs';
import { snakeCase } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/scule/dist/index.mjs';
import { getContext } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/unctx/dist/index.mjs';
import { toRouteMatcher, createRouter } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/radix3/dist/index.mjs';
import { readFile } from 'node:fs/promises';
import consola, { consola as consola$1 } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/consola/dist/index.mjs';
import { ErrorParser } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/youch-core/build/index.js';
import { Youch } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/youch/build/index.js';
import { SourceMapConsumer } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/source-map/source-map.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { stringify, uneval } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/devalue/index.js';
import { captureRawStackTrace, parseRawStackTrace } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/errx/dist/index.js';
import { isVNode, isRef, toValue } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/vue/index.mjs';
import _wH6JrtIxmaSoA8lCPWFnE9z4lQeXW6H5z3l5aymEQw from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/@nuxt/vite-builder/dist/fix-stacktrace.mjs';
import { promises } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname as dirname$1, resolve as resolve$1 } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/pathe/dist/index.mjs';
import { createHead as createHead$1, propsToString, renderSSRHead } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/unhead/dist/server.mjs';
import { DeprecationsPlugin, PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/unhead/dist/plugins.mjs';
import { walkResolver } from 'file:///Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/unhead/dist/utils.mjs';

const serverAssets = [{"baseName":"server","dir":"/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/server/assets"}];

const assets$1 = createStorage();

for (const asset of serverAssets) {
  assets$1.mount(asset.baseName, unstorage_47drivers_47fs({ base: asset.dir, ignore: (asset?.ignore || []) }));
}

// @ts-check


/**
 * @param {string} item
 */
function normalizeFsKey (item) {
  const safe = item.replace(/[^\w.-]/g, '_');
  const prefix = safe.slice(0, 20);
  const hash = crypto$1.createHash('sha256').update(item).digest('hex');
  return `${prefix}-${hash}`
}

const _47Users_47zhangliu_47Documents_47private_47model_45test_47trae_45test_454_47watch_45service_45system_47node_modules_47_64nuxt_47nitro_45server_47dist_47runtime_47utils_47cache_45driver_46js = defineDriver(
  /**
   * @param {{ base?: string }} opts
   */
  (opts) => {
    const fs = fsDriver({ base: opts.base });
    const lru = lruCache({ max: 1000 });

    return {
      ...fs, // fall back to file system - only the bottom three methods are used in renderer
      async setItem (key, value, opts) {
        await Promise.all([
          fs.setItem?.(normalizeFsKey(key), value, opts),
          lru.setItem?.(key, value, opts),
        ]);
      },
      async hasItem (key, opts) {
        return await lru.hasItem(key, opts) || await fs.hasItem(normalizeFsKey(key), opts)
      },
      async getItem (key, opts) {
        return await lru.getItem(key, opts) || await fs.getItem(normalizeFsKey(key), opts)
      },
    }
  },
);

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('root', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system","watchOptions":{"ignored":[null]}}));
storage.mount('src', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/server","watchOptions":{"ignored":[null]}}));
storage.mount('cache:nuxt:payload', _47Users_47zhangliu_47Documents_47private_47model_45test_47trae_45test_454_47watch_45service_45system_47node_modules_47_64nuxt_47nitro_45server_47dist_47runtime_47utils_47cache_45driver_46js({"driver":"/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/node_modules/@nuxt/nitro-server/dist/runtime/utils/cache-driver.js","base":"/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/.nuxt/cache/nuxt/payload"}));
storage.mount('build', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/.nuxt"}));
storage.mount('cache', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/.nuxt/cache"}));
storage.mount('data', unstorage_47drivers_47fs({"driver":"fs","base":"/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system/.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const inlineAppConfig = {
  "nuxt": {}
};



const appConfig = defuFn(inlineAppConfig);

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "dev",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      }
    }
  },
  "public": {}
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

getContext("nitro-app", {
  asyncContext: false,
  AsyncLocalStorage: void 0
});

function isPathInScope(pathname, base) {
  let canonical;
  try {
    const pre = pathname.replace(/%2f/gi, "/").replace(/%5c/gi, "\\");
    canonical = new URL(pre, "http://_").pathname;
  } catch {
    return false;
  }
  return !base || canonical === base || canonical.startsWith(base + "/");
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function isJsonRequest(event) {
	
	if (hasReqHeader(event, "accept", "text/html")) {
		return false;
	}
	return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
	const value = getRequestHeader(event, name);
	return !!(value && typeof value === "string" && value.toLowerCase().includes(includes));
}

const iframeStorageBridge = (nonce) => `
(function () {
  const NONCE = ${JSON.stringify(nonce)};
  const memoryStore = Object.create(null);

  const post = (type, payload) => {
    window.parent.postMessage({ type, nonce: NONCE, ...payload }, '*');
  };

  const isValid = (data) => data && data.nonce === NONCE;

  const mockStorage = {
    getItem(key) {
      return Object.hasOwn(memoryStore, key)
        ? memoryStore[key]
        : null;
    },
    setItem(key, value) {
      const v = String(value);
      memoryStore[key] = v;
      post('storage-set', { key, value: v });
    },
    removeItem(key) {
      delete memoryStore[key];
      post('storage-remove', { key });
    },
    clear() {
      for (const key of Object.keys(memoryStore))
        delete memoryStore[key];
      post('storage-clear', {});
    },
    key(index) {
      const keys = Object.keys(memoryStore);
      return keys[index] ?? null;
    },
    get length() {
      return Object.keys(memoryStore).length;
    }
  };

  const defineLocalStorage = () => {
    try {
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: false,
        configurable: true
      });
    } catch {
      window.localStorage = mockStorage;
    }
  };

  defineLocalStorage();

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!isValid(data) || data.type !== 'storage-sync-data') return;

    const incoming = data.data || {};
    for (const key of Object.keys(incoming))
      memoryStore[key] = incoming[key];

    if (typeof window.initTheme === 'function')
      window.initTheme();
    window.dispatchEvent(new Event('storage-ready'));
  });

  // Clipboard API is unavailable in data: URL iframe, so we use postMessage
  document.addEventListener('DOMContentLoaded', function() {
    window.copyErrorMessage = function(button) {
      post('clipboard-copy', { text: button.dataset.errorText });
      button.classList.add('copied');
      setTimeout(function() { button.classList.remove('copied'); }, 2000);
    };
  });

  post('storage-sync-request', {});
})();
`;
const parentStorageBridge = (nonce) => `
(function () {
  const host = document.querySelector('nuxt-error-overlay');
  if (!host) return;

  const NONCE = ${JSON.stringify(nonce)};
  const isValid = (data) => data && data.nonce === NONCE;

  // Handle clipboard copy from iframe
  window.addEventListener('message', function(e) {
    if (isValid(e) && e.data.type === 'clipboard-copy') {
      navigator.clipboard.writeText(e.data.text).catch(function() {});
    }
  });

  const collectLocalStorage = () => {
    const all = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k != null) all[k] = localStorage.getItem(k);
    }
    return all;
  };

  const attachWhenReady = () => {
    const root = host.shadowRoot;
    if (!root)
      return false;
    const iframe = root.getElementById('frame');
    if (!iframe || !iframe.contentWindow)
      return false;

    const handlers = {
      'storage-set': (d) => localStorage.setItem(d.key, d.value),
      'storage-remove': (d) => localStorage.removeItem(d.key),
      'storage-clear': () => localStorage.clear(),
      'storage-sync-request': () => {
        iframe.contentWindow.postMessage({
          type: 'storage-sync-data',
          data: collectLocalStorage(),
          nonce: NONCE
        }, '*');
      }
    };

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!isValid(data)) return;
      const fn = handlers[data.type];
      if (fn) fn(data);
    });

    return true;
  };

  if (attachWhenReady())
    return;

  const obs = new MutationObserver(() => {
    if (attachWhenReady())
      obs.disconnect();
  });

  obs.observe(host, { childList: true, subtree: true });
})();
`;
const errorCSS = `
:host {
  --preview-width: 240px;
  --preview-height: 180px;
  --base-width: 1200px;
  --base-height: 900px;
  --z-base: 999999998;
  --error-pip-left: auto;
  --error-pip-top: auto;
  --error-pip-right: 5px;
  --error-pip-bottom: 5px;
  --error-pip-origin: bottom right;
  --app-preview-left: auto;
  --app-preview-top: auto;
  --app-preview-right: 5px;
  --app-preview-bottom: 5px;
  all: initial;
  display: contents;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
#frame {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  border: none;
  z-index: var(--z-base);
}
#frame[inert] {
  left: var(--error-pip-left);
  top: var(--error-pip-top);
  right: var(--error-pip-right);
  bottom: var(--error-pip-bottom);
  width: var(--base-width);
  height: var(--base-height);
  transform: scale(calc(240 / 1200));
  transform-origin: var(--error-pip-origin);
  overflow: hidden;
  border-radius: calc(1200 * 8px / 240);
}
#preview {
  position: fixed;
  left: var(--app-preview-left);
  top: var(--app-preview-top);
  right: var(--app-preview-right);
  bottom: var(--app-preview-bottom);
  width: var(--preview-width);
  height: var(--preview-height);
  overflow: hidden;
  border-radius: 6px;
  pointer-events: none;
  z-index: var(--z-base);
  background: white;
  display: none;
}
#preview iframe {
  transform-origin: var(--error-pip-origin);
}
#frame:not([inert]) + #preview {
  display: block;
}
#toggle {
  position: fixed;
  left: var(--app-preview-left);
  top: var(--app-preview-top);
  right: calc(var(--app-preview-right) - 3px);
  bottom: calc(var(--app-preview-bottom) - 3px);
  width: var(--preview-width);
  height: var(--preview-height);
  background: none;
  border: 3px solid #00DC82;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s, box-shadow 0.2s;
  z-index: calc(var(--z-base) + 1);
  display: flex;
  align-items: center;
  justify-content: center;
}
#toggle:hover,
#toggle:focus {
  opacity: 1;
  box-shadow: 0 0 20px rgba(0, 220, 130, 0.6);
}
#toggle:focus-visible {
  outline: 3px solid #00DC82;
  outline-offset: 0;
  box-shadow: 0 0 24px rgba(0, 220, 130, 0.8);
}
#frame[inert] ~ #toggle {
  left: var(--error-pip-left);
  top: var(--error-pip-top);
  right: calc(var(--error-pip-right) - 3px);
  bottom: calc(var(--error-pip-bottom) - 3px);
  cursor: grab;
}
:host(.dragging) #frame[inert] ~ #toggle {
  cursor: grabbing;
}
#frame:not([inert]) ~ #toggle,
#frame:not([inert]) + #preview {
  cursor: grab;
}
:host(.dragging-preview) #frame:not([inert]) ~ #toggle,
:host(.dragging-preview) #frame:not([inert]) + #preview {
  cursor: grabbing;
}

#pip-close {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
}
#pip-close:focus-visible {
  outline: 2px solid #00DC82;
  outline-offset: 2px;
}

#pip-restore {
  position: fixed;
  right: 16px;
  bottom: 16px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 2px solid #00DC82;
  background: #111;
  color: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  z-index: calc(var(--z-base) + 2);
  cursor: grab;
}
#pip-restore:focus-visible {
  outline: 2px solid #00DC82;
  outline-offset: 2px;
}
:host(.dragging-restore) #pip-restore {
  cursor: grabbing;
}

#frame[hidden],
#toggle[hidden],
#preview[hidden],
#pip-restore[hidden],
#pip-close[hidden] {
  display: none !important;
}

@media (prefers-reduced-motion: reduce) {
  #toggle {
    transition: none;
  }
}
`;
function webComponentScript(base64HTML, startMinimized) {
	return `
(function () {
  try {
    // =========================
    // Host + Shadow
    // =========================
    const host = document.querySelector('nuxt-error-overlay');
    if (!host)
      return;
    const shadow = host.attachShadow({ mode: 'open' });

    // =========================
    // DOM helpers
    // =========================
    const el = (tag) => document.createElement(tag);
    const on = (node, type, fn, opts) => node.addEventListener(type, fn, opts);
    const hide = (node, v) => node.toggleAttribute('hidden', !!v);
    const setVar = (name, value) => host.style.setProperty(name, value);
    const unsetVar = (name) => host.style.removeProperty(name);

    // =========================
    // Create DOM
    // =========================
    const style = el('style');
    style.textContent = ${JSON.stringify(errorCSS)};

    const iframe = el('iframe');
    iframe.id = 'frame';
    iframe.src = 'data:text/html;base64,${base64HTML}';
    iframe.title = 'Detailed error stack trace';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-top-navigation-by-user-activation');

    const preview = el('div');
    preview.id = 'preview';

    const toggle = el('div');
    toggle.id = 'toggle';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.innerHTML = '<span class="sr-only">Toggle detailed error view</span>';

    const liveRegion = el('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only';

    const pipCloseButton = el('button');
    pipCloseButton.id = 'pip-close';
    pipCloseButton.setAttribute('type', 'button');
    pipCloseButton.setAttribute('aria-label', 'Hide error preview overlay');
    pipCloseButton.innerHTML = '&times;';
    pipCloseButton.hidden = true;
    toggle.appendChild(pipCloseButton);

    const pipRestoreButton = el('button');
    pipRestoreButton.id = 'pip-restore';
    pipRestoreButton.setAttribute('type', 'button');
    pipRestoreButton.setAttribute('aria-label', 'Show error overlay');
    pipRestoreButton.innerHTML = '<span aria-hidden="true">⟲</span><span>Show error overlay</span>';
    pipRestoreButton.hidden = true;

    // Order matters: #frame + #preview adjacency
    shadow.appendChild(style);
    shadow.appendChild(liveRegion);
    shadow.appendChild(iframe);
    shadow.appendChild(preview);
    shadow.appendChild(toggle);
    shadow.appendChild(pipRestoreButton);

    // =========================
    // Constants / keys
    // =========================
    const POS_KEYS = {
      position: 'nuxt-error-overlay:position',
      hiddenPretty: 'nuxt-error-overlay:error-pip:hidden',
      hiddenPreview: 'nuxt-error-overlay:app-preview:hidden'
    };

    const CSS_VARS = {
      pip: {
        left: '--error-pip-left',
        top: '--error-pip-top',
        right: '--error-pip-right',
        bottom: '--error-pip-bottom'
      },
      preview: {
        left: '--app-preview-left',
        top: '--app-preview-top',
        right: '--app-preview-right',
        bottom: '--app-preview-bottom'
      }
    };

    const MIN_GAP = 5;
    const DRAG_THRESHOLD = 2;

    // =========================
    // Local storage safe access + state
    // =========================
    let storageReady = true;
    let isPrettyHidden = false;
    let isPreviewHidden = false;

    const safeGet = (k) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    };

    const safeSet = (k, v) => {
      if (!storageReady) 
        return;
      try {
        localStorage.setItem(k, v);
      } catch {}
    };

    // =========================
    // Sizing helpers
    // =========================
    const vvSize = () => {
      const v = window.visualViewport;
      return v ? { w: v.width, h: v.height } : { w: window.innerWidth, h: window.innerHeight };
    };

    const previewSize = () => {
      const styles = getComputedStyle(host);
      const w = parseFloat(styles.getPropertyValue('--preview-width')) || 240;
      const h = parseFloat(styles.getPropertyValue('--preview-height')) || 180;
      return { w, h };
    };

    const sizeForTarget = (target) => {
      if (!target)
        return previewSize();
      const rect = target.getBoundingClientRect();
      if (rect.width && rect.height)
        return { w: rect.width, h: rect.height };
      return previewSize();
    };

    // =========================
    // Dock model + offset/alignment calculations
    // =========================
    const dock = { edge: null, offset: null, align: null, gap: null };

    const maxOffsetFor = (edge, size) => {
      const vv = vvSize();
      if (edge === 'left' || edge === 'right')
        return Math.max(MIN_GAP, vv.h - size.h - MIN_GAP);
      return Math.max(MIN_GAP, vv.w - size.w - MIN_GAP);
    };

    const clampOffset = (edge, value, size) => {
      const max = maxOffsetFor(edge, size);
      return Math.min(Math.max(value, MIN_GAP), max);
    };

    const updateDockAlignment = (size) => {
      if (!dock.edge || dock.offset == null)
        return;
      const max = maxOffsetFor(dock.edge, size);
      if (dock.offset <= max / 2) {
        dock.align = 'start';
        dock.gap = dock.offset;
      } else {
        dock.align = 'end';
        dock.gap = Math.max(0, max - dock.offset);
      }
    };

    const appliedOffsetFor = (size) => {
      if (!dock.edge || dock.offset == null)
        return null;
      const max = maxOffsetFor(dock.edge, size);

      if (dock.align === 'end' && typeof dock.gap === 'number') {
        return clampOffset(dock.edge, max - dock.gap, size);
      }
      if (dock.align === 'start' && typeof dock.gap === 'number') {
        return clampOffset(dock.edge, dock.gap, size);
      }
      return clampOffset(dock.edge, dock.offset, size);
    };

    const nearestEdgeAt = (x, y) => {
      const { w, h } = vvSize();
      const d = { left: x, right: w - x, top: y, bottom: h - y };
      return Object.keys(d).reduce((a, b) => (d[a] < d[b] ? a : b));
    };

    const cornerDefaultDock = () => {
      const vv = vvSize();
      const size = previewSize();
      const offset = Math.max(MIN_GAP, vv.w - size.w - MIN_GAP);
      return { edge: 'bottom', offset };
    };

    const currentTransformOrigin = () => {
      if (!dock.edge) return null;
      if (dock.edge === 'left' || dock.edge === 'top')
        return 'top left';
      if (dock.edge === 'right')
        return 'top right';
      return 'bottom left';
    };

    // =========================
    // Persist / load dock
    // =========================
    const loadDock = () => {
      const raw = safeGet(POS_KEYS.position);
      if (!raw)
        return;
      try {
        const parsed = JSON.parse(raw);
        const { edge, offset, align, gap } = parsed || {};
        if (!['left', 'right', 'top', 'bottom'].includes(edge))
          return;
        if (typeof offset !== 'number')
          return;

        dock.edge = edge;
        dock.offset = clampOffset(edge, offset, previewSize());
        dock.align = align === 'start' || align === 'end' ? align : null;
        dock.gap = typeof gap === 'number' ? gap : null;

        if (!dock.align || dock.gap == null)
          updateDockAlignment(previewSize());
      } catch {}
    };

    const persistDock = () => {
      if (!dock.edge || dock.offset == null)
        return; 
      safeSet(POS_KEYS.position, JSON.stringify({
        edge: dock.edge,
        offset: dock.offset,
        align: dock.align,
        gap: dock.gap
      }));
    };

    // =========================
    // Apply dock
    // =========================
    const dockToVars = (vars) => ({
      set: (side, v) => host.style.setProperty(vars[side], v),
      clear: (side) => host.style.removeProperty(vars[side])
    });

    const dockToEl = (node) => ({
      set: (side, v) => { node.style[side] = v; },
      clear: (side) => { node.style[side] = ''; }
    });

    const applyDock = (target, size, opts) => {
      if (!dock.edge || dock.offset == null) {
        target.clear('left');
        target.clear('top');
        target.clear('right');
        target.clear('bottom');
        return;
      }

      target.set('left', 'auto');
      target.set('top', 'auto');
      target.set('right', 'auto');
      target.set('bottom', 'auto');

      const applied = appliedOffsetFor(size);

      if (dock.edge === 'left') {
        target.set('left', MIN_GAP + 'px');
        target.set('top', applied + 'px');
      } else if (dock.edge === 'right') {
        target.set('right', MIN_GAP + 'px');
        target.set('top', applied + 'px');
      } else if (dock.edge === 'top') {
        target.set('top', MIN_GAP + 'px');
        target.set('left', applied + 'px');
      } else {
        target.set('bottom', MIN_GAP + 'px');
        target.set('left', applied + 'px');
      }

      if (!opts || opts.persist !== false)
        persistDock();
    };

    const applyDockAll = (opts) => {
      applyDock(dockToVars(CSS_VARS.pip), previewSize(), opts);
      applyDock(dockToVars(CSS_VARS.preview), previewSize(), opts);
      applyDock(dockToEl(pipRestoreButton), sizeForTarget(pipRestoreButton), opts);
    };

    const repaintToDock = () => {
      if (!dock.edge || dock.offset == null)
        return;
      const origin = currentTransformOrigin();
      if (origin)
        setVar('--error-pip-origin', origin);
      else 
        unsetVar('--error-pip-origin');
      applyDockAll({ persist: false });
    };

    // =========================
    // Hidden state + UI
    // =========================
    const loadHidden = () => {
      const rawPretty = safeGet(POS_KEYS.hiddenPretty);
      if (rawPretty != null)
        isPrettyHidden = rawPretty === '1' || rawPretty === 'true';
      const rawPreview = safeGet(POS_KEYS.hiddenPreview);
      if (rawPreview != null)
        isPreviewHidden = rawPreview === '1' || rawPreview === 'true';
    };

    const setPrettyHidden = (v) => {
      isPrettyHidden = !!v;
      safeSet(POS_KEYS.hiddenPretty, isPrettyHidden ? '1' : '0');
      updateUI();
    };

    const setPreviewHidden = (v) => {
      isPreviewHidden = !!v;
      safeSet(POS_KEYS.hiddenPreview, isPreviewHidden ? '1' : '0');
      updateUI();
    };

    const isMinimized = () => iframe.hasAttribute('inert');

    const setMinimized = (v) => {
      if (v) {
        iframe.setAttribute('inert', '');
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        iframe.removeAttribute('inert');
        toggle.setAttribute('aria-expanded', 'true');
      }
    };

    const setRestoreLabel = (kind) => {
      if (kind === 'pretty') {
        pipRestoreButton.innerHTML = '<span aria-hidden="true">⟲</span><span>Show error overlay</span>';
        pipRestoreButton.setAttribute('aria-label', 'Show error overlay');
      } else {
        pipRestoreButton.innerHTML = '<span aria-hidden="true">⟲</span><span>Show error page</span>';
        pipRestoreButton.setAttribute('aria-label', 'Show error page');
      }
    };

    const updateUI = () => {
      const minimized = isMinimized();
      const showPiP = minimized && !isPrettyHidden;
      const showPreview = !minimized && !isPreviewHidden;
      const pipHiddenByUser = minimized && isPrettyHidden;
      const previewHiddenByUser = !minimized && isPreviewHidden;
      const showToggle = minimized ? showPiP : showPreview;
      const showRestore = pipHiddenByUser || previewHiddenByUser;

      hide(iframe, pipHiddenByUser);
      hide(preview, !showPreview);
      hide(toggle, !showToggle);
      hide(pipCloseButton, !showToggle);
      hide(pipRestoreButton, !showRestore);

      pipCloseButton.setAttribute('aria-label', minimized ? 'Hide error overlay' : 'Hide error page preview');

      if (pipHiddenByUser)
        setRestoreLabel('pretty');
      else if (previewHiddenByUser)
        setRestoreLabel('preview');

      host.classList.toggle('pip-hidden', isPrettyHidden);
      host.classList.toggle('preview-hidden', isPreviewHidden);
    };

    // =========================
    // Preview snapshot
    // =========================
    const updatePreview = () => {
      try {
        let previewIframe = preview.querySelector('iframe');
        if (!previewIframe) {
          previewIframe = el('iframe');
          previewIframe.style.cssText = 'width: 1200px; height: 900px; transform: scale(0.2); transform-origin: top left; border: none;';
          previewIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
          preview.appendChild(previewIframe);
        }

        const doctype = document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>' : '';
        const cleanedHTML = document.documentElement.outerHTML
          .replace(/<nuxt-error-overlay[^>]*>.*?<\\/nuxt-error-overlay>/gs, '')
          .replace(/<script[^>]*>.*?<\\/script>/gs, '');

        const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(doctype + cleanedHTML);
        iframeDoc.close();
      } catch (err) {
        console.error('Failed to update preview:', err);
      }
    };

    // =========================
    // View toggling
    // =========================
    const toggleView = () => {
      if (isMinimized()) {
        updatePreview();
        setMinimized(false);
        liveRegion.textContent = 'Showing detailed error view';
        setTimeout(() => { 
          try { 
            iframe.contentWindow.focus();
          } catch {}
        }, 100);
      } else {
        setMinimized(true);
        liveRegion.textContent = 'Showing error page';
        repaintToDock();
        void iframe.offsetWidth;
      }
      updateUI();
    };

    // =========================
    // Dragging (unified, rAF throttled)
    // =========================
    let drag = null;
    let rafId = null;
    let suppressToggleClick = false;
    let suppressRestoreClick = false;

    const beginDrag = (e) => {
      if (drag) 
        return;

      if (!dock.edge || dock.offset == null) {
        const def = cornerDefaultDock();
        dock.edge = def.edge;
        dock.offset = def.offset;
        updateDockAlignment(previewSize());
      }

      const isRestoreTarget = e.currentTarget === pipRestoreButton;

      drag = {
        kind: isRestoreTarget ? 'restore' : (isMinimized() ? 'pip' : 'preview'),
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
        target: e.currentTarget
      };

      drag.target.setPointerCapture(e.pointerId);

      if (drag.kind === 'restore')
        host.classList.add('dragging-restore');
      else 
        host.classList.add(drag.kind === 'pip' ? 'dragging' : 'dragging-preview');

      e.preventDefault();
    };

    const moveDrag = (e) => {
      if (!drag || drag.pointerId !== e.pointerId)
        return;

      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      
      const dx = drag.lastX - drag.startX;
      const dy = drag.lastY - drag.startY;

      if (!drag.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        drag.moved = true;
      }

      if (!drag.moved)
        return;
      if (rafId)
        return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        const edge = nearestEdgeAt(drag.lastX, drag.lastY);
        const size = sizeForTarget(drag.target);

        let offset;
        if (edge === 'left' || edge === 'right') {
          const top = drag.lastY - (size.h / 2);
          offset = clampOffset(edge, Math.round(top), size);
        } else {
          const left = drag.lastX - (size.w / 2);
          offset = clampOffset(edge, Math.round(left), size);
        }

        dock.edge = edge;
        dock.offset = offset;
        updateDockAlignment(size);

        const origin = currentTransformOrigin();
        setVar('--error-pip-origin', origin || 'bottom right');

        applyDockAll({ persist: false });
      });
    };

    const endDrag = (e) => {
      if (!drag || drag.pointerId !== e.pointerId)
        return;

      const endedKind = drag.kind;
      drag.target.releasePointerCapture(e.pointerId);

      if (endedKind === 'restore')
        host.classList.remove('dragging-restore');
      else 
        host.classList.remove(endedKind === 'pip' ? 'dragging' : 'dragging-preview');

      const didMove = drag.moved;
      drag = null;

      if (didMove) {
        persistDock();
        if (endedKind === 'restore')
          suppressRestoreClick = true;
        else 
          suppressToggleClick = true;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const bindDragTarget = (node) => {
      on(node, 'pointerdown', beginDrag);
      on(node, 'pointermove', moveDrag);
      on(node, 'pointerup', endDrag);
      on(node, 'pointercancel', endDrag);
    };

    bindDragTarget(toggle);
    bindDragTarget(pipRestoreButton);

    // =========================
    // Events (toggle / close / restore)
    // =========================
    on(toggle, 'click', (e) => {
      if (suppressToggleClick) {
        e.preventDefault();
        suppressToggleClick = false;
        return;
      }
      toggleView();
    });

    on(toggle, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleView();
      }
    });

    on(pipCloseButton, 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isMinimized())
        setPrettyHidden(true);
      else
        setPreviewHidden(true);
    });

    on(pipCloseButton, 'pointerdown', (e) => {
      e.stopPropagation();
    });

    on(pipRestoreButton, 'click', (e) => {
      if (suppressRestoreClick) {
        e.preventDefault();
        suppressRestoreClick = false;
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (isMinimized()) 
        setPrettyHidden(false);
      else 
        setPreviewHidden(false);
    });

    // =========================
    // Lifecycle: load / sync / repaint
    // =========================
    const loadState = () => {
      loadDock();
      loadHidden();

      if (isPrettyHidden && !isMinimized())
        setMinimized(true);

      updateUI();
      repaintToDock();
    };

    loadState();

    on(window, 'storage-ready', () => {
      storageReady = true;
      loadState();
    });

    const onViewportChange = () => repaintToDock();

    on(window, 'resize', onViewportChange);

    if (window.visualViewport) {
      on(window.visualViewport, 'resize', onViewportChange);
      on(window.visualViewport, 'scroll', onViewportChange);
    }

    // initial preview
    setTimeout(updatePreview, 100);

    // initial minimized option
    if (${startMinimized}) {
      setMinimized(true);
      repaintToDock();
      void iframe.offsetWidth;
      updateUI();
    }
  } catch (err) {
    console.error('Failed to initialize Nuxt error overlay:', err);
  }
})();
`;
}
function generateErrorOverlayHTML(html, options) {
	const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
	const errorPage = html.replace("<head>", `<head><script>${iframeStorageBridge(nonce)}<\/script>`);
	const base64HTML = Buffer.from(errorPage, "utf8").toString("base64");
	return `
    <script>${parentStorageBridge(nonce)}<\/script>
    <nuxt-error-overlay></nuxt-error-overlay>
    <script>${webComponentScript(base64HTML, options?.startMinimized ?? false)}<\/script>
  `;
}

const errorHandler$0 = (async function errorhandler(error, event, { defaultHandler }) {
	if (event.handled || isJsonRequest(event)) {
		
		return;
	}
	
	const defaultRes = await defaultHandler(error, event, { json: true });
	
	const status = error.status || error.statusCode || 500;
	if (status === 404 && defaultRes.status === 302) {
		setResponseHeaders(event, defaultRes.headers);
		setResponseStatus(event, defaultRes.status, defaultRes.statusText);
		return send(event, JSON.stringify(defaultRes.body, null, 2));
	}
	if (typeof defaultRes.body !== "string" && Array.isArray(defaultRes.body.stack)) {
		
		defaultRes.body.stack = defaultRes.body.stack.join("\n");
	}
	const errorObject = defaultRes.body;
	
	const url = new URL(errorObject.url);
	errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
	
	errorObject.message = error.unhandled ? errorObject.message || "Server Error" : error.message || errorObject.message || "Server Error";
	
	errorObject.data ||= error.data;
	errorObject.statusText ||= error.statusText || error.statusMessage;
	delete defaultRes.headers["content-type"];
	delete defaultRes.headers["content-security-policy"];
	setResponseHeaders(event, defaultRes.headers);
	
	const reqHeaders = getRequestHeaders(event);
	
	const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"] || !!event.context.nuxt?.["~rendering-error"];
	if (!isRenderingError) {
		event.context.nuxt ||= {};
		event.context.nuxt["~rendering-error"] = true;
	}
	
	const res = isRenderingError ? null : await useNitroApp().localFetch(withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject), {
		headers: {
			...reqHeaders,
			"x-nuxt-error": "true"
		},
		redirect: "manual"
	}).catch(() => null);
	if (event.handled) {
		return;
	}
	
	if (!res) {
		const { template } = await Promise.resolve().then(function () { return error500; });
		{
			
			errorObject.description = errorObject.message;
		}
		setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
		return send(event, template(errorObject));
	}
	const html = await res.text();
	for (const [header, value] of res.headers.entries()) {
		if (header === "set-cookie") {
			appendResponseHeader(event, header, value);
			continue;
		}
		setResponseHeader(event, header, value);
	}
	setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
	if (!globalThis._importMeta_.test && typeof html === "string") {
		const prettyResponse = await defaultHandler(error, event, { json: false });
		if (typeof prettyResponse.body === "string") {
			return send(event, html.replace("</body>", `${generateErrorOverlayHTML(prettyResponse.body, { startMinimized: 300 <= status && status < 500 })}</body>`));
		}
	}
	return send(event, html);
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  async function defaultNitroErrorHandler(error, event) {
    const res = await defaultHandler(error, event);
    if (!event.node?.res.headersSent) {
      setResponseHeaders(event, res.headers);
    }
    setResponseStatus(event, res.status, res.statusText);
    return send(
      event,
      typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2)
    );
  }
);
async function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  await loadStackTrace(error).catch(consola.error);
  const youch = new Youch();
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    const ansiError = await (await youch.toANSI(error)).replaceAll(process.cwd(), ".");
    consola.error(
      `[request error] ${tags} [${event.method}] ${url}

`,
      ansiError
    );
  }
  const useJSON = opts?.json ?? !getRequestHeader(event, "accept")?.includes("text/html");
  const headers = {
    "content-type": useJSON ? "application/json" : "text/html",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';"
  };
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = useJSON ? {
    error: true,
    url,
    statusCode,
    statusMessage,
    message: error.message,
    data: error.data,
    stack: error.stack?.split("\n").map((line) => line.trim())
  } : await youch.toHTML(error, {
    request: {
      url: url.href,
      method: event.method,
      headers: getRequestHeaders(event)
    }
  });
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}
async function loadStackTrace(error) {
  if (!(error instanceof Error)) {
    return;
  }
  const parsed = await new ErrorParser().defineSourceLoader(sourceLoader).parse(error);
  const stack = error.message + "\n" + parsed.frames.map((frame) => fmtFrame(frame)).join("\n");
  Object.defineProperty(error, "stack", { value: stack });
  if (error.cause) {
    await loadStackTrace(error.cause).catch(consola.error);
  }
}
async function sourceLoader(frame) {
  if (!frame.fileName || frame.fileType !== "fs" || frame.type === "native") {
    return;
  }
  if (frame.type === "app") {
    const rawSourceMap = await readFile(`${frame.fileName}.map`, "utf8").catch(() => {
    });
    if (rawSourceMap) {
      const consumer = await new SourceMapConsumer(rawSourceMap);
      const originalPosition = consumer.originalPositionFor({ line: frame.lineNumber, column: frame.columnNumber });
      if (originalPosition.source && originalPosition.line) {
        frame.fileName = resolve(dirname(frame.fileName), originalPosition.source);
        frame.lineNumber = originalPosition.line;
        frame.columnNumber = originalPosition.column || 0;
      }
    }
  }
  const contents = await readFile(frame.fileName, "utf8").catch(() => {
  });
  return contents ? { contents } : void 0;
}
function fmtFrame(frame) {
  if (frame.type === "native") {
    return frame.raw;
  }
  const src = `${frame.fileName || ""}:${frame.lineNumber}:${frame.columnNumber})`;
  return frame.functionName ? `at ${frame.functionName} (${src}` : `at ${src}`;
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const script = `
if (!window.__NUXT_DEVTOOLS_TIME_METRIC__) {
  Object.defineProperty(window, '__NUXT_DEVTOOLS_TIME_METRIC__', {
    value: {},
    enumerable: false,
    configurable: true,
  })
}
window.__NUXT_DEVTOOLS_TIME_METRIC__.appInit = Date.now()
`;

const _Qd8pQkavo8bJj8FDHTICBhzaCVLbDMJ6QpNP6NGtQhM = (function(nitro) {
  nitro.hooks.hook("render:html", (htmlContext) => {
    htmlContext.head.push(`<script>${script}<\/script>`);
  });
});

const rootDir = "/Users/zhangliu/Documents/private/model-test/trae-test-4/watch-service-system";

const appHead = {"meta":[{"charset":"utf-8"},{"name":"viewport","content":"width=device-width, initial-scale=1"},{"name":"description","content":"钟表售后管理系统 - 报价审批与客户确认"}],"link":[],"style":[],"script":[],"noscript":[],"title":"钟表售后管理系统"};

const appRootTag = "div";

const appRootAttrs = {"id":"__nuxt"};

const appTeleportTag = "div";

const appTeleportAttrs = {"id":"teleports"};

const appId = "nuxt-app";

const devReducers = {
	VNode: (data) => isVNode(data) ? {
		type: data.type,
		props: data.props
	} : undefined,
	URL: (data) => data instanceof URL ? data.toString() : undefined,
	Symbol: (data) => typeof data === "symbol" ? data.description ?? "" : undefined
};
const asyncContext = getContext("nuxt-dev", {
	asyncContext: true,
	AsyncLocalStorage
});
const _dRiqFkinaODMfR0jrxE2s7G4_8xbOEFZr9ujyYLxRI = (nitroApp) => {
	const handler = nitroApp.h3App.handler;
	nitroApp.h3App.handler = (event) => {
		return asyncContext.callAsync({
			logs: [],
			event
		}, () => handler(event));
	};
	onConsoleLog((_log) => {
		const ctx = asyncContext.tryUse();
		if (!ctx) {
			return;
		}
		const rawStack = captureRawStackTrace();
		if (!rawStack || rawStack.includes("runtime/vite-node.mjs")) {
			return;
		}
		const trace = [];
		let filename = "";
		for (const entry of parseRawStackTrace(rawStack)) {
			if (entry.source === globalThis._importMeta_.url) {
				continue;
			}
			if (EXCLUDE_TRACE_RE.test(entry.source)) {
				continue;
			}
			filename ||= entry.source.replace(withTrailingSlash(rootDir), "");
			trace.push({
				...entry,
				source: entry.source.startsWith("file://") ? entry.source.replace("file://", "") : entry.source
			});
		}
		const log = {
			..._log,
			
			filename,
			
			stack: trace
		};
		
		ctx.logs.push(log);
	});
	nitroApp.hooks.hook("afterResponse", () => {
		const ctx = asyncContext.tryUse();
		if (!ctx) {
			return;
		}
		return nitroApp.hooks.callHook("dev:ssr-logs", {
			logs: ctx.logs,
			path: ctx.event.path
		});
	});
	
	nitroApp.hooks.hook("render:html", (htmlContext) => {
		const ctx = asyncContext.tryUse();
		if (!ctx) {
			return;
		}
		try {
			const reducers = Object.assign(Object.create(null), devReducers, ctx.event.context["~payloadReducers"]);
			htmlContext.bodyAppend.unshift(`<script type="application/json" data-nuxt-logs="${appId}">${stringify(ctx.logs, reducers)}<\/script>`);
		} catch (e) {
			const shortError = e instanceof Error && "toString" in e ? ` Received \`${e.toString()}\`.` : "";
			console.warn(`[nuxt] Failed to stringify dev server logs.${shortError} You can define your own reducer/reviver for rich types following the instructions in https://nuxt.com/docs/api/composables/use-nuxt-app#payload.`);
		}
	});
};
const EXCLUDE_TRACE_RE = /\/node_modules\/(?:.*\/)?(?:nuxt|nuxt-nightly|nuxt-edge|nuxt3|consola|@vue)\/|core\/runtime\/nitro/;
function onConsoleLog(callback) {
	consola$1.addReporter({ log(logObj) {
		callback(logObj);
	} });
	consola$1.wrapConsole();
}

const plugins = [
  _Qd8pQkavo8bJj8FDHTICBhzaCVLbDMJ6QpNP6NGtQhM,
_dRiqFkinaODMfR0jrxE2s7G4_8xbOEFZr9ujyYLxRI,
_wH6JrtIxmaSoA8lCPWFnE9z4lQeXW6H5z3l5aymEQw
];

const assets = {};

function readAsset (id) {
  const serverDir = dirname$1(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve$1(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _2Ayanh = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError({ statusCode: 404 });
    }
    return;
  }
  if (asset.encoding !== void 0) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const VueResolver = (_, value) => {
  return isRef(value) ? toValue(value) : value;
};

const headSymbol = "usehead";
// @__NO_SIDE_EFFECTS__
function vueInstall(head) {
  const plugin = {
    install(app) {
      app.config.globalProperties.$unhead = head;
      app.config.globalProperties.$head = head;
      app.provide(headSymbol, head);
    }
  };
  return plugin.install;
}

// @__NO_SIDE_EFFECTS__
function resolveUnrefHeadInput(input) {
  return walkResolver(input, VueResolver);
}

function filterIslandProps(props) {
  if (!props) {
    return {};
  }
  const out = {};
  for (const key in props) {
    if (!key.startsWith("data-v-")) {
      out[key] = props[key];
    }
  }
  return out;
}
function computeIslandHash(name, filteredProps, context, source) {
  return hash$1([name, filteredProps, context, source]).replace(/[-_]/g, "");
}

const NUXT_RUNTIME_PAYLOAD_EXTRACTION = false;

// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const head = createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = vueInstall(head);
  return head;
}

const unheadOptions = {
  disableDefaults: true,
  disableCapoSorting: false,
  plugins: [DeprecationsPlugin, PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin],
};

function encodeEventPath(path) {
	const queryIndex = path.indexOf("?");
	if (queryIndex === -1) {
		return encodePath(path);
	}
	return encodePath(path.slice(0, queryIndex)) + path.slice(queryIndex);
}
function createSSRContext(event) {
	const url = encodeEventPath(event.path);
	const ssrContext = {
		url,
		event,
		runtimeConfig: useRuntimeConfig(event),
		noSSR: event.context.nuxt?.noSSR || (false),
		head: createHead(unheadOptions),
		error: false,
		nuxt: undefined,
		payload: {},
		["~payloadReducers"]: Object.create(null),
		modules: new Set()
	};
	return ssrContext;
}
function setSSRError(ssrContext, error) {
	ssrContext.error = true;
	ssrContext.payload = { error };
	ssrContext.url = error.url;
}

function buildAssetsDir() {
	
	return useRuntimeConfig().app.buildAssetsDir;
}
function buildAssetsURL(...path) {
	return joinRelativeURL(publicAssetsURL(), buildAssetsDir(), ...path);
}
function publicAssetsURL(...path) {
	
	const app = useRuntimeConfig().app;
	const publicBase = app.cdnURL || app.baseURL;
	return path.length ? joinRelativeURL(publicBase, ...path) : publicBase;
}

// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__buildAssetsURL = buildAssetsURL;
// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__publicAssetsURL = publicAssetsURL;
const APP_ROOT_OPEN_TAG = `<${appRootTag}${propsToString(appRootAttrs)}>`;
const APP_ROOT_CLOSE_TAG = `</${appRootTag}>`;
// @ts-expect-error file will be produced after app build
const getServerEntry = () => Promise.resolve().then(function () { return server; }).then((r) => r.default || r);
// @ts-expect-error file will be produced after app build
const getClientManifest = () => Promise.resolve().then(function () { return client_manifest$1; }).then((r) => r.default || r).then((r) => typeof r === "function" ? r() : r);

const getSSRRenderer = lazyCachedFunction(async () => {
	
	const createSSRApp = await getServerEntry();
	if (!createSSRApp) {
		throw new Error("Server bundle is not available");
	}
	
	const precomputed = undefined ;
	
	const renderer = createRenderer(createSSRApp, {
		precomputed,
		manifest: await getClientManifest() ,
		renderToString: renderToString$1,
		buildAssetsURL
	});
	async function renderToString$1(input, context) {
		const html = await renderToString(input, context);
		
		
		if (process.env.NUXT_VITE_NODE_OPTIONS) {
			renderer.rendererContext.updateManifest(await getClientManifest());
		}
		return APP_ROOT_OPEN_TAG + html + APP_ROOT_CLOSE_TAG;
	}
	return renderer;
});

const getSPARenderer = lazyCachedFunction(async () => {
	const precomputed = undefined ;
	// @ts-expect-error virtual file
	const spaTemplate = await Promise.resolve().then(function () { return _virtual__spaTemplate; }).then((r) => r.template).catch(() => "").then((r) => {
		{
			return APP_ROOT_OPEN_TAG + r + APP_ROOT_CLOSE_TAG;
		}
	});
	
	const renderer = createRenderer(() => () => {}, {
		precomputed,
		manifest: await getClientManifest() ,
		renderToString: () => spaTemplate,
		buildAssetsURL
	});
	const result = await renderer.renderToString({});
	const renderToString = (ssrContext) => {
		const config = useRuntimeConfig(ssrContext.event);
		ssrContext.modules ||= new Set();
		ssrContext.payload.serverRendered = false;
		ssrContext.config = {
			public: config.public,
			app: config.app
		};
		return Promise.resolve(result);
	};
	return {
		rendererContext: renderer.rendererContext,
		renderToString
	};
});
function lazyCachedFunction(fn) {
	let res = null;
	return () => {
		if (res === null) {
			res = fn().catch((err) => {
				res = null;
				throw err;
			});
		}
		return res;
	};
}
function getRenderer(ssrContext) {
	return ssrContext.noSSR ? getSPARenderer() : getSSRRenderer();
}
// @ts-expect-error file will be produced after app build
const getSSRStyles = lazyCachedFunction(() => Promise.resolve().then(function () { return styles$1; }).then((r) => r.default || r));

async function renderInlineStyles(usedModules) {
	const styleMap = await getSSRStyles();
	const inlinedStyles = new Set();
	for (const mod of usedModules) {
		if (mod in styleMap && styleMap[mod]) {
			for (const style of await styleMap[mod]()) {
				inlinedStyles.add(style);
			}
		}
	}
	return Array.from(inlinedStyles).map((style) => ({ innerHTML: style }));
}

// @ts-expect-error virtual file
const ROOT_NODE_REGEX = new RegExp(`^<${appRootTag}[^>]*>([\\s\\S]*)<\\/${appRootTag}>$`);

function getServerComponentHTML(body) {
	const match = body.match(ROOT_NODE_REGEX);
	return match?.[1] || body;
}
const SSR_SLOT_TELEPORT_MARKER = /^uid=([^;]*);slot=(.*)$/;
const SSR_CLIENT_TELEPORT_MARKER = /^uid=([^;]*);client=(.*)$/;
const SSR_CLIENT_SLOT_MARKER = /^island-slot=([^;]*);(.*)$/;
function getSlotIslandResponse(ssrContext) {
	if (!ssrContext.islandContext || !Object.keys(ssrContext.islandContext.slots).length) {
		return undefined;
	}
	const response = {};
	for (const [name, slot] of Object.entries(ssrContext.islandContext.slots)) {
		response[name] = {
			...slot,
			fallback: ssrContext.teleports?.[`island-fallback=${name}`]
		};
	}
	return response;
}
function getClientIslandResponse(ssrContext) {
	if (!ssrContext.islandContext || !Object.keys(ssrContext.islandContext.components).length) {
		return undefined;
	}
	const response = {};
	for (const [clientUid, component] of Object.entries(ssrContext.islandContext.components)) {
		
		const html = ssrContext.teleports?.[clientUid]?.replaceAll("<!--teleport start anchor-->", "") || "";
		response[clientUid] = {
			...component,
			html,
			slots: getComponentSlotTeleport(clientUid, ssrContext.teleports ?? {})
		};
	}
	return response;
}
function getComponentSlotTeleport(clientUid, teleports) {
	const entries = Object.entries(teleports);
	const slots = {};
	for (const [key, value] of entries) {
		const match = key.match(SSR_CLIENT_SLOT_MARKER);
		if (match) {
			const [, id, slot] = match;
			if (!slot || clientUid !== id) {
				continue;
			}
			slots[slot] = value;
		}
	}
	return slots;
}
function replaceIslandTeleports(ssrContext, html) {
	const { teleports, islandContext } = ssrContext;
	if (islandContext || !teleports) {
		return html;
	}
	for (const key in teleports) {
		const matchClientComp = key.match(SSR_CLIENT_TELEPORT_MARKER);
		if (matchClientComp) {
			const [, uid, clientId] = matchClientComp;
			if (!uid || !clientId) {
				continue;
			}
			html = html.replace(new RegExp(` data-island-uid="${uid}" data-island-component="${clientId}"[^>]*>`), (full) => {
				return full + teleports[key];
			});
			continue;
		}
		const matchSlot = key.match(SSR_SLOT_TELEPORT_MARKER);
		if (matchSlot) {
			const [, uid, slot] = matchSlot;
			if (!uid || !slot) {
				continue;
			}
			html = html.replace(new RegExp(` data-island-uid="${uid}" data-island-slot="${slot}"[^>]*>`), (full) => {
				return full + teleports[key];
			});
		}
	}
	return html;
}

const ISLAND_SUFFIX_RE = /\.json(?:\?.*)?$/;
const handler$1 = defineEventHandler(async (event) => {
	const nitroApp = useNitroApp();
	setResponseHeaders(event, {
		"content-type": "application/json;charset=utf-8",
		"x-powered-by": "Nuxt"
	});
	const islandContext = await getIslandContext(event);
	const ssrContext = {
		...createSSRContext(event),
		islandContext,
		noSSR: false,
		url: islandContext.url
	};
	
	const renderer = await getSSRRenderer();
	const renderResult = await renderer.renderToString(ssrContext).catch(async (err) => {
		if (ssrContext["~renderResponse"] && err?.message === "skipping render") {
			return {};
		}
		await ssrContext.nuxt?.hooks.callHook("app:error", err);
		throw err;
	});
	
	
	await ssrContext.nuxt?.hooks.callHook("app:rendered", {
		ssrContext,
		renderResult
	});
	if (ssrContext["~renderResponse"]) {
		const response = ssrContext["~renderResponse"];
		if (response.statusCode && response.statusCode >= 400) {
			throw createError({
				statusCode: response.statusCode,
				statusMessage: response.statusMessage
			});
		}
		return returnIslandResponse(event, response);
	}
	
	if (ssrContext.payload?.error) {
		throw ssrContext.payload.error;
	}
	const inlinedStyles = await renderInlineStyles(ssrContext.modules ?? []);
	if (inlinedStyles.length) {
		ssrContext.head.push({ style: inlinedStyles });
	}
	{
		const { styles } = getRequestDependencies(ssrContext, renderer.rendererContext);
		const link = [];
		for (const resource of Object.values(styles)) {
			
			if ("inline" in getQuery(resource.file)) {
				continue;
			}
			
			
			if (resource.file.includes("scoped") && !resource.file.includes("pages/")) {
				link.push({
					rel: "stylesheet",
					href: renderer.rendererContext.buildAssetsURL(resource.file),
					crossorigin: ""
				});
			}
		}
		if (link.length) {
			ssrContext.head.push({ link }, { mode: "server" });
		}
	}
	const islandHead = {};
	for (const entry of ssrContext.head.entries.values()) {
		
		for (const [key, value] of Object.entries(resolveUnrefHeadInput(entry.input))) {
			const currentValue = islandHead[key];
			if (Array.isArray(currentValue)) {
				currentValue.push(...value);
			} else {
				islandHead[key] = value;
			}
		}
	}
	
	islandHead.link ||= [];
	islandHead.style ||= [];
	const islandResponse = {
		id: islandContext.id,
		head: islandHead,
		html: getServerComponentHTML(renderResult.html),
		components: getClientIslandResponse(ssrContext),
		slots: getSlotIslandResponse(ssrContext)
	};
	await nitroApp.hooks.callHook("render:island", islandResponse, {
		event,
		islandContext
	});
	return islandResponse;
});
function returnIslandResponse(event, response) {
	for (const header in response.headers || {}) {
		setResponseHeader(event, header, response.headers[header]);
	}
	if (response.statusCode) {
		setResponseStatus(event, response.statusCode, response.statusMessage);
	}
	return response.body;
}
const ISLAND_PATH_PREFIX = "/__nuxt_island/";
const VALID_COMPONENT_NAME_RE = /^[a-z][\w.-]*$/i;
async function getIslandContext(event) {
	let url = event.path || "";
	url.replace(/\?.*$/, "");
	if (!url.startsWith(ISLAND_PATH_PREFIX)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid island request path"
		});
	}
	const componentParts = url.substring(ISLAND_PATH_PREFIX.length).replace(ISLAND_SUFFIX_RE, "").split("_");
	const hashId = componentParts.length > 1 ? componentParts.pop() : undefined;
	const componentName = componentParts.join("_");
	if (!componentName || !VALID_COMPONENT_NAME_RE.test(componentName)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid island component name"
		});
	}
	const rawContext = event.method === "GET" ? getQuery$1(event) : await readBody(event);
	const rawProps = destr$1(rawContext?.props) || {};
	const filteredProps = filterIslandProps(rawProps);
	
	
	const clientContext = {};
	if (rawContext && typeof rawContext === "object") {
		for (const key in rawContext) {
			if (key !== "props") {
				clientContext[key] = rawContext[key];
			}
		}
	}
	
	
	const expectedHash = computeIslandHash(componentName, filteredProps, clientContext, undefined);
	if (!hashId || hashId !== expectedHash) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid island request hash"
		});
	}
	return {
		url: typeof rawContext?.url === "string" ? rawContext.url : "/",
		id: hashId,
		name: componentName,
		props: rawProps,
		slots: {},
		components: {}
	};
}

const _lazy_GpTvZJ = () => Promise.resolve().then(function () { return parts_get$1; });
const _lazy_kvjk3K = () => Promise.resolve().then(function () { return stats_get$1; });
const _lazy_LZE3MG = () => Promise.resolve().then(function () { return workorders_get$1; });
const _lazy_AHDuC7 = () => Promise.resolve().then(function () { return _id__get$1; });
const _lazy_kbR5rP = () => Promise.resolve().then(function () { return _id__patch$1; });
const _lazy_1EiImz = () => Promise.resolve().then(function () { return action_post$1; });
const _lazy_cmk54g = () => Promise.resolve().then(function () { return renderer; });

const handlers = [
  { route: '', handler: _2Ayanh, lazy: false, middleware: true, method: undefined },
  { route: '/api/parts', handler: _lazy_GpTvZJ, lazy: true, middleware: false, method: "get" },
  { route: '/api/stats', handler: _lazy_kvjk3K, lazy: true, middleware: false, method: "get" },
  { route: '/api/workorders', handler: _lazy_LZE3MG, lazy: true, middleware: false, method: "get" },
  { route: '/api/workorders/:id', handler: _lazy_AHDuC7, lazy: true, middleware: false, method: "get" },
  { route: '/api/workorders/:id', handler: _lazy_kbR5rP, lazy: true, middleware: false, method: "patch" },
  { route: '/api/workorders/:id/action', handler: _lazy_1EiImz, lazy: true, middleware: false, method: "post" },
  { route: '/__nuxt_error', handler: _lazy_cmk54g, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: handler$1, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_cmk54g, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(true),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter$1({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => callNodeRequestHandler(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return fetchNodeRequestHandler(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

const scheduledTasks = false;

const tasks = {
  
};

const __runningTasks__ = {};
async function runTask(name, {
  payload = {},
  context = {}
} = {}) {
  if (__runningTasks__[name]) {
    return __runningTasks__[name];
  }
  if (!(name in tasks)) {
    throw createError({
      message: `Task \`${name}\` is not available!`,
      statusCode: 404
    });
  }
  if (!tasks[name].resolve) {
    throw createError({
      message: `Task \`${name}\` is not implemented!`,
      statusCode: 501
    });
  }
  const handler = await tasks[name].resolve();
  const taskEvent = { name, payload, context };
  __runningTasks__[name] = handler.run(taskEvent);
  try {
    const res = await __runningTasks__[name];
    return res;
  } finally {
    delete __runningTasks__[name];
  }
}

if (!globalThis.crypto) {
  globalThis.crypto = crypto$1.webcrypto;
}
const { NITRO_NO_UNIX_SOCKET, NITRO_DEV_WORKER_ID } = process.env;
trapUnhandledNodeErrors();
parentPort?.on("message", (msg) => {
  if (msg && msg.event === "shutdown") {
    shutdown();
  }
});
const nitroApp = useNitroApp();
const server$1 = new Server(toNodeListener(nitroApp.h3App));
let listener;
listen().catch(() => listen(
  true
  /* use random port */
)).catch((error) => {
  console.error("Dev worker failed to listen:", error);
  return shutdown();
});
nitroApp.router.get(
  "/_nitro/tasks",
  defineEventHandler(async (event) => {
    const _tasks = await Promise.all(
      Object.entries(tasks).map(async ([name, task]) => {
        const _task = await task.resolve?.();
        return [name, { description: _task?.meta?.description }];
      })
    );
    return {
      tasks: Object.fromEntries(_tasks),
      scheduledTasks
    };
  })
);
nitroApp.router.use(
  "/_nitro/tasks/:name",
  defineEventHandler(async (event) => {
    const name = getRouterParam(event, "name");
    const payload = {
      ...getQuery$1(event),
      ...await readBody(event).then((r) => r?.payload).catch(() => ({}))
    };
    return await runTask(name, { payload });
  })
);
function listen(useRandomPort = Boolean(
  NITRO_NO_UNIX_SOCKET || process.versions.webcontainer || "Bun" in globalThis && process.platform === "win32"
)) {
  return new Promise((resolve, reject) => {
    try {
      listener = server$1.listen(useRandomPort ? 0 : getSocketAddress(), () => {
        const address = server$1.address();
        parentPort?.postMessage({
          event: "listen",
          address: typeof address === "string" ? { socketPath: address } : { host: "localhost", port: address?.port }
        });
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
function getSocketAddress() {
  const socketName = `nitro-worker-${process.pid}-${threadId}-${NITRO_DEV_WORKER_ID}-${Math.round(Math.random() * 1e4)}.sock`;
  if (process.platform === "win32") {
    return join(String.raw`\\.\pipe`, socketName);
  }
  if (process.platform === "linux") {
    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
    if (nodeMajor >= 20) {
      return `\0${socketName}`;
    }
  }
  return join(tmpdir(), socketName);
}
async function shutdown() {
  server$1.closeAllConnections?.();
  await Promise.all([
    new Promise((resolve) => listener?.close(resolve)),
    nitroApp.hooks.callHook("close").catch(console.error)
  ]);
  parentPort?.postMessage({ event: "exit" });
}

const _messages = {
	"appName": "Nuxt",
	"version": "",
	"status": 500,
	"statusText": "Server error",
	"description": "This page is temporarily unavailable."
};
const template$1 = (messages) => {
	messages = {
		..._messages,
		...messages
	};
	return "<!DOCTYPE html><html lang=\"en\"><head><title>" + escapeHtml(messages.status) + " - " + escapeHtml(messages.statusText) + " | " + escapeHtml(messages.appName) + "</title><meta charset=\"utf-8\"><meta content=\"width=device-width,initial-scale=1.0,minimum-scale=1.0\" name=\"viewport\"><style>.spotlight{background:linear-gradient(45deg,#00dc82,#36e4da 50%,#0047e1);filter:blur(20vh)}*,:after,:before{border-color:var(--un-default-border-color,#e5e7eb);border-style:solid;border-width:0;box-sizing:border-box}:after,:before{--un-content:\"\"}html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-moz-tab-size:4;tab-size:4;-webkit-tap-highlight-color:transparent}body{line-height:inherit;margin:0}h1{font-size:inherit;font-weight:inherit}h1,p{margin:0}*,:after,:before{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 transparent;--un-ring-shadow:0 0 transparent;--un-shadow-inset: ;--un-shadow:0 0 transparent;--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: }.fixed{position:fixed}.-bottom-1\\/2{bottom:-50%}.left-0{left:0}.right-0{right:0}.grid{display:grid}.mb-16{margin-bottom:4rem}.mb-8{margin-bottom:2rem}.h-1\\/2{height:50%}.max-w-520px{max-width:520px}.min-h-screen{min-height:100vh}.place-content-center{place-content:center}.overflow-hidden{overflow:hidden}.bg-white{--un-bg-opacity:1;background-color:rgb(255 255 255/var(--un-bg-opacity))}.px-8{padding-left:2rem;padding-right:2rem}.text-center{text-align:center}.text-8xl{font-size:6rem;line-height:1}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-black{--un-text-opacity:1;color:rgb(0 0 0/var(--un-text-opacity))}.font-light{font-weight:300}.font-medium{font-weight:500}.leading-tight{line-height:1.25}.font-sans{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}@media(prefers-color-scheme:dark){.dark\\:bg-black{--un-bg-opacity:1;background-color:rgb(0 0 0/var(--un-bg-opacity))}.dark\\:text-white{--un-text-opacity:1;color:rgb(255 255 255/var(--un-text-opacity))}}@media(min-width:640px){.sm\\:px-0{padding-left:0;padding-right:0}.sm\\:text-4xl{font-size:2.25rem;line-height:2.5rem}}</style><script>!function(){const e=document.createElement(\"link\").relList;if(!(e&&e.supports&&e.supports(\"modulepreload\"))){for(const e of document.querySelectorAll('link[rel=\"modulepreload\"]'))r(e);new MutationObserver(e=>{for(const o of e)if(\"childList\"===o.type)for(const e of o.addedNodes)\"LINK\"===e.tagName&&\"modulepreload\"===e.rel&&r(e)}).observe(document,{childList:!0,subtree:!0})}function r(e){if(e.ep)return;e.ep=!0;const r=function(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),\"use-credentials\"===e.crossOrigin?r.credentials=\"include\":\"anonymous\"===e.crossOrigin?r.credentials=\"omit\":r.credentials=\"same-origin\",r}(e);fetch(e.href,r)}}();<\/script></head><body class=\"antialiased bg-white dark:bg-black dark:text-white font-sans grid min-h-screen overflow-hidden place-content-center text-black\"><div class=\"-bottom-1/2 fixed h-1/2 left-0 right-0 spotlight\"></div><div class=\"max-w-520px text-center\"><h1 class=\"font-medium mb-8 sm:text-10xl text-8xl\">" + escapeHtml(messages.status) + "</h1><p class=\"font-light leading-tight mb-16 px-8 sm:px-0 sm:text-4xl text-xl\">" + escapeHtml(messages.description) + "</p></div></body></html>";
};

const error500 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  template: template$1
}, Symbol.toStringTag, { value: 'Module' }));

const server = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: viteNodeEntry_mjs
}, Symbol.toStringTag, { value: 'Module' }));

const client_manifest = () => viteNodeFetch.getManifest();

const client_manifest$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: client_manifest
}, Symbol.toStringTag, { value: 'Module' }));

const template = "";

const _virtual__spaTemplate = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  template: template
}, Symbol.toStringTag, { value: 'Module' }));

const styles = {};

const styles$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: styles
}, Symbol.toStringTag, { value: 'Module' }));

const mockUsers = [
  { id: "1", name: "\u5F20\u7ECF\u7406", role: "manager", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager" },
  { id: "2", name: "\u674E\u987E\u95EE", role: "consultant", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=consultant" },
  { id: "3", name: "\u738B\u6280\u5E08", role: "technician", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=technician" }
];
const mockPartInventory = [
  { id: "inv1", partCode: "MOV-001", partName: "\u673A\u82AF\u8F74\u627F\u7EC4\u4EF6", stock: 15, locked: 3, unit: "\u5957", price: 680 },
  { id: "inv2", partCode: "MOV-002", partName: "\u64D2\u7EB5\u673A\u6784", stock: 8, locked: 2, unit: "\u5957", price: 1280 },
  { id: "inv3", partCode: "CAS-001", partName: "\u8868\u51A0\u5BC6\u5C01\u5708", stock: 50, locked: 5, unit: "\u4E2A", price: 45 },
  { id: "inv4", partCode: "CAS-002", partName: "\u84DD\u5B9D\u77F3\u8868\u955C 40mm", stock: 12, locked: 1, unit: "\u7247", price: 380 },
  { id: "inv5", partCode: "STR-001", partName: "\u4E0D\u9508\u94A2\u8868\u5E26 20mm", stock: 20, locked: 2, unit: "\u6761", price: 450 },
  { id: "inv6", partCode: "STR-002", partName: "\u771F\u76AE\u8868\u5E26 20mm", stock: 25, locked: 0, unit: "\u6761", price: 280 },
  { id: "inv7", partCode: "BAT-001", partName: "\u624B\u8868\u7535\u6C60 SR920SW", stock: 100, locked: 0, unit: "\u7C92", price: 35 },
  { id: "inv8", partCode: "LUB-001", partName: "\u673A\u82AF\u6DA6\u6ED1\u6CB9", stock: 30, locked: 0, unit: "\u74F6", price: 120 }
];
function createTimelineEntry$1(id, action, operator, operatorRole, remark, offsetHours = 0, baseTime) {
  const time = baseTime ? new Date(baseTime.getTime() + offsetHours * 36e5) : new Date(Date.now() + offsetHours * 36e5);
  return {
    id,
    action,
    operator,
    operatorRole,
    remark,
    createdAt: time.toISOString()
  };
}
function createProgressEntry$1(id, workOrderId, status, description, operator, operatorRole, offsetHours, baseTime) {
  return {
    id,
    workOrderId,
    status,
    description,
    operator,
    operatorRole,
    createdAt: new Date(baseTime.getTime() + offsetHours * 36e5).toISOString()
  };
}
function createReceipt(workOrderId, confirmed, pickedUp, satisfaction) {
  return {
    id: `receipt-${workOrderId}`,
    workOrderId,
    confirmed,
    pickedUp,
    satisfaction
  };
}
function createMockWorkOrders() {
  const customers = [
    { id: "c1", name: "\u9648\u5148\u751F", phone: "13800138001", email: "chen@example.com", address: "\u5317\u4EAC\u5E02\u671D\u9633\u533A\u5EFA\u56FD\u8DEF88\u53F7" },
    { id: "c2", name: "\u5218\u5973\u58EB", phone: "13900139002", email: "liu@example.com", address: "\u4E0A\u6D77\u5E02\u6D66\u4E1C\u65B0\u533A\u9646\u5BB6\u5634\u73AF\u8DEF" },
    { id: "c3", name: "\u738B\u5148\u751F", phone: "13700137003", email: "wang@example.com", address: "\u5E7F\u5DDE\u5E02\u5929\u6CB3\u533A\u73E0\u6C5F\u65B0\u57CE" },
    { id: "c4", name: "\u8D75\u5973\u58EB", phone: "13600136004", email: "zhao@example.com", address: "\u6DF1\u5733\u5E02\u5357\u5C71\u533A\u79D1\u6280\u56ED" },
    { id: "c5", name: "\u5B59\u5148\u751F", phone: "13500135005", email: "sun@example.com", address: "\u676D\u5DDE\u5E02\u897F\u6E56\u533A\u6587\u4E09\u8DEF" },
    { id: "c6", name: "\u5468\u5973\u58EB", phone: "13400134006", email: "zhou@example.com", address: "\u6210\u90FD\u5E02\u6B66\u4FAF\u533A\u5929\u5E9C\u5927\u9053" }
  ];
  const watches = [
    { brand: "\u52B3\u529B\u58EB", model: "\u6F5C\u822A\u8005\u578B", serial: "SN12345678" },
    { brand: "\u6B27\u7C73\u8304", model: "\u6D77\u9A6C\u7CFB\u5217", serial: "SN87654321" },
    { brand: "\u5361\u5730\u4E9A", model: "\u84DD\u6C14\u7403", serial: "SN23456789" },
    { brand: "\u4E07\u56FD", model: "\u8461\u8404\u7259\u7CFB\u5217", serial: "SN98765432" },
    { brand: "\u6D6A\u7434", model: "\u540D\u5320\u7CFB\u5217", serial: "SN34567890" },
    { brand: "\u5929\u68AD", model: "\u529B\u6D1B\u514B", serial: "SN09876543" },
    { brand: "\u7F8E\u5EA6", model: "\u8D1D\u4F26\u8D5B\u4E3D", serial: "SN45678901" },
    { brand: "\u6885\u82B1", model: "\u5B87\u5B99\u7CFB\u5217", serial: "SN10987654" },
    { brand: "\u7CBE\u5DE5", model: "Presage", serial: "SN56789012" }
  ];
  const problems = [
    "\u8D70\u65F6\u4E0D\u51C6\uFF0C\u6BCF\u5929\u5FEB\u7EA65\u5206\u949F",
    "\u8868\u51A0\u65E0\u6CD5\u6B63\u5E38\u65CB\u5165\uFF0C\u9632\u6C34\u6027\u80FD\u53D7\u635F",
    "\u8868\u76D8\u8FDB\u6C34\u8D77\u96FE\uFF0C\u9700\u8981\u6E05\u6D17\u4FDD\u517B",
    "\u81EA\u52A8\u4E0A\u94FE\u6548\u7387\u4F4E\u4E0B\uFF0C\u624B\u52A8\u4E0A\u94FE\u6B63\u5E38",
    "\u8868\u5E26\u6263\u635F\u574F\uFF0C\u9700\u8981\u66F4\u6362",
    "\u8868\u955C\u522E\u82B1\uFF0C\u5F71\u54CD\u7F8E\u89C2",
    "\u9700\u8981\u5168\u9762\u4FDD\u517B\u6D17\u6CB9\uFF0C\u8D2D\u4E705\u5E74\u672A\u4FDD\u517B",
    "\u591C\u5149\u6D82\u5C42\u8131\u843D\uFF0C\u9700\u8981\u91CD\u6D82",
    "\u8BA1\u65F6\u529F\u80FD\u5931\u7075\uFF0C\u6309\u94AE\u65E0\u53CD\u5E94",
    "\u65E5\u5386\u8DF3\u8F6C\u5F02\u5E38\uFF0C\u4E2D\u534812\u70B9\u8DF3\u8F6C"
  ];
  const inspectionResults = [
    "\u7ECF\u68C0\u6D4B\uFF0C\u673A\u82AF\u6446\u5E45\u504F\u4F4E\uFF0C\u9700\u8981\u6E05\u6D17\u4FDD\u517B\u5E76\u66F4\u6362\u78E8\u635F\u9F7F\u8F6E",
    "\u8868\u51A0\u87BA\u7EB9\u78E8\u635F\uFF0C\u9700\u8981\u66F4\u6362\u8868\u51A0\u53CA\u9632\u6C34\u5708",
    "\u8FDB\u6C34\u60C5\u51B5\u8F83\u8F7B\uFF0C\u673A\u82AF\u672A\u751F\u9508\uFF0C\u6E05\u6D17\u70D8\u5E72\u5373\u53EF",
    "\u81EA\u52A8\u9640\u8F74\u627F\u78E8\u635F\uFF0C\u9700\u8981\u66F4\u6362\u8F74\u627F\u7EC4\u4EF6",
    "\u8868\u6263\u5F39\u7C27\u65AD\u88C2\uFF0C\u9700\u8981\u66F4\u6362\u8868\u6263",
    "\u8868\u955C\u5212\u75D5\u8F83\u6DF1\uFF0C\u9700\u8981\u66F4\u6362\u84DD\u5B9D\u77F3\u8868\u955C",
    "\u673A\u82AF\u6CB9\u6CE5\u4E25\u91CD\uFF0C\u9700\u8981\u5168\u9762\u62C6\u6D17\u52A0\u6CB9",
    "\u591C\u5149\u6D82\u5C42\u8001\u5316\uFF0C\u9700\u8981\u91CD\u65B0\u6D82\u8986\u591C\u5149\u6750\u6599",
    "\u8BA1\u65F6\u9F7F\u8F6E\u7EC4\u5361\u6EDE\uFF0C\u9700\u8981\u6E05\u7406\u6DA6\u6ED1",
    "\u65E5\u5386\u62E8\u8F6E\u9519\u4F4D\uFF0C\u9700\u8981\u91CD\u65B0\u5B89\u88C5\u8C03\u6574"
  ];
  const statuses = [
    { status: "pending_review", timelineSteps: 1, hasQuote: false, hasParts: false, hasProgress: 0, receipt: { confirmed: false, pickedUp: false } },
    { status: "quoting", timelineSteps: 3, hasQuote: false, hasParts: true, hasProgress: 1, receipt: { confirmed: false, pickedUp: false } },
    { status: "pending_approval", timelineSteps: 4, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "rejected", timelineSteps: 5, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "pending_confirm", timelineSteps: 6, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "customer_rejected", timelineSteps: 7, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "repairing", timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 4, receipt: { confirmed: true, pickedUp: false } },
    { status: "repairing", timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 3, receipt: { confirmed: true, pickedUp: false } },
    { status: "completed", timelineSteps: 10, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: false } },
    { status: "picked_up", timelineSteps: 12, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: true, satisfaction: 5 } },
    { status: "picked_up", timelineSteps: 12, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: true, satisfaction: 4 } },
    { status: "pending_approval", timelineSteps: 4, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "pending_confirm", timelineSteps: 6, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "repairing", timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 4, receipt: { confirmed: true, pickedUp: false } },
    { status: "pending_review", timelineSteps: 1, hasQuote: false, hasParts: false, hasProgress: 0, receipt: { confirmed: false, pickedUp: false } },
    { status: "quoting", timelineSteps: 3, hasQuote: false, hasParts: true, hasProgress: 1, receipt: { confirmed: false, pickedUp: false } },
    { status: "rejected", timelineSteps: 5, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "completed", timelineSteps: 10, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: false } }
  ];
  const priorities = ["low", "medium", "high", "urgent"];
  const partConfigs = [
    [{ partName: "\u673A\u82AF\u8F74\u627F\u7EC4\u4EF6", partCode: "MOV-001", quantity: 1 }],
    [{ partName: "\u64D2\u7EB5\u673A\u6784", partCode: "MOV-002", quantity: 1 }],
    [{ partName: "\u8868\u51A0\u5BC6\u5C01\u5708", partCode: "CAS-001", quantity: 2 }],
    [{ partName: "\u84DD\u5B9D\u77F3\u8868\u955C 40mm", partCode: "CAS-002", quantity: 1 }],
    [{ partName: "\u4E0D\u9508\u94A2\u8868\u5E26 20mm", partCode: "STR-001", quantity: 1 }],
    [{ partName: "\u673A\u82AF\u6DA6\u6ED1\u6CB9", partCode: "LUB-001", quantity: 1 }]
  ];
  const now = /* @__PURE__ */ new Date();
  const workOrders = [];
  for (let i = 0; i < 18; i++) {
    const customer = customers[i % customers.length];
    const watch = watches[i % watches.length];
    const problem = problems[i % problems.length];
    const inspectionResult = inspectionResults[i % inspectionResults.length];
    const statusConfig = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const partConfig = partConfigs[i % partConfigs.length];
    const daysAgo = Math.floor(Math.random() * 14);
    const receivedAt = new Date(now.getTime() - daysAgo * 864e5);
    const timeline = [];
    const progress = [];
    let parts = [];
    let quote;
    const timelines = [
      createTimelineEntry$1(`tl${i}-1`, "\u5BC4\u4FEE\u767B\u8BB0", "\u674E\u987E\u95EE", "consultant", "\u5BA2\u6237\u9001\u4FEE\uFF0C\u5DF2\u767B\u8BB0\u57FA\u672C\u4FE1\u606F", 0, receivedAt),
      createTimelineEntry$1(`tl${i}-2`, "\u5F00\u59CB\u68C0\u6D4B", "\u738B\u6280\u5E08", "technician", "\u5DF2\u63A5\u6536\u624B\u8868\uFF0C\u5F00\u59CB\u68C0\u6D4B", 2, receivedAt),
      createTimelineEntry$1(`tl${i}-3`, "\u68C0\u6D4B\u5B8C\u6210", "\u738B\u6280\u5E08", "technician", inspectionResult, 6, receivedAt),
      createTimelineEntry$1(`tl${i}-4`, "\u9501\u5B9A\u914D\u4EF6", "\u738B\u6280\u5E08", "technician", "\u5DF2\u9501\u5B9A\u6240\u9700\u7EF4\u4FEE\u914D\u4EF6", 7, receivedAt),
      createTimelineEntry$1(`tl${i}-5`, "\u63D0\u4EA4\u62A5\u4EF7", "\u738B\u6280\u5E08", "technician", "", 8, receivedAt),
      createTimelineEntry$1(`tl${i}-6`, "\u5BA1\u6279\u901A\u8FC7", "\u5F20\u7ECF\u7406", "manager", "\u62A5\u4EF7\u5408\u7406\uFF0C\u540C\u610F", 10, receivedAt),
      createTimelineEntry$1(`tl${i}-7`, "\u53D1\u9001\u5BA2\u6237\u786E\u8BA4", "\u674E\u987E\u95EE", "consultant", "\u5DF2\u901A\u8FC7\u77ED\u4FE1\u53D1\u9001\u62A5\u4EF7\u786E\u8BA4", 12, receivedAt),
      createTimelineEntry$1(`tl${i}-8`, "\u5BA2\u6237\u786E\u8BA4", "\u674E\u987E\u95EE", "consultant", "\u5BA2\u6237\u7535\u8BDD\u786E\u8BA4\u540C\u610F\u7EF4\u4FEE", 24, receivedAt),
      createTimelineEntry$1(`tl${i}-9`, "\u5F00\u59CB\u7EF4\u4FEE", "\u738B\u6280\u5E08", "technician", "\u5F00\u59CB\u6267\u884C\u7EF4\u4FEE\u5DE5\u4F5C", 26, receivedAt),
      createTimelineEntry$1(`tl${i}-10`, "\u7EF4\u4FEE\u5B8C\u6210", "\u738B\u6280\u5E08", "technician", "\u7EF4\u4FEE\u5B8C\u6210\uFF0C\u68C0\u6D4B\u901A\u8FC7", 72, receivedAt),
      createTimelineEntry$1(`tl${i}-11`, "\u901A\u77E5\u53D6\u4EF6", "\u674E\u987E\u95EE", "consultant", "\u5DF2\u901A\u8FC7\u77ED\u4FE1\u901A\u77E5\u5BA2\u6237\u53D6\u4EF6", 74, receivedAt),
      createTimelineEntry$1(`tl${i}-12`, "\u5BA2\u6237\u53D6\u4EF6", "\u674E\u987E\u95EE", "consultant", "\u5BA2\u6237\u5DF2\u53D6\u8868", 96, receivedAt)
    ];
    if (statusConfig.status === "rejected") {
      timelines[5] = createTimelineEntry$1(`tl${i}-6`, "\u5BA1\u6279\u9A73\u56DE", "\u5F20\u7ECF\u7406", "manager", "\u62A5\u4EF7\u8FC7\u9AD8\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6838\u7B97", 10, receivedAt);
    }
    if (statusConfig.status === "customer_rejected") {
      timelines[7] = createTimelineEntry$1(`tl${i}-8`, "\u5BA2\u6237\u9A73\u56DE", "\u674E\u987E\u95EE", "consultant", "\u5BA2\u6237\u8BA4\u4E3A\u62A5\u4EF7\u8FC7\u9AD8\uFF0C\u4E0D\u540C\u610F\u7EF4\u4FEE", 24, receivedAt);
    }
    for (let j = 0; j < statusConfig.timelineSteps; j++) {
      timeline.push(timelines[j]);
    }
    if (statusConfig.hasParts) {
      parts = partConfig.map((p, idx) => ({
        id: `pl${i}-${idx}`,
        partName: p.partName,
        partCode: p.partCode,
        quantity: p.quantity,
        status: statusConfig.status === "rejected" || statusConfig.status === "customer_rejected" ? "released" : "locked",
        lockedBy: "3",
        lockedAt: new Date(receivedAt.getTime() + 7 * 36e5).toISOString()
      }));
    }
    if (statusConfig.hasQuote) {
      const partsCost = partConfig.reduce((sum, p) => {
        const inv = mockPartInventory.find((i2) => i2.partCode === p.partCode);
        return sum + ((inv == null ? void 0 : inv.price) || 0) * p.quantity;
      }, 0);
      const laborCost = 300 + Math.floor(Math.random() * 1500);
      const amount = partsCost + laborCost;
      quote = {
        id: `q${i}`,
        workOrderId: `wo${i + 1}`,
        amount,
        partsCost,
        laborCost,
        status: statusConfig.status === "rejected" || statusConfig.status === "customer_rejected" ? "rejected" : statusConfig.status === "pending_approval" || statusConfig.status === "pending_confirm" ? "submitted" : "approved",
        remark: inspectionResult,
        createdAt: new Date(receivedAt.getTime() + 8 * 36e5).toISOString(),
        approvedAt: statusConfig.status !== "rejected" && statusConfig.status !== "pending_approval" && statusConfig.status !== "quoting" && statusConfig.status !== "pending_review" ? new Date(receivedAt.getTime() + 10 * 36e5).toISOString() : void 0
      };
      if (timeline.length > 4) {
        timeline[4].remark = `\u62A5\u4EF7\u91D1\u989D: \xA5${amount}`;
      }
    }
    if (statusConfig.hasProgress > 0) {
      const progressSteps = [
        createProgressEntry$1(`pg${i}-1`, `wo${i + 1}`, "inspecting", "\u68C0\u6D4B\u624B\u8868\u6545\u969C\uFF0C\u8BC4\u4F30\u7EF4\u4FEE\u65B9\u6848", "\u738B\u6280\u5E08", "technician", 2, receivedAt),
        createProgressEntry$1(`pg${i}-2`, `wo${i + 1}`, "parts_preparing", "\u51C6\u5907\u7EF4\u4FEE\u6240\u9700\u914D\u4EF6", "\u738B\u6280\u5E08", "technician", 7, receivedAt),
        createProgressEntry$1(`pg${i}-3`, `wo${i + 1}`, "repairing", "\u62C6\u89E3\u673A\u82AF\uFF0C\u6E05\u6D17\u66F4\u6362\u78E8\u635F\u96F6\u4EF6", "\u738B\u6280\u5E08", "technician", 26, receivedAt),
        createProgressEntry$1(`pg${i}-4`, `wo${i + 1}`, "testing", "\u7EC4\u88C5\u5B8C\u6210\uFF0C\u8FDB\u884C\u7CBE\u5EA6\u6D4B\u8BD5", "\u738B\u6280\u5E08", "technician", 60, receivedAt),
        createProgressEntry$1(`pg${i}-5`, `wo${i + 1}`, "completed", "\u68C0\u6D4B\u901A\u8FC7\uFF0C\u7EF4\u4FEE\u5B8C\u6210", "\u738B\u6280\u5E08", "technician", 72, receivedAt)
      ];
      for (let j = 0; j < statusConfig.hasProgress; j++) {
        progress.push(progressSteps[j]);
      }
    }
    const receipt = statusConfig.receipt.confirmed || statusConfig.receipt.pickedUp ? createReceipt(`wo${i + 1}`, statusConfig.receipt.confirmed, statusConfig.receipt.pickedUp, statusConfig.receipt.satisfaction) : void 0;
    if (receipt && statusConfig.receipt.pickedUp) {
      receipt.pickedUpAt = new Date(receivedAt.getTime() + 96 * 36e5).toISOString();
      receipt.pickedUpBy = customer.name;
      receipt.confirmedAt = new Date(receivedAt.getTime() + 24 * 36e5).toISOString();
      receipt.confirmedBy = customer.name;
      if (receipt.satisfaction) {
        receipt.satisfactionAt = new Date(receivedAt.getTime() + 100 * 36e5).toISOString();
        receipt.satisfactionComment = receipt.satisfaction >= 5 ? "\u7EF4\u4FEE\u8D28\u91CF\u5F88\u597D\uFF0C\u8D70\u65F6\u51C6\u786E\uFF0C\u670D\u52A1\u6001\u5EA6\u597D" : "\u6574\u4F53\u6EE1\u610F\uFF0C\u5C31\u662F\u7EF4\u4FEE\u65F6\u95F4\u6709\u70B9\u957F";
      }
    }
    const order = {
      id: `wo${i + 1}`,
      orderNo: `WS${String(now.getFullYear()).slice(-2)}${String(1001 + i).padStart(4, "0")}`,
      customer,
      watchBrand: watch.brand,
      watchModel: watch.model,
      watchSerial: watch.serial,
      problemDesc: problem,
      inspectionResult: statusConfig.timelineSteps > 2 ? inspectionResult : void 0,
      status: statusConfig.status,
      priority,
      receivedAt: receivedAt.toISOString(),
      expectedDate: statusConfig.status !== "completed" && statusConfig.status !== "picked_up" ? new Date(receivedAt.getTime() + 7 * 864e5).toISOString() : void 0,
      quote,
      parts,
      timeline,
      progress,
      receipt,
      assignedTo: "3",
      createdBy: "2",
      createdAt: receivedAt.toISOString(),
      updatedAt: timeline.length > 0 ? timeline[timeline.length - 1].createdAt : receivedAt.toISOString(),
      rejectReason: statusConfig.status === "rejected" ? "\u62A5\u4EF7\u8FC7\u9AD8\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6838\u7B97\u96F6\u4EF6\u6210\u672C" : void 0,
      customerRejectReason: statusConfig.status === "customer_rejected" ? "\u5BA2\u6237\u8BA4\u4E3A\u7EF4\u4FEE\u8D39\u7528\u8D85\u8FC7\u624B\u8868\u6B8B\u503C" : void 0
    };
    workOrders.push(order);
  }
  return workOrders;
}
let mockWorkOrders = createMockWorkOrders();
function getDashboardStats() {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const pendingStatuses = ["pending_review", "quoting", "pending_approval", "pending_confirm", "repairing"];
  const rejectedStatuses = ["rejected", "customer_rejected"];
  const weekAgo = new Date(today.getTime() - 7 * 864e5);
  const completedThisWeek = mockWorkOrders.filter(
    (wo) => (wo.status === "completed" || wo.status === "picked_up") && new Date(wo.updatedAt) >= weekAgo
  ).length;
  const totalProcessTime = mockWorkOrders.filter((wo) => wo.status === "picked_up").reduce((sum, wo) => {
    const start = new Date(wo.createdAt).getTime();
    const end = new Date(wo.updatedAt).getTime();
    return sum + (end - start) / (1e3 * 60 * 60 * 24);
  }, 0);
  const avgProcessTime = mockWorkOrders.filter((wo) => wo.status === "picked_up").length > 0 ? Math.round(totalProcessTime / mockWorkOrders.filter((wo) => wo.status === "picked_up").length * 10) / 10 : 0;
  const needSatisfactionSurvey = mockWorkOrders.filter(
    (wo) => {
      var _a;
      return wo.status === "picked_up" && (!((_a = wo.receipt) == null ? void 0 : _a.satisfaction) || wo.receipt.satisfaction === 0);
    }
  ).length;
  return {
    pending: mockWorkOrders.filter((wo) => pendingStatuses.includes(wo.status)).length,
    rejected: mockWorkOrders.filter((wo) => rejectedStatuses.includes(wo.status)).length,
    needReview: mockWorkOrders.filter((wo) => wo.status === "pending_approval").length,
    todayNew: mockWorkOrders.filter((wo) => new Date(wo.createdAt) >= today).length,
    completedThisWeek,
    avgProcessTime,
    needFollowUp: needSatisfactionSurvey
  };
}

const parts_get = defineEventHandler(() => {
  return mockPartInventory;
});

const parts_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: parts_get
}, Symbol.toStringTag, { value: 'Module' }));

const stats_get = defineEventHandler(() => {
  return getDashboardStats();
});

const stats_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: stats_get
}, Symbol.toStringTag, { value: 'Module' }));

const workorders_get = defineEventHandler((event) => {
  const query = getQuery$1(event);
  const { status, priority, search, page = 1, limit = 20 } = query;
  let orders = [...mockWorkOrders];
  if (status && typeof status === "string") {
    const statuses = status.split(",");
    orders = orders.filter((wo) => statuses.includes(wo.status));
  }
  if (priority && typeof priority === "string") {
    const priorities = priority.split(",");
    orders = orders.filter((wo) => priorities.includes(wo.priority));
  }
  if (search && typeof search === "string") {
    const searchLower = search.toLowerCase();
    orders = orders.filter(
      (wo) => wo.orderNo.toLowerCase().includes(searchLower) || wo.customer.name.toLowerCase().includes(searchLower) || wo.watchBrand.toLowerCase().includes(searchLower) || wo.watchModel.toLowerCase().includes(searchLower)
    );
  }
  const total = orders.length;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const data = orders.slice(start, end);
  return {
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  };
});

const workorders_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: workorders_get
}, Symbol.toStringTag, { value: 'Module' }));

const _id__get = defineEventHandler((event) => {
  const id = getRouterParam(event, "id");
  const order = mockWorkOrders.find((wo) => wo.id === id);
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "\u5DE5\u5355\u4E0D\u5B58\u5728"
    });
  }
  return order;
});

const _id__get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__get
}, Symbol.toStringTag, { value: 'Module' }));

const _id__patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const index = mockWorkOrders.findIndex((wo) => wo.id === id);
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: "\u5DE5\u5355\u4E0D\u5B58\u5728"
    });
  }
  const updatedOrder = {
    ...mockWorkOrders[index],
    ...body,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  mockWorkOrders[index] = updatedOrder;
  return updatedOrder;
});

const _id__patch$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__patch
}, Symbol.toStringTag, { value: 'Module' }));

function getCurrentUser(role) {
  return mockUsers.find((u) => u.role === role) || mockUsers[0];
}
function createTimelineEntry(action, operator, operatorRole, remark) {
  return {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    operator,
    operatorRole,
    remark,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createProgressEntry(workOrderId, status, description, operator, operatorRole) {
  return {
    id: `pg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workOrderId,
    status,
    description,
    operator,
    operatorRole,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
const action_post = defineEventHandler(async (event) => {
  var _a;
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { actionType, role = "technician", ...data } = body;
  const index = mockWorkOrders.findIndex((wo) => wo.id === id);
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: "\u5DE5\u5355\u4E0D\u5B58\u5728"
    });
  }
  const currentUser = getCurrentUser(role);
  const order = mockWorkOrders[index];
  const timeline = [...order.timeline];
  let newStatus = order.status;
  let newQuote = order.quote;
  let newParts = order.parts;
  let newProgress = order.progress;
  let newReceipt = order.receipt;
  let updates = {};
  switch (actionType) {
    case "start_inspect": {
      newStatus = "quoting";
      timeline.push(createTimelineEntry("\u5F00\u59CB\u68C0\u6D4B", currentUser.name, currentUser.role, data.remark));
      newProgress.push(createProgressEntry(id, "inspecting", "\u5F00\u59CB\u68C0\u6D4B\u624B\u8868\u6545\u969C", currentUser.name, currentUser.role));
      if (data.inspectionResult) {
        updates.inspectionResult = data.inspectionResult;
      }
      break;
    }
    case "lock_parts": {
      if (data.parts && data.parts.length > 0) {
        const newPartLocks = data.parts.map((p, idx) => ({
          id: `pl-${Date.now()}-${idx}`,
          partName: p.partName,
          partCode: p.partCode,
          quantity: p.quantity,
          status: "locked",
          lockedBy: currentUser.id,
          lockedAt: (/* @__PURE__ */ new Date()).toISOString()
        }));
        newParts = [...order.parts.filter((p) => p.status !== "locked"), ...newPartLocks];
        data.parts.forEach((p) => {
          const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
          if (inv) {
            inv.locked = Math.min(inv.locked + p.quantity, inv.stock);
          }
        });
        timeline.push(createTimelineEntry("\u9501\u5B9A\u914D\u4EF6", currentUser.name, currentUser.role, `\u9501\u5B9A ${data.parts.length} \u79CD\u914D\u4EF6`));
        newProgress.push(createProgressEntry(id, "parts_preparing", "\u914D\u4EF6\u5DF2\u9501\u5B9A\uFF0C\u51C6\u5907\u5C31\u7EEA", currentUser.name, currentUser.role));
      }
      break;
    }
    case "release_parts": {
      newParts = order.parts.map((p) => ({
        ...p,
        status: "released"
      }));
      order.parts.forEach((p) => {
        const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      timeline.push(createTimelineEntry("\u91CA\u653E\u914D\u4EF6", currentUser.name, currentUser.role, "\u5DF2\u91CA\u653E\u6240\u6709\u9501\u5B9A\u7684\u914D\u4EF6"));
      break;
    }
    case "submit_quote": {
      newStatus = "pending_approval";
      if (data.partsCost !== void 0 && data.laborCost !== void 0) {
        const amount = data.partsCost + data.laborCost;
        newQuote = {
          id: ((_a = order.quote) == null ? void 0 : _a.id) || `q-${Date.now()}`,
          workOrderId: id,
          amount,
          partsCost: data.partsCost,
          laborCost: data.laborCost,
          status: "submitted",
          remark: data.remark,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        timeline.push(createTimelineEntry("\u63D0\u4EA4\u62A5\u4EF7", currentUser.name, currentUser.role, `\u62A5\u4EF7\u91D1\u989D: \xA5${amount}`));
      }
      break;
    }
    case "approve_quote": {
      newStatus = "pending_confirm";
      if (newQuote) {
        newQuote = {
          ...newQuote,
          status: "approved",
          approvedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      timeline.push(createTimelineEntry("\u5BA1\u6279\u901A\u8FC7", currentUser.name, currentUser.role, data.remark || "\u62A5\u4EF7\u5408\u7406\uFF0C\u540C\u610F"));
      break;
    }
    case "reject_quote": {
      newStatus = "rejected";
      if (newQuote) {
        newQuote = {
          ...newQuote,
          status: "rejected"
        };
      }
      newParts = order.parts.map((p) => ({
        ...p,
        status: "released"
      }));
      order.parts.forEach((p) => {
        const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      updates.rejectReason = data.rejectReason;
      timeline.push(createTimelineEntry("\u5BA1\u6279\u9A73\u56DE", currentUser.name, currentUser.role, data.rejectReason));
      break;
    }
    case "send_confirmation": {
      timeline.push(createTimelineEntry("\u53D1\u9001\u5BA2\u6237\u786E\u8BA4", currentUser.name, currentUser.role, "\u5DF2\u901A\u8FC7\u77ED\u4FE1\u53D1\u9001\u62A5\u4EF7\u786E\u8BA4"));
      break;
    }
    case "customer_confirm": {
      newStatus = "repairing";
      if (!newReceipt) {
        newReceipt = {
          id: `receipt-${id}`,
          workOrderId: id,
          confirmed: true,
          pickedUp: false,
          confirmedAt: (/* @__PURE__ */ new Date()).toISOString(),
          confirmedBy: order.customer.name
        };
      } else {
        newReceipt = {
          ...newReceipt,
          confirmed: true,
          confirmedAt: (/* @__PURE__ */ new Date()).toISOString(),
          confirmedBy: order.customer.name
        };
      }
      timeline.push(createTimelineEntry("\u5BA2\u6237\u786E\u8BA4", currentUser.name, currentUser.role, "\u5BA2\u6237\u786E\u8BA4\u540C\u610F\u7EF4\u4FEE"));
      newProgress.push(createProgressEntry(id, "repairing", "\u5BA2\u6237\u786E\u8BA4\uFF0C\u5F00\u59CB\u7EF4\u4FEE", currentUser.name, currentUser.role));
      break;
    }
    case "customer_reject": {
      newStatus = "customer_rejected";
      newParts = order.parts.map((p) => ({
        ...p,
        status: "released"
      }));
      order.parts.forEach((p) => {
        const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      updates.customerRejectReason = data.rejectReason;
      timeline.push(createTimelineEntry("\u5BA2\u6237\u9A73\u56DE", currentUser.name, currentUser.role, data.rejectReason));
      break;
    }
    case "start_repair": {
      newStatus = "repairing";
      timeline.push(createTimelineEntry("\u5F00\u59CB\u7EF4\u4FEE", currentUser.name, currentUser.role, "\u5F00\u59CB\u6267\u884C\u7EF4\u4FEE\u5DE5\u4F5C"));
      newProgress.push(createProgressEntry(id, "repairing", "\u5F00\u59CB\u6267\u884C\u7EF4\u4FEE\u5DE5\u4F5C", currentUser.name, currentUser.role));
      break;
    }
    case "update_progress": {
      if (data.remark) {
        newProgress.push(createProgressEntry(id, "repairing", data.remark, currentUser.name, currentUser.role));
        timeline.push(createTimelineEntry("\u66F4\u65B0\u8FDB\u5EA6", currentUser.name, currentUser.role, data.remark));
      }
      break;
    }
    case "complete_repair": {
      newStatus = "completed";
      newParts = order.parts.map((p) => ({
        ...p,
        status: "used"
      }));
      order.parts.forEach((p) => {
        const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
        if (inv) {
          inv.stock = Math.max(0, inv.stock - p.quantity);
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      timeline.push(createTimelineEntry("\u7EF4\u4FEE\u5B8C\u6210", currentUser.name, currentUser.role, "\u7EF4\u4FEE\u5B8C\u6210\uFF0C\u68C0\u6D4B\u901A\u8FC7"));
      newProgress.push(createProgressEntry(id, "completed", "\u7EF4\u4FEE\u5B8C\u6210\uFF0C\u68C0\u6D4B\u901A\u8FC7", currentUser.name, currentUser.role));
      break;
    }
    case "notify_pickup": {
      timeline.push(createTimelineEntry("\u901A\u77E5\u53D6\u4EF6", currentUser.name, currentUser.role, "\u5DF2\u901A\u8FC7\u77ED\u4FE1\u901A\u77E5\u5BA2\u6237\u53D6\u4EF6"));
      break;
    }
    case "confirm_pickup": {
      newStatus = "picked_up";
      if (!newReceipt) {
        newReceipt = {
          id: `receipt-${id}`,
          workOrderId: id,
          confirmed: true,
          pickedUp: true,
          pickedUpAt: (/* @__PURE__ */ new Date()).toISOString(),
          pickedUpBy: order.customer.name,
          pickupNote: data.pickupNote
        };
      } else {
        newReceipt = {
          ...newReceipt,
          pickedUp: true,
          pickedUpAt: (/* @__PURE__ */ new Date()).toISOString(),
          pickedUpBy: order.customer.name,
          pickupNote: data.pickupNote
        };
      }
      timeline.push(createTimelineEntry("\u5BA2\u6237\u53D6\u4EF6", currentUser.name, currentUser.role, data.pickupNote || "\u5BA2\u6237\u5DF2\u53D6\u8868"));
      break;
    }
    case "satisfaction_survey": {
      if (data.satisfaction !== void 0) {
        if (!newReceipt) {
          newReceipt = {
            id: `receipt-${id}`,
            workOrderId: id,
            confirmed: true,
            pickedUp: true,
            satisfaction: data.satisfaction,
            satisfactionComment: data.satisfactionComment,
            satisfactionAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        } else {
          newReceipt = {
            ...newReceipt,
            satisfaction: data.satisfaction,
            satisfactionComment: data.satisfactionComment,
            satisfactionAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        timeline.push(createTimelineEntry("\u6EE1\u610F\u5EA6\u56DE\u8BBF", currentUser.name, currentUser.role, `\u6EE1\u610F\u5EA6: ${data.satisfaction}\u661F ${data.satisfactionComment || ""}`));
      }
      break;
    }
    case "reopen": {
      newStatus = "pending_review";
      timeline.push(createTimelineEntry("\u91CD\u65B0\u5904\u7406", currentUser.name, currentUser.role, data.remark || "\u5DE5\u5355\u5DF2\u91CD\u65B0\u6253\u5F00"));
      break;
    }
    case "close": {
      timeline.push(createTimelineEntry("\u5173\u95ED\u5DE5\u5355", currentUser.name, currentUser.role, data.remark || "\u5DE5\u5355\u5DF2\u5173\u95ED"));
      break;
    }
    default:
      throw createError({
        statusCode: 400,
        statusMessage: "\u4E0D\u652F\u6301\u7684\u64CD\u4F5C\u7C7B\u578B"
      });
  }
  const updatedOrder = {
    ...order,
    ...updates,
    status: newStatus,
    quote: newQuote,
    parts: newParts,
    progress: newProgress,
    receipt: newReceipt,
    timeline,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  mockWorkOrders[index] = updatedOrder;
  return updatedOrder;
});

const action_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: action_post
}, Symbol.toStringTag, { value: 'Module' }));

function renderPayloadResponse(ssrContext) {
	return {
		body: encodeForwardSlashes(stringify(splitPayload(ssrContext).payload, ssrContext["~payloadReducers"])) ,
		statusCode: getResponseStatus(ssrContext.event),
		statusMessage: getResponseStatusText(ssrContext.event),
		headers: {
			"content-type": "application/json;charset=utf-8" ,
			"x-powered-by": "Nuxt"
		}
	};
}
function renderPayloadJsonScript(opts) {
	const contents = opts.data ? encodeForwardSlashes(stringify(opts.data, opts.ssrContext["~payloadReducers"])) : "";
	const payload = {
		"type": "application/json",
		"innerHTML": contents,
		"data-nuxt-data": appId,
		"data-ssr": !(opts.ssrContext.noSSR)
	};
	{
		payload.id = "__NUXT_DATA__";
	}
	if (opts.src) {
		payload["data-src"] = opts.src;
	}
	const config = uneval(opts.ssrContext.config);
	return [payload, { innerHTML: `window.__NUXT__={};window.__NUXT__.config=${config}` }];
}

function encodeForwardSlashes(str) {
	return str.replaceAll("/", "\\u002F");
}
function splitPayload(ssrContext) {
	const { data, prerenderedAt, ...initial } = ssrContext.payload;
	return {
		initial: {
			...initial,
			prerenderedAt
		},
		payload: {
			data,
			prerenderedAt
		}
	};
}

const renderSSRHeadOptions = {"omitLineBreaks":false};

// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__buildAssetsURL = buildAssetsURL;
// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__publicAssetsURL = publicAssetsURL;
const HAS_APP_TELEPORTS = !!(appTeleportAttrs.id);
const APP_TELEPORT_OPEN_TAG = HAS_APP_TELEPORTS ? `<${appTeleportTag}${propsToString(appTeleportAttrs)}>` : "";
const APP_TELEPORT_CLOSE_TAG = HAS_APP_TELEPORTS ? `</${appTeleportTag}>` : "";
const PAYLOAD_URL_RE = /^[^?]*\/_payload.json(?:\?.*)?$/ ;
const PAYLOAD_FILENAME = "_payload.json" ;
const handler = defineRenderHandler((event) => {
	
	const ssrError = event.path.startsWith("/__nuxt_error") ? getQuery$1(event) : null;
	if (ssrError && !("__unenv__" in event.node.req)) {
		throw createError({
			status: 404,
			statusText: "Page Not Found: /__nuxt_error",
			message: "Page Not Found: /__nuxt_error"
		});
	}
	return renderRoute(event, ssrError);
});
async function renderRoute(event, ssrError) {
	const nitroApp = useNitroApp();
	
	const ssrContext = createSSRContext(event);
	
	const headEntryOptions = { mode: "server" };
	ssrContext.head.push(appHead, headEntryOptions);
	if (ssrError) {
		
		const status = ssrError.status || ssrError.statusCode;
		if (status) {
			
			ssrError.status = ssrError.statusCode = Number.parseInt(status);
		}
		setSSRError(ssrContext, ssrError);
	}
	
	const routeOptions = getRouteRules(event);
	
	const _PAYLOAD_EXTRACTION = !ssrContext.noSSR && (NUXT_RUNTIME_PAYLOAD_EXTRACTION);
	const isRenderingPayload = (_PAYLOAD_EXTRACTION || routeOptions.prerender) && PAYLOAD_URL_RE.test(ssrContext.url);
	if (isRenderingPayload) {
		const url = ssrContext.url.substring(0, ssrContext.url.lastIndexOf("/")) || "/";
		ssrContext.url = url;
		event._path = event.node.req.url = url;
	}
	if (routeOptions.ssr === false) {
		ssrContext.noSSR = true;
	}
	const payloadURL = _PAYLOAD_EXTRACTION ? joinURL(ssrContext.runtimeConfig.app.cdnURL || ssrContext.runtimeConfig.app.baseURL, ssrContext.url.replace(/\?.*$/, ""), PAYLOAD_FILENAME) + "?" + ssrContext.runtimeConfig.app.buildId : undefined;
	
	const renderer = await getRenderer(ssrContext);
	const _rendered = await renderer.renderToString(ssrContext).catch(async (error) => {
		
		
		if ((ssrContext["~renderResponse"] || ssrContext._renderResponse) && error.message === "skipping render") {
			return {};
		}
		
		const _err = !ssrError && ssrContext.payload?.error || error;
		await ssrContext.nuxt?.hooks.callHook("app:error", _err);
		throw _err;
	});
	
	
	const inlinedStyles = [];
	await ssrContext.nuxt?.hooks.callHook("app:rendered", {
		ssrContext,
		renderResult: _rendered
	});
	if (ssrContext["~renderResponse"] || ssrContext._renderResponse) {
		
		return ssrContext["~renderResponse"] || ssrContext._renderResponse;
	}
	
	if (ssrContext.payload?.error && !ssrError) {
		throw ssrContext.payload.error;
	}
	
	if (isRenderingPayload) {
		const response = renderPayloadResponse(ssrContext);
		return response;
	}
	const NO_SCRIPTS = routeOptions.noScripts;
	
	const { styles, scripts } = getRequestDependencies(ssrContext, renderer.rendererContext);
	
	if (_PAYLOAD_EXTRACTION && !NO_SCRIPTS) {
		ssrContext.head.push({ link: [{
			rel: "preload",
			as: "fetch",
			crossorigin: "anonymous",
			href: payloadURL
		} ] }, headEntryOptions);
	}
	if (ssrContext["~preloadManifest"] && !NO_SCRIPTS) {
		ssrContext.head.push({ link: [{
			rel: "preload",
			as: "fetch",
			fetchpriority: "low",
			crossorigin: "anonymous",
			href: buildAssetsURL(`builds/meta/${ssrContext.runtimeConfig.app.buildId}.json`)
		}] }, {
			...headEntryOptions,
			tagPriority: "low"
		});
	}
	
	if (inlinedStyles.length) {
		ssrContext.head.push({ style: inlinedStyles });
	}
	const link = [];
	for (const resource of Object.values(styles)) {
		
		if ("inline" in getQuery(resource.file)) {
			continue;
		}
		
		
		
		link.push({
			rel: "stylesheet",
			href: renderer.rendererContext.buildAssetsURL(resource.file),
			crossorigin: ""
		});
	}
	if (link.length) {
		ssrContext.head.push({ link }, headEntryOptions);
	}
	if (!NO_SCRIPTS) {
		
		
		
		if (ssrContext["~lazyHydratedModules"]) {
			for (const id of ssrContext["~lazyHydratedModules"]) {
				ssrContext.modules?.delete(id);
			}
		}
		
		ssrContext.head.push({ link: getPreloadLinks(ssrContext, renderer.rendererContext) }, headEntryOptions);
		ssrContext.head.push({ link: getPrefetchLinks(ssrContext, renderer.rendererContext) }, headEntryOptions);
		
		ssrContext.head.push({ script: _PAYLOAD_EXTRACTION ? renderPayloadJsonScript({
			ssrContext,
			data: splitPayload(ssrContext).initial,
			src: payloadURL
		})  : renderPayloadJsonScript({
			ssrContext,
			data: ssrContext.payload
		})  }, {
			...headEntryOptions,
			
			tagPosition: "bodyClose",
			tagPriority: "high"
		});
	}
	
	if (!routeOptions.noScripts) {
		const tagPosition = "head";
		ssrContext.head.push({ script: Object.values(scripts).map((resource) => ({
			type: resource.module ? "module" : null,
			src: renderer.rendererContext.buildAssetsURL(resource.file),
			defer: resource.module ? null : true,
			
			
			tagPosition,
			crossorigin: ""
		})) }, headEntryOptions);
	}
	const { headTags, bodyTags, bodyTagsOpen, htmlAttrs, bodyAttrs } = await renderSSRHead(ssrContext.head, renderSSRHeadOptions);
	
	const htmlContext = {
		htmlAttrs: htmlAttrs ? [htmlAttrs] : [],
		head: normalizeChunks([headTags]),
		bodyAttrs: bodyAttrs ? [bodyAttrs] : [],
		bodyPrepend: normalizeChunks([bodyTagsOpen, ssrContext.teleports?.body]),
		body: [replaceIslandTeleports(ssrContext, _rendered.html) , APP_TELEPORT_OPEN_TAG + (HAS_APP_TELEPORTS ? joinTags([ssrContext.teleports?.[`#${appTeleportAttrs.id}`]]) : "") + APP_TELEPORT_CLOSE_TAG],
		bodyAppend: [bodyTags]
	};
	
	await nitroApp.hooks.callHook("render:html", htmlContext, { event });
	
	return {
		body: renderHTMLDocument(htmlContext),
		statusCode: getResponseStatus(event),
		statusMessage: getResponseStatusText(event),
		headers: {
			"content-type": "text/html;charset=utf-8",
			"x-powered-by": "Nuxt"
		}
	};
}
function normalizeChunks(chunks) {
	const result = [];
	for (const _chunk of chunks) {
		const chunk = _chunk?.trim();
		if (chunk) {
			result.push(chunk);
		}
	}
	return result;
}
function joinTags(tags) {
	return tags.join("");
}
function joinAttrs(chunks) {
	if (chunks.length === 0) {
		return "";
	}
	return " " + chunks.join(" ");
}
function renderHTMLDocument(html) {
	return "<!DOCTYPE html>" + `<html${joinAttrs(html.htmlAttrs)}>` + `<head>${joinTags(html.head)}</head>` + `<body${joinAttrs(html.bodyAttrs)}>${joinTags(html.bodyPrepend)}${joinTags(html.body)}${joinTags(html.bodyAppend)}</body>` + "</html>";
}

const renderer = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: handler
}, Symbol.toStringTag, { value: 'Module' }));
//# sourceMappingURL=index.mjs.map
