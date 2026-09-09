import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import express, { type NextFunction, type Request, type Response } from "express";
import { validateQuery } from "../src/middlewares/validate.middleware.js";
import { listPaginationQuerySchema } from "../src/validations/common.schema.js";
import { userOrdersQuerySchema } from "../src/validations/order.schema.js";
import { transactionFilterQuerySchema } from "../src/validations/transaction.schema.js";
import CustomError from "../src/utils/error/customError.js";

/**
 * Mirrors Express 5: `req.query` is a getter-only property. Direct assignment
 * throws TypeError: Cannot set property query of #<IncomingMessage> which has only a getter
 */
function createGetterOnlyQueryRequest(query: Record<string, unknown>): Request {
  const req = { body: {}, params: {} } as Request;
  Object.defineProperty(req, "query", {
    configurable: true,
    enumerable: true,
    get() {
      return query;
    },
  });
  return req;
}

function assignQuery(req: Request, value: unknown): void {
  (req as unknown as { query: unknown }).query = value;
}

function run(
  schema: Parameters<typeof validateQuery>[0],
  req: Request
): { error: unknown; threw: unknown } {
  const res = {} as Response;
  let error: unknown;
  const next: NextFunction = (err?: unknown) => {
    error = err;
  };

  let threw: unknown;
  try {
    validateQuery(schema)(req, res, next);
  } catch (caught) {
    threw = caught;
  }

  return { error, threw };
}

describe("Express 5 query validation", () => {
  it("fixture req.query is getter-only and rejects assignment", () => {
    const req = createGetterOnlyQueryRequest({ page: "1", size: "20" });
    assert.throws(
      () => assignQuery(req, { page: 1, size: 20 }),
      (error: unknown) =>
        error instanceof TypeError &&
        /Cannot set property query/i.test(error.message)
    );
  });

  it("does not throw when validating getter-only query (page/size)", () => {
    const req = createGetterOnlyQueryRequest({ page: "1", size: "20" });
    const { error, threw } = run(userOrdersQuerySchema, req);

    assert.equal(threw, undefined);
    assert.equal(error, undefined);
    assert.equal(req.query.page, 1);
    assert.equal(req.query.size, 20);
  });

  it("applies pagination defaults without replacing via assignment", () => {
    const req = createGetterOnlyQueryRequest({});
    const { error, threw } = run(listPaginationQuerySchema, req);

    assert.equal(threw, undefined);
    assert.equal(error, undefined);
    assert.equal(req.query.page, 1);
    assert.equal(req.query.size, 20);
  });

  it("rejects invalid page and size", () => {
    const badPage = createGetterOnlyQueryRequest({ page: "0", size: "20" });
    const pageResult = run(userOrdersQuerySchema, badPage);
    assert.equal(pageResult.threw, undefined);
    assert.ok(pageResult.error instanceof CustomError);
    assert.equal(pageResult.error.statusCode, 400);
    // Failed validation must not redefine the getter (no partial mutation).
    assert.throws(
      () => assignQuery(badPage, { page: 1 }),
      (error: unknown) =>
        error instanceof TypeError &&
        /Cannot set property query/i.test(error.message)
    );

    const badSize = createGetterOnlyQueryRequest({ page: "1", size: "101" });
    const sizeResult = run(userOrdersQuerySchema, badSize);
    assert.equal(sizeResult.threw, undefined);
    assert.ok(sizeResult.error instanceof CustomError);
    assert.equal(sizeResult.error.statusCode, 400);
  });

  it("accepts exact transaction status enum and rejects regex filters", () => {
    const ok = createGetterOnlyQueryRequest({
      page: "1",
      size: "10",
      status: "pending",
    });
    const okResult = run(transactionFilterQuerySchema, ok);
    assert.equal(okResult.threw, undefined);
    assert.equal(okResult.error, undefined);
    assert.equal(ok.query.status, "pending");

    const success = createGetterOnlyQueryRequest({ status: "success" });
    const successResult = run(transactionFilterQuerySchema, success);
    assert.equal(successResult.threw, undefined);
    assert.equal(successResult.error, undefined);
    assert.equal(success.query.status, "success");

    const regex = createGetterOnlyQueryRequest({ status: ".*" });
    const regexResult = run(transactionFilterQuerySchema, regex);
    assert.equal(regexResult.threw, undefined);
    assert.ok(regexResult.error instanceof CustomError);
    assert.equal(regexResult.error.statusCode, 400);

    const injection = createGetterOnlyQueryRequest({
      status: "success|pending",
    });
    const injectionResult = run(transactionFilterQuerySchema, injection);
    assert.equal(injectionResult.threw, undefined);
    assert.ok(injectionResult.error instanceof CustomError);
    assert.equal(injectionResult.error.statusCode, 400);
  });
});

describe("Express 5 query validation over HTTP", () => {
  const app = express();
  app.get("/orders", validateQuery(userOrdersQuerySchema), (req, res) => {
    res.json({ page: req.query.page, size: req.query.size, status: req.query.status });
  });
  app.get("/transactions", validateQuery(transactionFilterQuerySchema), (req, res) => {
    res.json({ page: req.query.page, size: req.query.size, status: req.query.status });
  });
  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  });

  const server = app.listen(0);
  before(
    () =>
      new Promise<void>((resolve) => {
        if (server.listening) {
          resolve();
          return;
        }
        server.once("listening", () => resolve());
      })
  );
  after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );

  const origin = () => {
    const address = server.address() as AddressInfo;
    return `http://127.0.0.1:${address.port}`;
  };

  it("serves validated page/size without mutating getter-only req.query", async () => {
    const response = await fetch(`${origin()}/orders?page=1&size=20`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { page: 1, size: 20 });
  });

  it("rejects invalid page, size, and non-enum status over HTTP", async () => {
    const badPage = await fetch(`${origin()}/orders?page=0&size=20`);
    assert.equal(badPage.status, 400);

    const badSize = await fetch(`${origin()}/orders?page=1&size=101`);
    assert.equal(badSize.status, 400);

    const regexStatus = await fetch(`${origin()}/transactions?status=.*`);
    assert.equal(regexStatus.status, 400);

    const okStatus = await fetch(`${origin()}/transactions?page=1&size=10&status=success`);
    assert.equal(okStatus.status, 200);
    assert.deepEqual(await okStatus.json(), { page: 1, size: 10, status: "success" });
  });
});
