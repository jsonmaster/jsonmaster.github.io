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
let modelIdentifier = "<!ModelIdentifier!>"


// FileBuilder
function FileBuilder(language) {
	this.language = language
	this.isInitializers = true
}

FileBuilder.prototype = {
	constructor: FileBuilder,
	classes: function(string) {

		try {
			let json = JSON.parse(string);

			if (json) {
				var className = this.rootClassName;
				if (!className) {
					className = "Sample";
				}

				let files = this.getFiles(className, json, this.language);
				return files;
			}
		} catch (e) {
			throw e;
		}

		return new Array();
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
	
	var _this = this;
	keys.forEach(function(key) {
		var value = obj[key];
		var property = getProperty(key, value, language);

		var prevIndex = properties.map(function(prop) {
			return prop.propertyName;
		}).indexOf(property.propertyName);

		if (prevIndex < 0) {
			if (property.isCustomClass) {
				let file = _this.getFiles(property.propertyType, value, language);
				files = file;
			} else if (property.isArray && property.elementTypeIsCustom) {
				let file = _this.getFiles(property.elementType, value, language);
				files = file;
			}

			properties.push(property);
		}
	});

	var file = new FileRepresenter(fileName, properties, language);
	file.isInitializers = this.isInitializers;
	file.modelIdentifier = this.modelIdentifier;
	file.methods = this.methods;

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
			valueType = language.dataTypes.arrayType.replaceAll(elementType, leafType);

			property.propertyType = valueType;
			property.isArray = true;
			property.isCustomClass = false;
			property.elementType = leafType;
			property.elementTypeIsCustom = true;
		} else {
			property.propertyType = language.dataTypes.arrayType.replaceAll(elementType, valueType);
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
			propertyName = propertyName+"Field";
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
			languageType = language.dataTypes.generic;
		}
	} else if (type == "string") {
		languageType = language.dataTypes.string;
	} else if (isInt(value)) {
		languageType = language.dataTypes.int;
	} else if (isFloat(value)) {
		languageType = language.dataTypes.float;
	} else if (type == "boolean") {
		languageType = language.dataTypes.boolean;
	}

	return languageType;
}

function getPropertyTypeForArray(value, language) {
	if (value.length == 0) {
		return language.dataTypes.generic;
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
		return `//\n//  ${this.className}.${this.language.fileExtension}\n//\n//  Generated using https://jsonmaster.github.io\n//  Created on ${new Date().dateString()}\n//\n`;
	},

	addImports: function() {
		return this.language.staticImports + "\n";
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

	getMethodContentWithDependency: function(method) {
		var content = "";

		content += method.bodyStartWithDependency;
		content += method.bodyEndWithDependency;
		content = content.replaceAll(modelName, this.className);

		return content;
	},

	getMethodContent: function(method) {
		var content = "\n";

		if (method.comment) {
			content += method.comment;
		}

		content += method.signature;


		if (method.dependency) {
			if (this.methods.indexOf(method.dependency) > -1) {
				return content += this.getMethodContentWithDependency(method);
			}
		}

		content += method.bodyStart;

		var language = this.language;

		this.properties.forEach(function(property) {
			

			var capitalizedVarTypeString = property.propertyType.capitalize();

			if (property.isArray) {
				capitalizedVarTypeString = property.elementType;
			}

			if (language.typesWithCustomFetchMethod) {
				let index = language.typesWithCustomFetchMethod.indexOf(capitalizedVarTypeString);
				if (index >= 0) {
					capitalizedVarTypeString = language.customFetchTypeReplacement[index];
				}
			}

			var propertyString = method.codeForEachProperty;

			if (property.isCustomClass) {
				if (method.codeForEachCustomProperty) {
					propertyString = method.codeForEachCustomProperty;
				}
			} else if (property.isArray) {
				if (property.elementTypeIsCustom && method.codeForEachCustomArrayProperty) {
					propertyString = method.codeForEachCustomArrayProperty;
				} else if (method.codeForEachArrayProperty) {
					propertyString = method.codeForEachArrayProperty;
				}
			}

			propertyString = propertyString.replaceAll(varName, property.propertyName);
			propertyString = propertyString.replaceAll(jsonKeyName, property.jsonKeyName);
			propertyString = propertyString.replaceAll(varType, property.propertyType);
			propertyString = propertyString.replaceAll(elementType, property.elementType);
			propertyString = propertyString.replaceAll(capitalizedVarType, capitalizedVarTypeString);
			propertyString = propertyString.replaceAll(capitalizedVarName, property.propertyName.capitalize());

			content += propertyString;
		});

		content += method.bodyEnd;
		content = content.replaceAll(modelName, this.className);

		return content;
	},

	addInitializers: function() {
		var content = "";

		if (!this.isInitializers) {
			return content;
		}

		var _this = this;
		this.language.methods.constructors.forEach(function(construct) {
			content += _this.getMethodContent(construct);
		});

		return content;
	},

	addUtilitiesMethods: function() {
		var content = "";

		if (this.methods) {
			var _this = this;
			this.methods.forEach(function(key) {
				var method = _this.language.methods.others[key];
				if (method) {
					content += _this.getMethodContent(method);
				}
			});
		}

		return content;
	},

	toString: function() {
		var content = "";

		content = content + this.addFirstLine();
		content = content + this.addCopyright();
		content = content + this.addImports();

		let modelDefinition = this.language.modelDefinition.replaceAll(modelName, this.className).replaceAll(modelIdentifier, this.modelIdentifier);
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



Date.prototype.dateString = function() {

	var monthNames = [
    	"January", "February", "March",
    	"April", "May", "June", "July",
    	"August", "September", "October",
   	 	"November", "December"
  	];

  	var mm = this.getMonth();
  	var dd = this.getDate();

  	return monthNames[mm] + " " + (dd>9 ? '' : '0') + dd + ", " + this.getFullYear();
}