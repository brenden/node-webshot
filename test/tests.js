var webshot = require('../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , testFile = __dirname + '/test.png'
  , testPDF = __dirname + '/test.pdf';

// Some test documents
var fixtures = [
  {
    path: 'file://' + __dirname + '/fixtures/1.html'
  , width: 1024
  , height: 999
  }
, {
    path: 'file://' + __dirname + '/fixtures/2.html'
  , width: 1024
  , height: 1000
  }
];


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

            initial.mtime.should.be.below(overwritten.mtime);
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
          im.identify(testFile, function(err, features) {
            features.width.should.be.above(0);
            features.height.should.be.above(0);
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
    , shotOffset: {
        left: 10
      , top: 10
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

    var fixture = fixtures[0];
    var options = {
      shotSize: {
        width: 'window'
      , height: 'all'
      }
    };

    webshot(fixture.path, testFile, options, function(err) {
      if (err) return done(err);

      im.identify(testFile, function(err, features) {
        if (err) return done(err);

        features.width.should.equal(fixture.width);
        features.height.should.equal(fixture.height);
        done();
      });
    });
  });

  it('properly handles height "all" with document height', function(done) {
    this.timeout(20000);

    var fixture = fixtures[1];
    var options = {
      shotSize: {
        width: 'window'
      , height: 'all'
      }
    };

    webshot(fixture.path, testFile, options, function(err) {
      if (err) return done(err);

      im.identify(testFile, function(err, features) {
        if (err) return done(err);

        features.width.should.equal(fixture.width);
        features.height.should.equal(fixture.height);
        done();
      });
    });
  });

  it('crops shots with right and bottom offsets', function(done) {
    this.timeout(20000);

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

    webshot(fixture.path, testFile, options, function(err) {
      if (err) return done(err);

      im.identify(testFile, function(err, features) {
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


describe('Passing errors for bad input', function() {
  
  it('passes an error if an invalid extension is given', function(done) {
    this.timeout(20000);

    webshot('betabeat.com', 'output.xyz', function(err) {
      should.exist(err);
      done();
    });
  });

  it('passes an error if a misformatted address is given', function(done) {
    this.timeout(20000);

    webshot('abcdefghijklmnop', 'google.png', function(err) {
      should.exist(err);
      done();
    });
  });

  it('passes an error if no webpage exists at the address', function(done) {
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

    webshot(fixtures[0].path, testFile, options, function(err) {
      should.exist(err);
      should.equal(err.message, 'PhantomJS did not respond within the given timeout setting.');
      done();
    });
  });
});
