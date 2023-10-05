var game = {
  el: $('#game'),
  qEl: $('#questionText'),
  mEl: $('#menu'),
  setEl: $('#settings'),
  fEl: $('#feedback'),
  sEl: $('#score'),
  msEl: $('#menu-score'),
  cEl: $('#counter'),
  hEl: $('#help'),
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

  },


  startGame: function(contest){

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
    this.contest = contest;
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
    
    $('#answerButton').attr('disabled', false);
    this.updateFeedbackText('');
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
    feedbacktxt += '<br><button class="btn-small-3d" onclick="game.createNewQuestion()">Ny fråga</button></div>';

    this.updateHelp('');
    this.updateFeedbackText(feedbacktxt);


  },

  onWrongAnswer: function(txt){
    wrongtxt = txt ? txt : '<h3>Fel!</h3>';
    this.updateFeedbackText('<div class="box red-box">' + wrongtxt + '</div>');
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
    
  });


  var trainingButton = $('#trainingButton');
  trainingButton.on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.el.show();
    game.startGame(false);
  })


  var contestButton = $('#contestButton');
  contestButton.on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.el.show();
    game.startGame(true);
  })



  var answerButton = $('#answerButton');
  answerButton.on('click', function(e){
    e.preventDefault();
    var answer = $('#answerField').val();
    answer = parseInt(answer, 10);

    if (answer === game.currentAnswer) {
      game.onCorrectAnswer();

    } else {
      game.onWrongAnswer();
    }
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
  })


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
