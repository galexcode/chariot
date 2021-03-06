require('./utils');

var Network = require('./network'),
    Game = require('./game'),
    Room = require('./room'),
    Player = require('./player'),
    AI = require('./ai'),
    Config = require('./config');

Network.on('connection', function (socket) {
    Room.refresh();
    socket.on('create', function (data) {
        socket.get('playerinfo', function (err, player) {
            if(player == null) {
                var player = new Player(socket, data);
            } else {
                player.name = data.name;
            }
            socket.set('playerinfo', player, function () {
                var room = new Room(player.name + '的房间');
                socket.emit("reply_create", {suc: true, data: {room: room.gen_msg(), id: player.id}});
                room.add_player(player);
            });
        });
    });
    socket.on('join', function (data) {
        socket.get('playerinfo', function (err, player) {
            if(player == null) {
                var player = new Player(socket, data);
            } else {
                player.name = data.name;
            }
            socket.set('playerinfo', player, function () {
                var room = Room.find(data.id);
                if(room == null) {
                    socket.emit("reply_join", {suc: false, data: '房间不存在。'});
                } else if(room.is_in_game) {
                    socket.emit("reply_join", {suc: false, data: '房间正在游戏中。'});
                } else {
                    socket.emit("reply_join", {suc: true, data: {room: room.gen_msg(), id: player.id}});
                    room.add_player(player);
                }
            });
        });
    });
    socket.on('ready', function () {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                socket.emit("reply_ready", {suc: true});
                player.status = "已准备";
                player.room.refresh();
                player.room.check_start_game();
            }
        });
    });
    socket.on('addai', function () {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                socket.emit("reply_addai", {suc: true});
                player.room.add_player(new AI());
                player.room.check_start_game();
            }
        });
    });
    socket.on('set_map', function (data) {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                socket.emit("reply_set_map", {suc: true});
                player.room.map_type = data;
                player.room.refresh();
            }
        });
    });
    socket.on('set_car', function (data) {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                socket.emit("reply_set_car", {suc: true});
                player.car_type = data;
                player.room.refresh();
            }
        });
    });
    socket.on('set_team', function (data) {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                socket.emit("reply_set_team", {suc: true});
                player.team = data;
                player.room.refresh();
                player.room.check_start_game();
            }
        });
    });
    socket.on('set_ai_car', function (data) {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                var ai = player.room.players[data.index];
                if(ai && ai.isAI) {
                    socket.emit("reply_set_ai_car", {suc: true});
                    ai.car_type = data.type;
                    player.room.refresh();
                }
            }
        });
    });
    socket.on('set_ai_team', function (data) {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                var ai = player.room.players[data.index];
                if(ai && ai.isAI) {
                    socket.emit("reply_set_ai_team", {suc: true});
                    ai.team = data.team;
                    player.room.refresh();
                    player.room.check_start_game();
                }
            }
        });
    });
    socket.on('keystatus', function (data) {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                if(player.room != null) {
                    if(player.room.game != null) {
                        player.room.game.refresh_key_status(player, data);
                    }
                }
            }
        });
    });
    socket.on('quit', function () {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                socket.emit("reply_quit", {suc: true});
                player.quit();
            }
        });
    })
    socket.on('disconnect', function () {
        socket.get('playerinfo', function (err, player) {
            if(player != null) {
                player.quit();
            }
        });
    });
});