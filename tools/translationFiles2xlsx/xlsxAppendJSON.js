var fs       = require('fs');
var path     = require('path');
var program  = require('commander');
var XLSX     = require('xlsx');
program
    .version('0.0.1')
    .usage('command_file')
    .parse(process.argv);

// complete!
function json2xlsx() {
    // get command file
    var commandFile = program.args[0];
    var command = fs.readFileSync(commandFile, 'utf8');
    try {
        command = JSON.parse(command);
    } catch (err) {
        console.log('JSON parse error');
        return;
    }

    // read xlsx file
    var workbook = XLSX.readFile(command.origin);
    var workbookSheetNames = workbook.SheetNames;

    // for each sheet append
    for (var appendSheetName in command.append) {
        var sheetObj = {};
        var languageArray = [];
        var appendSheet = command.append[appendSheetName];
        
        // for each column in sheet
        for (var columnName in appendSheet) {
            if (languageArray.indexOf(columnName) === -1) {
                languageArray.push(columnName);
            }
            var JSONFileName = appendSheet[columnName];
            var fileExtention = path.extname(JSONFileName);
            if (fileExtention === '.js') {
                // .js files
                eval(fs.readFileSync(JSONFileName, 'utf8').toString());
                for (var key in cn_localization) {
                    if (sheetObj[key] === undefined) {
                        sheetObj[key] = {};
                    }
                    sheetObj[key][columnName] = cn_localization[key];
                }
            } else if (fileExtention === '.json' && JSONFileName.indexOf('helps') === -1) {
                // .json files except *helps.json
                var JSONContent = fs.readFileSync(JSONFileName, 'utf8');
                try {
                    JSONContent = JSON.parse(JSONContent);
                } catch (err) {
                    console.log('JSON parse error');
                    return;
                }
                for (var key in JSONContent) {
                    if (sheetObj[key] === undefined) {
                        sheetObj[key] = {};
                    }
                    sheetObj[key][columnName] = JSONContent[key];
                }
            } else if (fileExtention === '.json') {
                // *helps.json
                var JSONContent = fs.readFileSync(JSONFileName, 'utf8');
                try {
                    JSONContent = JSON.parse(JSONContent);
                } catch (err) {
                    console.log('JSON parse error');
                    return;
                }
                JSONContent.forEach(function(lv1obj) {
                    var lv1namekey = lv1obj.keyWord + '.name';
                    if (sheetObj[lv1namekey] === undefined) {
                        sheetObj[lv1namekey] = {};
                    }
                    sheetObj[lv1namekey][columnName]= lv1obj.name;
                    if (lv1obj.children) {
                        lv1obj.children.forEach(function(lv2obj) {
                            var lv2namekey = lv1obj.keyWord + '.' + lv2obj.keyWord + '.name';
                            if (sheetObj[lv2namekey] === undefined) {
                                sheetObj[lv2namekey] = {};
                            }
                            sheetObj[lv2namekey][columnName] = lv2obj.name;
                            var lv2descriptionkey = lv1obj.keyWord + '.' + lv2obj.keyWord + '.description';
                            if (sheetObj[lv2descriptionkey] === undefined) {
                                sheetObj[lv2descriptionkey] = {};
                            }
                            sheetObj[lv2descriptionkey][columnName] = lv2obj.description;
                        });
                    }
                });
            }
        }

        // use sheetObj construct array of array data
        var data = [];
        var headRow = ['Key'];
        languageArray.forEach(function(language) {
            headRow.push(language);
        });
        data.push(headRow);
        for (var key in sheetObj) {
            var row = [key];
            languageArray.forEach(function(language) {
                var word = sheetObj[key][language];
                if (word) {
                    row.push(word);
                } else {
                    row.push('');
                }
            });
            data.push(row);
        }
        
        // append sheet to workbook
        var worksheet = sheet_from_array_of_arrays(data);
        workbook.Sheets[appendSheetName] = worksheet;
        
        if (workbookSheetNames.indexOf(appendSheetName) === -1) {
            workbookSheetNames.push(appendSheetName);
        }
    }

    // write new xlsx
    XLSX.writeFile(workbook, 'shell_localizations_cn.xlsx');
}
json2xlsx();

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
