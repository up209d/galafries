'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
const config = require('./config');
const express = require('express');
const ngrok = require('ngrok');
const findFreePort = require('find-free-port');
// Initialize Express app
const app = express();
const port = 3333;
// Middleware for handling JSON requests
app.use(express.json());
// Middleware to parse URL-encoded bodies (if you need to handle forms)
app.use(express.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
  res.send({ status: 'ok' });
});
findFreePort(port, (err, freePort) => {
  if (err) {
    console.error('Error finding a free port:', err);
    return;
  }
  // Start the server on the available port
  app.listen(freePort, () =>
    __awaiter(void 0, void 0, void 0, function* () {
      console.log(`Server running on http://localhost:${freePort}`);
      // Start ngrok to expose the server
      try {
        const url = yield ngrok.connect({
          port: freePort,
          authtoken: config.NGROK_AUTH_TOKEN,
        });
        console.log(`Ngrok tunnel is live at ${url}`);
      } catch (error) {
        console.error('Error starting ngrok:', error);
      }
    }),
  );
});
