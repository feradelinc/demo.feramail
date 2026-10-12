const express = require("express");
const router = express.Router();

const auth = require("../../../../middleware/auth");

const controller = require("./controller");

router.post("/", [auth], controller.createOrUpdate);
router.post("/r/i/:uuid", [auth], controller.register);
router.get("/n/:named/o/:owner/f/:fields", [auth], controller.search);
router.get("/g", [auth], controller.global);
router.get("/", [auth], controller.get);
router.get("/:uuid", [auth], controller.get);
router.delete("/:uuid", [auth], controller.destroy);

module.exports = router;
