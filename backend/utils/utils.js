var CryptoJS = require("crypto-js");

// Function to generate SHA256 hash of a string
function sha256(str) {
    return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
}

function respondError(req, res, apiError){
    const { jsonrpc, id } = req.body;
    return res.status(apiError.code).json({jsonrpc, id, apiError.message});
}

function respondOk(req, res, resp){
    const { jsonrpc, id } = req.body;
    return res.json({ jsonrpc, id, resp });
}
