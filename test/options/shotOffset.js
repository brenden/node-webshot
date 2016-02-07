var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('shotOffset', function() {
  this.timeout(20000);

  it('creates a properly-sized image for partial shots', function(done) {
    var options = {
      screenSize: {
        width: 1000
      , height: 1000
      }
    , shotSize: {
        width: 500
      , height: 500
      }
    , shotOffset: {
        left: 10
      , top: 10
      }
    };

    webshot('google.com', pngOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pngOutput, function(err, features) {
        if (err) return done(err);

        features.width.should.equal(options.shotSize.width);
        features.height.should.equal(options.shotSize.height);
        done();
      });
    });
  });

  it('crops shots with right and bottom offsets', function(done) {
    var fixture = fixtures[1];
    var options = {
      shotSize: {
        width: 'all'
      , height: 'all'
      }
    , shotOffset: {
        right: 10
      , bottom: 10
      }
    };

    webshot(fixture.path, pngOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pngOutput, function(err, features) {
        if (err) return done(err);

        var expectedWidth = fixture.width - options.shotOffset.right;
        var expectedHeight = fixture.height - options.shotOffset.bottom;
        features.width.should.equal(expectedWidth);
        features.height.should.equal(expectedHeight);
        done();
      });
    });
  });
});
