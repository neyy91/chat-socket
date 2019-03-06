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

function createToken(body) {
	return jwt.sign(
		body,
		config.jwt.secretOrKey, {
			expiresIn: config.expiresIn
		}
	);
}


// token : user <access_token>

function verifyToken(req, res, next) {
	let userHeader = req.headers['authorization']

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

function addToCash(data) {
	return new Promise((resolve, reject) => {
		try{
			resolve(cache.add(data.user, JSON.stringify(data)))
		} catch(e) {
			reject(e)
		}
		
	})
}

function getUpdate(userRequest, blockStatus, userChange) {
	return new Promise(resolve => {
		cache.get(userRequest, function (error, entries) {
			if (error) {
				console.log("error change blockStauts", error)
			}
			if (entries[0] && entries[0] && entries[0].body) {

				let body = typeof (entries[0].body) == 'string' ? JSON.parse(entries[0].body) : entries[0].body

				if (!body.blockList) {
					body.blockList = []
				}
				let index = body.blockList.indexOf(userChange)


				if (blockStatus == 'true') {
					if (index == -1) {

						body.blockList.push(userChange)
					}

				} else {
					if (index != -1) {

						body.blockList.splice(index, 1)
					}
				}

				resolve(body)

			} else {

				// console.log("not in cash info", entries[0])
				var blockList = []
				if (blockStatus == 'true') {
					blockList.push(userChange)
				}

				resolve({
					user: userRequest,
					blockList: blockList
				})

			}

		})
	})
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

		this.app.post('/changeStatusBlock', verifyToken, async (request, response) => {
			let userRequest = request.body.currentUser
			let dataChange = {
				from: userRequest,
				to: request.body.userChange,
				blockStatus: request.body.blockStatus == 'true' ? 1 : 0
			}

			let textAlert = 'change status ' + (request.body.blockStatus == 'true' ? 'block : ' : 'unblock : ') + request.body.userChange
			try {
				await helper.changeStatusBlock(dataChange)
				try {
					// let updateBody = await getUpdate(userRequest, request.body.blockStatus, request.body.userChange)
					// let newCashInfo = await addToCash(updateBody)
				} catch (e) {
					console.log(e)
				}

				response.status(200).json({
					error: false,
					message: textAlert
				});
			} catch (e) {
				response.status(403).json({
					error: true,
					message: textAlert
				});
			}
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
			if (data.username === '' || data.username === 'all') {
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
					regRes.message = result.insertId + `<<<---was registr. Now, please sign in`;
					response.status(200).json(regRes);

					// response.sendFile(path.join(__dirname + '/client/views/auth.html'));
				}
			}
		});

		this.app.post('/login', verifyToken, async (request, response) => {
			// console.log("---auth----", request.headers['authorization'])
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
					loginRes.userId = request.body.username;
					loginRes.message = `User logged in.`;
					loginRes.url = path.join(__dirname + '/client/views/auth.html');


					const token = createToken({
						id: result[0].id,
						username: request.body.username
					});


					response.cookie('token', token, {
						httpOnly: true
					});

					loginRes.token = token
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

		this.app.get('/', (req, res) => {
			res.sendFile(path.join(__dirname + '/client/views/unauth.html'));
		});

		this.app.post('/logout', (req, res) => {
			res.clearCookie('token');
			// res.status(200).send({message: "Logout success."});
			res.sendFile(path.join(__dirname + '/client/views/unauth.html'));
		})

	}

	routesConfig() {
		this.appRoutes();
	}
}
module.exports = Routes;