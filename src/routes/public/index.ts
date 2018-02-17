import { Route } from "../../http/types/route";
import { Config } from "../../config";

export = {
    opts: {
        path: "/",
        method: "get"
    },
    async handler(req, res) {
        if (!req.data.authenticated) {
            res.send("not logged in");
            return;
        }
        res.send("logged in");
    }
} as Route;