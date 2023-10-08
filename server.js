import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

app.use("/public", express.static(path.join(__dirname + "/public")));

app.use((_, res, next) => {
  res.append("Cross-Origin-Opener-Policy", "same-origin");
  res.append("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.listen(PORT, () => {
  console.log(`app runing at http://localhost:${PORT}`);
});
