import * as crypto from "crypto";
import { Column, Entity, PrimaryColumn, BaseEntity } from "typeorm";
import { createToken } from "../../util/hashing";

@Entity()
export class User extends BaseEntity {
    @PrimaryColumn({type: "varchar"})
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

    static async getOrCreateUser(userID: string): Promise<User> {
        return (await User.findOne({id: userID})) || (await User.createUser(userID));
    }

    static async createUser(userID: string): Promise<User> {
        const user = new User();
        user.id = userID;
        user.salt = crypto.randomBytes(16).toString();
        await user.save();
        return user;
    }
}