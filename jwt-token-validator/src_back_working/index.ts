import express, { Request, Response } from "express";
//import bodyParser from "body-parser";
import { validateToken } from "./auth"; // Assuming auth.ts handles JWT validation
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const tokenHeaderName = process.env.TOKEN_HEADER_NAME || "x-gw-token";

console.log("tokenHeaderName", tokenHeaderName);

// Middleware to parse JSON body
//app.use(bodyParser.json());

// Middleware to extract token from custom header
function getTokenFromHeader(req: Request): string | undefined {
  const authHeader = req.header(tokenHeaderName);
  if (!authHeader) {
    return undefined;
  }
  const match = authHeader.match(/Bearer\s+(.+)/);
  if (match && match.length > 1) {
    return match[1];
  }
  return undefined;
}

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
