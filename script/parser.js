let elementType = "<!ElementType!>"
let modelName = "<!ModelName!>"
let modelWithParentClassName = "<!ParentClass!>"
let varName = "<!VarName!>"
let capitalizedVarName = "<!CapitalizedVarName!>"
let varType = "<!VarType!>"
let varTypeReplacement = "<!VarBasicTypeReplacement!>"
let capitalizedVarType = "<!CapitalizedVarType!>"
let lowerCaseVarType = "<!LowerCaseVarType!>"
let lowerCaseModelName = "<!LowerCaseModelName!>"
let jsonKeyName = "<!JsonKeyName!>"
let constKeyName = "<!ConstKeyName!>"
let additionalCustomTypeProperty = "<!AdditionalForCustomTypeProperty!>"


// FileBuilder
function FileBuilder(language) {
	this.language = language
	this.isInitializers = true
}

FileBuilder.prototype = {
	constructor: FileBuilder,
	classes: function(string) {

		let json = JSON.parse(string);

		if (json) {
			let files = this.getFiles("Sample", json, this.language);

			let result = files.reduce(function(prefix, value) {
				return prefix + "\n\n" + value;
			});

			return result;
		}

		return "";		
	}
}

FileBuilder.prototype.getFiles = function(fileName, object, language) {
	var obj = object;
	var files = new Array();

	if (object instanceof Array) {
		obj = object[0]
	}

	var keys = Object.keys(obj);
	var properties = new Array();
	
	keys.forEach(function(key) {
		var value = obj[key];
		var property = getProperty(key, value, language);

		var prevIndex = properties.map(function(prop) {
			return prop.propertyName;
		}).indexOf(property.propertyName);

		if (prevIndex < 0) {
			if (property.isCustomClass) {
				let file = getFiles(property.propertyType, value, language);
				files.push(file);
			} else if (property.isArray && property.elementTypeIsCustom) {
				let file = getFiles(property.elementType, value, language);
				files.push(file);
			}

			properties.push(property);
		}
	});

	var file = new FileRepresenter(fileName, properties, language);
	file.isInitializers = this.isInitializers;

	files.splice(0, 0, file);
	return files;
}

function getProperty(key, value, language) {
	let propertyName = getLanguageName(key, language);
	let valueType = getPropertyTypeName(value, language);

	var property = new Property(language);
	property.jsonKeyName = key;
	property.propertyName = propertyName;
	property.sampleValue = value;

	if (value instanceof Array) {
		if (value[0] && (value[0] instanceof Object)) {
			var leafType = getTypeNameFromKey(key, language);
			valueType = "["+ leafType +"]"; // TODO: change from language

			property.propertyType = valueType;
			property.isArray = true;
			property.isCustomClass = false;
			property.elementType = leafType;
			property.elementTypeIsCustom = true;
		} else {
			property.propertyType = "["+ valueType +"]"; // TODO: change from language
			property.isArray = true;
			property.isCustomClass = false;
			property.elementType = getPropertyTypeForArray(value, language);
			property.elementTypeIsCustom = false;
		}
	} else if (value instanceof Object) {
		valueType = getTypeNameFromKey(key, language);

		property.propertyType = valueType;
		property.isArray = false;
		property.isCustomClass = true;
	} else {
		property.propertyType = valueType;
	}

	return property;
}

function getTypeNameFromKey(value, language) {
	return getLanguageName(value, language).capitalize();
}

function getLanguageName(value, language) {
	var propertyName = cleanupName(value);
	propertyName = underscoreToCamelcase(propertyName);

	if (language.reservedKeywords) {
		if (language.reservedKeywords.indexOf(propertyName) > -1) {
			propertyName = "`"+propertyName+"`";
		}
	}

	return propertyName;
}

function getPropertyTypeName(value, language) {
	let type = typeof(value);

	var languageType = "";
	if (type == "object") {
		if (value instanceof Array) {
			languageType = getPropertyTypeForArray(value, language);
		} else {
			languageType = "Any"; //lang.dataTypes.generic;
		}
	} else if (type == "string") {
		languageType = "String"; //lang.dataTypes.string;
	} else if (isInt(value)) {
		languageType = "Int"; //lang.dataTypes.int;
	} else if (isFloat(value)) {
		languageType = "Double"; //lang.dataTypes.float;
	} else if (type == "boolean") {
		languageType = "Bool"; //lang.dataTypes.boolean;
	}

	return languageType;
}

function getPropertyTypeForArray(value, language) {
	if (value.length == 0) {
		return "Any"; //lang.dataTypes.generic;
	} else {
		return getPropertyTypeName(value[0], language);
	}
}

function cleanupName(value) {
	return value;
}

function underscoreToCamelcase(value) {
	var str = value.replace(/ /g, "");


	var find = /(\_\w)/g;
	var convert =  function(matches){
	    return matches[1].toUpperCase();
	};

	var camelCaseString = str.replace(
	    find,
	    convert
	);

	return camelCaseString;
}

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.replaceAll = function(from, to) {
	var re = new RegExp(from,"g");
    return this.replace(re, to);
}

// Property
function Property(language) {
	this.language = language
}

Property.prototype = {
	constructor: Property,
	toString: function() {
		var content = this.language.instanceVarDefinition;

		content = content.replaceAll(varType, this.propertyType);
		content = content.replaceAll(varName, this.propertyName);
		content = content.replaceAll(jsonKeyName, this.jsonKeyName);

		return content;
	}
}

// FileRepresenter
function FileRepresenter(className, properties, language) {
	this.language = language
	this.className = className
	this.properties = properties
	this.isInitializers = false
}

FileRepresenter.prototype = {
	constructor: FileRepresenter,
	addFirstLine: function() {
		return "";
	},

	addCopyright: function() {
		return "";
	},

	addImports: function() {
		return "";
	},

	addProperties: function() {
		var propertyString = "\n";

		this.properties.forEach(function(property) {
			propertyString += property.toString();
		});

		return propertyString;
	},

	addSetterGetter: function() {
		return "";
	},

	addInitializers: function() {
		var content = "";

		if (!this.isInitializers) {
			return content;
		}

		var properties = this.properties;
		var className = this.className;
		this.language.constructors.forEach(function(construct) {
			content += "\n";
			if (construct.comment) {
				content += construct.comment;
			}

			content += construct.signature;
			content += construct.bodyStart;

			properties.forEach(function(property) {
				var propertyString = construct.fetchBasicTypePropertyFromMap;
				propertyString = propertyString.replaceAll(varName, property.propertyName);
				propertyString = propertyString.replaceAll(jsonKeyName, property.jsonKeyName);
				propertyString = propertyString.replaceAll(varType, property.propertyType);

				content += propertyString;
			});

			content += construct.bodyEnd;
			content = content.replaceAll(modelName, className);
		});

		return content;
	},

	addUtilitiesMethods: function() {
		return "";
	},

	toString: function() {
		var content = "";

		content = content + this.addFirstLine();
		content = content + this.addCopyright();
		content = content + this.addImports();

		let modelDefinition = this.language.modelDefinition.replaceAll(modelName, this.className);
		content = content + modelDefinition;
		content = content + this.language.modelStart;

		content = content + this.addProperties();
		content = content + this.addSetterGetter();
		content = content + this.addInitializers();
		content = content + this.addUtilitiesMethods();
		content = content + this.language.modelEnd;
		content = content.replaceAll(modelName, this.className);

		return content;
	}
}