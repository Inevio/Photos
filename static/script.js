
// Variables
var win               = $( this );
var minus             = $( '.weevisor-zoom-minus', win );
var plus              = $( '.weevisor-zoom-plus', win );
var zone              = $( '.weevisor-images', win );
var zoomUi            = $( '.weevisor-zoom', win );
var imgDom            = $( '.weevisor-images img', win);
var uiBarTop          = $('.ui-header');
var loader            = $('.weevisor-images .loader');
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

var menuHeight = $( '.wz-view-menu', win ).outerHeight();

// Valid zoom
var validZoom = [ 0.01, 0.02, 0.03, 0.04, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5 ];

// Private Methods
var _preciseDecimal = function( number ){
    return parseFloat( number.toFixed( 2 ) );
};

var _startApp = function(){

  if( params && params.command === 'openFile' ){

    $( '.weevisor-images img').on( 'load', function(){

      var that = this;

      var d1 = new Date();

      var intervalo = setInterval( function(){

        var d2 = new Date();
        console.log(Math.abs(d2-d1));

        if(that.complete){

          console.log('cargo',that.complete);
          loader.hide();
          imgDom.css('visibility', 'visible');
          clearInterval(intervalo);

        }

      },1320);

    });

    // To Do -> Error
    var initialIndex = params.list.indexOf( params.data );
    var newIndex = 0;

    params.list.forEach( function(item, index){

      wz.fs( item, function( error, structure ){

        if( !error ){
          if( structure.mime.indexOf('image') !== -1 ){

            pictures[ newIndex ] = structure;

            if( index === initialIndex ){

              picIndex = newIndex;
              _loadImage( pictures[picIndex] );

            }

            newIndex++;
          }
        }

      });

    });
  }

}

var _loadImage = function( file ){

  $( '.weevisor-title', win ).text( file.name );
  imageLoaded = file;

  var width  = parseInt( file.metadata.exif.imageWidth, 10 );
  var height = parseInt( file.metadata.exif.imageHeight, 10 );

  var scale1 = zone.width() / width ;
  var scale2 = zone.height() / height ;

  if( scale1 < scale2 ){
    scale = scale1;
  }else{
    scale = scale2;
  }

  if( scale > 1 ){
    scale = 1;
  }

  zoom = -1;
  _scaleImage( scale );
  zoomUi.val( _preciseDecimal( scale * 100 ) );

  console.log('cargo');
  $( '.weevisor-images img').attr( 'src', file.thumbnails.original );

};

var _scaleImage = function( scaleArg ){

  scale = _preciseDecimal( parseFloat( scaleArg, 10 ) );

  if( isNaN( scale ) || scale <= 0 || scale > 5 ){
      return false;
  }

  $( 'img', zone )
      .width( parseInt( scale * imageLoaded.metadata.exif.imageWidth, 10 ) )
      .height( parseInt( scale * imageLoaded.metadata.exif.imageHeight, 10 ) );

  _marginImage();
  _detectCursor();

};

var _marginImage = function(){

  var img   = $( 'img', zone );
  var scale = ( zone.height() - img.height() ) / 2;

  img.css( 'margin-top', scale > 0 ? scale : 0 );

};

var _scaleButton = function( dir ){

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

};

var _detectCursor = function(){

    var img = $( 'img', zone );

    if( img.height() <= zone.height() && img.width() <= zone.width() ){
      zone.addClass('hide-hand');
    }else{
      zone.removeClass('hide-hand');
    }

};

// Events
win
.on( 'ui-view-resize ui-view-maximize ui-view-unmaximize', function(){

  _marginImage();

});

minus
.on( 'click', function(){

    var zoom2   = zoom;
    var scrollX = 0;
    var scrollY = 0;
    var resize  = ( zone[ 0 ].scrollWidth - zone[ 0 ].offsetWidth ) || ( zone[ 0 ].scrollHeight - zone[ 0 ].offsetHeight );

    if( resize ){

        /*
         *
         * Las siguientes variables se han puesto directamente en la fórmula para no declarar variables que solo se usan una vez
         *
         * var posX   = e.clientX - offset.left;
         * var posY   = e.clientY - offset.top - menuHeight;
         *
         * Es la posición del ratón dentro de la zona de la imagen
         *
         */

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

plus
.on( 'click', function(){

    var zoom2    = zoom;
    var scrollX = 0;
    var scrollY = 0;
    var resize  = ( zone[ 0 ].scrollWidth - zone[ 0 ].offsetWidth ) || ( zone[ 0 ].scrollHeight - zone[ 0 ].offsetHeight );

    if( resize || zoom === -1 ){

        /*
         *
         * Las siguientes variables se han puesto directamente en la fórmula para no declarar variables que solo se usan una vez
         *
         * var posX   = e.clientX - offset.left;
         * var posY   = e.clientY - offset.top - menuHeight;
         *
         * Es la posición del ratón dentro de la zona de la imagen
         *
         */

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

win
.key( 'numadd', function(){
    plus.click();
})

.key( 'numsubtract', function(){
    minus.click();
});

zone
.on( 'mousewheel', function( e, d, x, y ){

  var zoom2    = zoom;
  var scrollX = 0;
  var scrollY = 0;
  var resize  = ( this.scrollWidth - this.offsetWidth ) || ( this.scrollHeight - this.offsetHeight );

  if( resize || zoom === -1 ){

    /*
     *
     * Las siguientes variables se han puesto directamente en la fórmula para no declarar variables que solo se usan una vez
     *
     * var posX   = e.clientX - offset.left;
     * var posY   = e.clientY - offset.top - menuHeight;
     *
     * Es la posición del ratón dentro de la zona de la imagen
     *
     */

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

/* fullscreen mode */
var toggleFullscreen = function(){

    if( win.hasClass( 'fullscreen' ) ){

        wz.tool.exitFullscreen();

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

};

var showControls = function(){

    uiBarTop.stop().clearQueue();
    uiBarTop.css( 'display', 'block' );

};

var hideControls = function(){

    uiBarTop.stop().clearQueue();
    uiBarTop.css( 'display' , 'none' );

};

win
.on( 'click', '.ui-fullscreen', function(){
    toggleFullscreen();
})

.on( 'enterfullscreen', function(){

    win.addClass('fullscreen');

    win.css( 'width', screen.width );
    win.css( 'height', screen.height );

    hideControls();

    _scaleImage( screen.width / parseInt( imageLoaded.metadata.exif.imageWidth, 10 ) );
    zoomUi.val( _preciseDecimal( screen.width / parseInt( imageLoaded.metadata.exif.imageWidth, 10 ) * 100 ) );
    console.log(normalScale);

})

.on( 'exitfullscreen', function(){

    win.removeClass('fullscreen');

    win.css( 'width', normalWidth );
    win.css( 'height', normalHeight );

    showControls();

    console.log(normalScale);
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

})

.key( 'left, pageup', function(){

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

.key( 'right, pagedown', function(){

  if( pictures.length !== 1 ){

    imgDom.css('visibility', 'hidden');
    loader.show();

    if( picIndex < pictures.length - 1 ){
      picIndex++;
      _loadImage(pictures[picIndex]);
    }else{
      picIndex = 0;
      _loadImage(pictures[picIndex]);
    }
  }

});

_startApp();
