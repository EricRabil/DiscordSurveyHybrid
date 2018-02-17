import * as nobi from "nobi";
import { Config } from "../config";
import { User } from "../db/entities/User";

export interface DecodedToken {
    snowflake: string;
    timestamp: Date;
    hmac: string;
}

const decodeBase64 = (data: string) => new Buffer(data, "base64").toString("ascii");
const encodeBase64 = (data: string) => new Buffer(data).toString("base64");

/**
 * Decodes and validates a signed token
 *
 * @param token the token to decode
 */
export async function decodeToken(token: string): Promise<DecodedToken | null> {
    const chunks: string[] = token.split(".");
    if (chunks.length !== 3) {
        return null;
    }
    const [snowflakeBase64, timestampBase64] = chunks;
    const snowflake = decodeBase64(snowflakeBase64);
    const timestampEpoch = (decodeBase64(timestampBase64) as any) * 1;
    if (isNaN(timestampEpoch)) {
        return null;
    }
    const timestamp = new Date();
    timestamp.setTime(timestampEpoch);
    if (isNaN(timestamp.getTime())) {
        return null;
    }
    const user = await User.findOneById(snowflake);
    if (!user) {
        return null;
    }
    const signer = nobi(user.salt);
    let hmacData: string;
    try {
        hmacData = signer.unsign(token);
    } catch (e) {
        return null;
    }
    if (hmacData !== `${snowflakeBase64}.${timestampBase64}`) {
        return null;
    }
    return {
        snowflake,
        timestamp,
        hmac: hmacData,
    };
}

/**
 * Validates a token and then gets the user it belongs to
 * @param token the token to validate
 * @returns undefined if the token is invalid
 */
export async function getUser(token: string): Promise<User | undefined> {
    const parsedToken = await decodeToken(token);
    if (parsedToken === null) {
        return undefined;
    }
    return await User.findOneById(parsedToken.snowflake);
}

/**
 * Creates and signs a token for the given user
 *
 * @param user the user to create a token for
 */
export async function createToken(user: User | string): Promise<string> {
    if (typeof user === "string") {
        const _user = await User.findOneById(user);
        if (!_user) {
            throw new Error("Unknown user.");
        }
        user = _user;
    }
    const snowflakeBase64 = encodeBase64(user.id);
    const timestampBase64 = encodeBase64(Date.now() + "");
    const signer = nobi(user.salt);
    const partialToken: string = `${snowflakeBase64}.${timestampBase64}`;
    const hmac: string = signer.sign(partialToken);
    return hmac;
}