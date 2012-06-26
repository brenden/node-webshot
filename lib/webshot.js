var url = require('url')
  , childProcess = require('child_process')
  , phantomScript = __dirname + '/webshot.phantom.js'
  , extensions = ['jpeg', 'jpg', 'png', 'pdf']

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

module.exports = function() {

  // Process arguments
  var args = Array.prototype.slice.call(arguments, 0);
  var cb = args.pop();
  var site = args.shift();
  var path = args.shift();
  var options = args.pop() || {};

  // Add protocol to the site url if not present
  site = url.parse(site).protocol ? site : 'http://' + site;

  // Check that a valid filetype was given for the output image
  var extension = path.substring(~(~path.lastIndexOf('.') || ~path.length) + 1);

  if (!~extensions.indexOf(extension.toLowerCase())) {
    cb(new Error('All files must end with one of the following extensions: ' 
      + extensions.join(', ')));
  }

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
    .on('exit', function(code) {
      cb(code
        ? new Error('PhantomJS exited with return value ' + code)
        : null);
    });
  x.stderr.on('data', function(data) {
    console.log(data.toString());
  })
};
