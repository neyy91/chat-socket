
var redis = require("redis");

class Redis {
    constructor() {
        this.client = redis.createClient()

        this.client.on("error", function (err) {
            console.log("Error " + err);
        });
    }

    addToRedis(key, value) {
        this.client.set(key,value);
    }

    addhashSet(hKey,value) {
        client.hset(hKey, value);
    }

    getFromRedis(key) {
        this.client.get(key);
    }

    close() {
        this.client.quit();
    }

}

module.exports = Redis;
