const fs           = require('fs');
const path         = require('path');
const { pipeline } = require('stream');
const { proxy }    = require('fast-proxy')({});
const Busboy       = require('busboy');
const repartition  = require('../commons/repartition');
const utils        = require('../commons/utils');
const encryption   = require('../commons/encryption');
const file         = require('../commons/file');

const respond              = utils.respond;
const createDirIfNotExists = utils.createDirIfNotExists;

module.exports = function put (req, res, params, store) {
  let busboy = new Busboy({ headers: req.headers });

  busboy.on('file', (fieldname, fileStream, filename, encoding, mimetype) => {
    if (!filename) {
      fileStream.resume();
      return respond(res);
    }

    let nodes            = repartition.getNodesToPersistTo(params.id, store.CONFIG.NODES);
    let isAllowedToWrite = repartition.isCurrentNodeInPersistentNodes(nodes, store.CONFIG.ID);
    let keyNodes         = repartition.flattenNodes(nodes);

    if (!isAllowedToWrite) {
      return respond('Redirect');
    }

    let pathDisk = path.join(store.CONFIG.FILE_DIRECTORY, keyNodes);
    createDirIfNotExists(pathDisk, err => {
      if (err) {
        console.log('PUT ' + req.url, 'Cannot create container', err);
        return respond(res, 500);
      }

      let pathContainer = path.join(pathDisk, params.containerId);
      createDirIfNotExists(pathContainer, err => {
        if (err) {
          console.log('PUT ' + req.url, 'Cannot create container', err);
          return respond(res, 500);
        }

        let pathFile = path.join(pathContainer, params.id + '.enc');

        busboy.on('finish', () => {
          respond(res, 200);
        });

        pipeline(
          fileStream,
          encryption.encryptStream(
            file.getFileName(params.id, store.CONFIG.ENCRYPTION_IV_LENGTH),
            store.CONFIG.ENCRYPTION_IV,
            store.CONFIG.ENCRYPTION_ALGORITHM
          ),
          fs.createWriteStream(pathFile),
          err => {
            if (err) {
              return console.log('Write pipeline error', err);
            }

            respond(res, 500);
          }
        );
      });
    });
  });

  busboy.on('error' , () => {
    respond(res);
  });

  req.pipe(busboy);
}
