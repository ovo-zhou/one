async function sendTrace() {
  const res = await fetch(
    "https://pear-monitor.1m.app/tempo/otlp/v1/traces",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-protobuf",
        Authorization:
          "Basic " +
          Buffer.from(
            "d3a537cf8b77e43e1f3cff5ae65db83d8f79302d80be7535744e3ea05a1e44f1:"
          ).toString("base64"),
      },
      body: new Uint8Array([]),
    }
  );
  console.log("status:", res.status, await res.text());
}
sendTrace();

// import express from "express";

// const app = express();
// const port = process.env.PORT || 3002;

// app.get("/", (_req, res) => {
//   res.json({ message: "Hello from node-service!" });
// });

// app.get("/health", (_req, res) => {
//   res.json({ status: "ok" });
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
