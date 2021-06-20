
let VERSION = 2;
let CACHE_NAME = 'cache_v' + VERSION;
let CACHE_URLS = [
    '/',
    'http://127.0.0.1:7001/getArticleList',
    'http://127.0.0.1:7001/getTypeList'
];

/**
 * 缓存到 cacheStorage 里
 *
 * @param {Request} req 请求对象
 * @param {Response} res 响应对象
 */
function saveToCache(req, res) {
    return caches
        .open(CACHE_NAME)
        .then(cache => cache.put(req, res));
}

/**
 * 预缓存
 *
 * @return {Promise} 缓存成功的promise
 */
function precache() {
    return caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(CACHE_URLS);
    });
}

/**
 * 清除过期的 cache
 *
 * @return {Promise} promise
 */
function clearStaleCache() {
    return caches.keys().then(keys => {
        keys.forEach(key => {
            if (CACHE_NAME !== key) {
                caches.delete(key);
            }
        });
    });
}

/**
 * 请求并缓存内容
 *
 * @param {Request} req request
 * @return {Promise}
 */
function fetchAndCache(req) {
    return fetch(req)
        .then(function (res) {
            saveToCache(req, res.clone());
            return res;
        });
}


// 下载新的缓存
self.addEventListener('install', function (event) {
    event.waitUntil(
        // 如果有版本更新,跳过运行旧版本,直接激活新版本sw
        precache().then(self.skipWaiting)
    );
});

// 删除旧的缓存
self.addEventListener('activate', function (event) {
    event.waitUntil(
        Promise.all([
            /*Clients 接口的  claim() 方法允许一个激活的 service worker 
            将自己设置为其 scope (en-US) 内所有clients 的controller . 
            这会在由此service worker 控制的任何 clients 中触发 navigator.serviceWorker  上的  "controllerchange"  事件.*/
            //夺取旧版本sw.js的控制权
            self.clients.claim(),
            clearStaleCache()
        ])
    );
});

self.addEventListener('fetch', function (event) {

    if (new URL(event.request.url).origin !== self.origin) {
        return;
    }

    if (event.request.url.includes('/getArticleList')) {
        event.respondWith(
            fetchAndCache(event.request)
                .catch(function () {
                    return caches.match(event.request);
                })
        );
        return;
    }

    event.respondWith(
        fetch(event.request).catch(function () {
            return caches.match(event.request);
        })
    );
});
