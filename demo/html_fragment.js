var webshot = require('../lib/webshot');

var options = {
  siteType: 'html'
, defaultWhiteBackground: true
};

var fragment = '<html><body>Hello World</body></html>';

webshot(fragment, './hello_world.png', options, function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
