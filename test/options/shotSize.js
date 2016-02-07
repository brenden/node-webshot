var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('shotSize', function() {

  it('resolves "all" to the full length of the body', function(done) {
    var fixture = fixtures[0];
    var options = {
      shotSize: {
        width: 'window'
      , height: 'all'
      }
    };

    webshot(fixture.path, pngOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pngOutput, function(err, features) {
        if (err) return done(err);

        features.height.should.equal(fixture.height);
        done();
      });
    });
  });

  it('resolves "all" to the full length of the page, if larger than the body',
      function(done) {
    var fixture = fixtures[1];
    var options = {
      shotSize: {
        width: 'window'
      , height: 'all'
      }
    };

    webshot(fixture.path, pngOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pngOutput, function(err, features) {
        if (err) return done(err);

        features.height.should.equal(fixture.height);
        done();
      });
    });
  });
});
