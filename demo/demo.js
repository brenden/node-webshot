var fs = require('fs')
  , async = require('async')
  , webshot = require('../lib/webshot');

// Simplest usage: no options
webshot('google.com', function(err, image) {
  if (err) return console.log(err);

  // do something with `image`
});

var webshotOptions = {
  device: 'desktop' // or 'tablet' or 'mobile'
, screenSize: {width: 1024, height: 768}
, shotSize: {width: '100%', height: 768 /* or '56%' or 'screen'*/}
, thumbCompression: 0.2 //max 1 -- full size
, script: function() {}
};

webshot('github.com', webshotOptions, function() {

})
