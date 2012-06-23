var url = require('url')
  , childProcess = require('child_process')
  , phantomScript = './webshot.phantom.js';

// Default options
var defaults = {
  device: 'desktop'
, screenSize: {
    width: 1024
  , height: 768
  }
, shotSize: {
    width: '100%'
  , height: 'screen'
  }
, script: function() {}
, phantomPath: 'phantomjs'
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
  var phantomCommand = [
    options.phantomPath
  , phantomScript
  , site
  , path
  ].join(' ');

  console.log(phantomCommand);

  childProcess.exec(phantomCommand, function(err) {
    return cb(err || null);
  });
};

var webshotOptions = {
  shotSize: {
    width: 300
  , height: 300
  }
, device: 'tablet'
}

webshot('google.com', 'scrap/shot.png', webshotOptions, function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
