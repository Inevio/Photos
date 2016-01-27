
// Variables
    var win     = $( this );
    var minus   = $( '.weevisor-zoom-minus', win );
    var plus    = $( '.weevisor-zoom-plus', win );
    var zone    = $( '.weevisor-images', win );
    var zoom    = $( '.weevisor-zoom', win );
    var uiBarTop= $('.ui-header');
    var isWebKit          = /webkit/i.test( navigator.userAgent );
    var prevClientX       = 0;
    var prevClientY       = 0;
    var hideControlsTimer = 0;
    var normalWidth       = 0;
    var normalHeight      = 0;
    var normalScale       = 0;
    var imageLoaded       = null;

    var menuHeight = $( '.wz-view-menu', win ).outerHeight();

// Valid zoom
    var validZoom = [ 0.01, 0.02, 0.03, 0.04, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5 ];

// Private Methods
    var _preciseDecimal = function( number ){
        return parseFloat( number.toFixed( 2 ) );
    };

    var _loadImage = function( file ){

        imageLoaded = file;

        $( '<img />')
          .attr( 'src', file.thumbnails.original )
          .appendTo( zone )
          .on( 'load', function(){ });

          if( wz.app.storage('horizontal') ){
            wz.app.storage( 'scale', zone.width() / parseInt( file.metadata.exif.imageWidth, 10 ) );
          }else{
            wz.app.storage( 'scale', zone.height() / parseInt( file.metadata.exif.imageHeight, 10 ) );
          }

          if( wz.app.storage('scale') > 1 ){
            wz.app.storage('scale', 1 );
          }

          _scaleImage( wz.app.storage('scale') );
          zoom.val( _preciseDecimal( wz.app.storage('scale') * 100 ) );

    };

    var _scaleImage = function( scale ){

        scale = _preciseDecimal( parseFloat( scale, 10 ) );

        if( isNaN( scale ) || scale <= 0 || scale > 5 ){
            return false;
        }

        $( 'img', zone )
            .width( parseInt( scale * wz.app.storage('file').metadata.exif.imageWidth, 10 ) )
            .height( parseInt( scale * wz.app.storage('file').metadata.exif.imageHeight, 10 ) );

        _marginImage();
        _detectCursor();

        wz.app.storage( 'scale', scale );

    };

    var _marginImage = function(){

        var img   = $( 'img', zone );
        var scale = ( zone.height() - img.height() ) / 2;

        img.css( 'margin-top', scale > 0 ? scale : 0 );

    };

    var _scaleButton = function( dir ){

        if( wz.app.storage('zoom') === -1 || win.hasClass('fullscreen') ){

            var i = 0;
            var j = validZoom.length;

            if( dir > 0 ){

                for( i = 0; i < j; i++ ){
                    if( validZoom[ i ] > wz.app.storage('scale') ) break;
                }

            }else{

                for( i = 0; i < j; i++ ){
                    if( validZoom[ i ] <= wz.app.storage('scale') && validZoom[ i + 1 ] > wz.app.storage('scale') ) break;
                }

                if( validZoom[ i ] === wz.app.storage('scale') && validZoom[ i - 1 ] ){
                    i--;
                }

                if( i >= validZoom.length ){
                    i = validZoom.length - 2;
                }

            }

            wz.app.storage( 'zoom', i );

            _scaleImage( validZoom[ wz.app.storage('zoom') ] );

            zoom.val( _preciseDecimal( wz.app.storage('scale') * 100 ) );

        }else if( validZoom[ wz.app.storage('zoom') + dir ] && !win.hasClass('fullscreen') ){

            var newZoom  = wz.app.storage('zoom') + dir;
            var winScale = 0;

            if( wz.app.storage('horizontal') ){
                winScale = zone.width() / wz.app.storage('file').metadata.exif.imageWidth;
            }else{
                winScale = zone.height() / wz.app.storage('file').metadata.exif.imageHeight;
            }

            if( dir > 0 && validZoom[ wz.app.storage('zoom') ] < winScale && validZoom[ newZoom ] >= winScale ){

                wz.app.storage( 'zoom', -1 );
                newZoom = winScale;

            }else if( dir < 0 && validZoom[ wz.app.storage('zoom') ] > winScale && validZoom[ newZoom ] < winScale ){

                wz.app.storage( 'zoom', -1 );
                newZoom = winScale;

            }else{

                wz.app.storage( 'zoom', newZoom );
                newZoom = validZoom[ wz.app.storage('zoom') ];

            }

            _scaleImage( newZoom );

            zoom.val( _preciseDecimal( wz.app.storage('scale') * 100 ) );

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

        var zoom    = wz.app.storage('zoom');
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
        if( zoom !== wz.app.storage('zoom') ){

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

        var zoom    = wz.app.storage('zoom');
        var scrollX = 0;
        var scrollY = 0;
        var resize  = ( zone[ 0 ].scrollWidth - zone[ 0 ].offsetWidth ) || ( zone[ 0 ].scrollHeight - zone[ 0 ].offsetHeight );

        if( resize || wz.app.storage('zoom') === -1 ){

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
        if( zoom !== wz.app.storage('zoom') ){

            if( resize || zoom === -1 ){

                scrollX = ( zone[ 0 ].scrollWidth * perX ) - ( zone[ 0 ].offsetWidth * perX );
                scrollY = ( zone[ 0 ].scrollHeight * perY ) - ( zone[ 0 ].offsetHeight * perY );

            }

            zone
                .scrollLeft( scrollX )
                .scrollTop( scrollY );

        }

    });

    zoom
    .on( 'change', function(){

        var value = _preciseDecimal( zoom.val() / 100 );

        wz.app.storage( 'zoom', -1 );

        _scaleImage( value );

        zoom
            .val( _preciseDecimal( wz.app.storage('scale') * 100 ) )
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

      var zoom    = wz.app.storage('zoom');
      var scrollX = 0;
      var scrollY = 0;
      var resize  = ( this.scrollWidth - this.offsetWidth ) || ( this.scrollHeight - this.offsetHeight );

      if( resize || wz.app.storage('zoom') === -1 ){

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
      if( zoom !== wz.app.storage('zoom') ){

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
        normalScale  = wz.app.storage('scale');

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
    zoom.val( _preciseDecimal( screen.width / parseInt( imageLoaded.metadata.exif.imageWidth, 10 ) * 100 ) );
    console.log(zoom.val());

})

.on( 'exitfullscreen', function(){

    win.removeClass('fullscreen');

    win.css( 'width', normalWidth );
    win.css( 'height', normalHeight );

    showControls();

    _scaleImage( normalScale );
    zoom.val( _preciseDecimal( normalScale * 100 ) );

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

});

/*.key( 'left, pageup', function(){

})

.key( 'right, pagedown', function(){

});*/

// Start load
if( location.host.indexOf('file') === -1 ){

  win.deskitemX( parseInt( ( wz.tool.desktopWidth() - win.width() ) / 2, 10 ) );
  win.deskitemY( parseInt( ( wz.tool.desktopHeight() - win.height() ) / 2, 10 ) );

}else{
  wz.app.maximizeView( win );
}

_loadImage( wz.app.storage('file') );