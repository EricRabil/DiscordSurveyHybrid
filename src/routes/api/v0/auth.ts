import { Route } from "../../../http/types/route";
import { Framework } from "../../..";
import { Config } from "../../../config";
import * as rp from "request-promise";
import { inspect } from "util";
import { User } from "../../../db/entities/User";
import { AuthorizedGuard } from "../../../guards";
import { AboutMeRequest, UserMetadata } from "../../../http/types/api";

interface AuthentiationGrant {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

export = [
    {
        opts: {
            method: "get",
            path: "/api/v0/auth/login"
        },
        async handler(req, res) {
            const {code} = req.query;
            if (!code) {
                return res.status(401).json({code: 40001, message: "Invalid authorization code"});
            }
            const tokenRequest = {
                client_id: Framework.client.client.user.id,
                client_secret: Config.bot.secret,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: `${req.protocol}://${req.headers.host}${((req as any)._parsedUrl as URL).pathname}`
            };
            
            const tokenRequestEncoded = Object.keys(tokenRequest).reduce((master, current) => master + (master.length === 0 ? "" : "&") + `${current}=${(tokenRequest as any)[current]}`, "")
            const response: AuthentiationGrant = JSON.parse(await rp.post("https://discordapp.com/api/v6/oauth2/token", {body: tokenRequestEncoded, headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }}));
            const restToken = `${response.token_type} ${response.access_token}`;
            const aboutYou: UserMetadata = JSON.parse(await rp.get("https://discordapp.com/api/v6/users/@me", {headers: {Authorization: restToken}}));
            
            const user = await User.getOrCreateUser(aboutYou.id);
            user.merge(aboutYou);
            await user.save();

            const token = await user.createToken();
            res.cookie('token', token);
            res.redirect("/");
        }
    },
    {
        opts: {
            method: "get",
            path: "/api/v0/auth/@me",
            guards: [AuthorizedGuard]
        },
        async handler(req, res) {
            res.json({
                snowflake: req.data.user.snowflake,
                username: req.data.user.username,
                discriminator: req.data.user.discriminator,
                email: req.data.user.email,
                canSubmit: await req.data.user.canSubmit()
            } as AboutMeRequest);
        }
    }
] as Route[];