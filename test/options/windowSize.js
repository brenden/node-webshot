var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('windowSize', function() {
  it('sets the size of the window the page is rendered in', function(done) {
    this.timeout(20000);

    var options = {
      windowSize: {
        width: 1000
      , height: 1000
      }
    };

    webshot('google.com', pngOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pngOutput, function(err, features) {
        features.width.should.equal(options.windowSize.width);
        features.height.should.equal(options.windowSize.height);
        done();
      });
    });
  });
});
