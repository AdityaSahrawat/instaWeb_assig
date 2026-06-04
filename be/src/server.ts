import "dotenv/config";

import { app } from "./app.js";

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`Lead Management CRM API running on port ${port}`);
});
