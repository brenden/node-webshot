var webshot = require('../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , testFile = __dirname + '/test.png'
  , testPDF = __dirname + '/test.pdf';

describe('Creating screenshot images', function() {
  it('creates a screenshot', function(done) {
    this.timeout(20000);

    webshot('google.com', testFile, function(err) {
      if (err) return done(err);

      fs.exists(testFile, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('takes a screenshot of the provided html', function(done) {
    this.timeout(20000);

    webshot('<html><body>This is a test</body></html>', testFile, {siteType:'html'}, function(err) {
      if (err) return done(err);
      fs.exists(testFile, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('overwrites existing screenshots', function(done) {
    this.timeout(20000);

    fs.stat(testFile, function (err, initial) {
      if (err) return done(err);

      setTimeout(function() {    
        webshot('google.com', testFile, function(err) {
          if (err) return done(err);

          fs.stat(testFile, function (err, overwritten) {
            if (err) return done(err);

            initial.ctime.should.be.below(overwritten.ctime);
            done();
          });
        }); 
      }, 100);
    });
  });

  it('streams a screenshot', function(done) {
    this.timeout(20000);

    fs.unlink(testFile, function(err) {
      if (err) return done(err);

      webshot('google.com', function(err, renderStream) {
        if (err) return done(err);

        var file = fs.createWriteStream(testFile, {encoding: 'binary'});

        renderStream.on('data', function(data) {
          file.write(data.toString('binary'), 'binary');
        });

        renderStream.on('end', function() { 
          fs.exists(testFile, function(exists) {
            exists.should.equal(true);
            done();
          });
        });
      });
    });
  });
});

describe('Handling screenshot dimension options', function() {

  it('creates a properly-sized image for full-window shots', function(done) {
    this.timeout(20000);

    var options = {
      windowSize: {
        width: 1000
      , height: 1000
      }
    };

    webshot('flickr.com', testFile, options, function(err) {
      if (err) return done(err);

      im.identify(testFile, function(err, features) {
        features.width.should.equal(options.windowSize.width);
        features.height.should.equal(options.windowSize.height);
        done();
      });
    });
  });

  it('creates a properly-sized page for pdf shots', function(done) {
    this.timeout(20000);

    var options = {
      paperSize: {
        format: 'Letter'
      , orientation: 'portrait'
      }
    };

    webshot('flickr.com', testPDF, options, function(err) {
      if (err) return done(err);

      im.identify(testPDF, function(err, features) {
        features['print size'].should.equal('8.5x11');
        done();
      });
    });
  });

  it('creates a properly-sized image for partial shots', function(done) {
    this.timeout(20000);

    var options = {
      screenSize: {
        width: 1000
      , height: 1000
      }
    , shotSize: {
        width: 500
      , height: 500
      }
    };

    webshot('flickr.com', testFile, options, function(err) {
      if (err) return done(err);

      im.identify(testFile, function(err, features) {
        if (err) return done(err);

        features.width.should.equal(options.shotSize.width);
        features.height.should.equal(options.shotSize.height);
        done();
      });
    });
  });

  it('properly handles height "all" with body height', function(done) {
    this.timeout(20000);

    var fixture1 = 'file://' + __dirname + '/fixtures/1.html';
    var options = {
      shotSize: {
        width: 'window'
      , height: 'all'
      }
    };

    webshot(fixture1, testFile, options, function(err) {
      if (err) return done(err);

      im.identify(testFile, function(err, features) {
        if (err) return done(err);

        features.width.should.equal(1024);
        features.height.should.equal(999);
        done();
      });
    });
  });

  it('properly handles height "all" with document height', function(done) {
    this.timeout(20000);

    var fixture2 = 'file://' + __dirname + '/fixtures/2.html';
    var options = {
      shotSize: {
        width: 'window'
      , height: 'all'
      }
    };

    webshot(fixture2, testFile, options, function(err) {
      if (err) return done(err);

      im.identify(testFile, function(err, features) {
        if (err) return done(err);

        features.width.should.equal(1024);
        features.height.should.equal(999);
        done();
      });
    });
  });
});

describe('Passing errors for bad input', function() {
  
  it('Passes an error if an invalid extension is given', function(done) {
    this.timeout(20000);

    webshot('betabeat.com', 'output.xyz', function(err) {
      should.exist(err);
      done();
    });
  });

  it('Passes an error if a misformatted address is given', function(done) { 
    this.timeout(20000);

    webshot('abcdefghijklmnop', 'google.png', function(err) {
      should.exist(err);
      done();
    });
  });

  it('Passes an error if no webpage exists at the address', function(done) { 
    this.timeout(20000);

    webshot('http://abc1234xyz123455555.com', testFile, function(err) {
      should.exist(err);
      done();
    });
  });
});

describe('Time out', function() {
  it('should time out', function(done) {
    this.timeout(20000);

    // If the render delay is larger than the timeout delay, the timeout should be triggered.
    var options = {
      renderDelay: 10000,
      timeout: 3000
    };

    var url = 'file://' + __dirname + '/fixtures/1.html';
    webshot(url, testFile, options, function(err) {
      should.exist(err);
      should.equal(err.message, 'PhantomJS did not respond within the given timeout setting.');
      done();
    });
  });
});
