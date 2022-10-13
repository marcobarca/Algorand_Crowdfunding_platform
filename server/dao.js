'use strict';

const db = require('./db');

exports.createTxn = (name, account, txn) => {
	return new Promise((resolve, reject) => {
		const sql = `INSERT INTO tmpTxn(name, account, txn)VALUES(?,?,?)`;
		db.run(sql, [
			name,
			account,
            txn
		], function (err) {
			if (err) {
                console.log(err)
				reject(err);
				return;
			}
			resolve(this.lastID);
		});
	});
};


exports.getTxn = (account, name) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT txn FROM tmpTxn WHERE account = '" + account + "' AND name = '" + name + "'";
		db.get(sql, function (err, row) {
			if (err) {
				reject(err);
				return;
			}
			resolve(row);
		});
	});
};