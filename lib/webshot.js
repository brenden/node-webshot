var url = require('url')
  , childProcess = require('child_process')
  , phantomScript = './webshot.phantom.js';

// Default options
var defaults = {
  screenSize: {
    width: 1024
  , height: 768
  }
, shotSize: {
    width: '100%'
  , height: 'screen'
  }
, script: function() {}
, phantomPath: 'phantomjs'
, userAgent: ''
};

var webshot = exports = function() {

  // Process arguments
  var args = Array.prototype.slice.call(arguments, 0);
  var cb = args.pop();
  var site = args.shift();
  var path = args.shift();
  var options = args.pop() || {};

  // Add protocol to the site url if not present
  site = url.parse(site).protocol ? site : 'http://' + site;

  // Fill in defaults for undefined options
  Object.keys(defaults).forEach(function(key) {
    options[key] = options[key] || defaults[key];
  });

  // Spawn a phantom instance to take the screenshot
  var phantomArgs = [
    phantomScript
  , site
  , path
  , options.screenSize.width
  , options.screenSize.height
  , options.shotSize.width
  , options.shotSize.height
  , options.userAgent
  , options.script
  ].map(function(arg) {
    return arg.toString();
  });

  var x = childProcess
    .spawn(options.phantomPath, phantomArgs)
  x.on('exit', function(code) {
      console.log('--->', code);
    });
  x.stdout.on('data', function(data) {
      console.log(data.toString());
    })
  x.stderr.on('data', function(data) {
      console.log(data.toString());
    })
};

var webshotOptions = {
  screenSize: {
    width: 800
  , height: 800
  }
, shotSize: {
    width: 'window'
  , height: 'all'
  }
/*
, script: function() {
    var links = document.getElementsByTagName('a');
    for (var i=0; i<links.length; i++) {
      var link = links[i];
      link.innerHTML = 'This is a link.';
    }
  }
*/
}

webshot('flickr.com', 'scrap/shot.png', webshotOptions, function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
