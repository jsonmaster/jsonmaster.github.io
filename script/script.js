$(document).ready(function() {
   $("#input").bind('input propertychange', function() {
   		inputChanged();
	});

   	$('#initializerCheckbox').change(function() {
        inputChanged();
    });
});

function inputChanged() {
	$.getJSON("./languages/Swift-Struct-Codable.json", function(language) {
		let input = $("#input").val();
		let builder = new FileBuilder(language);
		builder.isInitializers = $('#initializerCheckbox').is(':checked');
		let result = builder.classes(input);
		$("#output").val(result);
	});
}