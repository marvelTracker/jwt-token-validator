const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/api/users" && req.method === "GET") {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ];

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(users));
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello, NGINX with JWT validation!\n");
  }
});

server.listen(4000, () => {
  console.log("Node.js server is running on http://localhost:4000");
});
