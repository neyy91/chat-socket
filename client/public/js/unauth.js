
$('form .message a').on('click', e => {
    e.preventDefault();
    if($('.login:visible').length > 0) {
        $('.login').css('display','none');
        $('.register').css('display','block');
    } else {
        $('.register').css('display','none');
        $('.login').css('display','block');
    }
});

function response (data) {

    if (data.token && data.userId) {
        localStorage.setItem(data.userId, data.token );
    }
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

$('form').on('submit', e => {
    e.preventDefault();
    let value = $(e.target).attr('class');
    let selector = '.' + value;

    $.ajax({
        url: '/' + value,
        type: 'POST',
        data: {
            username: $(selector + ' [name=username]').val(),
            password: $(selector + ' [name=password]').val()
        },
        beforeSend: (request) => {
            $(selector + ' button').prop('disabled', true);
            request.setRequestHeader("authorization", 'test - checkToken');
        },
        success: (res) => {
          
            alert(response(res));
          
            if (value == 'login') {
                location.href = '/chat';
            } else {
                location.reload();
            }
           
        },
        error: (res) => {
         
            alert(response(res));
        },
        complete: (res) => {
           
            $(selector + ' button').prop('disabled', false);
        }
    })
});