var system = require('system')
  , page = require('webpage').create();

// Read in arguments
var args = {};
[ 'site'
, 'path'
, 'windowWidth'
, 'windowHeight'
, 'shotWidth'
, 'shotHeight'
, 'userAgent'
, 'script'
, 'streamType'
, 'renderDelay'
].forEach(function(name, i) {
  args[name] = system.args[i + 1];
});

// Set the window size
page.viewportSize = {
  width: args.windowWidth
, height: args.windowHeight
};

// Set the user agent string
if (args.userAgent) {
  page.settings.userAgent = args.userAgent;
}

page.open(args.site, function(status) {

  if (status === 'fail') {
    page.close();
    phantom.exit(1);
    return;
  }

  // Wait `args.renderDelay` seconds for the page's JS to kick in
  window.setTimeout(function () {

    // Determine the page's dimensions
    var pageDimensions = page.evaluate(function() {
      return {
        width: Math.max( 
          document.body.offsetWidth
        , document.body.scrollWidth
        , document.documentElement.clientWidth
        , document.documentElement.scrollWidth
        , document.documentElement.offsetWidth
        )
      , height: Math.max(
          document.body.offsetHeight
        , document.body.scrollHeight
        , document.documentElement.clientHeight
        , document.documentElement.scrollHeight
        , document.documentElement.offsetHeight
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
      top: 0
    , left: 0
    , width: pixelCount('width', args.shotWidth)
    , height: pixelCount('height', args.shotHeight)
    };

    // Execute the user's script
    page.evaluate(eval('('+args.script+')'));

    // Render, clean up, and exit
    if (args.path) {
      page.render(args.path);
    } else {
      console.log(page.renderBase64(args.streamType));
    }

    page.close();
    phantom.exit(0);
  }, args.renderDelay);
});
