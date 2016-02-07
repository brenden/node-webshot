var webshot = require('../../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('../helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('errorIfStatusIsNot200', function() {
  this.timeout(20000);

  it('screenshots a non-200 page status when not set to true', function(done) {

    webshot('google.com/404-page-for-webshot-tests', pngOutput, function(err) {
      fs.exists(pngOutput, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('errors on non-200 page status when set to true', function(done) {
    var options = {
      errorIfStatusIsNot200: true
    };

    webshot('google.com/404-page', pngOutput, options, function(err) {
      fs.exists(pngOutput, function(exists) {
        exists.should.equal(false);
        done();
      });
    });
  });
});
