import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { initializeAuth, validateToken, getTokenFromHeader } from "./auth";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const authConfig = {
  jwksUri:
    process.env.JWKS_URI || "https://your-auth-domain/.well-known/jwks.json",
  cacheEnabled: process.env.CACHE_ENABLED === "true",
  cacheMaxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || "5", 10),
  cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE || "3600", 10), // Default 3600 seconds (1 hour)
  algorithms: [process.env.ALGORITHMS || "RS256"],
  issuer: process.env.ISSUER || "https://your-auth-domain/",
  audience: process.env.AUDIENCE || "your_audience",
  tokenHeaderName: process.env.TOKEN_HEADER_NAME || "x-gw-token",
};

// Initialize the Auth module with the configuration
initializeAuth(authConfig);

// Endpoint to validate JWT token
app.get("/api/validate-token", async (req: Request, res: Response) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ error: "Token not provided" });
  }

  try {
    const decodedToken = await validateToken(token);
    console.log(decodedToken);
    res.status(200).json({ valid: true, decodedToken });
  } catch (error) {
    console.log("Error", error);
    res.status(401).json({ valid: false, error: error });
  }
});

app.get("/api/health", async (req: Request, res: Response) => {
  res.status(200).json("OK");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
