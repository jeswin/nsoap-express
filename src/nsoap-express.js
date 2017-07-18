import nsoap from "nsoap";

export default function(app, options = {}) {
  const _urlPrefix = options.urlPrefix || "/";
  const urlPrefix = _urlPrefix.endsWith("/") ? _urlPrefix : `${urlPrefix}/`;

  return (req, res, next) => {
    const body = options.body ? options.body(req) : req.body;
    const { path, url, query, headers } = req;
    if (path.startsWith(urlPrefix)) {
      const strippedPath = path.substring(urlPrefix.length);
      const dicts = [
        options.parseHeaders ? options.parseHeaders(headers) : headers,
        options.parseQuery ? options.parseQuery(query) : query,
        options.parseBody ? options.parseBody(body) : body
      ];

      nsoap(app, strippedPath, dicts, {
        index: options.index || "index",
        args: [req, res, {}]
      }).then(
        result =>
          typeof result === "string"
            ? res.status(200).send(result)
            : res.status(200).json(result),
        error => res.status(400).send(error)
      );
    } else {
      next();
    }
  };
}
