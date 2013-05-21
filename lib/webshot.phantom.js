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
, 'paperSize'
, 'streamType'
, 'siteType'
, 'renderDelay'
, 'takeShotOnCallback'
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
if (args.paperSize) {
  page.paperSize = JSON.parse(args.paperSize);
}

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
      top: 0
    , left: 0
    , width: pixelCount('width', args.shotWidth)
    , height: pixelCount('height', args.shotHeight)
    };

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
    if (args.path) {
      page.render(args.path);
    } else {
      console.log(page.renderBase64(args.streamType));
    }

    page.close();
    phantom.exit(0);
  }
}

if (args.siteType == 'url') {
  page.open(args.site, whenLoadFinished);
} else if (args.siteType == 'html') {
  page.setContent(args.site, ''); // set content to be provided HTML
  page.reload(); // issue reload to pull down any CSS or JS
  whenLoadFinished('success'); // create image
}
