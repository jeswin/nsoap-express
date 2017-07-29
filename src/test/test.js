import nsoap from "../nsoap-express";
import should from "should";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";

const routes = {
  index() {
    return "Home page!";
  },
  about() {
    return "NSOAP Test Suite";
  },
  static: "NSOAP Static File",
  unary(arg) {
    return arg + 10;
  },
  binary(x, y) {
    return x + y;
  },
  namespace: {
    binary(x, y) {
      return x + y;
    }
  },
  nested: {
    namespace: {
      binary(x, y) {
        return x + y;
      }
    }
  },
  json(input) {
    return input.x + 20;
  },
  throw(a) {
    throw new Error("Exception!");
  },
  chainAdder1(x) {
    return {
      chainAdder2(y) {
        return x + y;
      }
    };
  },
  infer(_bool, _num, _str) {
    return {
      _bool,
      _num,
      _str
    };
  },
  promiseToAdd(x, y) {
    return Promise.resolve(x + y);
  },
  functionOnPromise(x, y) {
    return Promise.resolve({
      adder(z) {
        return x + y + z;
      }
    });
  },
  defaultFunction(x, y) {
    return {
      index() {
        return x + y;
      }
    };
  }
};

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(nsoap(routes));

//app.get("/about", (req, res) => res.send("Hello"))

describe("NSOAP Express", () => {
  it("Calls a parameter-less function", async () => {
    const resp = await request(app).get("/about");
    resp.text.should.equal("NSOAP Test Suite");
  });

  it("Gets the value of a property", async () => {
    const resp = await request(app).get("/static");
    resp.text.should.equal("NSOAP Static File");
  });

  it("Calls a unary function", async () => {
    const resp = await request(app).get("/unary(10)");
    resp.body.should.equal(20);
  });

  it("Throws an exception", async () => {
    const resp = await request(app).get("/throw(10)");
    resp.status.should.equal(400);
    resp.error.should.not.be.empty();
  });

  it("Calls a binary function", async () => {
    const resp = await request(app).get("/binary(10,20)");
    resp.body.should.equal(30);
  });

  it("Calls a unary function with variables", async () => {
    const resp = await request(app).get("/unary(x)?x=20");
    resp.body.should.equal(30);
  });

  it("Calls a binary function with variables", async () => {
    const resp = await request(app).get("/binary(x,y)?x=10&y=20");
    resp.body.should.equal(30);
  });

  it("Calls a binary function with literals and variables", async () => {
    const resp = await request(app).get("/binary(x,20)?x=10");
    resp.body.should.equal(30);
  });

  it("Calls a binary function in a namespace", async () => {
    const resp = await request(app).get("/namespace.binary(10,20)");
    resp.body.should.equal(30);
  });

  it("Calls a binary function in a nested namespace", async () => {
    const resp = await request(app).get("/nested.namespace.binary(10,20)");
    resp.body.should.equal(30);
  });

  // it("Accepts stringified JSON arguments in querystring", async () => {
  //   const data = JSON.stringify({ obj: { x: 10 } });
  //   const resp = await request(app).post("/json(obj)").send(data);
  //   resp.body.should.equal(30);
  // });

  it("Accepts JSON arguments in body", async () => {
    const resp = await request(app).post("/json(obj)").send({ obj: { x: 10 } });
    resp.body.should.equal(30);
  });

  it("Adds parenthesis if omitted", async () => {
    const resp = await request(app).get("/about");
    resp.text.should.equal("NSOAP Test Suite");
  });

  it("Calls the default function", async () => {
    const resp = await request(app).get("/");
    resp.text.should.equal("Home page!");
  });

  it("Calls chained functions", async () => {
    const resp = await request(app).get("/chainAdder1(10).chainAdder2(20)");
    resp.body.should.equal(30);
  });

  it("Infers types", async () => {
    const resp = await request(app).get("/infer(true, 20, Hello)");
    resp.body._bool.should.equal(true);
    resp.body._num.should.equal(20);
    resp.body._str.should.equal("Hello");
  });

  // it("Is Case-sensitive", async () => {
  //   const resp = await request(app).get("/unary(x)");
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
