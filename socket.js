'use strict';

const path = require('path');
const helper = require('./dbEvents');

const cookieParser = require('cookie-parser');
const passport = require('passport');

var cache = require('express-redis-cache')({
    client: require('redis').createClient()
})

function auth(socket, next) {

    // Parse cookie
    cookieParser()(socket.request, socket.request.res, () => {

    });

    // JWT authenticate
    passport.authenticate('jwt', {
        session: false
    }, function (error, decryptToken, jwtError) {
        if (!error && !jwtError && decryptToken) {
            // next(false, {username: decryptToken.username, id: decryptToken.id});
            next(false, {
                username: decryptToken.username,
                id: decryptToken.id
            })
        } else {
            next('guest');
        }
    })(socket.request, socket.request.res);

}

function addMsgAndSend(data, sender, index) {
    return new Promise((resolve, reject) => {
        const objNewMsg = {
            toUserId: data.toUserId,
            message: data.message,
            fromUserId: sender,
            block_status: (index == -1 ? 0 : 1),
            date: new Date()
        };

        helper.insertMessages(objNewMsg)
            .then(res => {
                if (res) {
                    resolve(objNewMsg)
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


class Socket {

    constructor(socket) {
        this.io = socket;
    }



    socketEvents() {

        this.io.on('connection', (socket) => {
            console.log("user connected")

            auth(socket, (guest, user) => {
                if (!guest) {
                    helper.getBlockList(user.username)
                        .then(blockList => {
            
                            socket.join('all');
                            console.log("socket id----", socket.id)
                            socket.username = user.username;

                            socket.emit('connected', {
                                msg: `you are connected to chat as ${user.username}`,
                                userId: user.username,
                                newBlockList: blockList
                            });
                            
                        })
                        .catch(e => {
                            console.log("error user",e)
                        })
                } else {
                    console.log("--user---", guest)
                }
            });

            socket.on('chat-list-all', async () => {
                let list = await helper.getAllList()
                this.io.emit('chat-list-all-response', {
                    list: list,
                    username: socket.username
                })
            })

            // get the user's Chat list
            socket.on('chat-list', async (userId) => {

                let chatListResponse = {};
                if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

                    chatListResponse.error = true;
                    chatListResponse.message = `User does not exits.`;

                    this.io.emit('chat-list-response', chatListResponse);
                } else {
                    const result = await helper.getChatList(userId, socket.id);
                    this.io.to(socket.id).emit('chat-list-response', {
                        error: result !== null ? false : true,
                        singleUser: false,
                        chatList: result.chatlist
                    });

                    socket.broadcast.emit('chat-list-response', {
                        error: result !== null ? false : true,
                        singleUser: true,
                        chatList: result.userinfo
                    });
                }
            });


            // send the msg


            socket.on('add-message', async (data) => {
                let self = this;

                if (data.message === '') {

                    self.io.to(socket.id).emit(`add-message-response`, `Message cant be empty`);

                } else if (data.fromUserId === '') {

                    self.io.to(socket.id).emit(`add-message-response`, `Unexpected error, Login again.`);

                } else if (data.toUserId === '') {

                    self.io.to(socket.id).emit(`add-message-response`, `Select a user to chat.`);

                } else {


                    //check in redis block
                    cache.get(data.toUserId, async function (error, entries) {
                        // console.log("enter--->>>\n", entries, "\n")
                        if (error) {
                            console.log("error get cash")
                        }
                        if (entries.length > 0) {
                            let infoFromCache = entries && entries[0].body
                            let dataCache = typeof (infoFromCache) == 'string' ? JSON.parse(infoFromCache) : infoFromCache

                            let index = dataCache.blockList.indexOf(socket.username)


                            let objNewMsg = await addMsgAndSend(data, socket.username, index)
                            if (objNewMsg) {
                                self.io.to('all').emit("add-message-response", objNewMsg);
                            }

                        } else {
                            let objNewMsg = await addMsgAndSend(data, socket.username, -1)
                            if (objNewMsg) {
                                self.io.to('all').emit("add-message-response", objNewMsg);
                            }
                        }
                    })
                }
            });


            //Logout 

            socket.on('logout', async () => {
                const isLoggedOut = await helper.logoutUser(socket.id);
                this.io.to(socket.id).emit('logout-response', {
                    error: false
                });
                console.log("------close-----")
                socket.disconnect();
            });


            socket.on('receiveHistory', async (chatId) => {

                let getHistory = await helper.getMessages(socket.username, chatId)

                // this.io.to('all').emit("history", [getHistory]);
                this.io.to('all').emit("history", {
                    requestUser: socket.username,
                    history: getHistory
                });
            })

            //disconect from socket.

            socket.on('disconnect', async () => {

                const isLoggedOut = await helper.logoutUser(socket.id);
                setTimeout(async () => {
                    const isLoggedOut = await helper.isUserLoggedOut(socket.id);
                    if (isLoggedOut && isLoggedOut !== null) {
                        // console.log("---check reload---")
                        socket.broadcast.emit('chat-list-response', {
                            error: false,
                            userDisconnected: true,
                            socketId: socket.id
                        });
                    }
                }, 1000);
            });

        });

    }

    socketConfig() {

        this.io.use(async (socket, next) => {
            auth(socket, async (guest, user) => {

                if (!guest) {
                    // let userId = socket.request._query['userId'];
                    let userId = user.id
                    let userSocketId = socket.id;

                    const response = await helper.addSocketId(userId, userSocketId);

                    if (response && response !== null) {
                        next();
                    } else {
                        console.error(`connection failed, user Id ${userId}.`);
                    }
                }
            })

        });

        this.socketEvents();
    }
}
module.exports = Socket;