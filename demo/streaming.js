var webshot = require('../lib/webshot')
  , fs = require('fs');

var renderStream = webshot('google.com');
var file = fs.createWriteStream('google.png', {encoding: 'binary'});

renderStream.on('data', function(data) {
  file.write(data.toString('binary'), 'binary');
});

renderStream.on('end', function() {
  console.log('OK');
});
