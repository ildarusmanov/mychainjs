const SHA256 = require("crypto-js/sha256")
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class Transaction {
  constructor(fromAddr, toAddr, amount) {
    this.fromAddr = fromAddr;
    this.toAddr = toAddr;
    this.amount = amount;
  }

  calculateHash() {
    return SHA256(this.fromAddr+this.toAddr+this.amount).toString();
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddr) {
      throw new Error("access error");
    }

    const hash = this.calculateHash();
    const sig = signingKey.sign(hash, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid() {
    if (this.fromAddr === null) {
      return true;
    }

    if (!this.signature || this.signature.length === 0) {
      throw new Error("no signature");
    }

    const publicKey = ec.keyFromPublic(this.fromAddr, 'hex');

    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, transactions, prevHash) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.prevHash = prevHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  hashData() {
    return this.timestamp +this.prevHash + JSON.stringify(this.transactions) + this.nonce;
  }

  calculateHash() {
    return SHA256(this.hashData()).toString();
  }

  mineBlock(difficulty) {
    while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log("block mined: " + this.hash);
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 10;
  }

  createGenesisBlock() {
    return new Block("01/01/2000", "Genesis block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length-1];
  }

  minePendingTransactions(miningRewardAddress) {
    let block = new Block(Date.now(), this.pendingTransactions);
    block.mineBlock(this.difficulty);

    console.log("block successfully mined!");

    this.chain.push(block);

    this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward)
    ];
  }

  addTransaction(t) {
    if (!t.fromAddr || !t.toAddr) {
      throw new Error('transaction must include from and to');
    }

    if (!t.isValid()) {
      throw new Error('can not add invalid transaction');
    }

    this.pendingTransactions.push(t)
  }
  getBalanceOfAddress(address) {
    let balance = 0;

    for (const b of this.chain) {
      for (const t of b.transactions) {
        if (t.fromAddr === address) {
          balance -= t.amount;
        }

        if (t.toAddr === address) {
          balance += t.amount;
        }
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i=1; i < this.chain.length; i++) {
      const currB = this.chain[i];
      const prevB = this.chain[i-1];

      if (currB.calculateHash() !== currB.hash) {
        return false;
      }

      if (currB.prevHash !== prevB.hash) {
        return false;
      }

      if (!currB.hasValidTransactions) {
        return false;
      }
    }

    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
