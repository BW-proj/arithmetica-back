import morgan from "morgan";
import fs from "fs";
import { appEnv } from "../../utils/env/app-env";

export const morganConfig = morgan("common", {
  stream: fs.createWriteStream(`${appEnv.logs.logs_path}/access.log`, {
    flags: "a",
  }),
});
