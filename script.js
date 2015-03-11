$( document ).ready(function() {
    
    var images = [];
    
    var url = "https://api.instagram.com/v1/users/9907286/media/recent/?client_id=";
    //var url = "https://api.instagram.com/v1/users/3/media/recent/?client_id=";
    
    var clientid = "7b423a9f4f9a456da99581f04703add8"
    /*
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

                var $img = $('<img>').attr('src', rec.images.standard_resolution.url);
                var $imglink = $('<a></a>').attr('href', rec.link).attr('target', '_blank').append($img);
                var $imgwrapper = $('<div></div>').addClass('imgwrapper').addClass(even?'even':'odd').append($imglink);
                var $container = $('.images').append($imgwrapper);
                
                if (rec.comments.count > 0) {
                    rec.comments.data.forEach(function(comment){
                        $('<div></div>').addClass('clear').appendTo($imgwrapper);
                        $('<p><span>'+comment.text+' /'+comment.from.username+'</span></p>').addClass('img-text').appendTo($imgwrapper);
                        
                    });
                }
                
                if (even) {
                    $('.images').append($('<div></div>').addClass('clear'));
                }

            });
        }
    });
    */
});

$( document ).scroll(function(e) {
    var st = $( document ).scrollTop();
    var showBG = true;
    
    if (st > 70) {
        $('body').addClass('top');
    } else {
        $('body').removeClass('top');
    }
    //$('body').css('background-position', '0px ' + st*0.3 + 'px')
    
    

    
});