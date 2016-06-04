
// Constant
var view_margin = 50;
var ui_height = 92;


// Local variables
var win      = $( this );
var header   = $('.ui-header');
var uiImages = $('.weevisor-images');
var picIndex = -1;
var pictures = [];

// Load structure
if( params && params.command === 'openFile' ){

  api.fs( params.data, function( error, structure ){

    structure.getFormats( function( error, formats ){


      structure.formats = formats;

      var metadata    = structure.formats.original.metadata;
      var width       = parseInt( metadata.exif.imageWidth, 10 );
      var height      = parseInt( metadata.exif.imageHeight, 10 );
      var widthRatio  = width / ( api.tool.desktopWidth() - ( view_margin * 2 ) );
      var heightRatio = height / ( api.tool.desktopHeight() - ( view_margin * 2 ) );

      if( widthRatio > 1 || heightRatio > 1 ){

        if( widthRatio >= heightRatio ){

          width  = api.tool.desktopWidth() - ( view_margin * 2 );
          height = height / widthRatio;

        }else{

          width  = width / heightRatio;
          height = api.tool.desktopHeight() - ( view_margin * 2 );

        }

      }

      win.css({
        'width'   : width + 'px',
        'height'  : height + ui_height/2 + 'px'
      });

      win.addClass('dark');
      win.css({'background':'#2c3238'});
      $('.weevisor-content').css({'background':'#3f4750'});
      start();

    });

  });

}
