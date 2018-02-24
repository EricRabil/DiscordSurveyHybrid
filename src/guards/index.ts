import { Config } from "../config";
import { logger } from "../util/logger";
import { RouteHandler } from "../http/types/route";

export const AuthorizedGuard: RouteHandler = async function(req, res, next) {
    if (!req.data.authenticated) {
        return res.status(401).json({code: 401, message: "401: Unauthorized."});
    }

    if (!req.data.user.inGuild()) return res.status(403).json({code: 403, message: "403: Not in required guild."});
    next();
}

export const CanSubmitGuard: RouteHandler = async function(req, res, next) {
    if (!(await req.data.user.canSubmit())) return res.status(403).json({code: 403, message: "403: Already responded."});
    next();
}