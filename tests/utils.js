const path      = require('path');
const fs        = require('fs');
const spawn     = require('child_process').spawn;
const { queue } = require('../src/commons/utils');
const jwt       = require('jsonwebtoken');

const encryption = require('../src/commons/encryption');
const file       = require('../src/commons/file');

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

function runArchi (dataset, nodes, callback) {
  if (typeof nodes === 'function') {
    callback = nodes;
    nodes    = [
        ['start', '-c', path.join('..', 'configs', '100.json')]
      , ['start', '-c', path.join('..', 'configs', '101.json')]
      , ['start', '-c', path.join('..', 'configs', '200.json')]
      , ['start', '-c', path.join('..', 'configs', '201.json')]
    ];
  }

  killPreviousPids();
  queue(nodes, (node, next) => {
    execute(node, dataset, next);
  }, callback);
}

function stopArchi (callback) {
  stopExecute(callback);
}

function getFileHash (str, secret) {
  return encryption.hash(str, secret);
}


function setJWTHeader (headers, containerId, keyPath) {
  let _token = jwt.sign(
    {
      iss : containerId,
      aud : containerId
    },
    fs.readFileSync(keyPath, 'utf8'),
    { algorithm : 'ES512' }
  );

  headers.authorization = 'Bearer ' + _token;
}

exports.execute               = execute;
exports.stopExecute           = stopExecute;
exports.deleteFolderRecursive = deleteFolderRecursive;
exports.getFileHash           = getFileHash;
exports.setJWTHeader          = setJWTHeader;

exports.runArchi  = runArchi;
exports.stopArchi = stopArchi;

