
BasicGame.Preloader = function (game) {

	this.background = null;
	this.preloadBar = null;

	this.ready = false;

};

BasicGame.Preloader.prototype = {

	preload: function () {

		//	These are the assets we loaded in Boot.js
		this.background = this.add.sprite(this.world.centerX-320, 0, 'preloaderBackground');
		var preloaderY = 0;
		if (this.world.height<1000) {
		  preloaderY = 390;
		} else {
		  preloaderY = 480;
		}
		this.preloadBar = this.add.sprite(this.world.centerX-175, preloaderY, 'preloaderBar');

		//	This sets the preloadBar sprite as a loader sprite.
		//	What that does is automatically crop the sprite from 0 to full-width
		//	as the files below are loaded in.
		this.load.setPreloadSprite(this.preloadBar);


    this.load.audio('music', ['audio/mp3/music.mp3']);
    this.load.audio('death', ['audio/mp3/death.mp3']);
    this.load.audio('jumplanding', ['audio/mp3/jump-landing.mp3']);
    this.load.audio('jumplandingleaves', ['audio/mp3/jump-landing-leaves-2.mp3']);
    this.load.audio('jumplandingice', ['audio/mp3/jump-landing-ice.mp3']);      
    this.load.audio('jumpup', ['audio/mp3/jump-up.mp3']);
    this.load.audio('pickupacorn', ['audio/mp3/pickup-acorn.mp3']);
    this.load.audio('tick2down', ['audio/mp3/tick-2-down.mp3']);
    this.load.audio('tick3', ['audio/mp3/tick-3.mp3']);
    this.load.audio('warpout', ['audio/mp3/warpout.mp3']);
    this.load.audio('warpin', ['audio/mp3/warpin.mp3']);
    
    this.load.bitmapFont('hopsopfont', 'assets/font.png', 'assets/font.xml');
    
    if (this.world.height<1000) {
    	this.load.image('titlepage', 'images/titlescreen-4-3.jpg');
    } else {
      this.load.image('titlepage', 'images/titlescreen-16-9.jpg');
    }
    

    this.load.image('highscoreLabel', 'images/label-highscore.png');
		this.load.image('newHighScoreLabel', 'images/label-new-highscore.png');
    
		this.load.image('gameOver', 'images/game-over.png');
		
		this.load.atlas('playButton', 'images/btn-start.png', 'assets/btn-start.json');
		this.load.atlas('closeButton', 'images/btn-close.png', 'assets/btn-close.json');
		this.load.atlas('musicButton', 'images/btn-music.png', 'assets/btn-music.json');
		this.load.atlas('replayButton', 'images/btn-restart.png', 'assets/btn-restart.json');
		
		
		//this.load.audio('titleMusic', ['audio/main_menu.mp3']);
		//this.load.bitmapFont('caslon', 'fonts/caslon.png', 'fonts/caslon.xml');
		//	+ lots of other required assets here
		
		// Player assets
		
		this.load.image('player', 'images/player.png');
		this.load.atlas('playerfront', 'images/player_sprite.png', 'assets/player_sprite.json');
		
	
		this.load.image('aim', 'images/aim.png');
		this.load.image('ray', 'images/ray.png');
		this.load.image('instructions', 'images/instructions.png');

    // World assets
		this.load.image('water', 'images/water.png');
		this.load.image('wallVertical', 'images/wall-vertical.png');
		this.load.image('ceiling', 'images/ceiling.png');
		
		this.load.image('bg1', 'images/bg-1.jpg');
		this.load.image('bg2', 'images/bg-2.jpg');
		this.load.image('bg3', 'images/bg-3.jpg');
		this.load.image('bg4', 'images/bg-4.jpg');
		this.load.image('bg5', 'images/bg-5.jpg');
		
		
		
		this.load.image('city1', 'images/floating-city-1.png');
    this.load.image('city2', 'images/floating-city-2.png');
    this.load.image('city3', 'images/floating-city-3.png');
    this.load.image('city4', 'images/floating-city-4.png');
    
		// Tree assets
		
		this.load.image('trunk', 'images/trunk.png');
		
		this.load.image('acorn1', 'images/acorn-1.png');
		this.load.image('acorn2', 'images/acorn-2.png');
		this.load.image('acorn3', 'images/acorn-3.png');
		
    this.load.image('shelf1', 'images/shelf-1.png');
    this.load.image('shelf2', 'images/shelf-2.png');
    this.load.image('shelf3', 'images/shelf-3.png');
    this.load.image('shelf4', 'images/shelf-4.png');
    this.load.image('shelf5', 'images/shelf-5.png');
    
    this.load.image('ice1', 'images/ice-1.png');
    this.load.image('ice2', 'images/ice-2.png');
    this.load.image('ice3', 'images/ice-3.png');
    
    this.load.image('portal', 'images/portal.png');
    this.load.image('portallight', 'images/portal-light.png');
    
	},

	create: function () {

		//	Once the load has finished we disable the crop because we're going to sit in the update loop for a short while as the music decodes
		this.preloadBar.cropEnabled = false;
	},

	update: function () {

		//	You don't actually need to do this, but I find it gives a much smoother game experience.
		//	Basically it will wait for our audio file to be decoded before proceeding to the MainMenu.
		//	You can jump right into the menu if you want and still play the music, but you'll have a few
		//	seconds of delay while the mp3 decodes - so if you need your music to be in-sync with your menu
		//	it's best to wait for it to decode here first, then carry on.
		
		//	If you don't have any music in your game then put the game.state.start line into the create function and delete
		//	the update function completely.
		if (this.cache.isSoundDecoded('music') && this.ready == false)
		{
			this.ready = true;
			this.state.start('MainMenu');
		}
		
		// We don't have music so lets start anyway
		//this.state.start('MainMenu');

	}

};
