import { Router } from "express";

const baseV1Router = Router();

baseV1Router.use("/health", (req, res) => {
  res.status(200).json({ status: "Server is up and running!" });
});

export default baseV1Router;
