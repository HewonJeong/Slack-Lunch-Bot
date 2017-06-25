module.exports = function(places) {
  return {
    icon_emoji: ':rice:',
    attachments: [{
        color: 'good',
        fields: places.map(function(place) {
            return {title: place.title, short: true}
        })
    }]
  };
};
