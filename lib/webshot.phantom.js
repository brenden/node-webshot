var system = require('system')
  , page = require('webpage').create()
  , fs = require('fs')
  , optUtils = require('./options');

// Read in arguments
var site = system.args[1];
var path = system.args.length == 4 ? null : system.args[2];
var streaming = ((system.args.length == 4 ? system.args[2] : system.args[3]) === 'true');
var options = JSON.parse(system.args.length == 4 ? system.args[3] : system.args[4]);

page.viewportSize = {
  width: options.windowSize.width
, height: options.windowSize.height
};

// Capture JS errors and ignore them
page.onError = function(msg, trace) {};

page.onInitialized = eval('(' + options.onInitialized + ')');

// Set the phantom page properties
var toOverwrite = optUtils.mergeObjects(
  optUtils.filterObject(options, optUtils.phantomPage)
, page);

optUtils.phantomPage.forEach(function(key) {
  if (toOverwrite[key]) page[key] = toOverwrite[key];
});

var whenLoadFinished = function(status) {
  if (status === 'fail') {
    page.close();
    phantom.exit(1);
    return;
  }

  // Wait `options.renderDelay` seconds for the page's JS to kick in
  window.setTimeout(function () {
    if (options.takeShotOnCallback) {
      page.onCallback = function(data) {
        if (data == 'takeShot') {
          renderCleanUpExit();
        }
      };
    }

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

    // Handle the script option
    page.evaluate(eval('(' + options.script + ')'));

    if (!options.takeShotOnCallback) {
      renderCleanUpExit();
    }

  }, options.renderDelay);

  // Render, clean up, and exit
  function renderCleanUpExit() {
    if (!streaming) {
      page.render(path);
    } else {
      console.log(page.renderBase64(options.streamType));
    }

    page.close();
    phantom.exit(0);
  }
}

if (options.siteType == 'url') {
  page.open(site, whenLoadFinished);
} else {

  try {
    var f = fs.open(site, 'r');
    var pageContent = f.read();
    f.close();
    page.onLoadFinished = whenLoadFinished;
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
};
