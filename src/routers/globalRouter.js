import express from "express";
import {
  login,
  join,
  myPage,
  eventList,
  getMarkets,
} from "../controllers/globalControllers";
import { authMiddleWare } from "../middleWare";

const globalRouter = express.Router();

globalRouter.post("/login", login);
globalRouter.post("/join", join);
globalRouter.get("/mypage", authMiddleWare, myPage);
globalRouter.get("/event", eventList);
globalRouter.get("/markets", getMarkets);

export default globalRouter;
