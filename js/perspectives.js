'use strict';




/**
 * Perspectives.
 */
var perspectives = (function(window, undefined) {

  /**
   * Array of all life lessons
   */
  var perspectives = ["first", "short-big-life", "conscious", "slope", "why", "adversity", "grit", "upwind", "climbing-hills", "attitude", "self-awareness", "clouds-and-dirt", "habit", "expand-outside", "do-what-you-love", "first-principles", "create-value", "process-goal", "probabilities", "experience-purpose", "breathe"];

  var currentPerspective = "";
  var previousPerspective = "noHistory";
  var _currentCardId = -1;

  var clickedClose = false;

  /**
   * Enum of CSS selectors.
   */
  var SELECTORS = {
    pattern: '.pattern',
    card: '.card',
    cardImage: '.card__image',
    cardClose: '.card__btn-close',
  };

  /**
   * Enum of CSS classes.
   */
  var CLASSES = {
    patternHidden: 'pattern--hidden',
    polygon: 'polygon',
    polygonHidden: 'polygon--hidden'
  };

  /**
   * Map of svg paths and points.
   */
  var polygonMap = {
    paths: null,
    points: null
  };

  /**
   * Container of Card instances.
   */
  var layout = {};

  /**
   * Initialise perspectives.
   */
  function init() {

    // For options see: https://github.com/qrohlf/Trianglify
    var pattern = Trianglify({
      width: window.innerWidth,
      height: window.innerHeight,
      cell_size: 90,
      variance: 1,
      stroke_width: 1,
      x_colors: ['#F0F5F9', '#C9D6DF', '#52616B']//['#CDE2ED', '#00B8A9', '#2994B2']
    }).svg(); // Render as SVG.

    _mapPolygons(pattern);

    _bindCards(function() {
      setTimeout(function() { _loadInitialCard(); }, 100);
    });


    // alert("gonna load card bro");
    // _loadInitialCard(1);
  };


  function _loadInitialCard() {

    var hash = window.location.hash.substring(1);
    if (hash.length > 0) {
      var cardId = perspectives.indexOf(hash);
      console.log("how many perspectives? ", perspectives.length);
      _playSequence(true, cardId);
    }
  };

  /**
   * Store path elements, map coordinates and sizes.
   * @param {Element} pattern The SVG Element generated with Trianglify.
   * @private
   */
  function _mapPolygons(pattern) {

    // Append SVG to pattern container.
    $(SELECTORS.pattern).append(pattern);

    // Convert nodelist to array,
    // Used `.childNodes` because IE doesn't support `.children` on SVG.
    polygonMap.paths = [].slice.call(pattern.childNodes);

    polygonMap.points = [];

    polygonMap.paths.forEach(function(polygon) {

      // Hide polygons by adding CSS classes to each svg path (used attrs because of IE).
      $(polygon).attr('class', CLASSES.polygon);

      var rect = polygon.getBoundingClientRect();

      var point = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      polygonMap.points.push(point);
    });

    // All polygons are hidden now, display the pattern container.
    $(SELECTORS.pattern).removeClass(CLASSES.patternHidden);
  };

  /**
   * Bind Card elements.
   * @private
   */
  function _bindCards(callback) {

    var elements = $(SELECTORS.card);

    $.each(elements, function(card, i) {

      var instance = new Card(i, card);

      layout[i] = {
        card: instance
      };

      var cardImage = $(card).find(SELECTORS.cardImage);
      var cardClose = $(card).find(SELECTORS.cardClose);

      $(cardImage).on('click', _playSequence.bind(this, true, i));
      $(cardClose).on('click', _playSequence.bind(this, false, i));
    });

    callback();
  };

  /**
   * Create a sequence for the open or close animation and play.
   * @param {boolean} isOpenClick Flag to detect when it's a click to open.
   * @param {number} id The id of the clicked card.
   * @param {Event} e The event object.
   * @private
   *
   */
  function _playSequence(isOpenClick, id, e) {

    // if (id == -1) {
    //   console.log("in heree");
    // //  var hideCards = _hideAllCards();
    //   var sequence = new TimelineLite({paused: true});
    //   sequence.add(_hideAllCards());
    //   sequence.play();
    //   return;
    // }
    var card = layout[id].card;

    // Prevent when card already open and user click on image.
    if (card.isOpen && isOpenClick) return;

    // Create timeline for the whole sequence.
    var sequence = new TimelineLite({paused: true});

    var tweenOtherCards = _showHideOtherCards(id);

    if (!card.isOpen) {
      // Open sequence.

      //console.log("the target is: ", e.target);
      if (e == undefined) {
       // var cardImage = $(card).find(SELECTORS.cardImage);

        var cardId = perspectives[id] + "_image";
        var cardImage = document.getElementById(cardId);
        console.log("the card image yoo:: ", cardImage);
        _setPatternBgImg(cardImage);

      } else {

        console.log("the card image target:: ", e.target);
        window.location.hash = "#" + perspectives[id];

        // console.log("here we have the id", id);
        // console.log("and here we have the e", e);
        _setPatternBgImg(e.target);
      }

      sequence.add(tweenOtherCards);
      sequence.add(card.openCard(_onCardMove), 0);

    } else {
      // Close sequence.
      window.location.hash = "";

      var closeCard = card.closeCard();
      var position = closeCard.duration() * 0.8; // 80% of close card tween.

      clickedClose = true;
      sequence.add(closeCard);
      sequence.add(tweenOtherCards, position);
    }

    sequence.play();
  };

  /**
   * Show/Hide all other cards.
   * @param {number} id The id of the clicked card to be avoided.
   * @private
   */
  function _showHideOtherCards(id) {

    var TL = new TimelineLite;
    _currentCardId = id;

    var selectedCard = layout[id].card;

    for (var i in layout) {

      var card = layout[i].card;

      // When called with `openCard`.
      if (card.id !== id && !selectedCard.isOpen) {
        TL.add(card.hideCard(), 0);
      }

      // When called with `closeCard`.
      if (card.id !== id && selectedCard.isOpen) {
        TL.add(card.showCard(), 0);
      }
    }

    return TL;
  };

  /**
   * Hides all cards.
   * @private
   */
  function _hideAllCards() {
    var TL = new TimelineLite;
    for (var i in layout) {
        var card = layout[i].card;
        TL.add(card.hideCard(), 0);
    }

    window.location.hash = "";
    return TL;
  }

  /**
   * Add card image to pattern background.
   * @param {Element} image The clicked SVG Image Element.
   * @private
   */
  function _setPatternBgImg(image) {

    var imagePath = $(image).attr('xlink:href');

    $(SELECTORS.pattern).css('background-image', 'url(' + imagePath + ')');
  };

  /**
   * Callback to be executed on Tween update, whatever a polygon
   * falls into a circular area defined by the card width the path's
   * CSS class will change accordingly.
   * @param {Object} track The card sizes and position during the floating.
   * @private
   */
  function _onCardMove(track) {

    var radius = track.width / 2;

    var center = {
      x: track.x,
      y: track.y
    };

    polygonMap.points.forEach(function(point, i) {

      if (_detectPointInCircle(point, radius, center)) {
        $(polygonMap.paths[i]).attr('class', CLASSES.polygon + ' ' + CLASSES.polygonHidden);
      } else {
        $(polygonMap.paths[i]).attr('class', CLASSES.polygon);
      }
    });
  }

  /**
   * Detect if a point is inside a circle area.
   * @private
   */
  function _detectPointInCircle(point, radius, center) {

    var xp = point.x;
    var yp = point.y;

    var xc = center.x;
    var yc = center.y;

    var d = radius * radius;

    var isInside = Math.pow(xp - xc, 2) + Math.pow(yp - yc, 2) <= d;

    return isInside;
  };



  window.onhashchange = function() {
    currentPerspective = window.location.hash;
    if (currentPerspective == "" && previousPerspective != "" && previousPerspective != "noHistory" && !clickedClose && _currentCardId != -1) {
      _playSequence(false, _currentCardId);
    }
    clickedClose = false;
    previousPerspective = currentPerspective;
  }


  // Expose methods.
  return {
    init: init
    //makeBackWork: makeBackWork
  };

})(window);

// Kickstart Perspectives.
window.onload = perspectives.init;

//window.onhashchange = perspectives.makeBackWork;



// $(window).on('hashchange', function() {
//   //.. work ..
//
//   location.reload();
// });


window.onpopstate = function() {
  // location.reload();
   console.log("hey wassup");

}
