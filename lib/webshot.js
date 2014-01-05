var url = require('url')
  , fs = require('fs')
  , tmp = require('tmp')
  , stream = require('stream')
  , childProcess = require('child_process')
  , optionGroups = require('./options')
  , phantomScript = __dirname + '/webshot.phantom.js'
  , extensions = ['jpeg', 'jpg', 'png', 'pdf']
  , siteTypes = ['url', 'html', 'file']
  , defaults = generateDefaults();

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

  // If the result path remains empty, then stream the output
  var streaming = !path;

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

  // Check that cookies is an array
  if (!options.cookies instanceof Array) {
    return cb(new Error('Option cookies must be an instanceof Array.'));
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
 * Create an object to represent the default values of all the different
 * types of options
 *
 * @return (Object)
 */
function generateDefaults() {
  var defaults = {};

  [optionGroups.phantom, optionGroups.caller].forEach(function(optGroup) {
    Object.keys(optGroup).forEach(function(optName) {
      defaults[optName] = optGroup[optName];
    })
  });

  optionGroups.phantomPage.forEach(function(optName) {
    defaults[optName] = undefined;
  });

  return defaults;
}


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

  // Fill in defaults for undefined options
  var withDefaults = (function fillDefaults(opts, defs) {
    var withDefaults = {};

    Object.keys(defs).forEach(function(key) {
      withDefaults[key] = toString.call(defs[key]) === '[object Object]'
        ? fillDefaults(opts[key] || {}, defs[key])
        : opts[key] || defs[key];
    });

    return withDefaults;
  }(options, defaults));

  // Convert 'script' function to string for later JSON serialization
  withDefaults.script = withDefaults.script.toString();

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
  var filteredOptions = {};

  Object.keys(optionGroups.phantom)
    .concat(optionGroups.phantomPage)
    .forEach(function(optName) {
      if (options[optName] === undefined) return;
      filteredOptions[optName] = options[optName];
    });

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

    phantomProc.on('exit', function() {
      s.emit('end');
    });
    cb(null, s);
  }
}
