
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
  var options = {
    body: 'You successfully subscribed to our Notification service!'
  }
  new Notification('Successfully subscribed!', options);
}

function askForNotificationPermission(){
  Notification.requestPermission(function(result){
    console.log('User Choice', result);
    if(result !== 'granted'){
      console.log('No notification permission granted!');
    } else {
      displayConfirmNotification();
    }
  })
}


if('Notification' in window){
  for(var i=0; i< enableNotificationButtons.length; i++){
    enableNotificationButtons[i].style.display = 'inline-block';
    enableNotificationButtons[i].addEventListener('click', askForNotificationPermission);
  }
}

