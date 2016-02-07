exports.fixtures = [
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
, {
    path: 'file://' + __dirname + '/fixtures/3.html'
  , width: 300
  , height: 250
  }
];

var pngOutput = exports.pngOutput = __dirname + '/test.png';
var pdfOutput = exports.pdfOutput = __dirname + '/test.pdf';

afterEach(function(done) {
  [pngOutput, pdfOutput].forEach(function(path) {
    try { fs.unlinkSync(path); } catch(err) {}
  });
  done();
});
