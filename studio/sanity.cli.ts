import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "6xr0skfc",
    dataset: "production",
  },
  studioHost: "inkspilled-website",
  deployment: {
    appId: "tif9s0p920aq5jdmm82j2cxw",
    autoUpdates: true,
  },
});
