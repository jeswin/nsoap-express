import nsoap from "nsoap";

const identifierRegex = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

function parseHeaders(headers) {
  return headers;
}

function parseQuery(query) {
  return Object.keys(query).reduce((acc, key) => {
    const val = query[key];
    acc[key] =
      val === "true" || val === "false"
        ? val === "true"
        : identifierRegex.test(val) ? `${val}` : JSON.parse(val);
    return acc;
  }, {});
}

function parseBody(body) {
  return body;
}

export default function(app, options = {}) {
  const _urlPrefix = options.urlPrefix || "/";
  const urlPrefix = _urlPrefix.endsWith("/") ? _urlPrefix : `${urlPrefix}/`;

  return (req, res, next) => {
    const body = options.body ? options.body(req) : req.body;
    const { path, url, query, headers } = req;
    if (path.startsWith(urlPrefix)) {
      const strippedPath = path.substring(urlPrefix.length);
      const dicts = [
        options.parseHeaders
          ? options.parseHeaders(headers)
          : parseHeaders(headers),
        options.parseQuery ? options.parseQuery(query) : parseQuery(query),
        options.parseBody ? options.parseBody(body) : parseBody(body)
      ];

      nsoap(app, strippedPath, dicts, {
        index: options.index || "index",
        args: [req, res, {}]
      }).then(
        result =>
          typeof result === "string" && !options.alwaysUseJSON
            ? res.status(200).send(result)
            : res.status(200).json(result),
        error => res.status(400).send(error)
      );
    } else {
      next();
    }
  };
}
