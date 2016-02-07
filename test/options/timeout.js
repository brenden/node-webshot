var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('timeout', function() {
  this.timeout(20000);

  // If the render delay is larger than the timeout delay, the timeout should
  // be triggered.
  var options = {
    renderDelay: 10000,
    timeout: 3000
  };

  var timeoutErrorMessage =
    'PhantomJS did not respond within the given timeout setting.';

  it('produces an error message on a timeout', function(done) {
    webshot(fixtures[0].path, pngOutput, options, function(err) {
      should.exist(err);
      should.equal(err.message, timeoutErrorMessage);
      done();
    });
  });

  it('streams an error message on a timeout', function(done) {
    var renderStream = webshot('google.com', options);

    renderStream.on('error', function(err) {
      should.exist(err);
      should.equal(err.message, timeoutErrorMessage);
      done();
    });
  });
});
