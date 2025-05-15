import { z } from "zod";

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Username is required" })
    .max(100, { message: "Username is too long" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password is too long" }),
});

/**
 * Type definitions based on the schemas
 */
export type LoginFormValues = z.infer<typeof loginSchema>;

