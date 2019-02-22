
'use strict';

const helper = require('./dbEvents');
const path = require('path');

// const passport = require('passport');
// const jwt = require('jsonwebtoken');

// function checkAuth (req, res, next) {
//     passport.authenticate('jwt', { session: false }, (err, decryptToken, jwtError) => {
//         if(jwtError != void(0) || err != void(0)) return res.render('index.html', { error: err || jwtError});
//         req.user = decryptToken;
//         next();
//     })(req, res, next);
// }

// function createToken (body) {
//     return jwt.sign(
//         body,
//         config.jwt.secretOrKey,
//         {expiresIn: config.expiresIn}
//     );
// }


class Routes{

	constructor(app){

		this.app = app;
	}
	
	appRoutes(){
		this.app.post('/usernameCheck',async (request,response) =>{
			const username = request.body.username;
			if (username === "" || username === undefined || username === null) {
				response.status(412).json({
					error : true,
					message : `username must required `
				});
			} else {
				const data = await helper.userNameCheck(username.toLowerCase());
				if (data[0]['count'] > 0) {
					response.status(401).json({
						error:true,
						message: 'plagiat!'
					});
				} else {
					response.status(200).json({
						error:false,
						message: 'good user name'
					});
				}
			}
		});		

		this.app.post('/registerUser', async (request,response) => {
			const regRes = {}
			const data = {
				username : (request.body.username).toLowerCase(),
				password : request.body.password
			};			
			if(data.username === '') {
	            regRes.error = true;
	            regRes.message = `username required`;
	            response.status(412).json(regRes);
	        }else if(data.password === ''){				            
	            regRes.error = true;
	            regRes.message = `password required`;
	            response.status(412).json(regRes);
	        }else{	        	
				const result = await helper.registerUser( data );
				if (result === null) {
					regRes.error = true;
					regRes.message = `error register`;
					response.status(417).json(regRes);
				} else {
					regRes.error = false;
					regRes.userId = result.insertId;
					regRes.message = result.insertId + `<<<---was registr OK`;
					response.status(200).json(regRes);
				}
	        }
		});

		this.app.post('/login',async (request,response) =>{
			const loginRes = {}
			const data = {
				username : (request.body.username).toLowerCase(),
				password : request.body.password
			};
			if(data.username === '' || data.username === null) {
	            loginRes.error = true;
	            loginRes.message = `username required`;
	            response.status(412).json(loginRes);
	        }else if(data.password === '' || data.password === null){				            
	            loginRes.error = true;
	            loginRes.message = `password required`;
	            response.status(412).json(loginRes);
	        }else{
				const result = await helper.loginUser(data);
				if (result === null || result.length === 0) {
					loginRes.error = true;
					loginRes.message = `Invalid username and password combination.`;
					response.status(401).json(loginRes);
				} else {
					loginRes.error = false;
					loginRes.userId = result[0].id;
					loginRes.message = `User logged in.`;
					response.status(200).json(loginRes);
				}
	        }
		});
		
		this.app.post('/userSessionCheck', async (request,response) =>{
            
            //need update to check in redis

			const userId = request.body.userId;
			const sessionCheckResponse = {}			
			if (userId == '') {
				sessionCheckResponse.error = true;
	            sessionCheckResponse.message = `User Id cant be empty.`;
	            response.status(412).json(sessionCheckResponse);
			}else{
				const username = await helper.userSessionCheck(userId);
				if (username === null || username === '') {
					sessionCheckResponse.error = true;
					sessionCheckResponse.message = `User is not logged in.`;
					response.status(401).json(sessionCheckResponse);
				}else{
					sessionCheckResponse.error = false;
					sessionCheckResponse.username = username;
					sessionCheckResponse.message = `User logged in.`;
					response.status(200).json(sessionCheckResponse);
				}
	        }
		});
		
		this.app.post('/getMessages',async (request,response) => {
			const userId = request.body.userId;
			const toUserId = request.body.toUserId;
			const messages = {}			
			if (userId === '') {
				messages.error = true;
	            messages.message = `userId cant be empty.`;
	            response.status(200).json(messages);
			}else{
				const result = await helper.getMessages( userId, toUserId);
				if (result ===  null) {
					messages.error = true;
					messages.message = `Internal Server error.`;
					response.status(500).json(messages);
				}else{
					messages.error = false;
					messages.messages = result;
					response.status(200).json(messages);
				}
	        }
		});
		
		this.app.get('*',(request,response) =>{
            // response.sendFile(path.join(__dirname + '../../client/views/index.html'));
            response.sendFile(path.join(__dirname + '/index.html'));
			
		});		
	}

	routesConfig(){
		this.appRoutes();
	}
}
module.exports = Routes;