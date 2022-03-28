"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const Logging_1 = __importDefault(require("./library/Logging"));
const Author_1 = __importDefault(require("./routes/Author"));
const Book_1 = __importDefault(require("./routes/Book"));
const router = (0, express_1.default)();
/**  CONNECT TO MONGOOSE **/
mongoose_1.default.connect(config_1.config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
    Logging_1.default.info('Connected to MongoDB Atlas');
    serverStart();
})
    .catch((error) => {
    Logging_1.default.error('Unable to connect');
    Logging_1.default.error(error);
});
/** Only start the serve if Mongo Connects */
const serverStart = () => {
    router.use((req, res, next) => {
        /** Log the Request  */
        Logging_1.default.info(`Incoming -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`);
        res.on('finish', () => {
            /** Log the Response  */
            Logging_1.default.info(`Outgoing -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`);
        });
        next();
    });
    router.use(express_1.default.urlencoded({ extended: true }));
    router.use(express_1.default.json());
    /**
        Define the Rules of the API
    */
    router.use((req, res, next) => {
        //In  production enviroment have your routed predifined
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method == 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST PUT');
            return res.status(200).json({});
        }
        next();
    });
    /** Routes */
    router.use('/authors', Author_1.default);
    router.use('/books', Book_1.default);
    /** Healthcheck */
    router.get('/ping', (req, res, next) => res.status(200).json({ message: 'API working' }));
    /** Error Handling */
    router.use((req, res, next) => {
        const error = new Error('not found');
        Logging_1.default.error(error);
        return res.status(404).json({ message: error.message });
    });
    http_1.default.createServer(router).listen(config_1.config.server.port, () => Logging_1.default.info(`Server is running on port ${config_1.config.server.port}`));
};
