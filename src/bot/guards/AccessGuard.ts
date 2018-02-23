import { CommandHandler } from "../types/command";
import { MessageEvent } from "../../discord";
import { RichEmbed } from "discord.js";
import { EMBED_ERROR_COLOR } from "../BotConstants";
import { Framework } from "../..";

const fancyMap: {[key: string]: string} = {
    permission: "Permission",
    role: "Role",
    userID: "User ID",
    channel: "Channel",
    guild: "Guild",
    hasGuild: "Is In Guild"
}

export type PermissionSource = "permission" | "role" | "userID" | "channel" | "guild" | "hasGuild";

export interface PermissionGranter {
    type: PermissionSource,
    value: string;
}

async function sendErrorDepiction(message: MessageEvent, granters?: PermissionGranter[]) {
    const embed: RichEmbed = new RichEmbed();
    embed.setTitle("Missing Access");
    embed.setColor(EMBED_ERROR_COLOR);
    let description: string = `You do not have access to use \`${message.command}\``;
    if (granters && granters.length > 0) {
        description += `\nThis command is accessible to users that meet any of the following:`;
        let hasUserFlag: boolean = false;
        for (const granter of granters) {
            if (embed.fields && embed.fields.length >= 19) {
                break;
            }
            if (granter.type === "userID") {
                if (hasUserFlag) {
                    continue;
                }
                hasUserFlag = true;
                embed.addField("User Whitelist", "❌ This command has a user-whitelist. Ask about being whitelisted.");
                continue;
            }
            let value = granter.value;
            if (granter.type === "role") {
                if (!message.guild) {
                    continue;
                }
                const role = message.guild.roles.get(value);
                if (!role) {
                    continue;
                }
                value = `Missing \`${role.name}\` role`;
            } else if (granter.type === "channel") {
                if (!message.guild) {
                    continue;
                }
                const channel = message.guild.channels.get(value);
                if (!channel) {
                    continue;
                }
                value = `Not in \`${channel.name}\` channel`;
            } else if (granter.type === "guild" || granter.type === "hasGuild") {
                const guild = Framework.client.client.guilds.get(value);
                if (!guild) {
                    continue;
                }
                value = `Not in \`${guild.name}\` guild`;
            } else if (granter.type === "permission") {
                value = `Missing \`${value}\` permission`;
            }
            embed.addField(fancyMap[granter.type], `❌ ${value}`, true);
        }
    }
    embed.setDescription(description);
    await message.reply("", {embed});
}

export function translateSources(source: PermissionSource, values: string[]): PermissionGranter[] {
    const granters: PermissionGranter[] = [];
    for (const value of values) {
        granters.push({
            type: source,
            value
        });
    }
    return granters;
}

export const PermissionGuard: (granters: PermissionGranter[]) => CommandHandler = granters => async (message, next) => {
    let verified: boolean = false;
    for (const granter of granters) {
        if (verified) {
            break;
        }
        switch (granter.type) {
            case "permission":
                break;
            case "role":
                if (!message.member) {
                    break;
                }
                if (message.member.roles.has(granter.value)) {
                    verified = true;
                }
                break;
            case "userID":
                if (message.user.id === granter.value) {
                    verified = true;
                }
                break;
            case "channel":
                if (message.channel.id === granter.value) {
                    verified = true;
                }
                break;
            case "guild":
                if (message.guild && message.guild.id === granter.value) {
                    verified = true;
                }
                break;
            case "hasGuild":
                const guild = Framework.client.client.guilds.get(granter.value);
                if (!guild) {
                    break;
                }
                if (guild.members.has(message.user.id)) {
                    verified = true;
                }
                break;
        }
    }
    if (!verified) {
        await sendErrorDepiction(message, granters);
        return;
    }
    next();
};

export const RoleGuard: (roles: string[]) => CommandHandler = roles => PermissionGuard(translateSources("role", roles));
export const PermissionNodeGuard: (permissions: string[]) => CommandHandler = permissions => PermissionGuard(translateSources("permission", permissions));
export const UserGuard: (users: string[]) => CommandHandler = users => PermissionGuard(translateSources("userID", users));
export const ChannelGuard: (channels: string[]) => CommandHandler = channels => PermissionGuard(translateSources("channel", channels));
export const GuildGuard: (guilds: string[]) => CommandHandler = guilds => PermissionGuard(translateSources("guild", guilds));
export const GuildMemberGuard: (guilds: string[]) => CommandHandler = guilds => PermissionGuard(translateSources("hasGuild", guilds));