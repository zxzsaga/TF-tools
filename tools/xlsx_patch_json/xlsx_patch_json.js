var fs = require('fs');
var program = require('commander');
var XLSX = require('xlsx');

program
    .version('0.0.1')
    .usage('input_xlsx_file_name json_file_name destination_file_name sheet_name target_language')
    .parse(process.argv);

var languageTable = {
    cn: 'Chinese（Simple）',
    tw: 'Chinese（Traditional）',
    en: 'En'
};

function xlsxPatchJSON() {
    if (program.args.length < 5) {
        console.error('缺少参数');
        return;
    }
    var xlsxFilename   = program.args[0];
    var jsonFilename   = program.args[1];
    var destination    = program.args[2];
    var sheetName      = program.args[3];
    var targetLanguage = program.args[4];
    
    var workbook  = XLSX.readFile(xlsxFilename);
    var worksheet = workbook.Sheets[sheetName];
    var keyLangArr = XLSX.utils.sheet_to_row_object_array(worksheet);
    if (keyLangArr.length === 0) {
        console.error('empty sheet');
        return;
    }
    if (keyLangArr[0][languageTable[targetLanguage]] === undefined) {
        console.error('no column ' + languageTable[targetLanguage]);
        return;
    }
    var sheetObj = XLSX.utils.sheet_to_row_object_array(worksheet);

    var jsonContent = fs.readFileSync(jsonFilename, 'utf8');
    try {
        jsonContent = JSON.parse(jsonContent);
    } catch (err) {
        console.error('JSON parse error');
        return;
    }

    var targetLanguageValue = languageTable[targetLanguage];
    sheetObj.forEach(function(element) {
        if (jsonContent[element.Key] !== undefined) {
            element[targetLanguageValue] = jsonContent[element.Key];
        }
    });

    var sheetArr = [];
    var headRow = [];
    for (var key in keyLangArr[0]) {
        if (key !== '__rowNum__') {
            headRow.push(key);
        }
    }
    sheetArr.push(headRow);
    sheetObj.forEach(function(element) {
        var arr = [];
        headRow.forEach(function(key) {
            arr.push(element[key]);
        });
        sheetArr.push(arr);
    });
    workbook.Sheets[sheetName] = sheet_from_array_of_arrays(sheetArr);
    XLSX.writeFile(workbook, destination);
};
xlsxPatchJSON();

function sheet_from_array_of_arrays(data, opts) {
	var ws = {};
	var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
	for(var R = 0; R != data.length; ++R) {
		for(var C = 0; C != data[R].length; ++C) {
			if(range.s.r > R) range.s.r = R;
			if(range.s.c > C) range.s.c = C;
			if(range.e.r < R) range.e.r = R;
			if(range.e.c < C) range.e.c = C;
			var cell = {v: data[R][C] };
			if(cell.v == null) continue;
			var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
			
			if(typeof cell.v === 'number') cell.t = 'n';
			else if(typeof cell.v === 'boolean') cell.t = 'b';
			else if(cell.v instanceof Date) {
				cell.t = 'n'; cell.z = XLSX.SSF._table[14];
				cell.v = datenum(cell.v);
			}
			else cell.t = 's';
			
			ws[cell_ref] = cell;
		}
	}
	if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
	return ws;
}

function datenum(v, date1904) {
	if(date1904) v+=1462;
	var epoch = Date.parse(v);
	return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}
