
// Variables
var win               = $( document.body )
var minus             = $( '.ui-footer .zoom-minus', win )
var plus              = $( '.ui-footer .zoom-plus', win )
var original          = $( '.ui-footer .zoom-original', win )
var zone              = $( '.weevisor-images', win )
var zoomUi            = $( '.weevisor-zoom', win )
var imgDom            = $( '.weevisor-images figure', win)
var uiBarTop          = $('.ui-header-desktop')
var loader            = $('.weevisor-images .loader')
var prevBtn           = $('.ui-footer .prev-btn')
var nextBtn           = $('.ui-footer .next-btn')
var presentationBtn   = $('.presentation-buttons .presentation')
var presentationMode  = false
var presInterval
var isWebKit          = /webkit/i.test( navigator.userAgent )
var view_margin       = 50
var prevClientX       = 0
var prevClientY       = 0
var hideControlsTimer = 0
var normalWidth       = 0
var normalHeight      = 0
var normalScale       = 0
var normalZoom        = -1
var pictures          = []
var picIndex          = -1
var horizontal        = true
var lastFile          = false
var zoom
var imageLoaded
var scale
var mobile = $('body').hasClass('wz-mobile-view')
var adjustScale = 1
var adjustDeltaX = 0
var adjustDeltaY = 0

var currentScale = null
var currentDeltaX = null
var currentDeltaY = null

var disabledHammerEvents = false

if( mobile ){
  uiBarTop = $('.ui-header-mobile')
}

//New variables
var imgWidth = -1
var imgHeight = -1
var dimensionsFront = []
var isVideo = false
var params = {}
var videoPrototype = $('video.wz-prototype')

// Private Methods
var asyncEach = function( list, step, callback ){

  var position = 0
  var closed   = false
  var checkEnd = function( error ){

    if( closed ){
      return
    }

    position++

    if( position === list.length || error ){

      closed = true

      callback( error )

      // Nullify
      list = step = callback = position = checkEnd = closed = null

    }

  }

  if( !list.length ){
    return callback()
  }

  list.forEach( function( item ){
    step( item, checkEnd )
  })

}

/*var _preciseDecimal = function( number ){
    return Math.floor(number * 100) / 100
}*/

var _startApp = function( paramsArg ){

  if( typeof paramsArg === 'undefined' ){
    paramsArg = params
  }

  if( paramsArg && paramsArg.command === 'openFile' ){

    if( paramsArg.list.length == 0 ){
      paramsArg.list = [paramsArg.data]
    }

    params = paramsArg

    imgDom.on( 'load', function(){

      if (this.complete){

        imgDom.css('visibility', 'visible')
        loader.hide()
        if( mobile ){
          //startMobile()
        }

        if( presentationMode && win.hasClass('fullscreen') ){

          presInterval = setTimeout( function(){
            if(presentationMode){
              nextBtn.click()
            }
          }, 4000)

        }

      }

    })

    // To Do -> Error
    console.log( paramsArg.list )

    if ( paramsArg.dropbox || paramsArg.gdrive || paramsArg.onedrive ) {
      _preloadCloud( paramsArg )
    }else{
      _preloadFS( paramsArg )
    }

  }

}

var _preloadCloud = function( paramsArg ){

  var cloud = paramsArg.dropbox ? 'dropbox' : ( paramsArg.gdrive ? 'gdrive' : 'onedrive' )
  var account = paramsArg.dropbox ? paramsArg.dropbox : ( paramsArg.gdrive ? paramsArg.gdrive : paramsArg.onedrive )
  pictures = []
  var newIndex = 0

  api.integration[ cloud ]( account, function( err, account ){

    asyncEach( paramsArg.list, function( item, callback ){

      var index = newIndex++

      account.get( item, function( error, structure ){

        if( !error && [ 'image/gif', 'image/jpeg', 'image/png', 'image/tiff' ].indexOf( structure.mime ) !== -1 ){

          if( structure.dropbox && ( !structure.media_info || !structure.media_info.metadata || !structure.media_info.metadata.dimensions ) ){
            structure.media_info = { metadata : { dimensions : { width : 700 , height : 450 } } }
          }
          pictures[ index ] = structure

        }

        callback()

      })

    }, function(){

      console.log( paramsArg.list.length, pictures.length, pictures )
      pictures = pictures.filter( function(item){ return item } )

      for( var i = 0; i < pictures.length; i++ ){

        if( pictures[ i ].id === paramsArg.data || paramsArg.data === 'provided' ){
          picIndex = i
          break
        }

      }

      _loadImage( pictures[picIndex] )

    })

  })

}

var _preloadFS = function( paramsArg ){

  pictures = []
  var newIndex = 0

  asyncEach( paramsArg.list, function( item, callback ){

    var index = newIndex++

    api.fs( item, function( error, structure ){

      if( error ){
        return callback()
      }

      if( [ 'image/gif', 'image/jpeg', 'image/png', 'image/tiff', 'video/x-theora+ogg', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-ms-asf', 'video/x-matroska', 'video/x-flv', 'video/webm', 'video/quicktime', 'video/mp4', 'video/3gpp' ].indexOf( structure.mime ) !== -1 ){

        structure.getFormats( function( error, formats ){
          structure.formats = formats
          pictures[ index ] = structure
          return callback()
        })

      }else{
        return callback()
      }

    })

  }, function(){

    console.log( paramsArg.list.length, pictures.length, pictures )

    pictures = pictures.filter( function(item){ return item } )

    for( var i = 0; i < pictures.length; i++ ){

      if( pictures[ i ].id === paramsArg.data || paramsArg.data === 'provided' ){
        picIndex = i
        break
      }

    }

    _loadImage( pictures[picIndex] )

  })

}

var _loadImage = function( file ){

  console.log(file)
  $( '.ui-header-brand span', win ).text( file.name )
  isVideo = (['video/x-theora+ogg', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-ms-asf', 'video/x-matroska', 'video/x-flv', 'video/webm', 'video/quicktime', 'video/mp4', 'video/3gpp' ].indexOf( file.mime ) !== -1)

  if( isVideo ){

    $('.video').remove()
    videoPrototype.clone().removeClass('wz-prototype').addClass('video').appendTo('.weevisor-images')
    $('.video').empty()
    $('.video').attr('poster', file.icons[1024])
    //$('.video').attr('src', file.formats['video/mp4'].url)
    $('.video').append( $('<source></source>').attr('type','video/mp4').attr('src', file.formats['video/mp4'].url) )
    loader.hide()
    imgDom.removeClass('active')
    $('.video').addClass('active')
    if( params.data === file.id ){
      $('.video')[0].play()
    }

  }else{

    $('.video').removeClass('active')
    imgDom.addClass('active')
    $('.video').remove()
    $('.video').empty()
    imageLoaded = file

    if ( file.dropbox ) {

      imgWidth  = parseInt( file.media_info.metadata.dimensions.width, 10 )
      imgHeight = parseInt( file.media_info.metadata.dimensions.height, 10 )

    }else if ( file.gdrive ){

      imgWidth  = parseInt( file.imageMediaMetadata.width, 10 )
      imgHeight = parseInt( file.imageMediaMetadata.height, 10 )

    }else if( file.onedrive ){

      imgWidth  = parseInt( file.image.width, 10 )
      imgHeight = parseInt( file.image.height, 10 )

    }else if( isVideo ){

      console.log(parseInt( file.formats[file.mime].metadata.media.video.resolution.w, 10 ), parseInt( file.formats[file.mime].metadata.media.video.resolution.h, 10 ))
      imgWidth  = parseInt( file.formats[file.mime].metadata.media.video.resolution.w, 10 )
      imgHeight = parseInt( file.formats[file.mime].metadata.media.video.resolution.h, 10 )

    }else{
      imgWidth  = parseInt( file.formats.original.metadata.exif.imageWidth, 10 )
      imgHeight = parseInt( file.formats.original.metadata.exif.imageHeight, 10 )
    }

    var scale1 = zone.width() / imgWidth 
    var scale2 = zone.height() / imgHeight 

    scale = (scale1 < scale2) ? scale1 : scale2

    /*if( scale1 < scale2 ){
      scale = scale1
    }else{
      scale = scale2
    }*/

    if( scale > 1 ){
      scale = 1
    }


    zoom = -1
    normalZoom = -1
    normalScale = scale
    _scaleImage( scale )

    if( mobile ){

      adjustScale = 1
      adjustDeltaX = 0
      adjustDeltaY = 0
      disabledHammerEvents = true
      //Si es mobile cargamos la preview

      imgDom.css( 'background-image', 'url(' + file.icons[1024] + ')' )
      imgDom.css('transform', 'scale(' + adjustScale + ') translate(' + adjustDeltaX + ',' + adjustDeltaY + ')')
      
      setTimeout(function(){
        disabledHammerEvents = false
      },1)

    }else{
      if( file.dropbox ){
        imgDom.attr( 'src', 'https://download.horbito.com/dropbox/' + file.account + '/' + encodeURIComponent( file.id ) )
      }else if( file.gdrive ){
        imgDom.attr( 'src', 'https://download.horbito.com/gdrive/' + file.account + '/' + encodeURIComponent( file.id ) )
      }else if( file.onedrive ){
        imgDom.attr( 'src', 'https://download.horbito.com/onedrive/' + file.account + '/' + encodeURIComponent( file.id ) )
      }else{
        imgDom.attr( 'src', file.formats.original.url )
      }
    }

  }

}

var _scaleImage = function( scaleArg ){

  //scale = _preciseDecimal( parseFloat( scaleArg, 10 ) )
  scale = scaleArg

  if( isNaN( scale ) || scale <= 0 || scale > 5 ){
    return false
  }

  console.log(scale, imgWidth, imgHeight)
  dimensionsFront[0] = parseInt( scale * imgWidth, 10 )
  dimensionsFront[1] = parseInt( scale * imgHeight, 10 )

  imgDom
    .width( dimensionsFront[0] )
    .height( dimensionsFront[1] )
    .css('background-size', dimensionsFront[0] + 'px ' + dimensionsFront[1] + 'px')


  //zoomUi.val( _preciseDecimal( scale * 100 ) )

  _marginImage()
  //_detectCursor()

}

var _marginImage = function(){

  var scale = ( zone.height() - imgDom.height() ) / 2
  imgDom.css( 'margin-top', scale > 0 ? scale : 0 )

}


/* fullscreen mode */
/*var toggleFullscreen = function(){

  if( win.hasClass( 'fullscreen' ) ){

    api.tool.exitFullscreen()

  }else{

    if( win[ 0 ].requestFullScreen ){
        win[ 0 ].requestFullScreen()
    }else if( win[ 0 ].webkitRequestFullScreen ){
        win[ 0 ].webkitRequestFullScreen()
    }else if( win[ 0 ].mozRequestFullScreen ){
        win[ 0 ].mozRequestFullScreen()
    }else{
        alert( lang.fullscreenSupport )
    }

    normalWidth  = win.width()
    normalHeight = win.height()
    normalScale  = scale
    normalZoom   = zoom

  }

}*/


win
/*.on( 'click', '.ui-fullscreen', function(){
    toggleFullscreen()
})*/

.on('click', '.ui-footer .prev-btn', function(){

  if( pictures.length !== 1 ){

    //imgDom.css('visibility', 'hidden')
    loader.show()

    if( picIndex > 0 ){
      picIndex--
      _loadImage(pictures[picIndex])
    }else{
      picIndex = pictures.length - 1
      _loadImage(pictures[picIndex])
    }
  }

})

.on('click', '.ui-footer .next-btn', function(){

  if( pictures.length !== 1 ){

    //imgDom.css('visibility', 'hidden')
    loader.show()

    if( presentationMode ){
      clearTimeout( presInterval )
    }

    if( picIndex < pictures.length - 1 ){
      picIndex++
      _loadImage(pictures[picIndex])
    }else{
      picIndex = 0
      _loadImage(pictures[picIndex])
    }
  }

})

/*.on( 'enterfullscreen', function(){

  win.addClass('fullscreen')
  loader.addClass('fullscreen')

  win.css( 'width', screen.width )
  win.css( 'height', screen.height )

  var width  = parseInt( imageLoaded.formats.original.metadata.exif.imageWidth, 10 )
  var height = parseInt( imageLoaded.formats.original.metadata.exif.imageHeight, 10 )

  var scale1 = screen.width / width 
  var scale2 = screen.height / height 

  if( scale1 < scale2 ){
    scale = scale1
  }else{
    scale = scale2
  }

  if( scale > 1 ){
    scale = 1
  }

  zoom = -1

  hideControls()
  _scaleImage( scale )
  zoomUi.val( scale * 100 )

})

.on( 'exitfullscreen', function(){

  if( presentationMode ){
    //clearInterval(presInterval)
    presentationMode=false
  }

  win.removeClass('fullscreen')
  loader.removeClass('fullscreen')

  win.css( 'width', normalWidth )
  win.css( 'height', normalHeight )

  showControls()

  _scaleImage( normalScale )
  zoom = normalZoom
  zoomUi.val( _preciseDecimal( normalScale * 100 ) )

})*/

.on( 'swiperight', function(ev){
  console.log('swiperight',prevBtn)
  prevBtn.click()
})

.on( 'swipeleft', function(ev){
  console.log('swipeleft',nextBtn)
  nextBtn.click()
})

.on( 'pinch pan' , function(ev){

  if( !disabledHammerEvents && !isVideo ){

    //console.log(ev)
    currentScale = adjustScale * ev.originalEvent.gesture.scale
    currentDeltaX = adjustDeltaX + (ev.originalEvent.gesture.deltaX / currentScale)
    currentDeltaY = adjustDeltaY + (ev.originalEvent.gesture.deltaY / currentScale)
    if( currentScale < 1 ){
      currentScale = 1
    }

    if( currentDeltaX < 0 ){

      currentDeltaX = (Math.abs(currentDeltaX) > (dimensionsFront[0]/4)*currentScale) ? (-1*dimensionsFront[0]/4)*currentScale : currentDeltaX
      if( Math.abs(currentDeltaX) > dimensionsFront[0]/2 ){
        currentDeltaX = -1*dimensionsFront[0]/2
      }

    }else{

      currentDeltaX = (currentDeltaX > (dimensionsFront[0]/4)*currentScale) ? (dimensionsFront[0]/4)*currentScale : currentDeltaX
      if( currentDeltaX > dimensionsFront[0]/2 ){
        currentDeltaX = dimensionsFront[0]/2
      }

    }

    if( currentDeltaY < 0 ){

      currentDeltaY = Math.abs(currentDeltaY) > (dimensionsFront[1]/4)*currentScale ? (-1*dimensionsFront[1]/4)*currentScale : currentDeltaY
      if( Math.abs(currentDeltaY) > dimensionsFront[1]/2 ){
        currentDeltaY = -1*dimensionsFront[1]/2
      }

    }else{

      currentDeltaY = currentDeltaY > (dimensionsFront[1]/4)*currentScale ? (dimensionsFront[1]/4)*currentScale : currentDeltaY
      if( currentDeltaY > dimensionsFront[1]/2 ){
        currentDeltaY = dimensionsFront[1]/2
      }

    }

    console.log('pinch pan',currentScale, currentDeltaX, currentDeltaY, imgDom)
    imgDom.css('transform', 'scale(' + currentScale + ') translate(' + currentDeltaX + ',' + currentDeltaY + ')')

  }

})

.on( 'pinchend panend' , function(e){

  if( !disabledHammerEvents && !isVideo ){

    adjustScale = currentScale
    adjustDeltaX = currentDeltaX
    adjustDeltaY = currentDeltaY

    if( adjustScale === 1 ){
      adjustDeltaX = 0
      adjustDeltaY = 0
    }

    imgDom.css('transform', 'scale(' + adjustScale + ') translate(' + adjustDeltaX + ',' + adjustDeltaY + ')')

  }

})

/*presentationBtn.on('click', function(){

  toggleFullscreen()
  presentationMode = true
  presInterval = setTimeout( function(){
    nextBtn.click()
  }, 3000)

})

if( location.host.indexOf('file') !== -1 ){
  api.app.maximizeView( win )
}*/


var params = window.params
if( typeof params !== 'undefined' ){
  _startApp( params )
}

/*win.on( 'app-param', function( e, paramsArg ){
  console.log('disparo el evento', arguments )
  _startApp( paramsArg )
})*/
