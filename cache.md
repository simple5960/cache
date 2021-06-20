# HTTP缓存机制
[img](https://user-gold-cdn.xitu.io/2020/5/10/171fea0fec0b4668?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)
## 缓存位置
```
我们可以在 Chrome 的开发者工具中，Network -> Size 一列看到一个请求最终的处理方式：
如果是大小 (多少 K， 多少 M 等) 就表示是网络请求，
否则会列出 from memory cache, from disk cache 和 from ServiceWorker。
Service Worker
Memory Cache(内存)
Disk Cache(本地硬盘)
网络请求
```
## [service worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)
```
service workerk可以拦截页面向服务端发送的网络请求

pages  <--->   service worker    <--->  server
                      ↓
                cacheSotrage
```
>service worker是一个特殊的web worker,独立于渲染主线程,有以下特性

+ 不能直接访问DOM
+ 需要时直接唤醒,不需要时自动休眠
+ 离线缓存内容开发者可控
+ 一旦被安装永远存活,除非手动卸载
+ 必须再HTTPS环境下工作(本地除外)
+ 广泛使用Promise



## 强缓存
```
不需要发送请求到服务端,直接读取浏览器本地缓存,在Chrome的Network中显示HTTP状态码为200
在Chrome中,强缓存分为Disk Cache(存在硬盘中)和Memory Cacha(存在内存中),存放位置由浏览器控制
是否强缓存由Expires,Cache-Control和Pragma 3个Header属性控制

```
### Expires
```
Expires是一个HTTP日期值,在浏览器发送请求的时候,会把系统时间和其进行比较
如果系统时间超过Expires的值,缓存失效,但是可能系统时间和服务器时间不一致
所以Expires优先级最低
```
### Cache-Control
Cache-Control 是 HTTP/1.1 中新增的属性，在请求头和响应头中都可以使用，常用的属性值如有：

+ max-age：单位是秒，缓存时间计算的方式是距离发起的时间的秒数，超过间隔的秒数缓存失效
+ no-cache：不使用强缓存，需要与服务器验证缓存是否新鲜
+ no-store：禁止使用缓存（包括协商缓存），每次都向服务器请求最新的资源
+ private：专用于个人的缓存，中间代理、CDN 等不能缓存此响应
+ public：响应可以被中间代理、CDN 等缓存
+ must-revalidate：在缓存过期前可以使用，过期后必须向服务器验证
### Pragma
Pragma 只有一个属性值，就是 no-cache ，效果和 Cache-Control 中的 no-cache 一致，不使用强缓存，需要与服务器验证缓存是否新鲜，在 3 个头部属性中的优先级最高。
## 协商缓存
当浏览器的强缓存失效的时候或者请求头中设置了不走强缓存，
并且在请求头中设置了If-Modified-Since 或者 If-None-Match 的时候，
会将这两个属性值到服务端去验证是否命中协商缓存，如果命中了协商缓存，
会返回 304 状态，加载浏览器缓存，并且响应头会设置 Last-Modified 或者 ETag 属性。
### ETag/If-None-Match
```
ETag/If-None-Match 的值是一串 hash 码，代表的是一个资源的标识符，
当服务端的文件变化的时候，它的 hash码会随之改变，
通过请求头中的 If-None-Match 和当前文件的 hash 值进行比较，如果相等则表示命中协商缓存
```
### Last-Modified/If-Modified-Since
```
Last-Modified/If-Modified-Since 的值代表的是文件的最后修改时间
，第一次请求服务端会把资源的最后修改时间放到 Last-Modified 响应头中，
第二次发起请求的时候，请求头会带上上一次响应头中的 Last-Modified 的时间，
并放到 If-Modified-Since 请求头属性中，服务端根据文件最后一次修改时间和
If-Modified-Since 的值进行比较，如果相等，返回 304 ，并加载浏览器缓存。
```



