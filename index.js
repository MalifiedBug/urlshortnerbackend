import { MongoClient } from "mongodb";
import cors from "cors";
// const express = require("express"); // "type": "commonjs"
import express, { response } from "express"; // "type": "module"
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import mongoose from "mongoose";
import { nanoid } from "nanoid";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;
const BASE = "http://localhost:4000";
const MONGO_URL = process.env.MONGO_URL;

async function MongoConnect() {
  const client = await new MongoClient(MONGO_URL).connect();
  console.log("Mongo Connected");
  return client;
}

const client = await MongoConnect();

app.use(cors())

app.get("/", function (request, response) {
  response.send("🙋‍♂️ URL shortener");
});

app.post("/short", async (req, res) => {
  const full = req.body.full;
  const found = await client
    .db("UrlShortner")
    .collection("urls")
    .findOne({ full: full });
  if (found) {
    res.send(found);
  } else {
    const id = nanoid(4);
    const short = `${id}`;
    const insert = await client
      .db("UrlShortner")
      .collection("urls")
      .insertOne({ full: req.body.full, short: short, count: 0 });
    res.send({insert:insert,short:short,full:full,count:0});
  }
});

app.get("/:shortUrl", async (req, res) => {
  const short = req.params.shortUrl;
  const found = await client
    .db("UrlShortner")
    .collection("urls")
    .findOne({ short: short });
  if (found) {
    res.redirect(`${found.full.lourl}`);
    await client
      .db("UrlShortner")
      .collection("urls")
      .updateOne({ short: short }, { $inc: { count: 1 } });
  } else {
    res.status(404).send({ msg: "not found" });
  }
});

app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
