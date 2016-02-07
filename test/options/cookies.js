var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('cookies', function() {
  it('do not break page rendering', function(done) {
    this.timeout(20000);

    var options = {
      cookies: [
        {
          name:     'x',
          value:    'test',
          domain:   'localhost',
          path:     '/'
        }
      ]
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
