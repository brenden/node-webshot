var webshot = require('../lib/webshot');

var options = {
  screenSize: {
    width: 320
  , height: 280
  }
, shotSize: {
    width: 'window'
  , height: 480
  }
, script: function() {
    var links = document.getElementsByTagName('h2');
    for (var i=0; i<links.length; i++) {
      var link = links[i];
      link.innerHTML = 'This is an H2 heading';
    }
  }
, userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)'
    + ' AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
};

webshot('flickr.com', './flickr.png', options, function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
