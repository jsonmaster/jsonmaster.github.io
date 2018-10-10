let languages = {
  swift: {
    name: "Swift",
    frameworks: {
      codable: {  
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
        }]
      },
      swiftyjson: {  
        name: "SwiftyJSON",
        file: "SwiftCodable.json",
        identifiers: [{
          key: "struct",
          value: "Struct",
          checked: "checked"
        },{
          key: "class",
          value: "Class",
          checked: ""
        }]
      }
    }
  },
  java: {
    name: "Java",
    frameworks: {
      codable: {  
        name: "Gson",
        file: "SwiftCodable.json"
      }
    }
  }
}

var selectedLanguage = languages.swift
var selectedFramework = selectedLanguage.frameworks.codable
var inputTextArea;
var outputTextArea;

$(document).ready(function() {

	inputTextArea = CodeMirror.fromTextArea(document.getElementById('input'), {
        mode: {name: "javascript", json: true},
        theme: "default",
        lineNumbers: true,
        indentUnit: 4
    });  
  
    outputTextArea = CodeMirror.fromTextArea(document.getElementById('output'), {
        mode: "text/x-swift",
        theme: "default",
        lineNumbers: true,
        readOnly: true
    });

    inputTextArea.on("change", function(cm, change) {
    	inputChanged();
    });

    $('#rootClassName').bind('input propertychange', function() {
      inputChanged();
    });

    inputTextArea.setSize(null, $("#input").innerHeight());
    outputTextArea.setSize(null, $("#input").innerHeight());

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
  let input = inputTextArea.getValue();
  let builder = new FileBuilder(language);
  builder.isInitializers = $('#initializerCheckbox').is(':checked');
  builder.rootClassName = $('#rootClassName').val();
  builder.modelIdentifier = $('[name="modelIdentifierRadios"]:checked').val();

  var methods = new Array();
  let checkedMethods = $('.method-checkbox:checked');
  for (var i = 0; i < checkedMethods.length; i++) {
    let id = checkedMethods[i].id;
    if (id != "initializerCheckbox") {
      methods.push(id);
    }
  }

  builder.methods = methods;

  let result = builder.classes(input);
  outputTextArea.setValue(result);
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

  $('.model-identifier-radio').click(function () {
    inputChanged();
  });

  $.getJSON("./languages/" + selectedFramework.file, {}, function(language) {
    updateUIForCurrentFramework(language);
  });
}

function updateUIForCurrentFramework(language) {

  $("#methodsCheckboxes").empty();
  $("#methodsCheckboxes").append('<label>Methods:</label>');
  let initializerElement = checkBox("initializerCheckbox", language.methods.constructorName, "method-checkbox", "checked");
  $("#methodsCheckboxes").append(initializerElement);

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

let examlpeJSON = '{\n\t"test_int": 101,\n\t"test_bool": true,\n\t"test_string": "foo",\n\t"test_object": {\n\t\t"test_double": 1.12\n\t}\n}'