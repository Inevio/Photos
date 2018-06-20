
// Variables
var win               = $( document.body );
var minus             = $( '.ui-footer .zoom-minus', win );
var plus              = $( '.ui-footer .zoom-plus', win );
var original          = $( '.ui-footer .zoom-original', win );
var zone              = $( '.weevisor-images', win );
var zoomUi            = $( '.weevisor-zoom', win );
var imgDom            = $( '.weevisor-images img', win);
var uiBarTop          = $('.ui-header-desktop');
var loader            = $('.weevisor-images .loader');
var prevBtn           = $('.ui-footer .prev-btn');
var nextBtn           = $('.ui-footer .next-btn');
var presentationBtn   = $('.presentation-buttons .presentation');
var presentationMode  = false;
var presInterval;
var isWebKit          = /webkit/i.test( navigator.userAgent );
var view_margin       = 50;
var prevClientX       = 0;
var prevClientY       = 0;
var hideControlsTimer = 0;
var normalWidth       = 0;
var normalHeight      = 0;
var normalScale       = 0;
var normalZoom        = -1;
var pictures          = [];
var picIndex          = -1;
var horizontal        = true;
var lastFile          = false;
var zoom;
var imageLoaded;
var scale;
var mobile = $('body').hasClass('wz-mobile-view')

if( mobile ){
  uiBarTop = $('.ui-header-mobile');
}

//New variables
var imgWidth = -1;
var imgHeight = -1;


// Private Methods
var asyncEach = function( list, step, callback ){

  var position = 0;
  var closed   = false;
  var checkEnd = function( error ){

    if( closed ){
      return;
    }

    position++;

    if( position === list.length || error ){

      closed = true;

      callback( error );

      // Nullify
      list = step = callback = position = checkEnd = closed = null;

    }

  };

  if( !list.length ){
    return callback();
  }

  list.forEach( function( item ){
    step( item, checkEnd );
  });

};

/*var _preciseDecimal = function( number ){
    return Math.floor(number * 100) / 100;
};*/

var _startApp = function( paramsArg ){

  if( typeof paramsArg === 'undefined' ){
    paramsArg = params
  }

  if( paramsArg && paramsArg.command === 'openFile' ){

    if( paramsArg.list.length == 0 ){
      paramsArg.list = [paramsArg.data];
    }

    $( '.weevisor-images img').on( 'load', function(){

      if (this.complete){

        imgDom.css('visibility', 'visible');
        loader.hide();
        if( mobile ){
          //startMobile();
        }

        if( presentationMode && win.hasClass('fullscreen') ){

          presInterval = setTimeout( function(){
            if(presentationMode){
              nextBtn.click();
            }
          }, 4000);

        }

      }

    });

    // To Do -> Error
    console.log( paramsArg.list )

    if ( paramsArg.dropbox || paramsArg.gdrive || paramsArg.onedrive ) {
      _preloadCloud( paramsArg );
    }else{
      _preloadFS( paramsArg )
    }

  }

}

var _preloadCloud = function( paramsArg ){

  var cloud = paramsArg.dropbox ? 'dropbox' : ( paramsArg.gdrive ? 'gdrive' : 'onedrive' )
  var account = paramsArg.dropbox ? paramsArg.dropbox : ( paramsArg.gdrive ? paramsArg.gdrive : paramsArg.onedrive )
  pictures = [];
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

      });

    }, function(){

      console.log( paramsArg.list.length, pictures.length, pictures )
      pictures = pictures.filter( function(item){ return item } )

      for( var i = 0; i < pictures.length; i++ ){

        if( pictures[ i ].id === paramsArg.data || paramsArg.data === 'provided' ){
          picIndex = i
          break
        }

      }

      _loadImage( pictures[picIndex] );

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
        return callback();
      }

      if( [ 'image/gif', 'image/jpeg', 'image/png', 'image/tiff', 'video/x-theora+ogg', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-ms-asf', 'video/x-matroska', 'video/x-flv', 'video/webm', 'video/quicktime', 'video/mp4', 'video/3gpp' ].indexOf( structure.mime ) !== -1 ){

        structure.getFormats( function( error, formats ){
          structure.formats = formats
          pictures[ index ] = structure
          return callback()
        });

      }else{
        return callback()
      }

    });

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
  $( '.ui-header-brand span', win ).text( file.name );
  imageLoaded = file;

  if ( file.dropbox ) {

    imgWidth  = parseInt( file.media_info.metadata.dimensions.width, 10 );
    imgHeight = parseInt( file.media_info.metadata.dimensions.height, 10 );

  }else if ( file.gdrive ){

    imgWidth  = parseInt( file.imageMediaMetadata.width, 10 );
    imgHeight = parseInt( file.imageMediaMetadata.height, 10 );

  }else if( file.onedrive ){

    imgWidth  = parseInt( file.image.width, 10 );
    imgHeight = parseInt( file.image.height, 10 );

  }else if( ['video/x-theora+ogg', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-ms-asf', 'video/x-matroska', 'video/x-flv', 'video/webm', 'video/quicktime', 'video/mp4', 'video/3gpp' ].indexOf( file.mime ) !== -1 ){

    console.log(parseInt( file.formats[file.mime].metadata.media.video.resolution.w, 10 ), parseInt( file.formats[file.mime].metadata.media.video.resolution.h, 10 ))
    imgWidth  = parseInt( file.formats[file.mime].metadata.media.video.resolution.w, 10 );
    imgHeight = parseInt( file.formats[file.mime].metadata.media.video.resolution.h, 10 );

  }else{
    imgWidth  = parseInt( file.formats.original.metadata.exif.imageWidth, 10 );
    imgHeight = parseInt( file.formats.original.metadata.exif.imageHeight, 10 );
  }

  var scale1 = zone.width() / imgWidth ;
  var scale2 = zone.height() / imgHeight ;

  scale = (scale1 < scale2) ? scale1 : scale2

  /*if( scale1 < scale2 ){
    scale = scale1;
  }else{
    scale = scale2;
  }*/

  if( scale > 1 ){
    scale = 1;
  }


  zoom = -1;
  normalZoom = -1;
  normalScale = scale;
  _scaleImage( scale );

  if( mobile ){
    //Si es mobile cargamos la preview
    $( '.weevisor-images img').attr( 'src', file.icons[1024] );
  }else{
    if( file.dropbox ){
      $( '.weevisor-images img').attr( 'src', 'https://download.horbito.com/dropbox/' + file.account + '/' + encodeURIComponent( file.id ) );
    }else if( file.gdrive ){
      $( '.weevisor-images img').attr( 'src', 'https://download.horbito.com/gdrive/' + file.account + '/' + encodeURIComponent( file.id ) );
    }else if( file.onedrive ){
      $( '.weevisor-images img').attr( 'src', 'https://download.horbito.com/onedrive/' + file.account + '/' + encodeURIComponent( file.id ) );
    }else{
      $( '.weevisor-images img').attr( 'src', file.formats.original.url );
    }
  }


};

var _scaleImage = function( scaleArg ){

  //scale = _preciseDecimal( parseFloat( scaleArg, 10 ) );
  scale = scaleArg;
  var dimensionsFront = []

  if( isNaN( scale ) || scale <= 0 || scale > 5 ){
    return false;
  }

  console.log(scale, imgWidth, imgHeight)
  dimensionsFront[0] = parseInt( scale * imgWidth, 10 )
  dimensionsFront[1] = parseInt( scale * imgHeight, 10 )

  $( 'img', zone )
    .width( dimensionsFront[0] )
    .height( dimensionsFront[1] );

  //zoomUi.val( _preciseDecimal( scale * 100 ) );

  _marginImage();
  //_detectCursor();

};

var _marginImage = function(){

  var img   = $( 'img', zone );
  console.log(zone.height(),img.height(),zone.height() - img.height())
  var scale = ( zone.height() - img.height() ) / 2;

  img.css( 'margin-top', scale > 0 ? scale : 0 );

};

/*var _scaleButton = function( dir ){

  if( zoom === -1 || win.hasClass('fullscreen') ){

      var i = 0;
      var j = validZoom.length;

      if( dir > 0 ){

          for( i = 0; i < j; i++ ){
              if( validZoom[ i ] > scale ) break;
          }

      }else{

          for( i = 0; i < j; i++ ){
              if( validZoom[ i ] <= scale && validZoom[ i + 1 ] > scale ) break;
          }

          if( validZoom[ i ] === scale && validZoom[ i - 1 ] ){
              i--;
          }

          if( i >= validZoom.length ){
              i = validZoom.length - 2;
          }

      }

      zoom = i ;
      _scaleImage( validZoom[ zoom ] );
      zoomUi.val( _preciseDecimal( scale * 100 ) );

  }else if( validZoom[ zoom + dir ] && !win.hasClass('fullscreen') ){

      var newZoom  = zoom + dir;
      var winScale = scale;

      if( dir > 0 && validZoom[ zoom ] < winScale && validZoom[ newZoom ] >= winScale ){

          zoom = -1 ;
          newZoom = winScale;

      }else if( dir < 0 && validZoom[ zoom ] > winScale && validZoom[ newZoom ] < winScale ){

          zoom = -1;
          newZoom = winScale;

      }else{

          zoom = newZoom ;
          newZoom = validZoom[ zoom ];

      }

      _scaleImage( newZoom );
      zoomUi.val( _preciseDecimal( scale * 100 ) );

  }

};*/

/*var _detectCursor = function(){

  var img = $( 'img', zone );

  if( img.height() <= zone.height() && img.width() <= zone.width() ){
    zone.addClass('hide-hand');
  }else{
    zone.removeClass('hide-hand');
  }

};*/

/* fullscreen mode */
/*var toggleFullscreen = function(){

  if( win.hasClass( 'fullscreen' ) ){

    api.tool.exitFullscreen();

  }else{

    if( win[ 0 ].requestFullScreen ){
        win[ 0 ].requestFullScreen();
    }else if( win[ 0 ].webkitRequestFullScreen ){
        win[ 0 ].webkitRequestFullScreen();
    }else if( win[ 0 ].mozRequestFullScreen ){
        win[ 0 ].mozRequestFullScreen();
    }else{
        alert( lang.fullscreenSupport );
    }

    normalWidth  = win.width();
    normalHeight = win.height();
    normalScale  = scale;
    normalZoom   = zoom;

  }

};*/

/*var showControls = function(){

  uiBarTop.stop().clearQueue();
  uiBarTop.css( 'display', 'block' );

};

var hideControls = function(){

  uiBarTop.stop().clearQueue();
  uiBarTop.css( 'display' , 'none' );

};*/

win
/*.on( 'click', '.ui-fullscreen', function(){
    toggleFullscreen();
})*/

.on('click', '.ui-footer .prev-btn', function(){

  if( pictures.length !== 1 ){

    imgDom.css('visibility', 'hidden');
    loader.show();

    if( picIndex > 0 ){
      picIndex--;
      _loadImage(pictures[picIndex]);
    }else{
      picIndex = pictures.length - 1;
      _loadImage(pictures[picIndex]);
    }
  }

})

.on('click', '.ui-footer .next-btn', function(){

  if( pictures.length !== 1 ){

    imgDom.css('visibility', 'hidden');
    loader.show();

    if( presentationMode ){
      clearTimeout( presInterval );
    }

    if( picIndex < pictures.length - 1 ){
      picIndex++;
      _loadImage(pictures[picIndex]);
    }else{
      picIndex = 0;
      _loadImage(pictures[picIndex]);
    }
  }

})

/*.on( 'enterfullscreen', function(){

  win.addClass('fullscreen');
  loader.addClass('fullscreen');

  win.css( 'width', screen.width );
  win.css( 'height', screen.height );

  var width  = parseInt( imageLoaded.formats.original.metadata.exif.imageWidth, 10 );
  var height = parseInt( imageLoaded.formats.original.metadata.exif.imageHeight, 10 );

  var scale1 = screen.width / width ;
  var scale2 = screen.height / height ;

  if( scale1 < scale2 ){
    scale = scale1;
  }else{
    scale = scale2;
  }

  if( scale > 1 ){
    scale = 1;
  }

  zoom = -1;

  hideControls();
  _scaleImage( scale );
  zoomUi.val( scale * 100 );

})

.on( 'exitfullscreen', function(){

  if( presentationMode ){
    //clearInterval(presInterval);
    presentationMode=false;
  }

  win.removeClass('fullscreen');
  loader.removeClass('fullscreen');

  win.css( 'width', normalWidth );
  win.css( 'height', normalHeight );

  showControls();

  _scaleImage( normalScale );
  zoom = normalZoom;
  zoomUi.val( _preciseDecimal( normalScale * 100 ) );

})

.on( 'ui-view-maximize', function(){
    win.addClass( 'maximized' );
})

.on( 'ui-view-unmaximize', function(){
    win.removeClass( 'maximized' );
})

.on( 'mousemove', function( e ){

  if( e.clientX !== prevClientX || e.clientY !== prevClientY ){

    prevClientX = e.clientX;
    prevClientY = e.clientY;

    clearTimeout( 0 );

  }

})*/

.on( 'swiperight', function(){
  console.log('swiperight',prevBtn)
  prevBtn.click();
})

.on( 'swipeleft', function(){
  console.log('swipeleft',nextBtn)
  nextBtn.click();
})

.on( 'pinch' , function(e){
  console.log('pinch');
  e.preventDefault();
  e.stopPropagation();
})

.on( 'pinchend' , function(e){
  e.preventDefault();
  e.stopPropagation();
})

/*.on( 'ui-view-resize ui-view-maximize ui-view-unmaximize', function(){

  _marginImage();

})*/
/*.key( 'left, pageup', function(){
  prevBtn.click();
})

.key( 'right, pagedown', function(){
  nextBtn.click();
})

.key( 'numadd', function(){
    plus.click();
})

.key( 'numsubtract', function(){
    minus.click();
})*/

/*minus
.on( 'click', function(){

  var zoom2   = zoom;
  var scrollX = 0;
  var scrollY = 0;
  var resize  = ( zone[ 0 ].scrollWidth - zone[ 0 ].offsetWidth ) || ( zone[ 0 ].scrollHeight - zone[ 0 ].offsetHeight );

  if( resize ){

    var perX = ( zone[ 0 ].scrollLeft + ( zone[ 0 ].offsetWidth / 2 ) ) / zone[ 0 ].scrollWidth;
    var perY = ( zone[ 0 ].scrollTop + ( zone[ 0 ].offsetHeight / 2 ) ) / zone[ 0 ].scrollHeight;

  }

  _scaleButton( -1 );

  // Si no se comprueba el zoom se pueden emular desplazamientos, esto lo previene
  if( zoom2 !== zoom ){

    if( resize ){

      scrollX = ( zone[ 0 ].scrollWidth * perX ) - ( zone[ 0 ].offsetWidth * perX );
      scrollY = ( zone[ 0 ].scrollHeight * perY ) - ( zone[ 0 ].offsetHeight * perY );

    }

    zone
      .scrollLeft( scrollX )
      .scrollTop( scrollY );

  }

});

original.on('click', function(){

  _scaleImage(1);
  zoom = 13;
  zone.scrollLeft( imgDom.width() / 2 - zone.width() / 2 ).scrollTop( imgDom.height() / 2 - zone.height() / 2 );

});

plus
.on( 'click', function(){

  var zoom2    = zoom;
  var scrollX = 0;
  var scrollY = 0;
  var resize  = ( zone[ 0 ].scrollWidth - zone[ 0 ].offsetWidth ) || ( zone[ 0 ].scrollHeight - zone[ 0 ].offsetHeight );

  if( resize || zoom === -1 ){

    var perX = ( zone[ 0 ].scrollLeft + ( zone[ 0 ].offsetWidth / 2 ) ) / zone[ 0 ].scrollWidth;
    var perY = ( zone[ 0 ].scrollTop + ( zone[ 0 ].offsetHeight / 2 ) ) / zone[ 0 ].scrollHeight;

  }

  _scaleButton( 1 );

  // Si no se comprueba el zoom se pueden emular desplazamientos, esto lo previene
  if( zoom2 !== zoom ){

    if( resize || zoom === -1 ){

      scrollX = ( zone[ 0 ].scrollWidth * perX ) - ( zone[ 0 ].offsetWidth * perX );
      scrollY = ( zone[ 0 ].scrollHeight * perY ) - ( zone[ 0 ].offsetHeight * perY );

    }

    zone
      .scrollLeft( scrollX )
      .scrollTop( scrollY );

  }

});

zoomUi
.on( 'change', function(){

  var value = _preciseDecimal( zoomUi.val() / 100 );

  zoom = -1;

  _scaleImage( value );

  zoomUi
    .val( _preciseDecimal( scale * 100 ) )
    .blur(); // To Do -> Provoca que se vuelva a invocar el evento al dar a intro

});

zone
.on( 'mousewheel', function( e, d, x, y ){

  if( mobile ){
    return
  }

  var zoom2    = zoom;
  var scrollX = 0;
  var scrollY = 0;
  var resize  = ( this.scrollWidth - this.offsetWidth ) || ( this.scrollHeight - this.offsetHeight );

  if( resize || zoom === -1 ){

    var offset = win.offset();
    var perX   = ( this.scrollLeft + ( e.clientX - offset.left ) ) / this.scrollWidth;
    var perY   = ( this.scrollTop + ( e.clientY - offset.top - menuHeight ) ) / this.scrollHeight;

  }

  if( y < 0 ){
    _scaleButton( -1 );
  }else if( y > 0 ){
    _scaleButton( 1 );
  }

  // Si no se comprueba el zoom se pueden emular desplazamientos, esto lo previene
  if( zoom2 !== zoom ){

    if( resize || zoom === -1 ){

      scrollX = ( this.scrollWidth * perX ) - ( this.offsetWidth * perX );
      scrollY = ( this.scrollHeight * perY ) - ( this.offsetHeight * perY );

    }

    $(this)
      .scrollLeft( scrollX )
      .scrollTop( scrollY );

  }

});

presentationBtn.on('click', function(){

  toggleFullscreen();
  presentationMode = true;
  presInterval = setTimeout( function(){
    nextBtn.click();
  }, 3000);

});

if( location.host.indexOf('file') !== -1 ){
  api.app.maximizeView( win );
}*/

console.log('llego al evento')

win.on( 'app-param', function( e, paramsArg ){
  console.log('disparo el evento', arguments )
  _startApp( paramsArg )
});
