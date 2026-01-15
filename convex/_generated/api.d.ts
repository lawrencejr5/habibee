/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as feedback from "../feedback.js";
import type * as habits from "../habits.js";
import type * as http from "../http.js";
import type * as motivationa_messages from "../motivationa_messages.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as weekly_stats from "../weekly_stats.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  feedback: typeof feedback;
  habits: typeof habits;
  http: typeof http;
  motivationa_messages: typeof motivationa_messages;
  users: typeof users;
  utils: typeof utils;
  weekly_stats: typeof weekly_stats;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
