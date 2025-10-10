import https from "https";
import fs from "fs";
import dotenv from "dotenv";
import app from "./app.js";
import express from "express";
import authRoutes from "./routes/authRoutes.js"; 
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/payment", paymentRoutes)

const PORT = process.env.PORT || 5000;

//SSL configuration 
const options = {
  key: fs.readFileSync("./ssl/privatekey.pem"),
  cert: fs.readFileSync("./ssl/certificate.pem")
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`Secure backend running at https://localhost:${PORT}`);
});

//app.listen(PORT, () => {
  //console.log(`Secure Backend running at http://localhost:${PORT}`);
//});