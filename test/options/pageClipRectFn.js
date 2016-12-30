var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('pageClipRectFn', function() {
  this.timeout(20000);

  it('screenshots the page given the rect returned from pageClipRectFn', function(done) {
    var fixture = fixtures[2];
    // width and height here aren't important, but they're different from fixture.width and fixture.height
    var options = {
      pageClipRectFn: function () {
        return {top: 0, left: 0, width: 500, height: 600};
      }
    };

    webshot(fixture.path, pngOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pngOutput, function(err, features) {
        if (err) return done(err);

        features.width.should.equal(500);
        features.height.should.equal(600);
        done();
      });
    });
  });
});

