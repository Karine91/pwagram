importScripts("workbox-sw.prod.v2.1.3.js");
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "google-fonts",
    cacheExpiration: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30
    }
  })
);

workboxSW.router.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "material-css"
  })
);

workboxSW.router.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "post-images"
  })
);

workboxSW.router.registerRoute(
  "https://pgram-836b3.firebaseio.com/posts.json",
  function(args) {
    return fetch(args.event.request).then(function(res) {
      var clonedRes = res.clone();
      clearAllData("posts")
        .then(function() {
          return clonedRes.json();
        })
        .then(function(data) {
          for (var key in data) {
            writeData("posts", data[key]);
          }
        });
      return res;
    });
  }
);

workboxSW.router.registerRoute(
  function(routeData){
      return (routeData.event.request.headers.get('accept').includes('text/html'));
  },
  function(args) {
    return caches
      .match(args.event.request)
      .then(function(response) {
        if (response) {
          return response;
        } else {
          return fetch(args.event.request)
            .then(function(res) {
              return caches
                .open('dynamic')
                .then(function(cache) {
                  // trimCache(CACHE_DYNAMIC_NAME, 3);
                  cache.put(args.event.request.url, res.clone());
                  return res;
                });
            })
            .catch(function(err) {
              console.log(err);
              return caches
                .match('/offline.html')
                .then(function(res) {
                  return res;
                });
            });
        }
      });
  }
);

workboxSW.precache([
  {
    "url": "404.html",
    "revision": "a4e2271d19eb1f6f93a15e1b7a4e74dd"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "8d57577a2c3f8d7c7fe2c0ff802aaccf"
  },
  {
    "url": "manifest.json",
    "revision": "a03dcc57fa73ef4db441cdfc38d9ff96"
  },
  {
    "url": "offline.html",
    "revision": "0556e117187e3659c7eebe4730dd6594"
  },
  {
    "url": "src/css/app.css",
    "revision": "ffed0d57e450481d115a3e1eaccfe002"
  },
  {
    "url": "src/css/feed.css",
    "revision": "6255f7921c623752af3e840e81f0a18f"
  },
  {
    "url": "src/css/help.css",
    "revision": "81922f16d60bd845fd801a889e6acbd7"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  },
  {
    "url": "src/js/app.min.js",
    "revision": "73b8b904f61de6e07bebd9c142c23125"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "73991de89f11dd8ced49140044693768"
  },
  {
    "url": "src/js/fetch.min.js",
    "revision": "480f4a45212646274044b629017908c4"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "88ae80318659221e372dd0d1da3ecf9a"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "e68511951f1285c5cbf4aa510e8a2faf"
  },
  {
    "url": "src/js/promise.min.js",
    "revision": "d62c60740456a237885eba78e763c852"
  },
  {
    "url": "src/js/utility.min.js",
    "revision": "a4d4cb3fb469d7c5e563403c9bac634c"
  }
]);

self.addEventListener("sync", function(event) {
  console.log("[Service Worker] Background syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("[Service Worker] Syncing new Posts");
    event.waitUntil(
      readAllData("sync-posts").then(function(data) {
        for (var dt of data) {
          var postData = new FormData();
          postData.append("id", dt.id);
          postData.append("title", dt.title);
          postData.append("location", dt.location);
          postData.append(
            "file",
            dt.picture,
            dt.id + ".png"
          );
          postData.append(
            "rawLocationLat",
            dt.rawLocation.lat
          );
          postData.append(
            "rawLocationLng",
            dt.rawLocation.lng
          );

          fetch(
            "https://us-central1-pgram-836b3.cloudfunctions.net/storePostData",
            {
              method: "POST",
              body: postData
            }
          )
            .then(function(res) {
              console.log("Sent data", res);
              if (res.ok) {
                res.json().then(function(resData) {
                  deleteItemFromData(
                    "sync-posts",
                    resData.id
                  );
                });
              }
            })
            .catch(function(err) {
              console.log("Error while sending data", err);
            });
        }
      })
    );
  }
});

self.addEventListener("notificationclick", function(event) {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);

  if (action === "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then(function(clis) {
        var client = clis.find(function(c) {
          return c.visibilityState === "visible";
        });

        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener("notificationclose", function(event) {
  console.log("Notification was closed", event);
});

self.addEventListener("push", function(event) {
  console.log("Push Notification received", event);

  var data = {
    title: "New!",
    content: "Something new happened!",
    openUrl: "/"
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});