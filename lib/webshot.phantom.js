var system = require('system')
  , page = require('webpage').create()
  , fs = require('fs')
  , optionLists = require('./options');

// Read in arguments
var site = system.args[1];
var path = system.args[2];
var streaming = (system.args[3] === 'true')
var options = JSON.parse(system.args[4]);

// Handle preload options
optionLists.phantomPreload.forEach(function(def) {
  if (def.phantomAction) {
    def.phantomAction(page, options[def.name]);
  }
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

    // Handle postload options
    optionLists.phantomPostload.forEach(function(def) {
      if (def.phantomAction) {
        def.phantomAction(page, options[def.name]);
      }
    });

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

if (args.siteType == 'url') {
  page.open(args.site, whenLoadFinished);
} else {

  try {
    var f = fs.open(args.site, 'r');
    var pageContent = f.read();
    f.close();
    page.setContent(pageContent, ''); // set content to be provided HTML
    page.reload();                    // issue reload to pull down any CSS or JS
    whenLoadFinished('success');      // create image
  } catch (e) {
    console.error(e);
    phantom.exit(1);
  }
}
