import * as deepmerge from "deepmerge";
import * as fs from "fs";
import * as path from "path";
import {argv as options} from "optimist";

const configPath = options.configPath || path.join(process.cwd(), "config.json");

const configFile = fs.existsSync(configPath) ? require(configPath) : {};

/**
 * Configuration hierarchy:
 * Default values are generated, then overridden by the configuration file, then overriden by CLI opts
 */

let appConfig = deepmerge({
    database: {
        driver: "mongodb",
        host: "localhost",
        port: 27017,
        username: null,
        password: null,
        database: "jbmodapps",
    },
    bot: {
        prefix: "!",
        token: "no-token"
    },
    http: {
        port: 3000
    },
    secret: "very-secret"
}, configFile as {});

appConfig = deepmerge(appConfig, {
    database: {
        driver: options.dbDriver || appConfig.database.driver,
        host: options.dbHost || appConfig.database.host,
        port: options.dbPort || appConfig.database.port,
        username: options.dbUsername || appConfig.database.username,
        password: options.dbPassword || appConfig.database.password,
        database: options.dbName || appConfig.database.database,
    },
    bot: {
        prefix: options.botPrefix || appConfig.bot.prefix,
        token: options.botToken || appConfig.bot.token
    },
    http: {
        port: options.httpPort || appConfig.http.port
    },
    secret: options.secret || appConfig.secret
} as {});

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(appConfig, undefined, 4));
}

export const Config = appConfig;