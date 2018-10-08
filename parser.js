fun getClasses(var string) {
	let json = JSON.parse(string);

	var object = json;
	if (json instanceof Array) {
		objects = json[0]
	}

	
}