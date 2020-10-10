const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById({ _id: userId }).select("-password").exec();
  } catch (err) {
    const error = new HttpError("Benutzer nicht gefunden", 500);
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

const getFriends = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById({ _id: userId });
  } catch (err) {
    const error = new HttpError("Benutzer nicht gefunden", 500);
    return next(error);
  }

  const friends = user.friends;

  res.json({ friends: friends.toObject({ getters: true }) });
};

const updateFriendsList = async (req, res, next) => {
  const userId = req.params.uid;
  const { email } = req.body;

  let friend;
  try {
    friend = await User.findOne({ email: email }, "name email");
  } catch (err) {
    const error = new HttpError("Benutzer nicht gefunden", 500);
    return next(error);
  }

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Freund hinzufügen ist fehlgeschlagen", 500);
    return next(error);
  }

  const existingFriend = user.friends.find((e) => e.email === email);

  if (existingFriend) {
    const error = new HttpError(
      "Der Ntuzer exisistiert bereits in der Freundesliste",
      422
    );
    return next(error);
  }

  user.friends.push(friend);

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Freund hinzufügen ist fehlgeschlagen, Nutzer Exisitiert nicht oder Email falsch eingetragen",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const signup = async (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return next(new HttpError("Bitte überprüfe deine Eingabe", 422));
  }
  const { name, email, password } = req.body;

  let ewmUser;
  try {
    ewmUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Registrieren fehlgeschlagen, bitte versuch es später nochmal",
      500
    );
    return next(error);
  }

  if (ewmUser) {
    const error = new HttpError(
      "Der Benutzer exisistiert bereits, bitte logge dich ein",
      422
    );
    return next(error);
  }

  let passwordHash;
  try {
    passwordHash = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Der Benutzer konnte nicht erstellt werden",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: passwordHash,
    events: [],
    friends: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Registrieren fehlgeschlagen, versuchen Sie es noch einmal",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        friends: createdUser.friends,
      },
      process.env.JWT,
      { expiresIn: "2 days" }
    );
  } catch (err) {
    const error = new HttpError(
      "Fehlgeschlagen bitte versuche es später nocheinmal",
      500
    );
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    name: createdUser.name,
    friends: createdUser.friends,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    ewmUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Login Fehlgeschlagen, bitte versuche es erneut",
      500
    );
    return next(error);
  }

  if (!ewmUser) {
    const error = new HttpError(
      "Bitte überprüfe deine Eingabe (Daten sind nicht Valide)",
      401
    );
    return next(error);
  }

  let isPassword = false;
  try {
    isPassword = await bcrypt.compare(password, ewmUser.password);
  } catch (err) {
    const error = new HttpError("Bitte überprüfe deine Eingabe", 500);
    return next(error);
  }

  if (!isPassword) {
    const error = new HttpError(
      "Bitte überprüfe deine Eingabe (Daten sind nicht Valide)",
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: ewmUser.id,
        email: ewmUser.email,
        name: ewmUser.name,
        friends: ewmUser.friends,
      },
      process.env.JWT,
      { expiresIn: "2 days" }
    );
  } catch (err) {
    const error = new HttpError(
      "Fehlgeschlagen bitte versuche es später nocheinmal",
      500
    );
    return next(error);
  }

  res.status(201).json({
    userId: ewmUser.id,
    email: ewmUser.email,
    name: ewmUser.name,
    friends: ewmUser.friends,
    token: token,
  });
};

exports.getUserById = getUserById;
exports.getFriends = getFriends;
exports.updateFriendsList = updateFriendsList;
exports.signup = signup;
exports.login = login;
