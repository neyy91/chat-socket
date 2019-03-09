'user strict';
const DB = require('./db');
var _ = require('lodash');

class Helper {

	constructor(app) {
		this.db = DB;
	}

	async userNameCheck(username) {
		return await this.db.query(`SELECT count(username) as count FROM user WHERE LOWER(username) = ?`, `${username}`);
	}

	async registerUser(params) {
		try {
			return await this.db.query("INSERT INTO user (`username`,`password`,`online`) VALUES (?,?,?)", [params['username'], params['password'], 'Y']);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	async loginUser(params) {
		try {
			return await this.db.query(`SELECT id FROM user WHERE LOWER(username) = ? AND password = ?`, [params.username, params.password]);
		} catch (error) {
			return null;
		}
	}

	async userSessionCheck(userId) {
		try {
			const result = await this.db.query(`SELECT online,username FROM user WHERE id = ? AND online = ?`, [userId, 'Y']);
			if (result !== null) {
				return result[0]['username'];
			} else {
				return null;
			}
		} catch (error) {
			return null;
		}
	}

	async addSocketId(userId, userSocketId) {
		try {
			return await this.db.query(`UPDATE user SET socketid = ?, online= ? WHERE id = ?`, [userSocketId, 'Y', userId]);
		} catch (error) {
			console.log(error);
			return null;
		}
	}

	async isUserLoggedOut(userSocketId) {
		try {
			return await this.db.query(`SELECT online FROM user WHERE socketid = ?`, [userSocketId]);
		} catch (error) {
			return null;
		}
	}

	async logoutUser(userSocketId) {
		return await this.db.query(`UPDATE user SET socketid = ?, online= ? WHERE socketid = ?`, ['', 'N', userSocketId]);
	}

	getAllList() {
		return this.db.query('SELECT id,username,online,socketid FROM user')
	}

	getChatList(userId, userSocketId) {
		try {
			return Promise.all([
				this.db.query(`SELECT id,username,online,socketid FROM user WHERE id = ?`, [userId]),
				this.db.query(`SELECT id,username,online,socketid FROM user WHERE online = ? and socketid != ?`, ['Y', userSocketId])
			]).then((response) => {
				return {
					userinfo: response[0].length > 0 ? response[0][0] : response[0],
					chatlist: response[1]
				};
			}).catch((error) => {
				console.warn(error);
				return (null);
			});
		} catch (error) {
			console.warn(error);
			return null;
		}
	}

	async insertMessages(params) {
		try {
			return await this.db.query(
				"INSERT INTO message (`from_user_id`,`to_user_id`,`message`,`from_block`) values (?,?,?,?)",
				[params.fromUserId, params.toUserId, params.message, params.block_status]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}
	}

	async checkBlockStatus(params) {
		try {

			let checkExist = await this.db.query(`SELECT count(*) as block_status FROM dialogs WHERE LOWER(from_user_id = ? AND to_user_id = ? )`, [params.from, params.to]);

			if (checkExist[0].block_status == 0) {

				return checkExist
			} else {
				return await this.db.query(`SELECT block_status as block_status FROM dialogs WHERE LOWER(from_user_id = ? AND to_user_id = ? )`, [params.from, params.to]);
			}

		} catch (e) {
			console.log(e)
			return null
		}
	}



	async changeStatusBlock(params) {
		try {

			let checkExist = await this.db.query(`SELECT count(*) as count FROM dialogs WHERE LOWER(from_user_id = ? AND to_user_id = ? )`, [params.from, params.to]);

			if (checkExist[0].count == 0) {
				await this.db.query(
					"INSERT INTO dialogs (`from_user_id`,`to_user_id`,`block_status`) values (?,?,?)",
					[params.from, params.to, params.blockStatus]
				)
			} else {
				await this.db.query(
					`UPDATE dialogs SET block_status = ?  WHERE 
					(from_user_id = ? AND to_user_id = ? ) `, [params.blockStatus, params.from, params.to])
			}

			return this.getBlockList(params.from)

		} catch (e) {
			console.log(e)
			return null
		}
	}

	async getMessages(userId, toUserId) {
		try {
			if (toUserId == 'all') {
				return await this.db.query(
					`SELECT id,from_block as block_status,from_user_id as fromUserId,to_user_id as toUserId,message,date FROM message WHERE 
						(to_user_id = ? ) ORDER BY id ASC				
					`,
					[toUserId]
				)
			} else {
				return await this.db.query(
					`SELECT id,from_block as block_status,from_user_id as fromUserId,to_user_id as toUserId,message,date FROM message WHERE 
						(from_user_id = ? AND to_user_id = ? )
						OR
						(from_user_id = ? AND to_user_id = ? )	ORDER BY id ASC				
					`,
					[userId, toUserId, toUserId, userId]
				)
			}



		} catch (error) {
			console.warn(error);
			return null;
		}
	}

	 getBlockList(userId) {
		
		return new Promise ((resolve,reject) => {
			this.db.query(`SELECT to_user_id FROM dialogs WHERE (from_user_id = ? AND block_status = ?)`, [userId, 1])
			.then(res => {
				if (res && Object.keys(res).length >= 0) {
					let newBlockList = _.values(_.mapValues(res, 'to_user_id'))
					resolve(newBlockList)					
				} else {
					resolve(false)
				}
				
			})
			.catch(e => {
				console.log(e)
				reject(e)
			})
		})
	
	}
}
module.exports = new Helper();