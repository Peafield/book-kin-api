import type { Request, Response } from "express";

class TestController {
  public getTest(req: Request, res: Response): void {
    res.json({
      message: "Hello from TestController!",
      timestamp: new Date().toISOString(),
    });
  }
}

export default new TestController();
