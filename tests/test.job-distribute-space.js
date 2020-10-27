const should             = require('should');
const path               = require('path');
const fs                 = require('fs');
const jobDistributeSpace = require('../jobs/distribute-space');

const dirDatasetTemp = path.join(__dirname, 'datasets', 'job-distribute-space', 'data-tmp');
const dirDataset     = path.join(__dirname, 'datasets', 'job-distribute-space', 'data');

describe('Job distribute-space', () => {

  before(() => {
    deleteFolderRecursiveSync(dirDatasetTemp);
    copyRecursiveSync(dirDataset, dirDatasetTemp);
  });

  after(() => {
    deleteFolderRecursiveSync(dirDataset);
    copyRecursiveSync(dirDatasetTemp, dirDataset);
    deleteFolderRecursiveSync(dirDatasetTemp);
  });

  it('should distribute files', done => {
    const config = require('./datasets/configs/job-distribute-space.json');
    config.FILES_DIRECTORY = dirDataset;
    jobDistributeSpace({ config }, () => {
      // Test distribution
      // container sample
      should(fs.existsSync(path.join(dirDataset, '100-101-201')), true);
      should(fs.existsSync(path.join(dirDataset, '100-101-201', 'sample')), true);
      should(fs.existsSync(path.join(dirDataset, '100-101-201', 'sample', 'ff54c9669c7907a95fc2db33b7763865dc214967182ad4709b9c6041eb26fd72.enc')), true);
      should(fs.existsSync(path.join(dirDataset, '100-101-201', 'sample', 'c54715843dffdc79ff6e174ac8f3f6ba4a2a0f2924dacddc58bbbb2b9189e30a.enc')), true);
      should(fs.existsSync(path.join(dirDataset, '100-101-201', 'sample', '5a6e6ef7d73e8bbfb880cbce950b6e2d41a7a604f87ebda36773417966aebcb2.enc')), true);
      // container test
      should(fs.existsSync(path.join(dirDataset, '100-101-201', 'test')), true);
      should(fs.existsSync(path.join(dirDataset, '100-101-201', 'sample', 'ff54c9669c7907a95fc2db33b7763865dc214967182ad4709b9c6041eb26fd72.enc')), true);
      should(fs.existsSync(path.join(dirDataset, '101-200-201')), true);
      should(fs.existsSync(path.join(dirDataset, '101-200-201', 'test')), true);
      should(fs.existsSync(path.join(dirDataset, '101-200-201', 'test', '7b5f8a62d29024b2eea957500ceccc4e93ff9ab4a305b0355dc39865adab45d7.enc')), true);
      should(fs.existsSync(path.join(dirDataset, '101-200-201', 'test', '7b5f8a62d29024b2eea957500ceccc4e93ff9ab4a305b0355dc39865adab45d7.enc')), true);

      // Test old distribution
      // container sample
      should(fs.existsSync(path.join(dirDataset, '100-101-200')), false);
      should(fs.existsSync(path.join(dirDataset, '100-101-200', 'sample')), false);
      should(fs.existsSync(path.join(dirDataset, '100-101-200', 'sample', 'c54715843dffdc79ff6e174ac8f3f6ba4a2a0f2924dacddc58bbbb2b9189e30a.enc')), false);
      should(fs.existsSync(path.join(dirDataset, '100-101-200', 'sample', '5a6e6ef7d73e8bbfb880cbce950b6e2d41a7a604f87ebda36773417966aebcb2.enc')), false);
      should(fs.existsSync(path.join(dirDataset, '100-200-201')), false);
      should(fs.existsSync(path.join(dirDataset, '100-200-201', 'sample')), false);
      should(fs.existsSync(path.join(dirDataset, '100-200-201', 'sample', 'ff54c9669c7907a95fc2db33b7763865dc214967182ad4709b9c6041eb26fd72.enc')), false);
      // container test
      should(fs.existsSync(path.join(dirDataset, '100-101-200', 'test')), false);
      should(fs.existsSync(path.join(dirDataset, '100-101-201', 'test', '7b5f8a62d29024b2eea957500ceccc4e93ff9ab4a305b0355dc39865adab45d7.enc')), false);
      should(fs.existsSync(path.join(dirDataset, '101-200-201', 'test')), false);
      should(fs.existsSync(path.join(dirDataset, '101-200-201', 'test', '7b5f8a62d29024b2eea957500ceccc4e93ff9ab4a305b0355dc39865adab45d7.enc')), false);
      should(fs.existsSync(path.join(dirDataset, '101-200-201', 'test', 'ff54c9669c7907a95fc2db33b7763865dc214967182ad4709b9c6041eb26fd72.enc')), false);
      done();
    });
  });

});

// https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
function copyRecursiveSync (src, dest) {
  var exists      = fs.existsSync(src);
  var stats       = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

function deleteFolderRecursiveSync (path) {
  var files = [];
  if( fs.existsSync(path) ) {
      files = fs.readdirSync(path);
      files.forEach(function(file){
          var curPath = path + "/" + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursiveSync(curPath);
          } else { // delete file
              fs.unlinkSync(curPath);
          }
      });
      fs.rmdirSync(path);
  }
};
