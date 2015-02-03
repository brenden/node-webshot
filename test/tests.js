var webshot = require('../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , testPNG= __dirname + '/test.png'
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

    webshot('google.com', testPNG, function(err) {
      if (err) return done(err);

      fs.exists(testPNG, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('takes a screenshot of the provided html', function(done) {
    this.timeout(20000);

    webshot('<html><body>This is a test</body></html>', testPNG, {siteType:'html'}, function(err) {
      if (err) return done(err);
      fs.exists(testPNG, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('handles very large html strings', function(done) {
    this.timeout(20000);
    var longString = Array(900000).join(' ');

    webshot(longString, testPNG, {siteType:'html'}, function(err) {
      if (err) return done(err);
      fs.exists(testPNG, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('takes a screenshot given a local path', function(done) {
    this.timeout(20000);

    webshot(__dirname + '/fixtures/2.html', testPNG, {siteType:'file'},
      function(err) {
      if (err) return done(err);
      fs.exists(testPNG, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('overwrites existing screenshots', function(done) {
    this.timeout(20000);

    webshot('google.com', testPNG, function(err) {
      if (err) return done(err);

      fs.stat(testPNG, function (err, initial) {
        if (err) return done(err);

        setTimeout(function() {
          webshot('google.com', testPNG, function(err) {
            if (err) return done(err);

            fs.stat(testPNG, function (err, overwritten) {
              if (err) return done(err);

              initial.mtime.should.be.below(overwritten.mtime);
              done();
            });
          });
        }, 1000);
      });
    });
  });

  it('streams a screenshot', function(done) {
    this.timeout(20000);

    webshot('google.com', function(err, renderStream) {
      if (err) return done(err);

      var file = fs.createWriteStream(testPNG, {encoding: 'binary'});

      renderStream.on('data', function(data) {
        file.write(data.toString('binary'), 'binary');
      });

      renderStream.on('end', function() {
        im.identify(testPNG, function(err, features) {
          features.width.should.be.above(0);
          features.height.should.be.above(0);
          done();
        });
      });
    });
  });


  it('streams a screenshot even if there are JS errors on the page', function(done) {

    webshot('<html><body><script>var a.b = "test";</script></body></html>', null, {siteType:'html'},function(err, renderStream) {
      if (err) return done(err);

      var file = fs.createWriteStream(testPNG, {encoding: 'binary'});

      renderStream.on('data', function(data) {
        file.write(data.toString('binary'), 'binary');
      });

      renderStream.on('end', function() {
        im.identify(testPNG, function(err, features) {
          features.width.should.be.above(0);
          features.height.should.be.above(0);
          done();
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

    webshot('google.com', testPNG, options, function(err) {
      if (err) return done(err);

      im.identify(testPNG, function(err, features) {
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

    webshot('example.com', testPDF, options, function(err) {
      if (err) return done(err);

      im.identify(testPDF, function(err, features) {
        features['print size'].should.equal('8.5x11');
        done();
      });
    });
  });

  it('creates a properly-sized page for zoomed shots', function(done) {
    this.timeout(20000);

    var fixture = fixtures[0];
    var options = {
      shotSize: {
        width: 'window'
      , height: 'all'
      },
      zoomFactor: 2
    };

    webshot(fixture.path, testPNG, options, function(err) {
      if (err) return done(err);

      im.identify(testPNG, function(err, features) {
        features.width.should.equal(fixture.width);
        features.height.should.equal(fixture.height * 2);
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

    webshot('google.com', testPNG, options, function(err) {
      if (err) return done(err);

      im.identify(testPNG, function(err, features) {
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

    webshot(fixture.path, testPNG, options, function(err) {
      if (err) return done(err);

      im.identify(testPNG, function(err, features) {
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

    webshot(fixture.path, testPNG, options, function(err) {
      if (err) return done(err);

      im.identify(testPNG, function(err, features) {
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

    webshot(fixture.path, testPNG, options, function(err) {
      if (err) return done(err);

      im.identify(testPNG, function(err, features) {
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

    webshot('http://abc1234xyz123455555.com', testPNG, function(err) {
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

    webshot(fixtures[0].path, testPNG, options, function(err) {
      should.exist(err);
      should.equal(err.message, 'PhantomJS did not respond within the given timeout setting.');
      done();
    });
  });
});

describe('Handling miscellaneous options', function() {
  it('cookies do not break page rendering', function(done) {
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

    this.timeout(20000);

    webshot('google.com', testPNG, options, function(err) {
      if (err) return done(err);

      fs.exists(testPNG, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('custom headers do not break page rendering', function(done) {
    var options = {
      customHeaders: { 'X-Test': 'x' }
    };

    this.timeout(20000);

    webshot('google.com', testPNG, options, function(err) {
      if (err) return done(err);

      fs.exists(testPNG, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('screenshots a non-200 page status if errorIfStatusIsNot200 not set', function(done) {
    var options = {
    };

    this.timeout(20000);

    webshot('google.com/404-page-for-webshot-tests', testPNG, options, function(err) {
      fs.exists(testPNG, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('errors on non-200 page status if errorIfStatusIsNot200 set', function(done) {
    var options = {
      errorIfStatusIsNot200: true
    };

    this.timeout(20000);

    webshot('google.com/404-page-for-webshot-tests', testPNG, options, function(err) {
      fs.exists(testPNG, function(exists) {
        exists.should.equal(false);
        done();
      });
    });
  });
});

afterEach(function(done) {
  [testPNG, testPDF].forEach(function(path) {
    try { fs.unlinkSync(path); } catch(err) {}
  });
  done();
});
