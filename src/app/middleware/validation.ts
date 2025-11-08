import type { output, ZodSafeParseResult, ZodType } from "zod";

export function validateBody<TSchema extends ZodType>(
  schema: TSchema,
  body: unknown,
): ZodSafeParseResult<output<TSchema>> {
  return schema.safeParse(body);
}

// export const validateparams = (schema: ZodSchema) => {
//   try {
//     schema.parse(req.params);
//     next();
//   } catch (e) {
//     if (e instanceof ZodError) {
//       return res.status(400).json({
//         error: 'Invalid params',
//         details: e.issues.map((error) => ({
//           field: error.path.join('.'),
//           message: error.message,
//         })),
//       });
//     }
//     next(e);
//   }
// };

// export const validateQuery = (schema: ZodSchema) => {
//   try {
//     schema.parse(req.query);
//     next();
//   } catch (e) {
//     if (e instanceof ZodError) {
//       return res.status(400).json({
//         error: 'Invalid query',
//         details: e.issues.map((error) => ({
//           field: error.path.join('.'),
//           message: error.message,
//         })),
//       });
//     }
//     next(e);
//   }
// };
