
'use strict';

const path = require('path');
const helper = require('./dbEvents');

class Socket{

    constructor(socket){
        this.io = socket;
    }
    
    socketEvents(){

        this.io.on('connection', (socket) => {
            console.log("user connected")
            // get the user's Chat list
           

            socket.on('chat-list', async (userId) => {

               let chatListResponse = {};

                if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

                    chatListResponse.error = true;
                    chatListResponse.message = `User does not exits.`;
                    
                    this.io.emit('chat-list-response',chatListResponse);
                }else{
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

                // console.log("data------",data)
                
                if (data.message === '') {
                    
                    this.io.to(socket.id).emit(`add-message-response`,`Message cant be empty`); 

                }else if(data.fromUserId === ''){
                    
                    this.io.to(socket.id).emit(`add-message-response`,`Unexpected error, Login again.`); 

                }else if(data.toUserId === ''){
                    
                    this.io.to(socket.id).emit(`add-message-response`,`Select a user to chat.`); 

                }else{                    
                    let toSocketId = data.toSocketId;
                    const sqlResult = await helper.insertMessages({
                        fromUserId: data.fromUserId,
                        toUserId: data.toUserId,
                        message: data.message
                    });
                    this.io.to(toSocketId).emit(`add-message-response`, data); 
                }               
            });


            //Logout 

            socket.on('logout', async () => {
                const isLoggedOut = await helper.logoutUser(socket.id);
                this.io.to(socket.id).emit('logout-response',{
                    error : false
                });
                socket.disconnect();
            });


            //disconect from socket.

            socket.on('disconnect',async ()=>{
                const isLoggedOut = await helper.logoutUser(socket.id);
                setTimeout(async ()=>{
                    const isLoggedOut = await helper.isUserLoggedOut(socket.id);
                    if (isLoggedOut && isLoggedOut !== null) {
                        socket.broadcast.emit('chat-list-response', {
                            error: false,
                            userDisconnected: true,
                            socketId: socket.id
                        });
                    }
                },1000);
            });

            // testing
            socket.on('chat message',function(msg) {
                console.log('message: ',+ msg);
                socket.emit('chat message',msg);
            })

        });

    }
    
    socketConfig(){

        this.io.use( async (socket, next) => {
            let userId = socket.request._query['userId'];
            let userSocketId = socket.id;          
            const response = await helper.addSocketId( userId, userSocketId);
           
            if(response &&  response !== null){
                next();
            }else{
                console.error(`connection failed, user Id ${userId}.`);
            }
        });

        this.socketEvents();
    }
}
module.exports = Socket;