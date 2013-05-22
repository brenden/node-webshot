var url = require('url')
  , fs = require('fs')
  , stream = require('stream')
  , childProcess = require('child_process')
  , phantomScript = __dirname + '/webshot.phantom.js'
  , extensions = ['jpeg', 'jpg', 'png', 'pdf']
  , siteTypes = ['url', 'html'];

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
, paperSize: ''
, userAgent: ''
, streamType: 'png'
, siteType: 'url'
, phantomPath: 'phantomjs'
, renderDelay: 0
, timeout: 0
, takeShotOnCallback: false
};

// Apply the compiled phantomjs path only if it compiled successfully
try { defaults.phantomPath = require('phantomjs').path } catch (ex) {}

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

  // Alias 'screenSize' to 'windowSize'
  options.windowSize = options.windowSize || options.screenSize;

  // Fill in defaults for undefined options
  Object.keys(defaults).forEach(function(key) {
    options[key] = options[key] || defaults[key];
  });

  // Add protocol to the site url if not present
  if (options.siteType == 'url') {
    site = url.parse(site).protocol ? site : 'http://' + site;
  }

  // Check that a valid siteType was provided
  if (!~siteTypes.indexOf(options.siteType)) {
    return cb(new Error(args.siteType + ' is not a valid sitetype.'));
  }

  // Check that a valid fileType was given for the output image
  var extension = (path)
    ? path.substring(~(~path.lastIndexOf('.') || ~path.length) + 1)
    : options.streamType;

  if (!~extensions.indexOf(extension.toLowerCase())) {
    return cb(new Error('All files must end with one of the following extensions: '
      + extensions.join(', ')));
  }

  if (extension.toLowerCase() == 'pdf' && options.paperSize) {
      options.paperSize = JSON.stringify(options.paperSize);
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
  , options.paperSize
  , options.streamType
  , options.siteType
  , options.renderDelay
  , options.takeShotOnCallback
  ].map(function(arg) {
    return arg.toString();
  });

  if (options.phantomConfig) {
    phantomArgs = Object.keys(options.phantomConfig).map(function (key) {
      return '--' + key + '=' + options.phantomConfig[key];
    }).concat(phantomArgs);
  }

  var phantomProc = childProcess.spawn(options.phantomPath, phantomArgs);

  // This variable will contain our timeout ID.
  var timeoutID = null;

  // Whether or not we've called our callback already.
  var calledCallback = false;

  // Only set the timer if the timeout has been specified (by default it's not).
  if (options.timeout) {
    timeoutID = setTimeout(function() {

      // The phantomjs process didn't exit in time.
      // Double-check we didn't already call the callback already as that would happen
      // when the process has already exited. Sending a SIGKILL to a PID that might
      // be handed out to another process could be potentially very dangerous.
      if (!calledCallback) {
        calledCallback = true;

        // Send the kill signal
        phantomProc.kill('SIGKILL');

        // Call our callback.
        cb(new Error('PhantomJS did not respond within the given timeout setting.'));
      }
    }, options.timeout);
  }

  if (path) {
    phantomProc.on('exit', function(code) {
      if (!calledCallback) {
        calledCallback = true;

        // No need to run the timeout anymore.
        clearTimeout(timeoutID);
        cb(code
          ? new Error('PhantomJS exited with return value ' + code)
          : null);
      }
    });
  } else {
    var s = new stream.Stream();
    s.readable = true;

    phantomProc.stdout.on('data', function(data) {
      clearTimeout(timeoutID);
      s.emit('data', new Buffer(''+data, 'base64'));
    });

    phantomProc.on('exit', function() {
      s.emit('end');
    });

    cb(null, s);
  }
}
