import express from 'express';
import path from 'path';
import router from './routers/router';
import log from './lib/logger';

const app = express();

import './config/passport';

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log(`Listening on port: ${PORT}`);
});
