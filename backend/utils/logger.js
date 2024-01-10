
const logger = pino({
  level: 'info', // You can set the logging level here
});

const logResp = (req, res next)  => {
  const originalSend = res.send;
  
  res.send = function (body) {
    logger.info({
      res: {
        statusCode: res.statusCode,
        body: body
      }
    }, 'Response log');
    originalSend.call(this, body);
  };

  next();
});

module.exports = { logger, logResp }
