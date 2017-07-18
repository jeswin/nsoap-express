"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (app) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _urlPrefix = options.urlPrefix || "/";
  var urlPrefix = _urlPrefix.endsWith("/") ? _urlPrefix : urlPrefix + "/";

  return function (req, res, next) {
    var body = options.body ? options.body(req) : req.body;
    var path = req.path,
        url = req.url,
        query = req.query,
        headers = req.headers;

    if (path.startsWith(urlPrefix)) {
      var strippedPath = path.substring(urlPrefix.length);
      var dicts = [options.parseHeaders ? options.parseHeaders(headers) : headers, options.parseQuery ? options.parseQuery(query) : query, options.parseBody ? options.parseBody(body) : body];

      (0, _nsoap2.default)(app, strippedPath, dicts, {
        index: options.index || "index",
        args: [req, res, {}]
      }).then(function (result) {
        return typeof result === "string" ? res.status(200).send(result) : res.status(200).json(result);
      }, function (error) {
        return res.status(400).send(error);
      });
    } else {
      next();
    }
  };
};

var _nsoap = require("nsoap");

var _nsoap2 = _interopRequireDefault(_nsoap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=nsoap-express.js.map