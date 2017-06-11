const attachments = require('./attachments');
const SlackBot = require('slackbots');
const levelup = require('levelup')

const bot = new SlackBot({
    token: process.env.SLACK_BOT_TOKEN, // Add a bot https://my.slack.com/services/new/bot and put the token
    name: 'bob'
});
const db = levelup('./database', {valueEncoding: 'json'});
const params = {icon_emoji: ':rice:'};
const channels = {};
const users = {};

const STATES = {
    NONE: 0,
    REGISTER: 1,
    DELETE: 2
};

bot.on('start', function() {
    bot.users.map(user => {
        if (user.id && user.name) {
            user.state = STATES.NONE;
            users[user.id] = user;
        }
    });
    bot.channels.map(channel => {
        channels[channel.id] = channel;
    });
    bot.groups.map(group => {
        channels[group.id] = group;
    });
});

bot.on('message', data => {
    if (data.type != 'message') return;
    if (isBot(data)) return;
    const receiver = users[data.user];
    const dest = getName(channels, data.channel) || receiver.name;
    const message = data.text;

    switch (message) {
        case '밥' :
            bot.postTo(dest, `${receiver.real_name}님, 식사는 하셨나요?`, attachments.commands);
            return;
        case '등록' :
            if (isDm(data)) {
                bot.postTo(dest, '등록하려는 가게 이름을 말해주세요.\n입력을 취소하려면 `취소`라고 말해주세요.', params);
                users[data.user].state = STATES.REGISTER;
            } else {
                bot.postTo(dest, '`등록`은 DM으로 부탁드려요.', params);
            }
            return;
        case '목록' :
            fetchPrefix('place', (err, places) => {
                places.sort((a, b) => {
                    if (a.createdDate > b.createdDate) return 1;
                    if (b.createdDate > a.createdDate) return -1;
                    return 0;
                });
                bot.postTo(dest, '오늘 식사는 정하셨나요?:fork_and_knife:', attachments.places(places));
            });
            break;
        case '삭제' :
            if (isDm(data)) {
                bot.postTo(dest, '삭제하려는 가게 이름을 말해주세요.\n입력을 취소하려면 `취소`라고 말해주세요.', params);
                users[data.user].state = STATES.DELETE;
            } else {
                bot.postTo(dest, '`삭제`는 DM으로 부탁드려요.', params);
            }
            return;
        case '랜덤' :
            fetchPrefix('place', (err, places) => {
                const idx = Math.floor(Math.random() * places.length);
                const place = places[idx];
                bot.postTo(dest, `오늘 식사는 ${place.title} 어떠신가요?`, attachments.place(place));
            });
            return;
        case '취소' :
            if (receiver.state != STATES.NONE) {
                receiver.state = STATES.NONE;
                bot.postTo(dest, '', attachments.message('취소했어요.'));
            }
        default :
            if (!data.text || !isDm(data)) return;
            const title = data.text
            const key = `place-${title}`;
            if (receiver.state === STATES.REGISTER) {
                const user = receiver;
                const createdDate = new Date();
                const place = {title, user,createdDate};
                db.get(key, (err, duplicatedPlace) => {
                    if (duplicatedPlace) {
                        bot.postTo(dest, `${title} 식당은 이미 등록되어 있어요.`, attachments.place(place));
                        return;
                    }
                    db.put(key, place);
                    receiver.state = STATES.NONE;
                    const ChannelName = process.env.SLACK_BOT_PUBLIC_CHANNEL;
                    bot.postTo(ChannelName, `새 식당이 등록됐어요!:tada:`, attachments.place(place));
                    bot.postTo(dest, `감사합니다. *_${title}_* 식당이 등록됐어요!:confetti_ball:`, attachments.place(place));
                });
            }
            else if (receiver.state == STATES.DELETE) {
                db.get(key, err => {
                    if (err) {
                        bot.postTo(dest, '', {
                            icon_emoji: ':rice:',
                            attachments: [{color: 'danger', text: `${title} 식당은 등록되있지 않아요.`}]
                        });
                    } else {
                        db.del(key);
                        const ChannelName = process.env.SLACK_BOT_PUBLIC_CHANNEL;
                        bot.postTo(ChannelName, '', attachments.message(`${title} 식당이 삭제됐어요.`));
                        bot.postTo(dest, '', attachments.message(`${title} 식당을 삭제했어요.`));
                    }
                });
                receiver.state = STATES.NONE;
            }
            break;
    }
});

function isBot(data) {
    return (data && data.bot_id);
}

function isDm(data) {
    return !getName(channels, data.channel);
}

function getName(array, id) {
    return (array[id]) ? array[id].name : null;
}

function fetchPrefix(prefix, cb) {
    const values = [];
    let error;
    db.createReadStream({
        start: `${prefix}`,
        end: `${prefix}\xFF`
    }).on('data', data => {
        values.push(data.value);
    }).on('error', err => {
        error = err;
    }).on('close', () => error ? cb(error) : cb(null, values));
}
