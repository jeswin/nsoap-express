import nsoap, { RoutingError } from "nsoap";

const identifierRegex = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

function parseHeaders(headers) {
  return headers || {};
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
  return body || {};
}

function parseCookies(cookies) {
  return cookies || {};
}

export default function(app, options = {}) {
  const _urlPrefix = options.urlPrefix || "/";
  const urlPrefix = _urlPrefix.endsWith("/") ? _urlPrefix : `${urlPrefix}/`;

  return (req, res) => {
    const body = options.body ? options.getBody(req) : req.body;
    const cookies = options.getCookies ? options.getCookies(req) : req.cookies;

    const { path, url, query, headers } = req;
    if (path.startsWith(urlPrefix)) {
      const strippedPath = path.substring(urlPrefix.length);
      const dicts = [
        options.parseHeaders
          ? options.parseHeaders(headers)
          : parseHeaders(headers),
        options.parseQuery ? options.parseQuery(query) : parseQuery(query),
        options.parseBody ? options.parseBody(body) : parseBody(body),
        options.parseCookies
          ? options.parseCookies(cookies)
          : parseCookies(cookies)
      ];

      const createContext = options.createContext || (x => x);
      const context = options.appendContext
        ? createContext({ req, res, isContext: () => true })
        : [];

      nsoap(app, strippedPath, dicts, {
        index: options.index || "index",
        prependArgs: options.contextAsFirstArgument,
        args: [context]
      }).then(
        result => {
          if (result instanceof RoutingError) {
            if (result.type === "NOT_FOUND") {
              res.status(404).send("Not found.");
            } else {
              res.status(500).send("Server error");
            }
          } else if (typeof result === "function") {
            result.apply(undefined, [req, res]);
          } else {
            if (!context.handled) {
              if (typeof result === "string" && !options.alwaysUseJSON) {
                res.status(200).send(result);
              } else {
                res.status(200).json(result);
              }
            }
          }
        },
        error => {
          if (!context.handled) {
            res.status(400).send(error);
          }
        }
      );
    }
  };
}
