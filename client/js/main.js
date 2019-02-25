
    console.log("---localStorage----",localStorage)
    
    
    
    var socket = io();



    $('form').submit(function () {
	
		socket.emit('add-message', {
			fromUserId: 'test1',
			toUserId: 'test2',
			message: $('#m').val()
		});
		$('#m').val('');
		return false;
	})



	socket.on('add-message-response', function (data) {
		
		$('#messages').append($('<li>').text(data.message));
    })
    
    	//console.log("value----", $('#m').val())