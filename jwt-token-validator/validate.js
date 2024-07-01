const express = require("express");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const app = express();
const port = 6000;

const client = jwksClient({
  jwksUri: "https://example.com/.well-known/jwks.json",
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

app.get("/validate", (req, res) => {
  // const token = req.headers["authorization"]?.split(" ")[1];

  // if (!token) {
  //   return res.sendStatus(401);
  // }

  // jwt.verify(token, getKey, {}, (err, decoded) => {
  //   if (err) {
  //     return res.sendStatus(401);
  //   }
  //   res.sendStatus(200);
  // });

  console.log("TOKEN is validated !!!");
  res.status(200).send("The token is valid.");
});

app.listen(port, () => {
  console.log(`JWT Validator listening at http://localhost:${port}`);
});
