var adUnit;
var adUnitFullScreen;
var isOverlap = true; //true: overlap, false: split
var isTest = false;
var adIsLoaded = false;
var ads = {};
var adIsShowing = false;
/*
var adUnit;
var adUnitFullScreen;
var isOverlap = true; //true: overlap, false: split
var isTest = true;
*/
//android
if (navigator.userAgent.match(/Android/i)) {
    adUnit = "ca-app-pub-3385594529547579/5630503241";
    adUnitFullScreen = "ca-app-pub-3385594529547579/2411828446";
}
//ios
else if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
    //alert('is iphone');
    adUnit = "ca-app-pub-3385594529547579/7363405247";
    adUnitFullScreen = "ca-app-pub-3385594529547579/7121229646";
}

document.addEventListener("deviceready", function() {
    window.admob.setUp(adUnit, adUnitFullScreen, isOverlap, isTest);

    //banner ad callback
    window.admob.onBannerAdPreloaded = function() {
        adIsLoaded = true;
    };
    window.admob.onBannerAdLoaded = function() {
    };
    window.admob.onFullScreenAdHidden = function() {
      adIsShowing = false;
    };

}, false);

showAd = function() {
    if (adIsLoaded) {
        window.admob.showBannerAd('bottom-center', 'SMART_BANNER');
    }
}

preloadAd = function() {
  if (window.admob) {
    adIsLoaded = false;
    window.admob.preloadBannerAd();
  }
}

hideAd = function() {
  if (window.admob) {
    window.admob.hideBannerAd();
  }
}

preloadFullscreenAd = function() {
  if (window.admob) {
    window.admob.preloadFullScreenAd();
  }
}

showFullscreenAd = function() {
  if (window.admob) {
    adIsShowing = true;
    window.admob.showFullScreenAd();
  }
}
