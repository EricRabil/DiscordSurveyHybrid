import { Route } from "../../../http/types/route";
import { Config } from "../../../config";

export = [{
    opts: {
        method: "get",
        path: "/api/v0/form/elements"
    },
    handler(req, res) {
        res.json(Config.fields);
    }
} as Route];