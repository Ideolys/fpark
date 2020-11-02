# Fpark

> File server

File server with batteries included :
  + Clusters
  + Containers
  + Authorization
  + Image compression
  + Image resizing on the fly
  + File encryption by design
  + File replication
  + Logger (included with rotation)

## Table of content

<!-- TOC -->

- [Fpark](#fpark)
  - [Table of content](#table-of-content)
  - [Installation](#installation)
    - [Node](#node)
    - [Systemd](#systemd)
  - [Usage](#usage)
    - [Configuration](#configuration)
    - [API](#api)
      - [GET /c/:container/f/:filename](#get-ccontainerffilename)
      - [PUT /c/:container/f/:filename](#put-ccontainerffilename)
      - [DELETE /c/:container/f/:filename](#delete-ccontainerffilename)
      - [POST /node/register](#post-noderegister)
      - [GET /node/stats](#get-nodestats)
    - [Token](#token)
  - [Multi-instances](#multi-instances)
    - [Region](#region)
    - [Write & Read](#write--read)
    - [Cluster & File replication](#cluster--file-replication)
    - [File encryption](#file-encryption)
  - [License](#license)

<!-- /TOC -->

## Installation

### Node

- Get the package

```
npm install fpark
```

- Create a config file

```
vi config.json
```

- Run

```
./fpark start -c config.json
```

### Systemd

- Install

```
 cd /tmp
 curl https://raw.githubusercontent.com/Ideolys/fpark/master/install.sh | sudo bash
```

## Usage

### Configuration

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
  "IS_REGISTRATION_ENABLED" : false,  // Activate or Desactive container registration

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

### API

#### GET /c/:container/f/:filename

The url is **public**.

Get a file identified by `filename` from a container `container`.

`filename` is the complete name of the file : `fileId.extension`

Query options for the url are:
- `access_key` : access key to get a file for a container. It is mandatory. The key is given at the creation of the container (see Container creation).
- `size` : a valid size in `config.SIZES` to resize on the fly a file of type image.

#### PUT /c/:container/f/:filename

Put a file with id `filename` to a container `container`.

A JsonWebToken token issued by `container` is required to perform the action. See Token section.

#### DELETE /c/:container/f/:filename

Delete a file given by `filename` from a container `container`.

A JsonWebToken token issued by `container` is required to perform the action. See Token section.

#### POST /node/register

Create a container.

The body must be a valid JSON object with :

```json
{
  "container" : "a unique key",
  "key"       : "public key",
  "accessKey" : "a key to access GET /file/:filename"
}
```

The url can be disabled with `IS_REGISTRATION_ENABLED`.

#### GET /node/stats

Get Fpark statistics.

Statistic                                             | Description
------------------------------------------------------|------------
`fpark_info_uptime`                                   | Number of seconds the process is running
`fpark_requests_duration_milliseconds_persec_average` | Average of request durations in milliseconds per second
`fpark_requests_duration_seconds_total`               | Sum of request durations in seconds
`fpark_requests_total`                                | Sum of number of requests
`fpark_files_count_total`                             | Count of reads & writes of files

Query option for the url is `format` wihch accepts the following values: `json`, `prometheus`.

### Token

Only the owner of a container can PUT and DELETE files. Make sure to always define the token as follows:

  1. Register a container by calling the API `POST /node/register` **or** put the public key of the container in the keys directory as `container.pub` where `container` is the name of the container to create and set an access key for the container in a file as `container.access_key`.
  1. Create a JsonWebToken token with the field `aud` equals to the registered `container`.
  1. Add the token in the header `authorization` as `Authorization: Bearer <token>`.

To disable container registration, set `IS_REGISTRATION_ENABLED` to `false` in the configuration.

## Multi-instances

To enable multi-instances & replication, you must define nodes in `config.NODES`. A node is a running Fpark instance.

A node is defined as:

```js
{
  "id"   : Number, // example: 100
  "host" : String  // example: "http://region1.fpark.fr"
}
```

Then, you are able to define the number of replicas for a file with `REPLICATION_NB_REPLICAS`.

Each instance of Fpark must share the same configuration in `NODES` configuration parameter.

### Region

As a standard, Fpark allows you to define regions. As a result, Fpark will try to replicate a file between different regions (according to `REPLICATION_NB_REPLICAS`)

A region is defined by `node.id`. By convention, a region is represented by a hundred (1XX, 2XX, 3XX, etc.). For instance, if a node has `id = 201`, the region is `2`, `id = 300` -> `3` and so on.

### Write & Read

Fpark serves files from its data storage (`config.FILES_DIRECTORY`) or from another Fpark instance if multiple instances are defined (`config.NODES`).

If only one Fpark instance is running (no `config.NODES` defined), files are saved in the current Fpark instance.

In multiple instances configuration, an uploaded file is saved on a certain amount of instances as defined by `config.REPLICATION_NB_REPLICAS`.

### Cluster & File replication

Fpark replicates files among a number of Fpark instances (`REPLICATION_NB_REPLICAS`). When a file is uploaded, Fpark:
1. determines the nodes to save the file to.
1. makes a hash of the filename (`HASH_ALGORITHM`, `HASH_SECRET`).
1. encrypts the content of the file with the filename (`ENCRYPTION_IV`, `ENCRYPTION_IV_LENGTH`, `ENCRYPTION_ALGORITHM`).
1. saves the file to the determined nodes.

When reading, Fpark:
1. determines where the file is stored.
1. decrypts the file
1. serves the file

### File encryption

All the files are encrypted by design. When posting a file to Fpark with `PUT /file/container/:containerId/:filename`, the parameter `filemname` is used to encrypt the content of the file.

The following config parameters allow you to customize encryption settings `"ENCRYPTION_IV", "ENCRYPTION_IV_LENGTH", "ENCRYPTION_ALGORITHM"`.

Internally, Fpark encrypts files with [`crypto.createCipheriv(algorithm, key, iv[, options])`](https://nodejs.org/api/crypto.html#crypto_crypto_createcipheriv_algorithm_key_iv_options).

The only way to decrypt a file is to know the filename **and** the `ENCRYPTION_IV`.

## License

Apache 2.0
