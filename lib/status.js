'use strict';

var Common = require('./common');
var strSupply;
var currBlock;
//GLOBAL Supply & Block Variables
function precisionRound(number, precision) {
        var factor = Math.pow(1, precision);
        return Math.round(number * factor) / factor;
}
function getSupply() {
var preSupply = (20374606.25); //supply as of block 283510
var supplyBlockNum = (283510);
var minedBlocks = currBlock - supplyBlockNum;
var coinsMined = minedBlocks * 1.5625; // appx # of blocks x block reward = coins coinsMined
var currSupply = preSupply + coinsMined; // total supply
strSupply = (precisionRound(currSupply, 1));
console.log('Current Block Height: ' + currBlock);
console.log('minedblocks: ' + minedBlocks);
console.log('Current Circulating Supply: ' + strSupply);
}setInterval(getSupply, 150000);

getSupply();


function StatusController(node) {
  this.node = node;
  this.common = new Common({log: this.node.log});
}

StatusController.prototype.show = function(req, res) {
  var self = this;
  var option = req.query.q;

  switch(option) {
  case 'getDifficulty':
    this.getDifficulty(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getTotalSupply':
    this.getTotalSupply(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getLastBlockHash':
    res.jsonp(this.getLastBlockHash());
    break;
  case 'getBestBlockHash':
    this.getBestBlockHash(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getInfo':
  default:
    this.getInfo(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp({
        info: result
      });
    });
  }
};

StatusController.prototype.getInfo = function(callback) {
  this.node.services.bitcoind.getInfo(function(err, result) {
    if (err) {
      return callback(err);
    }
    var info = {
      version: result.version,
      protocolversion: result.protocolVersion,
      blocks: result.blocks,
      timeoffset: result.timeOffset,
      connections: result.connections,
      proxy: result.proxy,
      difficulty: result.difficulty,
      testnet: result.testnet,
      relayfee: result.relayFee,
      errors: result.errors,
      network: result.network,
      current_supply: strSupply
    };
    currBlock = result.blocks;
    getSupply();

    callback(null, info);
  });
};

StatusController.prototype.getLastBlockHash = function() {
  var hash = this.node.services.bitcoind.tiphash;
  return {
    syncTipHash: hash,
    lastblockhash: hash
  };
};

StatusController.prototype.getBestBlockHash = function(callback) {
  this.node.services.bitcoind.getBestBlockHash(function(err, hash) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      bestblockhash: hash
    });
  });
};

StatusController.prototype.getDifficulty = function(callback) {
  this.node.services.bitcoind.getInfo(function(err, info) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      difficulty: info.difficulty
    });
  });
};
StatusController.prototype.getTotalSupply = function(callback) {
  this.node.services.bitcoind.getInfo(function(err, info) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      circulating_supply: strSupply
    });
  });
};

StatusController.prototype.sync = function(req, res) {
  var self = this;
  var status = 'syncing';

  this.node.services.bitcoind.isSynced(function(err, synced) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    if (synced) {
      status = 'finished';
    }

    self.node.services.bitcoind.syncPercentage(function(err, percentage) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      var info = {
        status: status,
        blockChainHeight: self.node.services.bitcoind.height,
        syncPercentage: Math.round(percentage),
        height: self.node.services.bitcoind.height,
        error: null,
        type: 'bitcore node'
      };

      currBlock = self.node.services.bitcoind.height;
      getSupply();
      res.jsonp(info);

    });

  });

};

// Hard coded to make insight ui happy, but not applicable
StatusController.prototype.peer = function(req, res) {
  res.jsonp({
    connected: true,
    host: '127.0.0.1',
    port: null
  });
};

StatusController.prototype.version = function(req, res) {
  var pjson = require('../package.json');
  res.jsonp({
    version: pjson.version
  });
};

module.exports = StatusController;
