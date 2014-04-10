var webshot = require('../lib/webshot');

var options = {
  onLoadFinished: {
    fn: function(status) {
      var tags = document.getElementsByTagName(this.tagToReplace);

      for (var i=0; i<tags.length; i++) {
        var tag = tags[i];
        tag.innerHTML = 'The loading status of this page is: ' + status;
      }
    }
  , context: {tagToReplace: 'h2'}
  }
};

webshot('flickr.com', './flickr.png', options, function(err) {
  if (err) return console.log(err);
  console.log('OK');
});
