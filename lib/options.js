/*
 * This module contains a listing of all webshot's option parameters, and is
 * used by both the node and phantom scripts to coordinate passing parameters
 * between the two processes. Each option is associated with a default value
 * and a function that defines what the option does.
 *
 * Some options don't have a phantomAction function and are handled in an ad-
 * hoc manner.
 */


// These are pased to phantom and take effect before the page is loaded
exports.phantomPreload = [
  {
    name: 'windowSize'
  , value: { width: 1024, height: 768 }
  , phantomAction: function(page, val) {
      page.viewportSize = {
        width: val.width
      , height: val.height
      };
    }
  }
, {
    name: 'zoomFactor'
  , value: 1
  , phantomAction: function(page, val) {
      page.zoomFactor = val;
    }
  }
, {
    name: 'paperSize'
  , value: null
  , phantomAction: function(page, val) {
      if (val) {
        page.paperSize = val;
      }
    }
  }
, {
    name: 'userAgent'
  , value: null
  , phantomAction: function(page, val) {
      if (val) {
        page.settings.userAgent = val;
      }
    }
  }
, {
    name: 'cookies'
  , value: []
  , phantomAction: function(page, val) {
      val.forEach(function(cookie) {
        page.addCookie(cookie);
      });
    }
  }
];

// These are passed to phantom and take effect after the page is loaded
exports.phantomPostload = [
  {
    name: 'defaultWhiteBackground'
  , value: false
  , phantomAction: function(page, val) {
      if (val) {
        page.evaluate(function() {
          var style = document.createElement('style');
          var text  = document.createTextNode('body { background: #fff }');
          style.setAttribute('type', 'text/css');
          style.appendChild(text);
          document.head.insertBefore(style, document.head.firstChild);
        });
      }
    }
  }
, {
    name: 'shotSize'
  , value: { width: 'window', height: 'window' }
  , phantomAction: function(page, val) {
      page.clipRect = {
        width: pixelCount(page, 'width', val.width)
      , height: pixelCount(page, 'height', val.height)
      };
    }
  }
, {
    name: 'shotOffset'
  , value: { left: 0, right: 0, top: 0, bottom: 0 }
  , phantomAction: function(page, val) {
      page.clipRect = {
        top: val.top
      , left: val.left
      , width: page.clipRect.width - val.right
      , height: page.clipRect.height - val.bottom
      };
    }
  }
, {
    name: 'script'
  , value: function() {}
  , phantomAction: function(page, val) {
      page.evaluate(eval('(' + val + ')'));
    }
  }
, {
    name: 'takeShotOnCallback'
  , value: false
  }
, {
    name: 'streamType'
  , value: 'png'
  }
, {
    name: 'siteType'
  , value: 'url'
  }
, {
    name: 'renderDelay'
  , value: 0
  }
]

// These are some options that aren't exposed to phantom
exports.caller = [
  {
    name: 'phantomPath'
  , value: 'phantomjs'
  }
, {
    name: 'phantomConfig'
  , value: ''
  }
, {
    name: 'timeout'
  , value: 0
  }
]


/*
 * Given a shotSize dimension, return the actual number of pixels in the
 * dimension that phantom should render.
 *
 * @param (Object) page
 * @param (String) dimension
 * @param (String or Number) value
 * @param (Object) windowSize
 */
function pixelCount(page, dimension, value) {

  // Determine the page's dimensions
  var pageDimensions = page.evaluate(function() {
    var body = document.body || {};
    var documentElement = document.documentElement || {};
    return {
      width: Math.max(
        body.offsetWidth
      , body.scrollWidth
      , documentElement.clientWidth
      , documentElement.scrollWidth
      , documentElement.offsetWidth
      )
    , height: Math.max(
        body.offsetHeight
      , body.scrollHeight
      , documentElement.clientHeight
      , documentElement.scrollHeight
      , documentElement.offsetHeight
      )
    };
  });

  var x = {
    window: page.viewportSize[dimension]
  , all: pageDimensions[dimension]
  }[value] || value;

  return x;
};
