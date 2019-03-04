
var currentChat = 'all'
var listChats;
var currentUser;

function _clearVars() {
    $("li").remove()
}

function response(data) {
    let resp = data.responseText || 'success';
    try {
        if (data.message != void(0)) {
            resp = data.message;
        } else {
            resp = JSON.parse(data.responseText);
            resp = resp.message;
        }
    } catch (e) {}
    return resp;
}

$(".logout-btn").on('click', e => {
    e.preventDefault();
    socket.emit('logout');
    $.ajax({
        url: '/logout',
        type: 'POST',
        data: {},
        success: (res) => {
            alert(response(res));
            // location.reload();
            location.href = '/';
        },
        error: (res) => {
            alert(response(res));
        }
    });
});

$("#send").keyup(function (event) {
    if (event.keyCode == 13) {
        $("#sendButton").click();
        $(this).val('');
    }
});


function changeChat() {
   
    currentChat = document.getElementById("selectChatId").value;
    _clearVars()
    socket.emit('receiveHistory', currentChat);
}

function changeStatusBlock(blockStatus) {
    var changeStatusUser = blockStatus ? 'selectBlock' : 'selectUnblock'
    // _clearVars()
    var user = document.getElementById(changeStatusUser).value;
   

    $.ajax({
        url: '/changeStatusBlock',
        type: 'POST',
        data: {
            blockStatus: blockStatus,
            userChange: user,
            currentUser: currentUser

        },
        beforeSend: (request) => {
            request.setRequestHeader("authorization", 'test - checkToken');
        },
        success: (res) => {
            alert(response(res));
        },
        error: (res) => {
            alert(response(res));
        }
    });

}

var socket = io.connect('http://localhost:3000');
$(document).ready(() => {

    socket.on('connected', function (result) {

        _clearVars()
        document.getElementById('name').innerHTML = result.userId;
        currentUser = result.userId

        socket.emit('receiveHistory', currentChat);
        socket.emit('chat-list-all', 'all')
    });

    socket.on('chat-list-all-response', chatList)

    socket.on('add-message-response', newMsg => {
        checkAdd(newMsg)
    });

    socket.on('history', data => {
        if (data.requestUser == currentUser) {
            for (let newMsg of data.history) {
                checkAdd(newMsg)
            }
        }
    });

    $('.chat-message button').on('click', e => {
        e.preventDefault();

        var selector = $("textarea[name='message']");
        var message = selector.val().trim();
        if (message !== '') {
           
            socket.emit('add-message', {
                toUserId: currentChat,
                message: message
            });

            selector.val('');
        }
    });



    function chatList(listInfo) {
        if (listChats) {
            return
        } else {
            var options = `<option class="pick-option" id="tag_all" value="all">all</option>`
            listInfo.list.map(user => {
                if (listInfo.username != user.username) {
                    options = options + `<option class="pick-option" id="tag_${user.id}" value="${user.username}">${user.username}</option>`
                }
            })

            var html = options
            listChats = html
            $(html).appendTo('.pick-chat select');
        }
    }

    function encodeHTML(str) {
        return $('<div />').text(str).html();
    }

    function checkAdd(newMsg) {
      
        if (newMsg.block_status == 1 && newMsg.fromUserId != currentUser) {
            return
        }
     
        if ((newMsg.fromUserId == currentChat && newMsg.toUserId == currentUser) ||  newMsg.fromUserId == currentUser ) {
            addMessage(newMsg);
        } else {
            if (newMsg.toUserId != currentChat) {
                return
            }
            addMessage(newMsg);
        }
    }

    function addMessage(message) {

        message.date = (new Date(message.date)).toLocaleString();
        message.username = encodeHTML(message.fromUserId); //message.username || 
        message.message = encodeHTML(message.message);

        var html = `
            <li>
                <div class="message-data">
                    <span class="message-data-name">${message.username}</span>
                    <span class="message-data-time">${message.date}</span>
                </div>
                <div class="message my-message" dir="auto">${message.message}</div>
            </li>`;

        $(html).hide().appendTo('.chat-history ul').slideDown(2); //200

        $(".chat-history").animate({
            scrollTop: $('.chat-history')[0].scrollHeight
        }, 100); //1000
        
    }
});