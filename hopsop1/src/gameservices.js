var googleplaygame = googleplaygame || null;
document.addEventListener("deviceready", function() {
}, false);

googleShowToplist = function() {
  if (googleplaygame) {
    googleplaygame.isSignedIn(function (result) {
      // Signed in? Just show the leaderboard
      if (result.isSignedIn) {
        googleplaygame.showLeaderboard({
          leaderboardId: "CgkIydiu0IQUEAIQAA"
        });
      } else {
        googleplaygame.auth(
          function(){
            // Success

            // First, submit highest score
            var data = {
                score: localStorage.getItem('hopsop-high') || '0',
                leaderboardId: "CgkIydiu0IQUEAIQAA"
            };
            googleplaygame.submitScore(data, googleShowLeaderboard, googleShowLeaderboard);
          }, 
          function(){
            // Failed to sign in
            // Do nothing ...
          }
          );
      }
    });
  }
}

googleShowLeaderboard = function(score) {
  // Show leaderboard
  if (googleplaygame) {
    googleplaygame.showLeaderboard({
      leaderboardId: "CgkIydiu0IQUEAIQAA"
    });
  }
}

googlePublishScore = function(score) {
  // Publish score if user is signed in
  if (googleplaygame) {
    googleplaygame.isSignedIn(function (result) {
        if (result.isSignedIn) {
          var data = {
              score: score,
              leaderboardId: "CgkIydiu0IQUEAIQAA"
          };
          googleplaygame.submitScore(data);
        }
    });
  }
}