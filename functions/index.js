var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./pgram-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pgram-836b3.firebaseio.com/"
});

exports.storePostData = functions.https.onRequest(function(
  request,
  response
) {
  cors(request, response, function() {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image
      })
      .then(function() {
        webpush.setVapidDetails(
          "mailto:fdev66526@gmail.com",
          "BPjHGkrrywYUBTUUszskbvwlTN4VX_93JQeerbC3XhktT-274R-W-Mc54MZsq0DdRE_zNrw_1vyR9RpzcLlV24I",
          "SjEHVwxFdY0GxAFongkHKVq_gyDpkHPqyZ01p0uHO5A"
        );
        return admin.database().ref('subscription').once('value');
      }).then(function(subscriptions){
        subscriptions.forEach(function(sub){
          var pushConfig = sub.val();

          webpush.sendNotification(pushConfig, JSON.stringify({ 
            title: 'New Post', 
            content: 'New Post added!',
            openUrl: '/help'
          }))
          .catch(function(err){
            console.log(err);
          });
        });
        response.status(201).json({
          message: "Data stored",
          id: request.body.id
        });
      })
      .catch(function(err) {
        response.status(500).json({ error: err });
      });
  });
});
