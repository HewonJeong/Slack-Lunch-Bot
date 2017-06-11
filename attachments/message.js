module.exports = function(text, color = 'good') {
    return {
        icon_emoji: ':rice:',
        attachments: [{
            color,
            text
        }]
    };
};
