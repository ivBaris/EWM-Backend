const express = require("express");
const { check } = require("express-validator");

const eventsControllers = require("../controllers/events-controllers");

const router = express.Router();

router.get("/:uid/created-events", eventsControllers.getCreadtedEventsByUserId);
router.get("/:uid/participant", eventsControllers.getParticipantEventByUserId);
router.get("/:uid", eventsControllers.getPotentialEventsByUserId);
router.get("/event/:eid", eventsControllers.getEventById);
router.put("/event/:eid", eventsControllers.addParticipation);
router.patch("/event/:eid", eventsControllers.removeParticipation);

router.post(
  "/",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  eventsControllers.createEvent
);

router.post("/notify", eventsControllers.pushNotification);

router.patch(
  "/event/:eid/edit",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  eventsControllers.updateEvent
);

router.delete("/event/:eid", eventsControllers.deleteEvent);

module.exports = router;
