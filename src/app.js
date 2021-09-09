require("dotenv").config();
import express from "express";
import globalRouter from "./routers/globalRouter";
import menuRouter from "./routers/menuRouter";
import aboutRouter from "./routers/aboutRouter";
import {
  getIcecream,
  getInstar,
  getInstarPic,
  getMarkets,
  handleGetEditIcecream,
  insertIcecream,
} from "./api";
import client from "./client";
import cors from "cors";
import { isRef } from "joi";

const app = express();

const whiteList = [
  "http://localhost:3000",
  "https://beskinrobbins.s3-website.ap-northeast-2.amazonaws.com",
  "http://beskinrobbins.s3-website.ap-northeast-2.amazonaws.com",
  "http://beskinrobbins.shop.s3-website.ap-northeast-2.amazonaws.com",
  "https://beskinrobbins.shop.s3-website.ap-northeast-2.amazonaws.com",
  "http://beskinrobbins.shop/",
  "https://beskinrobbins.shop/",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) >= 0 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("당신은 접근이 허용되지 않았습니다."));
    }
  },
};

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/menu", menuRouter);
app.use("/api", globalRouter);
app.use("/review", aboutRouter);

const port = process.env.PORT || 4000;

const getData = async () => {
  await client.instarPic.deleteMany({});
  await client.markets.deleteMany({});
  await client.hashTag.deleteMany({});
  await client.event.deleteMany({});
  await client.icecream.deleteMany({});
  await client.allergy.deleteMany({});

  const instarPic = await getInstarPic();
  const markets = await getMarkets();
  const data = await getInstar();

  for (let i of instarPic) {
    await client.instarPic.create({
      data: {
        url: i,
      },
    });
  }

  for (let i of markets) {
    const {
      operationtime,
      pointX,
      pointY,
      address1,
      address3,
      address2,
      address,
      name,
      tel,
    } = i;

    await client.markets.create({
      data: {
        operationtime,
        pointX,
        pointY,
        address1,
        address3,
        address2,
        address,
        name,
        tel,
      },
    });
  }

  for (let i of data) {
    const { content, time, imgUrl } = i;
    await client.event.create({ data: { content, time, imgUrl } });
  }

  const pages = [
    "http://www.baskinrobbins.co.kr/menu/list.php?top=A",
    "http://www.baskinrobbins.co.kr/menu/list.php?Page=2&top=A&sub=",
    "http://www.baskinrobbins.co.kr/menu/list.php?Page=3&top=A&sub=",
  ];

  for (let ice of pages) {
    const icecreams = await getIcecream(ice);
    for (let item of icecreams) {
      await insertIcecream(item.cate, item.title, item.imgUrl, item.hashtags);
    }
  }

  const editIcecream = await handleGetEditIcecream();

  for (let i of editIcecream) {
    const connectOrCreate = [];
    for (let a of i.alg) {
      connectOrCreate.push({
        where: {
          allergy: a,
        },
        create: {
          allergy: a,
        },
      });
    }

    const exist = await client.icecream.count({ where: { title: i.title } });
    if (exist) {
      await client.icecream.update({
        where: { title: i.title },
        data: {
          allergy: {
            connectOrCreate,
          },
        },
      });
    }
  }

  console.log(`Server is running on ${port}`);
};

app.listen(port, () => getData());
