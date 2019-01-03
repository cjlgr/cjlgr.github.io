var bg;
var GlobalGameMusic;

// game settings
var gamespeed = 2.3;
var doubleJumpAllowed = false;
var score = 0;
var shelfSpawnTime=1.7;
var citySpawnTime = 12;

// in game flags
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


BasicGame.Game = function (game) {


	//	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

    this.game;		//	a reference to the currently running game, this = this.game
    this.add;		//	used to add sprites, text, groups, etc
    this.camera;	//	a reference to the game camera
    this.cache;		//	the game cache
    this.input;		//	the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
    this.load;		//	for preloading assets
    this.math;		//	lots of useful common math operations
    this.sound;		//	the sound manager - add a sound, play one, set-up markers, etc
    this.stage;		//	the game stage
    this.time;		//	the clock
    this.tweens;	//	the tween manager
    this.world;		//	the game world
    this.particles;	//	the particle manager
    this.physics;	//	the physics manager
    this.rnd;		//	the repeatable random number generator

    //	You can use any of these from any function within this State.
    //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

};

var Shelf = function(game, x, y, frame, group) {  

  var tilenumber = Math.floor((Math.random() * 5) + 1);
  
  var shelf = game.add.sprite(x, y, 'shelf'+tilenumber);    
  shelf.anchor.setTo(0.5, 0.5);
  game.physics.enable(shelf, Phaser.Physics.ARCADE);

  shelf.body.allowGravity = false;
  shelf.body.immovable = true;

  shelf.body.checkCollision.down = false;
  shelf.body.checkCollision.left = false;
  shelf.body.checkCollision.right = false;
  return shelf;
};


var Ice = function(game, x, y, frame, group) {  

  var tilenumber = Math.floor((Math.random() * 3) + 1);
  
  var ice = game.add.sprite(x, y, 'ice'+tilenumber);    
  ice.anchor.setTo(0.5, 0.5);
  game.physics.enable(ice, Phaser.Physics.ARCADE);

  ice.body.allowGravity = false;
  ice.body.immovable = true;

  ice.body.checkCollision.down = false;
  ice.body.checkCollision.left = false;
  ice.body.checkCollision.right = false;
  return ice;

};

var Portal = function(game, x, y, frame, group) {  
  
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

var Portallight = function(game, x, y, frame, group) {  
    var portallight = game.add.sprite(x, y, 'portallight');
    portallight.anchor.setTo(0.5, 1.15);
    
    game.physics.enable(portallight, Phaser.Physics.ARCADE);
    portallight.body.allowGravity = false;
    portallight.body.immovable = true;
    
    return portallight;
};

var FloatingCity = function(game, x, y, frame, group) {  

  var tilenumber = Math.floor((Math.random() * 4) + 1);
  var city = game.add.sprite(x, y, 'city'+tilenumber);
  city.anchor.setTo(0.5, 0.5);

  game.physics.enable(city, Phaser.Physics.ARCADE);
  city.body.allowGravity = false;
  city.body.immovable = true;

  return city;
  
};


var Acorn = function(game, x, y, frame, group) {  
    var tilenumber = Math.floor((Math.random() * 3) + 1);
    var acorn = game.add.sprite(x, y, 'acorn'+tilenumber);
    acorn.anchor.setTo(0.5, 1.15);
    
    game.physics.enable(acorn, Phaser.Physics.ARCADE);
    acorn.body.allowGravity = false;
    acorn.body.immovable = true;
    
    return acorn;
};

BasicGame.Game.prototype = {

	create: function () {
	  
	  var me = this;
	  gameIsPaused = false;
	  
	  // Start music
	  //this.audiomusic = this.add.audio('music');
	  me.audiodeath = me.add.audio('death');
	  me.audiojumpup = me.add.audio('jumpup');
	  me.audiojumplanding = me.add.audio('jumplanding');
	  me.audiojumplandingleaves = me.add.audio('jumplandingleaves');
	  me.audiojumplandingice = me.add.audio('jumplandingice');
	  me.audiopickupacorn = me.add.audio('pickupacorn');
	  me.audiotick1 = me.add.audio('tick1');
	  me.audiotick2 = me.add.audio('tick2down');
	  me.audiotick3 = me.add.audio('tick3');
	  me.audiowarpout = me.add.audio('warpout');
    me.audiowarpin = me.add.audio('warpin');
    
    if (!GlobalGameMusic || !GlobalGameMusic.isPlaying) {
      if (musicOn) {
        GlobalGameMusic = me.add.audio('music');
        GlobalGameMusic.play('', 0, 0.6, true);
      }
      
    }

    // Init physics system
    me.game.physics.startSystem(Phaser.Physics.ARCADE);
    me.game.physics.arcade.gravity.y = 200;
		

		// BG ***********************************************************************************
		var bgNbr = Math.ceil(Math.random() * 5);
		
		bg = me.add.tileSprite(0, 0, 640, me.cache.getImage('bg'+bgNbr).height, 'bg'+bgNbr);
		
		// CITIES ***********************************************************************************
    me.cities = me.add.group();

  	trunk = me.add.tileSprite(this.world.centerX-240, 0, 480, me.cache.getImage('trunk').height, 'trunk');
  	
    
  	
  	// WALLS ***********************************************************************************
    
    me.sides = me.add.group();
    
    me.wallLeft = me.add.sprite(0, -1000, 'wallVertical');
    me.physics.enable(me.wallLeft, Phaser.Physics.ARCADE);
    me.wallLeft.body.immovable = true;
    me.wallLeft.body.allowGravity = false;
    
    me.wallRight = me.add.sprite(me.world.width, -1000, 'wallVertical');
    me.physics.enable(me.wallRight, Phaser.Physics.ARCADE);
    me.wallRight.body.immovable = true;
    me.wallRight.body.allowGravity = false;
    
    me.sides.add(me.wallLeft);
    me.sides.add(me.wallRight);
    
     
    
    // SHELVES ***********************************************************************************
    me.shelves = me.add.group();
    me.ices = me.add.group();
    me.portals = me.add.group();
    me.portallights = me.add.group();
    
    var shelf = me.add.sprite(this.world.centerX, 600, 'shelf1');
    shelf.anchor.setTo(0.5, 0.5);
    me.physics.enable(shelf, Phaser.Physics.ARCADE);
    shelf.body.immovable = true;
    shelf.body.allowGravity = false;
    
    var shelf2 = me.add.sprite(100, 300, 'shelf2');
    shelf2.anchor.setTo(0.5, 0.5);
    me.physics.enable(shelf2, Phaser.Physics.ARCADE);
    shelf2.body.immovable = true;
    shelf2.body.allowGravity = false;
    
    var shelf3 = me.add.sprite(this.world.centerX+100, 100, 'shelf1');
    shelf3.anchor.setTo(0.5, 0.5);
    me.physics.enable(shelf3, Phaser.Physics.ARCADE);
    shelf3.body.immovable = true;
    shelf3.body.allowGravity = false;
    
    // Add them to group
    me.shelves.add(shelf);  
    me.shelves.add(shelf2);
    me.shelves.add(shelf3);    
    
    // Disable collision detection from sides and under, so player can jump "through" them
    me.shelves.forEach(function(shelf){
      shelf.body.checkCollision.down = false;
      shelf.body.checkCollision.left = false;
      shelf.body.checkCollision.right = false;
    });
    
    // ACORNS ***********************************************************************************
    me.acorns = me.add.group();
    
    // RAY ***********************************************************************************    
		ray = me.add.sprite(0, 0, 'ray');
    ray.anchor.setTo(0, 0.5);
    ray.alpha = 0;
    
    // PLAYER ***********************************************************************************
    player = me.add.sprite(me.world.centerX, 500, 'player');
    player.anchor.setTo(0.5, 0.5);
    
    playerfront = me.add.sprite(me.world.centerX, 500, 'playerfront', 'player0000');
    playerfront.anchor.setTo(0.5, 1.05);
    playerfront.animations.add('warpout', Phaser.Animation.generateFrameNames('warp', 0, 20, '', 4), 48, false);
    playerfront.animations.add('warpin', Phaser.Animation.generateFrameNames('warp', 21, 30, '', 4), 48, false);
    
    playerfront.events.onAnimationComplete.add(function(sprite, animation){
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
    me.scoreText = me.add.bitmapText(me.world.centerX-20, 10, 'hopsopfont','0', 64);
  
    me.gameOverMenu = me.add.group();
  
    var gameOverScreenTop = me.world.centerY - 794/2;
  
    var gameOver = me.add.sprite(me.world.centerX - 479/2, gameOverScreenTop, 'gameOver'),
        finalScoreText = me.add.bitmapText(me.world.centerX-170, gameOverScreenTop + 290, 'hopsopfont','0', 64),
        newHighScoreLabel = me.add.sprite(me.world.centerX+gameOver.width/2-164-78, gameOverScreenTop + 335, 'newHighScoreLabel'),
		    highScoreText = me.add.bitmapText(me.world.centerX-165, gameOverScreenTop + 440, 'hopsopfont','0', 36),
        replayButton = me.add.button(me.world.centerX - 325/2, gameOverScreenTop + 560, 'replayButton', me.restartGame, me, 'btn-start-normal', 'btn-start-normal', 'btn-start-hover'),
        closeButton = me.add.button(me.world.centerX + 170, gameOverScreenTop + 30, 'closeButton', me.openMenu, me, 'btn-close-hover', 'btn-close-normal', 'btn-close-hover');

		replayButton.onInputDown.add(me.buttonDown, me);
    closeButton.onInputDown.add(me.buttonDown, me);
		newHighScoreLabel.visible = false;

    me.gameOverMenu.add(gameOver);
    me.gameOverMenu.add(finalScoreText);  
    me.gameOverMenu.add(highScoreText);
    me.gameOverMenu.add(newHighScoreLabel);
    me.gameOverMenu.add(replayButton); 
    me.gameOverMenu.add(closeButton);
    me.gameOverMenu.visible = false;
    
    // INSTRUCTIONS ***********************************************************************************    
		instructions = me.add.sprite(me.world.width/2-138, me.world.height-360, 'instructions');

    // SHELF GENERATOR ************************************************************************
    
    me.shelfGenerator = me.time.events.loop(Phaser.Timer.SECOND * shelfSpawnTime, me.spawnGround, me);
    me.shelfGenerator.timer.start();

        
    // CITY GENERATOR ************************************************************************

    me.cityGenerator = me.time.events.loop(Phaser.Timer.SECOND * citySpawnTime, me.spawnCity, me);
    me.cityGenerator.timer.start();
    
    
	},

  buttonDown: function() {
    this.audiotick2.play('', 0, 1, false);	
  },
  
	spawnGround: function () {
	  
	  var me = this;
	  if (playerIsAlive) {
  	  var y = -50
  	  var x = Math.floor((Math.random() * me.world.width-100)+100);
	  
	    var rnd = Math.ceil(Math.random()*100);
	    if (rnd > 70) {
  	    var shelf = new Shelf(me.game, x, y, true, me.shelves);
  	    me.spawnAcorn(x, y);
  	    me.shelves.add(shelf);
  	  } else if (rnd <= 70 && rnd > 50){
  	    var ice = new Ice(me.game, x, y, true, me.ices);
  	    me.spawnAcorn(x, y-20);
  	    me.ices.add(ice);
  	  } else {
  	    if (me.portals.children.length === 0) { // If there are no portals in play
  	      var portal = new Portal(me.game, x, y, true, me.portals);
  	      me.spawnPortallight(x, y);
  	      me.portals.add(portal);
  	    } else {
  	      var shelf = new Shelf(me.game, x, y, true, me.shelves);
    	    me.spawnAcorn(x, y);
    	    me.shelves.add(shelf);
  	    }
  	  }
  	  

	  }
	},
	
	spawnAcorn: function (x, y) {
	  var me = this;
	  if (playerIsAlive) {
	  
	    var acorn = new Acorn(me.game, x, y, true, me.acorns);
	    me.acorns.add(acorn);
    }
	},
	
	spawnPortallight: function (x, y) {
	  var me = this;
	  if (playerIsAlive) {
	  
	    var portallight = new Portallight(me.game, x, y-14, true, me.portallights);
	    me.portallights.add(portallight);
    }
	},
	
	spawnCity: function () {
	  var me = this;
	  if (playerIsAlive) {
	  
  	  var y = -300
  	  var x = 0;
	  
  	  //var isLower = (Math.random() * 3) < 2;
      if(spawnLeft) {
          x = Math.floor((Math.random() * 120) + 1);
      } else {
          x = Math.floor((Math.random() * 120) + me.world.width-120);
      }
    
      spawnLeft = !spawnLeft;
	  
  	  var fc = new FloatingCity(me.game, x, y, true, me.cities);
	  
  	  me.cities.add(fc);
    }
	},

	update: function () {
	  

    var me = this;
    if (!gameIsPaused) {
      
      
      playerfront.x = player.x;
      playerfront.y = player.y + (playerfront.height/2);
    
      // Collision detect
    
      // Ground
      me.physics.arcade.collide(me.shelves, player, me.collisionHandler, null, me);

      // Ice
      me.physics.arcade.collide(me.ices, player, me.iceCollisionHandler, null, me);
    
      // Portals
      me.physics.arcade.collide(me.portals, player, me.portalCollisionHandler, null, me);
      
      // Acorns
      me.physics.arcade.overlap(me.acorns, player, me.acornCollisionHandler, null, me);
    
      // Walls
      me.physics.arcade.collide(me.sides, player, me.sideCollider, null, me);
    
    
      // Aiming player
    
        me.handleAim();
   
    
    
      if (playerIsAlive) {
        trunk.tilePosition.y += gamespeed;
      
        me.updateShelves();
        me.updatePortals();
        me.updateIces();
        me.updateAcorns();
        me.updateCities();
      
        if (player.body.y>this.world.height+170) {
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
	
	handleAim: function() {
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
      
      //this.add.tween(playerfront).to({angle: 0}, 200).start();
      
            
    } else if (aim.input.isDragged && (!playerIsFlying || doubleJumpAllowed)) {
      
      // AIM IS BEING DRAGGED
      // Flag this if already clicked
      if (!aimSoundHasPlayed) {
        aimSoundHasPlayed = true;
        me.audiotick3.play('', 0, 1, false);    
      }
      
      
      var distance = me.physics.arcade.distanceBetween(player, aim);
      //var rotation = me.physics.arcade.angleBetween(aim, player);
      var rotation = me.physics.arcade.angleToXY(aim, player.x, (player.y+player.height/2));
      //console.log(player.y+player.height/2);
      
      // ROTATE PLAYER
      //quarter = 90 * (Math.PI/180);
      //playerfront.rotation = rotation+quarter;
      degrees = rotation*(180/Math.PI)+90;
      if (degrees > -55 && degrees < 55) {
        me.add.tween(playerfront).to({angle: degrees}, 70).start();
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
	
	updateShelves: function() {
	  var me = this;
	  me.shelves.forEach(function(shelf){
	    if (shelf) {
	      shelf.body.y+=gamespeed;
        if (shelf.body.y>this.world.height+200) {
          this.shelves.remove(shelf);
          shelf.destroy();
        }
	    }
      
    }, me);
	},
	
	updateIces: function() {
	  var me = this;
	  me.ices.forEach(function(ice){
	    if (ice) {
	      ice.body.y+=gamespeed;
        if (ice.body.y>this.world.height+200) {
          this.ices.remove(ice);
          ice.destroy();
        }
	    }
      
    }, me);
	},
	
	updatePortals: function() {
	  var me = this;
	  me.portals.forEach(function(portal){
	    if (portal) {
	      portal.body.y+=gamespeed;
        if (portal.body.y>this.world.height+300) {
          this.portals.remove(portal);
          portal.destroy();
        }
	    }
    }, me);
    me.portallights.forEach(function(portallight){
	    if (portallight) {
	      portallight.body.y+=gamespeed;
        if (portallight.body.y>this.world.height+300) {
          this.portallights.remove(portallight);
          portallight.destroy();
        }
	    }
    }, me);
	},
	
	updateAcorns: function() {
	  var me = this;
	  me.acorns.forEach(function(acorn){
	    if (acorn) {
	      acorn.body.y+=gamespeed;
        if (acorn.body.y>this.world.height+200) {
          this.acorns.remove(acorn);
          acorn.destroy();
        }
	    }
      
    }, me);
	},
	
	
	updateCities: function() {
	  var me = this;
	  me.cities.forEach(function(city){
	    if (city) {
	      city.body.y+=gamespeed/2;
        if (city.body.y>this.world.height+200) {
          this.cities.remove(city);
          city.destroy();
        }
	    }
      
    }, me);
	},
	
	iceCollisionHandler: function (obj1, obj2) {
	  // collision player and ice
      //player.body.gravity.y = 10000;
      //player.body.velocity.x = 0;
      player.body.velocity.y = 0;
      
      if (playerIsFlying) {
        
        // PLAYER IS LANDING, LETS RESET ROTATION
        playerIsFlying = false;
        
        this.audiojumplandingice.play('');    
        
        playerfront.frameName = 'player0000';
        this.add.tween(playerfront).to({angle: 0}, 50).start();
        
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
        
        this.audiojumplandingleaves.play('');    
        
        playerfront.frameName = 'player0000';
        this.add.tween(playerfront).to({angle: 0}, 50).start();
        
      }
  },
  
  portalCollisionHandler: function (obj1, obj2) {
    var me = this;
	  // collision player and portal
	    //player.body.gravity.y = 10000;
      player.body.velocity.x = 0;
      player.body.velocity.y = 0;
      
      var newX = this.world.width /2,
          newY = 0,
          highestShelfX,
          highestShelfY = this.world.height,
          highestIceX,
          highestIceY = this.world.height;
      
      if (!playerIsTeleporting) {
        
        // PLAYER IS LANDING, LETS RESET ROTATION
        playerIsFlying = false;
        
        this.audiojumplandingleaves.play('');    
        
        this.add.tween(playerfront).to({angle: 0}, 50).start();
        this.audiowarpout.play('', 0, 1, false);	
        
        
        playerIsTeleporting = true;
        playerfront.animations.play('warpout', false);

        if (this.shelves.children.length > 0) {
          highestShelfX = this.shelves.children[this.shelves.children.length-1].x;
          highestShelfY = this.shelves.children[this.shelves.children.length-1].y;
        }
        if (this.ices.children.length > 0) {
          highestIceX = this.ices.children[this.ices.children.length-1].x;
          highestIceY = this.ices.children[this.ices.children.length-1].y;
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
        
        setTimeout(function(){
          player.y = newY-150;
          player.x = newX;
          me.audiowarpin.play('', 0, 1, false);	
          playerfront.animations.play('warpin', false);
          
        }, 500, this);

      }
  },
  
  sideCollider: function (obj1, obj2) {
      this.audiojumplanding.play('');      
  },
  
  acornCollisionHandler: function (obj1, obj2) {
      score ++;
      this.audiopickupacorn.play('');    
      
      this.acorns.remove(obj2);
      obj2.destroy();
      
      this.scoreText.setText(score.toString());
      
  },
  
  openMenu: function(){
    isReadyToPlay = true;
    playerIsAlive = false;
    
    this.cleanUp();
    
    this.state.start('MainMenu');   
    
  },
  
  restartGame: function(){
    var me = this;
    
    isReadyToPlay = true;
    playerIsAlive = false;
    
    me.cleanUp();
    
    setTimeout(function(){
		  me.state.start('Game');
		}, 100)

  },
  
  deathHandler: function (obj1, obj2) {
    
    gameIsPaused = true;
    this.gameOverMenu.visible = true;
    this.gameOverMenu.getAt(1).setText(score.toString());
    
    
    
    if (localStorage.getItem('hopsop-high') === null || score > localStorage.getItem('hopsop-high') && localStorage.getItem('hopsop-high') !== 0) {
      // New high score!
      localStorage.setItem('hopsop-high', score);
      this.gameOverMenu.getChildAt(3).visible = true;
      this.gameOverMenu.getAt(2).setText(score.toString());
    } else {
      // Not a new high score
      this.gameOverMenu.getChildAt(3).visible = false;
      if (localStorage.getItem('hopsop-high') !== '') {
        this.gameOverMenu.getAt(2).setText(localStorage.getItem('hopsop-high'));
      } else {
        this.gameOverMenu.getAt(2).setText('0');
      }
    }
    
    isReadyToPlay = false;
    playerIsAlive = false;
    player.destroy();
    
    this.scoreText.destroy();
    
	  
	  //this.audiomusic.stop();
	  this.audiodeath.play(''); 
	  //this.state.start('Game');   
    
	},
	
	onDragStart: function(sprite, pointer) {

  },

  onDragStop: function(sprite, pointer) {      

      if (!playerIsFlying || doubleJumpAllowed) {
        //result = sprite.key + " dropped at x:" + pointer.x + " y: " + pointer.y;
        ydist = aim.y - player.y;
        xdist = aim.x - player.x;
        if (ydist > 0) {
        
          if (isReadyToPlay && !playerIsAlive) {
            isReadyToPlay = false;
            playerIsAlive = true;
            instructions.destroy();
            this.spawnCity();
          }
          
          instructions.destroy();
        
          ydist = 0-ydist;
          xdist = 0-xdist;
          
          yvel = ydist * dragforce;
          
          if (yvel < maxForce) {
            yvel = maxForce;
          }
          player.body.gravity.y = 1000;
          player.body.velocity.y = yvel;
          player.body.velocity.x = xdist*4;
          playerIsFlying = true;
          playerfront.frameName = 'player0013';
          
          this.audiojumpup.play('');
         
        }
      }
  },

	quitGame: function (pointer) {

		//	Here you should destroy anything you no longer need.
		//	Stop music, delete sprites, purge caches, free resources, all that good stuff.

		//	Then let's go back to the main menu.
		this.state.start('MainMenu');
	},
	
	cleanUp: function(){
	  var me = this;
	  
	  // AUDIO
	  me.audiodeath.destroy();
	  me.audiojumpup.destroy();
	  me.audiojumplanding.destroy();
	  me.audiojumplandingleaves.destroy();
	  me.audiopickupacorn.destroy();
	  me.audiotick1.destroy();
	  me.audiotick2.destroy();
	  me.audiotick3.destroy();
	  
	  // SPRITES
	  bg.destroy();
	  trunk.destroy();
	  ray.destroy();
	  player.destroy();
	  playerfront.destroy();
	  aim.destroy();
	  instructions.destroy();
	  
	  
	  // GROUPS
	  me.sides.destroy();
	  me.shelves.destroy();
	  me.ices.destroy();
	  me.cities.destroy();
	  me.acorns.destroy();
	  
	  me.gameOverMenu.destroy();
	  
	}

};
