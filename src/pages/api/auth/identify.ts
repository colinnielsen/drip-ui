import { EffectfulApiRoute } from '@/lib/effect/next-api';
import { validateHTTPMethod } from '@/lib/effect/validation';
import { authenticationService } from '@/services/AuthenticationService';
import { Effect, pipe } from 'effect';
import { NextApiRequest, NextApiResponse } from 'next';

export default EffectfulApiRoute(function identify(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const routePipeline = pipe(
    // Start with request
    req,
    // Validate HTTP method
    validateHTTPMethod('GET'),
    // Get tokens from cookies and attempt authentication
    Effect.andThen(req => authenticationService.checkAuthentication(req, res)),
    // return the user
    Effect.andThen(user => Effect.succeed(res.status(200).json(user))),
    // catch any unauthorized errors and actually succeed with them (see EffectfulApiRoute)
    Effect.catchTag('UnauthorizedError', e =>
      Effect.succeed(res.status(401).json(e.message)),
    ),
  );

  return routePipeline;
}, 'auth/identify');
