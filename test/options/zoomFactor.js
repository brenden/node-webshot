var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('zoomFactor', function() {
  this.timeout(20000);

  it('creates a properly-sized page for zoomed shots', function(done) {
    var fixture = fixtures[0];
    var options = {
      shotSize: {
        width: 'window'
      , height: 'all'
      },
      zoomFactor: 2
    };

    webshot(fixture.path, pngOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pngOutput, function(err, features) {
        features.width.should.equal(fixture.width);
        features.height.should.equal(fixture.height * 2);
        done();
      });
    });
  });
});
