

nodeJs chat


SQL db:
  host: '127.0.0.1',
  user: 'root',
  password: '0000',
  database: 'chat',

CREATE DATABASE chat;
 
USE chat;
 
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(10) NOT NULL,
  `token` varchar(20) DEFAULT NULL,
  `password` varchar(20) NOT NULL,
  `online` enum('N','Y') NOT NULL,
  `socketid` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `message`;
CREATE TABLE `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_user_id` varchar(45) DEFAULT NULL,
  `to_user_id` varchar(45) DEFAULT NULL,
  `message` text,
  `from_block`  int(11)  DEFAULT 0,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `dialogs`;
CREATE TABLE `dialogs`(
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `from_user_id` varchar(45) DEFAULT NULL,
    `to_user_id` varchar(45) DEFAULT NULL,
    `block_status` int(11)  DEFAULT 0,
    `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;




-----------
npm i
node server.js