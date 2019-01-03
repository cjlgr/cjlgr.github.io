var GlobalGameMusic;
var GlobalGameMusicIsPlaying = false;

getAudioPath = function () {
    return '';
    var path = window.location.pathname;
    path = path.substr(0, path.length - 10);
    return 'file://' + path;
}

isMusicAllowed = function () {
    var musicOn = localStorage.getItem('hopsop-music') === true || localStorage.getItem('hopsop-music') === 'true' || localStorage.getItem('hopsop-music') === null ? true : false;
    return musicOn;
}

toggleMusicAllowed = function () {
    var musicAllowed = isMusicAllowed();
    localStorage.setItem('hopsop-music', !musicAllowed);
    return isMusicAllowed();
}

startMusic = function (remix, game) {
    var me = this;
    if (isMusicAllowed() && (!GlobalGameMusic || !GlobalGameMusicIsPlaying) && !bgPaused) {
        if (isCordova && !isIos) {
            if (remix) {
                GlobalGameMusic = new Media(getAudioPath() + 'audio/mp3/music-remix.mp3', function () {
                }, function () {
                }, function (status) {
                    if (status == Media.MEDIA_STOPPED) {
                        GlobalGameMusic.setVolume(1);
                        GlobalGameMusic.play();
                        GlobalGameMusicIsPlaying = true;
                    }
                });
                GlobalGameMusic.setVolume(1);
                GlobalGameMusic.play();
                GlobalGameMusicIsPlaying = true;
            } else {
                GlobalGameMusic = new Media(getAudioPath() + 'audio/mp3/music.mp3', function () {
                }, function () {
                }, function (status) {
                    if (status == Media.MEDIA_STOPPED) {
                        GlobalGameMusic.setVolume(0.6);
                        GlobalGameMusic.play();
                        GlobalGameMusicIsPlaying = true;
                    }
                });
                GlobalGameMusic.setVolume(0.6);
                GlobalGameMusic.play();
                GlobalGameMusicIsPlaying = true;
            }
        }
        else {
            if (remix) {
                GlobalGameMusic = game.add.audio('musicremix');
                GlobalGameMusic.play('', 0, 1, true);
                GlobalGameMusicIsPlaying = true;
            } else {
                GlobalGameMusic = game.add.audio('music');
                GlobalGameMusic.play('', 0, 0.6, true);
                GlobalGameMusicIsPlaying = true;
            }
        }
    }
}

stopMusic = function () {
    if (GlobalGameMusic && GlobalGameMusicIsPlaying) {
        GlobalGameMusic.stop();
        GlobalGameMusicIsPlaying = false;
    }
}

pauseMusic = function () {
    if (GlobalGameMusic && GlobalGameMusicIsPlaying) {
        GlobalGameMusic.pause();
        GlobalGameMusicIsPlaying = false;
    }
}

resumeMusic = function () {
    if (isMusicAllowed() && GlobalGameMusic && !GlobalGameMusicIsPlaying) {
        GlobalGameMusic.play();
        GlobalGameMusicIsPlaying = true;
    }
}

loadRemix = function (game) {
    if (!isCordova) {
        game.load.audio('musicremix', ['audio/mp3/music-remix.mp3']); // Load special music
    }
}