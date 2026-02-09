import { app, initializeApp, log } from "./app";
import { serveStatic } from "./static";
import { createServer } from "http";

(async () => {
  await initializeApp();

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const httpServer = createServer(app);
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
    return;
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const httpServer = createServer(app);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
