# Update cluster space

A cluster is the representation of all fpark instances declared in config file by attribute `NODES`.

The total amount of space in the cluster can be altered by :
  - adding node(s)
  - removing node(s)

It is your responsability to redistributes files among the cluster. But no worry, some tools will help you.

**Recommendations**:
  - Prefer to always have the same amount of storage by instance.
  - Add or remove the same amount of nodes (if regions).

## 1. Declare old configuration

Before altering `NODES` configuration. Copy/Pase `NODES` value in new attribute `OLD_NODES`.

**Example**

Old configuration:

```json
{
  "NODES" : [
    { "id" : 100, localhost : "http://localhost:3000" },
    { "id" : 200, localhost : "http://localhost:4000" }
  ]
}
```

New configuration (we add two nodes 101 and 201):

```json
{
  "NODES" : [
    { "id" : 100, localhost : "http://localhost:3000" },
    { "id" : 101, localhost : "http://localhost:3001" },
    { "id" : 200, localhost : "http://localhost:4000" },
    { "id" : 201, localhost : "http://localhost:4001" }
  ],
  "OLD_NODES" : [
    { "id" : 100, localhost : "http://localhost:3000" },
    { "id" : 200, localhost : "http://localhost:4000" }
  ]
}
```

## 2. Run distribute job

A CLI command is defined to redistribute files. File redistribution will reorganize files among the new configuration.


```batch
./fpark run distribute-space
```

**Example**

Before running the command, we assume that we have two files `file.txt` and `image.jpg` and we replicate a file two times among the cluster (`REPLICATION_NB_REPLICAS`).

```
- fpark_files
  |- 100-200
    |- file.txt
    |- image.jpg

```

After the command, the data will look like:

```
- fpark_files
  |- 100-200
    |- file.txt
  |- 101-201
    |- image.jpg
```

## 3. RSYNC

It is possible that some files that were previously owned by a node will not be the case after the command. In this case, the command will list a serie of `rsync` commands in order to move files to the correct node(s).
