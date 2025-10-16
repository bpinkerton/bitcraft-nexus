/**
 * Shared Types Package
 *
 * This package contains common TypeScript types and interfaces
 * used across both the web application and Discord bot.
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
//# sourceMappingURL=index.d.ts.map