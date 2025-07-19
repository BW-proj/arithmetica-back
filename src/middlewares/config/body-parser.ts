import bodyParser from "body-parser";

export const bodyParserConfig = bodyParser.urlencoded({
  extended: true,
  limit: "5mb",
});
