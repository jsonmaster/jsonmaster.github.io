$(document).ready(function() {
   $("#input").bind('input propertychange', function() {
   		var input = $("#input").val();
   		getClasses(input, function(result) {
			$("#output").val(result);
   		});
	});
});