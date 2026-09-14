var game = {
  el: $('#game'),
  qEl: $('#questionText'),
  mEl: $('#menu'),
  setEl: $('#settings'),
  teacherEl: $('#teacher'),
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
  showTraining: true,
  showContest: true,
  hideVisualHelp: false,
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

  // Läser ut korta url-parametrar, t.ex. ?t=y för lärarläge.
  // Utan parametern är vyn den vanliga elevvyn.
  getUrlParam: function(name){
    var params = new URLSearchParams(window.location.search);
    var value = params.get(name) || params.get(name.toUpperCase());
    return value ? value.toLowerCase() : null;
  },
  // Som getUrlParam men bevarar skiftläge - behövs för base64-kodade parametrar (t.ex. ?s=)
  getUrlParamRaw: function(name){
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || params.get(name.toUpperCase());
  },
  isTeacher: function(){
    return game.getUrlParam('t') === 'y';
  },

  // Placerar de synliga ikonerna (kugghjul/mössa/leende) tätt intill varandra uppe till höger,
  // istället för att lämna tomma luckor efter dolda ikoner.
  layoutMenuIcons: function(){
    var order = ['#settingsButton', '#teacherButton', '#collectionButton'];
    var slot = 0;
    for (var i = 0; i < order.length; i++) {
      if ($(order[i]).is(':visible')) {
        $(order[i]).css('right', (slot * 55) + 'px');
        slot++;
      }
    }
  },

  // Gör elevlänkens kod lite mindre lättläst/redigerbar för en nyfiken elev (ingen riktig säkerhet,
  // bara base64url så att man inte rakt av kan se/ändra "yynyyyn..." i adressfältet).
  base64UrlEncode: function(str){
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  base64UrlDecode: function(str){
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  },

  // Kort, positionsbaserad kod för elevlänken:
  // ?s=<träning><tävling><test><lätt><normal><svår><anpassad><plus><minus><gånger><x><plus-f><minus-f><gånger-f><x-f><visuell hjälp>-<mina>-<maxa>-<minb>-<maxb>-<antal frågor>-<tid>
  // (positionerna med "-f" är vilka räknesätt som är förvalda/ikryssade av de tillåtna)
  // t.ex. s=yynyyynynnnnyny y-0-10-0-10-50-300 (utan mellanslaget) -> träning på, tävling på, test av, eleven
  // får välja mellan Lätt/Normal/Svår (inte Anpassad), bara Gånger tillåtet (och därmed förvalt/låst),
  // visuell hjälp vid multiplikation på, multiplikation 0-10 x 0-10, test med 50 frågor på 300 sekunder
  difficultyOrder: ['infant', 'easy', 'medium', 'hard'],
  difficultyLabels: { infant: 'Lätt', easy: 'Mellan', medium: 'Svår', hard: 'Anpassad' },
  methodLabels: ['Plus', 'Minus', 'Gånger', 'Räkna med X'],

  // Kopplar ihop Tillåtet/Förval per räknesätt i lärarvyn så de inte kan hamna i motsägelse:
  // ett förval kräver att räknesättet är tillåtet, och ett otillåtet räknesätt kan inte vara förvalt.
  methodTogglePairs: [
    ['#checkAllowAdd', '#checkDefaultAdd'],
    ['#checkAllowSub', '#checkDefaultSub'],
    ['#checkAllowMult', '#checkDefaultMult'],
    ['#checkAllowX', '#checkDefaultX']
  ],

  syncMethodToggles: function(){
    game.methodTogglePairs.forEach(function(pair){
      var allowed = $(pair[0]).is(':checked');
      $(pair[1]).prop('disabled', !allowed);
      if (!allowed) {
        $(pair[1]).prop('checked', false);
      }
    });
  },

  loadStudentViewSettings: function(){
    var saved = localStorage.getItem('studentViewSettings');
    var settings = saved ? JSON.parse(saved) : {
      training: true, contest: true, test: true,
      allowInfant: true, allowEasy: true, allowMedium: true, allowHard: true,
      allowAdd: true, allowSub: true, allowMult: true, allowX: true,
      defaultAdd: true, defaultSub: false, defaultMult: false, defaultX: false,
      forceX: false
    };

    $('#checkShowTraining').prop('checked', settings.training);
    $('#checkShowContest').prop('checked', settings.contest);
    $('#checkShowTest').prop('checked', settings.test);
    $('#checkAllowInfant').prop('checked', settings.allowInfant);
    $('#checkAllowEasy').prop('checked', settings.allowEasy);
    $('#checkAllowMedium').prop('checked', settings.allowMedium);
    $('#checkAllowHard').prop('checked', settings.allowHard);
    $('#checkAllowAdd').prop('checked', settings.allowAdd);
    $('#checkAllowSub').prop('checked', settings.allowSub);
    $('#checkAllowMult').prop('checked', settings.allowMult);
    $('#checkAllowX').prop('checked', settings.allowX);
    $('#checkDefaultAdd').prop('checked', settings.defaultAdd);
    $('#checkDefaultSub').prop('checked', settings.defaultSub);
    $('#checkDefaultMult').prop('checked', settings.defaultMult);
    $('#checkDefaultX').prop('checked', settings.defaultX);
    $('#checkForceX').prop('checked', settings.forceX);
    game.syncMethodToggles();
    if (settings.forceX) {
      $('#checkAllowX').prop('disabled', true);
      $('#checkDefaultX').prop('disabled', true);
    }
  },

  // Läser bara av kryssrutorna, utan att spara - används för att bygga elevlänken
  // med det som just nu står i fälten, oavsett om det sparats än eller inte.
  getStudentViewSettingsFromFields: function(){
    return {
      training: $('#checkShowTraining').is(':checked'),
      contest: $('#checkShowContest').is(':checked'),
      test: $('#checkShowTest').is(':checked'),
      allowInfant: $('#checkAllowInfant').is(':checked'),
      allowEasy: $('#checkAllowEasy').is(':checked'),
      allowMedium: $('#checkAllowMedium').is(':checked'),
      allowHard: $('#checkAllowHard').is(':checked'),
      allowAdd: $('#checkAllowAdd').is(':checked'),
      allowSub: $('#checkAllowSub').is(':checked'),
      allowMult: $('#checkAllowMult').is(':checked'),
      allowX: $('#checkAllowX').is(':checked'),
      defaultAdd: $('#checkDefaultAdd').is(':checked'),
      defaultSub: $('#checkDefaultSub').is(':checked'),
      defaultMult: $('#checkDefaultMult').is(':checked'),
      defaultX: $('#checkDefaultX').is(':checked'),
      forceX: $('#checkForceX').is(':checked')
    };
  },

  saveStudentViewSettings: function(){
    var settings = game.getStudentViewSettingsFromFields();
    localStorage.setItem('studentViewSettings', JSON.stringify(settings));
    return settings;
  },

  buildStudentLinkCode: function(settings){
    var flags = (settings.training ? 'y' : 'n') +
      (settings.contest ? 'y' : 'n') +
      (settings.test ? 'y' : 'n') +
      (settings.allowInfant ? 'y' : 'n') +
      (settings.allowEasy ? 'y' : 'n') +
      (settings.allowMedium ? 'y' : 'n') +
      (settings.allowHard ? 'y' : 'n') +
      (settings.allowAdd ? 'y' : 'n') +
      (settings.allowSub ? 'y' : 'n') +
      (settings.allowMult ? 'y' : 'n') +
      (settings.allowX ? 'y' : 'n') +
      (settings.defaultAdd ? 'y' : 'n') +
      (settings.defaultSub ? 'y' : 'n') +
      (settings.defaultMult ? 'y' : 'n') +
      (settings.defaultX ? 'y' : 'n') +
      (game.hideVisualHelp ? 'n' : 'y') +
      (settings.forceX ? 'y' : 'n');

    var hardLevel = game.levels.hard[2];
    var hardTest = game.testmode.hard;
    var mult = [hardLevel.min, hardLevel.max, hardLevel.minb, hardLevel.maxb];
    var test = [hardTest.numberOfQuestions, hardTest.time];

    return [flags].concat(mult).concat(test).join('-');
  },

  // Applicera ?s=-koden på elevens vy (döljer knappar/räknesätt/svårighetsgrader
  // samt multiplikations- och testinställningar för Anpassad)
  applyStudentViewFromUrl: function(){
    var raw = game.getUrlParamRaw('s');
    if (!raw) {
      return;
    }
    var code;
    try {
      code = game.base64UrlDecode(raw);
    } catch (e) {
      return;
    }
    var parts = code.split('-');
    var flags = parts[0];
    if (!flags || flags.length !== 17) {
      return;
    }

    game.hideVisualHelp = flags.charAt(15) === 'n';

    if (flags.charAt(0) === 'n') { $('#trainingButton').hide(); game.showTraining = false; }
    if (flags.charAt(1) === 'n') { $('#contestButton').hide(); game.showContest = false; }
    if (flags.charAt(2) === 'n') { $('#testButton').hide(); }

    // svårighetsgrader eleven får välja på (positioner 3-6)
    var difficultyRadioIds = { infant: '#radioInfant', easy: '#radioEasy', medium: '#radioMedium', hard: '#radioHard' };
    var allowedDifficulties = [];
    for (var d = 0; d < game.difficultyOrder.length; d++) {
      if (flags.charAt(3 + d) === 'y') {
        allowedDifficulties.push(game.difficultyOrder[d]);
      } else {
        $(difficultyRadioIds[game.difficultyOrder[d]]).closest('.radio-wrapper').hide();
      }
    }
    // om läraren råkat bocka ur alla, låt eleven ändå välja mellan alla för att inte låsa spelet
    if (allowedDifficulties.length === 0) {
      allowedDifficulties = game.difficultyOrder.slice();
      $('.difficulty .radio-wrapper').show();
    }
    if (allowedDifficulties.indexOf($('[name=difficulty]:checked').val()) === -1) {
      $(difficultyRadioIds[allowedDifficulties[0]]).prop('checked', true);
    }
    if (allowedDifficulties.length === 1) {
      $('#menuDifficulty').hide();
    }

    // räknesätt: vilka som är tillåtna (positioner 7-10) och vilka av dem som är förvalda (positioner 11-14)
    var methodCheckboxIds = ['#checkAdd', '#checkSub', '#checkMult', '#checkX'];
    var allowedMethods = [];
    for (var i = 0; i < methodCheckboxIds.length; i++) {
      if (flags.charAt(7 + i) === 'y') {
        allowedMethods.push(i);
        $(methodCheckboxIds[i]).prop('checked', flags.charAt(11 + i) === 'y');
      } else {
        $(methodCheckboxIds[i]).prop('checked', false).parent().hide();
      }
    }
    // om inget av de tillåtna räknesätten blev förvalt, tvinga på det första så eleven aldrig står utan ett
    var anyMethodChecked = false;
    for (var j = 0; j < allowedMethods.length; j++) {
      if ($(methodCheckboxIds[allowedMethods[j]]).is(':checked')) { anyMethodChecked = true; break; }
    }
    if (!anyMethodChecked && allowedMethods.length > 0) {
      $(methodCheckboxIds[allowedMethods[0]]).prop('checked', true);
    }
    // om bara ett räknesätt är tillåtet finns inget att välja - lås det och dölj kryssrutan
    if (allowedMethods.length === 1) {
      $(methodCheckboxIds[allowedMethods[0]]).prop('checked', true).parent().hide();
    }

    // Tvinga Räkna med X: oavsett vilka övriga räknesätt som är tillåtna ska X alltid vara på
    // och inte gå att stänga av (positioner 7-10 avgör bara om X är valbart, inte om det är tvingat)
    var forceX = flags.charAt(16) === 'y';
    if (forceX) {
      $('#checkX').prop('checked', true).parent().hide();
    }

    // Räknesätt och/eller svårighetsgrad kan bli helt dolda ovan (om läraren bara tillåtit ett val) -
    // visa då en liten infotext så eleven ser vilket läge hen faktiskt spelar i.
    var lockedInfoParts = [];
    if (allowedMethods.length === 1) {
      lockedInfoParts.push('Räknesätt: <strong>' + game.methodLabels[allowedMethods[0]] + '</strong>');
    }
    if (forceX) {
      lockedInfoParts.push('Räkna med X: <strong>Ja</strong>');
    }
    if (allowedDifficulties.length === 1) {
      lockedInfoParts.push('Svårighetsgrad: <strong>' + game.difficultyLabels[allowedDifficulties[0]] + '</strong>');
    }
    if (lockedInfoParts.length > 0) {
      $('#studentModeInfo').html(lockedInfoParts.join('<br>')).show();
    }

    // valfria multiplikations- och testinställningar (Anpassad), på formen -mina-maxa-minb-maxb-antal-tid
    if (parts.length === 7) {
      var mina = parseInt(parts[1], 10);
      var maxa = parseInt(parts[2], 10);
      var minb = parseInt(parts[3], 10);
      var maxb = parseInt(parts[4], 10);
      var numberOfQuestions = parseInt(parts[5], 10);
      var time = parseInt(parts[6], 10);

      if (!isNaN(mina) && !isNaN(maxa) && !isNaN(minb) && !isNaN(maxb)) {
        game.levels.hard[2].min = mina;
        game.levels.hard[2].max = maxa;
        game.levels.hard[2].minb = minb;
        game.levels.hard[2].maxb = maxb;
        $('[name=mina]').val(mina);
        $('[name=maxa]').val(maxa);
        $('[name=minb]').val(minb);
        $('[name=maxb]').val(maxb);
      }
      if (!isNaN(numberOfQuestions)) {
        game.testmode.hard.numberOfQuestions = numberOfQuestions;
        $('[name=test-nbr-of-questions]').val(numberOfQuestions);
      }
      if (!isNaN(time)) {
        game.testmode.hard.time = time;
        $('[name=test-time]').val(time);
      }
    }
  },

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

  // Multiplikation/Test-fälten finns i två vyer (vanliga inställningar och lärarvyn).
  // fields låter respektive vy peka ut sina egna input-element; standard är de vanliga.
  getMultTestFields: function(fields){
    return fields || {
      mina: $('[name=mina]'),
      maxa: $('[name=maxa]'),
      minb: $('[name=minb]'),
      maxb: $('[name=maxb]'),
      qty: $('[name=test-nbr-of-questions]'),
      time: $('[name=test-time]')
    };
  },

  getTeacherMultTestFields: function(){
    return {
      mina: $('#t-mina'),
      maxa: $('#t-maxa'),
      minb: $('#t-minb'),
      maxb: $('#t-maxb'),
      qty: $('#t-test-nbr-of-questions'),
      time: $('#t-test-time')
    };
  },

  saveHideVisualHelpSetting: function(field){
    field = field || $('#checkHideVisualHelp');
    var hideVisualHelp = field.is(':checked');
    localStorage.setItem('hideVisualHelp', hideVisualHelp);
    game.hideVisualHelp = hideVisualHelp;
  },

  loadHideVisualHelpSetting: function(field){
    field = field || $('#checkHideVisualHelp');
    var hideVisualHelp = localStorage.getItem('hideVisualHelp') === 'true';
    field.prop('checked', hideVisualHelp);
    game.hideVisualHelp = hideVisualHelp;
  },

  saveCustomSettings: function(fields){
    fields = game.getMultTestFields(fields);
    localStorage.setItem('mina', fields.mina.val());
    localStorage.setItem('minb', fields.minb.val());
    localStorage.setItem('maxa', fields.maxa.val());
    localStorage.setItem('maxb', fields.maxb.val());
    game.levels.hard[2].min = parseInt(localStorage.getItem('mina'));
    game.levels.hard[2].max = parseInt(localStorage.getItem('maxa'));
    game.levels.hard[2].minb = parseInt(localStorage.getItem('minb'));
    game.levels.hard[2].maxb = parseInt(localStorage.getItem('maxb'));

    localStorage.setItem('testNbrOfQuestions', fields.qty.val());
    localStorage.setItem('testTime', fields.time.val());
    game.testmode.hard.numberOfQuestions = parseInt(localStorage.getItem('testNbrOfQuestions'));
    game.testmode.hard.time = parseInt(localStorage.getItem('testTime'));
  },

  loadCustomDifficultySettings: function(fields){
    fields = game.getMultTestFields(fields);
    // Load min/max values
    if (localStorage.getItem('mina')) {
      fields.mina.val(localStorage.getItem('mina'));
      fields.maxa.val(localStorage.getItem('maxa'));
      fields.minb.val(localStorage.getItem('minb'));
      fields.maxb.val(localStorage.getItem('maxb'));
      game.levels.hard[2].min = parseInt(localStorage.getItem('mina'));
      game.levels.hard[2].max = parseInt(localStorage.getItem('maxa'));
      game.levels.hard[2].minb = parseInt(localStorage.getItem('minb'));
      game.levels.hard[2].maxb = parseInt(localStorage.getItem('maxb'));
    } else {
      // Load defaults
      fields.mina.val(game.levels.hard[2].min);
      fields.maxa.val(game.levels.hard[2].max);
      fields.minb.val(game.levels.hard[2].minb);
      fields.maxb.val(game.levels.hard[2].maxb);
    }

    if (localStorage.getItem('testNbrOfQuestions')) { // test-nbr-of-questions
      fields.qty.val(localStorage.getItem('testNbrOfQuestions'));
      game.testmode.hard.numberOfQuestions = parseInt(localStorage.getItem('testNbrOfQuestions'));
    } else {
      fields.qty.val(game.testmode.hard.numberOfQuestions);
    }

    if (localStorage.getItem('testTime')) { // test-time
      fields.time.val(localStorage.getItem('testTime'));
      game.testmode.hard.time = parseInt(localStorage.getItem('testTime'));
    } else {
      fields.time.val(game.testmode.hard.time);
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
    this.updateEmojiProgress();
    $('#emojiProgress').show();
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
      questions.push(this.xMode ? this.createTestXQuestion() : this.createTestQuestion());
    }

    // add the question texts (questions[i].q.question) to the #testquestions element with a <br> between each question
    var qtxt = '';
    for (var i = 0; i < questions.length; i++) {
      qtxt += '<div class="test-question-text">' + questions[i].q.question + '</div>';
      qtxt += '<input name="q'+i+'" type="number" data-type="test-input" data-answer="'+questions[i].a.answer+'" data-reward="'+questions[i].a.reward+'"><br><br>';
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
    // Scroll to bottom
    $('html, body').animate({
      scrollTop: $(document).height()
    }, 100);
    // Correct the test
    this.correctTest();
  },

  correctTest: function(){
    var correctAnswers = 0;
    var totalAnswers = 0;
    var pointsEarned = 0;
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
        // Vanligtvis 10 poäng, men mindre om frågan hade ett för smalt (lätt memorerat) intervall
        pointsEarned += parseInt($(answer).attr('data-reward'), 10) || 10;
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

    // Test ger poäng till Tävling-samlingen
    var previousContestScore = localStorage.getItem('contestscore') ? parseInt(localStorage.getItem('contestscore')) : 0;
    var newContestScore = previousContestScore + pointsEarned;
    localStorage.setItem('contestscore', newContestScore);
    game.contest = true;
    game.score = newContestScore;
    var newlyUnlockedEmojis = game.getNewlyUnlockedEmojis(previousContestScore, newContestScore);

    var feedbacktxt = '<div class="box test-result-box"><h1>Bra jobbat!</h1>'+
    '<p>Total poäng:</p>'+
    '<div class="big-result"><span class="green-text">' + correctAnswers + '</span> / <span class="blue-text"><strong>'+totalAnswers+'</strong></span> </div>';
    feedbacktxt += '<p><strong>(<span class="xgreen-text">'+score+' %</span>)</strong></p>';
    feedbacktxt += '<p>Du fick <strong><span class="green-text">'+pointsEarned+'</span></strong> poäng!</p>';
    // Alse stop the game time and add remaining time to feedback text
    var remainingTime = game.stopGameTime();
    var startTime = game.testmode[game.currentDifficulty].time;
    var usedTime = startTime - remainingTime;
    //feedbacktxt += '<p>Du hade <strong><span class="green-text">'+game.formatTime(remainingTime)+'</span></strong> kvar av tiden</p>';
    feedbacktxt += '<p>Din tid: <strong><span class="green-text">'+game.formatTime(usedTime)+'</span></strong></p>';
    // print average time per question
    var averageTimePerQuestion = usedTime / correctAnswers;
    if (!averageTimePerQuestion || averageTimePerQuestion === Infinity) {
      averageTimePerQuestion = 0;
    }
    averageTimePerQuestion = Math.round(averageTimePerQuestion * 10) / 10;

    feedbacktxt += '<p>Snitt per rätt svar: <strong><span class="green-text">'+averageTimePerQuestion+'</span> s</strong></p>'; 
    feedbacktxt += '<br><button style="margin-bottom: 100px;" id="newQuestion" class="btn-small-3d" onclick="game.startTest()">Nytt test</button>';
    feedbacktxt += '</div>';

    this.updateTestFeedbackText(feedbacktxt);

    // Scroll to bottom
    $('html, body').animate({scrollTop: $(document).height()}, 'slow');

    // Stor emoji-burst av redan upplåsta emojis som en final när testet är slut
    if (correctAnswers > 0) {
      var ownedPool = game.getUnlockedEmojiPool(newContestScore);
      game.emojiBurst(ownedPool, game.getRandomInt(25, 40));
    }

    if (newlyUnlockedEmojis.length > 0) {
      $('#emojiUnlockList').text(newlyUnlockedEmojis.join(' '));
      $('#emojiUnlockPopup').css('display', 'flex');
      $('#emojiUnlockClose').focus();
    }
  },

  getRandomInt: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Som getRandomInt, men 0 (om det ens är möjligt i intervallet) slumpas bara fram en av sex gånger.
  // Annars blir svaret på multiplikationsfrågor alldeles för ofta bara 0.
  getRandomMultiplicationFactor: function(min, max){
    var value = this.getRandomInt(min, max);
    if (value === 0 && this.getRandomInt(1, 6) !== 1) {
      value = this.getRandomInt(Math.max(1, min), max);
    }
    return value;
  },

  // Om faktorernas intervall är för smalt (t.ex. samma tal varje gång i "Anpassad") går svaret
  // att memorera direkt istället för att räknas ut - då ska inte poängen få vara hög bara för att
  // faktorerna råkar vara stora tal. Dra ner belöningen kraftigt om det finns för få möjliga frågor.
  getMultiplicationReward: function(answer, min, max, minb, maxb){
    var rangeA = max - min + 1;
    var rangeB = (minb !== undefined && maxb !== undefined) ? (maxb - minb + 1) : rangeA;
    var comboCount = rangeA * rangeB;
    if (comboCount < 5) {
      return Math.min(answer, 3);
    }
    return answer;
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

      if (!this.contest && !game.hideVisualHelp && (tal1 !== 0 && tal2 !== 0) && tal1 <= 10 && tal2 <= 10) {
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

    
    var xReward = (this.mode === 'multi') ? this.getMultiplicationReward(answer, min, max) : answer;

    if (orderOfX === 0) {
      this.currentAnswer = tal2;
      this.currentCorrectReward = Math.ceil(xReward*1.5);
      q = {
        question: tal1 + ' ' + char + ' '+xCharacter+' = ' + answer + '<br>Vad blir '+xCharacter+'?'
      };
    } else {
      this.currentAnswer = tal1;
      this.currentCorrectReward = Math.ceil(xReward*1.5);
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
          tal1 = this.getRandomMultiplicationFactor(min, max);
          tal2 = this.getRandomMultiplicationFactor(minb, maxb);
        } else {
          tal1 = this.getRandomMultiplicationFactor(minb, maxb);
          tal2 = this.getRandomMultiplicationFactor(min, max);
        }
      } else {
        tal1 = this.getRandomMultiplicationFactor(min, max);
        tal2 = this.getRandomMultiplicationFactor(min, max);
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

      if (!this.contest && !game.hideVisualHelp && (tal1 !== 0 && tal2 !== 0) && (tal1 <= 10 && tal2 <= 10)) {
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
    this.currentCorrectReward = (this.mode === 'multi') ? this.getMultiplicationReward(answer, min, max, minb, maxb) : answer;


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
          tal1 = this.getRandomMultiplicationFactor(min, max);
          tal2 = this.getRandomMultiplicationFactor(minb, maxb);
        } else {
          tal1 = this.getRandomMultiplicationFactor(minb, maxb);
          tal2 = this.getRandomMultiplicationFactor(min, max);
        }
      } else {
        tal1 = this.getRandomMultiplicationFactor(min, max);
        tal2 = this.getRandomMultiplicationFactor(min, max);
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

    // Samma smala-intervall-spärr som i Träning/Tävling, annars ger Test alltid 10 poäng
    // per rätt svar även om multiplikationens faktorer är för lätta att memorera.
    var reward = (this.mode === 'multi') ? game.getMultiplicationReward(10, min, max, minb, maxb) : 10;

    ret = {
      q: {
        tal1: tal1,
        char: char,
        tal2: tal2,
        question: '' + tal1 + ' '+char+' ' + tal2 + ' ='
      },
      a: {
        answer: answer,
        reward: reward
      }
    }

    return ret;
  },

  createTestXQuestion: function(){

    var min, max, char, answer, m,
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
    }

    var questionText, correctAnswer;
    if (orderOfX === 0) {
      correctAnswer = tal2;
      questionText = tal1 + ' ' + char + ' ' + xCharacter + ' = ' + answer + '<br>Vad blir ' + xCharacter + '?';
    } else {
      correctAnswer = tal1;
      questionText = xCharacter + ' ' + char + ' ' + tal2 + ' = ' + answer + '<br>Vad blir ' + xCharacter + '?';
    }

    this.currentAnswer = correctAnswer;
    this.currentCorrectReward = correctAnswer;

    var reward = (this.mode === 'multi') ? game.getMultiplicationReward(10, min, max) : 10;

    return {
      q: {
        question: questionText
      },
      a: {
        answer: correctAnswer,
        reward: reward
      }
    };
  },

  // Singular/plural: t.ex. pluralize(1, 'bil', 'bilar') -> 'bil', pluralize(3, 'bil', 'bilar') -> 'bilar'
  pluralize: function(count, singular, plural){
    return count === 1 ? singular : plural;
  },

  getHelpUnits: function(qty, innerQty){

    var type = ['car', 'eye', 'user-secret'][this.getRandomInt(0,2)],
        txt,
        clr = [this.getRandomInt(100, 255), this.getRandomInt(100, 255), this.getRandomInt(100, 255)],
        unit = '';

    if (type === 'car') {
      txt = '<p><em>' + qty + ' ' + this.pluralize(qty, 'garage', 'garage') + ' med ' + innerQty + ' ' + this.pluralize(innerQty, 'bil', 'bilar') + ' i varje.</em></p>';
    }
    if (type === 'eye'){
      txt = '<p><em>' + qty + ' ' + this.pluralize(qty, 'ansikte', 'ansikten') + ' med ' + innerQty + ' ' + this.pluralize(innerQty, 'öga', 'ögon') + ' på varje.</em></p>';
    }
    if (type === 'user-secret'){
      txt = '<p><em>' + qty + ' ' + this.pluralize(qty, 'rum', 'rum') + ' med ' + innerQty + ' ' + this.pluralize(innerQty, 'detektiv', 'detektiver') + ' i varje.</em></p>';
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
    var html = '';
    if (game.showTraining) {
      var trainingTrophyColor = trainingscore > 0 ? 'orange' : '#6c6c6a';
      html += '<span style="padding-right: 20px;"><strong class="training-label">Träning:</strong> <span class="training-score-label">'+trainingscore+'&nbsp;<i class="fa fa-trophy" style="color: '+trainingTrophyColor+';" aria-hidden="true"></i></span></span>';
    }
    if (game.showContest) {
      var contestTrophyColor = contestscore > 0 ? 'orange' : '#6c6c6a';
      html += '<span style="white-space: nowrap"><strong class="contest-label">Tävling:</strong> <span class="contest-score-label">'+contestscore+'&nbsp;<i class="fa fa-trophy" style="color: '+contestTrophyColor+';" aria-hidden="true"></i></span></span>';
    }
    this.msEl.html(html);
  },
  updateHelp: function(html) {
    this.hEl.html(html);
  },

  // Tumme upp och hjärta är alltid med. Nästa par emojis låses upp vid respektive poäng i
  // emojiTierThresholds - trösklarna växer exponentiellt (tätt i början, långt mellan i toppen,
  // ~60000 poäng för att låsa upp allt) så det inte tar en evighet att komma igång men känns
  // som en riktig bedrift att nå toppen. Träning och Tävling har varsin egen samling.
  standardEmojis: ['👍', '❤️'],
  emojiTierThresholds: [
    0, 300, 350, 420, 490, 580, 690, 810, 960, 1130,
    1330, 1570, 1850, 2190, 2580, 3050, 3600, 4240, 5010, 5910,
    6970, 8230, 9710, 11460, 13520, 15950, 18830, 22220, 26220, 30940,
    36510, 43090, 50840, 60000
  ],
  emojiTierEmojisByMode: {
    training: [
      ['😄', '🎉'], ['⭐', '👏'], ['🥳', '🔥'], ['🍕', '🌮'], ['🦆', '🐙'],
      ['🍉', '🍒'], ['🍣', '🍱'], ['🐶', '🐱'], ['💯', '🍭'], ['🍍', '🥝'],
      ['🧁', '🍔'], ['🐯', '🐘'], ['🍟', '🌭'], ['🐹', '🐰'], ['🍧', '🍓'],
      ['🍦', '🍨'], ['🦕', '🦖'], ['🍪', '🍩'], ['🐺', '🦁'], ['🦄', '🐉'],
      ['🌊', '🌋'], ['🦑', '🦋'], ['🌯', '🍜'], ['🪐', '🚀'], ['🐢', '🦎'],
      ['🐨', '🐸'], ['🍬', '🍫'], ['🐻', '🐼'], ['🐧', '🦉'], ['🦊', '🐵'],
      ['🐝', '🐞'], ['🌈', '⚡'], ['🐊', '🦂'], ['💎', '👑']
    ],
    contest: [
      ['🔥', '💪'], ['🥳', '👏'], ['⚡', '✨'], ['🏈', '⚾'], ['🎇', '🌟'],
      ['🎿', '⛷️'], ['🏒', '🏑'], ['🤸', '🤾'], ['✈️', '🚀'], ['🏉', '🎱'],
      ['🤽', '🚴'], ['🎾', '🏐'], ['🏅', '🎖️'], ['🛹', '🏂'], ['🛸', '🥇'],
      ['🎳', '🏹'], ['🚩', '🎆'], ['🥍', '🏏'], ['🤼', '🤹'], ['🤺', '🥊'],
      ['🏎️', '🏍️'], ['🏓', '🏸'], ['🥈', '🥉'], ['🚗', '🚁'], ['🥋', '🏋️'],
      ['🏄', '🏊'], ['⚔️', '🛡️'], ['🧗', '🪂'], ['💫', '🦸'], ['🦹', '🥷'],
      ['⚽', '🏀'], ['🎯', '🛼'], ['🚵', '🏇'], ['🏁', '🏆']
    ]
  },

  // Träning och Tävling har varsin emoji-samling, kopplad till respektive läges poäng
  getActiveEmojiTiers: function(){
    return game.contest ? game.emojiTierEmojisByMode.contest : game.emojiTierEmojisByMode.training;
  },

  // Högsta tier-index vars tröskel poängen redan når upp till
  getTierIndexForScore: function(score){
    var thresholds = game.emojiTierThresholds;
    var index = 0;
    for (var i = 0; i < thresholds.length; i++) {
      if (score >= thresholds[i]) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  },

  getUnlockedEmojiPool: function(score){
    var tiers = game.getActiveEmojiTiers();
    var pool = game.standardEmojis.slice();
    var unlockedIndex = game.getTierIndexForScore(score);
    for (var i = 0; i <= unlockedIndex; i++) {
      pool = pool.concat(tiers[i]);
    }
    return pool;
  },

  // Emojis vars tröskel ligger mellan föregående och nya poängen - dvs precis upplåsta av detta svar
  getNewlyUnlockedEmojis: function(previousScore, newScore){
    var tiers = game.getActiveEmojiTiers();
    var thresholds = game.emojiTierThresholds;
    var unlocked = [];
    for (var i = 0; i < tiers.length; i++) {
      if (thresholds[i] > previousScore && thresholds[i] <= newScore) {
        unlocked = unlocked.concat(tiers[i]);
      }
    }
    return unlocked;
  },

  // Visar hur många poäng som är kvar tills nästa emoji-tier låses upp, längst ner på skärmen
  updateEmojiProgress: function(){
    var tiers = game.getActiveEmojiTiers();
    var thresholds = game.emojiTierThresholds;
    var maxTierIndex = tiers.length - 1;
    var currentTierIndex = game.getTierIndexForScore(game.score);
    if (currentTierIndex >= maxTierIndex) {
      $('#emojiProgress').html('Alla emojis upplåsta! 🎉');
      return;
    }
    var remaining = thresholds[currentTierIndex + 1] - game.score;
    $('#emojiProgress').html('Poäng kvar till nästa emoji: <strong>' + remaining + '</strong>');
  },

  // Bygger rutnätet av upplåsta (och kommande, låsta) emojis för en poängsumma
  // Den allra sista tierns andra emoji är samlingens stora final och visas separat
  // (se buildFinalEmojiHtml) - resten av rutnätet byggs här.
  buildEmojiCollectionHtml: function(tiers, score){
    var html = '';
    var mascot = game.getMascot();
    var lastIndex = tiers.length - 1;
    for (var i = 0; i < game.standardEmojis.length; i++) {
      html += game.buildMascotCell(game.standardEmojis[i], mascot);
    }
    for (var i = 0; i < tiers.length; i++) {
      var threshold = game.emojiTierThresholds[i];
      var unlocked = score >= threshold;
      var emojisInTier = (i === lastIndex) ? [tiers[i][0]] : tiers[i];
      for (var j = 0; j < emojisInTier.length; j++) {
        if (unlocked) {
          html += game.buildMascotCell(emojisInTier[j], mascot);
        } else {
          html += '<div class="emoji-collection-item locked"><i class="fa fa-lock"></i><span class="emoji-collection-threshold">' + threshold + '</span></div>';
        }
      }
    }
    return html;
  },

  // Bygger den extra stora, centrerade finalrutan med samlingens sista, mest exklusiva emoji
  buildFinalEmojiHtml: function(tiers, score){
    var lastIndex = tiers.length - 1;
    var threshold = game.emojiTierThresholds[lastIndex];
    var finalEmoji = tiers[lastIndex][1];
    if (score >= threshold) {
      return game.buildMascotCell(finalEmoji, game.getMascot(), true);
    }
    return '<div class="emoji-collection-item locked final"><i class="fa fa-lock"></i><span class="emoji-collection-threshold">' + threshold + '</span></div>';
  },

  buildMascotCell: function(emoji, mascot, big){
    var selectedClass = (emoji === mascot) ? ' selected' : '';
    var bigClass = big ? ' final' : '';
    return '<div class="emoji-collection-item unlocked' + selectedClass + bigClass + '" data-emoji="' + emoji + '">' + emoji + '</div>';
  },

  // Maskoten är en av elevens upplåsta emojis, sparad lokalt, som visas svävande i hörnet
  getMascot: function(){
    return localStorage.getItem('mascotEmoji') || null;
  },

  setMascot: function(emoji){
    localStorage.setItem('mascotEmoji', emoji);
    game.renderMascotDisplay();
  },

  clearMascot: function(){
    localStorage.removeItem('mascotEmoji');
    game.renderMascotDisplay();
  },

  renderMascotDisplay: function(){
    var mascot = game.getMascot();
    if (mascot) {
      $('#mascotDisplay').text(mascot).show();
    } else {
      $('#mascotDisplay').hide();
    }
  },

  renderEmojiCollection: function(){
    var trainingscore = localStorage.getItem('trainingscore') ? parseInt(localStorage.getItem('trainingscore')) : 0;
    var contestscore = localStorage.getItem('contestscore') ? parseInt(localStorage.getItem('contestscore')) : 0;

    $('#collectionTrainingScore').text('(' + trainingscore + ' poäng)');
    $('#collectionContestScore').text('(' + contestscore + ' poäng)');

    $('#collectionTrainingGrid').html(game.buildEmojiCollectionHtml(game.emojiTierEmojisByMode.training, trainingscore));
    $('#collectionContestGrid').html(game.buildEmojiCollectionHtml(game.emojiTierEmojisByMode.contest, contestscore));
    $('#collectionTrainingFinal').html(game.buildFinalEmojiHtml(game.emojiTierEmojisByMode.training, trainingscore));
    $('#collectionContestFinal').html(game.buildFinalEmojiHtml(game.emojiTierEmojisByMode.contest, contestscore));
  },

  emojiBurst: function(pool, count){
    pool = pool || game.getUnlockedEmojiPool(game.score);
    count = count || game.getRandomInt(7, 12);
    for (var i = 0; i < count; i++) {
      let emoji = pool[game.getRandomInt(0, pool.length - 1)];
      let el = document.createElement('span');
      el.className = 'emoji-burst-particle';
      el.textContent = emoji;

      let dx = game.getRandomInt(-140, 40) + 'px';
      let dy = -game.getRandomInt(240, 420) + 'px';
      let rot = game.getRandomInt(-45, 45) + 'deg';
      let duration = (2.4 + Math.random() * 1.2).toFixed(2) + 's';
      let delay = (Math.random() * 0.3).toFixed(2) + 's';

      el.style.setProperty('--dx', dx);
      el.style.setProperty('--dy', dy);
      el.style.setProperty('--rot', rot);
      el.style.fontSize = (1.4 + Math.random() * 1.1).toFixed(2) + 'em';
      el.style.right = game.getRandomInt(5, 40) + 'px';
      el.style.bottom = -game.getRandomInt(40, 100) + 'px';
      el.style.animationDuration = duration;
      el.style.animationDelay = delay;

      document.body.appendChild(el);
      setTimeout(function(){
        el.remove();
      }, (parseFloat(duration) + parseFloat(delay)) * 1000 + 150);
    }
  },

  onCorrectAnswer: function(){

    var previousScore = this.score;
    // Max 500 poäng per svar, oavsett hur stort det uträknade svaret råkar bli
    var score = Math.min(Math.max(this.currentCorrectReward, 1), 500);
    var bonus;
    if (this.contest) {
      bonus = Math.round(this.time / this.alarm * 10);
    } else {
      bonus = 0;
    }

    var totalscore = bonus + score;
    this.score += totalscore;
    this.updateScoreText(this.score);
    this.updateEmojiProgress();

    this.emojiBurst();

    if (this.contest) {
      localStorage.setItem('contestscore', this.score);
    } else {
      localStorage.setItem('trainingscore', this.score);
    }

    this.alarmStopped = true;
    $('#answerButton').attr('disabled', true);

    var newlyUnlockedEmojis = game.getNewlyUnlockedEmojis(previousScore, this.score);

    var feedbacktxt = '<div class="box green-box"><h3>Rätt!</h3> Du fick <strong>'+score+'</strong> poäng.<br>';
    if (this.contest) {
      feedbacktxt += 'Du fick <strong>'+bonus+'</strong> i tidsbonus.';
      feedbacktxt += '<br><h4>Total poäng: <strong>'+totalscore+'</strong></h4><br>';
    }
    feedbacktxt += '</div>';
    feedbacktxt += '<div class="box"><br><button id="newQuestion" class="btn-small-3d" onclick="game.createNewQuestion()">Ny fråga</button></div>';

    this.updateHelp('');
    this.updateFeedbackText(feedbacktxt);

    $('#newQuestion').focus();

    if (newlyUnlockedEmojis.length > 0) {
      $('#emojiUnlockList').text(newlyUnlockedEmojis.join(' '));
      $('#emojiUnlockPopup').css('display', 'flex');
      // Flytta fokus till popupens egen knapp, annars träffar Enter "Ny fråga" som ligger dold bakom
      $('#emojiUnlockClose').focus();
    }

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
  game.loadHideVisualHelpSetting();
  game.renderMascotDisplay();

  // Inställningsikonerna: kugghjulet (vanliga inställningar) är synligt som vanligt,
  // utom när man kommer in via en elevlänk (?s=...) - då ska alla inställningar vara dolda,
  // eller i lärarläge (?t=y) - där täcker läraringången (mössan) redan samma inställningar.
  // Emojisamlingen (leendet) är alltid synlig - det är bara en vy av ens egna poäng/emojis.
  var hasStudentLink = !!game.getUrlParam('s');
  var teacherMode = game.isTeacher();
  if (hasStudentLink) {
    $('#settingsButton').hide();
    $('#teacherButton').hide();
  } else if (teacherMode) {
    $('#settingsButton').hide();
    $('#teacherButton').show();
  } else {
    $('#teacherButton').hide();
  }
  game.layoutMenuIcons();

  // Applicera elevlänkens ?s=-inställningar (döljer knappar/svårighetsval, sätter svårighetsgrad)
  game.applyStudentViewFromUrl();

  var settingsButton = $('#settingsButton');
  settingsButton.on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.setEl.show();

    game.loadCustomDifficultySettings();
    game.loadHideVisualHelpSetting();
  })

  var teacherButton = $('#teacherButton');
  teacherButton.on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.teacherEl.show();

    game.loadCustomDifficultySettings(game.getTeacherMultTestFields());
    game.loadHideVisualHelpSetting($('#t-checkHideVisualHelp'));
    game.loadStudentViewSettings();
    $('#studentLinkWrapper').hide();
  })

  // Håll Tillåtet/Förval synkade när läraren klickar i lärarvyn
  game.methodTogglePairs.forEach(function(pair){
    $(pair[0]).on('change', game.syncMethodToggles);
    $(pair[1]).on('change', function(){
      if ($(this).is(':checked')) {
        $(pair[0]).prop('checked', true);
      }
    });
  });

  // Tvinga X innebär att X är tillåtet och förvalt - håll de kryssrutorna ikryssade och låsta då
  $('#checkForceX').on('change', function(){
    var forced = $(this).is(':checked');
    if (forced) {
      $('#checkAllowX').prop('checked', true);
      $('#checkDefaultX').prop('checked', true);
    }
    $('#checkAllowX').prop('disabled', forced);
    $('#checkDefaultX').prop('disabled', forced);
  });

  // Om läraren ändrar någon inställning efter att elevlänken skapats är den inte längre
  // uppdaterad - göm den så läraren tvingas trycka "Skapa elevlänk" igen
  $('#teacher').on('change input', 'input:not(#studentLinkText)', function(){
    $('#studentLinkWrapper').hide();
  });

  var teacherBackButton = $('#teacherclose');
  teacherBackButton.on('click', function(e){
    e.preventDefault();
    game.teacherEl.hide();
    game.mEl.show();
  });

  var teacherSaveSettingsButton = $('#teacherSaveSettings');
  teacherSaveSettingsButton.on('click', function(e){
    e.preventDefault();
    game.saveCustomSettings(game.getTeacherMultTestFields());
    game.saveHideVisualHelpSetting($('#t-checkHideVisualHelp'));
    game.saveStudentViewSettings();
  });

  var teacherClearSettingsButton = $('#teacherClearSettings');
  teacherClearSettingsButton.on('click', function(e){
    e.preventDefault();
    $('#t-mina').val(0);
    $('#t-maxa').val(10);
    $('#t-minb').val(0);
    $('#t-maxb').val(10);
    $('#t-test-nbr-of-questions').val(50);
    $('#t-test-time').val(300);
    $('#t-checkHideVisualHelp').prop('checked', false);

    // Elevvy: visa Träning/Tävling/Test, alla räknesätt tillåtna med Plus förvalt,
    // och bara Mellan som svårighetsgrad
    $('#checkShowTraining').prop('checked', true);
    $('#checkShowContest').prop('checked', true);
    $('#checkShowTest').prop('checked', true);

    $('#checkAllowAdd').prop('checked', true);
    $('#checkAllowSub').prop('checked', true);
    $('#checkAllowMult').prop('checked', true);
    $('#checkAllowX').prop('checked', true);
    $('#checkDefaultAdd').prop('checked', true);
    $('#checkDefaultSub').prop('checked', false);
    $('#checkDefaultMult').prop('checked', false);
    $('#checkDefaultX').prop('checked', false);
    $('#checkForceX').prop('checked', false);
    $('#checkAllowX').prop('disabled', false);
    $('#checkDefaultX').prop('disabled', false);
    game.syncMethodToggles();

    $('#checkAllowInfant').prop('checked', false);
    $('#checkAllowEasy').prop('checked', true);
    $('#checkAllowMedium').prop('checked', false);
    $('#checkAllowHard').prop('checked', false);
  });


  // Skapa elevlänk är en separat sak från att spara - den bygger bara länken utifrån
  // det som senast sparades (och det som just nu står i räknesätt/svårighetskryssrutorna).
  var generateStudentLinkButton = $('#generateStudentLink');
  generateStudentLinkButton.on('click', function(e){
    e.preventDefault();
    var settings = game.getStudentViewSettingsFromFields();
    var code = game.buildStudentLinkCode(settings);
    var encodedCode = game.base64UrlEncode(code);
    var link = window.location.origin + window.location.pathname + '?s=' + encodedCode;
    $('#studentLinkText').val(link);
    $('#studentLinkWrapper').show();
  });

  var copyStudentLinkButton = $('#copyStudentLink');
  copyStudentLinkButton.on('click', function(e){
    e.preventDefault();
    var linkField = document.getElementById('studentLinkText');
    linkField.focus();
    linkField.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(linkField.value).catch(function(){
        document.execCommand('copy');
      });
    } else {
      document.execCommand('copy');
    }
  });

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
    game.saveHideVisualHelpSetting();
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
    $('#checkHideVisualHelp').prop('checked', false);
  });

  var collectionButton = $('#collectionButton');
  collectionButton.on('click', function(e){
    e.preventDefault();
    game.renderEmojiCollection();
    game.mEl.hide();
    $('#emojiCollection').show();
  });

  var emojiCollectionCloseButton = $('#emojiCollectionclose');
  emojiCollectionCloseButton.on('click', function(e){
    e.preventDefault();
    $('#emojiCollection').hide();
    game.mEl.show();
  });

  // Tryck på en upplåst emoji för att välja den som maskot - tryck igen för att ta bort den
  $('#emojiCollection').on('click', '.emoji-collection-item.unlocked', function(){
    var emoji = $(this).data('emoji');
    if (game.getMascot() === emoji) {
      game.clearMascot();
    } else {
      game.setMascot(emoji);
    }
    game.renderEmojiCollection();
  });

  var collectionResetScoreButton = $('#collectionResetScore');
  collectionResetScoreButton.on('click', function(e){
    e.preventDefault();
    var confirmed = window.confirm('Är du säker? Dina poäng och emojisamling kommer att börja om från början.');
    if (confirmed) {
      localStorage.setItem('trainingscore', 0);
      localStorage.setItem('contestscore', 0);
      game.clearMascot();
      game.updateMenuScoreText(0, 0);
      game.renderEmojiCollection();
    }
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

    var difficulty = $('[name=difficulty]:checked').val();
    $('#testInfoDifficulty').text(game.difficultyLabels[difficulty]);

    var methodLabels = [];
    if ($('#checkAdd').is(':checked')) { methodLabels.push('Plus'); }
    if ($('#checkSub').is(':checked')) { methodLabels.push('Minus'); }
    if ($('#checkMult').is(':checked')) { methodLabels.push('Gånger'); }
    if (methodLabels.length === 0) { methodLabels = ['Plus', 'Minus', 'Gånger']; }
    $('#testInfoMethods').text(methodLabels.join(', '));

    if ($('#checkX').is(':checked')) {
      $('#testInfoXWrapper').show();
    } else {
      $('#testInfoXWrapper').hide();
    }

    $('#testInfoPopup').css('display', 'flex');
  })

  var testInfoStartButton = $('#testInfoStart');
  testInfoStartButton.on('click', function(e){
    e.preventDefault();
    $('#testInfoPopup').hide();
    game.mEl.hide();
    game.tEl.show();
    game.startTest();
  })

  var testInfoBackButton = $('#testInfoBack');
  testInfoBackButton.on('click', function(e){
    e.preventDefault();
    $('#testInfoPopup').hide();
  })

  var emojiUnlockCloseButton = $('#emojiUnlockClose');
  emojiUnlockCloseButton.on('click', function(e){
    e.preventDefault();
    $('#emojiUnlockPopup').hide();
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
    game.correctTest();

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
    $('#emojiProgress').hide();

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

  // Håll fixed-positionerade element (toolbar, timer) synliga i den synliga vyn,
  // även när tangentbordet är öppet i iOS Safari (då flyttas visual viewport
  // utan att layout viewport scrollar). #gametime läggs till/tas bort dynamiskt
  // så vi slår upp den vid varje uppdatering istället för att cacha referensen.
  var fixedToolbar = document.querySelector('.toolbar-fixed');
  if (window.visualViewport) {
    var updateFixedPositions = function(){
      var vv = window.visualViewport;
      if (fixedToolbar) {
        fixedToolbar.style.top = vv.offsetTop + 'px';
        fixedToolbar.style.left = vv.offsetLeft + 'px';
        fixedToolbar.style.width = vv.width + 'px';
      }
      var gametime = document.getElementById('gametime');
      if (gametime) {
        gametime.style.top = (vv.offsetTop + 5) + 'px';
        gametime.style.right = 'auto';
        gametime.style.left = (vv.offsetLeft + vv.width - gametime.offsetWidth - 5) + 'px';
      }
    };
    window.visualViewport.addEventListener('resize', updateFixedPositions);
    window.visualViewport.addEventListener('scroll', updateFixedPositions);
    updateFixedPositions();
  }



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
