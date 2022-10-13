const express = require('express');
const { check, validationResult } = require('express-validator');
const port = 3001;
app = new express();
const algosdk = require('algosdk');
const bp = require('body-parser');
const {createApp} = require('./ContractOperations');
const { send } = require('express/lib/response');
const dao = require('./dao');

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

//algodClient, accountContext, goal, durationInSeconds
app.post('/api/createApp', [
    // check('name').notEmpty(),
    // check('token').notEmpty(),
    // check('account').notEmpty(),
    // check('goal').notEmpty(),
    // check('durationInSeconds').notEmpty(),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    let txn = null
    try {
     txn = await createApp(req.body.token, req.body.port, req.body.account, req.body.goal, req.body.durationInSeconds)
    } catch (err) {
      res.status(503).json({ error: `Error during the creation of the project.` });
    }
    try {
        await dao.createTxn(req.body.name, req.body.account, txn) //txn.result
        res.status(201).end();
      } catch (err) {
        res.status(503).json({ error: `Database error during the creation of the txn.` });
      }

  });

  app.get('/api/createApp', async (req, res) => {
    try {
    let txn =  await dao.getTxn(req.query.account, req.query.name)
      res.json(txn);
    } catch (err) {
      res.status(500).end();
    }
  });


app.listen(port, () => {
  console.log(`react-server listening at http://localhost:${port}`);
});

