const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const webpush = require("web-push");

const HttpError = require("../models/http-error");
const Event = require("../models/event");
const User = require("../models/user");

const getCreadtedEventsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userEvents;
  try {
    userEvents = await User.findById(userId).populate("events");
  } catch (err) {
    const error = new HttpError("Event suche Fehlgeschlagen", 500);
    return next(error);
  }

  res.json({
    events: userEvents.events.map((event) => event.toObject({ getters: true })),
  });
};

const getParticipantEventByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let participateEvents;

  try {
    participateEvents = await Event.find({ participants: userId });
  } catch (err) {
    const error = new HttpError("Event suche Fehlgeschlagen", 500);
    return next(error);
  }

  res.json({
    participateEvents: participateEvents.map((event) =>
      event.toObject({ getters: true })
    ),
  });
};

const getPotentialEventsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let potentialEvents;

  try {
    potentialEvents = await Event.find({ potParticipants: userId });
  } catch (err) {
    const error = new HttpError("Event suche Fehlgeschlagen", 500);
    return next(error);
  }

  res.json({
    potentialEvents: potentialEvents.map((event) =>
      event.toObject({ getters: true })
    ),
  });
};

const getEventById = async (req, res, next) => {
  const eventId = req.params.eid;

  let event;

  try {
    event = await Event.findById(eventId).exec();
  } catch (err) {
    const error = new HttpError("Fehler, Event nicht gefunden", 500);
    return next(error);
  }

  if (!event) {
    const error = new HttpError(
      "Event mit der ID konnte nicht gefunden werden",
      404
    );
    return next(error);
  }

  res.json({ event: event.toObject({ getters: true }) });
};

const createEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Bitte überprüfe deine Eingabe", 422));
  }

  const {
    title,
    description,
    category,
    location,
    date,
    creatorId,
    potParticipants,
  } = req.body;

  const createdEvent = new Event({
    title,
    description,
    category,
    location,
    date,
    creatorId,
    image: "https://picsum.photos/200/300/?blur=2",
    potParticipants,
    participants: [],
  });

  let user;

  try {
    user = await User.findById(creatorId);
  } catch (err) {
    const error = new HttpError(
      "Event erstellen fehlgeschlagen, versuch es noch einaml",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Benutzer nicht gefunden", 404);
    return next(error);
  }

  try {
    const sessionStart = await mongoose.startSession();
    sessionStart.startTransaction();
    await createdEvent.save({ session: sessionStart });
    user.events.push(createdEvent);
    await user.save({ session: sessionStart });
    await sessionStart.commitTransaction();
  } catch (err) {
    const error = new HttpError("Erzeugung des Events ist fehlgeschlagen", 500);
    return next(error);
  }

  res.status(201).json({ event: createdEvent });
};

const pushNotification = async (req, res, next) => {
  const { title, subscription } = req.body;
  res.sendStatus(201);
  webpush
    .sendNotification(
      subscription,
      JSON.stringify({ title: title, body: "Event wurde erfolgreich erzeugt" })
    )
    .catch((e) => console.log(e.stack));
};

const updateEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Bitte überprüfe deine Eingabe", 422));
  }

  const { title, description, date, potParticipants } = req.body;
  const eventId = req.params.eid;

  let event;
  try {
    event = await Event.findById(eventId);
  } catch (err) {
    const error = new HttpError("Update Fehlgeschlagen", 500);
    return next(error);
  }

  event.title = title;
  event.description = description;
  event.date = date;
  event.potParticipants = potParticipants;

  try {
    await event.save();
  } catch (err) {
    const error = new HttpError("Update des Events ist fehlgeschlagen", 500);
    return next(error);
  }

  res.status(200).json({ event: event.toObject({ getters: true }) });
};

const addParticipation = async (req, res, next) => {
  const { participant } = req.body;
  const eventId = req.params.eid;

  let event;
  try {
    event = await Event.findById(eventId);
  } catch (err) {
    const error = new HttpError("Hat nicht funktioniert", 500);
    return next(error);
  }

  try {
    const sessionStart = await mongoose.startSession();
    sessionStart.startTransaction();
    event.participants.push(participant);
    event.potParticipants.pull(participant);
    await event.save();
    await sessionStart.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Participant hinzufügen ist fehlgeschlagen",
      500
    );
    return next(error);
  }

  res.status(200).json({ event: event.toObject({ getters: true }) });
};

const removeParticipation = async (req, res, next) => {
  const { participants } = req.body;
  const eventId = req.params.eid;

  let event;
  try {
    event = await Event.findById(eventId);
  } catch (err) {
    const error = new HttpError("Update Fehlgeschlagen", 500);
    return next(error);
  }

  event.participants.pull(participants);
  event.potParticipants.push(participants);

  try {
    await event.save();
  } catch (err) {
    const error = new HttpError("Update des Events ist fehlgeschlagen", 500);
    return next(error);
  }

  res.status(200).json({ event: event.toObject({ getters: true }) });
};

const deleteEvent = async (req, res, next) => {
  const eventId = req.params.eid;

  let event;
  try {
    event = await Event.findById(eventId).populate("creatorId");
  } catch (err) {
    const error = new HttpError("Event konnte nicht glöscht werden", 500);
    return next(error);
  }

  if (!event) {
    const error = new HttpError(
      "Event konnte für diese ID nicht gefunden werden",
      404
    );
    return next(error);
  }

  try {
    const sessionStart = await mongoose.startSession();
    sessionStart.startTransaction();
    await event.remove({ session: sessionStart });
    event.creatorId.events.pull(event);
    await event.creatorId.save({ session: sessionStart });
    await sessionStart.commitTransaction();
  } catch (err) {
    const error = new HttpError("Event konnte nicht glöscht werden", 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted place." });
};

exports.getCreadtedEventsByUserId = getCreadtedEventsByUserId;
exports.getParticipantEventByUserId = getParticipantEventByUserId;
exports.getPotentialEventsByUserId = getPotentialEventsByUserId;
exports.getEventById = getEventById;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.addParticipation = addParticipation;
exports.deleteEvent = deleteEvent;
exports.removeParticipation = removeParticipation;
exports.pushNotification = pushNotification;
