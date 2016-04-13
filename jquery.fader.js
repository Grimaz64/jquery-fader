/*!
 * jQuery Fader Plugin v1.0
 * @AUTHOR: Clément Caillard
 *
 * Bang bang bang !
 */

//TODO: rajouter le swipe

(function($, window) {

	/** Fader Constructor **/
	var Fader = function(element, options, callback) {
		var self = this;

		this.options = $.extend({
			prefix     : "bang",
			speedOut   : 300,
			speedIn    : 400,
			delay 	   : 300,
			method	   : 'animate', //method of animation (animate, transition, fx...)
			easing 	   : 'swing',
			autoslide  : false,
			interval   : 4000,
			shownav	   : true, 	//show the bullet-navigation
			navWrapper : null,  //selector || DOM element
			control    : false, //show right and left arrow controls
			controlWrapper : null, //selector || DOM element
			onReady	   : $.noop,
			onFade     : $.noop,
			onFadeEnd  : $.noop
		}, options || {});

		this.$fader  	 = $(element);
		this.$slides     = this.$fader.children('.slide');
		this.$navWrapper = ($(this.options.navWrapper).length) ? $(this.options.navWrapper) : this.$fader.parent();
		this.$nav 	     = null;
		this.$bullets    = null;
		this.$controlWrapper = ($(this.options.controlWrapper).length) ? $(this.options.controlWrapper) : this.$fader.parent();
		this.$leftArrow  = null;
		this.$rightArrow = null;

		this.nbSlides = this.$slides.length;
		this.timer    = null;
		this.isFading = false;

		this.activeIndex = this.$slides.index(this.$fader.children('.slide.active'));
		if (this.activeIndex == -1) {
			this.activeIndex = 0;
			this.$slides.eq(this.activeIndex).addClass('active');
		}

		this.navClass 	  = this.options.prefix + "-fader-nav";
		this.bulletClass  = this.options.prefix + "-fader-bullet";
		this.controlClass = this.options.prefix + "-fader-arrow";

		this.callback = (typeof callback != 'undefined') ? callback : $.noop;

		if (this.nbSlides < 2) return;
		this.init();
	}

	/** Fader Prototype **/
	Fader.prototype = {

        init: function() {
            var self = this;

            self.buildDOM();
            self.uiManager();

            self.options.onReady.call(self);
            self.callback.call(self);
            if (self.options.autoslide) { self.startFader(); }
        },

        /** add all elements to DOM **/
        buildDOM: function() {

        	var self 	    = this,
        		$fader  	= self.$fader,
        		$slides     = self.$slides,
        		$navWrapper = self.$navWrapper,
        		$controlWrapper = self.$controlWrapper;

        	// Create Navigation Bullets
        	if (self.options.shownav && self.$nav === null) {
        		self.$nav = $('<div class="' + self.navClass + '"></div>');
        		for (var i = 0; i < self.nbSlides; i++) {
    				$('<a href="#" class="' + self.bulletClass + '"></a>').appendTo(self.$nav); //TODO configurer le href ??
    			}
        		self.$nav.appendTo($navWrapper);
        		self.$bullets = self.$nav.children('.' + self.bulletClass);
        		self.$bullets.eq(self.activeIndex).addClass('active');
			}

        	// Create Controls Arrows
        	if (self.options.control && self.$leftArrow === null) {
        		self.$leftArrow  = $('<a href="#" class="' + self.controlClass + '-left"></a>'); //TODO configurer le href ?? + maj lors du slide
        		self.$rightArrow = $('<a href="#" class="' + self.controlClass + '-right"></a>'); //TODO configurer le href ?? + maj lors du slide
        		self.$leftArrow.appendTo($controlWrapper);
        		self.$rightArrow.appendTo($controlWrapper);
			}
		},

		removeDOM: function() {
			var self = this;
			if (self.$nav) self.$nav.remove();
			if (self.$leftArrow) self.$leftArrow.remove();
			if (self.$rightArrow) self.$rightArrow.remove();
		},

		/** add Event Listener **/
		uiManager: function() {

			var self 		= this,
				$bullets	= self.$bullets,
				$leftArrow  = self.$leftArrow,
				$rightArrow = self.$rightArrow;

			// Gestion du click sur les bullets
			if (self.options.shownav) {
				$bullets.on('click', function(e) {
					if (!$(this).hasClass('active')) {
						self.fadeTo($bullets.index(this), true);
					}
					return false;
				});
			}

			// Gestion du click sur les controls
			if (self.options.control) {
				$leftArrow.on('click', function(e) {
					if (!self.isFading) {
						self.fadeTo(self.activeIndex - 1, true);
					}
					return false;
				});
				$rightArrow.on('click', function(e) {
					if (!self.isFading) {
						self.fadeTo(self.activeIndex + 1, true);
					}
					return false;
				});
			}
		},

		/** External Control **/
		startFader: function() {
			var self = this;
			clearInterval(self.timer);
			self.timer = setInterval(function() { self.fadeNext(false); }, self.options.interval);
		},

		stopFader: function() {
			var self = this;
			clearInterval(self.timer);
		},

		fadeTo: function(newIndex, cleantimer) {

			var self 		= this,
				$fader  	= self.$fader,
				$slides     = self.$slides,
				$bullets	= self.$bullets,
				$leftArrow  = self.$leftArrow,
				$rightArrow = self.$rightArrow,
				cleantimer  = (typeof cleantimer != 'undefined') ? cleantimer : false;

			if (!self.isFading && newIndex != self.activeIndex) {

				if (cleantimer) { self.stopFader(); }
				self.isFading = true;

				// Gestion du loop
				if (newIndex == -1) {
					newIndex = self.nbSlides - 1;
				} else if (newIndex == self.nbSlides) {
					newIndex = 0;
				}

				// MaJ States Nav Bullets, Controls
				if (self.options.shownav) {
					$bullets.removeClass('active');
					$bullets.eq(newIndex).addClass('active');
				}

				// Call synchronous
				self.options.onFade($slides, self.activeIndex, newIndex);

				// Fade to newIndex
				$slides.stop().animate({opacity: 0}, self.options.speedOut, self.options.easing, function() { $(this).css('visibility', "hidden").removeClass('active'); });
				$slides.eq(newIndex).stop().css({opacity: 0, visibility: "visible"}).delay(self.options.delay).animate({opacity: 1}, self.options.speedIn, self.options.easing, function() {
					// Callback
					self.options.onFadeEnd($slides, self.activeIndex, newIndex);

					// Slide States
					$(this).addClass('active');

					// MaJ constantes
					self.activeIndex = newIndex;
					self.isFading   = false;

					// Autoslide
					if (cleantimer && self.options.autoslide) { self.startFader(); }
				});
			}
		},

		fadeNext: function(cleantimer) {
			var self 	   = this,
				cleantimer = (typeof cleantimer != 'undefined') ? cleantimer : false;

			self.fadeTo(self.activeIndex + 1, cleantimer);
		},

		fadePrev: function(cleantimer) {
			var self 	   = this,
				cleantimer = (typeof cleantimer != 'undefined') ? cleantimer : false;

			self.fadeTo(self.activeIndex - 1, cleantimer);
		},

		destroy: function() {
			var self = this;
			self.stopFader();
			self.removeDOM();
			self.$fader.removeData('fader');
		},

		refresh: function() {
			var self = this;
			self.stopFader();
			self.$nav.remove();

			self.$slides     = self.$fader.children('.slide');
			self.$nav 	     = null;
			self.$bullets    = null;
			self.nbSlides = self.$slides.length;

			self.activeIndex = self.$slides.index(self.$fader.children('.slide.active'));
			if (self.activeIndex == -1) {
				self.activeIndex = 0;
				self.$slides.eq(self.activeIndex).addClass('active');
			}

			self.buildDOM();
            self.uiManager();
            if (self.options.autoslide) { self.startFader(); }
		}
	};

	/** jQuery plugin: Fader instantiation **/
	$.fn.fader = function(options, callback) {
		return this.each(function() {
			var $self = $(this);
            if ($self.data('fader')) return;
            var instance = new Fader(this, options, callback);
            $self.data('fader', instance);
        });
	};

	window.Fader = Fader;

})(jQuery, window, undefined);
