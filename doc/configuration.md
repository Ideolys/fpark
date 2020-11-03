# Configuration

```js
{
  "ID"                      : null, // ID for the current instance
  "SERVER_PORT"             : 6000, // HTTP Server port
  "SERVER_CLUSTERS"         : 4,    // Number of workers to start, by default number of CPU cores
  "NODES"                   : [],   // Instances of Fpark, { ID : INT, host : String }; ex: [{ ID : 100, host : 'http://localhost:3000' }]
  "REPLICATION_NB_REPLICAS" : 3, // Default number of replcias for a new file
  "LOGS_DIRECTORY"          : "logs", // Relative path to logs
  "FILES_DIRECTORY"          : "data", // Relative path to data (ie files)
  "KEYS_DIRECTORY"          : "keys", // Relative path to where public keys are stored for PUT/DEL authorizations
  "IS_REGISTRATION_ENABLED" : true,  // Activate or Desactive container registration
  "IS_STATS_ENABLED"        : true,  // Activate or Desactive service statistics

  "ENCRYPTION_IV"        : "srp9zyldyxdzmddx", // Secret for encryption
  "ENCRYPTION_IV_LENGTH" : 16,                 // String for encryption key length
  "ENCRYPTION_ALGORITHM" : "aes-128-ctr",      // Encryption algorithm used

  "HASH_SECRET"    : "2VVqHZ2x2qr54GUa", // Secret for hash
  "HASH_ALGORITHM" : "sha256",           // Algorithm for hash

  "CACHE_CONTROL_MAX_AGE": 7776000, // Default max age for header cache control

  "IMAGE_COMPRESSION_LIMIT"       : 80, // Default comrpression for an image file
  "IMAGE_COMPRESSION_LIMIT_JPEG"  : 80, // Default comrpression for jpeg file
  "IMAGE_COMPRESSION_LIMIT_WEBP"  : 80, // Default compression for webp file
  "IMAGE_SIZE_DEFAULT_WIDTH"      : 1280, // Default max width of an image
  "IMAGE_SIZES"                   : {}, // Sizes for omage resizing { 'S' : { width : 200, height : 100 }, 'M' : ... }

  "MAX_FILE_SIZE" : 15000000 // Size limit for a file, default 15 Mo
}
```
