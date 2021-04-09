$(document).ready(function () {
 
	jQuery.fn.getTitle = function() { // Copy the title of every IMG tag and add it to its parent A so that fancybox can show titles
		var arr = jQuery("a.fancybox");
		jQuery.each(arr, function() {
			var title = jQuery(this).children("img").attr("alt");
			jQuery(this).attr('data-caption',title);
		})
	}

	// Supported file extensions
	var thumbnails = jQuery("a:has(img)").not(".nolightbox").filter( function() { return /googleusercontent|\.(jpe?g|png|gif|bmp)$/i.test(jQuery(this).attr('href')) });

	thumbnails.addClass("fancybox").attr("data-fancybox","images").getTitle();

	$('[data-fancybox="images"]').fancybox({
		baseClass : 'fancybox-custom-layout',
		loop: true,
		protect : true,
		preventCaptionOverlap: false,
		buttons: [
		"zoom",
		"share",
		//"slideShow",
		//"fullScreen",
		"download",
		//"thumbs",
		"close"
	  ],
	});

});