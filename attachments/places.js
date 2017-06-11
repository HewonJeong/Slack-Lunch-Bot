module.exports = function(places) {
  return {
    icon_emoji: ':rice:',
    attachments: places.map(function(place) {
      return {
        color: 'good',
        title: place.title
      };
    })
  };
};
