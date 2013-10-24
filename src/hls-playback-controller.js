(function (window) {
  window.videojs.hls.HLSPlaybackController = function (vjsPlayerReference) {
    var ManifestController = window.videojs.hls.ManifestController;
    var SegmentController = window.videojs.hls.SegmentController;
    var MediaSource = window.videojs.MediaSource;
    var SegmentParser = window.videojs.hls.SegmentParser;
    var M3U8 = window.videojs.hls.M3U8;

    var self = this;

    self.player = vjsPlayerReference;
    self.mediaSource = new MediaSource();
    self.parser = new SegmentParser();

    self.manifestController = null;
    self.segmentController = null;
    self.manifestLoaded = false;
    self.currentSegment = 0;
    self.currentManifest = null;
    self.currentPlaylist = null;
    self.currentRendition = null;

    // Register Externall Callbacks
    self.manifestLoadCompleteCallback;

    self.player.on('timeupdate', function () {
      console.log(self.player.currentTime());
    });

    self.player.on('onsrcchange', function () {
      console.log('src change', self.player.currentSrc());
      //if src.url.m3u8 -- loadManifest.url
    });

    self.rendition = function (rendition) {
      self.currentRendition = rendition;
      self.loadManifest(self.currentRendition.url, self.onM3U8LoadComplete, self.onM3U8LoadError, self.onM3U8Update);
    };

    self.loadManifest = function (manifestUrl, onDataCallback, onErrorCallback, onUpdateCallback) {
      self.mediaSource.addEventListener('sourceopen', function (event) {
	console.log('source open here');
	// feed parsed bytes into the player
	self.sourceBuffer = self.mediaSource.addSourceBuffer('video/flv; codecs="vp6,aac"');

	self.parser = new SegmentParser();

	self.sourceBuffer.appendBuffer(self.parser.getFlvHeader(), video);

	if( onDataCallback )
	{
	  self.manifestLoadCompleteCallback = onDataCallback;
	}

	self.manifestController = new ManifestController();
	self.manifestController.loadManifest(manifestUrl, self.onM3U8LoadComplete, self.onM3U8LoadError, self.onM3U8Update);

      }, false);

      self.player.src({
	src: videojs.URL.createObjectURL(self.mediaSource),
	type: "video/flv"
      });
    };

    self.onM3U8LoadComplete = function (m3u8) {
      if (m3u8.invalidReasons.length == 0) {
	if(m3u8.isPlaylist)
	{
	  self.currentPlaylist = m3u8;
	  self.rendition(self.currentPlaylist.playlistItems[0]);
	} else {
	  self.currentManifest = m3u8;
	  self.manifestLoaded = true;

	  self.loadSegment(self.currentManifest.mediaItems[0]);

	  if(self.manifestLoadCompleteCallback)
	  {
	    self.manifestLoadCompleteCallback(m3u8);
	  }
	}
      }
    };

    self.onM3U8LoadError = function (error) {

    };

    self.onM3U8Update = function (m3u8) {

    };

    self.loadSegment = function(segment) {
      self.segmentController = new SegmentController();
      self.segmentController.loadSegment(segment.url, self.onSegmentLoadComplete, self.onSegmentLoadError);

    };

    self.onSegmentLoadComplete = function (segment) {
      self.parser.parseSegmentBinaryData(segment.binaryData);

      while (self.parser.tagsAvailable()) {
	self.sourceBuffer.appendBuffer(self.parser.getNextTag().bytes, self.player);
      };

      console.log('load another',self.currentSegment,self.currentManifest.mediaItems.length);

      if(self.currentSegment < self.currentManifest.mediaItems.length-1)
      {
	console.log('load another');
	self.loadNextSegment();
      }
    };

    self.loadNextSegment = function () {
      self.currentSegment++;
      self.loadSegment(self.currentManifest.mediaItems[self.currentSegment]);
    }

    self.onSegmentLoadError = function (error) {

    };

  };
})(this);
