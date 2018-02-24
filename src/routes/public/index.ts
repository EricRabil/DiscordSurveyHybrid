import { Route } from "../../http/types/route";

export = {
    opts: {
        path: "/",
        method: "get"
    },
    async handler(req, res) {
        if (req.data.authenticated) {
            if (!req.data.user.inGuild()) return res.status(403).render("unauthorized");
            if (!(await req.data.user.canSubmit())) return res.render("confirmation");
            return res.render("form");
        }
        else return res.render("login");
    }
} as Route;