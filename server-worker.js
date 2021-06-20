
let VERSION = 2;
let CACHE_NAME = 'cache_v' + VERSION;
let CACHE_URLS = [
    '/',
    'http://127.0.0.1:7001/getArticleList',
    'http://127.0.0.1:7001/getTypeList'
];

/**
 * test
 *
 * @param {Request} req �������
 * @param {Response} res ��Ӧ����
 */
function saveToCache(req, res) {
    return caches
        .open(CACHE_NAME)
        .then(cache => cache.put(req, res));
}

/**
 * Ԥ����
 *
 * @return {Promise} ����ɹ���promise
 */
function precache() {
    return caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(CACHE_URLS);
    });
}

/**
 * ������ڵ� cache
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
 * ���󲢻�������
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


// �����µĻ���
self.addEventListener('install', function (event) {
    event.waitUntil(
        // ����а汾����,�������оɰ汾,ֱ�Ӽ����°汾sw
        precache().then(self.skipWaiting)
    );
});

// ɾ���ɵĻ���
self.addEventListener('activate', function (event) {
    event.waitUntil(
        Promise.all([
            /*Clients �ӿڵ�  claim() ��������һ������� service worker 
            ���Լ�����Ϊ�� scope (en-US) ������clients ��controller . 
            ������ɴ�service worker ���Ƶ��κ� clients �д��� navigator.serviceWorker  �ϵ�  "controllerchange"  �¼�.*/
            //��ȡ�ɰ汾sw.js�Ŀ���Ȩ
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
