var url = require('url')
  , fs = require('fs')
  , tmp = require('tmp')
  , stream = require('stream')
  , childProcess = require('child_process')
  , optUtils = require('./options')
  , phantomScript = __dirname + '/webshot.phantom.js'
  , extensions = ['jpeg', 'jpg', 'png', 'pdf']
  , siteTypes = ['url', 'html', 'file'];

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

  var streaming = !path;
  var defaults = optUtils.mergeObjects(optUtils.caller, optUtils.phantom);

  // Apply the compiled phantomjs path only if it compiled successfully
  try {
    defaults.phantomPath = require('phantomjs').path;
  } catch (ex) {}

  options = processOptions(options, defaults);

  // Check that a valid fileType was given for the output image
  var extension = (path)
    ? path.substring(~(~path.lastIndexOf('.') || ~path.length) + 1)
    : options.streamType;

  if (!~extensions.indexOf(extension.toLowerCase())) {
    return cb(new Error('All files must end with one of the following extensions: '
      + extensions.join(', ')));
  }

  // Check that a valid siteType was provided
  if (!~siteTypes.indexOf(options.siteType)) {
    return cb(new Error(args.siteType + ' is not a valid sitetype.'));
  }

  // Add protocol to the site url if not present
  if (options.siteType === 'url') {
    site = url.parse(site).protocol ? site : 'http://' + site;
  }

  // Remove the given file if it already exists, then call phantom
  var spawn = function() {
    if (options.siteType === 'html') {
      tmp.file(function(err, tmpPath, fd) {
        if (err) return cb(err);
        fs.write(fd, site, null, 'utf-8', function(err) {
          if (err) return cb(err);
          fs.close(fd, function(err) {
            if (err) return cb(err);
            options.siteType = 'file';
            site = tmpPath;
            spawn();
          });
        })
      });
    } else {
      spawnPhantom(site, path, streaming, options, cb);
    }
  }

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
 * Process the options object into the values to be exposed to phantom
 *
 * @param (Object) options
 * @param (Object) defaults
 * @return (Object)
 */
function processOptions(options, defaults) {

  // Alias 'screenSize' to 'windowSize'
  options.windowSize = options.windowSize || options.screenSize;

  // Alias 'userAgent' to 'settings.userAgent'
  if (options.userAgent) {
    options.settings = options.settings || {};
    options.settings.userAgent = options.userAgent;
  }

  // Alias 'script' to 'onLoadFinished'
  if (options.script) {
    options.onLoadFinished = options.onLoadFinished || options.script;
  }

  // Fill in defaults for undefined options
  var withDefaults = optUtils.mergeObjects(options, defaults);

  // Convert function options to strings for later JSON serialization
  optUtils.phantomCallback.forEach(function(optionName) {
    var fnArg = withDefaults[optionName];

    if (fnArg) {
      if (toString.call(fnArg) === '[object Function]') {
        withDefaults[optionName] = {
          fn: fnArg.toString()
        , context: {}
        };
      } else {
        fnArg.fn = fnArg.fn.toString();
      }
    }
  });

  return withDefaults;
}


/*
 * Spawn a phantom instance to take the screenshot
 *
 * @param (String) site
 * @param (String) path
 * @param (Boolean) streaming
 * @param (Object) options
 * @param (Function) cb
 */
function spawnPhantom(site, path, streaming, options, cb) {

  // Filter out options that shouldn't be passed to the phantom process
  var filteredOptions = optUtils.filterObject(options,
    Object.keys(optUtils.phantom)
      .concat(optUtils.phantomPage)
      .concat(optUtils.phantomCallback));

  var phantomArgs = [
    phantomScript
  , site
  , path
  , streaming
  , JSON.stringify(filteredOptions)
  ];

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

  if (!streaming) {
    phantomProc.stdout.on('data', function(data) {
      console.log(''+data);
    });

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

    phantomProc.stderr.on('data', function(data) {
      clearTimeout(timeoutID);
      cb(new Error(data));
      phantomProc.kill();
    });

    phantomProc.on('exit', function() {
      s.emit('end');
      this.kill();
    });
    cb(null, s);
  }
}
