
// Constant
var view_margin = 50;
var ui_height = 92;

// Local variables
var win      = $( this );
var header   = $('.ui-header');
var uiImages = $('.weevisor-images');
var picIndex = -1;
var pictures = [];

var mobile = win.hasClass('wz-mobile-view');

// Callback
var precalc = function( width, height ){

  console.log('pre',1)

  if( !mobile ){
    var widthRatio  = width / ( api.tool.desktopWidth() - ( view_margin * 2 ) );
    var heightRatio = height / ( api.tool.desktopHeight() - ( view_margin * 2 ) );
  }else{
    var widthRatio  = width / ( api.tool.desktopWidth() );
    var heightRatio = height / ( api.tool.desktopHeight() );
  }

  if( widthRatio > 1 || heightRatio > 1 ){

    if( widthRatio >= heightRatio ){

      width  = api.tool.desktopWidth() - ( view_margin * 2 );
      height = height / widthRatio;

    }else{

      width  = width / heightRatio;
      height = api.tool.desktopHeight() - ( view_margin * 2 );

    }

  }

  console.log('pre',2)

  win.css({
    width : width + 'px',
    height : height + ui_height/2 + 'px'
  });

  win.addClass('dark');
  win.css({'background':'#2c3238'});
  $('.weevisor-content').css({'background':'#3f4750'});

  if( location.hostname.indexOf('file') === 0 ){
    win.addClass('link-mode');
    win.parent().removeClass('wz-draggable');
  }

  console.log('pre',3)

  start();

}

// Load structure
if( params && params.command === 'openFile' ){

  if ( params.dropbox ) {

    api.integration.dropbox( params.dropbox, function( err, account ){

      account.get( params.id, function( err, metadata ){

        params.metadata = metadata.media_info ? metadata.media_info.metadata : { dimensions : { width : 700 , height : 450 } }

        var width  = parseInt( params.metadata.dimensions.width, 10 );
        var height = parseInt( params.metadata.dimensions.height, 10 );

        precalc( width, height )

      });

    });

  }else if( params.gdrive ){

    api.integration.gdrive( params.gdrive, function( err, account ){

      account.get( params.id, function( err, data ){

        params.metadata = data.imageMediaMetadata;

        var width  = parseInt( params.metadata.width, 10 );
        var height = parseInt( params.metadata.height, 10 );

        precalc( width, height )

      })

    })

  }else if( params.onedrive ){

    api.integration.onedrive( params.onedrive, function( err, account ){

      account.get( params.id, function( err, data ){

        params.metadata = data.image;

        var width  = parseInt( params.metadata.width, 10 );
        var height = parseInt( params.metadata.height, 10 );

        precalc( width, height )

      })

    })

  }else{

    api.fs( params.data, function( error, structure ){

      structure.getFormats( function( error, formats ){

        structure.formats = formats;
        params.metadata = structure.formats.original.metadata

        var width  = parseInt( params.metadata.exif.imageWidth, 10 );
        var height = parseInt( params.metadata.exif.imageHeight, 10 );

        precalc( width, height )

      });

    });

  }

}
