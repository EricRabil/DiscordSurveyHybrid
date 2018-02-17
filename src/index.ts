import { connect } from "./db/connection";
import { ExpressServer } from "./http";
import { Bot } from "./discord";
import { Config } from "./config";
import { logger } from "./util/logger";

export const Framework: {
    http: ExpressServer,
    client: Bot
} = {
    http: new ExpressServer(Config.http.port),
    client: new Bot(Config.bot.token, Config.bot.prefix)
};
connect()
    .then(() => Framework.client.connect())
    .then(() => Framework.http.start())
    .then(() => logger.info("Ready to go!"));