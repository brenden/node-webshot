var webshot = require('../lib/webshot');

webshot('amazon.com', './amazon.png', function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
