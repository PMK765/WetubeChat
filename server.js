const mongo = require ('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//connect to mongodb

mongo.connect('mongodb://127.0.0.1/WeTubeChat', function(err, db) {
    if(err){
        throw err;
    }
    console.log('MongoDB connected...');
    //Connect to socket.io

    client.on('connection', function(socket) {
        let chat = db.collection('chats');

        //Create function to send status
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        //Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res) {
            if(err) {
                throw err;
            }
            //Emit the messages
            socket.emit('output', res);

        });

        //Handle input events
        socket.on('input', function(data) {
            let name = data.name;
            let message = data.message;

            //Check for name and message
            if(name === '' || message === '') {
                //Send error status
                sendStatus('Name and Message fields must not be blank');
            }
            else {
                //Insert message into database
                chat.insert({name: name, message: message}, function() {
                    client.emit('output', [data]);

                    //Send status object
                    sendStatus({
                        message: 'Message Sent',
                        clear: true
                    });
                });
            }
        });

        //Handle Clear
        socket.on('clear', function(data) {
            //Remove all chats from the collection
            chat.remove({}, function(){
                socket.emit('cleared');
            });
        });
    });
});
