self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('poolbrain-cache').then(function(cache) {
      return cache.addAll([
        // '/index.html',
      ]);
    })
  );
});
var directionRequests = 'DirectionsService.Route';
//http://maps.googleapis.com/maps/api/js/DirectionsService.Route
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('poolbrain-cache').then(function(cache) {
      return cache.match(event.request).then(function (response) {
        if(response !== undefined && event.request.url.indexOf(directionRequests) !== -1){
          return response;
        }
        return fetch(event.request).then(function(response) {
          if(event.request.url.indexOf(directionRequests) !== -1){
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    })
  );
});

//Delete outdated caches
//We can get rid of unused caches in the service worker "activate" event.
/*self.addEventListener('activate', event => {
  const cacheWhitelist = ['poolbrain-cache'];  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});*/
