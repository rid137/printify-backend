import colors from "colors";
import { Request, Response, NextFunction } from "express";

const logger = (req: Request, res: Response, next: NextFunction) => {
    const methodColor: { [key: string]: keyof typeof colors } = {
        GET: 'green',
        POST: 'blue',
        PUT: 'yellow',
        DELETE: 'red'
    };

    const color = methodColor[req.method] || 'white';

    // @ts-ignore
    console.log(colors[color](`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`));

    next();
};

export default logger;