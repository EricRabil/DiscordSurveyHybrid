import { connect } from "./db/connection";
import { ExpressServer } from "./http";
import { Bot } from "./discord";
import { Config } from "./config";
import { logger } from "./util/logger";
import { EventEmitter } from "events";
import { BotManager } from "./bot";

export const Framework: {
    http: ExpressServer,
    client: Bot,
    events: EventEmitter
} = {
    http: new ExpressServer(Config.http.port),
    client: new Bot(Config.bot.token, Config.bot.prefix),
    events: new EventEmitter()
};

const manager = new BotManager();

connect()
    .then(() => Framework.client.connect())
    .then(() => Framework.http.start())
    .then(() => logger.info("Ready to go!"));