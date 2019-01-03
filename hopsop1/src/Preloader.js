BasicGame.Preloader = function (game) {

    this.background = null;
    this.preloadBar = null;

    this.ready = false;

};

BasicGame.Preloader.prototype = {

    preload: function () {
        var isCordova = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1,
            isIos = true;

        //	These are the assets we loaded in Boot.js
        this.background = this.add.sprite(this.world.centerX - 320, 0, 'preloaderBackground');
        var preloaderY = 0;
        if (this.world.height < 1000) {
            preloaderY = 390;
        } else {
            preloaderY = 480;
        }
        this.preloadBar = this.add.sprite(this.world.centerX - 175, preloaderY, 'preloaderBar');

        //	This sets the preloadBar sprite as a loader sprite.
        //	What that does is automatically crop the sprite from 0 to full-width
        //	as the files below are loaded in.
        this.load.setPreloadSprite(this.preloadBar);

        if (isCordova && !isIos) {

        } else {
            this.load.audio('music', ['audio/mp3/music.mp3']);

            if (parseInt(localStorage.getItem('hopsop-high'), 10) >= 100) {
                this.load.audio('musicremix', ['audio/mp3/music-remix.mp3']);
            }

            this.load.audio('death', ['audio/mp3/death.mp3']);
            this.load.audio('jumplanding', ['audio/mp3/jump-landing.mp3']);
            this.load.audio('jumplandingleaves', ['audio/mp3/jump-landing-leaves-2.mp3']);
            this.load.audio('jumplandingice', ['audio/mp3/jump-landing-ice.mp3']);
            this.load.audio('jumpup', ['audio/mp3/jump-up.mp3']);

            this.load.audio('acorndropped', ['audio/mp3/acorn-dropped.mp3']);
            this.load.audio('chainbroken', ['audio/mp3/chain-broken.mp3']);
            this.load.audio('squirrelIn', ['audio/mp3/squirrel-in.mp3']);
            this.load.audio('squirrelOut', ['audio/mp3/squirrel-out.mp3']);

            this.load.audio('pickupacorn1', ['audio/mp3/acorn1.mp3']);
            this.load.audio('pickupacorn2', ['audio/mp3/acorn2.mp3']);
            this.load.audio('pickupacorn3', ['audio/mp3/acorn3.mp3']);
            this.load.audio('pickupacorn4', ['audio/mp3/acorn4.mp3']);
            this.load.audio('pickupacorn5', ['audio/mp3/acorn5.mp3']);
            this.load.audio('pickupacorn6', ['audio/mp3/acorn6.mp3']);
            this.load.audio('pickupacorn7', ['audio/mp3/acorn7.mp3']);
            this.load.audio('pickupacorn8', ['audio/mp3/acorn8.mp3']);
            this.load.audio('pickupacorn9', ['audio/mp3/acorn9.mp3']);
            this.load.audio('pickupacorn10', ['audio/mp3/acorn10.mp3']);
            this.load.audio('pickupacorn11', ['audio/mp3/acorn11.mp3']);

            this.load.audio('tick2down', ['audio/mp3/tick-2-down.mp3']);
            this.load.audio('tick3', ['audio/mp3/tick-3.mp3']);
            this.load.audio('warpout', ['audio/mp3/warpout.mp3']);
            this.load.audio('warpin', ['audio/mp3/warpin.mp3']);
        }


        this.load.image('starIcon', 'images/icon-star.png');
        this.load.bitmapFont('hopsopfont', 'assets/font.png', 'assets/font.xml');

        this.load.image('titlepage', 'images/titlescreen-16-9.jpg');

        this.load.image('highscoreLabel', 'images/label-highscore.png');
        this.load.image('newHighScoreLabel', 'images/label-new-highscore.png');
        this.load.image('unlockedLabel', 'images/label-unlocked.png');
        this.load.image('unlockedLabel100', 'images/label-unlocked-100.png');

        this.load.image('gameOver', 'images/game-over.png');
        this.load.image('gameOver100', 'images/game-over-100.png');

        this.load.image('continueMenu', 'images/pause-menu.png');

        this.load.atlas('playButton', 'images/btn-start.png', 'assets/btn-start.json');
        this.load.atlas('closeButton', 'images/btn-close.png', 'assets/btn-close.json');
        this.load.atlas('musicButton', 'images/btn-music.png', 'assets/btn-music.json');
        this.load.atlas('toplistButton', 'images/btn-toplist.png', 'assets/btn-toplist.json');
        this.load.atlas('replayButton', 'images/btn-restart.png', 'assets/btn-restart.json');

        this.load.atlas('continueButton', 'images/btn-continue.png', 'assets/btn-continue.json');

        // Player assets

        this.load.image('player', 'images/player.png');
        this.load.atlas('playerfront', 'images/player_sprite.png', 'assets/player_sprite.json');
        this.load.atlas('playerfront2', 'images/player_sprite2.png', 'assets/player_sprite.json');
        this.load.atlas('playerfront3', 'images/player_sprite3.png', 'assets/player_sprite.json');
        this.load.atlas('playerfront4', 'images/player_sprite4.png', 'assets/player_sprite.json');
        this.load.atlas('playerfront5', 'images/player_sprite5.png', 'assets/player_sprite_wide.json');
        this.load.atlas('playerfront6', 'images/player_sprite6.png', 'assets/player_sprite.json');


        // Skin selection
        this.load.atlas('playerskins', 'images/char-selection.png', 'assets/player-skins.json');
        this.load.atlas('nextButton', 'images/btn-next.png', 'assets/btn-next.json');
        this.load.atlas('previousButton', 'images/btn-previous.png', 'assets/btn-previous.json');
        this.load.atlas('pickButton', 'images/btn-pick.png', 'assets/btn-pick.json');
        this.load.atlas('openSkinsButton', 'images/btn-open-skinmenu.png', 'assets/btn-open-skinmenu.json');

        this.load.image('pickButtonDisabled', 'images/btn-pick-disabled.png');
        this.load.image('emptyMenu', 'images/empty-menu.png');

        this.load.image('aim', 'images/aim.png');
        this.load.image('ray', 'images/ray.png');
        this.load.image('instructions', 'images/instructions-2.png');

        // World assets
        this.load.image('wallVertical', 'images/wall-vertical.png');
        this.load.image('ceiling', 'images/ceiling.png');

        this.load.image('bg1', 'images/bg-1.jpg');
        this.load.image('bg2', 'images/bg-2.jpg');
        this.load.image('bg3', 'images/bg-3.jpg');
        this.load.image('bg4', 'images/bg-4.jpg');
        this.load.image('bg5', 'images/bg-5.jpg');
        this.load.image('bg6', 'images/bg-6.jpg');
        this.load.image('bg7', 'images/bg-7.jpg');


        this.load.image('city1', 'images/floating-city-1.png');
        this.load.image('city2', 'images/floating-city-2.png');
        this.load.image('city3', 'images/floating-city-3.png');
        this.load.image('city4', 'images/floating-city-4.png');

        // Tree assets
        this.load.image('trunk', 'images/trunk.png');

        this.load.image('acorn1', 'images/acorn-1.png');
        this.load.image('acorn2', 'images/acorn-2.png');
        this.load.image('acorn3', 'images/acorn-3.png');
        this.load.image('acorn4', 'images/acorn-4.png');
        this.load.image('acornpile', 'images/acorn-pile.png');

        this.load.image('shelf1', 'images/shelf-1.png');
        this.load.image('shelf2', 'images/shelf-2.png');
        this.load.image('shelf3', 'images/shelf-3.png');
        this.load.image('shelf4', 'images/shelf-4.png');
        this.load.image('shelf5', 'images/shelf-5.png');

        this.load.image('start-ground', 'images/start-ground.png');
        this.load.image('start-ground2', 'images/start-ground2.png');

        this.load.image('citybig1', 'images/city-big-1.png');
        this.load.image('citybig2', 'images/city-big-2.png');
        this.load.image('citybig3', 'images/city-big-3.png');
        this.load.image('citybig4', 'images/city-big-4.png');
        this.load.image('citybig5', 'images/city-big-5.png');
        this.load.image('citybig6', 'images/city-big-6.png');
        this.load.image('citybig7', 'images/city-big-7.png');


        this.load.image('ice1', 'images/ice-1.png');
        this.load.image('ice2', 'images/ice-2.png');
        this.load.image('ice3', 'images/ice-3.png');

        this.load.image('portal', 'images/portal.png');
        this.load.image('portallight', 'images/portal-light.png');

        this.load.image('portalbig', 'images/portal-big.png');
        this.load.image('portallightbig', 'images/portal-light-big.png');
        this.load.image('portalball', 'images/portal-ball.png');

        this.load.atlas('squirrel', 'images/squirrel.png', 'assets/squirrel.json');

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
        //if (this.cache.isSoundDecoded('music') && this.ready == false)
        //{
        this.ready = true;
        this.state.start('MainMenu');
        //}

        // We don't have music so lets start anyway
        //this.state.start('MainMenu');

    }

};
