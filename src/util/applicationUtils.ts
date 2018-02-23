import { RichEmbed } from "discord.js";
import { Framework } from "..";
import { Application } from "../db/entities/Application";
import { User } from "../db/entities/User";

export async function convertToEmbed(application: Application): Promise<RichEmbed> {
    const richEmbed = new RichEmbed();
    const user = await Framework.client.getUser(application.user);
    if (!user) {
        throw new Error("User not found.");
    }
    const dbUser = await User.getOrCreateUser(user.id);
    const email: string | undefined = dbUser.email;
    richEmbed.setAuthor(`${user.username}#${user.discriminator}`, user.avatarURL);
    if (email) {
        richEmbed.setTitle(`Email: ${email}`);
    }
    if (application.hasId()) {
        richEmbed.addField("Application ID", application.id);
    }
    for (let {prompt, response} of application.responses) {
        if (typeof response === "undefined" || response.toString().length === 0) {
            continue;
        }
        if (typeof response === "boolean") {
            response = response ? "yes" : "no";
        }
        richEmbed.addField(prompt, response, true);
    }
    return richEmbed;
}