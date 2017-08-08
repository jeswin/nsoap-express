import nsoap, { RoutingError } from "nsoap";

const identifierRegex = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

function parseDict(dict) {
  return key => {
    if (Object.prototype.hasOwnProperty.call(dict, key)) {
      const val = dict[key];
      return {
        value:
          typeof val !== "string"
            ? val
            : val === "true" || val === "false"
              ? val === "true"
              : identifierRegex.test(val) ? `${val}` : JSON.parse(val)
      };
    }
  };
}

function parseHeaders(headers) {
  return parseDict(headers);
}

function parseQuery(query) {
  return parseDict(query);
}

function parseBody(body) {
  return body || {};
}

function parseCookies(cookies) {
  return parseDict(cookies);
}

export default function(app, options = {}) {
  const _urlPrefix = options.urlPrefix || "/";
  const urlPrefix = _urlPrefix.endsWith("/") ? _urlPrefix : `${urlPrefix}/`;

  return (req, res, next) => {
    const { path, url, query, headers } = req;

    if (path.startsWith(urlPrefix)) {
      const body = options.body ? options.getBody(req) : req.body;
      const cookies = options.getCookies
        ? options.getCookies(req)
        : req.cookies;

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

      let beganStreaming = false;
      const streamResponseHandler = options.streamResponse
        ? val => {
            if (!beganStreaming) {
              const streamHeaders = options.getStreamHeaders
                ? options.getStreamHeaders(req, res)(val)
                : {
                    "Content-Type": "text/plain",
                    "Transfer-Encoding": "chunked"
                  };
              res.writeHead(200, streamHeaders);
            }
            beganStreaming = true;
            res.write(val.toString());
          }
        : undefined;

      nsoap(app, strippedPath, dicts, {
        index: options.index || "index",
        prependArgs: options.contextAsFirstArgument,
        args: [context],
        onNextValue: streamResponseHandler
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
              if (!options.streamResponse) {
                if (typeof result === "string" && !options.alwaysUseJSON) {
                  res.status(200).send(result);
                } else {
                  res.status(200).json(result);
                }
              } else {
                res.end(result.toString());
              }
            }
          }
        },
        error => {
          if (!context.handled) {
            if (options.streamResponse) {
              next(error);
            } else {
              res.status(400).send(error);
            }
          }
        }
      );
    }
  };
}
