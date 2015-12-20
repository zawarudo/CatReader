var React = require('react');
var ReactCanvas = require('react-canvas');
var measureText = ReactCanvas.measureText;
var Surface = ReactCanvas.Surface;
var Image = ReactCanvas.Image;
var Text = ReactCanvas.Text;
var Layer = ReactCanvas.Layer;
var Group = ReactCanvas.Group;
var FontFace = ReactCanvas.FontFace;
var utils = require('../textUtils');

module.exports = React.createClass({
  getInitialState: function() {
    var defaultText = 'I\'ve seen things you people wouldn\'t believe. Attack ships on fire off the shoulder of Orion. I watched c-beams glitter in the dark near the Tannhuser Gate. All those moments will be lost in time, like tears in rain.';
    var text = this.props.text || defaultText;
    var fontName = this.props.fontName || 'Sans-serif';
    var fontOptions = this.props.fontOptions || {weight: 'bold'};
    var width = this.props.width || 500;
    var height = this.props.height || 300;
    var wpm = this.props.wordsPerMinute || 300;
    var speed = this.getSpeedFromWPM(wpm);
    var repeatNum = this.props.repeatNum || 3;

    var textTokens = utils.getTokensFromText(text);

    return {
      text: text,
      textTokens: textTokens,
      fontName: fontName,
      fontOptions: fontOptions,
      currWord: [],
      height: height,
      width: width,
      speed: speed,
      wpm: wpm,
      repeatNum: repeatNum,
      paused: true
    };
  },

  componentWillMount: function() {
    this.setTimer();
    this.setState({ paused: false });
  },

  render: function () {
    // getAbsoluteCenteringStyle and getRelativeCenteringStyle work together to center align content absolutely
    var getAbsoluteCenteringStyle = function() {
      return {
        display: 'inline-block',
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: this.state.width, 
        height: this.state.height
      }
    }.bind(this);

    var getRelativeCenteringStyle = function() {
      return {
        position: 'relative',
        left: '-50%',
        top: '-50%',
        backgroundColor: '#f0f0f0'
      }
    }

    var getCanvasStyle = function() {
      return {
        backgroundColor: '#000'
      };
    }
    
    return (
      <div style={getAbsoluteCenteringStyle()}>
        <div style={getRelativeCenteringStyle()} onClick={this.handleCanvasClick}>
          <Surface width={this.state.width} height={this.state.height} left={0} top={0}>
            <Group style={getCanvasStyle()}>
              {this.renderText()}
            </Group>
          </Surface>
          <div>
            {this.renderControls()}
          </div>
        </div>
      </div>
    );
  },

  handleCanvasClick: function() {
    isCanvas = event.target.toString() === '[object HTMLCanvasElement]';
    if(!isCanvas) { return; }

    this.togglePausePlay();
  },

  renderControls: function() {
    return <div>
      {this.renderPausePlay()}
      {this.renderSpeedPicker()}
    </div>
  },

  renderPausePlay: function() {
    if(this.state.paused) {
      return <i onClick={this.togglePausePlay} className="icon-play"></i>
    } else {
      return <i onClick={this.togglePausePlay} className="icon-pause"></i>
    }
  },

  renderSpeedPicker: function() {
    return <select onChange={this.changeSpeed} value={this.state.wpm}>
      <option>250</option>
      <option>300</option>
      <option>400</option>
      <option>500</option>
      <option>600</option>
      <option>700</option>
      <option>750</option>
    </select>
  },

  changeSpeed: function(event) {
    this.clearTimer();
    var wpm = Number(event.target.value);
    if(wpm == this.state.wpm) { return };

    var speed = this.getSpeedFromWPM(wpm);
    this.setState({
      paused: true,
      speed: speed,
      wpm: wpm
    });
  },

  renderText: function() {
    var currWord = this.state.currWord || false;
    if(!currWord.length) {
      // Default State
      var textStyle = this.getTextStyle();
      return <Text style={textStyle}>
      </Text>
    } else {
      return this.renderSplitText(currWord);
    }
  },

  /**
  * Render {string} currWord centered and highlighted on the user's focal point
  * @return {React-Canvas Text} objects representing one word.
  */
  renderSplitText: function(currWord) {
    // Point at which user's eyes will focus when reading
    var focalPoint = {
      x: this.state.width/3,
      y: this.state.height/2
    }
    // Transform word into arrays of [before ORP][ORP][afterORP]
    var splitTextArray = utils.splitByOptimalCenter(currWord);
    // Calculate attributes of parts
    var availableWidth = this.state.width;
    var textStyle = this.getTextStyle();
    var measurements = this.getTextArrayAttribs(splitTextArray, textStyle, availableWidth);

    // Calculate position of parts to reconstruct word, offsetting the left position of each
    var LEFT = 0,
        CENTER = 1,
        RIGHT = 2;

    var offsets = [];

    offsets[LEFT] = focalPoint.x - measurements[LEFT].width - measurements[CENTER].width/2,
    offsets[CENTER] = focalPoint.x - measurements[CENTER].width/2,
    offsets[RIGHT] = focalPoint.x + measurements[CENTER].width/2


    // Render parts
    return splitTextArray.map(function(textPart, pos) {
      var style = this.getTextStyle();
      style.top = focalPoint.y;

      style.left = offsets[pos];

      if(pos === CENTER) {
        style.color = 'red';
      }

      return <Text style={style}>
          {textPart}
        </Text>
    }.bind(this));
  },

  getTextArrayAttribs: function(splitWord, textStyle, availableWidth) {
    var attributes = [];

    splitWord.forEach(function(word){
      var textAttributes = measureText(
                                  word, 
                                  availableWidth, 
                                  textStyle.fontFace, 
                                  textStyle.fontSize, 
                                  textStyle.lineHeight);
      attributes.push(textAttributes);
    }.bind(this));

    return attributes;
  },

  togglePausePlay: function() {
    var paused = !this.state.paused;
    if(paused) {
      this.clearTimer();
    } else {
      this.setTimer();
    }

    this.setState({
      paused: paused
    })
  },

  tick : function() {
    if(this.state.paused) { return; }

    var textTokens = this.state.textTokens;
    var currWord = textTokens.shift();
    // Shift modifies textTokens, thus we are left with the remaining elements
    var tokensLeft = textTokens;

    var newState = {
      currWord: currWord,
      textTokens: tokensLeft
    };

    // Character that should trigger a temp "slowdown" of the reading speed
    // Example: period at the end of a sentence
    var delay = this.getDelay(currWord);

    var isEmpty = !tokensLeft.length;
    var shouldRepeat = this.state.repeatNum > 0;

    if(isEmpty && shouldRepeat) {
      this.setState({
        repeatNum: this.state.repeatNum - 1,
        textTokens: utils.getTokensFromText(this.state.text)
      });
      return;
    }

    if(isEmpty) { 
      this.clearTimer();
      newState.paused = true; 
      newState.textTokens = utils.getTokensFromText(this.state.text);
    } else if (delay) {
      this.setTimerDelayed(delay);
    }

    this.setState(newState);
  },  

  getDelay: function(text) {
    var periodDelay = text.indexOf('.') >= 0;
    if(periodDelay) {
      return 200;
    }
  },

  getSpeedFromWPM: function(wpm) {
    var wpm = Number(wpm);
    return 1000 / (wpm / 60);
  },

  setTimer: function() {
    this.clearTimer();
    this.interval = setInterval(this.tick, this.state.speed);
  },

  setTimerDelayed: function(delay) {
    this.clearTimer();
    setTimeout(this.setTimer, delay);
  },

  clearTimer: function() {
    clearInterval(this.interval);
  },

  getTextStyle: function () {
    var fontFace = FontFace(this.state.fontName,'', this.state.fontOptions );
    
    return {
      top: 30,
      left: 30,
      width: this.state.width,
      height: this.state.height,
      fontFace: fontFace,
      fontSize: 72
    }
  }
});