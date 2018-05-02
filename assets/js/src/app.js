/**
 * --------------------------------------------------------------------------------------
 * This is the main application file.
 * This file is responsible for controlling application behaviour
 * All frontend user activities are handled by the code block written here
 * --------------------------------------------------------------------------------------
 */

// Make sure jQuery has been loaded
if (typeof jQuery === 'undefined') {
	throw new Error('QTS Scanner App requires jQuery');
}


/**
 * Overridden console.log for production
 * @type Function|common_L4.commonAnonym$0
 */
window.console = (function (origConsole) {
	if (!window.console)
		console = {};
	var isDebug = true; // set true to display console in browser console
	var logArray = {
		logs: [],
		errors: [],
		warns: [],
		infos: []
	};
	return {
		log: function () {
			logArray.logs.push(arguments)
			isDebug && origConsole.log && origConsole.log.apply(origConsole, arguments);
		},
		warn: function () {
			logArray.warns.push(arguments)
			isDebug && origConsole.warn && origConsole.warn.apply(origConsole, arguments);
		},
		error: function () {
			logArray.errors.push(arguments)
			isDebug && origConsole.error && origConsole.error.apply(origConsole, arguments);
		},
		info: function (v) {
			logArray.infos.push(arguments)
			isDebug && origConsole.info && origConsole.info.apply(origConsole, arguments);
		},
		debug: function (bool) {
			isDebug = bool;
		},
		logArray: function () {
			return logArray;
		}
	};

}(window.console));


/**
* App Specific Variables, Constants
*/
var baseURL = window.location.origin;
var pathName = window.location.pathname;
var html_page = pathName.split('/').pop();
var currentURL = document.location.href;
var splitted_url = currentURL.split(html_page);
var basePath = baseURL; //in production it might be https://www.something.com
if (html_page == "") {
	basePath = baseURL + pathName;
} else {
	basePath = splitted_url[0];
}


/**
 * Web Service/REST API Config
 */
var APIBaseURL = basePath + 'mock_data/'; //in production it might be https://www.something.com/api/
var API = {};
API.userAuth = APIBaseURL + 'res_user_auth.json'; // in production it might be https://www.something.com/api/uauth.action
API.createBatch = APIBaseURL + 'res_create_batch.json';
API.getTableType = APIBaseURL + 'res_table_type.json';
API.getResult = APIBaseURL + 'res_result.json';
API.saveConfiguration = APIBaseURL + 'res_saveconfig.json';


/**
 * Onload set scroll bar to bottom of the scrollable container 
 * @param {DOM element object} el 
 */
function scrollToBottom(el) {
	var $scrollableArea = $(el);
	$scrollableArea.scrollTop($scrollableArea[0].scrollHeight);
}

function getQueryString() {
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

/**
 * Time format AM, PM
 * @param {*} date 
 */
function formatAMPM(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	seconds = seconds < 10 ? '0' + seconds : seconds;
	var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
	//var strTime = '<span><span class="h1">' + hours + '</span>:<span class="h3">' + minutes + '</span><sup><span class="h6 text-danger">' + seconds + '</span> ' + ampm + '</sup></span>';
	//var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}

/**
 * Scroll to Top of webpage
 */

function scrollToTop(minHeight, scrollSpeed) {
	$(window).scroll(function () {
		if ($(this).scrollTop() > minHeight) {
			$('.scrollup').fadeIn();
		} else {
			$('.scrollup').fadeOut();
		}
	});
	$('.scrollup').click(function () {
		$("html, body").animate({
			scrollTop: 0
		}, scrollSpeed);
		return false;
	});
}














/**
 * ------------------------------------------------------------------------------
 * DOM Interaction (Ready/Load, Click, Hover, Change)
 * ------------------------------------------------------------------------------
 */
$(DOMReady); // Document Ready Handler

function DOMReady() {
	var pageId = $('body').attr('data-page-id') ? $('body').attr('data-page-id') : '';
	if (pageId == '') {
		requiredAuth();
		alert("Warning! Unable to process your request\n.data-page-id attribute is not found in body tag.");
	}
	console.log("###### DOM is Ready ###### data-page-id = " + pageId);

	scrollToTop(100, 100);

	if (pageId == 'login') {
		var elBtnLogin = '#btnLogin';
		var elFrmLogin = '#frmLogin';
		var elLoginContent = '.login-content';
		var elLoginConfigContent = '.login-config-content';
		$(elLoginConfigContent).hide();

		$(elBtnLogin).on('click', doLogin);
	}

	if (pageId == 'operation') {
		requiredAuth();
		// Load Data
		renderTableType();
		// On Clicking Create Batch
		$('#btnCreateBatch').on('click', createBatch);
		renderDataTableListBatches();

		$(document).on("change", "select[name='expressionType']", function (e) {
			var expressionType = $(this).val();
			//console.log(expressionType);			
			var parentRowContainer = $(this).parent().parent().parent();
			parentRowContainer.find('input[data-expression-type]').attr('data-expression-type', expressionType);
		});

		//Add More Exp
		$(document).on("click", ".addMoreExpression", function (e) {
			console.log(e);
			e.preventDefault();
			var parentRowContainer = $(this).parent().parent();
			var countExpContainer = $(".dynamicExpressionContainer").length;
			var html = '';
			html += '<div class="row dynamicExpressionContainer">';
			html += '<div class="col-md-4">';
			html += '<div class="form-group label-floating">';
			html += '<label class="control-label">Expression Type</label>';
			html += '<select name="expressionType" class="form-control">';
			html += '<option value=""></option>';
			html += '<option value="regular_expression">Regular Expression</option>';
			html += '<option value="generic_expression">Generic Expression</option>';
			html += '</select>';
			html += '</div>';
			html += '</div>';
			html += '<div class="col-md-4">';
			html += '<div class="form-group label-floating">';
			html += '<label class="control-label">Please enter expression</label>';
			html += '<input data-expression-type="" type="text" class="form-control" name="expression" maxlength="255">';
			html += '</div>';
			html += '</div>';
			html += '<div class="col-md-4">';
			html += '<a href="#" class="addMoreExpression btn btn-success btn-xs" title="Add More Expression"><i class="material-icons">add</i></a>';
			html += '<a href="#" class="removeExpression btn btn-danger btn-xs" title="Remove this Expression"><i class="material-icons">remove</i></a>';
			html += '</div>';
			html += '</div>';

			parentRowContainer.after(html);
		});

		$(document).on("click", ".removeExpression", function (e) {
			console.log(e);
			e.preventDefault();
			$(this).parent().parent().remove();
		});
	}

	if (pageId == 'scan_result') {
		requiredAuth();
		renderDataTableResult();
	}

	if (pageId == 'configuration') {
		requiredAuth();
		// On click save config
		$('#btnSaveConfiguration').on('click', saveConfiguration);
		$('#btnSkipSaveConfiguration').on('click', function (e) {
			window.location.href = "operation.html";
		});
	}

	$("#logout").on("click", logoutSession);

} // end of $(document).ready();



function renderTableType() {
	var xhr = new Ajax();
	xhr.type = 'get';
	xhr.url = API.getTableType;
	xhr.data = { username: sessionStorage.getItem('sess_username'), password: sessionStorage.getItem('sess_password') };
	var promise = xhr.init();

	promise.done(function (data) {
		$.each(data, function (key, value) {
			// APPEND OR INSERT DATA TO SELECT ELEMENT.
			$('#tableName').append('<option title="' + value.description + '" data-type="' + value.table_type + '" value="' + value.table_type_id + '">' + value.table_name + '_' + value.table_type_id + '</option>');
			//$('#tableName').append('<option data-type="' + key + '" value="' + key + '">' + key + '</option>');
		});
	});
	promise.done(function (data) {
		//do more
	});
	promise.done(function (data) {
		//do another task
	});
	promise.fail(function () {
		//show failure message
	});
	promise.always(function () {
		//always will be executed whether success or failue
		//do some thing
	});
	promise.always(function () {
		//do more on complete
	});
}


function doLogin(e) {
	e.preventDefault();
	var postUsername = $("#username").val();
	var postPassword = $("#password").val();
	var elLoginContent = '.login-content';
	var elLoginConfigContent = '.login-config-content';
	var xhr = new Ajax();
	xhr.type = 'POST';
	xhr.url = API.userAuth;
	xhr.data = { username: postUsername, password: postPassword };
	var promise = xhr.init();

	promise.done(function (data) {
		// if login success
		if (data.is_user_authenticated == true) {
			sessionStorage.setItem('sess_username', data.username);
			sessionStorage.setItem('sess_password', data.password);
			$("#loginMessage").html('<span class="alert alert-success">' + data.message + '</span>');

			// redirect to page after login successful. using set time out for 2 sec delay
			// if you want to redirect without delay, then use the below
			// window.location.href = "configuration.html";
			setTimeout(function () { window.location.href = "configuration.html"; }, 1000);
			

		} else {
			// display login failed message
			$("#loginMessage").html('<span class="alert alert-danger">Login failed. </span>');
		}
	});

	promise.done(function (data) {
		//do more
	});
	promise.fail(function () {
		//show failure message
	});
	promise.always(function () {
		//always will be executed whether success or failue
		//do some thing
	});
	promise.always(function () {
		//do more on complete
	});

}


function logoutSession(e){
	e.preventDefault();
	sessionStorage.clear();
	window.location.href = "index.html";
}


function requiredAuth() {
	if (sessionStorage.getItem('sess_username') == null || sessionStorage.getItem('sess_username') == '') {
		window.location.href = "index.html";
	}
}


function createBatch(e) {
	e.preventDefault();
	var d = new Date();
	var time_stamp = d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear() + '_' + d.getHours() + '-' + d.getMinutes();
	var frm = $('#frmCreateBatch');
	//var postData = frm.serialize();
	//var table_id = $('#tableName').val();
	//var table_type = $('#tableName option:selected').attr('data-type');

	//Reg Exp
	var batchRegExp = [];
	$("input[name='expression'][data-expression-type='regular_expression']").each(function (index, obj) {
		var exp_val = $(this).val();
		var exp_type = $(this).attr('data-expression-type');
		item = {}
		//item["expression_type"] = exp_type;
		item["exp_" + (index + 1)] = exp_val;
		batchRegExp.push(item);
	});
	//console.log("Reg", batchRegExp);

	var batchGenExp = [];
	$("input[name='expression'][data-expression-type='generic_expression']").each(function (index, obj) {
		var exp_val = $(this).val();
		var exp_type = $(this).attr('data-expression-type');
		item = {}
		//item["expression_type"] = exp_type;
		item["exp_" + (index + 1)] = exp_val;
		batchGenExp.push(item);
	});
	//console.log("Gen", batchGenExp);

	var batchTable = [];
	$("#tableName option:selected").each(function (index, obj) {
		var id = $(this).val();
		var table_type = $(this).attr('data-type');
		item = {}
		item["batch_id"] = table_type + '_' + time_stamp;
		item["table_type"] = table_type;
		item["table_type_id"] = id;
		batchTable.push(item);
	});




	var date = $('#date').val();
	var time = $('#timepicker').val();
	var regex = $('#regex').val();
	var sess_username = sessionStorage.getItem('sess_username');
	var sess_password = sessionStorage.getItem('sess_password');
	var postData = {
		username: sess_username,
		password: sess_password,
		batch: { "regular_expressions": batchRegExp, "generic_expressions": batchGenExp, "data": batchTable }
	};
	console.log(JSON.stringify(postData));
	var xhr = new Ajax();
	xhr.type = 'get';
	xhr.url = API.createBatch;
	xhr.data = postData;
	var promise = xhr.init();
	//frm.submit();
	promise.done(function (data) {
		console.log(data);
		//renderDataTableListBatches();
		//table.ajax.reload();
	});
	promise.done(function (data) {
		//do more
	});
	promise.done(function (data) {
		//do another task
	});
	promise.fail(function () {
		//show failure message
	});
	promise.always(function () {
		//always will be executed whether success or failue
		//do some thing
	});
	promise.always(function () {
		//do more on complete
	});
}


function renderDataTableListBatches() {
	//console.log("renderDataTableListBatches() called");
	var table;
	table = $('#tableListBatches').DataTable({
		'ajax': {
			'url': API.createBatch,
			'dataSrc': function (jsonData) {
				//console.log(jsonData);
				var return_data = new Array();
				$.each(jsonData, function (index, val) {
					//console.log(index);
					return_data.push({
						'sr': index + 1,
						'batch_id': val.batch_id,
						'table_type': val.table_type,
						'batch_date': val.batch_date,
						'regex': val.regex,
						'status': val.status
					});
				});
				return return_data;
				//return jsonData;

			},
		},
		'columns': [
			{ 'data': "sr" },
			{ 'data': "batch_id" },
			{ 'data': "table_type" },
			{ 'data': "batch_date" },
			{ 'data': "regex" },
			{ 'data': "status" }
		]
	});
	return table;
}


function renderDataTableResult() {
	var table;
	table = $('#tableResult').DataTable({
		'ajax': {
			'url': API.getResult,
			'dataSrc': function (jsonData) {
				console.log(jsonData);
				var return_data = new Array();
				$.each(jsonData, function (batchIndex, batchObj) {
					$.each(batchObj.attachment, function (attachmentIndex, attachmentObj) {
						return_data.push({
							'1': batchObj.batch_id,
							'2': batchObj.regex,
							'3': attachmentObj.document_name,
							'4': attachmentObj.document_type,
							'5': attachmentObj.document_size,
							'6': attachmentObj.status,
							'7': '<span class="' + attachmentObj.status_txt_css_class + '">' + attachmentObj.status_message + '</span>'
						});
					});
				});
				return return_data;
				//return jsonData;

			},
		},
		'columns': [
			{ 'data': "1" },
			{ 'data': "2" },
			{ 'data': "3" },
			{ 'data': "4" },
			{ 'data': "5" },
			{ 'data': "6" },
			{ 'data': "7" }
		]
	});
	return table;
}


function saveConfiguration(e) {
	e.preventDefault();
	var frm = $('#frmConfiguration');
	//var postData = frm.serialize();
	var postData = {};
	postData.service_now_url = $('#service_now_url').val();
	postData.service_now_username = $('#service_now_username').val();
	postData.service_now_password = $('#service_now_password').val();
	postData.scanner_password = $('#scanner_password').val();

	var xhr = new Ajax();
	xhr.type = 'post';
	xhr.url = API.saveConfiguration;
	xhr.data = postData;
	var promise = xhr.init();

	promise.done(function (data) {
		console.log(data);
	});
	promise.done(function (data) {
		//redirect to operation
		window.location.href = "operation.html";
	});
	promise.done(function (data) {
		//do another task
	});
	promise.fail(function () {
		//show failure message
	});
	promise.always(function () {
		//always will be executed whether success or failue
		//do some thing
	});
	promise.always(function () {
		//do more on complete
	});
}