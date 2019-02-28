console.log("-----auth-----")

function response (data) {
    console.log(data,"<<<<<<<<<<----------------")
    let resp = data.responseText;
    try {
        if (data.message != void (0)) {
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
    $.ajax({
        //need change to .emit('logout-response') --->> logout, for close socket
        url: '/logout',
        type: 'POST',
        data: {},
        success: (res) => {
            alert(response(res));
            location.reload();
        },
        error: (res) => {
            alert(response(res));
        }
    });
});

$( document ).ready( () => {
    var socket = io.connect('http://localhost:3000');
    socket.on('connected', function (msg) {
        console.log(msg);
        socket.emit('receiveHistory');
    });

    // socket.on('add-message', addMessage);

    socket.on('add-message-response', addMessage);

    socket.on('history', messages => {
        /// to do : need update  api del --->>> /getMessages
        console.log("----check history----",messages)
        for (let message of messages) {
           
            addMessage(message);
        }
    });

    $('.chat-message button').on('click', e => {
        e.preventDefault();

        var selector = $("textarea[name='message']");
        var messageContent = selector.val().trim();
        console.log(messageContent);
        if(messageContent !== '') {

            socket.emit('add-message', messageContent);

            selector.val('');
        }
    });

    function encodeHTML (str){
        return $('<div />').text(str).html();
    }

    function addMessage(message) {
        message.date      = (new Date(message.date)).toLocaleString();
        message.username  = encodeHTML(message.username);
        message.content   = encodeHTML(message.content);

        var html = `
            <li>
                <div class="message-data">
                    <span class="message-data-name">${message.username}</span>
                    <span class="message-data-time">${message.date}</span>
                </div>
                <div class="message my-message" dir="auto">${message.content}</div>
            </li>`;

        $(html).hide().appendTo('.chat-history ul').slideDown(200);

        $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
    }
});