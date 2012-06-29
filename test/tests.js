var webshot = require('../lib/webshot')
  , fs = require('fs');

describe('Creating screenshot images', function() {

  it('creates a screenshot', function(done) {
    this.timeout(10000);

    webshot('google.com', 'test.png', function(err) {
      if (err) return done(err);

      fs.exists('./test.png', function(exists) {
        exists.should.equal(true);
        done();
      });
    });
  });

  it('overwrites existing screenshots', function(done) {
    this.timeout(10000);

    fs.stat('./test.png', function (err, initial) {
      if (err) return done(err);

      setTimeout(function() {    
        webshot('google.com', 'test.png', function(err) {
          if (err) return done(err);

          fs.stat('./test.png', function (err, overwritten) {
            if (err) return done(err);

            initial.ctime.should.be.below(overwritten.ctime);
            done();
          });
        }); 
      }, 100);
    });
  });
});

describe('Handling screenshot dimension options', function() {

  it('creates a properly-sized image for absolute dimensions', function(done) {
    done();
  });

/* TODO:
 * - shotSize crops properly
 *   - given absolute dimensions
 *   - given screen dimensions
 */
});

describe('Throwing exceptions for bad input', function() {

/* TODO:
 * - Invalid/missing extension raises an error
 * - Misformatted address raises reasonable exception
 * - Unaccessible page raises reasonable exception
 */
});
