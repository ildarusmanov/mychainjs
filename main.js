const {Blockchain, Transaction} = require("./blockchain")
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privateKey = key.getPrivate('hex');
const myWalledAddr = publicKey;

const tx1 = new Transaction(myWalledAddr, 'public key goes here', 10);
tx1.signTransaction(key);

let coin = new Blockchain();
coin.addTransaction(tx1);

console.log("Mining block 1...");
coin.minePendingTransactions(myWalledAddr);
console.log("miner balance is = ", coin.getBalanceOfAddress(myWalledAddr));
