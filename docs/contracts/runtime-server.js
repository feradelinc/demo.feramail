require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const { Global: settings } = require("./support/global");
const sequelize = require("./config/db");
const { addHealthEndpoints, installGracefulShutdown, serviceReadiness } = require("./support/active-active");

const app = express();
const fileUpload = require("express-fileupload");
const { managedProductAccess } = require("./support/product-lifecycle");
const productLifecycleRouter = require("./routes/api/v1/internal/lifecycle");
const signatureOwnerRouter = require("./routes/api/v1/internal/signature-owner");

app.use(cors());
app.use(express.json({ limit: "50mb", verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); } }));
app.use(
  fileUpload({
    limits: {
      fileSize: 1048576 * 2
    },
    abortOnLimit: true,
  })
);
const health = addHealthEndpoints(app, {
  serviceName: "feradel.email.api",
    readinessCheck: serviceReadiness(sequelize),
});

const lifecycle = productLifecycleRouter({ productKey: "email", serviceName: "feradel.email.api", instanceType: "EM" });
app.use("/internal", lifecycle);
app.use("/api/v1/internal", lifecycle);
app.use("/api/v1/internal", signatureOwnerRouter);
app.use(managedProductAccess);

app.use("/api/configurations", require("./routes/api/v1/configuration"));
app.use("/api/templates", require("./routes/api/v1/template"));
app.use("/api/send", require("./routes/api/v1/send"));

app.use("/api/v1/configurations", require("./routes/api/v1/configuration"));
app.use("/api/v1/templates", require("./routes/api/v1/template"));
app.use("/api/v1/send", require("./routes/api/v1/send"));

async function start() {
  global.settings = new settings();
  await global.settings.load();

  const PORT = process.env.PORT || 10587;
  const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  installGracefulShutdown({ server, health, closeResources: [() => sequelize.close()] });
}

start().catch((error) => {
  console.error("Failed to start Email API server:", error);
  process.exit(1);
});
