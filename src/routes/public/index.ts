import { Route } from "../../http/types/route";

export = {
    opts: {
        path: "/",
        method: "get"
    },
    async handler(req, res) {
        res.render("index");
    }
} as Route;