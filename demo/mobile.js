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
, userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)'
    + ' AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
};

webshot('https://facebook.com', './facebook.png', options, function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
