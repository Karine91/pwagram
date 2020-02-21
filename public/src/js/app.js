
var deferredPrompt;
var enableNotificationButtons = document.querySelectorAll(
  ".enable-notifications"
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

// Connection Status
function isOnline () {
  if (navigator.onLine){
    console.log('You are currently online!');
  } else {
    console.log('You are currently offline. Any requests made will be queued and synced as soon as you are connected again.');
  }
}

window.addEventListener('online', isOnline);
window.addEventListener('offline', isOnline);
isOnline();

function displayConfirmNotification(){
  if('serviceWorker' in navigator){
    var options = {
      body:
        "You successfully subscribed to our Notification service!",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boat.jpg",
      dir: "ltr",
      lang: "en-US", //BCP 47
      vibrate: [100, 50, 200], //vibrate, pause, vibrate
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        {
          action: "confirm",
          title: "Okay",
          icon: "/src/images/icons/app-icon-96x96.png"
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png"
        }
      ]
    };

    navigator.serviceWorker.ready
    .then(function(swreq){
      swreq.showNotification(
        "Successfully subscribed",
        options
      );
    })
  }
}

function configurePushSub(){
  if(!('serviceWorker' in navigator)) return;

  var reg;
  navigator.serviceWorker.ready.then(function(swReg){
    reg = swReg;
    return swReg.pushManager.getSubscription();
  }).then(function(sub){
    if(sub === null){
      // create new
      var vapidPublicKey =
        "BPjHGkrrywYUBTUUszskbvwlTN4VX_93JQeerbC3XhktT-274R-W-Mc54MZsq0DdRE_zNrw_1vyR9RpzcLlV24I";
        var convertedVapidPublicKey = urlBase64ToUint8Array(
          vapidPublicKey
        );
      return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidPublicKey
      });
    } else {
      // we have a subscription
    }
  }).then(function(newSub){
    return fetch("https://pgram-836b3.firebaseio.com/subscription.json", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(newSub)
    });
  }).then(function(res){
    if(res.ok){
      displayConfirmNotification();
    }
  }).catch(function(err){
    console.log(err);
  })
}

function askForNotificationPermission(){
  Notification.requestPermission(function(result){
    console.log('User Choice', result);
    if(result !== 'granted'){
      console.log('No notification permission granted!');
    } else {
      configurePushSub();
      //displayConfirmNotification();
    }
  })
}


if('Notification' in window && 'serviceWorker' in navigator){
  for(var i=0; i< enableNotificationButtons.length; i++){
    enableNotificationButtons[i].style.display = 'inline-block';
    enableNotificationButtons[i].addEventListener('click', askForNotificationPermission);
  }
}

