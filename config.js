class Config {
    constructor(app) {
        //need add template
        app.get('/', function (req, res) {
            res.sendFile(__dirname + '/index.html');
        });
    }
}



function ExtractJwt (req) {
    let token = null;
    if(req.cookies && req.cookies.token != void(0)) token = req.cookies['token'];
    return token;
}

module.exports = {
    jwt: {
        jwtFromRequest: ExtractJwt,
        secretOrKey: 'TfbTq2NfLzqMcbVY9EpGQ2p'
    },

    expiresIn: '1 day',
    Config
};