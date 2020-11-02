const package = require('../package.json');
const cluster = require('cluster');

const AGGREGATORS = {
  COUNT : {
    init : {
      start : 0
    },
    add : function (prevState) {
      if (!prevState) {
        prevState = { value : this.init.start };
      }
      if (prevState.value > Number.MAX_SAFE_INTEGER) {
        prevState = { value : this.init.start };
      }

      return { value : prevState.value + 1 };
    },
    getStartValue : function () {
      return { value : this.init.start };
    }
  },

  SUM : {
    init : {
      start : 0
    },
    add : function (prevState, value) {
      if (!prevState) {
        prevState = { value : this.init.start };
      }
      if (prevState.value > Number.MAX_SAFE_INTEGER) {
        prevState = { value : this.init.start };
      }
      return { value : prevState.value + (value || this.init.start) };
    },
    getStartValue : function () {
      return { value : this.init.start };
    }
  },

  AVG : {
    init : {
      start : 0,
      count : 0
    },
    add : function (prevState, value) {
      if (!prevState) {
        prevState = {
          value : this.init.start,
          count : this.init.count
        };
      }

      if (prevState.value > Number.MAX_SAFE_INTEGER || prevState.count > Number.MAX_SAFE_INTEGER) {
        prevState = {
          value : this.init.start,
          count : this.init.count
        };
      }

      if (!value) {
        value = 0;
      }

      prevState.count++;
      prevState.value += (value - prevState.value) / prevState.count;
      return prevState;
    },

    getStartValue : function () {
      return { value : this.init.start, count : this.init.count };
    }
  }
};

let COUNTERS = {};

/**
 * Get counter values
 * @returns {Array} [{ label : String, description : Object, value : * }]
 */
function getCounterValues () {
  let res = [];

  for (const counterKey in COUNTERS) {
    let counter = COUNTERS[counterKey];

    if (counter.counters) {
      for (const subCounterKey in counter.counters) {
        let subCounter = counter.counters[subCounterKey];

        let description = { ...counter.description, ...subCounter.description};

        res.push({
          description,
          label       : counter.label,
          value       : subCounter.value()
        });
      }

      continue;
    }

    res.push({
      label       : counter.label,
      description : counter.description,
      value       : counter.value()
    });
  }

  return res;
}

if (cluster.isMaster) {
  COUNTERS = {
    UPTIME : {
      label       : 'fpark_info_uptime',
      description : { version : package.version },
      value () {
        return process.uptime();
      }
    },

    REQUEST_DURATION_AVG_GET : {
      label       : 'fpark_requests_duration_milliseconds_persec_average',
      description : { method : 'GET' },
      agg         : 'AVG',
      aggValue    : AGGREGATORS.AVG.getStartValue(),
      value () {
        return this.aggValue.value;
      }
    },
    REQUEST_DURATION_AVG_PUT : {
      label       : 'fpark_requests_duration_milliseconds_persec_average',
      description : { method : 'PUT' },
      agg         : 'AVG',
      aggValue    : AGGREGATORS.AVG.getStartValue(),
      value () {
        return this.aggValue.value;
      }
    },
    REQUEST_DURATION_AVG_DEL : {
      label       : 'fpark_requests_duration_milliseconds_persec_average',
      description : { method : 'DEL' },
      agg         : 'AVG',
      aggValue    : AGGREGATORS.AVG.getStartValue(),
      value () {
        return this.aggValue.value;
      }
    },

    REQUEST_DURATION_GET : {
      label       : 'fpark_requests_duration_seconds_total',
      description : { method : 'GET' },
      agg         : 'SUM',
      aggValue    : AGGREGATORS.SUM.getStartValue(),
      value () {
        return this.aggValue.value / 1000;
      }
    },
    REQUEST_DURATION_PUT : {
      label       : 'fpark_requests_duration_seconds_total',
      description : { method : 'PUT' },
      agg         : 'SUM',
      aggValue    : AGGREGATORS.SUM.getStartValue(),
      value () {
        return this.aggValue.value / 1000;
      }
    },
    REQUEST_DURATION_DEL : {
      label       : 'fpark_requests_duration_seconds_total',
      description : { method : 'DEL' },
      agg         : 'SUM',
      aggValue    : AGGREGATORS.SUM.getStartValue(),
      value () {
        return this.aggValue.value / 1000;
      }
    },

    REQUEST_NUMBER_GET : {
      label       : 'fpark_requests_total',
      description : { method : 'GET' },
      counters    : {
        200 : {
          description : { code : 200 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        401 : {
          description : { code : 401 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        404 : {
          description : { code : 404 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        500 : {
          description : { code : 500 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        }
      }
    },
    REQUEST_NUMBER_PUT : {
      label       : 'fpark_requests_total',
      description : { method : 'PUT' },
      counters    : {
        200 : {
          description : { code : 200 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        401 : {
          description : { code : 401 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        404 : {
          description : { code : 404 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        500 : {
          description : { code : 500 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        }
      }
    },
    REQUEST_NUMBER_DEL : {
      label       : 'fpark_requests_total',
      description : { method : 'DEL' },
      counters    : {
        200 : {
          description : { code : 200 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        401 : {
          description : { code : 401 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        404 : {
          description : { code : 404 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        },
        500 : {
          description : { code : 500 },
          agg         : 'COUNT',
          aggValue    : AGGREGATORS.COUNT.getStartValue(),
          value () {
            return this.aggValue.value;
          }
        }
      }
    },

    FILES_COUNT : {
      label       : 'fpark_files_count_total',
      description : { type : 'reports' },
      agg         : 'COUNT',
      aggValue    : AGGREGATORS.COUNT.getStartValue(),
      value () {
        return this.aggValue.value;
      }
    },
  };

  setInterval(() => {
    COUNTERS.REQUEST_DURATION_AVG_GET.aggValue = AGGREGATORS.AVG.getStartValue();
    COUNTERS.REQUEST_DURATION_AVG_PUT.aggValue = AGGREGATORS.AVG.getStartValue();
    COUNTERS.REQUEST_DURATION_AVG_DEL.aggValue = AGGREGATORS.AVG.getStartValue();
  }, 1000);

  cluster.on('message', (worker, msg) => {
    if (!msg ) {
      return;
    }

    let statistics = getCounterValues();

    worker.send({
      value : statistics,
      uid   : msg.uid
    });
  });
}

if (cluster.isWorker === true) {
  process.on('message', data => {
    if (data && data.uid !== undefined && data.value) {
      let _callback = workerCallbackQueue[data.uid];

      if(_callback instanceof Function) {
        _callback(data.value);
      }

      delete workerCallbackQueue[data.uid];
    }
  });
}

let workerCallbackQueue   = {};
let workerCallbackQueueId = 0;

module.exports = {
  COUNTERS,

  COUNTER_NAMESPACES : {
      REQUEST_DURATION_AVG_GET : 'REQUEST_DURATION_AVG_GET'
    , REQUEST_DURATION_AVG_PUT : 'REQUEST_DURATION_AVG_PUT'
    , REQUEST_DURATION_AVG_DEL : 'REQUEST_DURATION_AVG_DEL'
    , REQUEST_DURATION_GET     : 'REQUEST_DURATION_GET'
    , REQUEST_DURATION_PUT     : 'REQUEST_DURATION_PUT'
    , REQUEST_DURATION_DEL     : 'REQUEST_DURATION_DEL'
    , REQUEST_NUMBER_GET       : 'REQUEST_NUMBER_GET'
    , REQUEST_NUMBER_PUT       : 'REQUEST_NUMBER_PUT'
    , REQUEST_NUMBER_DEL       : 'REQUEST_NUMBER_DEL'
    , FILES_COUNT              : 'FILES_COUNT'
  },

  /**
   * Update counter
   * @param {Object} object.counterId
   * @param {Object} object.subCounterId
   * @param {Object} object.value
   */
  update ({ counterId, subCounterId, value }) {
    let counter = COUNTERS[counterId];

    if (!counter) {
      return;
    }

    if (subCounterId && counter.counters) {
      counter = counter.counters[subCounterId];
    }

    if (!counter) {
      return;
    }

    counter.aggValue = AGGREGATORS[counter.agg].add(counter.aggValue, value);
  },

  /**
   * Get counter values
   * @param {Function} callback
   */
  getAll (callback) {
    if (cluster.isMaster) {
      return callback(getCounterValues());
    }

    workerCallbackQueueId++;
    if (workerCallbackQueueId > Number.MAX_SAFE_INTEGER ) {
      workerCallbackQueueId = 0;
    }

    workerCallbackQueue[workerCallbackQueueId] = callback;
    process.send({
      uid : workerCallbackQueueId
    });
  }
};
