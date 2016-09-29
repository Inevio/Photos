
// Variables
var win               = $( this );
var minus             = $( '.ui-footer .zoom-minus', win );
var plus              = $( '.ui-footer .zoom-plus', win );
var original          = $( '.ui-footer .zoom-original', win );
var zone              = $( '.weevisor-images', win );
var zoomUi            = $( '.weevisor-zoom', win );
var imgDom            = $( '.weevisor-images img', win);
var uiBarTop          = $('.ui-header');
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
var mobile = win.hasClass('wz-mobile-view');

var MIN_SCALE = 1; // 1=scaling when first loaded
var MAX_SCALE = 64;
// HammerJS fires "pinch" and "pan" events that are cumulative in nature and not
// deltas. Therefore, we need to store the "last" values of scale, x and y so that we can
// adjust the UI accordingly. It isn't until the "pinchend" and "panend" events are received
// that we can set the "last" values.
// Our "raw" coordinates are not scaled. This allows us to only have to modify our stored
// coordinates when the UI is updated. It also simplifies our calculations as these
// coordinates are without respect to the current scale.
var imgWidth = null;
var imgHeight = null;
var viewportWidth = null;
var viewportHeight = null;
var scale = null;
var lastScale = null;
var container = null;
var img = null;
var x = 0;
var lastX = 0;
var y = 0;
var lastY = 0;
var pinchCenter = null;
// We need to disable the following event handlers so that the browser doesn't try to
// automatically handle our image drag gestures.
var disableImgEventHandlers = function () {
  var events = ['onclick', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover',
                'onmouseup', 'ondblclick', 'onfocus', 'onblur'];
  events.forEach(function (event) {
    img[event] = function () {
      return false;
    };
  });
};

var menuHeight = $( '.wz-view-menu', win ).outerHeight();

// Valid zoom
var validZoom = [ 0.01, 0.02, 0.03, 0.04, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5 ];

// Private Methods
var _preciseDecimal = function( number ){
    return Math.floor(number * 100) / 100;
};

var _startApp = function(){

  console.log(params);

  if( params && params.command === 'openFile' ){

    if( params.list.length == 0 ){
      params.list = [params.data];
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
    var initialIndex = params.list.indexOf( params.data );
    var newIndex = 0;

    params.list.forEach( function(item, index){

      api.fs( item, function( error, structure ){

        if( !error ){
          if( structure.mime.indexOf('image/gif') !== -1 || structure.mime.indexOf('image/jpeg') !== -1
              || structure.mime.indexOf('image/png') !== -1 || structure.mime.indexOf('image/tiff') !== -1 ){

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

  $( '.ui-header-brand span', win ).text( file.name );
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
  normalZoom = -1;
  normalScale = scale;
  _scaleImage( scale );

  $( '.weevisor-images img').attr( 'src', file.thumbnails.original );
  //startMobile();

};

var _scaleImage = function( scaleArg ){

  //scale = _preciseDecimal( parseFloat( scaleArg, 10 ) );
  scale = scaleArg;

  if( isNaN( scale ) || scale <= 0 || scale > 5 ){
      return false;
  }

  $( 'img', zone )
      .width( parseInt( scale * imageLoaded.metadata.exif.imageWidth, 10 ) )
      .height( parseInt( scale * imageLoaded.metadata.exif.imageHeight, 10 ) );

  zoomUi.val( _preciseDecimal( scale * 100 ) );

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

/* fullscreen mode */
var toggleFullscreen = function(){

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

.on( 'enterfullscreen', function(){

    win.addClass('fullscreen');
    loader.addClass('fullscreen');

    win.css( 'width', screen.width );
    win.css( 'height', screen.height );

    var width  = parseInt( imageLoaded.metadata.exif.imageWidth, 10 );
    var height = parseInt( imageLoaded.metadata.exif.imageHeight, 10 );

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

})

.on( 'swiperight', function(){
  prevBtn.click();
})

.on( 'swipeleft', function(){
  nextBtn.click();
})

.key( 'left, pageup', function(){
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
})

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
         * Las siguientes variables se han puesto diimgDomamente en la fórmula para no declarar variables que solo se usan una vez
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

        /*
         *
         * Las siguientes variables se han puesto diimgDomamente en la fórmula para no declarar variables que solo se usan una vez
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

zone
.on( 'mousewheel', function( e, d, x, y ){

  var zoom2    = zoom;
  var scrollX = 0;
  var scrollY = 0;
  var resize  = ( this.scrollWidth - this.offsetWidth ) || ( this.scrollHeight - this.offsetHeight );

  if( resize || zoom === -1 ){

    /*
     *
     * Las siguientes variables se han puesto diimgDomamente en la fórmula para no declarar variables que solo se usan una vez
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

presentationBtn.on('click', function(){

  toggleFullscreen();
  presentationMode = true;
  presInterval = setTimeout( function(){
    nextBtn.click();
  }, 3000);


});

if( location.host.indexOf('file') !== -1 ){
  api.app.maximizeView( win );
}

// Traverse the DOM to calculate the absolute position of an element
/*
var absolutePosition = function (el) {

  var x = 0,
    y = 0;
  while (el[0] !== null) {
    x += el[0].offsetLeft;
    y += el[0].offsetTop;
    el[0] = el[0].offsetParent;
  }
  return { x: x, y: y };

};
var restrictScale = function (scale) {

  if (scale < MIN_SCALE) {
    scale = MIN_SCALE;
  } else if (scale > MAX_SCALE) {
    scale = MAX_SCALE;
  }
  return scale;

};
var restrictRawPos = function (pos, viewportDim, imgDim) {

  if (pos < viewportDim/scale - imgDim) { // too far left/up?
    pos = viewportDim/scale - imgDim;
  } else if (pos > 0) { // too far right/down?
    pos = 0;
  }
  return pos;

};
var updateLastPos = function (deltaX, deltaY) {

  lastX = x;
  lastY = y;

};
var translate = function (deltaX, deltaY) {

  // We restrict to the min of the viewport width/height or current width/height as the
  // current width/height may be smaller than the viewport width/height
  var newX = restrictRawPos(lastX + deltaX/scale,
                            Math.min(viewportWidth, curWidth), imgWidth);
  x = newX;
  img.css('marginLeft', Math.ceil(newX*scale) + 'px');
  var newY = restrictRawPos(lastY + deltaY/scale,
                            Math.min(viewportHeight, curHeight), imgHeight);
  y = newY;

  var scale3 = ( viewportHeight - img.height() ) / 2;
  img.css('marginTop', scale3 > 0 ? scale3 : Math.ceil(newY*scale3) );

};
var zoomMobile = function (scaleBy) {

  scale = restrictScale(lastScale*scaleBy);
  curWidth = imgWidth*scale;
  curHeight = imgHeight*scale;
  img.css('width', Math.ceil(curWidth) + 'px');
  img.css('height', Math.ceil(curHeight) + 'px');
  // Adjust margins to make sure that we aren't out of bounds
  translate(0, 0);

};
var rawCenter = function (e) {

  var pos = absolutePosition(container);
  // We need to account for the scroll position
  var scrollLeft = win.pageXOffset ? win.pageXOffset : win.scrollLeft();
  var scrollTop = win.pageYOffset ? win.pageYOffset : win.scrollTop();
  var zoomX = -x + (e.gesture.center.x - pos.x + scrollLeft)/scale;
  var zoomY = -y + (e.gesture.center.y - pos.y + scrollTop)/scale;
  return { x: zoomX, y: zoomY };

};
var updateLastScale = function () {
  lastScale = scale;
};
var zoomAround = function (scaleBy, rawZoomX, rawZoomY, doNotUpdateLast) {

  // Zoom
  zoomMobile(scaleBy);
  // New raw center of viewport
  var rawCenterX = -x + Math.min(viewportWidth, curWidth)/2/scale;
  var rawCenterY = -y + Math.min(viewportHeight, curHeight)/2/scale;
  // Delta
  var deltaX = (rawCenterX - rawZoomX)*scale;
  var deltaY = (rawCenterY - rawZoomY)*scale;
  // Translate back to zoom center
  translate(deltaX, deltaY);
  if (!doNotUpdateLast) {
    updateLastScale();
    updateLastPos();
  }

};
var zoomCenter = function (scaleBy) {

  // Center of viewport
  var zoomX = -x + Math.min(viewportWidth, curWidth)/2/scale;
  var zoomY = -y + Math.min(viewportHeight, curHeight)/2/scale;
  zoomAround(scaleBy, zoomX, zoomY);

};
var zoomIn = function () {
  zoomCenter(2);
};
var zoomOut = function () {
  zoomCenter(1/2);
};
var startMobile = function () {

  img = imgDom;
  container = $('.weevisor-images' );
  disableImgEventHandlers();
  imgWidth = parseInt( img.css('width') );
  imgHeight = parseInt( img.css('height') );
  viewportWidth = parseInt( container.css('width') );
  scale = viewportWidth/imgWidth;
  lastScale = scale;
  viewportHeight = parseInt( container.css('height') );
  curWidth = imgWidth*scale;
  curHeight = imgHeight*scale;
  var isZoomed = false;

  win.on('pan', function (e) {
    translate(e.originalEvent.gesture.deltaX, e.originalEvent.gesture.deltaY);
  })
  .on('panend', function (e) {
    updateLastPos();
  })
  .on('pinch', function (e) {

    // We only calculate the pinch center on the first pinch event as we want the center to
    // stay consistent during the entire pinch
    if (pinchCenter === null) {

      pinchCenter = rawCenter(e.originalEvent);
      var offsetX = pinchCenter.x*scale - (-x*scale + Math.min(viewportWidth, curWidth)/2);
      var offsetY = pinchCenter.y*scale - (-y*scale + Math.min(viewportHeight, curHeight)/2);
      pinchCenterOffset = { x: offsetX, y: offsetY };

    }
    // When the user pinch zooms, she/he expects the pinch center to remain in the same
    // relative location of the screen. To achieve this, the raw zoom center is calculated by
    // first storing the pinch center and the scaled offset to the current center of the
    // image. The new scale is then used to calculate the zoom center. This has the effect of
    // actually translating the zoom center on each pinch zoom event.
    var newScale = restrictScale(scale*e.originalEvent.gesture.scale);
    var zoomX = pinchCenter.x*newScale - pinchCenterOffset.x;
    var zoomY = pinchCenter.y*newScale - pinchCenterOffset.y;
    var zoomCenter = { x: zoomX/newScale, y: zoomY/newScale };
    zoomAround(e.originalEvent.gesture.scale, zoomCenter.x, zoomCenter.y, true);

  })

  .on('pinchend', function (e) {

    updateLastScale();
    updateLastPos();
    pinchCenter = null;

  })

  .on('doubletap', function (e) {

    if( !isZoomed ){

      var c = rawCenter(e.originalEvent);
      zoomAround(2, c.x, c.y);
      console.log(img);
      var scale3 = ( viewportHeight - img.height() ) / 2;
      console.log(scale3);
      img.css( 'margin-top', scale3 > 0 ? scale3 : 0 );
      isZoomed=true;

    }else{

      zoomOut();
      a=false;

    }

  });
};
*/

_startApp();

win.on( 'app-param', function( e, paramsA ){
  console.log('param', paramsA);
});
