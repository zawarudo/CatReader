module.exports = {

  getSplitWordStyle: function(splitWord, textStyle, availableWidth) {
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

  splitByOptimalCenter: function(text) {
    var length = text.length;
    if(length == 0) { return [undefined, undefined] };
    if(length == 1) { return [undefined, text] };
    if(length == 2) { return [text[0], text[1]] } 
    if(length == 3) { return [text[0], text[1], text[2]] } 

    var ORP = this.getOptimalRecognitionPoint(text);

    var left = text.slice(0,ORP),
        center = text[ORP],
        right = text.slice(ORP + 1);

    return [left, center, right];
  },

  getOptimalRecognitionPoint: function(text) {
    var length = text.length;
    var offset = length >= 9 ? 2 : 1;
    var nearCenter = Math.floor(length / 2) - offset;
    if (nearCenter < 1) {
      return 0
    } else {
      return nearCenter;
    }
  },

  getTokensFromText: function(text) {
    var textTokens = this.tokenizeText(text);
    // Empty token to paint an empty canvas at the end
    textTokens.push('');
    return textTokens;
  },

  tokenizeText: function (text) {
    return text.trim().split(' ');
  }
}