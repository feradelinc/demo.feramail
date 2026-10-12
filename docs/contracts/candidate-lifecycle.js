const express = require("express");
const {
  bodyEvent,
  createProductLifecycleReceiver,
  lifecycleHook,
} = require("../../../../support/product-lifecycle");

function productLifecycleRouter(options) {
  const router = express.Router();
  const receiver = createProductLifecycleReceiver(options);
  const receive = (expectedType = null) => async (req, res) => {
    let parsed = null;
    try {
      parsed = bodyEvent(req.body || {});
      if (expectedType && parsed.eventType !== expectedType) {
        return res.status(422).json({ success: false, error: { code: "lifecycle_event_mismatch", message: "Lifecycle event does not match this endpoint." } });
      }
      const result = await receiver.receive(req.body || {});
      return res.status(200).json(result);
    } catch (error) {
      if (parsed) {
        try {
          await receiver.acknowledge(parsed.data, parsed.eventType, {}, {
            code: error?.code || "product_lifecycle_failed",
            message: error?.message || "The product could not apply the lifecycle event.",
            retryable: ![400, 401, 403, 409, 422].includes(Number(error?.status || 500)),
          });
        } catch (_acknowledgmentError) {
          // The signed source event remains retryable when acknowledgment is unavailable.
        }
      }
      return res.status(error?.status || 500).json({
        success: false,
        error: { code: error?.code || "product_lifecycle_failed", message: error?.message || "Product lifecycle processing failed." },
      });
    }
  };

  router.post("/provisioning/license-product", lifecycleHook, receive("license.product.provisioning.requested"));
  router.post("/settings/license-product", lifecycleHook, receive("license.product.settings.updated"));
  router.post("/deprovisioning/license-product", lifecycleHook, receive("license.product.deprovisioning.requested"));
  router.post("/lifecycle/license-product", lifecycleHook, receive());
  return router;
}

module.exports = productLifecycleRouter;

