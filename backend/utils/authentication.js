const { ethers } = require("hardhat");
const { recoverPersonalSignature } = require("@metamask/eth-sig-util");
const { bufferToHex } = require('ethereumjs-util');
const { consumeUUID } = require("./uuidTool");
const ApiError = require("../errors/ApiError");
const { getPublicKey, getNativeCurrency } = require("./utils");
const { logger } = require("./logger");

async function authenticate(req){
    { data, signature } = req.body;

    if(!data.address)return false;
//    const recoveredAddress = recoverPersonalSignature({ data, signature });
    const recoveredAddress = verifySignature(JSON.stringify(data), signature);
    return data.address.toLowerCase() === recoveredAddress.toLowerCase();
}

function verifySignature(message, signature) {
    const messageBufferHex = bufferToHex(Buffer.from(message, 'utf8'));
    const address = recoverPersonalSignature({
        data: messageBufferHex,
        sig: signature,
    });

    // Here, `address` is the recovered address from the signature
    // You can now compare it with the known address of the sender
    return address;
}

module.exports = {
    authenticate
}
