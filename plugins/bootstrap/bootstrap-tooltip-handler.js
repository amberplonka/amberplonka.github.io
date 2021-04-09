// Bootstrap Tooltips
$(document).ready(function () {
 
    $('[data-toggle="tooltip"]').tooltip({
		trigger: 'manual',
		html: true,
		animation: true,
		placement: 'auto top',
		template: '<div class="tooltip" role="tooltip" onmouseover="$(this).mouseleave(function() {$(this).hide();});"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
	}).on('mouseover', function(e) {
		$(this).tooltip('show');
		$(this).siblings('.tooltip').tooltip('hide');
	}).on('mouseleave', function(e) {
		var _this = this;
		setTimeout(function() {
			if (!$(".tooltip:hover").length) {
			  $(_this).tooltip("hide");
			}
		}, 10);
	}); 
   
  
    $('[data-toggle="popover"]').popover({
		trigger: 'manual',
		html: true,
		animation: true, // set to false if repeated hoving works intermittently
		template: '<div class="popover" role="tooltip" onmouseover="$(this).mouseleave(function() {$(this).hide();});"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3></div></div>',
		placement: function (context, source)
		{
		  var position = $(source).position();
		  var content_width = 515;  
		  var content_height = 110;  
		  if (position.left > content_width) {return "left";}
		  if (position.left < content_width) {return "right";}
		  if (position.top < content_height) {return "bottom";}
		  return "top";
		}
	}).on('mouseover', function(e) {
		$(this).popover('show');
		$(this).siblings('.popover').popover('hide');
	}).on('mouseleave', function(e) {
		var _this = this;
		setTimeout(function() {
			if (!$(".popover:hover").length) {
			  $(_this).popover("hide");
			}
		}, 10);
	}); 
 
});
