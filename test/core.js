var webshot = require('../lib/webshot')
  , should = require('should')
  , fs = require('fs')
  , im = require('imagemagick')
  , helper = require('./helper')
  , pngOutput = helper.pngOutput
  , fixtures = helper.fixtures;

describe('Creating screenshot images', function() {
  this.timeout(20000);

  it('creates a screenshot', function(done) {
    webshot('google.com', pngOutput, function(err) {
      if (err) return done(err);

      fs.exists(pngOutput, function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('overwrites existing screenshots', function(done) {
    webshot('google.com', pngOutput, function(err) {
      if (err) return done(err);

      fs.stat(pngOutput, function (err, initial) {
        if (err) return done(err);

        setTimeout(function() {
          webshot('google.com', pngOutput, function(err) {
            if (err) return done(err);

            fs.stat(pngOutput, function (err, overwritten) {
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
    var renderStream = webshot('google.com');
    var file = fs.createWriteStream(pngOutput, {encoding: 'binary'});

    renderStream.on('data', function(data) {
      file.write(data.toString('binary'), 'binary');
    });

    renderStream.on('end', function() {
      im.identify(pngOutput, function(err, features) {
        features.width.should.be.above(0);
        features.height.should.be.above(0);
        done();
      });
    });
  });

  it('streams a screenshot even if the page has JS errors', function(done) {
    var badHTML =
      '<html><body><script>var a.b = "test";</script></body></html>';
    var renderStream = webshot(badHTML, {siteType:'html'});
    var file = fs.createWriteStream(pngOutput, {encoding: 'binary'});

    renderStream.on('data', function(data) {
      file.write(data.toString('binary'), 'binary');
    });

    renderStream.on('end', function() {
      im.identify(pngOutput, function(err, features) {
        features.width.should.be.above(0);
        features.height.should.be.above(0);
        done();
      });
    });
  });

  it('streams a screenshot with the old callback interface', function(done) {
    webshot('google.com', function(err, renderStream) {
      if (err) return done(err);

      var file = fs.createWriteStream(pngOutput, {encoding: 'binary'});

      renderStream.on('data', function(data) {
        file.write(data.toString('binary'), 'binary');
      });

      renderStream.on('end', function() {
        im.identify(pngOutput, function(err, features) {
          features.width.should.be.above(0);
          features.height.should.be.above(0);
          done();
        });
      });
    });
  });
});

describe('Passing errors for bad input', function() {
  it('passes an error if an invalid extension is given', function(done) {
    webshot('betabeat.com', 'output.xyz', function(err) {
      should.exist(err);
      done();
    });
  });

  it('passes an error if a misformatted address is given', function(done) {
    webshot('abcdefghijklmnop', pngOutput, function(err) {
      should.exist(err);
      done();
    });
  });

  it('passes an error if no webpage exists at the address', function(done) {
    webshot('http://abc1234xyz123455555.com', pngOutput, function(err) {
      should.exist(err);
      done();
    });
  });

  it('passes an error if no webpage exists with stream output', function(done) {
    webshot('http://abc1234xyz123455555.com', { errorIfStatusIsNot200: true })
      .on('error', function (err) {
        should.exist(err);
        done();
      })
      .on('end', function () {
        done(new Error('Should have emitted error'));
      });
  });

  it('passes an error if no webpage exists with stream callback', function(done) {
    webshot(
      'http://abc1234xyz123455555.com',
      { errorIfStatusIsNot200: true },
      function (err) {
        should.exist(err);
        done();
      });
  });

  it('throws an error when called syncronously with invalid input',
      function(done) {
    try {
      var renderStream = webshot('google.com', {siteType: 'abc'});
    } catch (err) {
      done();
    }
  });
});
