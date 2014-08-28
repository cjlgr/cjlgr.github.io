$(document).ready ->
  
  mpos =
    x: 0
    y: 0
  $para = $('.para');
  $para.find('img').css('position', 'absolute')
  
  $overlay = $('<div class="overlay"></div>')
  $para.append($overlay)
  
  $para.mouseenter (event) ->
    $overlay.css('opacity', '0')
    
  $para.mouseleave (event) ->
    $overlay.css('opacity', '0.7')
  face
  $para.mousemove (event) ->
  
    $images = $('.para img')
    $images.each (index)->
      $item = $(this)
      update($para, $item, (0.05*(index+0.1)))
      
update = ($para, $item, zoom) ->
  mpos =
    x: 0
    y: 0
  mpos.x = event.pageX - $para.offset().left
  mpos.y = event.pageY - $para.offset().top
  parawidth = $para.width()
  paraheight = $para.height()
  
  itempos = 
    w: $item.width()
    h: $item.height()
  newpos =
    left: 0
    top: 0  

  newpos.left = parawidth - mpos.x*zoom + (parawidth*(zoom/2)) - (parawidth/2 + itempos.w/2);
  newpos.top = paraheight - mpos.y*zoom + (paraheight*(zoom/2)) - (paraheight/2 + itempos.h/2);
    
  $item.css('left', newpos.left)
  $item.css('top', newpos.top)
