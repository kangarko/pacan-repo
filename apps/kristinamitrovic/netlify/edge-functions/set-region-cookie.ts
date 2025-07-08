import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
    const geo = context.geo;

    if (geo?.country?.code) {
        const countryCode = geo.country.code.toUpperCase();

        request.headers.set("X-User-Region", countryCode);
    }
};

export const config: Config = {
    path: "/*",
    excludedPath: [
        "/*.css",
        "/*.js",
        "/*.png",
        "/*.jpg",
        "/*.jpeg",
        "/*.gif",
        "/*.svg",
        "/*.ico",
        "/*.woff",
        "/*.woff2",
        "/favicon.ico",
    ],
}; 