const express = require("express");
const router = express.Router();

const auth = require("../../../../middleware/auth");

const controller = require("./controller");

router.post("/", [auth], controller.createOrUpdate);
router.get("/", [auth], controller.get);
router.get("/n/:name", [auth], controller.get);
router.delete("/:uuid", [auth], controller.destroy);

module.exports = router;