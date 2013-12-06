var system = require('system')
  , page = require('webpage').create();

// Read in arguments
var args = {};
[ 'site'
, 'path'
, 'streaming'
, 'windowWidth'
, 'windowHeight'
, 'shotWidth'
, 'shotHeight'
, 'offsetLeft'
, 'offsetRight'
, 'offsetTop'
, 'offsetBottom'
, 'userAgent'
, 'script'
, 'paperSize'
, 'zoomFactor'
, 'streamType'
, 'siteType'
, 'renderDelay'
, 'takeShotOnCallback'
, 'cookies'
].forEach(function(name, i) {
  args[name] = system.args[i + 1];
});

// Apply cookies
if (args.cookies !== 'default') {
  var cookies = JSON.parse(args.cookies);
  cookies.forEach(function(cookie) {
    phantom.addCookie(cookie);
  });
}

delete args['cookies'];

// Set the window size
page.viewportSize = {
  width: args.windowWidth
, height: args.windowHeight
};

// Set the user agent string
if (args.userAgent !== 'default') {
  page.settings.userAgent = args.userAgent;
}

// Set the paper size for PDF rendering
if (args.paperSize !== 'default') {
  page.paperSize = JSON.parse(args.paperSize);
}

// Set the zoom factor
page.zoomFactor = args.zoomFactor;

var whenLoadFinished = function(status) {
  if (status === 'fail') {
    page.close();
    phantom.exit(1);
    return;
  }

  // Wait `args.renderDelay` seconds for the page's JS to kick in
  window.setTimeout(function () {

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

    /*
     * Given a shotSize dimension, return the actual number of pixels in the
     * dimension that phantom should render.
     *
     * @param (String) dimension
     * @param (String or Number) value
     */
    var pixelCount = function(dimension, value) {
      return {
        window: args[{
          width: 'windowWidth'
        , height: 'windowHeight'
        }[dimension]]
      , all: pageDimensions[dimension]
      }[value] || value
    };

    // Set the rectangle of the page to render
    page.clipRect = {
      top: args.offsetTop
    , left: args.offsetLeft
    , width: pixelCount('width', args.shotWidth) - args.offsetRight
    , height: pixelCount('height', args.shotHeight) - args.offsetBottom
    };

    // Default to white background if required
    if (args.defaultWhiteBackground == 'true') {
      // added as the first element
      // further style cascading would eventually override it
      page.evaluate(function() {
        var style = document.createElement('style'),
            text  = document.createTextNode('body { background: #fff }');
        style.setAttribute('type', 'text/css');
        style.appendChild(text);
        document.head.insertBefore(style, document.head.firstChild);
      });
    }

    if(args.takeShotOnCallback == 'true') {

      page.onCallback = function(data) {
        if(data == 'takeShot') {
          renderCleanUpExit();
        }
      };

      // Execute the user's script
      page.evaluate(eval('('+args.script+')'));

    } else {
      // Execute the user's script
      page.evaluate(eval('('+args.script+')'));

      renderCleanUpExit();
    }

  }, args.renderDelay);

  // Render, clean up, and exit
  function renderCleanUpExit() {
    if (args.streaming === 'false') {
      page.render(args.path);
    } else {
      console.log(page.renderBase64(args.streamType));
    }

    page.close();
    phantom.exit(0);
  }
}

page.onError = function(msg, trace) {};
page.onConsoleMessage = function(msg, lineNum, sourceId) {};

if (args.siteType == 'url') {
  page.open(args.site, whenLoadFinished);
} else if (args.siteType == 'html') {
  page.setContent(args.site, ''); // set content to be provided HTML
  page.reload(); // issue reload to pull down any CSS or JS
  whenLoadFinished('success'); // create image
}
