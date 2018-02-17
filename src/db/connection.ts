import "reflect-metadata";
import {createConnection} from "typeorm";
import {Config} from "../config";
import { join } from "path";

const entityDir = join(__dirname, "entities", "*.js");

export async function connect() {
    await createConnection({
        type: Config.database.driver as any,
        host: "localhost",
        port: Config.database.port,
        username: Config.database.username,
        password: Config.database.password,
        database: Config.database.database,
        entities: [entityDir],
        logging: false,
        synchronize: true
    });
}