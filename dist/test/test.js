"use strict";

var _nsoapExpress = require("../nsoap-express");

var _nsoapExpress2 = _interopRequireDefault(_nsoapExpress);

var _should = require("should");

var _should2 = _interopRequireDefault(_should);

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _supertest = require("supertest");

var _supertest2 = _interopRequireDefault(_supertest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var routes = {
  // index() {
  //   return "Home page!";
  // },
  about: function about() {
    return "NSOAP Test Suite";
  }
  // static: "NSOAP Static File",
  // unary(arg) {
  //   return arg + 10;
  // },
  // binary(x, y) {
  //   return x + y;
  // },
  // namespace: {
  //   binary(x, y) {
  //     return x + y;
  //   }
  // },
  // nested: {
  //   namespace: {
  //     binary(x, y) {
  //       return x + y;
  //     }
  //   }
  // },
  // json(input) {
  //   return input.x + 20;
  // },
  // throw(a) {
  //   throw new Error("Exception!");
  // },
  // chainAdder1(x) {
  //   return {
  //     chainAdder2(y) {
  //       return x + y;
  //     }
  //   };
  // },
  // infer(_bool, _num, _str) {
  //   return {
  //     _bool,
  //     _num,
  //     _str
  //   };
  // },
  // promiseToAdd(x, y) {
  //   return Promise.resolve(x + y);
  // },
  // functionOnPromise(x, y) {
  //   return Promise.resolve({
  //     adder(z) {
  //       return x + y + z;
  //     }
  //   });
  // },
  // defaultFunction(x, y) {
  //   return {
  //     index() {
  //       return x + y
  //     }
  //   }
  // }

};

var app = (0, _express2.default)();
app.use((0, _nsoapExpress2.default)(routes));
//app.get("/about", (req, res) => res.send("Hello"))

describe("NSOAP Express", function () {
  it("Calls a parameter-less function", _asyncToGenerator(function* () {
    var resp = yield (0, _supertest2.default)(app).get("/about");
    resp.text.should.equal("NSOAP Test Suite");
  }));

  // it("Gets the value of a property", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "static", [], {}, handler.then);
  //   handler.getResult().should.equal("NSOAP Static File");
  // });
  //
  // it("Calls a unary function", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "unary(10)", [], {}, handler.then);
  //   handler.getResult().should.equal(20);
  // });
  //
  // it("Throws an exception", async () => {
  //   const handler = getMockHandler();
  //   const result = nsoap(app, "throw(10)", [], {}, handler.then);
  //   return result.then(
  //     () => {
  //       throw new Error("Exception was expected but not thrown.");
  //     },
  //     err => {}
  //   );
  // });
  //
  // it("Calls a binary function", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "binary(10,20)", [], {}, handler.then);
  //   handler.getResult().should.equal(30);
  // });
  //
  // it("Calls a unary function with variables", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "unary(x)", [{ x: 10 }], {}, handler.then);
  //   handler.getResult().should.equal(20);
  // });
  //
  // it("Calls a binary function with variables", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "binary(x,y)", [{ x: 10, y: 20 }], {}, handler.then);
  //   handler.getResult().should.equal(30);
  // });
  //
  // it("Calls a binary function with literals and variables", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "binary(x,20)", [{ x: 10 }], {}, handler.then);
  //   handler.getResult().should.equal(30);
  // });
  //
  // it("Calls a binary function in a namespace", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "namespace.binary(10,20)", [], {}, handler.then);
  //   handler.getResult().should.equal(30);
  // });
  //
  // it("Calls a binary function in a nested namespace", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "nested.namespace.binary(10,20)", [], {}, handler.then);
  //   handler.getResult().should.equal(30);
  // });
  //
  // it("Accepts JSON arguments", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "json(obj)", [{ obj: { x: 10 } }], {}, handler.then);
  //   handler.getResult().should.equal(30);
  // });
  //
  // it("Adds parenthesis if omitted", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "about", [], {}, handler.then);
  //   handler.getResult().should.equal("NSOAP Test Suite");
  // });
  //
  // it("Calls the default function", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "", [], { index: "index" }, handler.then);
  //   handler.getResult().should.equal("Home page!");
  // });
  //
  // it("Calls chained functions", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "chainAdder1(10).chainAdder2(20)", [], {}, handler.then);
  //   handler.getResult().should.equal(30);
  // });
  //
  // it("Infers types", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "infer(true, 20, Hello)", [], {}, handler.then);
  //   const result = handler.getResult();
  //   (typeof result._bool).should.equal("boolean");
  //   (typeof result._num).should.equal("number");
  //   (typeof result._str).should.equal("string");
  // });
  //
  // it("Is Case-sensitive", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "unary(x)", [{ X: 100, x: 10 }], {}, handler.then);
  //   handler.getResult().should.equal(20);
  // });
  //
  // it("Resolves a Promise", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(
  //     app,
  //     "promiseToAdd(x,y)",
  //     [{ x: 10, y: 20 }],
  //     {},
  //     handler.then
  //   );
  //   handler.getResult().should.equal(30);
  // });
  //
  // it("Calls a function on the resolved value of a Promise", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(
  //     app,
  //     "functionOnPromise(x,y).adder(100)",
  //     [{ x: 10, y: 20 }],
  //     {},
  //     handler.then
  //   );
  //   handler.getResult().should.equal(130);
  // });
  //
  // it("Calls default function on object", async () => {
  //   const handler = getMockHandler();
  //   await nsoap(app, "defaultFunction(10,20)", [], { index: "index" }, handler.then);
  //   handler.getResult().should.equal(30);
  // });
});
//# sourceMappingURL=test.js.map