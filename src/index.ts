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

Framework.client.connect().then(() => {
    logger.info("Client has started");
    Framework.http.start().then(() => {
        logger.info("HTTP has started");
    })
});