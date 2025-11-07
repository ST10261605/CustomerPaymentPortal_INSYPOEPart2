import https from "https";
import fs from "fs";
import dotenv from "dotenv";
import app from "./app.js";
import express from "express";
import authRoutes from "./routes/authRoutes.js"; 
import paymentRoutes from "./routes/paymentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";

dotenv.config();

app.use(express.json());

//app.use("/api", authRoutes);
//app.use("/api/payment", paymentRoutes)
//app.use("/api/employee", employeeRoutes);


const PORT = process.env.PORT || 5000;

//SSL configuration 
const options = {
  key: fs.readFileSync("./ssl/privatekey.pem"),
  cert: fs.readFileSync("./ssl/certificate.pem")
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`Secure backend running at https://localhost:${PORT}`);
});