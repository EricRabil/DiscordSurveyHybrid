import { CommandHandler } from "../types/command";
import { RichEmbed } from "discord.js";
import { EMBED_ERROR_COLOR } from "../BotConstants";

export interface Argument {
    validate: "string" | "boolean" | "number" | ((item: string) => boolean);
    name?: string;
    description?: string;
    optional?: boolean;
}

export const ArgumentGuard: (args: Argument[]) => CommandHandler = (args) => {
    const fields: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }> = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const body = (arg.description || "") + (typeof arg.validate === "string" ? `\n\`Type: ${arg.validate}\`` : "");
        fields.push({
            name: `Argument #${i}${arg.name ? `: ${arg.name}` : ""}`, 
            value: body
        });
    }
    return async (message, next) => {
        const givenArgs = message.args;
        let hasMissing: boolean = false;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            let given: string | boolean | number = givenArgs[i];
            if (!given && !arg.optional) {
                hasMissing = true;
                break;
            }
            if (typeof arg.validate === "string") {
                if (arg.validate === "number") {
                    given = (given as any) * 1;
                    if (isNaN(given)) {
                        hasMissing = true;
                        break;
                    }
                } else if (arg.validate === "boolean") {
                    given = Boolean(given);
                }
            } else if (typeof arg.validate === "function") {
                if (!arg.validate(given)) {
                    hasMissing = true;
                    break;
                }
            }
        }
        if (!hasMissing) {
            next();
            return;
        }
        const embed: RichEmbed = new RichEmbed();
        embed.setColor(EMBED_ERROR_COLOR);
        embed.setTitle("Bad arguments");
        embed.setDescription(`The arguments provided weren't valid for \`${message.command}\` - below are the arguments expected for this command.`);
        embed.fields = fields;
        message.reply("", {embed});
    }
};