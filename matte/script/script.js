var game = {
  el: $('#game'),
  qEl: $('#questionText'),
  mEl: $('#menu'),
  setEl: $('#settings'),
  fEl: $('#feedback'),
  tfEl: $('#testfeedback'),
  sEl: $('#score'),
  msEl: $('#menu-score'),
  cEl: $('#counter'),
  hEl: $('#help'),
  tEl: $('#test'),
  currentAnswer: null,
  currentCorrectReward: null,
  xMode: false,
  score: 0,
  alarm: 0,
  time: 0,
  contest: false,
  timeout: null,
  mix: true,
  mode: 'multi',
  testmode: {
    infant: {
      time: 100,
      numberOfQuestions: 5
    },
    easy: {
      time: 100,
      numberOfQuestions: 10
    },
    medium: {
      time: 200,
      numberOfQuestions: 30
    },
    hard: {
      time: 300,
      numberOfQuestions: 50
    },
  },
  levels: {
    infant: [
      {
        mode: 'plus',
        char: '+',
        min: 0,
        max: 10, 
        time: 45,
      },
      {
        mode: 'minus',
        char: '-',
        min: 0,
        max: 10,
        time: 45,
      },
      {
        mode: 'multi',
        char: '×',
        min: 0,
        max: 3,
        time: 45
      }
    ],
    easy: [
      {
        mode: 'plus',
        char: '+',
        min: 0,
        max: 20,
        time: 30,
      },
      {
        mode: 'minus',
        char: '-',
        min: 0,
        max: 20,
        time: 30,
      },
      {
        mode: 'multi',
        char: '×',
        min: 0,
        max: 5,
        time: 40
      }
    ],
    medium: [
      {
        mode: 'plus',
        char: '+',
        min: 0,
        max: 30,
        time: 20,
      },
      {
        mode: 'minus',
        char: '-',
        min: 0,
        max: 30,
        time: 30,
      },
      {
        mode: 'multi',
        char: '×',
        min: 0,
        max: 7,
        time: 40
      }
    ],
    hard: [
      {
        mode: 'plus',
        char: '+',
        min: 0,
        max: 100,
        time: 20,
      },
      {
        mode: 'minus',
        char: '-',
        min: 0,
        max: 100,
        time: 20,
      },
      {
        mode: 'multi',
        char: '×',
        min: 0,
        max: 10,
        minb: 0,
        maxb: 10,
        time: 30
      }
    ]
  },
  currentLevel: [],

  saveSettings: function(){
    localStorage.setItem('addition', $('#checkAdd').is(':checked'));
    localStorage.setItem('subtraction', $('#checkSub').is(':checked'));
    localStorage.setItem('multiplication', $('#checkMult').is(':checked'));
    localStorage.setItem('xmode', $('#checkX').is(':checked'));
    localStorage.setItem('difficulty', $('[name=difficulty]:checked').val());
  },



  // Load settings: load settings from localstorage. If no setting is stored, then addition should be set to true and the other ones to false. Difficulty should be set to infant.
  loadSettings: function(){
    var addition = localStorage.getItem('addition') === 'true' ? true : false;
    var subtraction = localStorage.getItem('subtraction') === 'true' ? true : false;
    var multiplication = localStorage.getItem('multiplication') === 'true' ? true : false;
    var xmode = localStorage.getItem('xmode') === 'true' ? true : false;
    var difficulty = localStorage.getItem('difficulty');

    if (!(addition || subtraction || multiplication)) {
      addition = true;
    }
    
    if (!difficulty) {
      difficulty = 'infant';
    } 

    $('#checkAdd').prop('checked', addition);
    $('#checkSub').prop('checked', subtraction);
    $('#checkMult').prop('checked', multiplication);
    $('#checkX').prop('checked', xmode);
    $('[name=difficulty][value='+difficulty+']').prop('checked', true);
  },

  saveCustomSettings: function(){
    localStorage.setItem('mina', $('[name=mina]').val());
    localStorage.setItem('minb', $('[name=minb]').val());
    localStorage.setItem('maxa', $('[name=maxa]').val());
    localStorage.setItem('maxb', $('[name=maxb]').val());
    game.levels.hard[2].min = parseInt(localStorage.getItem('mina'));
    game.levels.hard[2].max = parseInt(localStorage.getItem('maxa'));
    game.levels.hard[2].minb = parseInt(localStorage.getItem('minb'));
    game.levels.hard[2].maxb = parseInt(localStorage.getItem('maxb'));

    localStorage.setItem('testNbrOfQuestions', $('[name=test-nbr-of-questions]').val());
    localStorage.setItem('testTime', $('[name=test-time]').val());
    game.testmode.hard.numberOfQuestions = parseInt(localStorage.getItem('testNbrOfQuestions'));
    game.testmode.hard.time = parseInt(localStorage.getItem('testTime'));
  },

  loadCustomDifficultySettings: function(){
    // Load min/max values
    if (localStorage.getItem('mina')) {
      $('[name=mina]').val(localStorage.getItem('mina'));
      $('[name=maxa]').val(localStorage.getItem('maxa'));
      $('[name=minb]').val(localStorage.getItem('minb'));
      $('[name=maxb]').val(localStorage.getItem('maxb'));
      game.levels.hard[2].min = parseInt(localStorage.getItem('mina'));
      game.levels.hard[2].max = parseInt(localStorage.getItem('maxa'));
      game.levels.hard[2].minb = parseInt(localStorage.getItem('minb'));
      game.levels.hard[2].maxb = parseInt(localStorage.getItem('maxb'));
    } else {
      // Load defaults
      $('[name=mina]').val(game.levels.hard[2].min);
      $('[name=maxa]').val(game.levels.hard[2].max);
      $('[name=minb]').val(game.levels.hard[2].minb);
      $('[name=maxb]').val(game.levels.hard[2].maxb);
    }

    if (localStorage.getItem('testNbrOfQuestions')) { // test-nbr-of-questions
      $('[name=test-nbr-of-questions]').val(localStorage.getItem('testNbrOfQuestions'));
      game.testmode.hard.numberOfQuestions = parseInt(localStorage.getItem('testNbrOfQuestions'));
    } else {
      $('[name=test-nbr-of-questions]').val(game.testmode.hard.numberOfQuestions);
    }

    if (localStorage.getItem('testTime')) { // test-time
      $('[name=test-time]').val(localStorage.getItem('testTime'));
      game.testmode.hard.time = parseInt(localStorage.getItem('testTime'));
    } else {
      $('[name=test-time]').val(game.testmode.hard.time);
    }

  },


  startGame: function(_mode){

    this.saveSettings();

    $('#game').css('height', window.innerHeight-16);

    // Set modes
    this.modes = [];
    if ($('#checkAdd').is(':checked')) {
      this.modes.push('plus');
    }
    if ($('#checkSub').is(':checked')) {
      this.modes.push('minus');
    }
    if ($('#checkMult').is(':checked')) {
      this.modes.push('multi');
    }
    if ($('#checkX').is(':checked')) {
      this.xMode = true;
    } else {
      this.xMode = false;
    }

    var difficulty = $('[name=difficulty]:checked').val();

    this.currentLevel = this.levels[difficulty];

    // If no mode is selected, use all
    if (this.modes.length === 0) {
      this.modes = [
        'plus',
        'minus',
        'multi'
      ];
    }

    // Stop last game
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.alarmStopped = true;
    this.contest = _mode === 'contest';
    if (this.contest) {
      this.cEl.show();
      this.time = -1;
      this.alarm = -1;
      this.score = localStorage.getItem('contestscore') ? parseInt(localStorage.getItem('contestscore')) : 0;

    } else {
      this.cEl.hide();
      this.score = localStorage.getItem('trainingscore') ? parseInt(localStorage.getItem('trainingscore')) : 0;

    }

    this.updateScoreText(this.score);
    this.createNewQuestion();
  },

  startTest: function(_mode){
    this.updateTestFeedbackText('');

    this.saveSettings();

    $('#test').css('height', window.innerHeight-16);

    // Scroll to top
    $('html, body').animate({
      scrollTop: 0
    }, 100);

    // Set modes
    this.modes = [];
    if ($('#checkAdd').is(':checked')) {
      this.modes.push('plus');
    }
    if ($('#checkSub').is(':checked')) {
      this.modes.push('minus');
    }
    if ($('#checkMult').is(':checked')) {
      this.modes.push('multi');
    }
    if ($('#checkX').is(':checked')) {
      this.xMode = true;
    } else {
      this.xMode = false;
    }

    var difficulty = $('[name=difficulty]:checked').val();
    game.currentDifficulty = difficulty;
    this.currentLevel = this.levels[difficulty];
    var gametime = game.testmode[difficulty].time;
    var numberOfQuestions = game.testmode[difficulty].numberOfQuestions;

    // If no mode is selected, use all
    if (this.modes.length === 0) {
      this.modes = [
        'plus',
        'minus',
        'multi'
      ];
    }

    // Stop last game
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.alarmStopped = true;

    this.updateScoreText(999);
    var questions = [];





    for (var i = 0; i < numberOfQuestions; i++) {
      questions.push(this.createTestQuestion());
    }

    // add the question texts (questions[i].q.question) to the #testquestions element with a <br> between each question
    var qtxt = '';
    for (var i = 0; i < questions.length; i++) {
      qtxt += '<div class="test-question-text">' + questions[i].q.question + '</div>';
      qtxt += '<input name="q'+i+'" type="number" data-type="test-input" data-answer="'+questions[i].a.answer+'"><br><br>';
    }

    qtxt += '<div style="height: 100px; margin-top: 50px; margin-bottom: 50px;"><button id="correctTest" class="btn-big btn-3d btn-3d-yellow">Kontrollera svar</button></div>';

    $('#testquestions').html(qtxt);

    game.countDown(3, function(){
      game.initGameTime(gametime, function(){
        game.onTestTimeUp();
      });
    });
  },

  onTestTimeUp: function(){
  },

  getRandomInt: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  setAlarm: function(alarm){
    this.alarm = alarm;
    this.time = alarm;
    this.tick();
  },

  tick: function(){
    if (this.alarmStopped) {
      return;
    }
    this.onTick();
    this.time --;
    if (this.time >= 0) {
      if (!this.alarmStopped) {
        this.timeout = setTimeout(this.tick.bind(this), 1000);
      }
    }
    if (this.time === -1) {
      setTimeout(function(){
        $('#answerButton').attr('disabled', true);
        this.onWrongAnswer('<h3>Tiden är slut!</h3><p>Det rätta svaret är '+this.currentAnswer+'</p> <button class="btn-small-3d" onclick="game.createNewQuestion()">Ny fråga</button>');
      }.bind(this), 1000);
    }
  },

  onTick: function(){
    var bar = $('#counterbar'),
        percent = this.time/this.alarm*100;
    bar.css('width', percent + '%');
  },

  createNewQuestion: function(){
    var q;
    if (this.xMode) {
      q = this.createXQuestion();
    } else {
      q = this.createQuestion();
    }
    
    this.updateFeedbackText('');
    setTimeout(function(){
      $('#answerButton').attr('disabled', false);
    }, 100);

    $('#answerField').val('');
    $('#answerField').focus();
    this.updateQuestionText(q.question);
    if (this.contest) {
      this.alarmStopped = false;

      var timestep = 20;

      for (var i = 0; i < this.currentLevel.length; i ++) {
        if (this.currentLevel[i].mode === this.mode) {
          timestep = this.currentLevel[i].time;
        }
      }

      this.setAlarm(timestep);
    }

  },

  createXQuestion: function(){

    var min, max, char, answer, m, 
      helptxt = '',
      orderOfX = this.getRandomInt(0, 1),
      xCharacter = ['A', 'C', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'T', 'U', 'V', 'X', 'Y', 'Z'][this.getRandomInt(0, 19)];

    m = this.getRandomInt(0, this.modes.length-1);
    this.mode = this.modes[m];

    for (var i = 0; i < this.currentLevel.length; i ++) {
      if (this.currentLevel[i].mode === this.mode) {
        min = this.currentLevel[i].min;
        max = this.currentLevel[i].max;
        char = this.currentLevel[i].char;
      }
    }

    if (this.mode === 'plus') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(min, max);
    }
    if (this.mode === 'multi') {
      if (orderOfX===0) {
        // Se till att det inte blir 0 x X = 0
        tal1 = this.getRandomInt(Math.max(1, min), max);
        tal2 = this.getRandomInt(min, max);
      } else {
        tal1 = this.getRandomInt(min, max);
        tal2 = this.getRandomInt(Math.max(1, min), max);
      }
    }
    if (this.mode === 'minus') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(Math.min(min, tal1), Math.min(tal1, max));
    }


    if (this.mode === 'plus') {
      answer = tal1+tal2;
    }
    if (this.mode === 'minus') {
      answer = tal1-tal2;
    }
    if (this.mode === 'multi') {
      answer = tal1*tal2;

      if (!this.contest && (tal1 !== 0 && tal2 !== 0) && tal1 <= 10 && tal2 <= 10) {
        helptxt = this.getHelpUnits(tal1, tal2);
        /*for (var i = 0; i < tal1; i++) {
          helptxt += this.getHelpUnit(tal2);
        }*/
        this.updateHelp(helptxt);
      } else {
        this.updateHelp('');
      }
    } else {
      this.updateHelp('');
    }

    
    if (orderOfX === 0) {
      this.currentAnswer = tal2;
      this.currentCorrectReward = Math.ceil(answer*1.5);
      q = {
        question: tal1 + ' ' + char + ' '+xCharacter+' = ' + answer + '<br>Vad blir '+xCharacter+'?'
      };
    } else {
      this.currentAnswer = tal1;
      this.currentCorrectReward = Math.ceil(answer*1.5);
      q = {
        question: xCharacter + ' ' + char + ' ' + tal2 + ' = ' + answer + '<br>Vad blir '+xCharacter+'?'
      };
    }


    return q;
  },

  createQuestion: function(){

    var min, minb, max, maxb, char, answer, m, helptxt = '', customDifficulty = false;

    m = this.getRandomInt(0, this.modes.length-1);
    this.mode = this.modes[m];

    for (var i = 0; i < this.currentLevel.length; i ++) {
      if (this.currentLevel[i].mode === this.mode) {
        min = this.currentLevel[i].min;
        minb = this.currentLevel[i].minb;
        max = this.currentLevel[i].max;
        maxb = this.currentLevel[i].maxb;
        char = this.currentLevel[i].char;
      }
    }

    if (this.mode === 'plus') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(min, max);
    }
    if (this.mode === 'minus') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(Math.min(min, tal1), Math.min(tal1, max));
    }
    if (this.mode === 'multi') {
      if (minb !== undefined) {
        customDifficulty = true;
        if (this.getRandomInt(0,1)===0) {
          tal1 = this.getRandomInt(min, max);
          tal2 = this.getRandomInt(minb, maxb);
        } else {
          tal1 = this.getRandomInt(minb, maxb);
          tal2 = this.getRandomInt(min, max);
        }
      } else {
        tal1 = this.getRandomInt(min, max);
        tal2 = this.getRandomInt(min, max);
      }
    };

    if (this.mode === 'plus') {
      answer = tal1+tal2;
    }
    if (this.mode === 'minus') {
      answer = tal1-tal2;
    }
    if (this.mode === 'multi') {
      answer = tal1*tal2;

      if (!this.contest && (tal1 !== 0 && tal2 !== 0) && (tal1 <= 10 && tal2 <= 10)) {
        helptxt = this.getHelpUnits(tal1, tal2);
        /*for (var i = 0; i < tal1; i++) {
          helptxt += this.getHelpUnit(tal2);
        }*/
        this.updateHelp(helptxt);
      } else {
        this.updateHelp('');
      }
    } else {
      this.updateHelp('');
    }


    this.currentAnswer = answer;
    this.currentCorrectReward = answer;


    q = {
      question: 'Vad blir ' + tal1 + ' '+char+' ' + tal2 + '?'
    };

    return q;
  },


  createTestQuestion: function(){

    var min, minb, max, maxb, char, answer, m, helptxt = '', customDifficulty = false;

    m = this.getRandomInt(0, this.modes.length-1);
    this.mode = this.modes[m];

    for (var i = 0; i < this.currentLevel.length; i ++) {
      if (this.currentLevel[i].mode === this.mode) {
        min = this.currentLevel[i].min;
        minb = this.currentLevel[i].minb;
        max = this.currentLevel[i].max;
        maxb = this.currentLevel[i].maxb;
        char = this.currentLevel[i].char;
      }
    }

    if (this.mode === 'plus') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(min, max);
    }
    if (this.mode === 'minus') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(Math.min(min, tal1), Math.min(tal1, max));
    }
    if (this.mode === 'multi') {
      if (minb !== undefined) {
        customDifficulty = true;
        if (this.getRandomInt(0,1)===0) {
          tal1 = this.getRandomInt(min, max);
          tal2 = this.getRandomInt(minb, maxb);
        } else {
          tal1 = this.getRandomInt(minb, maxb);
          tal2 = this.getRandomInt(min, max);
        }
      } else {
        tal1 = this.getRandomInt(min, max);
        tal2 = this.getRandomInt(min, max);
      }
    };

    if (this.mode === 'plus') {
      answer = tal1+tal2;
    }
    if (this.mode === 'minus') {
      answer = tal1-tal2;
    }
    if (this.mode === 'multi') {
      answer = tal1*tal2; 
    }

    this.updateHelp('');

    this.currentAnswer = answer;
    this.currentCorrectReward = answer;

    ret = {
      q: {
        tal1: tal1,
        char: char,
        tal2: tal2,
        question: '' + tal1 + ' '+char+' ' + tal2 + ' ='
      },
      a: {
        answer: answer
      }
    }

    return ret;
  },

  getHelpUnits: function(qty, innerQty){

    var type = ['car', 'eye', 'user-secret'][this.getRandomInt(0,2)],
        txt,
        clr = [this.getRandomInt(100, 255), this.getRandomInt(100, 255), this.getRandomInt(100, 255)],
        unit = '';

    if (type === 'car') {
      txt = '<p><em>' + qty + ' garage med ' + innerQty + ' bilar i varje.</em></p>';
    }
    if (type === 'eye'){
      txt = '<p><em>' + qty + ' ansikten med ' + innerQty + ' ögon på varje.</em></p>';
    }
    if (type === 'user-secret'){
      txt = '<p><em>' + qty + ' rum med ' + innerQty + ' detektiver i varje.</em></p>';
    }

    for (var q = 0; q < qty; q++) {
      unit += '<div style="background-color: rgb('+clr.join(',')+');" class="help-unit '+type+'">';
      for (var i = 0; i < innerQty; i++) {
        unit+='<div class="help-cell"><i class="fa fa-'+type+'"></i></div>';
      }
      unit += '</div>';
    }

    return txt+unit;
  },

  updateQuestionText: function(txt){
    this.qEl.html(txt);
  },
  updateFeedbackText: function(txt){
    this.fEl.html(txt);
  },
  updateTestFeedbackText: function(txt){
    this.tfEl.html(txt);
  },
  updateScoreText: function(txt){
    this.sEl.html(txt);
  },
  updateMenuScoreText: function(trainingscore, contestscore){
    this.msEl.html('<span style="padding-right: 20px;"><strong class="training-label">Träning:</strong> <span class="training-score-label">'+trainingscore+'&nbsp;<i class="fa fa-trophy" style="color: orange;" aria-hidden="true"></i></span></span>'+
    '<span style="white-space: nowrap"><strong class="contest-label">Tävling:</strong> <span class="contest-score-label">'+contestscore+'&nbsp;<i class="fa fa-trophy" style="color: orange;" aria-hidden="true"></i></span></span>');
  },
  updateHelp: function(html) {
    this.hEl.html(html);
  },

  onCorrectAnswer: function(){

    var score = Math.max(this.currentCorrectReward, 1);
    var bonus;
    if (this.contest) {
      bonus = Math.round(this.time / this.alarm * 10);
    } else {
      bonus = 0;
    }

    var totalscore = bonus + score;
    this.score += totalscore;
    this.updateScoreText(this.score);

    if (this.contest) {
      localStorage.setItem('contestscore', this.score);
    } else {
      localStorage.setItem('trainingscore', this.score);
    }

    this.alarmStopped = true;
    $('#answerButton').attr('disabled', true);

    var feedbacktxt = '<div class="box green-box"><h3>Rätt!</h3> Du fick <strong>'+score+'</strong> poäng.<br>';
    if (this.contest) {
      feedbacktxt += 'Du fick <strong>'+bonus+'</strong> i tidsbonus.';
      feedbacktxt += '<br><h4>Total poäng: <strong>'+totalscore+'</strong></h4><br>';
    }
    feedbacktxt += '<br><button id="newQuestion" class="btn-small-3d" onclick="game.createNewQuestion()">Ny fråga</button></div>';

    this.updateHelp('');
    this.updateFeedbackText(feedbacktxt);

    $('#newQuestion').focus();

  },

  onWrongAnswer: function(txt){
    wrongtxt = txt ? txt : '<h3>Fel svar. Försök igen!</h3>';
    this.updateFeedbackText('<div class="box red-box">' + wrongtxt + '</div>');
  },

  countDown: function(seconds, callbackFn){
    // add a div to the body with id="countdown"
    $('body').append('<div id="countdown" class="countdown"><div class="countdown-text"></div></div>');
    var countdown = $('#countdown');
    var countdownText = $('#countdown .countdown-text');
    countdownText.html(seconds || 5);
    countdown.show();

    var interval = setInterval(function(){
      seconds--;
      countdownText.html(seconds);
      if (seconds === 0) {
        clearInterval(interval);
        countdown.hide();
        //remove countdown div from the body
        countdown.remove();
        if (callbackFn && typeof callbackFn === 'function') {
          callbackFn();
        }
      }
    }, 1000);
  },

  // a function that keeps track of math test game time. It takes a number of seconds as argument and a callback function that will be called when the time is up.
  // It displays the current time (in minutes:seconds) in a div with id="gametime"
  initGameTime: function(seconds, callbackFn){
    // add a div to the body with id="gametime"
    $('body').append('<div id="gametime" class="gametime"><div class="gametime-text"></div></div>');
    var gametime = $('#gametime');
    var gametimeText = $('#gametime .gametime-text');
    gametimeText.html(this.formatTime(seconds));
    gametime.show();
    game.gametime = seconds;

    game.gameTimeInterval = setInterval(function(){
      seconds--;
      // Store current gametime in a variable
      game.gametime = seconds;
      gametimeText.html(this.formatTime(seconds));
      if (seconds === 0) {
        clearInterval(game.gameTimeInterval);
        gametime.hide();
        //remove gametime div from the body
        gametime.remove();
        if (callbackFn && typeof callbackFn === 'function') {
          callbackFn();
        }
      }
    }.bind(this), 1000);
  },

  stopGameTime: function(){
    $('#gametime').hide();
    $('#gametime').remove();
    clearInterval(game.gameTimeInterval);
    // return how much time is left in seconds
    return game.gametime;
  },

  formatTime: function(seconds){
    var minutes = Math.floor(seconds / 60);
    var seconds = seconds % 60;
    if (seconds < 10) {
      seconds = '0'+seconds;
    }
    return minutes + ':' + seconds;
  }



}


$(document).ready(function() {
  game.loadSettings();
  game.loadCustomDifficultySettings();

  var settingsButton = $('#settingsButton');
  settingsButton.on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.setEl.show();

    game.loadCustomDifficultySettings();

  })

  var settingsBackButton = $('#settingsclose');
  settingsBackButton.on('click', function(e){
    e.preventDefault();
    game.el.hide();
    game.setEl.hide();
    game.mEl.show();
    
    // Visa aktuell poäng
    var trainingscore = localStorage.getItem('trainingscore') ? parseInt(localStorage.getItem('trainingscore')) : 0;
    var contestscore = localStorage.getItem('contestscore') ? parseInt(localStorage.getItem('contestscore')) : 0;
    game.updateMenuScoreText(trainingscore, contestscore);
  });

  var saveSettingsButton = $('#saveSettings');
  saveSettingsButton.on('click', function(e){
    e.preventDefault();
    game.saveCustomSettings();
    game.setEl.hide();
    game.mEl.show();
  })
  
  var clearSettingsButton = $('#clearSettings');
  clearSettingsButton.on('click', function(e){
    e.preventDefault();
    $('[name=mina]').val(0);
    $('[name=maxa]').val(10);
    $('[name=minb]').val(0);
    $('[name=maxb]').val(10);
    $('[name=test-nbr-of-questions]').val(50);
    $('[name=test-time]').val(300);
  });


  var trainingButton = $('#trainingButton');
  trainingButton.on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.el.show();
    game.startGame('training');
  })


  var contestButton = $('#contestButton');
  contestButton.on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.el.show();
    game.startGame('contest');
  })

  var testButton = $('#testButton');
  testButton.on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.tEl.show();
    game.startTest();
  })


  var answerButton = $('#answerButton');
  answerButton.on('click', function(e){
    e.preventDefault();
    var answer = $('#answerField').val();
    
    if (answer !== '') {
      answer = parseInt(answer, 10);

      if (answer === game.currentAnswer) {
        game.onCorrectAnswer();

      } else {
        game.onWrongAnswer();
      }
    }
  });

  // listen to click event on document using jquery proxy function
  $(document).on('click', '#correctTest', $.proxy(function(e){
    e.preventDefault();
    var correctAnswers = 0;
    var totalAnswers = 0;
    var answers = $('input[type=number][data-type=test-input]');

    // make the button correctTest disabled
    $('#correctTest').attr('disabled', true);
    
    for (var i = 0; i < answers.length; i++) {
      var answer = answers[i];

      // make answer input read only
      $(answer).attr('readonly', true);

      var correctAnswer = parseInt($(answer).attr('data-answer'));
      var userAnswer = parseInt($(answer).val());
      if (correctAnswer === userAnswer) {
        correctAnswers++;
        // add 'correct-answer' class to input
        $(answer).addClass('correct-answer');
      } else {
        // add 'wrong-answer' class to input
        $(answer).addClass('wrong-answer');
      }
      totalAnswers++;
    }
    var score = correctAnswers / totalAnswers * 100;

    // round score to 2 decimals
    score = Math.round(score * 100) / 100;

    var feedbacktxt = '<div class="box test-result-box"><h1>Bra jobbat!</h1>'+
    '<p>Total poäng:</p>'+
    '<div class="big-result"><span class="green-text">' + correctAnswers + '</span> / <span class="blue-text"><strong>'+totalAnswers+'</strong></span> </div>';
    feedbacktxt += '<p><strong>(<span class="xgreen-text">'+score+' %</span>)</strong></p>';
    // Alse stop the game time and add remaining time to feedback text
    var remainingTime = game.stopGameTime();
    var startTime = game.testmode[game.currentDifficulty].time;
    var usedTime = startTime - remainingTime;
    //feedbacktxt += '<p>Du hade <strong><span class="green-text">'+game.formatTime(remainingTime)+'</span></strong> kvar av tiden</p>';
    feedbacktxt += '<p>Din tid: <strong><span class="green-text">'+game.formatTime(usedTime)+'</span></strong></p>';
    // print average time per question
    var averageTimePerQuestion = usedTime / correctAnswers;
    feedbacktxt += '<p>Snitt per rätt svar: <strong><span class="green-text">'+averageTimePerQuestion+'</span> s</strong></p>'; 
    feedbacktxt += '<br><button style="margin-bottom: 100px;" id="newQuestion" class="btn-small-3d" onclick="game.startTest()">Nytt test</button>';
    feedbacktxt += '</div>';

    this.updateTestFeedbackText(feedbacktxt);

    // Scroll to bottom
    $('html, body').animate({scrollTop: $(document).height()}, 'slow');

  }, game));



  var testBackButton = $('#testback');
  testBackButton.on('click', function(e){
    e.preventDefault();
    game.tEl.hide();
    game.mEl.show();

    game.stopGameTime();
    
    // Visa aktuell poäng
    var trainingscore = localStorage.getItem('trainingscore') ? parseInt(localStorage.getItem('trainingscore')) : 0;
    var contestscore = localStorage.getItem('contestscore') ? parseInt(localStorage.getItem('contestscore')) : 0;
    game.updateMenuScoreText(trainingscore, contestscore);
  });

  var backButton = $('#back');
  backButton.on('click', function(e){
    e.preventDefault();
    game.el.hide();
    game.mEl.show();
    
    // Visa aktuell poäng
    var trainingscore = localStorage.getItem('trainingscore') ? parseInt(localStorage.getItem('trainingscore')) : 0;
    var contestscore = localStorage.getItem('contestscore') ? parseInt(localStorage.getItem('contestscore')) : 0;
    game.updateMenuScoreText(trainingscore, contestscore);
  });


  // Lyssna på enter
  var answerField = $('#answerField');
  answerField.on('keyup', function(e){
    e.preventDefault();
    var answerButton = $('#answerButton');
    // if button is enter then call same function as if answerbutton was clicked
    if (e.keyCode === 13) {
      // check so answerbutton isn't disabled
      if (!answerButton.attr('disabled')) {
        answerButton.click();
      }
    }
  });

  // listen to number input by keyup, all fields with data-type=test-input, by listening on document using jquerys proxy function
  $(document).on('keyup', 'input[type=number][data-type=test-input]', $.proxy(function(e){
    e.preventDefault();
    if (e.keyCode === 13) {
      var answer = $(e.currentTarget).val();
      // if answer is not empty
      if (answer !== '') {
        answer = parseInt(answer, 10);
        // if answer is not a number
        if (isNaN(answer)) {
          $(e.currentTarget).val('');
        } else {
          // set focus in the next input field
          var elName = $(e.currentTarget).attr('name');
          var elNumber = parseInt(elName.substring(1, elName.length));
          var nextElNumber = elNumber + 1;
          var nextEl = $('input[name=q'+nextElNumber+']');
          if (nextEl.length > 0) {
            nextEl.focus();
          } else {
            // if no more input fields then click correctTest button
            $('#correctTest').click();
          }

          
        }
      }
    }
  }, game));



  $('.meter').on('click', function(){
    var me = $(this);
    var inp = me.siblings('input');
    inp.prop("checked", true);
  })

  // Visa aktuell poäng
  var trainingscore = localStorage.getItem('trainingscore') ? parseInt(localStorage.getItem('trainingscore')) : 0;
  var contestscore = localStorage.getItem('contestscore') ? parseInt(localStorage.getItem('contestscore')) : 0;
  game.updateMenuScoreText(trainingscore, contestscore);

});
