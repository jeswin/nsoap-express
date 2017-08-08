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

function createStreamingCompletionHandler(options, { req, res, next }) {
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
      : undefined;
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

      let isStreaming = false;
      const streamHandler = options.onResponseStream
        ? val => {
            if (!isStreaming) {
              options.onResponseStreamHeader(req, res, next)(val);
              isStreaming = true;
            } else {
              options.onResponseStream(req, res, next)(val);
            }
          }
        : options.streamResponse
          ? val => {
              if (!isStreaming) {
                res.writeHead(200, val);
                isStreaming = true;
              } else {
                res.write(val);
              }
            }
          : undefined;

      const streamingCompletionHandler = createStreamingCompletionHandler(options, { req, res, next });

      nsoap(app, strippedPath, dicts, {
        index: options.index || "index",
        prependArgs: options.contextAsFirstArgument,
        args: [context],
        onNextValue: streamHandler
      }).then(
        result => {
          if (typeof result === "function") {
            result.apply(undefined, [req, res]);
          } else if (result instanceof RoutingError) {
            if (isStreaming) {
              streamingCompletionHandler.onRoutingError(result);
            } else {
              if (result.type === "NOT_FOUND") {
                res.status(404).send("Not found.");
              } else {
                res.status(500).send("Server error.");
              }
            }
          } else {
            if (!context.handled) {
              if (isStreaming) {
                streamingCompletionHandler.onResult(result);
              } else {
                if (typeof result === "string" && !options.alwaysUseJSON) {
                  res.status(200).send(result);
                } else {
                  res.status(200).json(result);
                }
              }
            }
          }
        },
        error => {
          if (!context.handled) {
            if (isStreaming) {
              streamingCompletionHandler.onError(error);
            } else {
              res.status(400).send(error);
            }
          }
        }
      );
    }
  };
}
