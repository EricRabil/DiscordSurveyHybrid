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

function overwriteMerge(destinationArray: any[], sourceArray: any[], options: any) {
	return sourceArray
}

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
        token: "no-token",
        secret: "no-secret",
        notificationChannels: [] as string[],
        managers: {
            roles: [],
            users: []
        }
    },
    http: {
        port: 3000
    },
    api: {
        allowMultiSubmission: false,
        multiSubmissionBehavior: {
            editOriginalSubmission: false
        }
    },
    auth: {
        authURL: "https://discordapp.com/api/oauth2/authorize?client_id=327921877945155585&permissions=0&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fv0%2Fauth%2Flogin&response_type=code&scope=identify%20email%20guilds",
        enforceGuildRequirement: false,
        requiredGuild: null
    },
    fields: [
        {
            type: "text",
            label: "Discord Username",
            prefill: "username",
            userEntryEnabled: false,
            submitToServer: false,
            id: "username"
        },
        {
            type: "text",
            label: "Discord Discriminator",
            prefill: "discriminator",
            userEntryEnabled: false,
            submitToServer: false,
            id: "discrim"
        },
        {
            type: "text",
            label: "E-Mail",
            prefill: "email",
            userEntryEnabled: false,
            submitToServer: false,
            id: "email"
        },
        {
            type: "text",
            label: "Your Name",
            id: "name"
        },
        {
            type: "seperator",
            label: null,
            submitToServer: false,
            id: "seperator-1"
        },
        {
            type: "dropdown",
            label: "What position are you applying for?",
            choices: [
                "Moderator",
                "Administrator"
            ],
            id: "position",
        },
        {
            type: "checkbox",
            label: "Are you a developer?",
            id: "developer"
        },
        {
            type: "radio",
            label: "How long have you been in the jailbreak community?",
            choices: [
                "Less than a month",
                "1 Month",
                "6 Months",
                "1 Year",
                "More than a year"
            ],
            id: "experience"
        }
    ],
    secret: "very-secret",
    meta: {
        siteName: "Applications",
        splashIntroduction: "Welcome to the trusted developer program applications! Some more text here, lmao this is even more text. Even more text. More text. Some more. And finally, more text.",
        requirements: ["Have the developer role", "Be an experienced developer", "Another arbitary limiation goes here!"],
        leadText: "Apply for the trusted developer role, and get perks."
    }
}, configFile as {}, {arrayMerge: overwriteMerge});

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
        token: options.botToken || appConfig.bot.token,
        secret: options.botSecret || appConfig.bot.secret
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