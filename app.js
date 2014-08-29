var fs = require('fs');
var express = require('express');
var app = express();
var multer = require('multer');
var spawn = require('child_process').spawn;

app.use(multer({
    dest: './public/uploads/',
    rename: function(fieldname, filename) {
        var now = new Date();
        return now.getFullYear() + '-' +
            (now.getMonth() + 1) + '-' +
            now.getDate() + '_' +
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
        res.send('some error happened');
    });
    worker.on('close', function (code) {
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
        res.send('some error happened');
    });
    worker.on('close', function (code) {
        console.log('child process exited with code ' + code);
        res.render('download', { path: '/downloads/diff_json/diff.json' });
    });
});

app.listen(3000);

