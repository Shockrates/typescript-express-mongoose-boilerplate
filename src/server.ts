import { config } from './config/config';
import express, { urlencoded } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import Logging from './library/Logging';
import authorRoutes from './routes/Author';
import bookRoutes from './routes/Book';

const router = express();

/**  CONNECT TO MONGOOSE **/

mongoose.connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
        Logging.info('Connected to MongoDB Atlas');
        serverStart();

    })
    .catch((error) => {
        Logging.error('Unable to connect');
        Logging.error(error);

    })

/** Only start the serve if Mongo Connects */
const serverStart = () => {
    router.use((req, res, next) => {
        /** Log the Request  */
        Logging.info(`Incoming -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

        res.on('finish', () => {
            /** Log the Response  */
            Logging.info(`Outgoing -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`);
        });

        next();
    });

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

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
    router.use('/authors', authorRoutes);
    router.use('/books', bookRoutes);

    /** Healthcheck */
    router.get('/ping', (req, res, next) => res.status(200).json({ message: 'API working' }));

    /** Error Handling */
    router.use((req, res, next) => {
        const error = new Error('not found');
        Logging.error(error);

        return res.status(404).json({ message: error.message });
    });


    http.createServer(router).listen(config.server.port, () => Logging.info(`Server is running on port ${config.server.port}`));

}