const express = require("express");
const auth = require("../../../../middleware/auth");
const { ensureSharedSignEmailProfile } = require("../../../../support/shared-sign-email-profile");

const router = express.Router();

router.post("/signature-owner/provision", auth, async (_req, res) => {
  try {
    const result = await ensureSharedSignEmailProfile();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error?.status || 500).json({
      success: false,
      error: { code: error?.code || "shared_sign_email_profile_failed", message: error?.message || "The shared signing email profile could not be provisioned." },
    });
  }
});

module.exports = router;
