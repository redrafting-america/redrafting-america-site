const CANONICAL_HOST = "www.redraftingamerica.org";

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);

    if (requestUrl.hostname !== CANONICAL_HOST) {
      requestUrl.protocol = "https:";
      requestUrl.hostname = CANONICAL_HOST;
      requestUrl.port = "";
      return Response.redirect(requestUrl.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
