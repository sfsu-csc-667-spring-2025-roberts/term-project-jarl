import { QueryFile } from "pg-promise";
import path from "path";

export default {
  up: new QueryFile(
    path.join(__dirname, "1745000000000_password_reset_tokens.sql"),
  ),
  down: new QueryFile(
    path.join(__dirname, "1745000000000_password_reset_tokens_down.sql"),
  ),
};
