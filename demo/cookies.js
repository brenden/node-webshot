var webshot = require('../lib/webshot');

var options = {
  defaultWhiteBackground: true,
  onLoadFinished: function() {
    document.write(document.cookie);
  },
  cookies: [
    {
      name:     'someTestCookie',
      value:    'test',
      domain:   '.example.com',
      path:     '/'
    }
  ]
};

webshot('example.com', './cookies.png', options, function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
