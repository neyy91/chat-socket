class Config {
    constructor(app) {

        // Setting .html as the default template extension
        app.set('view engine', 'html');

        // Telling express where it can find the templates
        app.set('views', (__dirname + './../views'));

        //Files 
        app.use(require('express').static(require('path').join('client')));


    }
}


function ExtractJwt(req) {
    let token = null;
    if (req.cookies && req.cookies.token != void(0)) token = req.cookies['token'];
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