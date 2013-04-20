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

    var autoCleanup = args.takeShotOnCallback === 'true';
    var code = eval('(' + args.script + ')');
    var one_script = typeof(code) === 'function';

    page.onCallback = function(data){
      if (data === 'takeShot'){
        renderCleanUpExit();
      }else if (one_script === false && data === 'next'){
        setTimeout(runNextScript, 50);
      }
    };

    // If there's only one function, evaluate it and move on
    if (one_script){
      page.evaluate(code);
      if (autoCleanup){
        renderCleanUpExit();
      }
    }else if (typeof(code) === typeof([])){
      // For a list of functions, chop them off one at a time and execute
      // with runNextScript(). Each function signals that it's finished by
      // triggering onCallback with 'next' or (finally) 'takeShot'.
      //
      // Inspired by http://stackoverflow.com/questions/9246438/how-to-submit-a-form-using-phantomjs
      var loadingPage = false;
      function runNextScript(){
        if (loadingPage){
          setTimeout(runNextScript, 50);
        }else{
          if (code.length > 0){
            page.evaluate(code.shift());
          }else{
            if (autoCleanup){
              renderCleanUpExit();
            }
          }
        }
      }
      page.onConsoleMessage = function(m){ console.log(m); };
      page.onLoadStarted    = function(){ loadingPage = true;  console.log('load started'); };
      page.onLoadFinished   = function(){ loadingPage = false; console.log('load finished'); };

      runNextScript();
    }

  }, args.renderDelay);
  
  // Render, clean up, and exit
  function renderCleanUpExit() {
    if (args.path) {
      page.render(args.path);
    } else {
      console.log(page.renderBase64(args.streamType));
    }

    phantom.exit(0);
  }
  
});
