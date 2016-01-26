var webshot = require('../lib/webshot');

webshot('https://www.google.com/fonts/specimen/Open+Sans', './webfonts.png', function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
