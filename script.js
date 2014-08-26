$( document ).ready(function() {
    
    var images = [];
    
    var url = "https://api.instagram.com/v1/users/cral/media/recent/?client_id=";
    var clientid = "7b423a9f4f9a456da99581f04703add8"
    
    $.ajax({
        url: url + clientid,
        context: document.body,
        dataType: 'jsonp',
    }).done(function(response) {
        
        if (response.data) {
            var even = true;
            
            response.data.forEach(function(rec){
                even = !even;
                images.push(rec.images.standard_resolution.url)

                var $img = $('<img>').attr('src', rec.images.standard_resolution.url).addClass(even?'even':'odd');

                var $container = $('.images').append($img);

            });
        }
    });
});

$( document ).scroll(function(e) {
    var st = $( document ).scrollTop();
    $('body').css('background-position', '0px ' + st*0.3 + 'px')
    
    

    
});