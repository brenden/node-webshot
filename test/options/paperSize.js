var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pdfOutput = helper.pdfOutput
  , fixtures = helper.fixtures;

describe('paperSize', function() {
  this.timeout(20000);

  it('creates a properly-sized page for pdf shots', function(done) {
    var options = {
      paperSize: {
        format: 'Letter'
      , orientation: 'portrait'
      }
    };

    webshot('example.com', pdfOutput, options, function(err) {
      if (err) return done(err);

      im.identify(pdfOutput, function(err, features) {
        features['print size'].should.equal('8.5x11');
        done();
      });
    });
  });
});
