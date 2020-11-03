
# API

## GET /c/:container/f/:filename

The url is **public**.

Get a file identified by `filename` from a container `container`.

`filename` is the complete name of the file : `fileId.extension`

Query options for the url are:
- `access_key` : access key to get a file for a container. It is mandatory. The key is given at the creation of the container (see Container creation).
- `size` : a valid size in `config.SIZES` to resize on the fly a file of type image.

## PUT /c/:container/f/:filename

Put a file with id `filename` to a container `container`.

A JsonWebToken token issued by `container` is required to perform the action. See Token section.

## DELETE /c/:container/f/:filename

Delete a file given by `filename` from a container `container`.

A JsonWebToken token issued by `container` is required to perform the action. See Token section.

## POST /node/register

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

## GET /node/stats

Get Fpark statistics.

Statistic                                             | Description
------------------------------------------------------|------------
`fpark_info_uptime`                                   | Number of seconds the process is running
`fpark_requests_duration_milliseconds_persec_average` | Average of request durations in milliseconds per second
`fpark_requests_duration_seconds_total`               | Sum of request durations in seconds
`fpark_requests_total`                                | Sum of number of requests
`fpark_files_count_total`                             | Count of reads & writes of files

Query option for the url is `format` wihch accepts the following values: `json`, `prometheus`.
