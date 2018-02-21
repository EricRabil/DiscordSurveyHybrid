import { ClientField, FieldRequest } from "../http/types/api";
(async function() {
    function getCookie(cookiename: string) {
        var cookiestring=RegExp(""+cookiename+"[^;]+").exec(document.cookie);
        return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
    }
    const token = getCookie("token");
    if (!token) {
        console.error("Bad token in cookie store.");
        return;
    }
    const request = (method: "get" | "post" | "options" | "patch" | "delete", url: string, body?: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method.toUpperCase(), url, true);
            if (url.startsWith("/")) {
                xhr.setRequestHeader("Authorization", token);
            }
            if (method === "post" || method === "patch") {
                xhr.setRequestHeader("Content-type", "application/json");
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 204) {
                            resolve();
                            return;
                        }
                        if (xhr.status < 299) {
                            resolve(JSON.parse(xhr.response));
                        } else {
                            reject(JSON.parse(xhr.response));
                        }
                    }
                }
                xhr.send(body);
            } else {
                xhr.onload = function() {
                    if (xhr.status === 204) {
                        resolve();
                        return;
                    }
                    if (xhr.status < 299) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject(JSON.parse(xhr.response));
                    }
                };
                xhr.send(null);
            }
        });
    };

    const fields: FieldRequest = await request("get", "/api/v0/form/fields");
    const root: HTMLSpanElement = document.getElementById("dynamicRoot") as any;
    const insert = (field: ClientField) => {
        switch (field.type) {
            case "text":

        }
    }
})();