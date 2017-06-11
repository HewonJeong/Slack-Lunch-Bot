module.exports = function(places) {
  console.log('len:' + places.length);
  return {
    icon_emoji: ':rice:',
    attachments: places.map(function(place) {
      console.log('title:' + place.title);
      return {
        color: 'good',
        //author_name: place.user.name,
        //author_link: "http://flickr.com/bobby/",
        //author_icon: place.user.profile.image_24,
        title: place.title
        // fields: [{
        //     title: '제보자',
        //     value: `@${place.user.name}`,
        //     short: true
        // }]
      };
    })
  };
};
