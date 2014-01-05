// Options for the phantom script
exports.phantom = {
  windowSize: {
    width: 1024
  , height: 768
  }
, shotSize: {
    width: 'window'
  , height: 'window'
  }
, shotOffset: {
    left: 0
  , right: 0
  , top: 0
  , bottom: 0
  }
, defaultWhiteBackground: false
, script: function() {}
, takeShotOnCallback: false
, streamType: 'png'
, siteType: 'url'
, renderDelay: 0
};

// Options that are just passed to the phantom page object
exports.phantomPage = ['paperSize', 'zoomFactor', 'cookies',
  'customHeaders', 'settings'];

// Options that are used in the calling node script
exports.caller = {
  phantomPath: 'phantomjs'
, phantomConfig: ''
, timeout: 0
};
