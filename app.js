var fs = require('fs');
var express = require('express');
var app = express();
var multer = require('multer');
var spawn = require('child_process').spawn;

// TODO: add request lock

app.use(multer({
    dest: './public/uploads/',
    rename: function(fieldname, filename) {
        var now = new Date();
        return now.toISOString() + '_' +
            filename.replace(/\W+/g, '-').toLowerCase();
    }
}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    res.render('index');
});
app.get('/xlsx_extract_json', function(req, res) {
    res.render('xlsx_extract_json');
});
app.get('/diff_json', function(req, res) {
    res.render('diff_json');
});
app.get('/find_xlsx_blank', function(req, res) {
    res.render('find_xlsx_blank');
});
app.get('/xlsx_patch_json', function(req, res) {
    res.render('xlsx_patch_json');
});

app.post('/upload_xlsx_for_extracting_json', function(req, res) {
    var xlsx = req.files.xlsx;
    if (!xlsx) {
        res.send('缺少参数');
        return;
    }
    var workerScript = __dirname + '/tools/xlsx_extract_json/xlsx2json.js';
    var xlsxPath = __dirname + '/' + xlsx.path;
    var destinationPath = __dirname + '/public/downloads/xlsx_extract_json/';
    var worker = spawn('node', [workerScript, xlsxPath, destinationPath]);
    worker.stdout.on('data', function(data) {
        console.log('' + data);
    });
    worker.stderr.on('data', function(data) {
        console.log('' + data);
        res.send('some error happened: ' + data);
    });
    worker.on('close', function(code) {
        console.log('child process exited with code ' + code);
        var filesObj = {};
        var folders = fs.readdirSync(destinationPath);
        folders.forEach(function(folderName) {
            filesObj[folderName] = fs.readdirSync(destinationPath + folderName).map(function(filename) {
                return {
                    name: filename,
                    path: '/downloads/xlsx_extract_json/' + folderName + '/' + filename
                };
            });
        });
        res.render('download_extract_json', { folderFiles: filesObj });
    });
});
app.post('/upload_json_to_diff', function(req, res) {
    var file1 = req.files.file1;
    var file2 = req.files.file2;
    if (!file1 || !file2) {
        res.send('缺少参数');
        return;
    }
    var workerScript = __dirname + '/tools/diff_json/diffJSON.js';
    var file1path = __dirname + '/' + file1.path;
    var file2path = __dirname + '/' + file2.path;
    var destinationPath = __dirname + '/public/downloads/diff_json/diff.json';
    var worker = spawn('node', [workerScript, file1path, file2path, destinationPath]);
    worker.stdout.on('data', function(data) {
        console.log('' + data);
    });
    worker.stderr.on('data', function(data) {
        console.log('' + data);
        res.send('some error happened: ' + data);
    });
    worker.on('close', function(code) {
        console.log('child process exited with code ' + code);
        res.render('download', { path: '/downloads/diff_json/diff.json' });
    });
});
app.post('/upload_xlsx_to_find_blank', function(req, res) {
    var xlsx   = req.files.xlsx;
    var sheet  = req.param('sheet');
    var origin = req.param('origin');
    var target = req.param('target');
    if (!xlsx || !origin || !target || !sheet) {
        res.send('缺少参数');
        return;
    }
    var workerScript = __dirname + '/tools/xlsx_find_blank/xlsx_find_blank.js';
    var xlsxPath = __dirname + '/' + xlsx.path;
    var destinationPath = __dirname + '/public/downloads/xlsx_find_blank/untranslated.json';
    var worker = spawn('node', [workerScript, xlsxPath, destinationPath, origin, target, sheet]);
    worker.stdout.on('data', function(data) {
        console.log('' + data);
    });
    worker.stderr.on('data', function(data) {
        console.log('' + data);
        res.send('some error happened: ' + data);
    });
    worker.on('close', function(code) {
        console.log('child process exited with code ' + code);
        res.render('download', { path: '/downloads/xlsx_find_blank/untranslated.json' });
    });
});
app.post('/upload_xlsx_and_json_to_patch', function(req, res) {
    var xlsx   = req.files.xlsx;
    var json   = req.files.json;
    var sheet  = req.param('sheet');
    var target = req.param('target');
    if (!xlsx || !sheet || !target) {
        res.send('缺少参数');
        return;
    }
    var workerScript = __dirname + '/tools/xlsx_patch_json/xlsx_patch_json.js';
    var xlsxPath = __dirname + '/' + xlsx.path;
    var jsonPath = __dirname + '/' + json.path;
    var destinationPath = __dirname + '/public/downloads/xlsx_patch_json/' + xlsx.originalname;
    var worker = spawn('node', [workerScript, xlsxPath, jsonPath, destinationPath, sheet, target]);
    worker.stdout.on('data', function(data) {
        console.log('' + data);
    });
    worker.stderr.on('data', function(data) {
        console.log('' + data);
        res.send('some error happened: ' + data);
    });
    worker.on('close', function(code) {
        console.log('child process exited with code ' + code);
        res.render('download', { path: '/downloads/xlsx_patch_json/' + xlsx.originalname});
    });
});

app.listen(3000, function() {
    console.log('listen on 3000...');
});
