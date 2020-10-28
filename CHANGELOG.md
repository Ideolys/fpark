# Changelog

## v0.6.0
**2020-XX-XX**
  - Add route `GET /node/stats` to retrieve useful usage statistics (ie README).
  - **Breaking changes**:
    - File repartition has changed. Previously, repartition started from the filename modulo the number of replicas. Now, repartition starts from the hash of the filename modulo the number of nodes.

## v0.5.0
**2020-09-30**
 - Rename routes:
  + `GET /file/:filename/container/:container` to `GET /c/:container/f/:filename`
  + `PUT /file/:filename/container/:container` to `PUT /c/:container/f/:filename`
  + `DEL /file/:filename/container/:container` to `DEL /c/:container/f/:filename`
