# Changelog

## v0.6.7
*2021-01-27*
 - Increase JWT cache.
 - Replace uid generation.

## v0.6.6
*2021-01-27*
  - Add dependency `kitten-jwt` for jwt management.

## v0.6.5
*2021-01-27*
 - Inter-communication between master / workers was incorrect.

## v0.6.4
*2021-01-27*
 - Add logs for auth (when it is in error).

## v0.6.3
*2021-01-21*
  - The service crashed when getting a file with non ASCII chars in filename.

## v0.6.2
*2021-01-14*
  - Stats were not computed cluster mode.

## v0.6.1
*2020-11-17*
  - Set open metrics as default format for route `GET /node/stats`.

## v0.6.0
**2020-11-03**
  - Add route `GET /node/stats` to retrieve useful usage statistics (ie README).
  - Add `./fpark run <job>`. Execute arbitrary job. Only `distribute-space` is defined in order to redistribute files among Fpark instances after `config.NODES` update.
  - Add `./fpark whereis <filename> ` to know what a file will look like in Fpark.
  - **Breaking changes**:
    - File repartition has changed. Previously, repartition started from the filename modulo the number of replicas. Now, repartition starts from the hash of the filename modulo the number of nodes.

## v0.5.0
**2020-09-30**
 - Rename routes:
  + `GET /file/:filename/container/:container` to `GET /c/:container/f/:filename`
  + `PUT /file/:filename/container/:container` to `PUT /c/:container/f/:filename`
  + `DEL /file/:filename/container/:container` to `DEL /c/:container/f/:filename`
