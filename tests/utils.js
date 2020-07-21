const path      = require('path');
const fs        = require('fs');
const spawn     = require('child_process').spawn;
const { queue } = require('../src/commons/utils');
const utils = require('../src/commons/utils');

const encryption = require('../src/commons/encryption');
const file       = require('../src/commons/file');
const { hash } = require('../src/commons/repartition');

let tempFolderPath = path.join(__dirname, '.temp');
let pidsFilePath   = path.join(tempFolderPath, 'pids');

function execute(params, dataset, callback){
  var _executionPath = path.join(__dirname, 'datasets', dataset);
  var _binary        = path.resolve(path.join(__dirname, '..', 'fpark'));

  program = spawn(_binary, params, { cwd : _executionPath, stdio : [ process.stdin, process.stdout, process.stderr, 'ipc' ] });
  program.on('error', err => {
    console.log(err);
  });

  setTimeout(callback, 400);

  fs.appendFileSync(pidsFilePath, program.pid + '\n', 'utf8');
}


function stopExecute(callback){
  killPreviousPids();

  setTimeout(callback, 800);
}

function prepareTempFolder () {
  if(!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath);
  }

  if(!fs.existsSync(pidsFilePath)) {
    fs.writeFileSync(pidsFilePath, '', 'utf8');
  }
}

function killPreviousPids () {
  prepareTempFolder();
  var pids = fs.readFileSync(pidsFilePath, 'utf8').split('\n');
  pids.forEach(function (pid) {
    if(pid !== ''){
      try{
        process.kill(pid);
      }
      catch(e){}
    }
  });
  fs.writeFileSync(pidsFilePath, '', 'utf8');
}

function deleteFolderRecursive (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

function runArchi (dataset, callback) {
  killPreviousPids();
  let nodes = [
      ['start', '-c', path.join('..', 'configs', '100.json')]
    , ['start', '-c', path.join('..', 'configs', '101.json')]
    , ['start', '-c', path.join('..', 'configs', '200.json')]
    , ['start', '-c', path.join('..', 'configs', '201.json')]
  ];

  utils.queue(nodes, (node, next) => {
    execute(node, dataset, next);
  }, callback);
}

function stopArchi (callback) {
  stopExecute(callback);
}

function getFileHash (str, secret) {
  let filename = file.getFileName(str, 16);
  return encryption.hash(filename, secret);
}

exports.execute               = execute;
exports.stopExecute           = stopExecute;
exports.deleteFolderRecursive = deleteFolderRecursive;
exports.getFileHash           = getFileHash;

exports.runArchi  = runArchi;
exports.stopArchi = stopArchi;

