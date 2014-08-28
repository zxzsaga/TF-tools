var express = require('express');
var app = express();
var multer  = require('multer');
var spawn = require('child_process').spawn;

app.use(multer({
    dest: './public/uploads/'
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

app.get('/result', function(req, res) {
    res.render('result');
});
app.get('/action', function(req, res) {
    var worker = spawn('node', ['worker.js']);
    /*worker.stdout.on('data', function(data) {
        console.log('' + data);
    });
    */
    res.send('kkkkkkkkkkkko');
});

app.post('/upload_xlsx_for_extracting_json', function(req, res) {
    console.log(req.files);
    res.send('res');
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
    var destinationPath = __dirname + '/public/downloads/diff.json';
    var worker = spawn('node', [workerScript, file1path, file2path, destinationPath]);
    worker.stdout.on('data', function(data) {
        console.log('' + data);
    });
    worker.stderr.on('data', function(data) {
        // console.log('' + data);
        res.send('some error happened');
    });
    worker.on('close', function (code) {
        console.log('child process exited with code ' + code);
        res.render('download', { path: '/downloads/diff.json' });
    });
});

app.listen(3000);

