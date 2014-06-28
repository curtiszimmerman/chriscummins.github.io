/**
 *  Plugin which is applied on a list of img objects and calls
 *  the specified callback function, only when all of them are loaded (or errored).
 *  @author:  H. Yankov (hristo.yankov at gmail dot com)
 *  @version: 1.0.0 (Feb/22/2010)
 *      http://yankov.us
 */

(function($) {
  $.fn.batchImageLoad = function(options) {
    var images = $(this);
    var originalTotalImagesCount = images.size();
    var totalImagesCount = originalTotalImagesCount;
    var elementsLoaded = 0;

    // Init
    $.fn.batchImageLoad.defaults = {
      loadingCompleteCallback: null,
      imageLoadedCallback: null
    }
    var opts = $.extend({}, $.fn.batchImageLoad.defaults, options);

    // Start
    images.each(function() {
      // The image has already been loaded (cached)
      if ($(this)[0].complete) {
        totalImagesCount--;
        if (opts.imageLoadedCallback) opts.imageLoadedCallback(elementsLoaded, originalTotalImagesCount);
        // The image is loading, so attach the listener
      } else {
        $(this).load(function() {
          elementsLoaded++;

          if (opts.imageLoadedCallback) opts.imageLoadedCallback(elementsLoaded, originalTotalImagesCount);

          // An image has been loaded
          if (elementsLoaded >= totalImagesCount)
            if (opts.loadingCompleteCallback) opts.loadingCompleteCallback();
        });
        $(this).error(function() {
          elementsLoaded++;

          if (opts.imageLoadedCallback) opts.imageLoadedCallback(elementsLoaded, originalTotalImagesCount);

          // The image has errored
          if (elementsLoaded >= totalImagesCount)
            if (opts.loadingCompleteCallback) opts.loadingCompleteCallback();
        });
      }
    });

    // There are no unloaded images
    if (totalImagesCount <= 0)
      if (opts.loadingCompleteCallback) opts.loadingCompleteCallback();
  };
})(jQuery);


/*
 * Strip Jack Naked
 */
(function() {
  'use strict';

  var canvas = $('#table')[0];
  var ctx = canvas.getContext('2d');
  var centre = [canvas.width / 2, canvas.height / 2];
  var c = {};

  // Begin loading card assets
  for (var i = 1; i <= 52; i++) {
    $('#cards').append('<img id="c' + i + '" src="/images/cards/' + i + '.png"></img>');

    var suit = (i - 1) % 4;
    var value = 14 - Math.floor((i - 1) / 4);

    if (!c[suit])
      c[suit] = [];

    c[suit][value] = $('#c' + i)[0];
  }

  var card2str = function (suit, value) {
    if (suit === 0)
      suit = 'Clubs';
    else if (suit === 1)
      suit = 'Spades';
    else if (suit === 2)
      suit = 'Hearts';
    else
      suit = 'Diamonds';

    if (value === 14)
      value = 'Ace';
    else if (value === 13)
      value = 'King';
    else if (value === 12)
      value = 'Queen';
    else if (value === 11)
      value = 'Jack';

    return value + ' of ' + suit;
  };

  ctx.font = '20px arial';

  ctx.fillStyle = 'black';

  ctx.fillText('centre', centre[0], centre[1]);

  var main = function() {
    ctx.drawImage(c[3][3], 0, 0);
    ctx.drawImage($('#c1')[0], 100, 100);
  };

  $("#cards").find('img').batchImageLoad({
    loadingCompleteCallback: main
  });

})();
