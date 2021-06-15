//service worker for pwa4
//sw will control the application and ensure it works offline
const version = 1;
let staticCache = `pre-v${version}`;
let dynamicCache = `dynamic-v${version}`;
let assets = [
  '/',
  '/index.html',
  '/gifts.html',
  '/people.html',
  '/password.html',
  '/404.html',
  '/css/main.css',
  '/css/materialize.min.css',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.gstatic.com/s/materialicons/v78/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
  'https://fonts.gstatic.com/s/materialicons/v85/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
  'https://code.jquery.com/jquery-2.1.1.min.js',
  '/manifest.json',
  '/js/app.js',
  '/js/materialize.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.3/js/materialize.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.3/css/materialize.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.3/font/roboto/Roboto-Medium.woff2',
  '/img/apple-touch-icon-iphone-retina-120x120.png',
  '/img/launchericon-48-48.png',
  '/img/launchericon-72-72.png',
  '/img/launchericon-96-96.png',
  '/img/launchericon-144-144.png',
  '/img/launchericon-192-192.png',
  '/img/launchericon-512-512.png',
  '/img/offline.png'
];
let dynamicList = [];

//limiting dynamic cache size
const limitCache = (name, size) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCache(name, size))
      }
    })
  })
}

self.addEventListener('install', (ev) => {
  //install event - browser has installed this version
  //adding all the static files to the static cache.
  console.log('service worker installed')
  ev.waitUntil(
    caches.open(staticCache).then(function (cache) {
      return cache.addAll(assets)
    })
  )
})

self.addEventListener('activate', (ev) => {
  //activate event - browser now using this version
  //deleting old versions of the cache
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            if (key != staticCache && key != dynamicCache) {
              return true
            }
          })
          .map((key) => caches.delete(key))
      ).then((empties) => {
        //console.log(empties + "deleted successfully");
      })
    })
  )
});

self.addEventListener('fetch', (ev) =>{
    ev.respondWith(
      fetch(ev.request)
        .then((fetchResp) => {
          return caches.open(dynamicCache)
          .then((cache) => {
            if (ev.request.method === "GET") {
            cache.put(ev.request, fetchResp.clone())
            }
            return fetchResp;
          });
        })
        .catch(() => {
          return caches.match(ev.request)
            .then((resp) => {
              return resp || caches.match('/404.html');
            })
        })
    );
});

self.addEventListener('message', ({ data }) => {
  //message received from a web page that uses this sw
});

const sendMessage = async (msg) => {
  //send a message from the service worker to the webpage(s)
  let allClients = await clients.matchAll({ includeUncontrolled: true });
  return Promise.all(
    allClients.map((client) => {
      let channel = new MessageChannel();
      channel.port1.onmessage = onMessage;
      //port1 for send port2 for receive
      return client.postMessage(msg, [channel.port2]);
    })
  );
};
