console.log("-----auth-----")


var currentChat = 'all'
var listChats;

function _clearVars() {
    $("li").remove()
}

function response(data) {
    let resp = data.responseText;
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
    socket.emit('receiveHistory',currentChat);
}

var socket = io.connect('http://localhost:3000');
$(document).ready(() => {
    
    socket.on('connected', function (result) {
        _clearVars()
        document.getElementById('name').innerHTML = result.userId;
        socket.emit('receiveHistory',currentChat);
        socket.emit('chat-list-all','all')
    });

    socket.on('chat-list-all-response',chatList)

    socket.on('add-message-response', addMessage);

    socket.on('history', messages => {

        for (let message of messages) {
            let msg = {
                date: message.date,
                username: message.fromUserId,
                message: message.message
            }
          
            addMessage(msg);
        }
    });

    $('.chat-message button').on('click', e => {
        e.preventDefault();

        var selector = $("textarea[name='message']");
        var message = selector.val().trim();
        if (message !== '') {

            socket.emit('add-message',{
                toUserId: currentChat,
                message: message
            } );

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

    function addMessage(message) {
      
        message.date = (new Date(message.date)).toLocaleString();
        message.username = encodeHTML(message.username);
        message.message = encodeHTML(message.message);

        var html = `
            <li>
                <div class="message-data">
                    <span class="message-data-name">${message.username}</span>
                    <span class="message-data-time">${message.date}</span>
                </div>
                <div class="message my-message" dir="auto">${message.message}</div>
            </li>`;

        $(html).hide().appendTo('.chat-history ul').slideDown(200);

        $(".chat-history").animate({
            scrollTop: $('.chat-history')[0].scrollHeight
        }, 1000);
    }
});