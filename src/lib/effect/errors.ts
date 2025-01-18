import { ParseError } from 'effect/ParseResult';

export class BaseEffectError extends Error {
  originalTag: string | undefined;

  constructor(e: unknown) {
    if (typeof e === 'string') {
      super(e);
    } else if (e instanceof Error) {
      super(e.message, { cause: (e?.cause as any)?.message || e.cause });
      Error.captureStackTrace(this, this.constructor);
    } else {
      super(String(e));
    }
  }

  toJSON() {
    return {
      _tag: '_tag' in this ? this._tag : '',
      message: this.message,
      ...(this.originalTag ? { originalTag: this.originalTag } : {}),
    };
  }

  toString() {
    return `${'_tag' in this ? this._tag : ''}: ${this.message} ${
      this.cause ? `cause: ${this.cause}` : ''
    }`;
  }
}

export class GenericError extends BaseEffectError {
  readonly _tag = 'GenericError';
}
/**
 * Error thrown by the JSON.parse() call
 */
export class InvalidJSONError extends BaseEffectError {
  readonly _tag = 'InvalidJSONError';
}

export class UnimplementedPathError extends BaseEffectError {
  readonly _tag = 'UnimplementedPathError';
}

export class SQLExecutionError extends BaseEffectError {
  readonly _tag = 'SQLExecutionError';
}

export class MappingError extends BaseEffectError {
  readonly _tag = 'MappingError';
}

export class OnChainExecutionError extends BaseEffectError {
  readonly _tag = 'OnChainExecutionError';
}

//
//// HTTP ERRORS
///
export class UnauthorizedError extends BaseEffectError {
  readonly _tag = 'UnauthorizedError';
}

export class BadRequestError extends BaseEffectError {
  readonly _tag = 'BadRequestError';
}

export class NotFoundError extends BaseEffectError {
  readonly _tag = 'NotFoundError';
}

export class DripServerError extends BaseEffectError {
  readonly _tag = 'DripServerError';
  originalTag: string | undefined;

  constructor(e: unknown) {
    super(e);
    if (
      typeof e === 'object' &&
      e !== null &&
      '_tag' in e &&
      typeof e._tag === 'string'
    )
      this.originalTag = e._tag;
  }
}

/**
 * Errors that can be thrown by an HTTP route handler.
 * @example 404, 400, 500
 */
export type HTTPRouteHandlerErrors =
  | ParseError
  | BadRequestError
  | NotFoundError
  | UnauthorizedError
  | DripServerError;

//
//// 1-liner functions
//

export const genericError = (message: string | Error | unknown) => {
  throw new GenericError(message);
};

export const mappingError = (message: string | Error | unknown) => {
  throw new MappingError(message);
};
