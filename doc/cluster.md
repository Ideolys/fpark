# Cluster

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

## Region

As a standard, Fpark allows you to define regions. As a result, Fpark will try to replicate a file between different regions (according to `REPLICATION_NB_REPLICAS`)

A region is defined by `node.id`. By convention, a region is represented by a hundred (1XX, 2XX, 3XX, etc.). For instance, if a node has `id = 201`, the region is `2`, `id = 300` -> `3` and so on.

## Write & Read

Fpark serves files from its data storage (`config.FILES_DIRECTORY`) or from another Fpark instance if multiple instances are defined (`config.NODES`).

If only one Fpark instance is running (no `config.NODES` defined), files are saved in the current Fpark instance.

In multiple instances configuration, an uploaded file is saved on a certain amount of instances as defined by `config.REPLICATION_NB_REPLICAS`.

## Cluster & File replication

Fpark replicates files among a number of Fpark instances (`REPLICATION_NB_REPLICAS`). When a file is uploaded, Fpark:
1. determines the nodes to save the file to.
1. makes a hash of the filename (`HASH_ALGORITHM`, `HASH_SECRET`).
1. encrypts the content of the file with the filename (`ENCRYPTION_IV`, `ENCRYPTION_IV_LENGTH`, `ENCRYPTION_ALGORITHM`).
1. saves the file to the determined nodes.

When reading, Fpark:
1. determines where the file is stored.
1. decrypts the file
1. serves the file
