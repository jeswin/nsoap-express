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

function createResponseHandler(options, { req, res, next }) {
  return options.onResponseStream
    ? {
        onRoutingError(result) {
          options.onResponseStreamError(req, res, next)(
            new Error("Server error.")
          );
        },
        onResult(result) {
          options.onResponseStreamEnd(req, res, next)(result);
        },
        onError(error) {
          options.onResponseStreamError(req, res, next)(error);
        }
      }
    : options.streamResponse
      ? {
          onRoutingError(result) {
            next(new Error("Server error."));
          },
          onResult(result) {
            res.end(result);
          },
          onError(error) {
            next(error);
          }
        }
      : {
          onRoutingError(result) {
            if (result.type === "NOT_FOUND") {
              res.status(404).send("Not found.");
            } else {
              res.status(500).send("Server error.");
            }
          },
          onResult(result) {
            if (typeof result === "string" && !options.alwaysUseJSON) {
              res.status(200).send(result);
            } else {
              res.status(200).json(result);
            }
          },
          onError(error) {
            res.status(400).send(error);
          }
        };
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

      let isHeader = true;
      const streamResponseHandler = options.onResponseStream
        ? val => {
            if (isHeader) {
              options.onResponseStreamHeader(req, res, next)(val, isHeader);
              isHeader = false;
            } else {
              options.onResponseStream(req, res, next)(val, isHeader);
            }
          }
        : options.streamResponse
          ? val => {
              if (isHeader) {
                res.writeHead(200, val);
                isHeader = false;
              } else {
                res.write(val);
              }
            }
          : undefined;

      const handler = createResponseHandler(options, { req, res, next });

      nsoap(app, strippedPath, dicts, {
        index: options.index || "index",
        prependArgs: options.contextAsFirstArgument,
        args: [context],
        onNextValue: streamResponseHandler
      }).then(
        result => {
          if (typeof result === "function") {
            result.apply(undefined, [req, res]);
          } else if (result instanceof RoutingError) {
            handler.onRoutingError(result);
          } else {
            if (!context.handled) {
              handler.onResult(result);
            }
          }
        },
        error => {
          if (!context.handled) {
            handler.onError(error);
          }
        }
      );
    }
  };
}
