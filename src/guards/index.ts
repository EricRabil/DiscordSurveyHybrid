import { Config } from "../config";
import { RouteHandler } from "../http/types/route";

export const AuthorizedGuard: RouteHandler = async function(req, res, next) {
    if (!req.data.authenticated) {
        res.status(401).redirect("/login");
        return;
    }
    next();
}

// Depends on AuthorizedGuard being armed
export const InRequiredGuild: RouteHandler = async function(req, res, next) {
    if (!Config.auth.enforceGuildRequirement || !Config.auth.requiredGuild) next();
    if (!req.data.user.guilds) {
        return res.status(403).redirect("/unauthorized");
    }

    if (!req.data.user.guilds.includes(Config.auth.requiredGuild)) {
        return res.status(403).redirect("/unauthorized");
    }
    next();
}

export const CanSubmitGuard: RouteHandler = async function(req, res, next) {
    if (!(await req.data.user.canSubmit())) return res.redirect("/confirmation");
    next();
}