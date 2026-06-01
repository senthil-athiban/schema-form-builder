import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: '*'}));
app.use(express.json());
app.post('/webhook', (req, res) => {
    console.log('req.body', req.body);
});

app.listen(4001, () => console.log('Webhook started'));