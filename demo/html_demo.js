var webshot = require('../lib/webshot');

var options = {
  siteType: 'html'
};

webshot('<html><body>Hello World</body></html>', './hello_world.png', options, function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
