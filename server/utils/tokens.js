// utils/tokens.js
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import RefreshToken from "../models/RefreshToken.js";
import dotenv from "dotenv";
dotenv.config();

export const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const createRefreshToken = async ({ userId, role }) => {
  const jti = randomBytes(16).toString("hex");
  const payload = { userId, role, jti };
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

  await RefreshToken.create({
    userId,
    tokenId: jti,
    expiresAt: Date.now() + 7 * 24 * 3600 * 1000
  });

  return { refreshToken, jti };
};

export const revokeRefreshToken = async (jti) => {
  await RefreshToken.updateOne({ tokenId: jti }, { $set: { revoked: true } });
};

export const isRefreshTokenValid = async (jti) => {
  const tokenDoc = await RefreshToken.findOne({ tokenId: jti });
  if (!tokenDoc) return false;
  if (tokenDoc.revoked) return false;
  if (tokenDoc.expiresAt && tokenDoc.expiresAt < Date.now()) return false;
  return true;
};
