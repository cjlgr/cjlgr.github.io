var game = {
  el: $('#game'),
  qEl: $('#questionText'),
  mEl: $('#menu'),
  fEl: $('#feedback'),
  sEl: $('#score'),
  msEl: $('#menu-score'),
  cEl: $('#counter'),
  hEl: $('#help'),
  currentAnswer: null,
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
        time: 30
      }
    ]
  },
  currentLevel: [],

  startGame: function(contest){

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
    var q = this.createQuestion();
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

  createQuestion: function(){

    var min, max, char, answer, m, helptxt = '';

    m = this.getRandomInt(0, this.modes.length-1);
    this.mode = this.modes[m];

    for (var i = 0; i < this.currentLevel.length; i ++) {
      if (this.currentLevel[i].mode === this.mode) {
        min = this.currentLevel[i].min;
        max = this.currentLevel[i].max;
        char = this.currentLevel[i].char;
      }
    }

    if (this.mode === 'plus' || this.mode === 'multi') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(min, max);
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

      if (!this.contest && (tal1 !== 0 && tal2 !== 0)) {
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

    var score = Math.max(this.currentAnswer, 1);
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
