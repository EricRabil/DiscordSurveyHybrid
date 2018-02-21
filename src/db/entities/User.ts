import * as crypto from "crypto";
import { Column, Entity, PrimaryColumn, BaseEntity, ObjectIdColumn } from "typeorm";
import { createToken } from "../../util/hashing";
import { Application } from "./Application";
import { Config } from "../../config";

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
    verified: boolean;

    @Column()
    mfa_enabled: boolean;

    @Column()
    discriminator: string;

    @Column()
    email: string;

    public createToken(): Promise<string> {
        return createToken(this);
    }

    public async canSubmit(): Promise<boolean> {
        return Config.api.allowMultiSubmission || (await this.submissionCount()) === 0;
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
}