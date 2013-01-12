var url = require('url')
  , fs = require('fs')
  , stream = require('stream')
  , childProcess = require('child_process')
  , phantomScript = __dirname + '/webshot.phantom.js'
  , extensions = ['jpeg', 'jpg', 'png', 'pdf'];

// Default options
var defaults = {
  windowSize: {
    width: 1024
  , height: 768
  }
, shotSize: {
    width: 'window'
  , height: 'window'
  }
, script: function() {}
, phantomPath: 'phantomjs'
, userAgent: ''
, streamType: 'png'
, renderDelay: 0
};

module.exports = function() {

  // Process arguments
  var args = Array.prototype.slice.call(arguments, 0);
  var cb = args.pop();
  var site = args.shift(); 
  var options = {};
  var path = '';

  switch (args.length) {
    case 1:
      var arg = args.pop();

      if (toString.call(arg) === '[object String]') {
        path = arg;
      } else {
        options = arg;
      }
    break;

    case 2:
      path = args.shift();
      options = args.shift();
    break;
  } 

  // Add protocol to the site url if not present
  site = url.parse(site).protocol ? site : 'http://' + site;

  // Alias 'screenSize' to 'windowSize'
  options.windowSize = options.windowSize || options.screenSize;

  // Fill in defaults for undefined options
  Object.keys(defaults).forEach(function(key) {
    options[key] = options[key] || defaults[key];
  });

  // Check that a valid filetype was given for the output image
  var extension = (path)
    ? path.substring(~(~path.lastIndexOf('.') || ~path.length) + 1)
    : options.streamType;

  if (!~extensions.indexOf(extension.toLowerCase())) {
    cb(new Error('All files must end with one of the following extensions: ' 
      + extensions.join(', ')));
  }

  // Remove the given file if it already exists, then call phantom
  var spawn = spawnPhantom.bind(null, site, path, options, cb);

  if (path) {
    fs.exists(path, function(exists) { 
      if (exists) {
        fs.unlink(path, function(err) {
          if (err) return cb(err);
          spawn();
        });
      } else {
        spawn();
      }
    }); 
  } else {
    spawn();
  }
};


/*
 * Spawn a phantom instance to take the screenshot
 *
 * @param (String) site
 * @param (String) path
 * @param (Object) options
 * @param (Function) cb
 */
function spawnPhantom(site, path, options, cb) {

  var phantomArgs = [
    phantomScript
  , site
  , path
  , options.windowSize.width
  , options.windowSize.height
  , options.shotSize.width
  , options.shotSize.height
  , options.userAgent
  , options.script
  , options.streamType
  , options.renderDelay
  ].map(function(arg) {
    return arg.toString();
  });

  var phantomProc = childProcess.spawn(options.phantomPath, phantomArgs);

  if (path) {
    phantomProc.on('exit', function(code) {
      cb(code
        ? new Error('PhantomJS exited with return value ' + code)
        : null);
    });
  } else {

    var s = new stream.Stream();
    s.readable = true;
    
    phantomProc.stdout.on('data', function(data) {
      s.emit('data', new Buffer(''+data, 'base64'));
    });

    phantomProc.on('exit', function() {
      s.emit('end');
    });

    cb(null, s);
  }
}
