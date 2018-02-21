import { RouteHandler } from "../http/types/route";

export const AuthorizedGuard: RouteHandler = async function(req, res, next) {
    if (!req.data.authenticated) {
        res.status(401).json({code: 401, message: "401: Unauthorized."});
        return;
    }
    next();
}