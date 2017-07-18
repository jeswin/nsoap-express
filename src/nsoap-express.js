import core from "nsoap";

export default function(app, options = {}) {
  const urlPrefix = options.urlPrefix || "/";
  return (req, res, next) => {
    const body = options.body ? options.body(req) : req.body;
    const { path, url, query } = req;
    if (path.startsWith(urlPrefix)) {
      const strippedPath = path.substring(urlPrefix.length);
      const dicts = [
        options.parseHeaders ? options.parseHeaders(headers) : headers,
        options.parseQuery ? options.parseQuery(query) : query,
        options.parseBody ? options.parseBody(body) : body
      ];
      nsoap(app, strippedPath, dicts, { index: options.index }, () => next());
    } else {
      next();
    }
  };
}
