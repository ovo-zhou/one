import express from "express";

const app = express();
const port = process.env.PORT || 3002;

app.get("/", (_req, res) => {
  res.json({ message: "Hello from node-service!" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
