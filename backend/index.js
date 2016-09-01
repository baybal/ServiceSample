#!/usr/bin/env node

const port = 1337;
const http = require('http');
const url = require('url');
const server = http.createServer(router);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('mydb.db');
const multiparty = require('multiparty');
const uuid = require('uuid');
var route = {};
route["/"] = auth;
route["/token"] = getToken;
var debug = true;
var debugListeners = ['connection', 'message', 'request', 'close', 'aborted', 'abort', 'continue', 'response', 'connect'];
var output = {};

function router(req, res) {
	debug && function() {
		console.log("Request for " + req.url + " received." + '\n' + req.headers);
		debugListeners.forEach((e) => {
			res.addListener(e, () => {
				console.log(e);
			});
		});
	};
	if(typeof route[url.parse(req.url).pathname] === 'function') {
		route[url.parse(req.url).pathname](req, res);
		debug && console.log('Routed to ' + route[url.parse(req.url).pathname].name);
	} else {
		output.code = 404;
		output.outcome = 'Not found';
		finish(res);
	}
}

function auth(req, res) {
	if(!req.headers['authtoken']) {
		debug && console.log('No "authtoken" header present');
		output.code = 403;
		output.outcome = 'Unauthorised';
		finish(res);
	} else {
		db.get("SELECT tokens FROM auth_tokens WHERE tokens = ?", req.headers['authtoken'], (err, row) => {
			err&&console.err('SQLite error: ' + err);
			debug && !row ? console.log('Token not found') : console.log('Token found');
			if(!row) {
				output.code = 403;
				output.outcome = 'Unauthorised';
				finish(res);
			} else {
				list(req, res);
			}
		});
	}
}

function list(req, res) {
	if(req.method == "POST" && req.headers['content-type'].startsWith('multipart/form-data')) {
		var form = new multiparty.Form();
		try {
			if(debug) {
				console.log("Parsing multipart");
			}
			form.parse(req, (err, keys) => {
				if(!keys.method) {
					output.outcome = 'Method undefined';
					output.code = 500;
				} else if(err) {
					parsingErrorParser(err, req);
				} else {
					console.log('method \n' + keys.method);
					switch(keys.method.toString()) {
						case 'write':
							if(!keys.key) {
								db.run("INSERT INTO 'todo_list' VALUES(?)", keys.value);
								output.code = 200;
								output.outcome = 'Entry written';
							} else if(!keys.value) {
								output.outcome = 'Method argument absent';
								output.code = 500;
							} else {
								db.run("UPDATE todo_list SET info = ? WHERE ROWID = ?", keys.value[0], keys.key[0]);
								output.code = 200;
								output.outcome = 'Entry updated';
							}
							break;
						case 'delete':
							output.code = 200;
							console.log(keys.key);
							output.outcome = 'Entry with key ' + keys.key + ' deleted';
							//I still need to add a check to see if the value given does exist prior to deletion
							db.run("DELETE FROM 'todo_list' WHERE ROWID = ?", keys.key[0]);
							break;
						default:
							output.code = 500;
							output.outcome = 'Method not found';
					}
				}
				finish(res);
			});
		} catch(err) {
			//yet again, here should've been a proper exception handler
			parsingErrorParser(err, req);
		}
		return;
	} else {
		output.outcome = 'Sending TODO';
		output.code = 200;
		db.each("SELECT rowid AS id, info FROM todo_list", (err, row) => {
			output[row.id] = row.info;
			//			!err&&parsingErrorParser.call(this, req, res);
		}, () => {
			finish(res);
		});
	}
}

function getToken(req, res) {
	var token = uuid.v4();
	db.run("INSERT INTO 'auth_tokens' VALUES(?)", token);
	output.code = 200;
	output.outcome = 'Token granted';
	output.token = token;
	finish(res);
}

function parsingErrorParser(err, req) {
	output.code = 500;
	output.outcome = 'Multipart parser went belly up, trying to parse parser errors' + '\n' + err + '\n';
	finish.res;
}

function finish(res) {
	!output.code && function() {
		output = {
			'code': 500,
			'outcome': 'General error'
		};
	}();
	debug && console.log(output);
	res.statusCode = output.code;
	res.statusMessage = output.outcome;
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');			
	res.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type')
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.write(JSON.stringify(output));
	res.end();
	output = {
		'code': 500,
		'outcome': null
	};
}
db.run("CREATE TABLE if not exists todo_list (info TEXT)");
db.run("CREATE TABLE if not exists auth_tokens (tokens TEXT)");
server.listen(port);
console.log('Server running at http://localhost:' + port + '/');

