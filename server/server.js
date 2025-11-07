import https from "https";
import http from "http";
import fs from "fs";
import dotenv from "dotenv";
import app from "./app.js";
import express from "express";

dotenv.config();

app.use(express.json());

const PORT = process.env.PORT || 5000;
const HTTP_REDIRECT_PORT = 80; 

// SSL configuration 
const options = {
  key: fs.readFileSync("./ssl/privatekey.pem"),
  cert: fs.readFileSync("./ssl/certificate.pem")
};

// HTTP to HTTPS redirect app
const httpApp = express();
httpApp.use((req, res) => {
  const httpsUrl = `https://${req.headers.host.replace(/:80$/, `:${PORT}`)}${req.url}`;
  console.log(`Redirecting HTTP to HTTPS: ${httpsUrl}`);
  res.redirect(301, httpsUrl);
});

// Start HTTP server on port 80
// Start HTTP server on port 80
const httpServer = http.createServer(httpApp);

httpServer.listen(8080, 'localhost', () => {
  console.log('HTTP redirect server running on http://localhost:80');
});

// Start HTTPS server
https.createServer(options, app).listen(PORT, () => {
  console.log(`Secure backend running at https://localhost:${PORT}`);
});