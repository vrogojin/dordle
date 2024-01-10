/* Requirements */
const express = require("express");
require("express-async-errors"); // NOTE always this import before routes. Import here for safety.
const helmet = require("helmet");
const https = require("https");
const http = require("http");
const fs = require("fs");
const app = express();
const cors = require("cors");
const { errorHandler } = require("./errors/errorHandler");
const { authenticate } = require("./utils/authentication");
const ApiError = require("./errors/ApiError");
const { logger, logResp } = require("./utils/logger");

const { sigAuthEnabled, isHttps, loggerLevel } = parseCLI();
logger.level = loggerLevel;

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(validateInputs);

/* Routers */
app.use("/", require("./routes/game_man.js"));

/* Handlers */
app.use(errorHandler);
app.use(logResp);

if (isHttps) {
  const httpsOptions = {
    key: fs.readFileSync("./.ssl/privkey.pem"),
    cert: fs.readFileSync("./.ssl/fullchain.pem"),
  };
  https.createServer(httpsOptions, app).listen(443);
} else {
  http.createServer(app).listen(80);
}

/*function logIncoming(req, res, next) {
  logger.trace(
     {
       URL: req.originalUrl,
       PARAMS: req.query,
       BODY: req.body,
     }
    );
  next();
}*/

async function validateInputs(req, res, next) {
  if (!sigAuthEnabled) next();
  else if (await authenticate(req)) {
    next();
  } else {
    throw ApiError.unauthorized("Invalid signature");
  }
}

// Scan CLI args and configure
function parseCLI() {
  let sigAuthEnabled = true;
  let isHttps = true;
  let loggerLevel = "trace";
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === "--disable_sig_auth") {
      sigAuthEnabled = false;
      logger.info("Authentication by signature disabled");
    }
    if (process.argv[i] === "--http") {
      isHttps = false;
      logger.info("Using HTTP connection");
    }
    const [param, value] = process.argv[i].split("=");
    if (param === "--set_trusted_holder") {
      const [nft_addr, holder_addr] = value.split(":");
      setTrustedHolder(nft_addr, holder_addr);
    }
  }
  return { sigAuthEnabled, isHttps, loggerLevel };
}
