import { Route } from "../../http/types/route";
import { AuthorizedGuard, InRequiredGuild, CanSubmitGuard } from "../../guards";
import { Config } from "../../config";

export = {
    opts: {
        path: "/",
        method: "get",
        guards: [AuthorizedGuard, InRequiredGuild, CanSubmitGuard]
    },
    render: "index"
} as Route;