import { clerkMiddleware } from "@clerk/express";
import "express-async-errors";
import express from "express";
import cors from "cors";
import { clerkAuth } from "./middleware/auth";
import { groupsRouter } from "./routes/groups";

const app = express();
app.use(clerkMiddleware());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(clerkAuth); // attaches auth state; requireAuth (per-route) enforces it
app.use("/api/groups", groupsRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal error" });
});

app.listen(process.env.PORT || 4000, () => console.log("Kolo API running"));