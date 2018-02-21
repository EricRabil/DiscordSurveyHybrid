import * as express from "express";
import { Server } from "http";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import { ExtraRequest, Route, RouteHandler } from "./types/route";
import * as fs from "fs-extra";
import * as path from "path";
import { logger } from "../util/logger";
import { getUser } from "../util/hashing";
import { Config } from "../config";

const cookieParser = require("cookie-parser");

const isRoute = (route: any): route is Route => {
    return typeof route === "object"
        && typeof route.opts === "object"
        && typeof route.opts.path === "string"
        && typeof route.opts.method === "string"
        && (
            route.opts.method === "get"
            || route.opts.method === "post"
            || route.opts.method === "options"
            || route.opts.method === "patch"
            || route.opts.method === "delete"
        );
};

const routesPath = path.join(__dirname, "..", "routes");

const prefilledTemplateData = {
    siteName: Config.meta.siteName
};

export class ExpressServer {

    private server: express.Express;
    private _server: Server;

    public constructor(private port: number) {
    }

    public async start(): Promise<void> {
        if (this.server || this._server) {
            await this.stop();
        }
        this.server = express();
        this.server.set("views", path.join(process.cwd(), "views"));
        this.server.set("view engine", "pug");
        this._server = this.server.listen(this.port);
        await this.initRoutes();
    }

    public stop(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.server) {
                return;
            }
            this._server.close(() => {
                delete this.server;
                delete this._server;
                resolve();
            });
        });
    }

    private async initRoutes() {
        this.server.use(cors());
        this.server.use(bodyParser.json());
        this.server.use(cookieParser());
        this.server.use(async (req, res, next) => {
            const eReq: ExtraRequest = req as any;
            eReq.data = {
                authenticated: false,
                user: null as any
            };
            let authorization = req.headers.authorization || req.headers.Authorization || req.cookies.token;
            if (authorization) {
                authorization = typeof authorization === "string" ? authorization : authorization[0];
                const user = await getUser(authorization);
                if (user) {
                    eReq.data.user = user;
                    eReq.data.authenticated = true;
                }
            }
            if (!eReq.data.authenticated) {
                res.redirect(Config.auth.authURL);
                return;
            }
            const _render = res.render.bind(res);
            res.render = (view: string, options?: (Object | Function), callback?: any) => {
                const layoutData = {
                    user: eReq.data.user,
                    ...prefilledTemplateData
                };
                if (!options || typeof options === "function") {
                    _render(view, layoutData, options);
                    return;
                };
                options = {
                    ...layoutData,
                    ...options
                };
                _render(view, options, callback);
            }
            next();
        });
        await this.loadDirectory(routesPath);
        this.server.use("/public", express.static(path.join(process.cwd(), "public")));
        this.server.use((req, res, next) => {
            res.status(404).json({code: 404, message: "404: Not found."});
        });
    }

    private async loadRoute(route: Route): Promise<void> {
        if (!isRoute(route)) {
            logger.warn("Not loading an invalid route into express");
            return;
        }
        logger.debug(`[ROUTE] (${route.opts.method.toUpperCase()}) ${route.opts.path}`);
        if (!route.handler) {
            if (!route.render) {
                return;
            }
            const {render} = route;
            route.handler = (req, res) => {
                res.render(render);
            };
        }
        if (!route.opts.guards) {
            this.server[route.opts.method](route.opts.path, route.handler.bind(route));
            return;
        }
        this.server[route.opts.method](route.opts.path, (req, res) => {
            let currentIndex: number = 0;
            let previous: any;
            const next: () => void = () => {
                const guard = (route.opts.guards as RouteHandler[])[currentIndex++];
                if (!guard || previous === guard) {
                    (route.handler as any)((req as any), (res as any), () => null);
                } else {
                    previous = guard;
                    guard(req as any, res as any, next);
                }
            };
            next();
        });
    }

    private async loadFile(filePath: string): Promise<void> {
        if (!filePath.endsWith(".js")) {
            return;
        }
        let rawFile: any = require(filePath);
        if (Array.isArray(rawFile)) {
            const recursivePromises: Array<Promise<void>> = [];
            for (const rawRoute of rawFile) {
                recursivePromises.push(this.loadRoute(rawRoute));
            }
            await Promise.all(recursivePromises);
            return;
        } else {
            await this.loadRoute(rawFile);
            return;
        }
    }

    private async loadDirectory(directory: string): Promise<void> {
        const contents = await fs.readdir(directory);
        const recursivePromises: Array<Promise<void>> = [];
        for (const content of contents) {
            const itemPath = path.join(directory, content);
            let isFile: boolean = false;
            try {
                const itemStats = await fs.stat(itemPath);
                if (!itemStats.isFile()) {
                    recursivePromises.push(this.loadDirectory(itemPath));
                    continue;
                }
                recursivePromises.push(this.loadFile(itemPath));
            } catch (e) {
                logger.warn(`Couldn't load route(s) from ${itemPath}`);
                continue;
            }
        }
        await Promise.all(recursivePromises);
    }
}