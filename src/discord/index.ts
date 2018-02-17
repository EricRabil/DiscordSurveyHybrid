import {Client, Message, MessageOptions, RichEmbed, Attachment, User, GuildMember, TextChannel, DMChannel, Guild} from "discord.js";
import { EventEmitter } from "events";

export interface MessageEvent {
    delete(): Promise<void>;
    reply(content: string, options: MessageOptions | RichEmbed | Attachment): Promise<void>;
    success(): Promise<void>;
    command: string;
    args: string[];
    user: User;
    member?: GuildMember;
    channel: TextChannel | DMChannel;
    guild?: Guild;
}

export declare interface Bot {
    on(event: "message", handler: (event: MessageEvent) => any): this;
    on(event: string, handler: (...args: any[]) => any): this;
}

export class Bot extends EventEmitter {
    private discordClient: Client;

    public constructor(private token: string, private prefix: string) {
        super();
    }

    public async connect() {
        if (this.discordClient) {
            await this.disconnect();
        }
        this.discordClient = new Client({
            ws: {
                compress: true
            }
        });
        await this.discordClient.login(this.token);
        this.discordClient.on("message", this.handleMessage.bind(this));
    }

    public async disconnect() {
        if (!this.discordClient) {
            return;
        }
        await this.discordClient.destroy();
        delete this.discordClient;
    }

    public get client() {
        return this.discordClient;
    }

    public async getUser(user: string): Promise<User | undefined> {
        if (!this.discordClient) {
            return;
        }
        const existingUser = this.discordClient.users.get(user);
        if (existingUser) {
            return existingUser;
        }
        try {
            return await this.discordClient.fetchUser(user);
        } catch (e) {
            return undefined;
        }
    }

    private async handleMessage(message: Message) {
        if (!message.content.startsWith(this.prefix)) {
            return;
        }
        const [command, ...args] = message.content.substring(this.prefix.length).split(" ");
        this.emit("message", {
            delete: message.delete.bind(message),
            reply: message.channel.send.bind(message.channel),
            success: message.react.bind(message, "🆗"),
            command,
            args,
            user: message.author,
            member: message.member,
            channel: message.channel,
            guild: message.guild
        } as MessageEvent);
    }
}