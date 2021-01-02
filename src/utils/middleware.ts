export type Middleware<T> = (context: T, next: (err?: any) => Promise<void>) => Promise<void>

/**
 * Run middlewares with given context.
 * @see https://github.com/koajs/compose/blob/master/index.js
 *
 * @param middleware
 * @param context
 */
export function runMiddlewares<T>(middleware: Middleware<T>[], context: T): Promise<void> {
    // last called middleware #
    let index = -1;
    return dispatch(0);

    function dispatch(i: number, err?: Error): Promise<void> {
        if (err) return Promise.reject(err);
        if (i <= index) return Promise.reject(new Error('next() called multiple times'));
        index = i;
        const fn = middleware[i];
        if (!fn) return Promise.resolve();
        try {
            return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
        } catch (err) {
            return Promise.reject(err);
        }
    }
}
