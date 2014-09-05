var fs = require('fs');
var path = require('path');
var program = require('commander');
program
    .version('0.0.1')
    .usage('firstFile secondFile outputFile')
    .option('-s, --special', 'special handling for cn_helps.json')
    .parse(process.argv);

function diffJSON() {
    if (program.args.length < 3) {
        console.log('缺少参数');
        return;
    }
    var firstFile = {
        name: program.args[0]
    };
    var secondFile = {
        name: program.args[1]
    };
    firstFile.ext   = path.extname(firstFile.name);
    secondFile.ext  = path.extname(secondFile.name);
    if (firstFile.ext !== '.json' && firstFile.ext !== '.js') {
        console.log(firstFile.name + '不是 .json 或者 .js 文件');
        return;
    }
    if (secondFile.ext !== '.json' && secondFile.ext !== '.js') {
        console.log(secondFile.name + '不是 .json 或者 .js 文件');
        return;
    }
    if (firstFile.ext === '.json') {
        var firstFileContent;
        try {
            firstFileContent = fs.readFileSync(firstFile.name, 'utf8');
        } catch(err) {
            console.log(firstFile.name + '读取错误');
            return;
        }
        try {
            firstFile.obj = JSON.parse(firstFileContent);
        } catch (err) {
            console.log(firstFile.name + ' JSON 解析错误');
            return;
        }
    } else if (firstFile.ext === '.js') {
        try {
            eval(fs.readFileSync(firstFile.name, 'utf8').toString());
            firstFile.obj = cn_localization;
        } catch(err) {
            console.log(firstFile.name + ' parse 失败');
            return;
        }
    }
    if (secondFile.ext === '.json') {
        var secondFileContent;
        try {
            secondFileContent = fs.readFileSync(secondFile.name, 'utf8');
        } catch(err) {
            console.log(secondFile.name + '读取错误');
            return;
        }
        try {
            secondFile.obj = JSON.parse(secondFileContent);
        } catch(err) {
            console.log(secondFile.name + ' JSON 解析错误');
            return;
        }
    } else if (secondFile.ext === '.js') {
        try {
            eval(fs.readFileSync(secondFile.name, 'utf8').toString());
            secondFile.obj = cn_localization;
        } catch(err) {
            console.log('第二个文件 require 失败');
            return;
        }
    }
    
    var result = {
        add: {},
        update: {},
        remove: {}
    };

    if (program.special === true) {
        firstFile.rebuildObj = {};
        firstFile.obj.forEach(function(lv1obj) {
            firstFile.rebuildObj[lv1obj.keyWord] = {};
            var rebuildLv1 = firstFile.rebuildObj[lv1obj.keyWord];
            rebuildLv1.name = lv1obj.name;
            rebuildLv1.children = {};
            lv1obj.children.forEach(function(lv2obj) {
                rebuildLv1.children[lv2obj.keyWord] = {};
                var rebuildLv2 = rebuildLv1.children[lv2obj.keyWord];
                rebuildLv2.name = lv2obj.name;
                rebuildLv2.description = lv2obj.description;
            });
        });
        secondFile.rebuildObj = {};
        secondFile.obj.forEach(function(lv1obj) {
            secondFile.rebuildObj[lv1obj.keyWord] = {};
            var rebuildLv1 = secondFile.rebuildObj[lv1obj.keyWord];
            rebuildLv1.name = lv1obj.name;
            rebuildLv1.children = {};
            lv1obj.children.forEach(function(lv2obj) {
                rebuildLv1.children[lv2obj.keyWord] = {};
                var rebuildLv2 = rebuildLv1.children[lv2obj.keyWord];
                rebuildLv2.name = lv2obj.name;
                rebuildLv2.description = lv2obj.description;
            });
        });
        for (var firstFileLv1KeyWord in firstFile.rebuildObj) {
            if (secondFile.rebuildObj[firstFileLv1KeyWord] === undefined) {
                result.remove[firstFileLv1KeyWord] = firstFile.rebuildObj[firstFileLv1KeyWord];
            }
        }
        for (var secondFileLv1KeyWord in secondFile.rebuildObj) {
            if (firstFile.rebuildObj[secondFileLv1KeyWord] === undefined) {
                result.add[secondFileLv1KeyWord] = secondFile.rebuildObj[secondFileLv1KeyWord];
            }
        }
        for (var firstFileLv1KeyWord in firstFile.rebuildObj) {
            if (result.add[firstFileLv1KeyWord] === undefined &&
                result.remove[firstFileLv1KeyWord] === undefined) {
                var firstlv1obj = firstFile.rebuildObj[firstFileLv1KeyWord];
                var secondlv1obj = secondFile.rebuildObj[firstFileLv1KeyWord];
                if (firstlv1obj.name !== secondlv1obj.name) {
                    var key = firstFileLv1KeyWord + '.name'
                    result.update[key] = {};
                    result.update[key].origin = firstlv1obj.name;
                    result.update[key].new = secondlv1obj.name;
                }
                var firstChildren = firstlv1obj.children;
                var secondChildren = secondlv1obj.children;
                for (var lv2name in firstChildren) {
                    if (secondChildren[lv2name] === undefined) {
                        result.remove[firstFileLv1KeyWord + '.' + lv2name] = firstChildren[lv2name];
                    }
                }
                for (var lv2name in secondChildren) {
                    if (firstChildren[lv2name] === undefined) {
                        result.add[firstFileLv1KeyWord + '.' + lv2name] = secondChildren[lv2name];
                    }
                }
                for (var lv2name in firstChildren) {
                    if (result.add[firstFileLv1KeyWord + '.' + lv2name] === undefined &&
                        result.remove[firstFileLv1KeyWord + '.' + lv2name] === undefined
                       ) {
                        if (firstChildren[lv2name].name !== secondChildren[lv2name].name) {
                            var key = firstFileLv1KeyWord + '.' + lv2name + '.name';
                            result.update[key] = {};
                            result.update[key].origin = firstChildren[lv2name].name;
                            result.update[key].new = secondChildren[lv2name].name;                            
                        }
                        if (firstChildren[lv2name].description !== secondChildren[lv2name].description) {
                            var key = firstFileLv1KeyWord + '.' + lv2name + '.description';
                            result.update[key] = {};
                            result.update[key].origin = firstChildren[lv2name].description;
                            result.update[key].new = secondChildren[lv2name].description;
                        }
                    }
                }
            }
        }
    } else {
        for (var key in firstFile.obj) {
            if (secondFile.obj[key] === undefined) {
                result.remove[key] = firstFile.obj[key];
            }
        }
        for (var key in secondFile.obj) {
            if (firstFile.obj[key] === undefined) {
                result.add[key] = secondFile.obj[key];            
            } else if (secondFile.obj[key] !== firstFile.obj[key]) {
                result.update[key] = {};
                result.update[key].origin = firstFile.obj[key];
                result.update[key].new = secondFile.obj[key];
            }
        }
    }
    var outputFileName = program.args[2];
    console.log('~~~~~~~~~~~~');
    fs.writeFileSync(outputFileName, JSON.stringify(result, null, '  '));
};
diffJSON();
