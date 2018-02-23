import { Command } from "../types/command";
import { convertToEmbed } from "../../util/applicationUtils";
import { ArgumentGuard } from "../guards/CoreGuards";
import { Application } from "../../db/entities/Application";
import { RoleGuard, PermissionGuard, translateSources } from "../guards/AccessGuard";
import { Config } from "../../config";

const ManageApplicationGuard = PermissionGuard([...translateSources("role", Config.bot.managers.roles), ...translateSources("userID", Config.bot.managers.users)]);

export = [
    {
        opts: {
            name: "getApplication",
            guards: [ManageApplicationGuard, ArgumentGuard([
                {
                    validate: "string",
                    name: "User ID",
                    description: "The user ID to pull applications for"
                }
            ])]
        },
        async handler(message) {
            const applications: Application[] = await Application.find({user: message.args[0]});
            if (!applications || applications.length === 0) {
                message.reply("No applications for that user exist :(");
                return;
            }
            for (const application of applications) {
                await message.channel.send("", {embed: await convertToEmbed(application)});
            }
        }
    },
    {
        opts: {
            name: "dropApplication",
            guards: [ManageApplicationGuard, ArgumentGuard([
                {
                    validate: "string",
                    name: "Application ID",
                    description: "The application ID to delete"
                }
            ])]
        },
        async handler(message) {
            await Application.removeById(message.args[0]);
            await message.success();
        }
    },
    {
        opts: {
            name: "dropUserApplications",
            guards: [ManageApplicationGuard, ArgumentGuard([
                {
                    validate: "string",
                    name: "User ID",
                    description: "The user ID to delete applications for"
                }
            ])]
        },
        async handler(message) {
            const [userID] = message.args;
            const applications = await Application.find({user: userID});
            await Application.remove(applications);
            await message.success();
        }
    }
] as Command[];