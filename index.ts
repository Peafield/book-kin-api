import express from "express";
import type { Express, Request, Response } from "express";

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("This is a test of watch");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
