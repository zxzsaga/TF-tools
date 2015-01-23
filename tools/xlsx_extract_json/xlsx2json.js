var fs = require('fs');
var path = require('path');
var program = require('commander');
var XLSX = require('xlsx');
var rmdir = require('rimraf');
var AdmZip = require('adm-zip');

program
    .version('0.0.1')
    .usage('input_xlsx_file_name destination_folder')
    .parse(process.argv);

var columnToFile = {
    'Chinese（Simple）': 'cn',
    'Chinese（Traditional）': 'tw',
    'En': 'en'
};

// complete!
// 仅用于转换多语言的 xlsx
function xlsx2json() {
    var xlsxFilename = program.args[0];
    var destination_folder = program.args[1] || '';
    var workbook = XLSX.readFile(xlsxFilename);
    var sheetNameArr = workbook.SheetNames;

    var dest_folders = fs.readdirSync(destination_folder);
    dest_folders.forEach(function(folder) {
        rmdir.sync(destination_folder + folder, function(err) {
            if (err) {
                return err;
            }
        });
    });

    sheetNameArr.forEach(function(sheetName) {
        var worksheet = workbook.Sheets[sheetName];
        var keyLangArr = XLSX.utils.sheet_to_row_object_array(worksheet);
        var columnLangs = [];
        for (var key in keyLangArr[0]) {
            if (key !== 'Key' && key !== 'undefined' && key !== '__rowNum__') {
                columnLangs.push(key);
                if (!columnToFile[key]) {
                    columnToFile[key] = key;
                }
            }
        }
        var thisSheetObj = {};
        columnLangs.forEach(function(lang) {
            thisSheetObj[lang] = {};

            var dir = destination_folder + columnToFile[lang];
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        });
        keyLangArr.forEach(function(obj) {
            for (var prop in obj) {
                if (columnLangs.indexOf(prop) !== -1) {
                    thisSheetObj[prop][obj.Key] = obj[prop];
                }
            }
        });

        var writeContent;
        var destination;
        for (var lang in thisSheetObj) {
            var dirName = columnToFile[lang];
            if (sheetName === 'ui') {
                writeContent = 'var cn_localization = ';
                writeContent +=  JSON.stringify(thisSheetObj[lang], null, '  ');
                writeContent += ';';

                destination = dirName + '/' + dirName + '.js';
            } else if (sheetName === 'server') {
                writeContent = "'use strict';\n\n";
                writeContent += 'var cn_localization = ';
                writeContent +=  JSON.stringify(thisSheetObj[lang], null, '  ');
                writeContent += ';\n\n';
                writeContent += 'module.exports = cn_localization;';
                destination = dirName + '/' + 'server_' + dirName + '.js';
            } else if (sheetName === 'helps') {
                var writeArr = [];
                for (var key in thisSheetObj[lang]) {
                    var keyArr = key.split('.');
                    if (keyArr.length === 2) {
                        var existFlag = false;
                        for (var i = 0, len = writeArr.length; i < len; i++) {
                            if (writeArr[i].keyWord === keyArr[0]) {
                                writeArr[i][keyArr[1]] = thisSheetObj[lang][key];
                                existFlag = true;
                                break;
                            }
                        }
                        if (!existFlag) {
                            var newlv1obj = {
                                keyWord: keyArr[0]
                            };
                            newlv1obj[keyArr[1]] = thisSheetObj[lang][key];
                            writeArr.push(newlv1obj);
                        }
                    } else if (keyArr.length === 3) {
                        var lv1existFlag = false;
                        for (var i = 0, len = writeArr.length; i < len; i++) {
                            var lv1keyWord = writeArr[i].keyWord;
                            if (lv1keyWord === keyArr[0]) {
                                if (!writeArr[i].children) {
                                    writeArr[i].children = [];
                                }
                                var lv1children = writeArr[i].children;
                                var lv2existFlag = false;
                                for (var i_c = 0, len_c = lv1children.length; i_c < len_c; i_c++) {
                                    var lv2keyWord = lv1children[i_c].keyWord;
                                    if (lv2keyWord === keyArr[1]) {
                                        lv1children[i_c][keyArr[2]] = thisSheetObj[lang][key];
                                        lv2existFlag = true;
                                        break;
                                    }
                                }
                                if (!lv2existFlag) {
                                    var newlv2obj = {
                                        keyWord: keyArr[1]
                                    };
                                    newlv2obj[keyArr[2]] = thisSheetObj[lang][key];
                                    lv1children.push(newlv2obj);
                                }
                                lv1existFlag = true;
                                break;
                            }
                        }
                        if (!lv1existFlag) {
                            var newlv1obj = {
                                keyWord: keyArr[0],
                                children: []
                            };
                            var newlv2obj = {
                                keyWord: keyArr[1]
                            };
                            newlv2obj[keyArr[2]] = thisSheetObj[lang][key];
                        }
                    }
                }
                destination = dirName + '/' + dirName + '_' + sheetName + '.json';
                writeContent = JSON.stringify(writeArr, null, '  ');
            } else {
                destination = dirName + '/' + dirName + '_' + sheetName + '.json';
                writeContent = JSON.stringify(thisSheetObj[lang], null, '  ');
            }
            // writeContent = writeContent.replace(/\\r\\n/g, '\\n');            
            writeContent = writeContent.replace(/\\\\n/g, '\\n');
            fs.writeFileSync(destination_folder + destination, writeContent);
        }
    });

    var zip = new AdmZip();
    zip.addLocalFolder(destination_folder + 'cn');
    zip.addLocalFolder(destination_folder + 'en');
    zip.addLocalFolder(destination_folder + 'tw');
    zip.writeZip(destination_folder + 'result.zip');
}
xlsx2json();
