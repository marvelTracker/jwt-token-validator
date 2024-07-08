import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { Auth } from "./auth"; // Assuming auth.ts handles JWT validation

dotenv.config();

const app = express();
const port = process.env.PORT || 6000;

const authConfig = {
  jwksUri:
    process.env.JWKS_URI || "https://your-auth-domain/.well-known/jwks.json",
  cacheEnabled: process.env.CACHE_ENABLED === "true",
  cacheMaxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || "5", 10),
  cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE || "3600", 10),
  algorithms: [process.env.ALGORITHMS || "RS256"],
  issuer: process.env.ISSUER || "https://your-auth-domain/",
  audience: process.env.AUDIENCE || "your_audience",
  tokenHeaderName: process.env.TOKEN_HEADER_NAME || "x-gw-token",
};

const auth = new Auth(authConfig);

// Endpoint to validate JWT token
app.get("/api/validate-token", async (req: Request, res: Response) => {
  console.log("Request in validator", req);
  const token = auth.getTokenFromHeader(req);
  if (!token) {
    console.log("Error", { error: "Token not provided" });
    return res.status(401).json({ error: "Token not provided" });
  }

  try {
    const decodedToken = await auth.validateToken(token);
    console.log(decodedToken);
    res.status(200).json({ valid: true, decodedToken });
  } catch (error) {
    console.log("Error", error);
    res.status(401).json({ valid: false, error: (error as Error).message });
  }
});

app.get("/api/health", async (req: Request, res: Response) => {
  res.status(200).json("OK");
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Token validator is running on http://localhost:${port}`);
});

export { app, server };
