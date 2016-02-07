var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('captureSelector', function() {
  this.timeout(20000);

  it('screenshots the page matching the selector', function(done) {
    var fixture = fixtures[2];
    var options = {
      captureSelector: '#foo'
    };

    webshot(fixture.path, pngOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pngOutput, function(err, features) {
        if (err) return done(err);

        features.width.should.equal(fixture.width);
        features.height.should.equal(fixture.height);
        done();
      });
    });
  });
});

