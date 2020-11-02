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

### Documentation

Find answers in [documentation](./doc/README.md)

## License

Apache 2.0
