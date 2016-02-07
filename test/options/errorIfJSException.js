var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('errorIfJSException', function() {
  it('streams an error if there is an exception on the page', function(done) {
    var badHTML =
      '<html><body><script>var a.b = "test";</script></body></html>';
    var renderStream = webshot(badHTML, {
      siteType: 'html',
      errorIfJSException: true
    });
    var file = fs.createWriteStream(pngOutput, {encoding: 'binary'});

    renderStream.on('data', function(data) {
      file.write(data.toString('binary'), 'binary');
    });

    renderStream.on('error', function(error) {
      done();
    });
  });
});
