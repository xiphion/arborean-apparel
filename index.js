/* global __dirname */

const path = require('path');
const fs = require('fs');
const Networking = require('./networking');
const Window = require('./window');
const JSONbig = require('json-bigint');
const EMOTES = {
    bow: 43,
    kitchen: 44,
    dance: 44,
    settle: 51,
    peace: 52
};
let STACKS = {
    chest: 4,
    height: 4,
    thighs: 4,
    size: 4
};
let defaultChangerStacks = {"chest":4, "thighs":4, "size":4, "height":4};
const CHANGERS = {
    chest: 7000012,
    dchest: 7000012,
    height: 7000013,
    dheight: 7000013,
    thighs: 7000014,
    dthighs: 7000014,
    size: 7000005,
    dsize: 7000005
};
const RMCHANGER = {
    chest: 7000012,
    height: 7000013,
    thighs: 7000014,
    size: 7000005
};
const ABNORM = {
    confidence: 7000027,
    head: 7000001,
    p2wings: 97950009,
    wing2: 905641,
    murderous: 903,
    darkswirl: 950327,
    tornado: 950328,
    burning: 950329,
    healing: 5010000,
    electricity: 10154030,
    swirl: 999001024,
    noct: 921,
    redhand: 4767,
    overpower: 300300,
    sniperseye: 601100,
    tenacity: 700300,
    unyielding: 700600,
    bluenacity: 3000020,
    hyperhand: 757053,
    succ: 98000101,
    hearts: 4866
};

function id2str(id) {
    return id.toString();
}

function str2id(str) {
    return BigInt(str);
}

function dye2int({
    r,
    g,
    b,
    a,
    o
}) {
    return o ? (a << 24) | (r << 16) | (g << 8) | b : 0;
}
module.exports = function ArboreanApparel(dispatch) {

	if(!global.TeraProxy.GUIMode) throw new Error("This module requires proxy running in GUI mode");
	else if(dispatch.isClassic) throw new Error("AA not backported for classic :)");
    const game = dispatch.game;
    const command = dispatch.command;
    const net = new Networking();
    const win = new Window();
    const networked = new Map();
    let player,
        config,
        lastCallDate = 1,
        presets = {},
        nametags = {},
        outfit = {},
        selfInfo = {
            name: '',
            job: -1,
            race: -1,
            gender: -1
        },
        options = {
            hideidle: false,
            hidecb: false
        },
        crystalbind = {
            expires: 0,
            stacks: 0,
            type: 0
        },
        override = {},
        jobId,
        gender,
        raceId,
        model,
        meme,
        bleb,
        job,
        race,
        presetTimeout = null,
        nametagTimeout = null,
        presetLock = false,
        nametagLock = false,
        ingame = false;

    try {
        presets = require('./presets.json');
    } catch (e) {
        presets = {};
    }
    try {
        nametags = require('./nametags.json');
    } catch (e) {
        nametags = {};
    }
    try {
        config = require('./config.json');
    } catch (e) {
        console.log('[ArboreanApparel]- Config file generated!');
        config = {
            "online": true,
            "transparent": true,
            "skyEveryMap": true,
            "allowEffects": true,
            "allowChangers": true,
            "configVersion": "0.7",
            "serverHost": "144.217.83.72",
            "serverPort": 3458
        };
        saveConfig();
    }
    if (config.configVersion !== "0.9") {
        Object.assign(config, {
            "configVersion": "0.9"
        });
        saveConfig();
    }


    function saveConfig() {
        fs.writeFile(path.join(__dirname, 'config.json'), JSONbig.stringify(
            config, null, 4), err => {
            });
    }

    function presetUpdate() {
        clearTimeout(presetTimeout);
        presetTimeout = setTimeout(presetSave, 1000);
    }

    function nametagUpdate() {
        clearTimeout(nametagTimeout);
        nametagTimeout = setTimeout(nametagSave, 1000);
    }

    function presetSave() {
        if (presetLock) {
            presetUpdate();
            return;
        }
        presetLock = true;
        fs.writeFile(path.join(__dirname, 'presets.json'), JSONbig.stringify(
            presets, null, 4), err => {
                presetLock = false;
            });
    }

    function nametagSave() {
        if (nametagLock) {
            nametagUpdate();
            return;
        }
        nametagLock = true;
        fs.writeFile(path.join(__dirname, 'nametags.json'), JSONbig.stringify(
            nametags, null, 4), err => {
                nametagLock = false;
            });
    }

    function message(msg) {
        command.message(`<font color="#916d7b">  [Arborean-Apparel] - </font> <font color="#eaf2ef">${msg}`);
    }

    function broadcast(...args) {
        win.send(...args);
        net.send(...args);
    }

    function setOption(option, value) {
        if (options[option] !== value) {
            options[option] = value;
            broadcast('option', option, value);
            return true;
        }
        return false;
    }

    function toggleCrystalbind() {
        if (!crystalbind.expires)
            return; // no cb to toggle
        const {
            hidecb
        } = options;
        const add = 4600 + 10 * crystalbind.type;
        const rem = 1101 + 2 * crystalbind.type;
        const duration = crystalbind.expires - Date.now();
        broadcast('crystalbind', {
            expires: hidecb ? 0 : duration,
            stacks: crystalbind.stacks,
            type: crystalbind.type
        });
        dispatch.send('S_ABNORMALITY_END', 1, {
            target: game.me.gameId,
            id: hidecb ? add : rem
        });
        dispatch.send('S_ABNORMALITY_BEGIN', 3, {
            target: game.me.gameId,
            source: game.me.gameId,
            id: hidecb ? rem : add,
            duration: duration,
            unk: 0,
            stacks: crystalbind.stacks,
            unk2: 0,
            unk3: 0
        });
    }

    function doEmote(name) {
        const emote = EMOTES[name];
        if (!emote)
            return;
        if (!options.hideidle && (emote === 44 || emote === 51)) {
            setOption('hideidle', true);
            message('[AA] Idle animations disabled.');
        }
        net.send('emote', emote);
        dispatch.send('S_SOCIAL', 1, {
            target: game.me.gameId,
            animation: emote,
            unk1: 0,
            unk2: 0
        });
    }
    function remove(arr, what) {
        var found = arr.indexOf(what);

        while (found !== -1) {
            arr.splice(found, 1);
            found = arr.indexOf(what);
        }
    }


    function skyChange(name) {
        if (name == null || name == "") {
            return;
        } else if (name == "Remove/None") {
            dispatch.send('S_START_ACTION_SCRIPT', 3, {
                gameId: game.me.gameId,
                script: 105,
                unk2: 0
            });
            presets[player].sky = null;
        } else {
            bleb = name.replace(/-/g, "_");
            dispatch.send('S_AERO', 1, {
                enabled: 1,
                blendTime: 0,
                aeroSet: bleb
            });
            presets[player].sky = name;
        }
        win.send('sky', name);
        presetUpdate();
    }

    function changerSend(name, stacc) {
    	dispatch.send('S_ABNORMALITY_BEGIN', 3, {
            target: game.me.gameId,
            source: 6969696,
            id: CHANGERS[name],
            duration: 6969696,
            unk: 0,
            stacks: stacc,
            unk2: 0,
            unk3: 0
        });
    }

    function reeeabnormies(name) {
        const abnormal = ABNORM[name];
        dispatch.send('S_ABNORMALITY_BEGIN', 3, {
            target: game.me.gameId,
            source: 6969696,
            id: abnormal,
            duration: 6969696,
            unk: 0,
            stacks: 1,
            unk2: 0,
            unk3: 0
        });
        net.send('abnBegin', abnormal);
    }
    function abnormalStart(name) {
        if (name === undefined || name === null) {
            return;
        }
        if (Date.now() - lastCallDate < 100)
            return; // BLESS YOU KASEA
        const abnormal = ABNORM[name];
        if (!presets[player].abnlist.includes(name)) {
            dispatch.send('S_ABNORMALITY_BEGIN', 3, {
                target: game.me.gameId,
                source: 6969696,
                id: abnormal,
                duration: 6969696,
                unk: 0,
                stacks: 1,
                unk2: 0,
                unk3: 0
            });
            presets[player].abnlist.push(name);
            presetUpdate();
            net.send('abnBegin', abnormal);
        } else {
            dispatch.send('S_ABNORMALITY_END', 1, {
                target: game.me.gameId,
                id: abnormal
            });
            net.send('abnEnd', abnormal);
            remove(presets[player].abnlist, name);
            //presets[player].abnlist = normies;
            presetUpdate();
        }
        lastCallDate = Date.now();
    }

    function startChanger(name) {
        if (Date.now() - lastCallDate < 100)
            return;
        for(let iter of ["chest", "height", "thighs", "size"]) STACKS[iter] = presets[player].changers[iter];
        const changerId = CHANGERS[name];
        let edited;
        switch (name) {
        	case "chest":
        		++STACKS.chest;
        		edited = "chest";
        		break;
        	case "height":
        		++STACKS.height;
        		edited = "height";
        		break;
        	case "thighs":
        		++STACKS.thighs;
        		edited = "thighs";
        		break;
        	case "size":
        		++STACKS.size;
        		edited = "size";
        		break;
            case "dchest":
                --STACKS.chest;
        		edited = "chest";
                break;
            case "dheight":
                --STACKS.height;
        		edited = "height";
                break;
            case "dthighs":
                --STACKS.thighs;
        		edited = "thighs";
                break;
            case "dsize":
                --STACKS.size;
        		edited = "size";
                break;
            default:
                break;
        }
        dispatch.send('S_ABNORMALITY_BEGIN', 3, {
                    target: game.me.gameId,
                    source: 6969696,
                    id: changerId,
                    duration: 6969696,
                    unk: 0,
                    stacks: STACKS[edited],
                    unk2: 0,
                    unk3: 0
                });
                net.send('changer', changerId, STACKS[edited]);
        
        for(let iter of ["chest", "height", "thighs", "size"]) presets[player].changers[iter] = STACKS[iter];
        lastCallDate = Date.now();
    }

    function endChanger(name) {
        if (Date.now() - lastCallDate < 100)
            return;
        const remChange = RMCHANGER[name];
        net.send('abnEnd', remChange);
        dispatch.send('S_ABNORMALITY_END', 1, {
            target: game.me.gameId,
            id: remChange
        });
        STACKS[name] = 4;
        presets[player].changers[name] = 4;
        net.send('abnEnd', remChange);
        lastCallDate = Date.now();
    }

    /* --------- *
     * UI EVENTS *
     * --------- */

    win.on('load', () => {
        if (presets[player].mountId) {
            win.send('mount', presets[player].mountId);
        }
        if (presets[player].sky) {
            win.send('sky', presets[player].sky);
        }
        win.send('character', selfInfo);
        win.send('outfit', outfit, override);
        for (const k of Object.keys(options))
            win.send('option', k,
                options[k]
            );
    });
    win.on('change', (over) => {
        for (const type of Object.keys(over)) {
            const id = over[type];
            if (id === false) {
                delete override[type];
            } else {
                override[type] = type.endsWith('Dye') ? dye2int(id) :
                    id;
            }
        }
        //override = presets[player];
        presetUpdate();
        dispatch.send('S_USER_EXTERNAL_CHANGE', 7, Object.assign({},
            outfit, override));
        net.send('outfit', override); // TODO
    });
    win.on('text', (info) => {
        nametags[player] = info;
        nametagUpdate();
        net.send('text', info.id, info.text);
        dispatch.send('S_ITEM_CUSTOM_STRING', 2, {
            gameId: game.me.gameId,
            customStrings: [{
                dbid: info.id,
                string: info.text
            }]
        });
    });

    win.on('option', (option, value) => {
        const changed = setOption(option, value);
        if (option === 'hideidle') {
            message(
                `[AA] Idle animations ${value ? 'dis' : 'en'}abled.`
            );
        } else if (option === 'hidecb') {
            if (changed)
                toggleCrystalbind();
            message(
                `[AA] Crystalbind ${value ? 'dis' : 'en'}abled.`
            );
        }
    });

    win.on('mount', (mount) => {
        if (presets[player].mountId) {
            win.send('mount', presets[player].mountId);
        }
        win.send('mount', mount); //disgusting
        presets[player].mountId = mount;
        presetUpdate();
        net.send('mount', mount);
    });

    win.on('sky', (sky) => {
        skyChange(sky);
    });

    win.on('emote', doEmote);
    win.on('abn', abnormalStart);
    win.on('changer', startChanger);
    win.on('rmchanger', endChanger);
    command.add('aa', (cmd, arg) => {
        switch (cmd) {
            case 'job':
            case 'class':
                jobId = parseInt(arg);
                selfInfo = {
                    name: player,
                    job: jobId,
                    race,
                    gender
                };
                win.send('character', selfInfo);
                message("Job set to:");
                break
            case 'race':
                raceId = parseInt(arg);
                selfInfo = {
                    name: player,
                    job: job,
                    race: raceId,
                    gender
                };
                win.send('character', selfInfo);
                message("Race set to:");
                break
            case 'reset':
                raceId = parseInt(arg);
                selfInfo = {
                    name: player,
                    job: job,
                    race,
                    gender
                };
                win.send('character', selfInfo);
                message("Restet race and job changes");
                break
            case 'open':
                {
                    win.show();
                    break
                }
            case 'idle':
                {
                    setOption('hideidle', arg ? !!arg.match(
                        /^(0|no|off|disabled?)$/i) : !options.hideidle);
                    message("[AA] Idle animations " + (options.hideidle ?
                        'dis' : 'en') + "abled.");
                    break
                }
            case 'disconnect':
                net.send('logout');
                net.close();
                break
            case 'reconnect':
                net.connect({
                    host: config.serverHost,
                    port: config.serverPort
                });
                net.send('login', id2str(game.me.gameId));
                net.send('outfit', override);
                break
            case 'cb':
            case 'crystalbind':
                {
                    const changed = setOption('hidecb', arg ? !!arg[1]
                        .match(/^(0|no|off|disabled?)$/i) : !
                        options.hidecb);
                    if (changed) {
                        toggleCrystalbind();
                    }
                    message("[AA] Crystalbind " + (options.hidecb ?
                        'dis' : 'en') + "abled.");
                    break
                }
            // TODO changer
            default:
                {
                    if (EMOTES[cmd]) {
                        doEmote(cmd);
                        break
                    }
                    if (CHANGERS[cmd]) {
                        startChanger(cmd);
                        break
                    }
                    message([
                        '[AA] Usage:',
                        '!aa open - Opens the AA interface.',
                        `!aa class [id] - Changes your class in the UI`,
                        `!aa race [id] - Changes your race in the UI`,
                        `!aa reset - Resets job and race changes`,
                        '!aa idle [on|off] - Shows or hides your idle animations.',
                        '!aa cb [on|off] - Shows or hides your Crystalbind.'
                    ].join('<br>'), true);
                    break
                }
        }
    });
    /* ----------- *
     * GAME EVENTS *
     * ----------- */
    /* addHook('C_CHECK_VERSION', 1, () => {
         enable();
     });*/
    function addHook(packetName, packetVersion, func) {
        dispatch.hook(packetName, packetVersion, func);
    }
    // function enable() {
    addHook('S_LOGIN', 12, () => {
        ingame = true;
        player = game.me.name;
        model = game.me.templateId - 10101;
        job = model % 100;
        model = Math.floor(model / 100);
        race = model >> 1;
        gender = model % 2;
        selfInfo = {
            name: player,
            job: job,
            race,
            gender
        };
        if (presets[player] && presets[player].gameId !== 0) {
            override = presets[player];
            override.gameId = game.me.gameId;
            outfit.gameId = game.me.gameId;
        }

        net.send('login', id2str(game.me.gameId));
        win.send('character', selfInfo);
        if (presets[player] && presets[player].mountId) {
            broadcast('mount', presets[player].mountId);
        }
        for (const key of Object.keys(options)) {
            broadcast('option', key, options[key]);
        }
        //broadcast('outfit', outfit, override)
        net.send('outfit', override);
        win.send('outfit', outfit, override);
    });

    addHook('S_USER_APPEARANCE_CHANGE', 1, (packet) => {
        if(packet.id == game.me.gameId) {
            switch(packet.field) {
                case 10:
                    STACKS["chest"] = packet.value;
                    presets[player].changers["chest"] = packet.value;
                    defaultChangerStacks["chest"] = packet.value;
                case 11:
                    STACKS["height"] = packet.value;
                    presets[player].changers["height"]=packet.value;
                    defaultChangerStacks["height"] = packet.value;
                case 12:
                    STACKS["thighs"] = packet.value;
                    presets[player].changers["thighs"]=packet.value;
                    defaultChangerStacks["thighs"] = packet.value;
            }
        }
    })

    addHook('C_LOAD_TOPO_FIN', 1, () => {
        if (presets[player].abnlist === undefined) {
            presets[player].abnlist = [];
        } else {
            if (presets[player].abnlist) {
                for (var i = 0; i < presets[player].abnlist.length; i++) {
                    reeeabnormies(presets[player].abnlist[i]);
                }
            }
        }
        if (presets[player].sky === undefined) {
            presets[player].sky = [];
        } else {
            if (config.skyEveryMap) {
                setTimeout(function () {
                    skyChange(presets[player].sky);
                }, 5000);
            }
        }
        if (presets[player] && presets[player].id !== 0) {
            setTimeout(function () {
                dispatch.send('S_USER_EXTERNAL_CHANGE', 7, Object.assign({}, outfit, override)); //fixes CU issue
            }, 9000);
        }
        if(presets[player].changers) {
        	for(let iter of ["chest", "height", "thighs", "size"]) if(STACKS[iter]!==defaultChangerStacks[iter]) changerSend(iter, STACKS[iter]);
        }
    	else {
    		presets[player].changers = defaultChangerStacks;
    	}
    });
    

    //Marrow brooch handling thanks Cosplayer, kasea please die
    addHook('S_UNICAST_TRANSFORM_DATA', 'raw', () => {
        return false;
    });

    addHook('S_USER_WEAPON_APPEARANCE_CHANGE', 2, event => {
        if (event.weapon != 202100) {
            if (event.gameId===game.me.gameId) {
                if (presets[player].styleWeapon) {
                    event.styleWeapon = presets[player].styleWeapon;
                }
                if (presets[player].weapon) {
                    event.weapon = presets[player].weapon;
                }
                if (presets[player].weaponEnchant) {
                    event.weaponEnchant = presets[player].weaponEnchant;
                }
                return true;
            } else {
                const user = networked.get(id2str(event.gameId));
                if (user) {
                    if (user.override.styleWeapon) {
                        event.styleWeapon = user.override.styleWeapon;
                    }
                    if (user.override.weapon) {
                        event.weapon = user.override.weapon;
                    }
                    if (user.override.weaponEnchant) {
                        event.weaponEnchant = user.override.weaponEnchant;
                    }
                    return true;
                }
            }
        }
    });

    addHook('S_MOUNT_VEHICLE', 2, {filter: {fake: null}}, (event) => {
        if (event.gameId === game.me.gameId && (presets[player] &&
            presets[player].mountId && presets[player].mountId !==
            "696969")) {
            event.id = presets[player].mountId;
            return true;
        } else {
            const user = networked.get(id2str(event.gameId));
            if (user && user.override.mountId !== undefined && user.override.mountId !== null && user.override.mountId !== "696969") {
                event.id = user.override.mountId;
                return true;
            }
        }
        return true;
    });
    addHook('S_GET_USER_LIST', 14, event => {
        win.close();
        override = {};
        for (let index in event.characters) {
            if (presets[event.characters[index].name] && presets[
                event.characters[index].name].gameId !== 0) {
                Object.assign(event.characters[index], presets[
                    event.characters[index].name]);
            }
        }
        return true;
    });
    addHook('S_SPAWN_USER', 13, (event) => {
        const user = networked.get(id2str(event.gameId));
        if (!user || user.override === null)
            return;
        Object.assign(user.outfit, event); // save real setup
        Object.assign(event, user.override); // write custom setup
        if (user.override.costume && user.override.costumeText !==
            null && user.override.costume !== null) {
            process.nextTick(() => {
                dispatch.send('S_ITEM_CUSTOM_STRING', 2, {
                    gameId: event.gameId,
                    customStrings: [{
                        dbid: user.override
                            .costume,
                        string: user.override
                            .costumeText
                    }]
                });
            });
        }
        return true;
    });
    // sorry for the mess
    addHook('S_USER_EXTERNAL_CHANGE', 7, (event) => {
        // self
        if (event.gameId === game.me.gameId) {
            outfit = Object.assign({}, event);
            if (presets[player] && presets[player].id !== 0) {
                presets[player] = override;
                presetUpdate();
                win.send('outfit', outfit, override);
                Object.assign(event, override);
                if (nametags[player] && (nametags[player].length !==
                    0))
                    updateNametag(nametags[player]);
                // dispatch.send('S_USER_EXTERNAL_CHANGE', 4, Object.assign({}, outfit, override));
                return true;
            } else {
                outfit = Object.assign({}, event);
                presets[player] = outfit;
                presetUpdate();
                win.send('outfit', outfit);
            }
        }
        // other
        const user = networked.get(id2str(event.gameId));
        if (user) {
            Object.assign(user.outfit, event); // save real setup
            Object.assign(event, user.override); // write custom setup
            return true;
            /*Object.assign(user.outfit, event);
             user.outfit.inner = user.outfit.innerwear; // TODO
             Object.assign(event, user.override);
             event.innerwear = event.inner // TODO
             return true*/
        }
    });

    addHook('S_ITEM_CUSTOM_STRING', 2, (event) => {
        const user = networked.get(id2str(event.gameId));
        if (user && user.override.costumeText !== null) {
            customStrings: [{ //idk why this here tbh fam it does nothing
                string: user.override.costumeText
            }];
        }
    });
    addHook('S_SOCIAL', 1, (event) => {
        if ([31, 32, 33].indexOf(event.animation) === -1)
            return;
        if (event.target === game.me.gameId) {
            if (options.hideidle)
                return false;
        } else {
            const user = networked.get(id2str(event.target));
            if (user && user.options.hideidle)
                return false;
        }
    });

    addHook('S_ABNORMALITY_BEGIN', 3 , setCrystalbind);
    addHook('S_ABNORMALITY_REFRESH', 1, setCrystalbind);
    addHook('S_ABNORMALITY_END', 1, (event) => {
        if (event.target === game.me.gameId ) {
            if (event.id === 4600 || event.id === 4610) {
                crystalbind = {
                    expires: 0,
                    stacks: 0,
                    type: 0
                };
                if (options.hidecb) {
                    event.id = 1101 + 2 * (event.id === 4610);
                    return true;
                }
            }
        }
    });
    addHook('S_RETURN_TO_LOBBY', 1, () => {
        ingame = false;
    });
    // }

    function updateNametag(nametag) {
        dispatch.send('S_ITEM_CUSTOM_STRING', 2, {
            gameId: game.me.gameId,
            customStrings: [{
                dbid: nametag.id,
                string: nametag.text
            }]
        });
        nametagUpdate();
        win.send('text', nametag);
    }

    function setCrystalbind(event) {
        if (event.id !== 4600 && event.id !== 4610)
            return;
        if (event.target === game.me.gameId) {
            crystalbind = {
                expires: Date.now() + event.duration,
                stacks: event.stacks,
                type: +(event.id === 4610)
            };
            if (options.hidecb) {
                event.id = 1101 + 2 * crystalbind.type;
                return true;
            }
        } else {
            const user = networked.get(id2str(event.id));
            if (user && user.options.hidecb)
                return false;
        }
    }


    /* ------------- *
     * SERVER EVENTS *
     * ------------- */
    function addUser(id, user = {}) {
        if (!user.outfit)
            user.outfit = {};
        if (!user.override)
            user.override = {};
        if (!user.options)
            user.options = {};
        networked.set(id, user);
    }
    net.on('connect', () => {
        if (!game.me.gameId || game.me.gameId === 0n)
            return;
        net.send('login', id2str(game.me.gameId));
        net.send('options', options);
        net.send('outfit', override);
        net.send('mount', presets[player].mountId);
        // TODO: text, cb?
    });
    net.on('users', (users) => {
        for (const id of Object.keys(users)) {
            addUser(id, users[id]);
        }
    });
    net.on('add', (id) => {
        addUser(id);
    });
    net.on('remove', (id) => {
        networked.delete(id);
    });
    net.on('ping', () => {
        net.send('pong');
    });

    net.on('mount', (id, mount) => {
        if (ingame) {
            if (!networked.has(id))
                return;
            const user = networked.get(id);
            user.override.mountId = mount;
        }
    });

    net.on('outfit', (id, over) => {
        if (ingame) {
            if (!networked.has(id))
                return;
            const user = networked.get(id);
            user.override = over;
            const base = {
                id: str2id(id),
                enable: true
            };
            const outfit = Object.assign(base, user.outfit, user.override);
            dispatch.send('S_USER_EXTERNAL_CHANGE', 7, outfit);
        }
    });
    net.on('text', (id, dbid, string) => {
        if (ingame) {
            if (networked.has(id)) {
                Object.assign(networked.get(id).override, {
                    costume: dbid,
                    costumeText: string
                });

                dispatch.send('S_ITEM_CUSTOM_STRING', 2, {

                    gameId: str2id(id),
                    customStrings: [{
                        dbid: dbid,
                        string: string
                    }]

                });
            }
        }
    });


    net.on('option', (id, key, val) => {
        if (ingame) {
            if (networked.has(id))
                networked.get(id).options[key] = val;
        }
    });

    net.on('abnBegin', (id, abnormal) => {
        if (ingame) {
            if (!networked.has(id))
                return;
            if (config.allowEffects) {
                dispatch.send('S_ABNORMALITY_BEGIN', 3, {
                    target: str2id(id),
                    source: 6969696,
                    id: abnormal,
                    duration: 0,
                    unk: 0,
                    stacks: 1,
                    unk2: 0,
                    unk3: 0
                });
            }
        }
    });

    net.on('abnEnd', (id, abnormal) => {
        if (ingame) {
            if (!networked.has(id))
                return;
            if (config.allowEffects) {
                dispatch.send('S_ABNORMALITY_END', 1, {
                    target: str2id(id),
                    id: abnormal
                });
            }
        }
    });
    net.on('cb', (id, cb) => {
        const cid = str2id(id);
        const type = 4600 + 10 * cb.type;
        if (cb.expires) {
            dispatch.send('S_ABNORMALITY_BEGIN', 3, {
                target: cid,
                source: cid,
                id: type,
                duration: crystalbind.expires,
                stacks: crystalbind.stacks,
                unk: 0,
                unk2: 0,
                unk3: 0
            });
        } else {
            dispatch.send('S_ABNORMALITY_END', 1, {
                target: cid,
                id: type
            });
        }
    });
    net.on('emote', (id, emote) => {
        dispatch.send('S_SOCIAL', 1, {
            target: str2id(id),
            animation: emote
        });
    });
    net.on('changer', (id, field, value) => {
        if (config.allowChangers && ingame) {
            dispatch.send('S_ABNORMALITY_BEGIN', 3, {
                target: str2id(id),
                source: 6969696,
                id: field,
                duration: 0,
                unk: 0,
                stacks: value,
                unk2: 0,
                unk3: 0
            });
        }
    });

    net.on('error', (err) => {
        // TODO
        console.log('[ARBOREAN APPAREL] - Your connection to the costume sharing server has been terminated!');
        console.log(err);
    });
    /* ---------- *
     * INITIALIZE *
     * ---------- */
    if (config.online) {
        net.connect({
            host: config.serverHost,
            port: config.serverPort
        });
    }
    this.destructor = () => {
        net.close();
        win.close();
        try {
            command.remove('aa');
        } catch (e) {
        }
    };
    //win.show();
};