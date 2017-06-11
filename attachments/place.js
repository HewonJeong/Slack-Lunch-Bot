module.exports = function({title, user}) {
  return {
    icon_emoji: ':rice:',
    attachments: [{
      color: 'good',
      title: title,
      footer: `${user.name}`,
      footer_icon: user.profile.image_24
    }]
  };
};
