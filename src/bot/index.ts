import * as path from "path";
import { EventEmitter } from "events";
import { Command, CommandHandler } from "./types/command";
import { MessageEvent } from "../discord";
import { loadDirectory } from "../util/iokit";
import { Framework } from "..";
import { Application } from "../db/entities/Application";
import { Config } from "../config";
import { TextBasedChannel, TextChannel, DMChannel, RichEmbed, MessageEmbed } from "discord.js";
import { User } from "../db/entities/User";
import { convertToEmbed } from "../util/applicationUtils";

const COMMAND_ROOT = path.join(__dirname, "commands");

function isCommand(command: any): command is Command {
    return "opts" in command && "name" in command.opts && "handler" in command;
}

export class BotManager {

    private commandEmitter: EventEmitter = new EventEmitter();

    public constructor() {
        loadDirectory(COMMAND_ROOT, this.loadCommand.bind(this));
        Framework.client.on("message", message => this.commandEmitter.emit(message.command, message));
        Framework.events.on("submit", async (application: Application) => {
            for (const channelID of Config.bot.notificationChannels) {
                const channel = Framework.client.client.channels.get(channelID);
                if (!channel) {
                    continue;
                }
                if (!(channel instanceof TextChannel || channel instanceof DMChannel)) {
                    continue;
                }
                channel.send("", {embed: await convertToEmbed(application)});
            }
        });
    }

    private loadCommand(command: any) {
        if (!isCommand(command)) {
            return;
        }
        if (!command.opts.guards || command.opts.guards.length === 0) {
            this.commandEmitter.on(command.opts.name, command.handler.bind(command));
            return;
        }
        this.commandEmitter.on(command.opts.name, (event: MessageEvent) => {
            let currentIndex: number = 0;
            let previous: any;
            const next: () => void = () => {
                const guard = (command.opts.guards as CommandHandler[])[currentIndex++];
                if (!guard || previous === guard) {
                    command.handler(event, undefined as any);
                    return;
                }
                previous = guard;
                guard(event, next);
            };
            next();
        });
    }
}