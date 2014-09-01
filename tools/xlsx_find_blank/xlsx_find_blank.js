var fs = require('fs');
var program = require('commander');
var XLSX = require('xlsx');

program
    .version('0.0.1')
    .usage('input_xlsx_file_name destination_file_name origin_language target_language sheet_name')
    .parse(process.argv);

var languageTable = {
    cn: 'Chinese（Simple）',
    tw: 'Chinese（Traditional）',
    en: 'En'
};

function xlsxFindBlank() {
    if (program.args.length < 5) {
        console.error('缺少参数');
        return;
    }
    var xlsxFilename   = program.args[0];
    var destination    = program.args[1];
    var originLanguage = program.args[2];
    var targetLanguage = program.args[3];
    var sheetName      = program.args[4];

    var workbook   = XLSX.readFile(xlsxFilename);
    var worksheet  = workbook.Sheets[sheetName];
    var keyLangArr = XLSX.utils.sheet_to_row_object_array(worksheet);
    if (keyLangArr.length === 0) {
        console.error('empty sheet');
        return;
    }
    if (keyLangArr[0][languageTable[originLanguage]] === undefined) {
        console.error('no column ' + languageTable[originLanguage]);
        return;
    }
    if (keyLangArr[0][languageTable[targetLanguage]] === undefined) {
        console.error('no column ' + languageTable[targetLanguage]);
        return;
    }
    var blankArr = {};
    keyLangArr.forEach(function(element) {
        if (element[languageTable[originLanguage]] &&
            !element[languageTable[targetLanguage]]) {
            blankArr[element.Key] = element[languageTable[originLanguage]];
        }
    });
    var writeContent = JSON.stringify(blankArr, null, '  ');
    fs.writeFileSync(destination, writeContent);
};
xlsxFindBlank();
