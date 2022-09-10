"use strict";

let languages = {
  swift: {
    name: "Swift",
    frameworks: {
      codable: {
        mode: "text/x-swift",
        name: "Codable",
        file: "SwiftCodable.json",
        identifiers: [{
          key: "struct",
          value: "Struct",
          checked: "checked"
        },{
          key: "class",
          value: "Class",
          checked: ""
        }],
        varTypes: [{
          key: "let",
          value: "let",
          checked: "checked"
        },{
          key: "var",
          value: "var",
          checked: ""
        }],
        optionalTypes: [{
          key: "optional",
          value: "Optional",
          checked: ""
        },{ 
          key: "non-optional",
          value: "Non Optional",
          checked: "checked"
        }]
      },
      swiftyjson: {
        mode: "text/x-swift",
        name: "SwiftyJSON",
        file: "SwiftyJSON.json",
        identifiers: [{
          key: "struct",
          value: "Struct",
          checked: "checked"
        },{
          key: "class",
          value: "Class",
          checked: ""
        }],
        varTypes: [{
          key: "let",
          value: "let",
          checked: "checked"
        },{
          key: "var",
          value: "var",
          checked: ""
        }]
      },
      dictionary: {
        mode: "text/x-swift",
        name: "Dictionary",
        file: "SwiftDictionary.json",
        identifiers: [{
          key: "struct",
          value: "Struct",
          checked: "checked"
        },{
          key: "class",
          value: "Class",
          checked: ""
        }],
        varTypes: [{
          key: "let",
          value: "let",
          checked: "checked"
        },{
          key: "var",
          value: "var",
          checked: ""
        }]
      }
    }
  },
  java: {
    name: "Java",
    frameworks: {
      gson: {
        mode: "text/x-java",
        name: "Gson",
        file: "JavaGson.json"
      },
      moshi: {
        mode: "text/x-java",
        name: "Moshi",
        file: "JavaMoshi.json"
      },
      android: {
        mode: "text/x-java",
        name: "Android/JSONObject",
        file: "JavaAndroid.json"
      }
    }
  },
  kotlin: {
    name: "Kotlin",
    frameworks: {
      gson: {
        mode: "text/x-kotlin",
        name: "Gson",
        file: "KotlinGson.json",
        varTypes: [{
          key: "val",
          value: "val",
          checked: "checked"
        },{
          key: "var",
          value: "var",
          checked: ""
        }],
        optionalTypes: [{
          key: "optional",
          value: "Optional",
          checked: ""
        },{ 
          key: "non-optional",
          value: "Non Optional",
          checked: "checked"
        }]
      },
      moshi: {
        mode: "text/x-kotlin",
        name: "Moshi",
        file: "KotlinMoshi.json",
        varTypes: [{
          key: "val",
          value: "val",
          checked: "checked"
        },{
          key: "var",
          value: "var",
          checked: ""
        }],
        optionalTypes: [{
          key: "optional",
          value: "Optional",
          checked: ""
        },{ 
          key: "non-optional",
          value: "Non Optional",
          checked: "checked"
        }]
      }
    }
  },
  csharo: {
    name: "C#",
    frameworks: {
      csharpNewtonsoft: {
        mode: "text/x-csharp",
        name: "C# Newtonsoft",
        file: "CSharpNewtonsoft.json"
      },
      csharpClass: {
        mode: "text/x-csharp",
        name: "C# Class",
        file: "CSharpClass.json"
        }
    }
  },
  xpp: {
      name: "X++",
      frameworks: {
          xppClass: {
              mode: "text/x-csharp",
              name: "X++ Contract Class",
              file: "xppJSON.json"
          },
		  xppParmClass: {
              mode: "text/x-csharp",
              name: "X++ Parm Contract Class",
              file: "xppParmJSON.json"
          }
      }
    }
};

var selectedLanguage = languages.swift;
var selectedFramework = selectedLanguage.frameworks.codable;
var inputTextArea;

var md;

$(document).ready(function() {

  md = window.markdownit({
    highlight: function (str, lang) { 
      if (lang && window.hljs.getLanguage(lang)) {
        try {
          return window.hljs.highlight(lang, str).value;
        } catch (__) {}
      }
      return ''; 
    }
  });

	inputTextArea = CodeMirror.fromTextArea(document.getElementById('input'), {
    mode: {name: "javascript", json: true},
    theme: "ambiance",
    lineNumbers: true,
    indentUnit: 4
  });

  inputTextArea.on("change", function(cm, change) {
   inputChanged();
 });

  $('#rootClassName').bind('input propertychange', function() {
    inputChanged();
  });

  inputTextArea.setSize(null, $("#input").innerHeight());
    Object.keys(languages).forEach(function(key) {
     let value = languages[key];
     let element = $('<a class="dropdown-item dropdown-item-language" id="' + key + '" href="#">' + value.name + '</a>');
     $("#dropdownMenuLanguage").append(element);
   });

    $('.dropdown-item-language').click(function () {
     let key = this.id
     selectedLanguage = languages[key]
     updateSelectedLanguage();
   });

    updateSelectedLanguage();

    inputTextArea.setValue(examlpeJSON);
  });

function inputChanged() {
	$.getJSON("./languages/" + selectedFramework.file, {}, function(language) {
		buildClasses(language);
	});
}

function buildClasses(language) {
  try {
    let result = getAllClasses(language);
    showResult(result);
    $('#errorAlert').hide();
  } catch (e) {
    $('#errorAlert').text(e.message.replaceAll("JSON.parse: ",""));
    $('#errorAlert').show();
  }
}

function getAllClasses(language) {
  let input = inputTextArea.getValue();
  let builder = new FileBuilder(language);
  builder.isInitializers = $('#initializerCheckbox').is(':checked');
  builder.rootClassName = $('#rootClassName').val();
  builder.modelIdentifier = $('[name="modelIdentifierRadios"]:checked').val();
  builder.varTypes = $('[name="modelVariableRadios"]:checked').val();
  builder.isOptional = $('[name="modelOptionalRadios"]:checked').val() == "optional";

  var methods = new Array();
  let checkedMethods = $('.method-checkbox:checked');
  for (var i = 0; i < checkedMethods.length; i++) {
    let id = checkedMethods[i].id;
    if (id != "initializerCheckbox") {
      methods.push(id);
    }
  }

  builder.methods = methods;

  try {
    return builder.classes(input);
  } catch (e) {
    throw e;
  }
}

function showResult(classes) {
  $('#output').empty();

  let topButton = `
  <div class="form-group">
  <button type="button" id="downloadAllButton" class="btn btn-success">Download All</button>
  </div>
  `;

  $('#output').append(topButton);

  classes.forEach(function(file) {
    addCodeMirror(file);
  });

  $('#downloadAllButton').click(function() {
    downloadAllFiles();
  });
}

function updateSelectedLanguage() {
	$("#dropdownMenuButtonLanguage").text(selectedLanguage.name);
  var frameworks = Object.keys(selectedLanguage.frameworks)
  selectedFramework = selectedLanguage.frameworks[frameworks[0]]

  $("#dropdownMenuFramework").empty();
  frameworks.forEach(function(key) {
    let value = selectedLanguage.frameworks[key];
    let element = $('<a class="dropdown-item dropdown-item-framework" id="' + key + '" href="#">' + value.name + '</a>');
    $("#dropdownMenuFramework").append(element);
  });

  $('.dropdown-item-framework').click(function () {
    let key = this.id
    selectedFramework = selectedLanguage.frameworks[key]
    updateSelectedFramework();
  });

  updateSelectedFramework();
}

function updateSelectedFramework() {
  $("#dropdownMenuButtonFramework").text(selectedFramework.name);

  $("#modelIdentifiers").empty();
  if (selectedFramework.identifiers) {
    $("#modelIdentifiers").append('<label>Model Type:</label>');
    selectedFramework.identifiers.forEach(function(identifier){
      let element = '<div class="form-check"><input class="form-check-input model-identifier-radio" type="radio" name="modelIdentifierRadios" id="' + identifier.key + '" value="' + identifier.key + '" ' + identifier.checked + '><label class="form-check-label" for="' + identifier.key + '">' + identifier.value + '</label></div>';
      $("#modelIdentifiers").append(element);
    });
  }

  $("#modelVariableTypes").empty();
  if (selectedFramework.varTypes) {
    $("#modelVariableTypes").append('<label>Variable Type:</label>');
    selectedFramework.varTypes.forEach(function(identifier){
      let element = '<div class="form-check"><input class="form-check-input model-identifier-radio" type="radio" name="modelVariableRadios" id="' + identifier.key + '" value="' + identifier.key + '" ' + identifier.checked + '><label class="form-check-label" for="' + identifier.key + '">' + identifier.value + '</label></div>';
      $("#modelVariableTypes").append(element);
    });
  }

  $("#optionalTypes").empty();
  if (selectedFramework.optionalTypes) {
    $("#optionalTypes").append('<label>Optional:</label>');
    selectedFramework.optionalTypes.forEach(function(identifier){
      let element = '<div class="form-check"><input class="form-check-input model-identifier-radio" type="radio" name="modelOptionalRadios" id="' + identifier.key + '" value="' + identifier.key + '" ' + identifier.checked + '><label class="form-check-label" for="' + identifier.key + '">' + identifier.value + '</label></div>';
      $("#optionalTypes").append(element);
    });
  }

  $('.model-identifier-radio').click(function () {
    inputChanged();
  });

  $.getJSON("./languages/" + selectedFramework.file, {}, function(language) {
    updateUIForCurrentFramework(language);
  });
}

function updateUIForCurrentFramework(language) {

  $("#methodsCheckboxes").empty();

  if (language.methods.constructors || language.methods.others) {
    $("#methodsCheckboxes").append('<label>Methods:</label>');
    if (language.methods.constructors) {
      let initializerElement = checkBox("initializerCheckbox", language.methods.constructorName, "method-checkbox", language.methods.constructorChecked);
      $("#methodsCheckboxes").append(initializerElement);
    }
  }

  if (language.methods.others) {
    Object.keys(language.methods.others).forEach(function(key) {
      var method = language.methods.others[key];
      let checkboxElement = checkBox(key, method.name, "method-checkbox", method.checked);
      $("#methodsCheckboxes").append(checkboxElement);
    });
  }

  $('.method-checkbox').change(function() {
    inputChanged();
  });

  buildClasses(language);
  showExampleCode(language);
}

function showExampleCode(language) {

  if (language.exampleCode) {
    var className = $('#rootClassName').val();

    if (!className) {
      className = "RootClass";
    }

    let input = inputTextArea.getValue();
    let codeText = language.exampleCode.replaceAll("<!RootClassName>", className).replaceAll("<!JsonString>", input);
    let result = md.render(codeText);
    $('#exampleCode').html(result);
  } else {
    $('#exampleCode').html("");
  }
}

function checkBox(checkid, checkvalue, checkclass, checkchecked) {
  return `
  <div class="input-group mb-3">
  <div class="input-group-prepend">
  <div class="input-group-text">
  <input class="${checkclass}" type="checkbox" aria-label="Checkbox for following text input" id="${checkid}" ${checkchecked}>
  </div>
  </div>
  <label for="${checkid}" class="form-control" aria-label="Text input with checkbox">${checkvalue}</label>
  </div>
  `;
}

function addCodeMirror(file) {
  let fileName = `${file.className}.${file.language.fileExtension}`;
  let textView = `
  <div class="form-group bg-secondary text-light border border-secondary rounded px-2 pt-2">
  <div class="form-group">
  <label for="${fileName}TextArea">${fileName}</label>
  <textarea class="form-control form-font" rows="20" id="${fileName}TextArea" readonly>${file.toString()}</textarea>
  </div>
  <div class="form-group">
  <button type="button" id="${fileName}" class="btn btn-success btn-sm output-textarea-button">Download</button>
  </div>
  </div>
  `;

  $('#output').append(textView);

  CodeMirror.fromTextArea(document.getElementById(fileName+"TextArea"), {
    mode: selectedFramework.mode,
    theme: "ambiance",
    lineNumbers: true,
    readOnly: true
  });

  $('.output-textarea-button').click(function() {
    let id = this.id;
    downloadFile(id, document.getElementById(id+'TextArea').innerHTML);
  });
}

function downloadFile(filename, text) {
  let data = new Blob([text], {type: "text/plain;charset=utf-8"});
  saveAs(data, filename);
}

function downloadAllFiles() {

  $.getJSON("./languages/" + selectedFramework.file, {}, function(language) {
    let result = getAllClasses(language);

    var zip = new JSZip();

    result.forEach(function(file) {
      zip.file(file.className+"."+file.language.fileExtension, file.toString());
    });

    zip.generateAsync({type:"blob"}).then(function(content) {
      var fileName = $('#rootClassName').val();
      if (fileName == "") {
        fileName = "JSONModel";
      }
      fileName += ".zip";

      saveAs(content, fileName);
    });
  });
}

let examlpeJSON = '{\n\t"test_int": 101,\n\t"test_bool": true,\n\t"test_string": "foo",\n\t"test_object": {\n\t\t"test_double": 1.12\n\t}\n}'
