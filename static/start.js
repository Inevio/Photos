
// Constant
var VIEW_MARGIN = 50;

// Local variables
var win      = $( this );
var header   = $('.ui-header');
var uiImages = $('.weevisor-images');

// Load structure
if( params && params.command === 'openFile' ){

    // To Do -> Error

    wz.fs( params.data, function( error, structure ){

        $( '.weevisor-title', win ).text( structure.name );

        var width       = parseInt( structure.metadata.exif.imageWidth, 10 );
        var height      = parseInt( structure.metadata.exif.imageHeight, 10 );
        var widthRatio  = width / ( wz.tool.desktopWidth() - ( VIEW_MARGIN * 2 ) );
        var heightRatio = height / ( wz.tool.desktopHeight() - ( VIEW_MARGIN * 2 ) );

        if( widthRatio > 1 || heightRatio > 1 ){

            if( widthRatio >= heightRatio ){

                width  = wz.tool.desktopWidth() - ( VIEW_MARGIN * 2 );
                height = height / widthRatio;

            }else{

                width  = width / heightRatio;
                height = wz.tool.desktopHeight() - ( VIEW_MARGIN * 2 );

            }

        }

        wz.app.storage( 'horizontal', width >= height );

        if( location.host.indexOf('file') === -1 ){

          //wz.fit( win, width - uiImages.width(), height - uiImages.height() );
          win.css({
            'width'   : width + 'px',
            'height'  : height + 'px'
          });

        }

        wz.app.storage( 'file', structure );
        wz.app.storage( 'zoom', -1 );
        win.addClass('dark');
        win.css({'background':'#2c3238'});
        $('.weevisor-content').css({'background':'#3f4750'});

        start();

    });

}
