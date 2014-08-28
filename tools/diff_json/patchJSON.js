var fs = require('fs');
var path = require('path');
var program = require('commander');
program
    .version('0.0.1')
    .usage('inputFile patchFile outputFile')
    .option('-s, --special', 'special handling for cn_helps.json')
    .parse(process.argv);

(function patchJSON() {
    if (program.args.length < 3) {
        console.log('缺少参数');
        return;
    }
    var inputFile = {
        name: program.args[0]
    };
    var patchFile = {
        name: program.args[1]
    };
    var outputFile = {
        name: program.args[2]
    };
    inputFile.ext = path.extname(inputFile.name);
    patchFile.ext = path.extname(patchFile.name);
    if (inputFile.ext !== '.json' && inputFile.ext !== '.js') {
        console.log('输入文件不是 .json 或 .js 文件');
        return;
    }
    if (patchFile.ext !== '.json') {
        console.log('补丁文件不是 .json 文件');
        return;
    }

    if (inputFile.ext === '.json') {
        var inputFileContent;
        try {
            inputFileContent = fs.readFileSync(inputFile.name, 'utf8');
        } catch(err) {
            console.log('输入文件读取错误');
            return;
        }
        try {
            inputFile.obj = JSON.parse(inputFileContent);
        } catch (err) {
            console.log('输入文件 JSON 解析错误');
            return;
        }
    } else if (inputFile.ext === '.js') {
        try {
            eval(fs.readFileSync(inputFile.name, 'utf8').toString());
            inputFile.obj = cn_localization;
        } catch(err) {
            console.log('输入文件 require 失败');
            return;
        }
    }
    outputFile.obj = JSON.parse(JSON.stringify(inputFile.obj));
    var patchFileContent;
    try {
        patchFileContent = fs.readFileSync(patchFile.name, 'utf8');
    } catch(err) {
        console.log('补丁文件读取错误');
        return;
    }
    try {
        patchFile.obj = JSON.parse(patchFileContent);
    } catch(err) {
        console.log('补丁文件 JSON 解析错误');
        return;
    }
    if (program.special === true) {
        for (var newProperty in patchFile.obj.add) {
            var keyArr = newProperty.split('.');
            if (keyArr.length === 1) {
                var newObj = {
                    keyWord:  keyArr[0],
                    name:     patchFile.obj.add[newProperty].name,
                    children: patchFile.obj.add[newProperty].children
                };
                outputFile.obj.push(newObj);
            } else if (keyArr.length === 2) {
                for (var i = 0, len = outputFile.obj.length; i < len; i++) {
                    if (keyArr[0] === outputFile.obj[i].keyWord) {
                        var newObj = {
                            keyWord:     keyArr[1],
                            name:        patchFile.obj.add[newProperty].name,
                            description: patchFile.obj.add[newProperty].description
                        }
                        outputFile.obj[i].children.push(newObj);
                        break;
                    }
                }
            }
        }
        for (var updateProperty in patchFile.obj.update) {
            var keyArr = updateProperty.split('.');
            if (keyArr.length === 2) {
                for (var i = 0, len = outputFile.obj.length; i < len; i++) {
                    if (keyArr[0] === outputFile.obj[i].keyWord) {
                        outputFile.obj[i][keyArr[1]] = patchFile.obj.update[updateProperty].new;
                        break;
                    }
                }
            }
            if (keyArr.length === 3) {
                var breakFlag = false;
                for (var i = 0, len = outputFile.obj.length; i < len; i++) {
                    if (keyArr[0] === outputFile.obj[i].keyWord) {
                        for (var j = 0, lenj = outputFile.obj[i].children.length; j < lenj; j++) {
                            if (keyArr[1] === outputFile.obj[i].children[j].keyWord) {
                                outputFile.obj[i].children[j][keyArr[2]] = patchFile.obj.update[updateProperty].new;
                                breakFlag = true;
                                break;
                            }
                        }
                    }
                    if (breakFlag === true) {
                        break;
                    }
                }
            }
        }
        for (var deleteProperty in patchFile.obj.remove) {
            var keyArr = deleteProperty.split('.');
            if (keyArr.length === 1) {
                for (var i = 0, len = outputFile.obj.length; i < len; i++) {
                    if (keyArr[0] === outputFile.obj[i].keyWord) {
                        outputFile.obj.splice(i, 1);
                        break;
                    }
                }
            }
            if (keyArr.length === 2) {
                var breakFlag = false;
                for (var i = 0, len = outputFile.obj.length; i < len; i++) {
                    if (keyArr[0] === outputFile.obj[i].keyWord) {
                        for (var j = 0, lenj = outputFile.obj[i].children.length; j < lenj; j++) {
                            if (keyArr[1] === outputFile.obj[i].children[j].keyWord) {
                                outputFile.obj[i].children.splice(j, 1);
                                breakFlag = true;
                                break;
                            }
                        }
                    }
                    if (breakFlag === true) {
                        break;
                    }
                }
            }
        }
    } else {
        for (var newProperty in patchFile.obj.add) {
            outputFile.obj[newProperty] = patchFile.obj.add[newProperty];
        }
        for (var updateProperty in patchFile.obj.update) {
            outputFile.obj[updateProperty] = patchFile.obj.update[updateProperty].new;
        }
        for (var deleteProperty in patchFile.obj.remove) {
            delete outputFile.obj[deleteProperty];
        }
    }
    if (inputFile.ext === '.json') {
        fs.writeFile(outputFile.name, JSON.stringify(outputFile.obj, null, '  '));
    } else if (inputFile.ext === '.js') {
        outputFile.content = 'var cn_localization = ' + JSON.stringify(outputFile.obj, null, '  ') + ';';
        fs.writeFile(outputFile.name, outputFile.content);
    }
})();
