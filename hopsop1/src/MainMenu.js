musicOn = true;
BasicGame.MainMenu = function (game) {

	this.music = null;
	this.playButton = null;

};

BasicGame.MainMenu.prototype = {

	create: function () {

    var me = this;
    
    // visa titel
		me.add.sprite(this.world.centerX-320, 0, 'titlepage');
    me.audiotick2down = me.add.audio('tick2down');
    me.audiotick2up = me.add.audio('tick2up');

    var playButtonY = 0;
    if (this.world.height<1000) {
		  playButtonY = 380;
		} else {
		  playButtonY = 445;
		}

		me.playButton = me.add.button(me.world.centerX - 45, playButtonY, 'playButton', me.startGame, me, 'btn-start-hover', 'btn-start-normal', 'btn-start-hover');
    me.playButton.onInputDown.add(me.playButtonDown, me);
		
		me.add.sprite(38, 23, 'highscoreLabel');
		
		high = localStorage.getItem('hopsop-high');
		if (high === null) {
		  high = '0';
		}
		
		me.menuScore = me.add.bitmapText(138, 18, 'hopsopfont', high, 20);
    
		
		me.musicButton = me.add.button(me.world.width - 160, 20, 'musicButton', me.toggleMusic, me, null, null, null);
		
		musicOn = localStorage.getItem('hopsop-music') === true || localStorage.getItem('hopsop-music') === 'true' || localStorage.getItem('hopsop-music') === null ? true : false;
		
		if (musicOn === true || musicOn === 'true') {
      me.musicButton.frameName = 'btn-music-normal';
    } else {
      me.musicButton.frameName = 'btn-music-hover';
    }
		
	},
	
  playButtonDown: function () {
      this.audiotick2down.play('', 0, 1, false);	
  },
  
  toggleMusic: function() {
      var me = this;
      
      musicOn = !musicOn;
      localStorage.setItem('hopsop-music', musicOn);
      
  		if (musicOn === true || musicOn === 'true') {
        me.musicButton.frameName = 'btn-music-normal';
      } else {
        me.musicButton.frameName = 'btn-music-hover';
        if (GlobalGameMusic && GlobalGameMusic.isPlaying) {
            GlobalGameMusic.stop();
          
        }
      }
  },

	update: function () {

		//	Do some nice funky main menu effect here
    //console.log('mainmenu update');
	},

	startGame: function (pointer) {

		//	Ok, the Play Button has been clicked or touched, so let's stop the music (otherwise it'll carry on playing)
		//this.music.stop();
    var me = this;
    //this.audiotick2up.play('', 0, 1, false);	
    
		//	And start the actual game
		setTimeout(function(){
		  me.state.start('Game');
  		
		}, 200)
    
	}

};
