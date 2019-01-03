var playerSkin = 'HO';
var playerSkinId = 0;
var selectedSkinId = 0;
var playerSkinLevel = [20, 35, 50, 75, 100];

/* 
 HO,
 SP - sporbror, grip on ice
 HA - hattesnatte, magnetic
 MY - myxmop, time slowdown
 LA - lampsvamp, all abilities
 HO2 - Hopsop 2, all abilities + double jump
 */

var mySlowSpeed = 0.7;
var myGameSpeed = '';
var mySpeed = false;

var allowBack = true;
var showAds = false;

var bg;
var currentbg = 2;

var trunk;

var bgPaused = false;
var playerLastGravity = 0;
var playerLastVelX = 0;
var playerLastVelY = 0;

var heightClimbed = 0;
var groundCounter = 0;
var cityCounter = 0;

// game settings
var gamespeed = 1.8; //1.8
var maxspeed = 3;
var initialGamespeed = 1.8; //1.8;
var speeds = {
    HO: 1.5,
    SP: 1.7,
    HA: 1.7,
    MY: 1.8,
    LA: 2,
    HO2: 2.5
}
var gameAcceleration = 50;
var doubleJumpAllowed = false;
var jumpsUsed = 0;
var jumpsAllowed = 2;

var groundSpawnTime = 280;
var citySpawnTime = 1400;

// in-game flags
var isReadyToPlay = true;
var spawnLeft = false;
var aimSoundHasPlayed = false;
var gameIsPaused = false;

// aim settings
var aim;
var dragforce = 4;
var maxForce = -1300;

//player settings
var player;
var playerfront;
var playerIsFlying;
var playerIsTeleporting;
var playerIsAlive = false;
var playerGravityFlying = 1000;
var playerGravityStill = 50000;

//scoring
var gamesPlayed = 0;
var score = 0;
var acornsInRow = 0;
var spawnPile = false;
var firstBonusLevel = 5;
var secondBonusLevel = 10;
var squirrelLevelIncrementMin = 12;
var squirrelLevelIncrementMax = 16;
var squirrelLevel = Math.floor(Math.random() * (squirrelLevelIncrementMax - squirrelLevelIncrementMin + 1) + squirrelLevelIncrementMin);
var squirrelHasFired = false;
var squirrelReady = true;

var isCordova = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
var isIos = true;
//var isCordova = false;

BasicGame.Game = function (game) {
// nothing here
};

BasicGame.Game.prototype = {
    getAudioPath: function () {
        return '';
        var path = window.location.pathname;
        path = path.substr(0, path.length - 10);
        return 'file://' + path;
    },

    create: function () {

        var me = this;
        doubleJumpsUsed = 0;
        spawnPile = false;
        bgPaused = false;
        allowBack = false;
        squirrelHasFired = false;
        squirrelReady = true;
        squirrelLevel = Math.floor(Math.random() * (squirrelLevelIncrementMax - squirrelLevelIncrementMin + 1) + squirrelLevelIncrementMin);
        groundCounter = 0;
        cityCounter = 0;
        if (showAds) {
            hideAd();
            preloadAd();
        }

        gameIsPaused = false;

        // Start music

        if (isCordova && !isIos) {
            audiodeath = new Media(this.getAudioPath() + 'audio/mp3/death.mp3');
            audiojumpup = new Media(this.getAudioPath() + 'audio/mp3/jump-up.mp3');
            audiojumplanding = new Media(this.getAudioPath() + 'audio/mp3/jump-landing.mp3');
            audiojumplandingleaves = new Media(this.getAudioPath() + 'audio/mp3/jump-landing-leaves-2.mp3');
            audiojumplandingice = new Media(this.getAudioPath() + 'audio/mp3/jump-landing-ice.mp3');

            audiopickupacorn1 = new Media(this.getAudioPath() + 'audio/mp3/acorn1.mp3');
            audiopickupacorn2 = new Media(this.getAudioPath() + 'audio/mp3/acorn2.mp3');
            audiopickupacorn3 = new Media(this.getAudioPath() + 'audio/mp3/acorn3.mp3');
            audiopickupacorn4 = new Media(this.getAudioPath() + 'audio/mp3/acorn4.mp3');
            audiopickupacorn5 = new Media(this.getAudioPath() + 'audio/mp3/acorn5.mp3');
            audiopickupacorn6 = new Media(this.getAudioPath() + 'audio/mp3/acorn6.mp3');
            audiopickupacorn7 = new Media(this.getAudioPath() + 'audio/mp3/acorn7.mp3');
            audiopickupacorn8 = new Media(this.getAudioPath() + 'audio/mp3/acorn8.mp3');
            audiopickupacorn9 = new Media(this.getAudioPath() + 'audio/mp3/acorn9.mp3');
            audiopickupacorn10 = new Media(this.getAudioPath() + 'audio/mp3/acorn10.mp3');
            audiopickupacorn11 = new Media(this.getAudioPath() + 'audio/mp3/acorn11.mp3');

            audioacorndropped = new Media(this.getAudioPath() + 'audio/mp3/acorn-dropped.mp3');
            audiochainbroken = new Media(this.getAudioPath() + 'audio/mp3/chain-broken.mp3');
            audiosquirrelin = new Media(this.getAudioPath() + 'audio/mp3/squirrel-in.mp3');
            audiosquirrelout = new Media(this.getAudioPath() + 'audio/mp3/squirrel-out.mp3');

            audiotick2 = new Media(this.getAudioPath() + 'audio/mp3/tick-2-down.mp3');
            audiotick3 = new Media(this.getAudioPath() + 'audio/mp3/tick-3.mp3');
            audiowarpout = new Media(this.getAudioPath() + 'audio/mp3/warpout.mp3');
            audiowarpin = new Media(this.getAudioPath() + 'audio/mp3/warpin.mp3');
        } else {
            audiodeath = me.add.audio('death');
            audiojumpup = me.add.audio('jumpup');
            audiojumplanding = me.add.audio('jumplanding');
            audiojumplandingleaves = me.add.audio('jumplandingleaves');
            audiojumplandingice = me.add.audio('jumplandingice');

            audiopickupacorn1 = me.add.audio('pickupacorn1');
            audiopickupacorn2 = me.add.audio('pickupacorn2');
            audiopickupacorn3 = me.add.audio('pickupacorn3');
            audiopickupacorn4 = me.add.audio('pickupacorn4');
            audiopickupacorn5 = me.add.audio('pickupacorn5');
            audiopickupacorn6 = me.add.audio('pickupacorn6');
            audiopickupacorn7 = me.add.audio('pickupacorn7');
            audiopickupacorn8 = me.add.audio('pickupacorn8');
            audiopickupacorn9 = me.add.audio('pickupacorn9');
            audiopickupacorn10 = me.add.audio('pickupacorn10');
            audiopickupacorn11 = me.add.audio('pickupacorn11');

            audioacorndropped = me.add.audio('acorndropped');
            audiochainbroken = me.add.audio('chainbroken');
            audiosquirrelin = me.add.audio('squirrelIn');
            audiosquirrelout = me.add.audio('squirrelOut');

            audiotick2 = me.add.audio('tick2down');
            audiotick3 = me.add.audio('tick3');
            audiowarpout = me.add.audio('warpout');
            audiowarpin = me.add.audio('warpin');

        }

        startMusic(localStorage.getItem('hopsop-skin') === '5', me);

        // Init physics system
        me.game.physics.startSystem(Phaser.Physics.ARCADE);
        me.game.physics.arcade.gravity.y = 200;

        // BG ***********************************************************************************
        var bgNbr;
        bgNbr = Math.ceil(Math.random() * 6);
        while (bgNbr === currentbg) {
            bgNbr = Math.ceil(Math.random() * 6);
        }
        currentbg = bgNbr;
        bg = me.add.sprite(0, 0, 'bg' + bgNbr);

        // CITIES ***********************************************************************************
        cities = me.add.group();

        cityBig = me.add.sprite(this.world.centerX, 500, 'citybig' + bgNbr);
        cityBig.anchor.setTo(0.5, 0.5);

        trunk1 = me.add.sprite(this.world.centerX - 240, 0, 'trunk');
        trunk2 = me.add.sprite(this.world.centerX - 240, -3000, 'trunk');

        // WALLS ***********************************************************************************

        sides = me.add.group();

        wallLeft = me.add.sprite(0, -1000, 'wallVertical');
        me.physics.enable(wallLeft, Phaser.Physics.ARCADE);
        wallLeft.body.immovable = true;
        wallLeft.body.allowGravity = false;

        wallRight = me.add.sprite(me.world.width, -1000, 'wallVertical');
        me.physics.enable(wallRight, Phaser.Physics.ARCADE);
        wallRight.body.immovable = true;
        wallRight.body.allowGravity = false;

        sides.add(wallLeft);
        sides.add(wallRight);

        // SHELVES ***********************************************************************************
        shelves = me.add.group();
        ices = me.add.group();
        portals = me.add.group();
        portallights = me.add.group();

        shelf1 = me.add.sprite(this.world.centerX, 950, 'start-ground');
        shelf1.anchor.setTo(0.5, 0.5);
        me.physics.enable(shelf1, Phaser.Physics.ARCADE);
        shelf1.body.immovable = true;
        shelf1.body.allowGravity = false;

        shelf2 = me.add.sprite(300, 300, 'shelf2');
        shelf2.anchor.setTo(0.5, 0.5);
        me.physics.enable(shelf2, Phaser.Physics.ARCADE);
        shelf2.body.immovable = true;
        shelf2.body.allowGravity = false;

        shelf3 = me.add.sprite(this.world.centerX + 100, 30, 'shelf1');
        shelf3.anchor.setTo(0.5, 0.5);
        me.physics.enable(shelf3, Phaser.Physics.ARCADE);
        shelf3.body.immovable = true;
        shelf3.body.allowGravity = false;

        // Add them to group
        shelves.add(shelf1);
        shelves.add(shelf2);
        shelves.add(shelf3);

        // Disable collision detection from sides and under, so player can jump "through" them
        shelves.forEach(function (shelf) {
            shelf.body.checkCollision.down = false;
            shelf.body.checkCollision.left = false;
            shelf.body.checkCollision.right = false;
        });

        // ACORNS ***********************************************************************************
        acorns = me.add.group();

        // SQUIRREL *******************************************************************************
        squirrel = me.add.sprite(this.world.width + 300, 150, 'squirrel');
        squirrel.anchor.setTo(0.5, 0.5);
        me.physics.enable(squirrel, Phaser.Physics.ARCADE);
        squirrel.body.immovable = true;
        squirrel.body.allowGravity = false;

        bigPortal = me.add.sprite(this.world.centerX, 1600, 'portalbig');
        bigPortal.anchor.setTo(0.5, 0.5);
        me.physics.enable(bigPortal, Phaser.Physics.ARCADE);
        bigPortal.body.immovable = true;
        bigPortal.body.allowGravity = false;

        bigPortalLight = me.add.sprite(this.world.centerX, this.world.height - 170, 'portallightbig');
        bigPortalLight.anchor.setTo(0.5, 0.5);
        me.physics.enable(bigPortalLight, Phaser.Physics.ARCADE);
        bigPortalLight.body.immovable = true;
        bigPortalLight.body.allowGravity = false;
        bigPortalLight.visible = false;

        portalball = me.add.sprite(this.world.centerX, this.world.height + 200, 'portalball');
        portalball.anchor.setTo(0.5, 0.5);

        portalballDrop = this.add.tween(portalball).to({y: this.world.height + 100}, 800);
        portalballDrop.onComplete.add(function () {
            bigPortalEnter.start();
        });


        bigPortalEnter = this.add.tween(bigPortal).to({y: this.world.height - 70}, 500);
        bigPortalEnter.onComplete.add(function () {
            bigPortalLight.visible = true;
        });

        // OPEN SKIN MENU *************************************************************************
        openSkinsButton = me.add.button(125, this.world.height - 250, 'openSkinsButton', me.openSkinsMenu, me, 'btn-skinmenu-normal', 'btn-skinmenu-normal', 'btn-skinmenu-hover', 'btn-skinmenu-normal');

        openSkinsButton.onInputDown.add(me.buttonDown, me);

        // RAY ***********************************************************************************
        ray = me.add.sprite(0, 0, 'ray');
        ray.anchor.setTo(0, 0.5);
        ray.alpha = 0;

        // PLAYER ***********************************************************************************
        player = me.add.sprite(me.world.centerX, 590, 'player');
        player.anchor.setTo(0.5, 0.5);

        playerfront = me.add.sprite(me.world.centerX, 500, 'playerfront', 'player0000');
        playerfront.anchor.setTo(0.5, 1.05);
        playerfront.animations.add('warpout', Phaser.Animation.generateFrameNames('warp', 0, 20, '', 4), 48, false);
        playerfront.animations.add('warpin', Phaser.Animation.generateFrameNames('warp', 21, 30, '', 4), 48, false);

        playerfront.events.onAnimationComplete.add(function (sprite, animation) {
            if (animation.name === 'warpin') {
                playerIsTeleporting = false;
            }
        }, this);


        me.physics.enable(player, Phaser.Physics.ARCADE);
        player.body.collideWorldBounds = false;
        player.body.gravity.y = 1000;
        player.body.bounce.set(0.5);

        // AIM ***********************************************************************************
        aim = me.add.sprite(me.world.centerX, 500, 'aim');
        aim.anchor.setTo(0.5, 0.5);
        aim.inputEnabled = true;
        aim.input.enableDrag();
        me.physics.enable(aim, Phaser.Physics.ARCADE);

        aim.body.allowGravity = false;
        aim.body.immovable = true;

        aim.events.onDragStart.add(me.onDragStart, me);
        aim.events.onDragStop.add(me.onDragStop, me);

        aim.alpha = 0;

        // TEXT ***********************************************************************************

        score = 0;
        scoreText = me.add.bitmapText(me.world.centerX - 20, 10, 'hopsopfont', '0', 64);

        starIcon = me.add.sprite(me.world.centerX - 50, 50, 'starIcon');
        starIcon.visible = false;
        // GAME OVER MENU *************************************************************************
        gameOverMenu = me.add.group();

        var gameOverScreenTop = me.world.centerY - 794 / 2 - 100; //25 is for ad banner

        var gameOver = me.add.sprite(me.world.centerX - 479 / 2, gameOverScreenTop, 'gameOver'),
            gameOver100 = me.add.sprite(me.world.centerX - 479 / 2, gameOverScreenTop, 'gameOver100'),
            finalScoreText = me.add.bitmapText(me.world.centerX - 170, gameOverScreenTop + 290, 'hopsopfont', '0', 64),
            newHighScoreLabel = me.add.sprite(me.world.centerX + gameOver.width / 2 - 164 - 78, gameOverScreenTop + 335, 'newHighScoreLabel'),
            highScoreText = me.add.bitmapText(me.world.centerX - 165, gameOverScreenTop + 440, 'hopsopfont', '0', 36),
            replayButton = me.add.button(me.world.centerX - 325 / 2, gameOverScreenTop + 630, 'replayButton', me.restartGame, me, 'btn-start-normal', 'btn-start-normal', 'btn-start-hover', 'btn-start-normal'),
            closeButton = me.add.button(me.world.centerX + 170, gameOverScreenTop + 30, 'closeButton', me.openMenu, me, 'btn-close-hover', 'btn-close-normal', 'btn-close-hover', 'btn-close-normal');
            unlockedLabel = me.add.sprite(me.world.centerX - gameOver.width / 2 + 78, gameOverScreenTop + 225, 'unlockedLabel'),
            unlockedLabel100 = me.add.sprite(me.world.centerX - gameOver.width / 2 + 78, gameOverScreenTop + 225, 'unlockedLabel100');
            //toplistButton = me.add.button(me.world.centerX - 325 / 2, gameOverScreenTop + 530, 'toplistButton', me.showToplist, me, 'btn-toplist-normal', 'btn-toplist-normal', 'btn-toplist-hover', 'btn-toplist-normal');


        replayButton.onInputDown.add(me.buttonDown, me);
        closeButton.onInputDown.add(me.buttonDown, me);
        //toplistButton.onInputDown.add(me.buttonDown, me);

        newHighScoreLabel.visible = false;
        unlockedLabel.visible = false;
        unlockedLabel100.visible = false;
        gameOver100.visible = false;

        gameOverMenu.add(gameOver);
        gameOverMenu.add(gameOver100);
        gameOverMenu.add(finalScoreText);
        gameOverMenu.add(highScoreText);
        gameOverMenu.add(newHighScoreLabel);
        gameOverMenu.add(replayButton);
        gameOverMenu.add(closeButton);
        gameOverMenu.add(unlockedLabel);
        gameOverMenu.add(unlockedLabel100);
        //gameOverMenu.add(toplistButton);

        gameOverMenu.visible = false;

        // CONTINUE MENU *******************************************************************************
        continueMenu = me.add.group();
        var continueScreenTop = me.world.centerY - 343 / 2 - 25, //25 is for ad banner
            continueBg = me.add.sprite(me.world.centerX - 479 / 2, continueScreenTop, 'continueMenu'),
            continueButton = me.add.button(me.world.centerX - 325 / 2, continueScreenTop + 140, 'continueButton', me.bgUnPause, me, 'btn-start-normal', 'btn-start-normal', 'btn-start-hover', 'btn-start-normal');

        continueButton.onInputDown.add(me.buttonDown, me);

        continueMenu.add(continueBg);
        continueMenu.add(continueButton);

        continueMenu.visible = false;

        // INSTRUCTIONS ***********************************************************************************
        instructions = me.add.sprite(me.world.width / 2 - 199, me.world.height - 360, 'instructions');

        // SKIN MENU ***********************************************************************************
        playerSkinMenu = me.add.group();
        var playerSkinsTop = me.world.centerY - 794 / 2 - 0; //25 for same y as game over menu

        var playerSkinMenuBg = me.add.sprite(me.world.centerX - 479 / 2, playerSkinsTop, 'emptyMenu'),
            playerSkins = me.add.sprite(me.world.centerX - 340 / 2, playerSkinsTop + 20, 'playerskins'),
            pickButton = me.add.button(me.world.centerX - 325 / 2, gameOverScreenTop + 700, 'pickButton', me.changeSkin, me, 'btn-pick-normal', 'btn-pick-normal', 'btn-pick-hover', 'btn-pick-normal'),
            pickButtonDisabled = me.add.sprite(me.world.centerX - 325 / 2, gameOverScreenTop + 710, 'pickButtonDisabled'),
            previousButton = me.add.button(me.world.centerX - 479 / 2 + 30, gameOverScreenTop + 280, 'previousButton', me.previousSkin, me, 'btn-previous-normal', 'btn-previous-normal', 'btn-previous-hover', 'btn-previous-normal'),
            nextButton = me.add.button(me.world.centerX + 479 / 2 - 90, gameOverScreenTop + 280, 'nextButton', me.nextSkin, me, 'btn-next-normal', 'btn-next-normal', 'btn-next-hover', 'btn-next-normal');
        closeSkinsButton = me.add.button(me.world.centerX + 170, playerSkinsTop + 30, 'closeButton', me.closeSkinsButton, me, 'btn-close-hover', 'btn-close-normal', 'btn-close-hover', 'btn-close-normal');

        pickButtonDisabled.visible = false;

        pickButton.onInputDown.add(me.buttonDown, me);
        previousButton.onInputDown.add(me.buttonDown, me);
        nextButton.onInputDown.add(me.buttonDown, me);
        closeSkinsButton.onInputDown.add(me.buttonDown, me);

        playerSkinMenu.add(playerSkinMenuBg);
        playerSkinMenu.add(playerSkins);
        playerSkinMenu.add(pickButton);
        playerSkinMenu.add(pickButtonDisabled);
        playerSkinMenu.add(previousButton);
        playerSkinMenu.add(nextButton);
        playerSkinMenu.add(closeSkinsButton);

        if (localStorage.getItem('hopsop-skin') === null || localStorage.getItem('hopsop-skin') === '' || localStorage.getItem('hopsop-skin') === '0') {
            this.showSkin(1);
            selectedSkinId = 0;
            this.changeSkin();
        } else {
            this.showSkin(parseInt(localStorage.getItem('hopsop-skin'), 10) + 1);
            selectedSkinId = parseInt(localStorage.getItem('hopsop-skin'), 10);
            this.changeSkin();
        }
    },

    showToplist: function () {
        //googleShowToplist();
    },

    openSkinsMenu: function () {
        playerSkinMenu.visible = true;
    },

    closeSkinsButton: function () {
        playerSkinMenu.visible = false;
    },

    nextSkin: function () {
        selectedSkinId++;
        if (selectedSkinId === 6) {
            selectedSkinId = 0;
        }
        switch (selectedSkinId) {
            case 0:
                this.showSkin(1);
                break;
            case 1:
                this.showSkin(2);
                break;
            case 2:
                this.showSkin(3);
                break;
            case 3:
                this.showSkin(4);
                break;
            case 4:
                this.showSkin(5);
                break;
            case 5:
                this.showSkin(6);
                break;
        }
    },
    previousSkin: function () {
        selectedSkinId--;
        if (selectedSkinId === -1) {
            selectedSkinId = 5;
        }
        switch (selectedSkinId) {
            case 0:
                this.showSkin(1);
                break;
            case 1:
                this.showSkin(2);
                break;
            case 2:
                this.showSkin(3);
                break;
            case 3:
                this.showSkin(4);
                break;
            case 4:
                this.showSkin(5);
                break;
            case 5:
                this.showSkin(6);
                break;
        }
    },

    showSkin: function (id) {

        if (id === null || id === 1) {
            playerSkinMenu.getChildAt(1).frameName = 'skin1';
            playerSkinMenu.getChildAt(2).visible = true;
            playerSkinMenu.getChildAt(3).visible = false;
        } else {

            id = parseInt(id, 10);

            if (parseInt(localStorage.getItem('hopsop-high'), 10) >= playerSkinLevel[(id - 2)]) {
                playerSkinMenu.getChildAt(1).frameName = 'skin' + id;
                playerSkinMenu.getChildAt(2).visible = true;
                playerSkinMenu.getChildAt(3).visible = false;
            } else {
                playerSkinMenu.getChildAt(1).frameName = 'skin' + (id) + 'locked';
                playerSkinMenu.getChildAt(2).visible = false;
                playerSkinMenu.getChildAt(3).visible = true;
            }
        }
    },

    changeSkin: function () {
        var origSkin = localStorage.getItem('hopsop-skin'),
            me = this;
        playerSkinId = selectedSkinId;

        if (playerSkinId !== 5 && playerSkin === 'HO2') {
            var bgNbr = Math.ceil(Math.random() * 5);
            bg.loadTexture('bg' + bgNbr);
            cityBig.loadTexture('citybig' + bgNbr);
            shelves.children[0].loadTexture('start-ground');
        }

        switch (playerSkinId) {
            case 0:
                playerSkin = 'HO';
                initialGamespeed = speeds.HO;
                localStorage.setItem('hopsop-skin', playerSkinId);
                playerfront.loadTexture('playerfront');
                break;
            case 1:
                playerSkin = 'SP';
                initialGamespeed = speeds.SP;
                localStorage.setItem('hopsop-skin', playerSkinId);
                playerfront.loadTexture('playerfront3');
                break;
            case 2:
                playerSkin = 'HA';
                initialGamespeed = speeds.HA;
                localStorage.setItem('hopsop-skin', playerSkinId);
                playerfront.loadTexture('playerfront2');
                break;
            case 3:
                playerSkin = 'MY';
                initialGamespeed = speeds.MY;
                localStorage.setItem('hopsop-skin', playerSkinId);
                playerfront.loadTexture('playerfront4');
                break;
            case 4:
                playerSkin = 'LA';
                initialGamespeed = speeds.LA;
                localStorage.setItem('hopsop-skin', playerSkinId);
                playerfront.loadTexture('playerfront5');
                break;
            case 5:
                playerSkin = 'HO2';
                initialGamespeed = speeds.HO2;
                localStorage.setItem('hopsop-skin', playerSkinId);
                playerfront.loadTexture('playerfront6');
                bg.loadTexture('bg7');
                cityBig.loadTexture('citybig7');
                shelves.children[0].loadTexture('start-ground2');
                break;
        }

        oldSkin = parseInt(origSkin, 10);
        newSkin = parseInt(playerSkinId, 10);

        if ((oldSkin === 5 && newSkin !== 5) || (oldSkin !== 5 && newSkin === 5)) {
            stopMusic();
            startMusic(localStorage.getItem('hopsop-skin') === '5', me);
        }


        playerSkinMenu.visible = false;

    },

    bgPause: function (game) {
        var me = this;
        pauseMusic();
        if (playerIsAlive) {
            bgPaused = true;
            playerLastGravity = player.body.gravity.y;
            playerLastVelX = player.body.velocity.x;
            playerLastVelY = player.body.velocity.y;
            player.body.gravity.y = 0;
            player.body.velocity.x = 0;
            player.body.velocity.y = 0;
            game.physics.arcade.gravity.y = 0;
        }
    },

    bgResume: function (game) {
        if (bgPaused) {
            continueMenu.visible = true;
        } else {
            resumeMusic();
        }
    },

    bgUnPause: function () {
        resumeMusic();
        continueMenu.visible = false;
        bgPaused = false;
        player.body.gravity.y = playerLastGravity;
        player.body.velocity.x = playerLastVelX;
        player.body.velocity.y = playerLastVelY;
        this.game.physics.arcade.gravity.y = 200;
    },

    buttonDown: function () {
        if (isCordova && !isIos) {
            audiotick2.play();
        } else {
            audiotick2.play('', 0, 1, false);
        }
    },

    spawnGround: function () {

        var me = this;
        if (playerIsAlive) {
            var y = -50
            var x = Math.floor((Math.random() * me.world.width - 100) + 100);

            var rnd = Math.ceil(Math.random() * 100);
            if (rnd > 70) {
                var shelf = new Shelf(me.game, x, y, true, shelves);
                me.spawnAcorn(x, y);
                shelves.add(shelf);
            } else if (rnd <= 70 && rnd > 50) {
                var ice = new Ice(me.game, x, y, true, ices);
                me.spawnAcorn(x, y - 20);
                ices.add(ice);
            } else {
                if (portals.children.length === 0) { // If there are no portals in play
                    var portal = new Portal(me.game, x, y, true, portals);
                    me.spawnPortallight(x, y);
                    portals.add(portal);
                } else {
                    var shelf = new Shelf(me.game, x, y, true, shelves);
                    me.spawnAcorn(x, y);
                    shelves.add(shelf);
                }
            }


        }
    },

    spawnAcorn: function (x, y) {
        var me = this;
        if (playerIsAlive) {

            var acorn = new Acorn(me.game, x, y, true, acorns);
            acorns.add(acorn);
        }
    },

    spawnPortallight: function (x, y) {
        var me = this;
        if (playerIsAlive) {

            var portallight = new Portallight(me.game, x, y - 14, true, portallights);
            portallights.add(portallight);
        }
    },

    spawnCity: function () {
        var me = this;
        if (playerIsAlive) {

            var y = -300
            var x = 0;

            //var isLower = (Math.random() * 3) < 2;
            if (spawnLeft) {
                x = Math.floor((Math.random() * 120) + 1);
            } else {
                x = Math.floor((Math.random() * 120) + me.world.width - 120);
            }

            spawnLeft = !spawnLeft;

            var fc = new FloatingCity(me.game, x, y, true, cities);

            cities.add(fc);
        }
    },

    update: function () {
        var me = this;

        if (!mySpeed) {
            gamespeed = initialGamespeed * (1 + score / gameAcceleration);
        }
        playerfront.x = player.x;
        playerfront.y = player.y + (playerfront.height / 2);
        if (!gameIsPaused && !bgPaused) {
            // Collision detect

            // Ground
            me.physics.arcade.collide(shelves, player, me.collisionHandler, null, me);

            // Ice
            me.physics.arcade.collide(ices, player, me.iceCollisionHandler, null, me);

            // Portals
            me.physics.arcade.collide(portals, player, me.portalCollisionHandler, null, me);

            // Acorns
            me.physics.arcade.overlap(acorns, player, me.acornCollisionHandler, null, me);

            // Walls
            me.physics.arcade.collide(sides, player, me.sideCollider, null, me);

            if (squirrelHasFired) {
                // Squirrel
                me.physics.arcade.overlap(squirrel, player, me.squirrelCollisionHandler, null, me);
            }
            // Big portal
            if (bigPortal.y < 1500) {
                me.physics.arcade.collide(bigPortal, player, me.portalCollisionHandler, null, me);
            }

            // Aiming player
            if (!playerIsTeleporting && (!playerIsFlying || playerSkin === 'HO2') && jumpsUsed < jumpsAllowed) {
                me.handleAim();
            }

            if (playerIsAlive) {

                heightClimbed++;
                cityCounter += gamespeed;
                groundCounter += gamespeed;

                if (groundCounter > groundSpawnTime) {
                    groundCounter = 0;
                    me.spawnGround();
                }

                if (cityCounter > citySpawnTime) {
                    cityCounter = 0;
                    me.spawnCity();
                }

                trunk1.y += gamespeed;
                trunk2.y += gamespeed;
                cityBig.y += gamespeed * 0.88;

                if (cityBig.y > 1500) {
                    cityBig.destroy();
                }

                if (trunk1.y > 2000) {
                    trunk1.y = trunk2.y - 2900;
                }
                if (trunk2.y > 2000) {
                    trunk2.y = trunk1.y - 2900;
                }

                me.updateShelves();
                me.updatePortals();
                me.updateIces();
                me.updateAcorns();
                me.updateCities();
                me.updateSquirrel();

                if (player.body.y > this.world.height + 170) {
                    me.deathHandler();
                }
            }

            if (player.body) {
                if (player.body.velocity.y !== 0) {
                    player.body.gravity.y = playerGravityFlying;
                } else {
                    player.body.gravity.y = playerGravityStill;
                }
            }

        }

    },

    handleAim: function () {
        var me = this;

        // Reset aim
        if (!aim.input.isDragged) {
            aimSoundHasPlayed = false;
            if (!playerIsFlying && !playerIsTeleporting) {
                playerfront.frameName = 'player0000';
            }

            ray.alpha = 0;
            aim.alpha = 0;

            aim.x = player.x;
            aim.y = player.y;


        } else if (aim.input.isDragged && (!playerIsFlying || doubleJumpAllowed || playerSkin === 'HO2') && playerSkinMenu.visible !== true && !playerIsTeleporting) {
            // AIM IS BEING DRAGGED
            // Flag this if already clicked
            if (!aimSoundHasPlayed) {
                aimSoundHasPlayed = true;

                if (isCordova && !isIos) {
                    audiotick3.play();
                } else {
                    audiotick3.play('', 0, 1, false);
                }

            }

            var distance = me.physics.arcade.distanceBetween(player, aim);
            var rotation = me.physics.arcade.angleToXY(aim, player.x, (player.y + player.height / 2));

            // ROTATE PLAYER
            degrees = rotation * (180 / Math.PI) + 90;
            if (degrees > -55 && degrees < 55) {
                playertween = me.add.tween(playerfront).to({angle: degrees}, 70).start();
            }

            // ANIMATE PLAYER
            if (distance > 120 && distance < 138) {
                playerfront.frameName = 'player0001';

            }
            else if (distance > 137 && distance < 155) {
                playerfront.frameName = 'player0002';

            }
            else if (distance > 154 && distance < 172) {
                playerfront.frameName = 'player0003';

            }
            else if (distance > 171 && distance < 189) {
                playerfront.frameName = 'player0004';

            }
            else if (distance > 188 && distance < 206) {
                playerfront.frameName = 'player0005';

            }
            else if (distance > 205 && distance < 223) {
                playerfront.frameName = 'player0006';

            }
            else if (distance > 222 && distance < 240) {
                playerfront.frameName = 'player0007';

            }
            else if (distance > 239 && distance < 257) {
                playerfront.frameName = 'player0008';

            }
            else if (distance > 256 && distance < 274) {
                playerfront.frameName = 'player0009';
            }
            else if (distance > 273 && distance < 291) {
                playerfront.frameName = 'player0010';
            }
            else if (distance > 290) {
                playerfront.frameName = 'player0011';

            } else {
                playerfront.frameName = 'player0000';
            }

            aim.alpha = 0.7;

            // RAY ROTATION AND LENGTH
            ray.alpha = 0.3;
            ray.x = aim.x;
            ray.y = aim.y;
            ray.rotation = rotation;
            ray.width = distance;

        }
    },

    updateShelves: function () {
        var me = this;
        shelves.forEach(function (shelf) {
            if (shelf) {
                shelf.body.y += gamespeed;
                if (shelf.body.y > this.world.height + 200) {
                    shelves.remove(shelf);
                    shelf.destroy();
                }
            }

        }, me);
    },

    updateIces: function () {
        var me = this;
        ices.forEach(function (ice) {
            if (ice) {
                ice.body.y += gamespeed;
                if (ice.body.y > this.world.height + 200) {
                    ices.remove(ice);
                    ice.destroy();
                }
            }

        }, me);
    },

    updatePortals: function () {
        var me = this;
        portals.forEach(function (portal) {
            if (portal) {
                portal.body.y += gamespeed;
                if (portal.body.y > this.world.height + 300) {
                    portals.remove(portal);
                    portal.destroy();
                }
            }
        }, me);
        portallights.forEach(function (portallight) {
            if (portallight) {
                portallight.body.y += gamespeed;
                if (portallight.body.y > this.world.height + 300) {
                    portallights.remove(portallight);
                    portallight.destroy();
                }
            }
        }, me);
    },

    updateAcorns: function () {
        var me = this;
        acorns.forEach(function (acorn) {
            if (acorn) {
                acorn.body.y += gamespeed;
                if (acorn.body.y > this.world.height + 0) {
                    if (acornsInRow > 1) {
                        if (isCordova && !isIos) {
                            audiochainbroken.play();
                        } else {
                            audiochainbroken.play('', 0, 1, false);
                        }


                    } else {
                        if (isCordova && !isIos) {
                            audioacorndropped.play();
                        } else {
                            audioacorndropped.play('', 0, 1, false);
                        }


                    }

                    acornsInRow = 0;
                    starIcon.visible = false;
                    acorns.remove(acorn);
                    acorn.destroy();

                }
            }

        }, me);
    },


    updateCities: function () {
        var me = this;
        cities.forEach(function (city) {
            if (city) {
                city.body.y += gamespeed / 2;
                if (city.body.y > this.world.height + 200) {
                    cities.remove(city);
                    city.destroy();
                }
            }

        }, me);
    },

    updateSquirrel: function () {
        if (!squirrel.hasCollided) {
            portalball.x = squirrel.x - 20;
            portalball.y = squirrel.y;
        }
        var me = this;
        if (score >= squirrelLevel) {
            if (squirrelReady) {
                squirrelReady = false;
                setTimeout(function () {
                    if (!squirrelHasFired) {
                        squirrelHasFired = true;
                        if (isCordova && !isIos) {
                            audiosquirrelin.play();
                        } else {
                            audiosquirrelin.play('', 0, 1, false);
                        }
                    }
                }, 1000)
            }

        }

        if (squirrelHasFired === true) {
            squirrel.x -= gamespeed * 3;
        }

        if (squirrel.x < -300) {
            squirrel.x = 1000;
            squirrelHasFired = false;
            if (!squirrel.hasCollided) {
                squirrelLevel = squirrelLevel + Math.floor(Math.random() * (squirrelLevelIncrementMax - squirrelLevelIncrementMin + 1) + squirrelLevelIncrementMin);
            } else {
                squirrelLevel = 1000000;
            }
            squirrelReady = true;
            squirrel.frameName = 'squirrel-normal';
            squirrel.hasCollided = false;

        }
    },

    squirrelCollisionHandler: function (obj1, obj2) {
        if (!squirrel.hasCollided) {
            if (isCordova && !isIos) {
                audiosquirrelout.play();
            } else {
                audiosquirrelout.play('', 0, 1, false);
            }
            squirrel.frameName = 'squirrel-trans';
            squirrel.hasCollided = true;
            portalballDrop.start();
        }

    },


    iceCollisionHandler: function (obj1, obj2) {
        // collision player and ice
        //player.body.gravity.y = 10000;

        if (playerSkin === 'SP' || playerSkin === 'LA' || playerSkin === 'HO2') {
            // Sporbror has good grip on ice!
            player.body.velocity.x = 0;
        }

        player.body.velocity.y = 0;

        if (playerIsFlying) {

            // PLAYER IS LANDING, LETS RESET ROTATION
            playerIsFlying = false;
            jumpsUsed = 0;

            if (isCordova && !isIos) {
                audiojumplandingice.play();
            } else {
                audiojumplandingice.play('');
            }


            playerfront.frameName = 'player0000';
            this.add.tween(playerfront).to({angle: 0}, 50).start();

        }

        if (playerSkin === 'HA' || playerSkin === 'LA' || playerSkin === 'HO2') {
            acorns.children.forEach(
                function (acorn) {
                    playery = player.body.y + 120
                    if (acorn.y < playery + 40 && acorn.y > playery - 40) {
                        if (acorn.x > player.body.x) {
                            acorn.x -= 1;
                        } else {
                            acorn.x += 1;
                        }
                    }
                }
            );
        }
    },

    collisionHandler: function (obj1, obj2) {
        // collision player and ground
        //player.body.gravity.y = 10000;

        player.body.velocity.x = 0;
        player.body.velocity.y = 0;

        if (playerIsFlying) {

            // PLAYER IS LANDING, LETS RESET ROTATION
            playerIsFlying = false;
            jumpsUsed = 0;

            if (isCordova && !isIos) {
                audiojumplandingleaves.play();
            } else {
                audiojumplandingleaves.play('');
            }

            playerfront.frameName = 'player0000';
            this.add.tween(playerfront).to({angle: 0}, 50).start();

        }

        if (playerSkin === 'HA' || playerSkin === 'LA' || playerSkin === 'HO2') {
            acorns.children.forEach(
                function (acorn) {
                    playery = player.body.y + 120
                    if (acorn.y < playery + 40 && acorn.y > playery - 40) {
                        if (acorn.x > player.body.x) {
                            acorn.x -= 1;
                        } else {
                            acorn.x += 1;
                        }
                    }
                }
            );
        }

    },

    portalCollisionHandler: function (obj1, obj2) {

        var me = this;
        // collision player and portal
        //player.body.gravity.y = 10000;
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;

        var newX = this.world.width / 2,
            newY = 0,
            highestShelfX,
            highestShelfY = this.world.height,
            highestIceX,
            highestIceY = this.world.height;

        if (!playerIsTeleporting) {
            playerIsTeleporting = true;

            // PLAYER IS LANDING, LETS RESET ROTATION
            playerIsFlying = false;
            jumpsUsed = 0;

            if (isCordova && !isIos) {
                audiojumplandingleaves.play();
            } else {
                audiojumplandingleaves.play('');
            }

            if (playerIsAlive) {
                this.add.tween(playerfront).to({angle: 0}, 50).start();
                if (isCordova && !isIos) {
                    audiowarpout.play();
                } else {
                    audiowarpout.play('', 0, 1, false);
                }


                playerfront.animations.play('warpout', false);


                if (shelves.children.length > 0) {
                    highestShelfX = shelves.children[shelves.children.length - 1].x;
                    highestShelfY = shelves.children[shelves.children.length - 1].y;
                }
                if (ices.children.length > 0) {
                    highestIceX = ices.children[ices.children.length - 1].x;
                    highestIceY = ices.children[ices.children.length - 1].y;
                }

                if (highestIceY < highestShelfY) {
                    newY = highestIceY;
                    newX = highestIceX;
                } else {
                    newY = highestShelfY;
                    newX = highestShelfX;
                }

                if (newX > this.world.width - 40) {
                    newX = this.world.width - 40;
                }

                if (newX < 40) {
                    newX = 40;
                }

                setTimeout(function () {
                    player.y = newY - 150;
                    player.x = newX;

                    if (isCordova && !isIos) {
                        audiowarpin.play();
                    } else {
                        audiowarpin.play('', 0, 1, false);
                    }
                    playerfront.animations.play('warpin', false);
                    if (obj1.key === 'portalbig') {
                        bigPortalLight.visible = false;
                        squirrelLevel = score + Math.floor(Math.random() * (squirrelLevelIncrementMax - squirrelLevelIncrementMin + 1) + squirrelLevelIncrementMin);
                        me.add.tween(obj1).to({y: 1600}, 800).start();
                    }
                }, 500, this);
            }


        }
    },

    sideCollider: function (obj1, obj2) {
        if (isCordova && !isIos) {
            audiojumplanding.play();
        } else {
            audiojumplanding.play('');
        }

    },

    acornCollisionHandler: function (obj1, obj2) {
        if (obj2.key === 'acorn4') {
            score += 2;
        }
        else if (obj2.key === 'acornpile') {
            score += 3;
        } else {
            score++;

        }
        acornsInRow++;
        if (acornsInRow > 1) {
            starIcon.visible = true;
        }
        if (acornsInRow === firstBonusLevel) {
            spawnPile = true;
        }

        switch (acornsInRow) {
            case 1:
                if (isCordova && !isIos) {
                    audiopickupacorn1.play();
                } else {
                    audiopickupacorn1.play('');
                }
                break;
            case 2:
                if (isCordova && !isIos) {
                    audiopickupacorn2.play();
                } else {
                    audiopickupacorn2.play('');
                }
                break;
            case 3:
                if (isCordova && !isIos) {
                    audiopickupacorn3.play();
                } else {
                    audiopickupacorn3.play('');
                }
                break;
            case 4:
                if (isCordova && !isIos) {
                    audiopickupacorn4.play();
                } else {
                    audiopickupacorn4.play('');
                }
                break;
            case 5:
                if (isCordova && !isIos) {
                    audiopickupacorn5.play();
                } else {
                    audiopickupacorn5.play('');
                }
                break;
            case 6:
                if (isCordova && !isIos) {
                    audiopickupacorn6.play();
                } else {
                    audiopickupacorn6.play('');
                }
                break;
            case 7:
                if (isCordova && !isIos) {
                    audiopickupacorn7.play();
                } else {
                    audiopickupacorn7.play('');
                }
                break;
            case 8:
                if (isCordova && !isIos) {
                    audiopickupacorn8.play();
                } else {
                    audiopickupacorn8.play('');
                }
                break;
            case 9:
                if (isCordova && !isIos) {
                    audiopickupacorn9.play();
                } else {
                    audiopickupacorn9.play('');
                }
                break;
            case 10:
                if (isCordova && !isIos) {
                    audiopickupacorn10.play();
                } else {
                    audiopickupacorn10.play('');
                }
                break;
            case 11:
                if (isCordova && !isIos) {
                    audiopickupacorn11.play();
                } else {
                    audiopickupacorn11.play('');
                }
                break;
            default:
                if (isCordova && !isIos) {
                    audiopickupacorn11.play();
                } else {
                    audiopickupacorn11.play('');
                }
        }

        acorns.remove(obj2);
        obj2.destroy();

        scoreText.setText(score.toString());

    },

    openMenu: function () {
        if (showAds) {
            hideAd();
        }
        allowBack = true;
        isReadyToPlay = true;
        playerIsAlive = false;

        this.state.start('MainMenu');

    },

    restartGame: function () {
        allowBack = false;
        groundCounter = 0;
        cityCounter = 0;

        if (showAds && gamesPlayed === 2) {
            preloadFullscreenAd();
        }
        if (showAds && gamesPlayed === 3) {
            showFullscreenAd();
        }
        var me = this;

        isReadyToPlay = true;
        playerIsAlive = false;

        //me.cleanUp();

        setTimeout(function () {
            me.state.start('Game');

        }, 100)

    },

    deathHandler: function (obj1, obj2) {
        var me = this;
        gamesPlayed += 1;
        acornsInRow = 0;
        spawnPile = false;
        if (gamesPlayed === 4) {
            gamesPlayed = 0;
        }
        if (showAds) {
            showAd();
        }
        allowBack = true;
        gameIsPaused = true;
        gameOverMenu.visible = true;
        gameOverMenu.getAt(2).setText(score.toString());

        if (localStorage.getItem('hopsop-high') === null || score > localStorage.getItem('hopsop-high') && localStorage.getItem('hopsop-high') !== 0) {
            // New high score!
            var oldHi = localStorage.getItem('hopsop-high');

            localStorage.setItem('hopsop-high', score);
            if (score !== 0) {

                gameOverMenu.getChildAt(4).visible = true;
                gameOverMenu.getAt(3).setText(score.toString());
                gameOverMenu.getChildAt(0).visible = true; // Show standard bg
                gameOverMenu.getChildAt(1).visible = false; // Hide 100 bg

                if (score >= playerSkinLevel[4] && oldHi < playerSkinLevel[4]) {

                    loadRemix(me); // Loads music file, first time. Already loaded if score was > 100 previously.

                    gameOverMenu.getChildAt(8).visible = true; // Show special unlocked msg
                    gameOverMenu.getChildAt(0).visible = false; // Show standard bg
                    gameOverMenu.getChildAt(1).visible = true; // show 100 bg

                } else if (score >= playerSkinLevel[3] && oldHi < playerSkinLevel[3]) {
                    gameOverMenu.getChildAt(7).visible = true;
                } else if (score >= playerSkinLevel[2] && oldHi < playerSkinLevel[2]) {
                    gameOverMenu.getChildAt(7).visible = true;
                } else if (score >= playerSkinLevel[1] && oldHi < playerSkinLevel[1]) {
                    gameOverMenu.getChildAt(7).visible = true;
                } else if (score >= playerSkinLevel[0] && oldHi < playerSkinLevel[0]) {
                    gameOverMenu.getChildAt(7).visible = true;
                } else {
                    gameOverMenu.getChildAt(7).visible = false;
                }

            }
        } else {
            // Not a new high score
            gameOverMenu.getChildAt(4).visible = false;
            if (localStorage.getItem('hopsop-high') !== '') {
                gameOverMenu.getAt(3).setText(localStorage.getItem('hopsop-high'));
            } else {
                gameOverMenu.getAt(3).setText('0');
            }
        }

        isReadyToPlay = false;
        playerIsAlive = false;
        player.destroy();

        scoreText.destroy();
        starIcon.destroy();

        if (isCordova && !isIos) {
            audiodeath.play();
        } else {
            audiodeath.play('');
        }

        // Publish to google play services
        highestScore = localStorage.getItem('hopsop-high') || '0';
        //googlePublishScore(highestScore);

    },

    onDragStart: function (sprite, pointer) {
        if (playerSkin === 'MY' || playerSkin === 'LA' || playerSkin === 'HO2') {
            mySpeed = true;
            myGameSpeed = gamespeed;
            gamespeed = mySlowSpeed;
        }
    },

    onDragStop: function (sprite, pointer) {
        ray.alpha = 0;
        aim.alpha = 0;

        if (playerSkin === 'MY' || playerSkin === 'LA' || playerSkin === 'HO2') {
            gamespeed = myGameSpeed;
            mySpeed = false;
        }
        if ((!playerIsFlying || doubleJumpAllowed || playerSkin === 'HO2') && playerSkinMenu.visible !== true && !playerIsTeleporting) {

            ydist = aim.y - player.y;
            xdist = aim.x - player.x;
            if (ydist > 0) {

                if (playerSkin === 'HO2') {
                    jumpsUsed++;
                }


                if (isReadyToPlay && !playerIsAlive) {
                    isReadyToPlay = false;
                    playerIsAlive = true;
                    instructions.destroy();
                    openSkinsButton.destroy();
                    this.spawnCity();
                }

                instructions.destroy();

                ydist = 0 - ydist;
                xdist = 0 - xdist;

                yvel = ydist * dragforce;

                if (yvel < maxForce) {
                    yvel = maxForce;
                }

                player.body.gravity.y = 1000;
                player.body.velocity.y = yvel;
                player.body.velocity.x = xdist * 4;
                playerIsFlying = true;

                playerfront.frameName = 'player0013';


                if (isCordova && !isIos) {
                    audiojumpup.play();
                } else {
                    audiojumpup.play('');
                }

            }
        }
    },

    quitGame: function (pointer) {

        //	Here you should destroy anything you no longer need.
        //	Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //	Then let's go back to the main menu.
        this.state.start('MainMenu');
    },

    shutdown: function () {
        var me = this;

        scoreText.destroy();
        scoreText = null;

        // AUDIO
        if (isCordova && !isIos) {
            audiodeath.release();
            audiojumpup.release();
            audiojumplanding.release();
            audiojumplandingleaves.release();
            audiojumplandingice.release();
            audiopickupacorn1.release();
            audiopickupacorn2.release();
            audiopickupacorn3.release();
            audiopickupacorn4.release();
            audiopickupacorn5.release();
            audiopickupacorn6.release();
            audiopickupacorn7.release();
            audiopickupacorn8.release();
            audiopickupacorn9.release();
            audiopickupacorn10.release();
            audiopickupacorn11.release();

            audiotick2.release();
            audiotick3.release();
            audiowarpout.release();
            audiowarpin.release();
        } else {
            audiodeath.destroy();
            audiojumpup.destroy();
            audiojumplanding.destroy();
            audiojumplandingleaves.destroy();
            audiojumplandingice.destroy();
            audiopickupacorn1.destroy();
            audiopickupacorn2.destroy();
            audiopickupacorn3.destroy();
            audiopickupacorn4.destroy();
            audiopickupacorn5.destroy();
            audiopickupacorn6.destroy();
            audiopickupacorn7.destroy();
            audiopickupacorn8.destroy();
            audiopickupacorn9.destroy();
            audiopickupacorn10.destroy();
            audiopickupacorn11.destroy();

            audiotick2.destroy();
            audiotick3.destroy();
            audiowarpout.destroy();
            audiowarpin.destroy();

            me.sound.remove('death');
            me.sound.remove('jumpup');
            me.sound.remove('jumplanding');
            me.sound.remove('jumplandingleaves');
            me.sound.remove('jumplandingice');
            me.sound.remove('pickupacorn');
            me.sound.remove('tick1');
            me.sound.remove('tick2down');
            me.sound.remove('tick3');
            me.sound.remove('warpout');
            me.sound.remove('warpin');
        }


        // SPRITES
        bg.destroy(true);

        trunk1.destroy(true);
        trunk2.destroy(true);

        cityBig.destroy(true);

        instructions.destroy(true);

        shelf1.destroy(true);
        shelf2.destroy(true);
        shelf3.destroy(true);

        squirrel.destroy(true);
        bigPortal.destroy(true);
        bigPortalLight.destroy(true);
        portalball.destroy(true);
        squirrel = null;
        bigPortal = null;
        bigPortalLight = null;
        portalball = null;

        wallLeft.destroy();
        wallRight.destroy();


        starIcon.destroy();

        bg = null;
        trunk1 = null;
        trunk2 = null;
        cityBig = null;
        instructions = null;

        shelf1 = null;
        shelf2 = null;
        shelf3 = null;

        wallLeft = null;
        wallRight = null;

        starIcon = null;

        // PLAYER
        player.destroy(true);
        playerfront.destroy(true);
        ray.destroy(true);
        aim.destroy(true);

        player = null;
        playerfront = null;
        ray = null;
        aim = null;

        playertween = null;


        // GROUPS
        sides.destroy(true);
        shelves.destroy(true);
        portals.destroy(true);
        portallights.destroy(true);
        ices.destroy(true);
        cities.destroy(true);
        acorns.destroy(true);

        sides = null;
        shelves = null;
        portals = null;
        portallights = null;
        ices = null;
        cities = null;
        acorns = null;

        gameOverMenu.destroy(true);
        playerSkinMenu.destroy(true);
        continueMenu.destroy(true);
        gameOverMenu = null;
        playerSkinMenu = null;
        continueMenu = null;
    }

};

var Shelf = function (game, x, y, frame, group) {

    var tilenumber = Math.floor((Math.random() * 5) + 1);

    var shelf = game.add.sprite(x, y, 'shelf' + tilenumber);
    shelf.anchor.setTo(0.5, 0.5);
    game.physics.enable(shelf, Phaser.Physics.ARCADE);

    shelf.body.allowGravity = false;
    shelf.body.immovable = true;

    shelf.body.checkCollision.down = false;
    shelf.body.checkCollision.left = false;
    shelf.body.checkCollision.right = false;
    return shelf;
};


var Ice = function (game, x, y, frame, group) {

    var tilenumber = Math.floor((Math.random() * 3) + 1);

    var ice = game.add.sprite(x, y, 'ice' + tilenumber);
    ice.anchor.setTo(0.5, 0.5);
    game.physics.enable(ice, Phaser.Physics.ARCADE);

    ice.body.allowGravity = false;
    ice.body.immovable = true;

    ice.body.checkCollision.down = false;
    ice.body.checkCollision.left = false;
    ice.body.checkCollision.right = false;
    return ice;

};

var Portal = function (game, x, y, frame, group) {

    var portal = game.add.sprite(x, y, 'portal');
    portal.anchor.setTo(0.5, 0.5);
    game.physics.enable(portal, Phaser.Physics.ARCADE);

    portal.body.allowGravity = false;
    portal.body.immovable = true;

    portal.body.checkCollision.down = false;
    portal.body.checkCollision.left = false;
    portal.body.checkCollision.right = false;
    return portal;
};

var Portallight = function (game, x, y, frame, group) {
    var portallight = game.add.sprite(x, y, 'portallight');
    portallight.anchor.setTo(0.5, 1.15);

    game.physics.enable(portallight, Phaser.Physics.ARCADE);
    portallight.body.allowGravity = false;
    portallight.body.immovable = true;

    return portallight;
};

var FloatingCity = function (game, x, y, frame, group) {

    var tilenumber = Math.floor((Math.random() * 4) + 1);
    var city = game.add.sprite(x, y, 'city' + tilenumber);
    city.anchor.setTo(0.5, 0.5);

    game.physics.enable(city, Phaser.Physics.ARCADE);
    city.body.allowGravity = false;
    city.body.immovable = true;

    return city;

};


var Acorn = function (game, x, y, frame, group) {
    var tilenumber = Math.floor((Math.random() * 3) + 1);
    if (spawnPile === true) {
        tilenumber = 'pile';
        spawnPile = false;

    }
    if (acornsInRow >= secondBonusLevel) {
        tilenumber = '4';
    }
    var acorn = game.add.sprite(x, y, 'acorn' + tilenumber);
    acorn.anchor.setTo(0.5, 1.15);

    game.physics.enable(acorn, Phaser.Physics.ARCADE);
    acorn.body.allowGravity = false;
    acorn.body.immovable = true;

    return acorn;
};