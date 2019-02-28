'use strict';

const helper = require('./dbEvents');
const path = require('path');

const passport = require('passport');
const jwt = require('jsonwebtoken');

var cache = require('express-redis-cache')({
	client: require('redis').createClient()
})


var bodyParser = require('body-parser');


const config = require('./config');
function createToken (body) {
    return jwt.sign(
        body,
        config.jwt.secretOrKey,
        {expiresIn: config.expiresIn}
    );
}


// token : user <access_token>

function verifyToken(req, res, next) {
	let userHeader = req.headers['authorization']
console.log("-----------------userHeader----------------",userHeader)
	if (typeof userHeader !== 'undefined') {

		let userus = userHeader.split(' ');
		//check redis
		cache.get(userus[0], function (error, entries) {

			if (error) {
				res.sendStatus(403);
			}

			let userToken = userus[1];

			req.token = userToken

			next()

		});

	} else {
		res.sendStatus(403);
	}

}


class Routes {

	constructor(app) {

		this.app = app;
		this.cache = cache

		this.app.use(bodyParser.json()); // support json encoded bodies
		this.app.use(bodyParser.urlencoded({
			extended: true
		})); // support encoded bodies
	}

	appRoutes() {

		////to check middlewar token
		this.app.post('/api/posts', verifyToken, (req, res) => {
			jwt.verify(req.token, 'secretKey', (err, authData) => {
				if (err) {
					res.sendStatus(403)
				} else {
					res.json({
						message: 'Post created.....',
						authData
					});
				}
			})

		})
		////!get token
		this.app.post('/api/token', (req, res) => {

			const user = {
				id: 1,
				userName: "Lex",
				email: "lex@gmail.com"
			}

			jwt.sign({
				user
			}, 'secretKey', {
				expiresIn: '1h'
			}, (err, token) => {

				this.cache.add(user.userName, JSON.stringify({
						user: user.userName,
						token: token
					}), {
						expire: 60 * 60 * 24,
						type: 'json'
					},
					function (error, added) {

						res.json({
							token
						})
					});
			})

		})


		this.app.post('/usernameCheck', async (request, response) => {
			const username = request.body.username;
			if (username === "" || username === undefined || username === null) {
				response.status(412).json({
					error: true,
					message: `username must required `
				});
			} else {
				const data = await helper.userNameCheck(username.toLowerCase());
				if (data[0]['count'] > 0) {
					response.status(401).json({
						error: true,
						message: 'plagiat!'
					});
				} else {
					response.status(200).json({
						error: false,
						message: 'good user name'
					});
				}
			}
		});

		this.app.post('/register', async (request, response) => {
			const regRes = {}

			const data = {
				username: (request.body.username).toLowerCase(),
				password: request.body.password
			};
			if (data.username === '') {
				regRes.error = true;
				regRes.message = `username required`;
				response.status(412).json(regRes);
			} else if (data.password === '') {
				regRes.error = true;
				regRes.message = `password required`;
				response.status(412).json(regRes);
			} else {
				const result = await helper.registerUser(data);
				if (result === null) {
					regRes.error = true;
					regRes.message = `error register`;
					response.status(417).json(regRes);
				} else {
					regRes.error = false;
					regRes.userId = result.insertId;
					regRes.message = result.insertId + `<<<---was registr OK`;
					response.status(200).json(regRes);

					// response.sendFile(path.join(__dirname + '/client/views/auth.html'));
				}
			}
		});

		this.app.post('/login',verifyToken ,async (request, response) => {
			console.log("---auth----",request.headers['authorization'])
			const loginRes = {}
			const data = {
				username: (request.body.username).toLowerCase(),
				password: request.body.password
			};
			if (data.username === '' || data.username === null) {
				loginRes.error = true;
				loginRes.message = `username required`;
				response.status(412).json(loginRes);
			} else if (data.password === '' || data.password === null) {
				loginRes.error = true;
				loginRes.message = `password required`;
				response.status(412).json(loginRes);
			} else {
				const result = await helper.loginUser(data);
				if (result === null || result.length === 0) {
					loginRes.error = true;
					loginRes.message = `Invalid username and password combination.`;
					response.status(401).json(loginRes);
				} else {
					loginRes.error = false;
					loginRes.userId = result[0].id;
					loginRes.message = `User logged in.`;
					loginRes.url = path.join(__dirname + '/client/views/auth.html');


					const token = createToken({
						id: result[0].id,
						username: request.body.username
					});
					response.cookie('token', token, {
						httpOnly: true
					});

					

					console.log("main--->>>>",path.join(__dirname + '/client/views/auth.html'))					
					response.status(200).json(loginRes);
				}
			}
		});

		this.app.get('/chat', async (request, response) => {
			
			response.sendFile(path.join(__dirname + '/client/views/auth.html'));
		})



		this.app.post('/userSessionCheck', async (request, response) => {

			//need update to check in redis

			const userId = request.body.userId;
			const sessionCheckResponse = {}
			if (userId == '') {
				sessionCheckResponse.error = true;
				sessionCheckResponse.message = `User Id cant be empty.`;
				response.status(412).json(sessionCheckResponse);
			} else {
				const username = await helper.userSessionCheck(userId);
				if (username === null || username === '') {
					sessionCheckResponse.error = true;
					sessionCheckResponse.message = `User is not logged in.`;
					response.status(401).json(sessionCheckResponse);
				} else {
					sessionCheckResponse.error = false;
					sessionCheckResponse.username = username;
					sessionCheckResponse.message = `User logged in.`;
					response.status(200).json(sessionCheckResponse);
				}
			}
		});

		this.app.post('/getMessages', async (request, response) => {
			const userId = request.body.userId;
			const toUserId = request.body.toUserId;
			const messages = {}
			if (userId === '') {
				messages.error = true;
				messages.message = `userId cant be empty.`;
				response.status(200).json(messages);
			} else {
				const result = await helper.getMessages(userId, toUserId);
				if (result === null) {
					messages.error = true;
					messages.message = `Internal Server error.`;
					response.status(500).json(messages);
				} else {
					messages.error = false;
					messages.messages = result;
					response.status(200).json(messages);
				}
			}
		});
		this.app.get('/', (req, res) => {
			res.sendFile(path.join(__dirname + '/client/views/unauth.html'));
		});

	

		// this.app.get('*', (request, response) => {
		// 	// response.sendFile(path.join(__dirname + '../../client/views/index.html'));
		// 	// response.sendFile(path.join(__dirname + '/index.html'));
		// 	// response.sendFile(path.join(__dirname + '/client/views/index.html'));
		// 	response.sendFile(path.join(__dirname + '/client/views/unauth.html'));
		// });
	}

	routesConfig() {
		this.appRoutes();
	}
}
module.exports = Routes;