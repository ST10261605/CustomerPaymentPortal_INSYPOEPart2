import https from "https";
import http from "http";
import fs from "fs";
import dotenv from "dotenv";
import app from "./app.js";
import express from "express";

dotenv.config();

app.use(express.json());

const PORT = process.env.PORT || 5000;

//SSL configuration 
const options = {
  key: fs.readFileSync("./ssl/privatekey.pem"),
  cert: fs.readFileSync("./ssl/certificate.pem")
};

// HTTP to HTTPS redirect app
const httpApp = express();
httpApp.use((req, res) => {
  console.log(`Redirecting HTTP to HTTPS`);
  res.redirect(301, `https://localhost:${PORT}${req.url}`);
});

// Start HTTP server on port 8080 
const httpServer = http.createServer(httpApp);

httpServer.listen(80, 'localhost', () => {
  console.log('HTTP redirect server running on http://localhost:80');
});


https.createServer(options, app).listen(PORT, () => {
  console.log(`Secure backend running at https://localhost:${PORT}`);
});