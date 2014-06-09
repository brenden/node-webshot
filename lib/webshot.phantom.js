var system = require('system')
  , page = require('webpage').create()
  , fs = require('fs')
  , optUtils = require('./options');

// Read in arguments
var site = system.args[1];
var path = system.args.length == 4 ? null : system.args[2];
var streaming = ((system.args.length == 4 ? system.args[2] : system.args[3]) === 'true');
var options = JSON.parse(system.args.length == 4 ? system.args[3] : system.args[4]);

var failToStderr = function(message) {
    system.stderr.write(message);
    page.close();
    phantom.exit(1);
};

page.viewportSize = {
  width: options.windowSize.width
, height: options.windowSize.height
};

// Capture JS errors and ignore them
page.onError = function(msg, trace) {};

if (options.errorIfStatusIsNot200) {
  page.onResourceReceived = function(response) {
    // If request to the page is not 200 status, fail.
    if (response.url === site && response.status !== 200) {
        failToStderr('Status must be 200; is ' + response.status);
        return;
    }
  };
}

// Register user-provided callbacks
optUtils.phantomCallback.forEach(function(cbName) {
  var cb = options[cbName];

  if (cbName === 'onCallback' && options.takeShotOnCallback) return;
  if (cbName === 'onLoadFinished' && !options.takeShotOnCallback) return;

  if (cb) {
    page[cbName] = buildEvaluationFn(cb.fn, cb.context);
  }
})

// Set the phantom page properties
var toOverwrite = optUtils.mergeObjects(
  optUtils.filterObject(options, optUtils.phantomPage)
, page);

optUtils.phantomPage.forEach(function(key) {
  if (toOverwrite[key]) page[key] = toOverwrite[key];
});

// The function that actually performs the screen rendering
var _takeScreenshot = function(status) {
  if (status === 'fail') {
    page.close();
    phantom.exit(1);
    return;
  }

  // Wait `options.renderDelay` seconds for the page's JS to kick in
  window.setTimeout(function () {

    // Set the rectangle of the page to render
    page.clipRect = {
      top: options.shotOffset.top
    , left: options.shotOffset.left
    , width: pixelCount(page, 'width', options.shotSize.width)
        - options.shotOffset.right
    , height: pixelCount(page, 'height', options.shotSize.height)
        - options.shotOffset.bottom
    };

    // Handle defaultWhiteBackgroud option
    if (options.defaultWhiteBackground) {
      page.evaluate(function() {
        var style = document.createElement('style');
        var text  = document.createTextNode('body { background: #fff }');
        style.setAttribute('type', 'text/css');
        style.appendChild(text);
        document.head.insertBefore(style, document.head.firstChild);
      });
    }

    // Handle customCSS option
    if (options.customCSS) {
      page.evaluate(function(customCSS) {
        var style = document.createElement('style');
        var text  = document.createTextNode(customCSS);
        style.setAttribute('type', 'text/css');
        style.appendChild(text);
        document.head.insertBefore(style, document.head.firstChild);
      }, options.customCSS);
    }

    // Render, clean up, and exit
    if (!streaming) {
      page.render(path, {quality: options.quality});
    } else {
      console.log(page.renderBase64(options.streamType));
    }

    page.close();
    phantom.exit(0);
  }, options.renderDelay);
}

// Avoid overwriting the user-provided onPageLoaded or onCallback options
var takeScreenshot;

if (options.onCallback && options.takeShotOnCallback) {
  takeScreenshot = function(data) {
    buildEvaluationFn(
      options.onCallback.fn
    , options.onCallback.context)(data);

    if (data == 'takeShot') {
      _takeScreenshot();
    }
  };
} else if (options.onLoadFinished && !options.takeShotOnCallback) {
  takeScreenshot = function(status) {
    buildEvaluationFn(
      options.onLoadFinished.fn
    , options.onLoadFinished.context)(status);
    _takeScreenshot();
  };
} else {
  takeScreenshot = _takeScreenshot;
}

// Kick off the page loading
if (options.siteType == 'url') {
  if (options.takeShotOnCallback) {
    page.onCallback = takeScreenshot;
    page.open(site);
  } else {
    page.open(site, takeScreenshot);
  }
} else {

  try {
    var f = fs.open(site, 'r');
    var pageContent = f.read();
    f.close();

    page[options.takeShotOnCallback
      ? 'onCallback'
      : 'onLoadFinished'] = takeScreenshot;

    page.setContent(pageContent, ''); // set content to be provided HTML
    page.reload();                    // issue reload to pull down any CSS or JS
  } catch (e) {
    console.error(e);
    phantom.exit(1);
  }
}


/*
 * Given a shotSize dimension, return the actual number of pixels in the
 * dimension that phantom should render.
 *
 * @param (Object) page
 * @param (String) dimension
 * @param (String or Number) value
 */
function pixelCount(page, dimension, value) {

  // Determine the page's dimensions
  var pageDimensions = page.evaluate(function() {
    var body = document.body || {};
    var documentElement = document.documentElement || {};
    return {
      width: Math.max(
        body.offsetWidth
      , body.scrollWidth
      , documentElement.clientWidth
      , documentElement.scrollWidth
      , documentElement.offsetWidth
      )
    , height: Math.max(
        body.offsetHeight
      , body.scrollHeight
      , documentElement.clientHeight
      , documentElement.scrollHeight
      , documentElement.offsetHeight
      )
    };
  });

  var x = {
    window: page.viewportSize[dimension]
  , all: pageDimensions[dimension]
  }[value] || value;

  return x;
}


/*
 * Bind the function `fn` to the context `context` in a serializable manner.
 * A tiny bit of a hack.
 *
 * @param (String) fn
 * @param (Object) context
 */
function buildEvaluationFn(fn, context) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    page.evaluate(function(fn, context, args) {
      eval('(' + fn + ')').apply(context, args);
    }, fn, context, args);
  };
}
