import { Route } from "../../http/types/route";

export = {
    opts: {
        path: "/unauthorized",
        method: "get",
    },
    render: "unauthorized"
} as Route;