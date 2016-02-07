var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('customHeaders', function() {
  it('do not break page rendering', function(done) {
    this.timeout(20000);

    var options = {
      customHeaders: { 'X-Test': 'x' }
    };

    webshot('google.com', pngOutput, options, function(err) {
      if (err) return done(err);

      fs.exists(pngOutput, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });
});
