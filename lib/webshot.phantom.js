var system = require('system')
var page = require('webpage').create();
var site = system.args[1];
var path = system.args[2];

page.viewportSize = {
  width: 1366
, height: 768
};

page.open(site, function(status) {
  page.render(path);

  // Clean up and exit
  page.release();
  phantom.exit();
});
