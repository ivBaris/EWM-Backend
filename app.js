const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const eventsRoutes = require("./routes/event-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const webpush = require("web-push");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE"
  );

  next();
});

app.use("/api/events", eventsRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 5000);
  res.json({ message: error.message || "An unknown error occurred!" });
});

webpush.setGCMAPIKey(process.env.GOOGLE_API_KEY);
webpush.setVapidDetails(
  "mailto: ibarisic.iv@gmail.com",
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.l8dzo.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
