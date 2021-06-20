# 什么是service worker
```
pages  <--->   service worker    <--->  server
                      ↓
                cacheSotrage
一个服务器与浏览器之间的中间人角色，如果网站中注册了service worker
那么它可以拦截当前网站所有的请求，进行判断（需要编写相应的判断程序），
如果需要向服务器发起请求的就转给服务器，
如果可以直接使用缓存的就直接返回缓存不再转给服务器。从而大大提高浏览体验。
```
## service worker的特点
+ 不能直接访问DOM
+ 需要时直接唤醒,不需要时自动休眠
+ 离线缓存内容开发者可控
+ 一旦被安装永远存活,除非手动卸载
+ 必须再HTTPS环境下工作(本地除外)
+ 广泛使用Promise

## service worker的使用流程
+ 1. service worker URL 通过 serviceWorkerContainer.register() 来获取和注册。
+ 2. 如果注册成功，service worker 就在 ServiceWorkerGlobalScope 环境中运行； 这是一个特殊类型的 worker 上下文运行环境，与主运行线程（执行脚本）相独立，同时也没有访问 DOM 的能力。
+ 3. service worker 现在可以处理事件了。
+ 4. 受 service worker 控制的页面打开后会尝试去安装 service worker。最先发送给 service worker 的事件是安装事件(在这个事件里可以开始进行填充 IndexDB和缓存站点资源)。这个流程同原生 APP 或者 Firefox OS APP 是一样的 — 让所有资源可离线访问。
+ 5. 当 oninstall 事件的处理程序执行完毕后，可以认为 service worker 安装完成了。
+ 6. 下一步是激活。当 service worker 安装完成后，会接收到一个激活事件(activate event)。 onactivate 主要用途是清理先前版本的 service worker 脚本中使用的资源。
+ 7. Service Worker 现在可以控制页面了，但仅是在 register()  成功后的打开的页面。也就是说，页面起始于有没有 service worker ，且在页面的接下来生命周期内维持这个状态。所以，页面不得不重新加载以让 service worker 获得完全的控制。
# 如何使用service worker
+ 1. 注册 register
>在需要使用service worker的APP中注册service worker,比如在main.ts中加入
```js
/* 判断当前浏览器是否支持serviceWorker */
if ('serviceWorker' in navigator) {
    /* 当页面加载完成就创建一个serviceWorker */
    window.addEventListener('load', function () {
        /* 创建并指定对应的执行内容 */
        /* scope 参数是可选的，可以用来指定你想让 service worker 控制的内容的子目录。 在这个例子里，我们指定了 '/'，表示 根网域下的所有内容。这也是默认值。 */
        navigator.serviceWorker.register('./serviceWorker.js', {scope: './'})
            .then(function (registration) {

                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(function (err) {

                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
```
+ 2. 安装  接下来的操作都是在serviceWorker.js中进行的
>在我们指定的处理程序serviceWorker.js中书写对应的安装及拦截逻辑
因为install/activate事件可能需要一段时间才能完成，
所以 Service Worker 规范提供了一种waitUntil()方法。
一旦它被调用install或activate带有Promise的事件，
诸如fetch和 之类的功能事件push将等到Promise成功解决。

```js
/* 监听安装事件，install 事件一般是被用来设置你的浏览器的离线缓存逻辑 */
this.addEventListener('install', function (event) {
 	
    /* 通过这个方法可以防止缓存未完成，就关闭serviceWorker */
    //这会确保Service Worker 不会在 waitUntil() 里面的代码执行完毕之前安装完成。
    event.waitUntil(
        /* 创建一个名叫V1的缓存版本 */
        /*使用了 Service Worker 的新的标志性的存储 API — cache — 一个 
        service worker 上的全局对象，它使我们可以存储网络响应发来的资源，
        并且根据它们的请求来生成key。这个 API 和浏览器的标准的缓存工作原理很相似，
        但是是特定你的域的。它会一直持久存在，直到你告诉它不再存储，
        你拥有全部的控制权。*/
        caches.open('v1').then(function (cache) {
            /* 指定要缓存的内容，地址为相对于跟域名的访问路径 */
            return cache.addAll([
                './index.html',
                 '/sw-test/',
                '/sw-test/index.html',
                '/sw-test/style.css',
                '/sw-test/app.js',
                '/sw-test/image-list.js',
                '/sw-test/star-wars-logo.jpg',
                '/sw-test/gallery/',
                '/sw-test/gallery/bountyHunters.jpg',
                '/sw-test/gallery/myLittleVader.jpg',
                '/sw-test/gallery/snowTroopers.jpg'
            ]);
        })
    );
});

/* 注册fetch事件，拦截全站的请求 */
this.addEventListener('fetch', function(event) {
  event.respondWith(
    // magic goes here
      
      /* 在缓存中匹配对应请求资源直接返回 */
    caches.match(event.request)
  );
});
```

>当安装成功完成之后， service worker 就会激活
现在你已经将你的站点资源缓存了，你需要告诉 service worker
让它用这些缓存内容来做点什么。有了 fetch 事件，这是很容易做到的。

```js
/*
每次任何被 service worker 控制的资源被请求到时，
都会触发 fetch 事件，这些资源包括了指定的 scope 内的文档，
和这些文档内引用的其他任何资源（比如 index.html 发起了一个跨域的请求来嵌入一个图片，
这个也会通过 service worker 。）

你可以给 service worker 添加一个 fetch 的事件监听器，
接着调用 event 上的 respondWith() 方法来劫持我们的 HTTP 响应，
然后你用可以用自己的方法来更新他们。
*/
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
//caches.match(event.request) 允许我们对网络请求的资源和 cache 
//里可获取的资源进行匹配，查看是否缓存中有相应的资源。
//1. 如果没有在缓存中找到匹配的资源,直接告诉浏览器去fetch
fetch(event.request)
//2. 如果没有在缓存中找到匹配的资源,网络也不可以用,你可以用 match() 把一些回退的页面作为响应来匹配这些资源，比
caches.match('/fallback.html');
```
>将请求的资源保存到缓存中,以便离线使用

```js
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(resp) {
      return resp || fetch(event.request).then(function(response) {
        return caches.open('v1').then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
/*
这里我们用 fetch(event.request) 返回了默认的网络请求，它返回了一个 promise 。当网络请求的 promise 成功的时候，我们 通过执行一个函数用 caches.open('v1') 来抓取我们的缓存，它也返回了一个 promise。当这个 promise 成功的时候， cache.put() 被用来把这些资源加入缓存中。资源是从  event.request 抓取的，它的响应会被  response.clone() 克隆一份然后被加入缓存。这个克隆被放到缓存中，它的原始响应则会返回给浏览器来给调用它的页面。

为什么要这样做？这是因为请求和响应流只能被读取一次。为了给浏览器返回响应以及把它缓存起来，我们不得不克隆一份。所以原始的会返回给浏览器，克隆的会发送到缓存中。它们都是读取了一次。
*/
```
>未匹配到缓存以及网络不可用的时候,兜底方案
```js
this.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function() {
      return fetch(event.request).then(function(response) {
        return caches.open('v1').then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(function() {
      return caches.match('/sw-test/gallery/myLittleVader.jpg');
    })
  );
});
```
>更新service worker
如果你的 service worker 已经被安装，但是刷新页面时有一个新版本的可用，新版的 service worker 会在后台安装，但是还没激活。当不再有任何已加载的页面在使用旧版的 service worker 的时候，新版本才会激活。一旦再也没有更多的这样已加载的页面，新的 service worker 就会被激活。

你应该把你的新版的 service worker 里的  install 事件监听器改成下面这样（注意新的版本号）：
```js
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('v2').then(function(cache) {
        //抓取一个URL数组，检索并把返回的response对象添加到给定的Cache对象。
        //这在功能上等同于调用 fetch(), 然后使用 Cache.put() 将response添加到cache中.
      return cache.addAll([
        '/sw-test/',
        '/sw-test/index.html',
        '/sw-test/style.css',
        '/sw-test/app.js',
        '/sw-test/image-list.js',

        …

        // include other new resources for the new version...
      ]);
    })
  );
});
当安装发生的时候，前一个版本依然在响应请求，新的版本正在后台安装，我们调用了一个新的缓存 v2，所以前一个 v1 版本的缓存不会被扰乱。

当没有页面在使用当前的版本的时候，这个新的 service worker 就会激活并开始响应请求
```
+ 3. 激活事件(用于删除旧的缓存)
你还有个 activate 事件。当之前版本还在运行的时候，一般被用来做些会破坏它的事情，比如摆脱旧版的缓存。在避免占满太多磁盘空间清理一些不再需要的数据的时候也是非常有用的，每个浏览器都对 service worker 可以用的缓存空间有个硬性的限制。浏览器尽力管理磁盘空间，但它可能会删除整个域的缓存。浏览器通常会删除域下面的所有的数据。

传给 waitUntil() 的 promise 会阻塞其他的事件，直到它完成。所以你可以确保你的清理操作会在你的的第一次 fetch 事件之前会完成。
```js
self.addEventListener('activate', function(event) {
  var cacheWhitelist = ['v2'];

  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (cacheWhitelist.indexOf(key) === -1) {
            //搜索key值为request的Cache 条目如果找到，则删除该Cache 条目
          return caches.delete(key);
        }
      }));
    })
  );
});
```
如果有可用的 service worker，新版本会在后台安装，但尚未激活——此时它被称为worker in waiting。它仅在不再加载任何仍在使用旧服务工作者的页面时激活。一旦没有更多页面要加载，新的 service worker 就会激活（成为active worker）。使用可以更快地进行激活ServiceWorkerGlobalScope.skipWaiting()，并且活动工作人员可以使用Clients.claim().

Clients 接口的  claim() 方法允许一个激活的 service worker 将自己设置为其 scope (en-US) 内所有clients 的controller . 这会在由此service worker 控制的任何 clients 中触发 navigator.serviceWorker  上的  "controllerchange"  事件.

先触发controllerchange再触发clients.claim()

当一个 service worker 被初始注册时，页面在下次加载之前不会使用它。 claim() 方法会立即控制这些页面。请注意，这会导致 service worker 控制通过网络定期加载的页面，或者可能通过不同的 service worker 加载.