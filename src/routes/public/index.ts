import { Route } from "../../http/types/route";
import { Config } from "../../config";

export = {
    opts: {
        path: "/",
        method: "get"
    },
    async handler(req, res) {
        if (!req.data.authenticated) {
            res.redirect(Config.auth.authURL);
            return;
        }
        res.render("index");
    }
} as Route;