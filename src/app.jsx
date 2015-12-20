var React = require('react');
var CatReader = require('./components/CatReader');

var Hello = React.createClass({
  render: function() {
    
    return <CatReader wordsPerMinute={250} fontName='Arimo' width={800} height={300}/>
  }
});

var element = React.createElement(Hello, {});
React.render(element, document.querySelector('.container'));