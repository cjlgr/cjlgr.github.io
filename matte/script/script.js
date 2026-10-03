var game = {
  el: $('#game'),
  qEl: $('#questionText'),
  mEl: $('#menu'),
  setEl: $('#settings'),
  shareEl: $('#share'),
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
  wrongAttempts: 0,
  // Talet som visas just nu ({mode, a, b}) - används för att spara fel i "Öva på fel"-listan
  currentQ: null,
  currentQRecorded: false,
  mistakeMode: false,
  lastMistakeKey: null,
  mistakesCleared: false,
  streak: 0,
  xMode: false,
  showTraining: true,
  showContest: true,
  hideVisualHelp: false,
  // Sätts en gång vid sidladdning (innan mobilens tangentbord någonsin varit uppe) - används
  // som fast "golv" för var emoji-bursten ska starta, se emojiBurst.
  fullScreenHeight: window.innerHeight,
  score: 0,
  alarm: 0,
  time: 0,
  contest: false,
  timeout: null,
  mix: true,
  mode: 'multi',
  testmode: {
    easy: {
      time: 100,
      numberOfQuestions: 5
    },
    medium: {
      time: 100,
      numberOfQuestions: 10
    },
    hard: {
      time: 200,
      numberOfQuestions: 30
    },
    custom: {
      time: 300,
      numberOfQuestions: 50
    },
  },
  levels: {
    easy: [
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
    medium: [
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
    hard: [
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
    custom: [
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
        table: 0, // 0 = ingen tabell, annars tränas bara den tabellen (faktorintervallen ignoreras)
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

  // Placerar de synliga ikonerna (kugghjul/mössa/dela/leende) tätt intill varandra uppe till höger,
  // istället för att lämna tomma luckor efter dolda ikoner.
  layoutMenuIcons: function(){
    var order = ['#settingsButton', '#teacherButton', '#shareButton', '#collectionButton'];
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
  // ?s=<träning><tävling><test><lätt><normal><svår><anpassad><plus><minus><gånger><x><plus-f><minus-f><gånger-f><x-f><visuell hjälp>-<minplus>-<maxplus>-<minminus>-<maxminus>-<mina>-<maxa>-<minb>-<maxb>-<antal frågor>-<tid>-<tabell>
  // (positionerna med "-f" är vilka räknesätt som är förvalda/ikryssade av de tillåtna)
  // De numeriska delarna efter flaggorna är alla Anpassad-inställningar: plusintervall, minusintervall,
  // multiplikationens två faktorintervall, samt antal testfrågor och testtid
  difficultyOrder: ['easy', 'medium', 'hard', 'custom'],
  difficultyLabels: { easy: 'Lätt', medium: 'Mellan', hard: 'Svår', custom: 'Anpassad' },
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
      allowEasy: true, allowMedium: true, allowHard: true, allowCustom: true,
      allowAdd: true, allowSub: true, allowMult: true, allowX: true,
      defaultAdd: true, defaultSub: false, defaultMult: false, defaultX: false,
      forceX: false
    };

    $('#checkShowTraining').prop('checked', settings.training);
    $('#checkShowContest').prop('checked', settings.contest);
    $('#checkShowTest').prop('checked', settings.test);
    $('#checkAllowEasy').prop('checked', settings.allowEasy);
    $('#checkAllowMedium').prop('checked', settings.allowMedium);
    $('#checkAllowHard').prop('checked', settings.allowHard);
    $('#checkAllowCustom').prop('checked', settings.allowCustom);
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
      allowEasy: $('#checkAllowEasy').is(':checked'),
      allowMedium: $('#checkAllowMedium').is(':checked'),
      allowHard: $('#checkAllowHard').is(':checked'),
      allowCustom: $('#checkAllowCustom').is(':checked'),
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
      (settings.allowEasy ? 'y' : 'n') +
      (settings.allowMedium ? 'y' : 'n') +
      (settings.allowHard ? 'y' : 'n') +
      (settings.allowCustom ? 'y' : 'n') +
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

    var customPlus = game.levels.custom[0];
    var customMinus = game.levels.custom[1];
    var customMulti = game.levels.custom[2];
    var customTest = game.testmode.custom;
    var plusMinus = [customPlus.min, customPlus.max, customMinus.min, customMinus.max];
    var mult = [customMulti.min, customMulti.max, customMulti.minb, customMulti.maxb];
    var test = [customTest.numberOfQuestions, customTest.time];

    return [flags].concat(plusMinus).concat(mult).concat(test).concat([customMulti.table || 0]).join('-');
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
    var difficultyRadioIds = { easy: '#radioEasy', medium: '#radioMedium', hard: '#radioHard', custom: '#radioCustom' };
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

    // valfria multiplikations- och testinställningar (Anpassad), på formen -mina-maxa-minb-maxb-antal-tid[-tabell]
    // (tabellen lades till senare, så äldre länkar med 11 delar ska fortfarande fungera)
    if (parts.length === 11 || parts.length === 12) {
      var minplus = parseInt(parts[1], 10);
      var maxplus = parseInt(parts[2], 10);
      var minminus = parseInt(parts[3], 10);
      var maxminus = parseInt(parts[4], 10);
      var mina = parseInt(parts[5], 10);
      var maxa = parseInt(parts[6], 10);
      var minb = parseInt(parts[7], 10);
      var maxb = parseInt(parts[8], 10);
      var numberOfQuestions = parseInt(parts[9], 10);
      var time = parseInt(parts[10], 10);

      if (!isNaN(minplus) && !isNaN(maxplus)) {
        game.levels.custom[0].min = minplus;
        game.levels.custom[0].max = maxplus;
        $('[name=minplus]').val(minplus);
        $('[name=maxplus]').val(maxplus);
      }
      if (!isNaN(minminus) && !isNaN(maxminus)) {
        game.levels.custom[1].min = minminus;
        game.levels.custom[1].max = maxminus;
        $('[name=minminus]').val(minminus);
        $('[name=maxminus]').val(maxminus);
      }
      if (!isNaN(mina) && !isNaN(maxa) && !isNaN(minb) && !isNaN(maxb)) {
        game.levels.custom[2].min = mina;
        game.levels.custom[2].max = maxa;
        game.levels.custom[2].minb = minb;
        game.levels.custom[2].maxb = maxb;
        $('[name=mina]').val(mina);
        $('[name=maxa]').val(maxa);
        $('[name=minb]').val(minb);
        $('[name=maxb]').val(maxb);
      }
      if (!isNaN(numberOfQuestions)) {
        game.testmode.custom.numberOfQuestions = numberOfQuestions;
        $('[name=test-nbr-of-questions]').val(numberOfQuestions);
      }
      if (!isNaN(time)) {
        game.testmode.custom.time = time;
        $('[name=test-time]').val(time);
      }
      var table = parseInt(parts[11], 10);
      if (!isNaN(table) && table >= 0 && table <= 99) {
        game.levels.custom[2].table = table;
        $('[name=multtable]').val(table > 0 ? table : '');
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



  // Load settings: load settings from localstorage. If no setting is stored, then addition should be set to true and the other ones to false. Difficulty should be set to easy.
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
      difficulty = 'easy';
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
      minplus: $('[name=minplus]'),
      maxplus: $('[name=maxplus]'),
      minminus: $('[name=minminus]'),
      maxminus: $('[name=maxminus]'),
      mina: $('[name=mina]'),
      maxa: $('[name=maxa]'),
      minb: $('[name=minb]'),
      maxb: $('[name=maxb]'),
      table: $('[name=multtable]'),
      qty: $('[name=test-nbr-of-questions]'),
      time: $('[name=test-time]')
    };
  },

  getTeacherMultTestFields: function(){
    return {
      minplus: $('#t-minplus'),
      maxplus: $('#t-maxplus'),
      minminus: $('#t-minminus'),
      maxminus: $('#t-maxminus'),
      mina: $('#t-mina'),
      maxa: $('#t-maxa'),
      minb: $('#t-minb'),
      maxb: $('#t-maxb'),
      table: $('#t-multtable'),
      qty: $('#t-test-nbr-of-questions'),
      time: $('#t-test-time')
    };
  },

  // Antingen en tabell eller faktorintervallen - stäng av intervallfälten när en tabell är ifylld
  updateMultTableState: function(fields){
    var hasTable = game.nonNegativeInt(fields.table.val()) > 0;
    fields.mina.add(fields.maxa).add(fields.minb).add(fields.maxb).prop('disabled', hasTable);
  },

  // Tabellträning: den andra faktorn går upp till tabellen själv (14:ans tabell = 14 × 1-14),
  // men alltid minst upp till 10 så att de små tabellerna blir som vanligt (3:ans = 3 × 1-10).
  getMultTableMax: function(table){
    return Math.max(10, table);
  },

  // Tabellträning: ena faktorn är alltid tabellen, den andra 1-getMultTableMax.
  // tableFirst avgör vilken sida tabellen hamnar på (slumpas om den utelämnas).
  getMultTableFactors: function(table, tableFirst){
    var other = this.getRandomInt(1, this.getMultTableMax(table));
    if (tableFirst === undefined) {
      tableFirst = this.getRandomInt(0, 1) === 0;
    }
    return tableFirst ? [table, other] : [other, table];
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

  nonNegativeInt: function(value){
    var parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  },

  saveCustomSettings: function(fields){
    fields = game.getMultTestFields(fields);
    var minplus = game.nonNegativeInt(fields.minplus.val());
    var maxplus = game.nonNegativeInt(fields.maxplus.val());
    var minminus = game.nonNegativeInt(fields.minminus.val());
    var maxminus = game.nonNegativeInt(fields.maxminus.val());
    fields.minplus.val(minplus);
    fields.maxplus.val(maxplus);
    fields.minminus.val(minminus);
    fields.maxminus.val(maxminus);
    localStorage.setItem('minplus', minplus);
    localStorage.setItem('maxplus', maxplus);
    localStorage.setItem('minminus', minminus);
    localStorage.setItem('maxminus', maxminus);
    game.levels.custom[0].min = minplus;
    game.levels.custom[0].max = maxplus;
    game.levels.custom[1].min = minminus;
    game.levels.custom[1].max = maxminus;

    var mina = game.nonNegativeInt(fields.mina.val());
    var maxa = game.nonNegativeInt(fields.maxa.val());
    var minb = game.nonNegativeInt(fields.minb.val());
    var maxb = game.nonNegativeInt(fields.maxb.val());
    fields.mina.val(mina);
    fields.maxa.val(maxa);
    fields.minb.val(minb);
    fields.maxb.val(maxb);
    localStorage.setItem('mina', mina);
    localStorage.setItem('minb', minb);
    localStorage.setItem('maxa', maxa);
    localStorage.setItem('maxb', maxb);
    game.levels.custom[2].min = mina;
    game.levels.custom[2].max = maxa;
    game.levels.custom[2].minb = minb;
    game.levels.custom[2].maxb = maxb;

    var table = Math.min(game.nonNegativeInt(fields.table.val()), 99);
    fields.table.val(table > 0 ? table : '');
    localStorage.setItem('multTable', table);
    game.levels.custom[2].table = table;
    game.updateMultTableState(fields);

    var numberOfQuestions = game.nonNegativeInt(fields.qty.val());
    var time = game.nonNegativeInt(fields.time.val());
    fields.qty.val(numberOfQuestions);
    fields.time.val(time);
    localStorage.setItem('testNbrOfQuestions', numberOfQuestions);
    localStorage.setItem('testTime', time);
    game.testmode.custom.numberOfQuestions = numberOfQuestions;
    game.testmode.custom.time = time;
  },

  loadCustomDifficultySettings: function(fields){
    fields = game.getMultTestFields(fields);

    if (localStorage.getItem('minplus')) {
      fields.minplus.val(localStorage.getItem('minplus'));
      fields.maxplus.val(localStorage.getItem('maxplus'));
      fields.minminus.val(localStorage.getItem('minminus'));
      fields.maxminus.val(localStorage.getItem('maxminus'));
      game.levels.custom[0].min = parseInt(localStorage.getItem('minplus'));
      game.levels.custom[0].max = parseInt(localStorage.getItem('maxplus'));
      game.levels.custom[1].min = parseInt(localStorage.getItem('minminus'));
      game.levels.custom[1].max = parseInt(localStorage.getItem('maxminus'));
    } else {
      fields.minplus.val(game.levels.custom[0].min);
      fields.maxplus.val(game.levels.custom[0].max);
      fields.minminus.val(game.levels.custom[1].min);
      fields.maxminus.val(game.levels.custom[1].max);
    }

    // Load min/max values
    if (localStorage.getItem('mina')) {
      fields.mina.val(localStorage.getItem('mina'));
      fields.maxa.val(localStorage.getItem('maxa'));
      fields.minb.val(localStorage.getItem('minb'));
      fields.maxb.val(localStorage.getItem('maxb'));
      game.levels.custom[2].min = parseInt(localStorage.getItem('mina'));
      game.levels.custom[2].max = parseInt(localStorage.getItem('maxa'));
      game.levels.custom[2].minb = parseInt(localStorage.getItem('minb'));
      game.levels.custom[2].maxb = parseInt(localStorage.getItem('maxb'));
    } else {
      // Load defaults
      fields.mina.val(game.levels.custom[2].min);
      fields.maxa.val(game.levels.custom[2].max);
      fields.minb.val(game.levels.custom[2].minb);
      fields.maxb.val(game.levels.custom[2].maxb);
    }

    if (localStorage.getItem('multTable')) {
      game.levels.custom[2].table = parseInt(localStorage.getItem('multTable'));
    }
    fields.table.val(game.levels.custom[2].table > 0 ? game.levels.custom[2].table : '');
    game.updateMultTableState(fields);

    if (localStorage.getItem('testNbrOfQuestions')) { // test-nbr-of-questions
      fields.qty.val(localStorage.getItem('testNbrOfQuestions'));
      game.testmode.custom.numberOfQuestions = parseInt(localStorage.getItem('testNbrOfQuestions'));
    } else {
      fields.qty.val(game.testmode.custom.numberOfQuestions);
    }

    if (localStorage.getItem('testTime')) { // test-time
      fields.time.val(localStorage.getItem('testTime'));
      game.testmode.custom.time = parseInt(localStorage.getItem('testTime'));
    } else {
      fields.time.val(game.testmode.custom.time);
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
    this.mistakeMode = _mode === 'mistakes' && this.getMistakeCount() > 0;
    this.lastMistakeKey = null;
    $('#mistakeCounter').toggle(this.mistakeMode);
    if (this.contest) {
      this.cEl.show();
      this.time = -1;
      this.alarm = -1;
      this.score = localStorage.getItem('contestscore') ? parseInt(localStorage.getItem('contestscore')) : 0;

    } else {
      this.cEl.hide();
      this.score = localStorage.getItem('trainingscore') ? parseInt(localStorage.getItem('trainingscore')) : 0;

    }

    this.streak = 0;
    this.updateStreakDisplay();
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
      qtxt += '<input name="q'+i+'" type="number" data-type="test-input" data-answer="'+questions[i].a.answer+'" data-reward="'+questions[i].a.reward+'" data-mode="'+questions[i].q.mode+'" data-a="'+questions[i].q.tal1+'" data-b="'+questions[i].q.tal2+'"><br><br>';
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
        game.recordCorrect(game.getTestInputQuestion(answer));
      } else {
        // add 'wrong-answer' class to input
        $(answer).addClass('wrong-answer');
        game.recordMistake(game.getTestInputQuestion(answer));
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
    feedbacktxt += '<br><button id="newQuestion" class="btn-small-3d" onclick="game.startTest()">Nytt test</button>';
    if (correctAnswers < totalAnswers && game.getMistakeCount() > 0) {
      feedbacktxt += '<br><br><button class="btn-small-3d btn-3d-orange" onclick="game.startMistakePractice()">Öva på dina fel</button>';
    }
    feedbacktxt += '<div style="height: 100px;"></div>';
    feedbacktxt += '</div>';

    this.updateTestFeedbackText(feedbacktxt);

    // Scroll to bottom
    $('html, body').animate({scrollTop: $(document).height()}, 'slow');

    // Stor emoji-burst av redan upplåsta emojis som en final när testet är slut
    if (correctAnswers > 0) {
      var ownedPool = game.getUnlockedEmojiPool(newContestScore);
      game.emojiBurst(ownedPool, game.getRandomInt(25, 40));
    }

    game.showEmojiUnlock(newlyUnlockedEmojis);
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

  // Om talintervallet är för smalt (t.ex. samma tal varje gång i "Anpassad") går svaret att
  // memorera direkt istället för att räknas ut - då ska inte poängen få vara hög bara för att
  // talen råkar vara stora. Dra ner belöningen kraftigt om det finns för få möjliga frågor.
  // Gäller plus, minus och multiplikation, så att ingen av dem går att "rigga" i Anpassad
  // (t.ex. minplus=maxplus för att alltid få samma, stora, memorerade svar).
  getNarrowRangeReward: function(answer, min, max, minb, maxb){
    var rangeA = max - min + 1;
    var rangeB = (minb !== undefined && maxb !== undefined) ? (maxb - minb + 1) : rangeA;
    var comboCount = rangeA * rangeB;
    if (comboCount < 5) {
      return Math.min(answer, 3);
    }
    return answer;
  },

  setAlarm: function(alarm){
    // Avbryt en ev. kvarvarande nedräkning från förra frågan innan en ny startas - annars kan
    // den gamla och den nya nedräkningen råka snurra samtidigt, vilket gör att tiden tickar ner
    // fortare än en gång per sekund.
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.alarm = alarm;
    this.time = alarm;

    var bar = document.getElementById('counterbar');
    if (bar) {
      // Fyll baren direkt till 100% (grön) utan transition inför den nya frågan - annars glider
      // den sakta upp/om färg istället för att vara redo direkt.
      bar.style.transition = 'none';
      bar.style.width = '100%';
      bar.style.backgroundColor = this.getTimerBarColorString(100);
      void bar.offsetWidth; // tvinga reflow så transition:none verkligen hinner appliceras
      bar.style.transition = '';
    }

    this.tick();
  },

  // Ankarfärger som timerbaren glider mellan: grön vid full tid, via gult och orange, till rött
  // när tiden nästan är slut.
  timerBarColorStops: [
    { pct: 100, rgb: [76, 175, 80] },
    { pct: 50, rgb: [255, 214, 51] },
    { pct: 25, rgb: [255, 152, 0] },
    { pct: 0, rgb: [244, 67, 54] }
  ],

  getTimerBarColor: function(percent){
    var stops = this.timerBarColorStops;
    var clamped = Math.max(0, Math.min(100, percent));
    var upper = stops[0], lower = stops[stops.length - 1];
    for (var i = 0; i < stops.length - 1; i++) {
      if (clamped <= stops[i].pct && clamped >= stops[i + 1].pct) {
        upper = stops[i];
        lower = stops[i + 1];
        break;
      }
    }
    var span = upper.pct - lower.pct;
    var t = span === 0 ? 0 : (clamped - lower.pct) / span;
    return upper.rgb.map(function(c, idx){
      return Math.round(lower.rgb[idx] + (c - lower.rgb[idx]) * t);
    });
  },

  getTimerBarColorString: function(percent){
    return 'rgb(' + this.getTimerBarColor(percent).join(',') + ')';
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
        this.recordCurrentMistake();
        this.onWrongAnswer('<h3>Tiden är slut!</h3><p>Det rätta svaret är '+this.currentAnswer+'</p> <button class="btn-small-3d" onclick="game.createNewQuestion()">Ny fråga</button>');
      }.bind(this), 1000);
    }
  },

  onTick: function(){
    var bar = $('#counterbar'),
        percent = this.time/this.alarm*100;
    bar.css('width', percent + '%');
    bar.css('background-color', this.getTimerBarColorString(percent));
  },

  createNewQuestion: function(){
    var q;
    this.clearEmojiBurstParticles();
    this.wrongAttempts = 0;
    this.currentQRecorded = false;
    this.mistakesCleared = false;
    if (this.mistakeMode) {
      q = this.createMistakeQuestion();
      this.updateMistakeCounter();
    } else if (this.xMode) {
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

    var min, max, table, char, answer, m, 
      helptxt = '',
      orderOfX = this.getRandomInt(0, 1),
      xCharacter = ['A', 'C', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'T', 'U', 'V', 'X', 'Y', 'Z'][this.getRandomInt(0, 19)];

    m = this.getRandomInt(0, this.modes.length-1);
    this.mode = this.modes[m];

    for (var i = 0; i < this.currentLevel.length; i ++) {
      if (this.currentLevel[i].mode === this.mode) {
        min = this.currentLevel[i].min;
        max = this.currentLevel[i].max;
        table = this.currentLevel[i].table;
        char = this.currentLevel[i].char;
      }
    }

    if (this.mode === 'plus') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(min, max);
    }
    if (this.mode === 'multi' && table > 0) {
      // Tabellen är alltid den kända faktorn, X är den andra (1-getMultTableMax)
      var tableFactors = this.getMultTableFactors(table, orderOfX === 0);
      tal1 = tableFactors[0];
      tal2 = tableFactors[1];
      // så att smala-intervall-spärren inte räknar på de (ignorerade) faktorintervallen
      min = 1;
      max = this.getMultTableMax(table);
    } else if (this.mode === 'multi') {
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

    // X-frågan sparas som det vanliga talet (7 × A = 56 -> 7 × 8) - det är samma kunskap som saknas
    this.currentQ = { mode: this.mode, a: tal1, b: tal2 };

    var xReward = this.getNarrowRangeReward(answer, min, max);

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

    var min, minb, max, maxb, table, char, answer, m, helptxt = '', customDifficulty = false;

    m = this.getRandomInt(0, this.modes.length-1);
    this.mode = this.modes[m];

    for (var i = 0; i < this.currentLevel.length; i ++) {
      if (this.currentLevel[i].mode === this.mode) {
        min = this.currentLevel[i].min;
        minb = this.currentLevel[i].minb;
        max = this.currentLevel[i].max;
        maxb = this.currentLevel[i].maxb;
        table = this.currentLevel[i].table;
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
    if (this.mode === 'multi' && table > 0) {
      var tableFactors = this.getMultTableFactors(table);
      tal1 = tableFactors[0];
      tal2 = tableFactors[1];
      // så att smala-intervall-spärren räknar på tabellens möjliga frågor
      min = max = table;
      minb = 1;
      maxb = this.getMultTableMax(table);
    } else if (this.mode === 'multi') {
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
    this.currentCorrectReward = this.getNarrowRangeReward(answer, min, max, minb, maxb);
    this.currentQ = { mode: this.mode, a: tal1, b: tal2 };


    q = {
      question: 'Vad blir ' + tal1 + ' '+char+' ' + tal2 + '?'
    };

    return q;
  },


  createTestQuestion: function(){

    var min, minb, max, maxb, table, char, answer, m, helptxt = '', customDifficulty = false;

    m = this.getRandomInt(0, this.modes.length-1);
    this.mode = this.modes[m];

    for (var i = 0; i < this.currentLevel.length; i ++) {
      if (this.currentLevel[i].mode === this.mode) {
        min = this.currentLevel[i].min;
        minb = this.currentLevel[i].minb;
        max = this.currentLevel[i].max;
        maxb = this.currentLevel[i].maxb;
        table = this.currentLevel[i].table;
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
    if (this.mode === 'multi' && table > 0) {
      var tableFactors = this.getMultTableFactors(table);
      tal1 = tableFactors[0];
      tal2 = tableFactors[1];
      // så att smala-intervall-spärren räknar på tabellens möjliga frågor
      min = max = table;
      minb = 1;
      maxb = this.getMultTableMax(table);
    } else if (this.mode === 'multi') {
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
    // per rätt svar även om talintervallet är för smalt/lätt att memorera.
    var reward = game.getNarrowRangeReward(10, min, max, minb, maxb);

    ret = {
      q: {
        mode: this.mode,
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

    var min, max, table, char, answer, m,
      orderOfX = this.getRandomInt(0, 1),
      xCharacter = ['A', 'C', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'T', 'U', 'V', 'X', 'Y', 'Z'][this.getRandomInt(0, 19)];

    m = this.getRandomInt(0, this.modes.length-1);
    this.mode = this.modes[m];

    for (var i = 0; i < this.currentLevel.length; i ++) {
      if (this.currentLevel[i].mode === this.mode) {
        min = this.currentLevel[i].min;
        max = this.currentLevel[i].max;
        table = this.currentLevel[i].table;
        char = this.currentLevel[i].char;
      }
    }

    if (this.mode === 'plus') {
      tal1 = this.getRandomInt(min, max);
      tal2 = this.getRandomInt(min, max);
    }
    if (this.mode === 'multi' && table > 0) {
      // Tabellen är alltid den kända faktorn, X är den andra (1-getMultTableMax)
      var tableFactors = this.getMultTableFactors(table, orderOfX === 0);
      tal1 = tableFactors[0];
      tal2 = tableFactors[1];
      // så att smala-intervall-spärren inte räknar på de (ignorerade) faktorintervallen
      min = 1;
      max = this.getMultTableMax(table);
    } else if (this.mode === 'multi') {
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

    var reward = game.getNarrowRangeReward(10, min, max);

    return {
      q: {
        mode: this.mode,
        tal1: tal1,
        tal2: tal2,
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
      html += '<span style="white-space: nowrap"><strong class="training-label">Träning:</strong> <span class="training-score-label">'+trainingscore+'&nbsp;<i class="fa fa-trophy" style="color: '+trainingTrophyColor+';" aria-hidden="true"></i></span></span>';
    }
    if (game.showTraining && game.showContest) {
      html += '<br>';
    }
    if (game.showContest) {
      var contestTrophyColor = contestscore > 0 ? 'orange' : '#6c6c6a';
      html += '<span style="white-space: nowrap"><strong class="contest-label">Tävling:</strong> <span class="contest-score-label">'+contestscore+'&nbsp;<i class="fa fa-trophy" style="color: '+contestTrophyColor+';" aria-hidden="true"></i></span></span>';
    }
    this.msEl.html(html);
    this.updateMistakeButton();
  },
  updateHelp: function(html) {
    this.hEl.html(html);
  },

  // Tumme upp och hjärta är alltid med. Nästa par emojis låses upp vid respektive poäng i
  // emojiTierThresholds - trösklarna växer exponentiellt (tätt i början, långt mellan i toppen,
  // ~60000 poäng, plus en sista legendarisk emoji vid 100000) så det inte tar en evighet att komma igång men känns
  // som en riktig bedrift att nå toppen. Träning och Tävling har varsin egen samling.
  standardEmojis: ['👍', '❤️'],
  emojiTierThresholds: [
    0, 100, 200, 300, 400, 500, 600, 700, 800, 1130,
    1330, 1570, 1850, 2190, 2580, 3050, 3600, 4240, 5010, 5910,
    6970, 8230, 9710, 11460, 13520, 15950, 18830, 22220, 26220, 30940,
    36510, 43090, 50840, 60000, 100000
  ],
  emojiTierEmojisByMode: {
    training: [
      ['😄', '🎉'], ['⭐', '👏'], ['🥳', '🔥'], ['🍕', '🌮'], ['🦆', '🐙'],
      ['🍉', '🍒'], ['🍣', '🍱'], ['🐶', '🐱'], ['💯', '🍭'], ['🍍', '🥝'],
      ['🧁', '🍔'], ['🐯', '🐘'], ['🍟', '🌭'], ['🐹', '🐰'], ['🍧', '🍓'],
      ['🍦', '🍨'], ['🦕', '🦖'], ['🍪', '🍩'], ['🐺', '🦁'], ['🦄', '🐉'],
      ['🌊', '🌋'], ['🦑', '🦋'], ['🌯', '🍜'], ['🪐', '🚀'], ['🐢', '🦎'],
      ['🐨', '🐸'], ['🍬', '🍫'], ['🐻', '🐼'], ['🐧', '🦉'], ['🦊', '🐵'],
      ['🐝', '🐞'], ['🌈', '⚡'], ['🐊', '🦂'], ['💎', '👑'], ['🧠']
    ],
    contest: [
      ['🔥', '💪'], ['🥳', '👏'], ['⚡', '✨'], ['🏈', '⚾'], ['🎇', '🌟'],
      ['🎿', '⛷️'], ['🏒', '🏑'], ['🤸', '🤾'], ['✈️', '🚀'], ['🏉', '🎱'],
      ['🤽', '🚴'], ['🎾', '🏐'], ['🏅', '🎖️'], ['🛹', '🏂'], ['🛸', '🥇'],
      ['🎳', '🏹'], ['🚩', '🎆'], ['🥍', '🏏'], ['🤼', '🤹'], ['🤺', '🥊'],
      ['🏎️', '🏍️'], ['🏓', '🏸'], ['🥈', '🥉'], ['🚗', '🚁'], ['🥋', '🏋️'],
      ['🏄', '🏊'], ['⚔️', '🛡️'], ['🧗', '🪂'], ['💫', '🦸'], ['🦹', '🥷'],
      ['⚽', '🏀'], ['🎯', '🛼'], ['🚵', '🏇'], ['🏁', '🏆'], ['🐐']
    ]
  },

  // Sista tiern (100 000 poäng) har bara en enda, legendarisk emoji per läge - den får guldglöd
  // i samlingen och ett eget, större upplåsningsögonblick (se showEmojiUnlock)
  legendaryEmojis: {
    '🧠': { title: 'Mattehjärnan', text: 'Du har nått <strong>100 000 poäng</strong> i Träning. Din hjärna är en riktig räknemaskin!' },
    '🐐': { title: 'GOAT', text: 'Greatest Of All Time! Du har nått <strong>100 000 poäng</strong> i Tävling.' }
  },

  isLegendaryEmoji: function(emoji){
    return !!game.legendaryEmojis[emoji];
  },

  // Visar popupen för nyss upplåsta emojis - den legendariska får en egen guldversion med extra firande
  showEmojiUnlock: function(newlyUnlockedEmojis){
    if (newlyUnlockedEmojis.length === 0) {
      return;
    }
    var legendary = newlyUnlockedEmojis.filter(game.isLegendaryEmoji)[0];
    var popupBox = $('#emojiUnlockPopup .test-info-popup-box');
    if (legendary) {
      var info = game.legendaryEmojis[legendary];
      popupBox.addClass('legendary');
      $('#emojiUnlockTitle').text('LEGENDARISK EMOJI!');
      $('#emojiUnlockList').html('<span class="legendary-emoji">' + legendary + '</span>' +
        '<span class="legendary-title">' + info.title + '</span>' +
        '<span class="legendary-text">' + info.text + '</span>');
      game.legendaryCelebration(legendary);
    } else {
      popupBox.removeClass('legendary');
      $('#emojiUnlockTitle').text('Du låste upp nya emojis!');
      $('#emojiUnlockList').text(newlyUnlockedEmojis.join(' '));
    }
    $('#emojiUnlockPopup').css('display', 'flex');
    // Flytta fokus till popupens egen knapp, annars träffar Enter "Ny fråga" som ligger dold bakom
    $('#emojiUnlockClose').focus();
  },

  // Den legendariska emojin (blandad med gnistor) skjuts ut åt alla håll inifrån popupen, bakom
  // rutan men ovanpå den suddiga bakgrunden - så att den syns skarpt medan man läser. Fortsätter i
  // vågor så länge popupen är öppen (max ca 15 sekunder).
  legendaryCelebration: function(emoji){
    var pool = [emoji, emoji, emoji, '✨', '⭐', '🌟'];
    var popup = document.getElementById('emojiUnlockPopup');
    var wave = 0;
    var fire = function(){
      if (!$(popup).is(':visible') || wave >= 15) {
        return;
      }
      var rect = popup.querySelector('.test-info-popup-box').getBoundingClientRect();
      game.radialBurst(popup, rect.left + rect.width / 2, rect.top + rect.height / 2,
        pool, game.getRandomInt(18, 26), 10, 90, 1.1, { halfWidth: rect.width / 2, halfHeight: rect.height / 2 });
      wave++;
      setTimeout(fire, 1000);
    };
    // Vänta tills popupen faktiskt visas (den görs synlig direkt efter detta anrop)
    setTimeout(fire, 0);
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
  // Sista emojin i var och en av de sista tierna (👑/🏆 och den legendariska 🧠/🐐) är samlingens
  // stora finaler och visas på egna rader (se buildFinalEmojiHtml) - resten av rutnätet byggs här.
  emojiFinaleTierCount: 2,

  isFinaleTier: function(tiers, index){
    return index >= tiers.length - game.emojiFinaleTierCount;
  },

  buildEmojiCollectionHtml: function(tiers, score){
    var html = '';
    var mascot = game.getMascot();
    for (var i = 0; i < game.standardEmojis.length; i++) {
      html += game.buildMascotCell(game.standardEmojis[i], mascot);
    }
    for (var i = 0; i < tiers.length; i++) {
      var threshold = game.emojiTierThresholds[i];
      var unlocked = score >= threshold;
      var emojisInTier = game.isFinaleTier(tiers, i) ? tiers[i].slice(0, -1) : tiers[i];
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

  // Bygger de extra stora, centrerade finalrutorna - en egen rad per final-tier
  buildFinalEmojiHtml: function(tiers, score){
    var html = '';
    for (var i = tiers.length - game.emojiFinaleTierCount; i < tiers.length; i++) {
      var threshold = game.emojiTierThresholds[i];
      var finalEmoji = tiers[i][tiers[i].length - 1];
      if (score >= threshold) {
        html += game.buildMascotCell(finalEmoji, game.getMascot(), true);
      } else {
        var legendaryClass = game.isLegendaryEmoji(finalEmoji) ? ' legendary' : '';
        html += '<div class="emoji-collection-item locked final' + legendaryClass + '"><i class="fa fa-lock"></i><span class="emoji-collection-threshold">' + threshold + '</span></div>';
      }
    }
    return html;
  },

  buildMascotCell: function(emoji, mascot, big){
    var selectedClass = (emoji === mascot) ? ' selected' : '';
    var bigClass = big ? ' final' : '';
    var legendaryClass = game.isLegendaryEmoji(emoji) ? ' legendary' : '';
    return '<div class="emoji-collection-item unlocked' + selectedClass + bigClass + legendaryClass + '" data-emoji="' + emoji + '">' + emoji + '</div>';
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
    // Maskoten göms medan man är inne på flex-skärmen (där den ju redan syns i stort format)
    var flexing = $('#flexScreen').is(':visible');
    if (mascot && !flexing) {
      // Inre span så att studsen (se bounceMascot) inte krockar med maskotens svävning
      $('#mascotDisplay').html('<span class="mascot-display-inner">' + mascot + '</span>').show();
      $('#mascotDisplay').toggleClass('legendary', game.isLegendaryEmoji(mascot));
    } else {
      $('#mascotDisplay').hide();
    }
  },

  // "Öva på fel": tal man svarat fel på sparas i localStorage (under 'mistakes') med sina faktiska
  // siffror. 7 × 8 och 8 × 7 är olika tal. Ett tal försvinner ur listan efter två rätt i rad på
  // första försöket - i vilket läge som helst, inte bara i "Öva på fel" (1 rätt räcker för gamla fel).
  mistakeCharByMode: { plus: '+', minus: '-', multi: '×' },
  mistakeRightToClear: 2,
  // Ett fel vars senaste miss är äldre än så här räcker det med 1 rätt för - en snabbkoll om det sitter nu
  mistakeOldAfterMs: 30 * 24 * 60 * 60 * 1000,
  // Tak på listan så att den aldrig blir överväldigande - de äldsta missarna trillar ut först
  mistakeMaxCount: 30,

  getMistakes: function(){
    try {
      return JSON.parse(localStorage.getItem('mistakes')) || {};
    } catch (e) {
      return {};
    }
  },

  saveMistakes: function(mistakes){
    localStorage.setItem('mistakes', JSON.stringify(mistakes));
  },

  getMistakeKey: function(q){
    return q.mode + ':' + q.a + ':' + q.b;
  },

  getMistakeCount: function(){
    return Object.keys(game.getMistakes()).length;
  },

  isValidMistakeQuestion: function(q){
    return !!(q && game.mistakeCharByMode[q.mode] && !isNaN(q.a) && !isNaN(q.b));
  },

  recordMistake: function(q){
    if (!game.isValidMistakeQuestion(q)) {
      return;
    }
    var mistakes = game.getMistakes();
    var key = game.getMistakeKey(q);
    var entry = mistakes[key] || { mode: q.mode, a: q.a, b: q.b, wrong: 0 };
    entry.wrong++;
    entry.rightInRow = 0;
    entry.lastWrong = Date.now();
    mistakes[key] = entry;
    var keys = Object.keys(mistakes);
    if (keys.length > game.mistakeMaxCount) {
      keys.sort(function(k1, k2){ return (mistakes[k1].lastWrong || 0) - (mistakes[k2].lastWrong || 0); });
      keys.slice(0, keys.length - game.mistakeMaxCount).forEach(function(k){ delete mistakes[k]; });
    }
    game.saveMistakes(mistakes);
  },

  // Sparar den aktuella frågan som fel - bara en gång per fråga, hur många gånger man än gissar fel
  recordCurrentMistake: function(){
    if (this.currentQRecorded) {
      return;
    }
    this.currentQRecorded = true;
    this.recordMistake(this.currentQ);
  },

  // Returnerar true om talet just blev klart och togs bort ur listan
  recordCorrect: function(q){
    if (!game.isValidMistakeQuestion(q)) {
      return false;
    }
    var mistakes = game.getMistakes();
    var key = game.getMistakeKey(q);
    var entry = mistakes[key];
    if (!entry) {
      return false;
    }
    entry.rightInRow = (entry.rightInRow || 0) + 1;
    var isOld = Date.now() - (entry.lastWrong || 0) > game.mistakeOldAfterMs;
    var cleared = isOld || entry.rightInRow >= game.mistakeRightToClear;
    if (cleared) {
      delete mistakes[key];
    }
    game.saveMistakes(mistakes);
    return cleared;
  },

  getTestInputQuestion: function(input){
    return {
      mode: $(input).attr('data-mode'),
      a: parseInt($(input).attr('data-a'), 10),
      b: parseInt($(input).attr('data-b'), 10)
    };
  },

  // Tal med många fel kommer oftare. Samma tal kommer aldrig två gånger i rad (om det finns fler).
  pickMistake: function(){
    var mistakes = game.getMistakes();
    var keys = Object.keys(mistakes);
    if (keys.length > 1 && game.lastMistakeKey) {
      keys = keys.filter(function(k){ return k !== game.lastMistakeKey; });
    }
    var total = 0;
    keys.forEach(function(k){ total += mistakes[k].wrong || 1; });
    var r = Math.random() * total;
    for (var i = 0; i < keys.length; i++) {
      r -= mistakes[keys[i]].wrong || 1;
      if (r < 0) {
        game.lastMistakeKey = keys[i];
        return mistakes[keys[i]];
      }
    }
    game.lastMistakeKey = keys[keys.length - 1];
    return mistakes[game.lastMistakeKey];
  },

  createMistakeQuestion: function(){
    var entry = this.pickMistake();
    var tal1 = entry.a, tal2 = entry.b, answer;
    this.mode = entry.mode;

    if (this.mode === 'plus') {
      answer = tal1 + tal2;
    } else if (this.mode === 'minus') {
      answer = tal1 - tal2;
    } else {
      answer = tal1 * tal2;
    }

    if (this.mode === 'multi' && !game.hideVisualHelp && tal1 !== 0 && tal2 !== 0 && tal1 <= 10 && tal2 <= 10) {
      this.updateHelp(this.getHelpUnits(tal1, tal2));
    } else {
      this.updateHelp('');
    }

    this.currentAnswer = answer;
    this.currentCorrectReward = answer;
    this.currentQ = { mode: entry.mode, a: tal1, b: tal2 };

    return {
      question: 'Vad blir ' + tal1 + ' ' + this.mistakeCharByMode[this.mode] + ' ' + tal2 + '?'
    };
  },

  updateMistakeCounter: function(){
    var count = this.getMistakeCount();
    $('#mistakeCounter').text(count === 0 ? 'Inga tal kvar!' : count + ' tal kvar att öva på');
  },

  // Menyknappen syns bara när det finns fel att öva på
  updateMistakeButton: function(){
    var count = this.getMistakeCount();
    $('#mistakeButtonCount').text(count);
    $('#mistakeButton').toggle(count > 0);
    $('#clearMistakesCount').text(count);
    $('#clearMistakes').attr('disabled', count === 0);
  },

  startMistakePractice: function(){
    game.stopGameTime();
    game.tEl.hide();
    game.mEl.hide();
    game.el.show();
    game.startGame('mistakes');
  },

  // QR-koder ritas lokalt i webbläsaren (qrcodejs från cdnjs) - länken skickas aldrig till någon tjänst
  renderQr: function(el, text){
    $(el).empty();
    if (typeof QRCode === 'undefined') {
      $(el).closest('.qr-box').hide();
      return;
    }
    new QRCode(el, { text: text, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
  },

  // Prestationer: låses upp en gång för alltid och sparas i localStorage. De påverkas inte av
  // "Nollställ poäng". Hittills bara streak-baserade (streak = antal rätt i rad under ett pass).
  // Prestationer med color låser upp en ny bakgrundsfärg - de läggs till automatiskt för var
  // tionde streak (se buildBackgroundAchievements längst ner), en per färg i streakTierColors.
  achievements: [
    {
      id: 'flex',
      streak: 50,
      title: '💪 Flexa',
      description: 'Du klarade 50 rätt i rad! Nu kan du flexa med din maskot - tryck på den så kommer du till flex-skärmen.'
    },
    {
      id: 'mistakefixer',
      title: '🔧 Felfixaren',
      requirement: 'Övade bort alla fel',
      description: 'Du har övat bort alla tal du gjort fel på. Snyggt jobbat!'
    }
  ],

  getUnlockedAchievements: function(){
    try {
      return JSON.parse(localStorage.getItem('achievements')) || {};
    } catch (e) {
      return {};
    }
  },

  hasAchievement: function(id){
    return !!game.getUnlockedAchievements()[id];
  },

  // Körs efter varje rätt svar - låser upp alla streak-prestationer man just nått och visar en popup
  checkStreakAchievements: function(){
    var unlocked = game.getUnlockedAchievements();
    var newlyUnlocked = [];
    for (var i = 0; i < game.achievements.length; i++) {
      var achievement = game.achievements[i];
      if (achievement.streak && game.streak >= achievement.streak && !unlocked[achievement.id]) {
        unlocked[achievement.id] = true;
        newlyUnlocked.push(achievement);
      }
    }
    if (newlyUnlocked.length === 0) {
      return;
    }
    localStorage.setItem('achievements', JSON.stringify(unlocked));
    game.showAchievementPopup(newlyUnlocked);
  },

  // Prestationer som inte bygger på streak låses upp direkt via sitt id (bara första gången)
  unlockAchievement: function(id){
    var unlocked = game.getUnlockedAchievements();
    if (unlocked[id]) {
      return;
    }
    var achievement = game.achievements.filter(function(a){ return a.id === id; })[0];
    if (!achievement) {
      return;
    }
    unlocked[id] = true;
    localStorage.setItem('achievements', JSON.stringify(unlocked));
    game.showAchievementPopup([achievement]);
  },

  showAchievementPopup: function(newlyUnlocked){
    game.renderMascotDisplay();

    var html = '';
    for (var j = 0; j < newlyUnlocked.length; j++) {
      html += '<h4 class="text-center" style="font-size: 1.4em; margin: 20px 0 5px 0;">' + newlyUnlocked[j].title + '</h4>';
      html += '<p class="text-center">' + newlyUnlocked[j].description + '</p>';
    }
    var flexUnlocked = newlyUnlocked.some(function(a){ return a.id === 'flex'; });
    if (flexUnlocked && !game.getMascot()) {
      html += '<p class="text-center" style="color: #3c3c3a;">Välj först en maskot i emojisamlingen 🙂</p>';
    }
    $('#achievementUnlockList').html(html);
    $('#achievementUnlockPopup').css('display', 'flex');
    $('#achievementUnlockClose').focus();
  },

  // Upplåsta prestationer i emojisamlingen - sektionen syns först när man låst upp någon
  renderAchievementList: function(){
    var unlocked = game.getUnlockedAchievements();
    var html = '';
    for (var i = 0; i < game.achievements.length; i++) {
      var achievement = game.achievements[i];
      if (unlocked[achievement.id]) {
        html += '<div class="achievement-item" data-achievement="' + achievement.id + '">' +
          '<div class="achievement-title">' + achievement.title + '</div>' +
          '<div class="achievement-requirement">' + (achievement.requirement || achievement.streak + ' rätt i rad') + '</div>' +
          '</div>';
      }
    }
    $('#achievementList').html(html);
    $('#achievementSection').toggle(html !== '');
    game.renderBackgroundPicker();
  },

  // Bakgrundsfärgen sparas som id:t på prestationen som låste upp den (inget sparat = standard)
  getBackgroundAchievement: function(){
    var id = localStorage.getItem('backgroundAchievement');
    for (var i = 0; i < game.achievements.length; i++) {
      if (game.achievements[i].id === id && game.achievements[i].color && game.hasAchievement(id)) {
        return game.achievements[i];
      }
    }
    return null;
  },

  setBackgroundAchievement: function(id){
    if (id) {
      localStorage.setItem('backgroundAchievement', id);
    } else {
      localStorage.removeItem('backgroundAchievement');
    }
    game.applyBackgroundColor();
  },

  applyBackgroundColor: function(){
    var achievement = game.getBackgroundAchievement();
    if (achievement) {
      document.documentElement.style.setProperty('--app-bg', achievement.color);
    } else {
      document.documentElement.style.removeProperty('--app-bg');
    }
    // Vissa färger har även ett mönster ovanpå (t.ex. Guld), se data-bg-pattern i master.css
    if (achievement && achievement.pattern) {
      document.documentElement.setAttribute('data-bg-pattern', achievement.pattern);
    } else {
      document.documentElement.removeAttribute('data-bg-pattern');
    }
  },

  // Färgväljaren i Prestationer: Standard plus alla upplåsta färger. Syns först när minst en färg är upplåst.
  renderBackgroundPicker: function(){
    var selected = game.getBackgroundAchievement();
    var selectedId = selected ? selected.id : '';
    var swatches = [{ id: '', color: '#90908a', colorName: 'Standard' }];
    for (var i = 0; i < game.achievements.length; i++) {
      if (game.achievements[i].color && game.hasAchievement(game.achievements[i].id)) {
        swatches.push(game.achievements[i]);
      }
    }
    var html = '';
    for (var j = 0; j < swatches.length; j++) {
      var selectedClass = (swatches[j].id === selectedId) ? ' selected' : '';
      html += '<div class="background-swatch-wrapper">' +
        '<button class="background-swatch' + selectedClass + (swatches[j].pattern ? ' bg-pattern-' + swatches[j].pattern : '') + '" data-achievement="' + swatches[j].id + '" style="background-color: ' + swatches[j].color + ';"></button>' +
        '<div class="background-swatch-label">' + swatches[j].colorName + '</div>' +
        '</div>';
    }
    $('#backgroundSwatches').html(html);
    $('#backgroundPicker').toggle(swatches.length > 1);
  },

  // Liten studs på plats när man trycker på maskoten innan Flexa är upplåst
  bounceMascot: function(){
    var inner = $('#mascotDisplay .mascot-display-inner');
    inner.removeClass('bounce');
    void inner[0].offsetWidth; // starta om studsen även om man trycker igen mitt i den
    inner.addClass('bounce');
  },

  openFlexScreen: function(){
    var mascot = game.getMascot();
    if (!mascot) {
      return;
    }
    $('#flexMascot').html('<span class="flex-mascot-inner">' + mascot + '</span>');
    $('#flexScreen').css('display', 'flex');
    game.renderMascotDisplay();
  },

  closeFlexScreen: function(){
    $('#flexScreen').hide();
    game.renderMascotDisplay();
    // Fortsätt där man var - t.ex. med Enter på "Ny fråga" mitt i ett pass
    $('#newQuestion:visible').focus();
  },

  // Tryck på maskoten på flex-skärmen: den studsar till och skjuter ut en massa små kopior av sig själv
  flexMascot: function(){
    var inner = $('#flexMascot .flex-mascot-inner');
    inner.removeClass('bounce');
    void inner[0].offsetWidth; // starta om studsen även om man trycker igen mitt i den
    inner.addClass('bounce');

    var rect = inner[0].getBoundingClientRect();
    var originX = rect.left + rect.width / 2;
    var originY = rect.top + rect.height / 2;
    var mascot = game.getMascot();
    var count = game.getRandomInt(12, 18);
    for (var i = 0; i < count; i++) {
      let el = document.createElement('span');
      el.className = 'emoji-burst-particle';
      el.textContent = mascot;

      let angle = Math.random() * Math.PI * 2;
      let distance = game.getRandomInt(120, 260);
      let dx = Math.round(Math.cos(angle) * distance) + 'px';
      let dy = Math.round(Math.sin(angle) * distance) + 'px';
      let rot = game.getRandomInt(-120, 120) + 'deg';
      let duration = (0.9 + Math.random() * 0.6).toFixed(2) + 's';
      let delay = (Math.random() * 0.1).toFixed(2) + 's';
      let size = 1.4 + Math.random() * 1.4;

      el.style.setProperty('--dx', dx);
      el.style.setProperty('--dy', dy);
      el.style.setProperty('--rot', rot);
      el.style.fontSize = size.toFixed(2) + 'em';
      // Centrera partikeln på maskotens mittpunkt (en emoji är ungefär lika bred/hög som fontstorleken)
      el.style.left = 'calc(' + originX + 'px - ' + (size / 2).toFixed(2) + 'em)';
      el.style.top = 'calc(' + originY + 'px - ' + (size / 2).toFixed(2) + 'em)';
      el.style.animationDuration = duration;
      el.style.animationDelay = delay;

      // Inuti flex-skärmen, före maskoten, så att partiklarna skjuts ut bakom den
      document.getElementById('flexScreen').insertBefore(el, document.getElementById('flexMascot'));
      setTimeout(function(){
        el.remove();
      }, (parseFloat(duration) + parseFloat(delay)) * 1000 + 150);
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
    game.renderAchievementList();
  },

  emojiBurst: function(pool, count){
    pool = pool || game.getUnlockedEmojiPool(game.score);
    count = count || game.getRandomInt(7, 12);
    // Starten ska alltid ligga vid skärmens FYSISKA botten (game.fullScreenHeight, satt en gång
    // vid sidladdning) - annars flyttar sig spawnpunkten med visualViewport när tangentbordet
    // fälls upp/ner, och bursten ser ut att plötsligt ha startat mitt på skärmen. Målet (hur
    // långt upp den ska hinna) räknas däremot mot den just nu SYNLIGA ytan (visualViewport),
    // så att den ändå alltid hinner upp ovanför ett ev. uppfällt tangentbord.
    var viewport = window.visualViewport;
    var visibleHeight = viewport ? viewport.height : game.fullScreenHeight;
    var visibleTop = viewport ? viewport.offsetTop : 0;
    // Bursten spawnar nära #appContainers högerkant, inte webbläsarfönstrets - annars hamnar
    // den ute vid fönstrets riktiga kant istället för den centrerade 600px-spelytans kant på
    // breda skärmar.
    var appContainer = document.getElementById('appContainer');
    var containerRight = appContainer ? appContainer.getBoundingClientRect().right : window.innerWidth;
    var rightEdgeInset = window.innerWidth - containerRight;
    for (var i = 0; i < count; i++) {
      let emoji = pool[game.getRandomInt(0, pool.length - 1)];
      let el = document.createElement('span');
      el.className = 'emoji-burst-particle';
      el.textContent = emoji;

      let spawnTop = game.fullScreenHeight - game.getRandomInt(40, 100);
      let targetTop = visibleTop + game.getRandomInt(Math.round(visibleHeight * 0.05), Math.round(visibleHeight * 0.25));

      let dx = game.getRandomInt(-140, 40) + 'px';
      let dy = (targetTop - spawnTop) + 'px';
      let rot = game.getRandomInt(-45, 45) + 'deg';
      let duration = (3.4 + Math.random() * 1.8).toFixed(2) + 's';
      let delay = (Math.random() * 0.3).toFixed(2) + 's';

      el.style.setProperty('--dx', dx);
      el.style.setProperty('--dy', dy);
      el.style.setProperty('--rot', rot);
      el.style.fontSize = (1.4 + Math.random() * 1.1).toFixed(2) + 'em';
      el.style.right = (rightEdgeInset + game.getRandomInt(5, 40)) + 'px';
      el.style.top = spawnTop + 'px';
      el.style.animationDuration = duration;
      el.style.animationDelay = delay;

      document.body.appendChild(el);
      setTimeout(function(){
        el.remove();
      }, (parseFloat(duration) + parseFloat(delay)) * 1000 + 150);
    }
  },

  // Låter kvarvarande emoji-partiklar från en burst tona bort snabbt istället för att spela
  // klart sin fulla, flera sekunder långa animation - t.ex. när man går vidare till "Ny fråga"
  // innan förra bursten hunnit försvinna av sig själv.
  clearEmojiBurstParticles: function(){
    $('.emoji-burst-particle').each(function(){
      var el = this;
      var computed = window.getComputedStyle(el);
      // Frys kvar exakt där/hur den ser ut just nu (position, rotation, opacitet) innan
      // animationen stängs av - annars hoppar den till sitt ursprungsläge ett kort ögonblick.
      var currentOpacity = computed.opacity;
      var currentTransform = computed.transform;
      var dx = el.style.getPropertyValue('--dx') || '-60px';
      var dy = el.style.getPropertyValue('--dy') || '-260px';
      var rot = el.style.getPropertyValue('--rot') || '20deg';
      el.style.animation = 'none';
      el.style.transform = currentTransform;
      el.style.opacity = currentOpacity;
      el.style.transition = 'transform 0.6s ease-out, opacity 0.6s linear';
      void el.offsetWidth; // tvinga fram en reflow så transitionen faktiskt appliceras
      // Fortsätt röra sig mot sitt ursprungliga mål samtidigt som den tonar bort, istället
      // för att frysa på plats - annars ser det ut som den plötsligt stannar mitt i luften.
      el.style.transform = 'translate(' + dx + ', ' + dy + ') scale(1) rotate(' + rot + ')';
      el.style.opacity = '0';
      setTimeout(function(){
        el.remove();
      }, 620);
    });
  },

  // Litet stjärn-fyrverkeri som skjuter ut åt alla håll direkt från streak-baren - körs vid
  // var tionde fråga i rad (10, 20, 30, ...). Återanvänder samma partikel-klass/animationer
  // som den vanliga emoji-bursten, men med en radiell riktning från barens mittpunkt istället
  // för en riktning uppåt från skärmens botten, och en mycket kortare, snabbare bana.
  streakFirework: function(){
    var bar = document.getElementById('streakDisplay');
    if (!bar) {
      return;
    }
    var rect = bar.getBoundingClientRect();
    game.radialBurst(document.body, rect.left + rect.width / 2, rect.top + rect.height / 2,
      ['⭐', '🌟'], game.getRandomInt(14, 20), 50, 150, 0.7);
  },

  // Emojis som skjuts ut åt alla håll från en punkt (x, y), utlagda i container. Med edgeBox
  // ({halfWidth, halfHeight}) räknas min/maxDistance från kanten på en ruta runt punkten istället
  // för från punkten - då hamnar emojisarna precis utanför rutan åt alla håll, även en avlång ruta.
  radialBurst: function(container, originX, originY, pool, count, minDistance, maxDistance, baseDuration, edgeBox){
    for (var i = 0; i < count; i++) {
      let emoji = pool[game.getRandomInt(0, pool.length - 1)];
      let el = document.createElement('span');
      el.className = 'emoji-burst-particle';
      el.textContent = emoji;

      let angle = Math.random() * Math.PI * 2;
      let distance = game.getRandomInt(minDistance, maxDistance);
      if (edgeBox) {
        let cos = Math.abs(Math.cos(angle)), sin = Math.abs(Math.sin(angle));
        distance += Math.min(cos > 0.001 ? edgeBox.halfWidth / cos : Infinity, sin > 0.001 ? edgeBox.halfHeight / sin : Infinity);
      }
      let dx = Math.round(Math.cos(angle) * distance) + 'px';
      let dy = Math.round(Math.sin(angle) * distance) + 'px';
      let rot = game.getRandomInt(-90, 90) + 'deg';
      let duration = (baseDuration + Math.random() * 0.5).toFixed(2) + 's';
      let delay = (Math.random() * 0.15).toFixed(2) + 's';

      el.style.setProperty('--dx', dx);
      el.style.setProperty('--dy', dy);
      el.style.setProperty('--rot', rot);
      el.style.fontSize = (1.1 + Math.random() * 0.8).toFixed(2) + 'em';
      el.style.left = originX + 'px';
      el.style.top = originY + 'px';
      el.style.animationDuration = duration;
      el.style.animationDelay = delay;

      container.appendChild(el);
      setTimeout(function(){
        el.remove();
      }, (parseFloat(duration) + parseFloat(delay)) * 1000 + 150);
    }
  },

  onCorrectAnswer: function(){

    var previousScore = this.score;

    this.streak++;
    this.updateStreakDisplay();

    // Max 500 poäng per svar, oavsett hur stort det uträknade svaret råkar bli
    var baseScore = Math.min(Math.max(this.currentCorrectReward, 1), 500);
    // Streak-bonus: ingen bonus alls under en streak på 10. Därefter trappas den upp i steg
    // om tio: 10-19 ger x1.1, 20-29 ger x1.2, osv, upp till max x2 vid en streak på 100+.
    var streakTier = Math.min(Math.floor(this.streak / 10), 10);
    var streakMultiplier = 1 + streakTier * 0.1;
    // Avrunda bonusen uppåt (och minst +1) - annars kan t.ex. 1% av en liten baspoäng
    // försvinna i avrundningen och man kvalar in för en streak-bonus utan att märka av den.
    var streakBonus = (streakTier > 0) ? Math.max(Math.ceil(baseScore * (streakMultiplier - 1)), 1) : 0;
    var score = baseScore + streakBonus;
    var streakBonusPercent = Math.round((streakMultiplier - 1) * 100);

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

    // Stjärn-fyrverkeri från streak-baren var 10:e fråga i rad, utöver den vanliga emoji-bursten
    if (this.streak % 10 === 0) {
      this.streakFirework();
    }

    this.emojiBurst();

    if (this.contest) {
      localStorage.setItem('contestscore', this.score);
    } else {
      localStorage.setItem('trainingscore', this.score);
    }

    this.alarmStopped = true;
    $('#answerButton').attr('disabled', true);

    var newlyUnlockedEmojis = game.getNewlyUnlockedEmojis(previousScore, this.score);

    var feedbacktxt = '<div class="box green-box"><h3>Rätt!</h3> Du fick <strong>'+baseScore+'</strong> poäng.<br>';
    if (streakBonusPercent > 0) {
      feedbacktxt += '<span class="green-text">Streak-bonus '+streakBonus+' poäng (+'+streakBonusPercent+'%)</span><br>';
    }
    if (this.contest) {
      feedbacktxt += 'Du fick <strong>'+bonus+'</strong> i tidsbonus.';
      feedbacktxt += '<br><h4>Total poäng: <strong>'+totalscore+'</strong></h4><br>';
    }
    feedbacktxt += '</div>';
    if (this.mistakesCleared) {
      feedbacktxt += '<div class="box green-box"><h3>Alla fel fixade! 🎉</h3>Du har övat bort alla tal du gjort fel på.</div>';
      feedbacktxt += '<div class="box"><br><button id="newQuestion" class="btn-small-3d" onclick="$(\'#back\').click()">Tillbaka</button></div>';
    } else {
      feedbacktxt += '<div class="box"><br><button id="newQuestion" class="btn-small-3d" onclick="game.createNewQuestion()">Ny fråga</button></div>';
    }
    if (this.mistakeMode) {
      this.updateMistakeCounter();
    }

    this.updateHelp('');
    this.updateFeedbackText(feedbacktxt);

    $('#newQuestion').focus();

    game.showEmojiUnlock(newlyUnlockedEmojis);

    // Efter emoji-popupen, så att prestations-popupen hamnar överst om båda dyker upp samtidigt
    this.checkStreakAchievements();

    if (this.mistakesCleared) {
      this.streakFirework();
      this.emojiBurst(this.getUnlockedEmojiPool(this.score), this.getRandomInt(25, 40));
      this.unlockAchievement('mistakefixer');
    }

  },

  // Visar hur många rätt i rad man har (från och med 2) ovanför frågan. Nollställs vid
  // fel svar, "Visa svaret" eller när ett nytt spelpass startas.
  // Streak-barens färger, en per tiotal: 2-9 är den första, 10-19 den andra, osv. Den sista
  // (90-99) återanvänds för 100+ istället för att introducera ännu en ny färg.
  // Namnen på bakgrundsfärgerna som låses upp vid var tionde streak, i samma ordning som
  // streakTierColors (första, 2-9, är ingen upplåsbar färg och saknar därför namn). Namnen
  // är skämtsamma och beskriver de nedtonade färgerna (se muteBackgroundColor), inte streak-barens.
  backgroundColorNames: [null, 'Ponny', 'Fiskpinne', 'Krabba', 'Tuggummi', 'Bläckfisk', 'Blåmärke', 'Badvatten', 'Grodkyss', 'Guld'],

  // Bakgrunder som inte är en vanlig nedtonad streak-färg, per streak-tiotal. Guld (90) är den
  // finaste och ska kännas lyxig - en starkare guldton (inte nedtonad, annars blir den nästan
  // likadan som Ponny) med ett metalliskt mönster ovanpå.
  specialBackgrounds: {
    9: { color: '#c9a23a', pattern: 'gold' }
  },

  // Blandar en streak-färg 50/50 med standardbakgrunden (#90908a). Streak-färgerna i full styrka
  // blir för skrikiga som helskärmsbakgrund och krockar med spelets egna färger (t.ex. Svår-mätarens
  // orange, Mellans blå och de gula knapparna) - nedtonade känns de fortfarande igen men sticker inte ut.
  muteBackgroundColor: function(hex){
    var base = [0x90, 0x90, 0x8a];
    var result = '#';
    for (var i = 0; i < 3; i++) {
      var channel = parseInt(hex.substr(1 + i * 2, 2), 16);
      var mixed = Math.round((channel + base[i]) / 2);
      result += ('0' + mixed.toString(16)).slice(-2);
    }
    return result;
  },

  // En bakgrundsfärg per streak-tiotal (10, 20, ... 90), i en nedtonad variant av streak-barens
  // färg vid den streaken. Körs en gång vid start och sorterar in dem bland övriga prestationer efter streak.
  buildBackgroundAchievements: function(){
    for (var tier = 1; tier < game.streakTierColors.length; tier++) {
      var streak = tier * 10;
      var name = game.backgroundColorNames[tier];
      var special = game.specialBackgrounds[tier] || {};
      game.achievements.push({
        id: 'bg' + streak,
        streak: streak,
        title: '🎨 Bakgrund: ' + name,
        color: special.color || game.muteBackgroundColor(game.streakTierColors[tier].bg),
        pattern: special.pattern || null,
        colorName: name,
        description: 'Du klarade ' + streak + ' rätt i rad! Nu kan du byta bakgrundsfärg - välj den under Prestationer i emojisamlingen 🙂'
      });
    }
    // Prestationer utan streak (t.ex. Felfixaren) hamnar sist
    game.achievements.sort(function(a, b){
      var sa = a.streak || Number.MAX_SAFE_INTEGER, sb = b.streak || Number.MAX_SAFE_INTEGER;
      return sa - sb;
    });
  },

  streakTierColors: [
    { bg: '#ccc5ae', color: '#4a473f' }, // 2-9
    { bg: '#f2a53e', color: '#5c2f00' }, // 10-19
    { bg: '#f2793e', color: '#4a1400' }, // 20-29
    { bg: '#ef5b4e', color: '#ffffff' }, // 30-39
    { bg: '#e14f8a', color: '#ffffff' }, // 40-49
    { bg: '#a95bd1', color: '#ffffff' }, // 50-59
    { bg: '#6f6bd1', color: '#ffffff' }, // 60-69
    { bg: '#4a90d9', color: '#ffffff' }, // 70-79
    { bg: '#2bb3a3', color: '#ffffff' }, // 80-89
    { bg: '#d4af37', color: '#3d2b00' }  // 90-99, 100+
  ],

  updateStreakDisplay: function(){
    var el = $('#streakDisplay');
    if (this.streak >= 2) {
      var tier = Math.min(Math.floor(this.streak / 10), this.streakTierColors.length - 1);
      var tierColor = this.streakTierColors[tier];
      el.css({ backgroundColor: tierColor.bg, color: tierColor.color });
      el.text('⭐ Streak ' + this.streak).show();
    } else {
      el.hide();
    }
  },

  onWrongAnswer: function(txt){
    if (txt) {
      this.streak = 0;
      this.updateStreakDisplay();
      this.updateFeedbackText('<div class="box red-box">' + txt + '</div>');
      return;
    }
    this.streak = 0;
    this.updateStreakDisplay();
    var wrongtxt = '<h3>Fel svar. Försök igen!</h3>';
    // Efter andra felaktiga försöket på samma fråga - ge möjlighet att se svaret istället
    // för att tvingas fortsätta gissa på en fråga man kört fast på.
    if (this.wrongAttempts >= 2) {
      wrongtxt += '<button class="btn-small-3d" onclick="game.revealAnswer()">Visa svaret</button>';
    }
    this.updateFeedbackText('<div class="box red-box">' + wrongtxt + '</div>');
  },

  // Visar rätt svar på den aktuella frågan - man kan inte längre svara på den själv,
  // utan måste gå vidare med en ny fråga.
  revealAnswer: function(){
    $('#answerButton').attr('disabled', true);
    this.updateFeedbackText('<div class="box red-box"><h3>Det rätta svaret är '+this.currentAnswer+'</h3><button class="btn-small-3d" onclick="game.createNewQuestion()">Ny fråga</button></div>');
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
    // #gametime finns inte än när updateFixedPositions senast kördes (den körs bara på
    // visual viewport-resize/scroll) - positionera den mot #appContainer direkt nu istället
    // för att låta den stå kvar på sitt CSS-default (webbläsarfönstrets riktiga kant).
    if (game.updateFixedPositions) {
      game.updateFixedPositions();
    }

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
  },

  // t.ex. 90 -> "1 minut och 30 sekunder", 120 -> "2 minuter", 45 -> "45 sekunder"
  formatDuration: function(totalSeconds){
    var minutes = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    var minutesText = minutes + ' ' + game.pluralize(minutes, 'minut', 'minuter');
    var secsText = secs + ' ' + game.pluralize(secs, 'sekund', 'sekunder');
    if (minutes === 0) {
      return secsText;
    }
    if (secs === 0) {
      return minutesText;
    }
    return minutesText + ' och ' + secsText;
  }



}


// Tvingar fram en helt färsk sida: en riktig nätverkshämtning (cache: 'reload') av exakt den
// bokmärkta URL:en (utan query-sträng), så att webbläsarens cache för just den URL:en verkligen
// uppdateras innan vi navigerar dit - annars kan hemskärmsikonen fortsätta visa en gammal,
// cachad kopia nästa gång appen startas, även om den här sidan i minnet har senaste versionen.
function forceFreshAppReload(){
  var url = window.location.pathname;
  if (window.fetch) {
    fetch(url, { cache: 'reload' }).then(function(){
      window.location.href = url;
    }).catch(function(){
      window.location.href = url;
    });
  } else {
    window.location.href = url;
  }
}

// Att "stänga" en hemskärms-app på iPhone dödar den oftast inte - iOS pausar bara sidan i minnet,
// och att öppna appen igen återupptar EXAKT samma sida/JS-tillstånd utan någon som helst
// nätverkshämtning. Därför hjälper ingen cache-strategi mot det - sidan laddas aldrig om alls.
// "pageshow" med event.persisted === true talar om att sidan just återupptagits på det sättet
// (istället för att ha laddats fräscht), så tvinga då fram en riktig, färsk omladdning.
window.addEventListener('pageshow', function(event){
  if (event.persisted) {
    forceFreshAppReload();
  }
});

$(document).ready(function() {
  // Visa splash-skärmen med loggan i 3 sekunder innan den tonas bort
  setTimeout(function(){
    $('#splashScreen').addClass('fade-out');
    setTimeout(function(){
      $('#splashScreen').remove();
    }, 600);
  }, 3000);

  game.loadSettings();
  game.loadCustomDifficultySettings();
  game.loadHideVisualHelpSetting();
  game.renderMascotDisplay();
  game.buildBackgroundAchievements();
  game.applyBackgroundColor();

  // window.resize (till skillnad från visualViewport.resize) triggas av en riktig storleksändring
  // - t.ex. att skärmen roteras eller att man ändrar bredd på fönstret på desktop - men INTE av
  // att mobilens tangentbord fälls upp/ner. Uppdatera därför fullScreenHeight bara här, så att
  // emoji-burstens startpunkt (se emojiBurst) följer med vid en riktig storleksändring men
  // förblir opåverkad av tangentbordet.
  $(window).on('resize', function(){
    game.fullScreenHeight = window.innerHeight;
  });

  // Inställningsikonerna: kugghjulet (vanliga inställningar) är synligt som vanligt,
  // utom när man kommer in via en elevlänk (?s=...) - då ska alla inställningar vara dolda,
  // eller i lärarläge (?t=y) - där täcker läraringången (mössan) redan samma inställningar.
  // Emojisamlingen (leendet) är alltid synlig - det är bara en vy av ens egna poäng/emojis.
  var hasStudentLink = !!game.getUrlParam('s');
  var teacherMode = game.isTeacher();
  // Dela-ikonen döljs också för elevlänkar - annars kan en elev dela en länk utan lärarens inställningar.
  if (hasStudentLink) {
    $('#settingsButton').hide();
    $('#teacherButton').hide();
    $('#shareButton').hide();
  } else if (teacherMode) {
    $('#settingsButton').hide();
    $('#teacherButton').show();
  } else {
    $('#teacherButton').hide();
  }
  game.layoutMenuIcons();

  // Applicera elevlänkens ?s=-inställningar (döljer knappar/svårighetsval, sätter svårighetsgrad)
  game.applyStudentViewFromUrl();

  // Hindra minustecken i inställningarnas talintervall (plus/minus/multiplikation/test) -
  // dessa ska aldrig kunna vara negativa
  $(document).on('input', '.no-negative', function(){
    var value = $(this).val();
    if (value.indexOf('-') !== -1) {
      $(this).val(value.replace(/-/g, ''));
    }
  });

  // Tabell eller faktorintervall: stäng av intervallfälten direkt när en tabell skrivs in
  $('[name=multtable]').on('input', function(){
    game.updateMultTableState(game.getMultTestFields());
  });
  $('#t-multtable').on('input', function(){
    game.updateMultTableState(game.getTeacherMultTestFields());
  });

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
    if (!window.confirm('Är du säker? Alla inställningar på den här sidan återställs till standardvärden.')) {
      return;
    }
    $('#t-minplus').val(0);
    $('#t-maxplus').val(100);
    $('#t-minminus').val(0);
    $('#t-maxminus').val(100);
    $('#t-mina').val(0);
    $('#t-maxa').val(10);
    $('#t-minb').val(0);
    $('#t-maxb').val(10);
    $('#t-multtable').val('');
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

    $('#checkAllowEasy').prop('checked', false);
    $('#checkAllowMedium').prop('checked', true);
    $('#checkAllowHard').prop('checked', false);
    $('#checkAllowCustom').prop('checked', false);

    game.saveCustomSettings(game.getTeacherMultTestFields());
    game.saveHideVisualHelpSetting($('#t-checkHideVisualHelp'));
    game.saveStudentViewSettings();
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
    game.renderQr(document.getElementById('studentQr'), link);
  });

  // Spelets egen länk, utan parametrar - så att den som skannar får en vanlig Räknix
  // Dela-skärmen: spelets egen länk, utan parametrar - så att den som skannar får en vanlig Räknix
  var gameUrl = window.location.origin + window.location.pathname;
  game.renderQr(document.getElementById('gameQr'), gameUrl);
  $('#gameUrlText').text(gameUrl);

  $('#shareButton').on('click', function(e){
    e.preventDefault();
    game.mEl.hide();
    game.shareEl.show();
  });

  $('#shareclose').on('click', function(e){
    e.preventDefault();
    game.shareEl.hide();
    game.mEl.show();
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
  
  $('#clearMistakes').on('click', function(e){
    e.preventDefault();
    if (!window.confirm('Är du säker? Alla tal du gjort fel på tas bort från "Öva på fel".')) {
      return;
    }
    localStorage.removeItem('mistakes');
    game.updateMistakeButton();
  });

  var clearSettingsButton = $('#clearSettings');
  clearSettingsButton.on('click', function(e){
    e.preventDefault();
    if (!window.confirm('Är du säker? Alla inställningar på den här sidan återställs till standardvärden.')) {
      return;
    }
    $('[name=minplus]').val(0);
    $('[name=maxplus]').val(100);
    $('[name=minminus]').val(0);
    $('[name=maxminus]').val(100);
    $('[name=mina]').val(0);
    $('[name=maxa]').val(10);
    $('[name=minb]').val(0);
    $('[name=maxb]').val(10);
    $('[name=multtable]').val('');
    $('[name=test-nbr-of-questions]').val(50);
    $('[name=test-time]').val(300);
    $('#checkHideVisualHelp').prop('checked', false);

    game.saveCustomSettings();
    game.saveHideVisualHelpSetting();
  });

  $('#reloadAppButton, #t-reloadAppButton').on('click', function(e){
    e.preventDefault();
    forceFreshAppReload();
  });

  // Maskoten (till skillnad från den lilla leende-ikonen, som bara finns i menyn) syns på alla
  // skärmar - t.ex. mitt i ett pågående spel. Kom då ihåg vilken skärm som faktiskt var synlig
  // innan samlingen öppnades, så att "Tillbaka" återställer RÄTT skärm istället för att alltid
  // gå till menyn (vilket annars lämnade den gamla skärmen kvar dold "under" menyn).
  game.viewBeforeCollection = null;

  var openEmojiCollection = function(){
    var views = [game.mEl, game.el, game.tEl, game.setEl, game.shareEl, game.teacherEl];
    game.viewBeforeCollection = null;
    for (var i = 0; i < views.length; i++) {
      if (views[i].is(':visible')) {
        game.viewBeforeCollection = views[i];
        break;
      }
    }
    game.renderEmojiCollection();
    if (game.viewBeforeCollection) {
      game.viewBeforeCollection.hide();
    }
    $('#emojiCollection').show();
  };

  var collectionButton = $('#collectionButton');
  collectionButton.on('click', function(e){
    e.preventDefault();
    openEmojiCollection();
  });

  // Med Flexa-prestationen tar maskoten en till flex-skärmen, annars studsar den bara till
  var mascotDisplay = $('#mascotDisplay');
  mascotDisplay.on('click', function(e){
    e.preventDefault();
    if (game.hasAchievement('flex')) {
      game.openFlexScreen();
    } else {
      game.bounceMascot();
    }
  });

  var emojiCollectionCloseButton = $('#emojiCollectionclose');
  emojiCollectionCloseButton.on('click', function(e){
    e.preventDefault();
    $('#emojiCollection').hide();
    (game.viewBeforeCollection || game.mEl).show();
    game.viewBeforeCollection = null;
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

  // Byt bakgrundsfärg bland de upplåsta (eller tillbaka till Standard)
  $('#emojiCollection').on('click', '.background-swatch', function(e){
    e.preventDefault();
    game.setBackgroundAchievement($(this).data('achievement'));
    game.renderBackgroundPicker();
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


  $('#mistakeButton').on('click', function(e){
    e.preventDefault();
    game.startMistakePractice();
  });

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

    var numberOfQuestions = game.testmode[difficulty].numberOfQuestions;
    var duration = game.formatDuration(game.testmode[difficulty].time);
    $('#testInfoDescription').html('Du ska försöka svara på <strong>' + numberOfQuestions + ' frågor</strong>. ' +
      'Det går på <strong>tid</strong> och du har <strong>' + duration + '</strong> på dig!');

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
    // Flytta fokus till "Ny fråga" (som redan låg bakom popupen) så man kan fortsätta
    // trycka Enter rakt igenom utan att behöva klicka någonstans.
    $('#newQuestion').focus();
  })

  var achievementUnlockCloseButton = $('#achievementUnlockClose');
  achievementUnlockCloseButton.on('click', function(e){
    e.preventDefault();
    $('#achievementUnlockPopup').hide();
    // Låg emoji-popupen bakom, fortsätt dit - annars till "Ny fråga"
    if ($('#emojiUnlockPopup').is(':visible')) {
      $('#emojiUnlockClose').focus();
    } else {
      $('#newQuestion').focus();
    }
  });

  $('#flexclose').on('click', function(e){
    e.preventDefault();
    game.closeFlexScreen();
  });

  // Genväg till emojisamlingen - flex-skärmen ligger ovanpå den vanliga vyn, så stäng den först
  // så att samlingens "Tillbaka" hamnar på vyn som låg under (t.ex. ett pågående spel)
  $('#flexCollectionButton').on('click', function(e){
    e.preventDefault();
    game.closeFlexScreen();
    openEmojiCollection();
  });

  $('#flexMascot').on('click', function(e){
    e.preventDefault();
    game.flexMascot();
  });


  var answerButton = $('#answerButton');
  answerButton.on('click', function(e){
    e.preventDefault();
    var answer = $('#answerField').val();
    
    if (answer !== '') {
      answer = parseInt(answer, 10);

      if (answer === game.currentAnswer) {
        // Bara rätt på första försöket räknas mot att bli av med ett tal i fellistan
        if (game.wrongAttempts === 0) {
          game.mistakesCleared = game.recordCorrect(game.currentQ) && game.mistakeMode && game.getMistakeCount() === 0;
        }
        game.onCorrectAnswer();

      } else {
        game.wrongAttempts++;
        game.recordCurrentMistake();
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
  // Den horisontella infällningen (linje med den centrerade spelytan) sköts av CSS
  // (calc(50vw - ...)) på både .toolbar-fixed och #gametime - JS behöver bara hålla dem
  // synkade lodrätt med visual viewport, plus baren full bredd över hela den synliga ytan.
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
        gametime.style.top = (vv.offsetTop + 7) + 'px';
      }
    };
    window.visualViewport.addEventListener('resize', updateFixedPositions);
    window.visualViewport.addEventListener('scroll', updateFixedPositions);
    game.updateFixedPositions = updateFixedPositions;
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
