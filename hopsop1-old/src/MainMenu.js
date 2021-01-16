var isCordova = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1,
    isIos = true;
//isCordova = false;
BasicGame.MainMenu = function (game) {

    this.music = null;
    playButton = null;

};

BasicGame.MainMenu.prototype = {

    create: function () {

        var me = this;

        // visa titel
        titlepage = me.add.sprite(this.world.centerX - 320, 0, 'titlepage');
        if (isCordova && !isIos) {
            //audiotick2down = new Media(getAudioPath() + 'audio/mp3/tick-2-down.mp3');

        } else {
            //audiotick2down = me.add.audio('tick2down');
        }

        var playButtonY = 0;
        if (this.world.height < 1000) {
            playButtonY = 380;
        } else {
            playButtonY = 445;
        }

        playButton = me.add.button(me.world.centerX - 45, playButtonY, 'playButton', me.startGame, me, 'btn-start-hover', 'btn-start-normal', 'btn-start-hover');
        playButton.onInputDown.add(this.playButtonDown, me);

        highScoreLabel = me.add.sprite(38, 23, 'highscoreLabel');

        high = localStorage.getItem('hopsop-high');
        if (high === null) {
            high = '0';
        }

        menuScore = me.add.bitmapText(138, 18, 'hopsopfont', high, 20);

        musicButton = me.add.button(me.world.width - 160, 20, 'musicButton', me.toggleMusic, me, null, null, null);

        if (isMusicAllowed()) {
            musicButton.frameName = 'btn-music-normal';
        } else {
            musicButton.frameName = 'btn-music-hover';
        }

    },

    playButtonDown: function () {
        if (isCordova && !isIos) {
            //audiotick2down.play();
        } else {
            //audiotick2down.play('', 0, 1, false);
        }
    },

    toggleMusic: function () {
        var me = this;

        var musicAllowed = toggleMusicAllowed();

        if (musicAllowed) {
            musicButton.frameName = 'btn-music-normal';
        } else {
            musicButton.frameName = 'btn-music-hover';
            stopMusic();
        }
    },

    update: function () {

        // Do some nice funky main menu effect here
        // console.log('mainmenu update');
    },

    shutdown: function () {
        titlepage.destroy();
        highScoreLabel.destroy();
        menuScore.destroy();

        playButton.destroy();
        musicButton.destroy();

        if (!isCordova) {
            //this.sound.remove('tick2down');
        } else {
            //audiotick2down.release();
        }
    },

    startGame: function (pointer) {

        //	Ok, the Play Button has been clicked or touched, so let's stop the music (otherwise it'll carry on playing)
        //this.music.stop();
        var me = this;
        //audiotick2up.play('', 0, 1, false);

        //	And start the actual game
        setTimeout(function () {
            me.state.start('Game');

        }, 200)

    }

};
