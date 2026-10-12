const express = require("express");
const router = express.Router();

const auth = require("../../../../middleware/auth");

const controller = require("./controller");

router.post("/", [auth], controller.send);
router.get("/preflight", [auth], controller.preflight);
router.get("/operations/:operationId", [auth], controller.receipt);

module.exports = router;
