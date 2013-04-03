# node-webshot

Webshot provides a simple API for taking webpage screenshots. The module is a light wrapper around PhantomJS, which utilizes WebKit to perform the page rendering. 

## Examples
A simple example:

```javascript
var webshot = require('webshot');

webshot('google.com', 'google.png', function(err) {
  // screenshot now saved to google.png 
});
```

Alternately, the screenshot can be streamed back to the caller:

```javascript
var webshot = require('webshot');

webshot('google.com', function(err, renderStream) {
  var file = fs.createWriteStream('google.png', {encoding: 'binary'});

  renderStream.on('data', function(data) {
    file.write(data.toString('binary'), 'binary');
  });
});
```

An example showing how to take a screenshot of a site's mobile version:

```javascript
var webshot = require('webshot');

var options = {
  screenSize: {
    width: 320
  , height: 480
  }
, shotSize: {
    width: 320
  , height: 'all'
  }
, userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)'
    + ' AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
}

webshot('flickr.com', 'flickr.jpeg', options, function(err) {
  // screenshot now saved to flickr.jpeg
});
```

## Options
An optional `options` object can be passed as the third parameter in a call to webshot.

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Default Value</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>windowSize</th> 
      <td>
<pre>{ width: 1024
, height: 768 }</pre>
      </td>
      <td>The dimensions of the browser window. <em>screenSize</em> is an alias for this property.</td> 
    </tr>
    <tr>
      <th>shotSize</th> 
      <td>
<pre>{ width: 'window'
, height: 'window' }</pre>
      </td>
      <td>The area of the page document, starting at the upper left corner, to render.
      Possible values are 'screen', 'all', and a number defining a pixel length. 
      <br /> <br />
      <strong>'window'</strong> causes the length to be set to the length of the window (i.e. 
      the shot displays what is initially visible within the browser window).
      <br /> <br />
      <strong>'all'</strong> causes the length to be set to the length of the document along
      the given dimension. </td> 
    </tr>
    <tr>
      <th>phantomPath</th> 
      <td>'phantomjs'</td>
      <td>The location of phantomjs. By default, webshot uses binary provided by phantomjs NPM module</td> 
    </tr>
    <tr>
      <th>userAgent</th> 
      <td>undefined</td>
      <td>The <code>user-agent</code> string Phantom sends to the requested page. If left unset, the default
      Phantom <code>user-agent</code> will be used</td> 
    </tr>
    <tr>
      <th>script</th> 
      <td>undefined</td>
      <td>An arbitrary function to be executed on the requested page. The script executes within the page's 
      context and can be used to modify the page before a screenshot is taken. 
      </td> 
    </tr>
    <tr>
      <th>streamType</th> 
      <td>'png'</td>
      <td>If streaming is used, this designates the file format of the streamed rendering. Possible values are 
      'png', 'jpg', and 'jpeg'.
      </td> 
    </tr> 
    <tr>
      <th>renderDelay</th>
      <td>0</td>
      <td>Number of milliseconds to wait after a page loads before taking the screenshot.
      </td> 
    </tr>
  </tbody>
</table>

## Tests
Tests are written with [Mocha](http://visionmedia.github.com/mocha/) and can be run with `npm test`.

## License
(The MIT License)

Copyright (c) 2012 Brenden Kokoszka

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
