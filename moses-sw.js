const CACHE="moses-pwa-v1";
const SHELL=["/moses-app.html","/moses-app.css?v=1","/moses-app.js?v=1","/moses.webmanifest","/assets/moses-app-icon-192.svg","/assets/moses-app-icon-512.svg"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(e.request.mode==="navigate"){
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put("/moses-app.html",c));return r}).catch(()=>caches.match("/moses-app.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});