import * as crypto from "crypto";
import { Column, Entity, PrimaryColumn, BaseEntity, ObjectIdColumn } from "typeorm";
import { createToken } from "../../util/hashing";
import { Application } from "./Application";
import { Config } from "../../config";
import {User as DUser} from "discord.js";
import { AboutMeRequest, UserMetadata, GuildsResponse } from "../../http/types/api";

@Entity()
export class User extends BaseEntity {
    @PrimaryColumn({type: "varchar"})
    snowflake: string;

    @ObjectIdColumn()
    id: string;

    @Column()
    salt: string;

    @Column()
    username: string;

    @Column()
    guilds: string[];

    @Column()
    verified: boolean;

    @Column()
    mfa_enabled: boolean;

    @Column()
    discriminator: string;

    @Column()
    email: string;

    @Column()
    avatar: string;

    public createToken(): Promise<string> {
        return createToken(this);
    }

    public async canSubmit(): Promise<boolean> {
        return Config.api.allowMultiSubmission || (await this.submissionCount()) === 0;
    }

    public inGuild(): boolean {
        if (!Config.auth.enforceGuildRequirement || !Config.auth.requiredGuild) return true;
        if (!this.guilds) return false;
        return (this.guilds.includes(Config.auth.requiredGuild || ""));
    }

    public async submit(application: Application): Promise<boolean> {
        if (!(await this.canSubmit())) {
            return false;
        }
        const preExistingApplication = await Application.findOne({user: this.snowflake});
        if (preExistingApplication) {
            if (Config.api.allowMultiSubmission) {
                if (Config.api.multiSubmissionBehavior.editOriginalSubmission) {
                    application.created = preExistingApplication.created;
                }
            } else {
                await Application.remove(preExistingApplication);
            }
        }
        await application.save();
        return true;
    }

    public submissionCount(): Promise<number> {
        return Application.count({user: this.snowflake});
    }

    public merge(user: UserMetadata): void {
        this.username = user.username;
        this.verified = user.verified;
        this.mfa_enabled = user.mfa_enabled;
        this.discriminator = user.discriminator;
        this.email = user.email;
        this.avatar = user.avatar;
    }

    public mergeGuilds(guilds: string[]): void {
        this.guilds = guilds;
    }

    static async getOrCreateUser(userID: string): Promise<User> {
        return (await User.findOne({snowflake: userID})) || (await User.createUser(userID));
    }

    static async createUser(userID: string): Promise<User> {
        const user = new User();
        user.snowflake = userID;
        user.salt = crypto.randomBytes(16).toString();
        await user.save();
        return user;
    }

    static async updateUser(dUser: DUser): Promise<void> {
        const dbUser = await User.getOrCreateUser(dUser.id);
        dbUser.username = dUser.username;
        dbUser.discriminator = dUser.discriminator;
        dbUser.avatar = dUser.avatar;
        await dbUser.save();
    }
}