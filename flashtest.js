var synaptic = require('./synaptic/src/synaptic.js')
var script = require('./flashy.js');
var fs = require('fs');

var dictionary = {};
var words = [];

var count = 0;


script.forEach(function(line) {
  var words = line.split(' ');
  for (var i = 0; i < words.length; i++) {
    if (!dictionary[words[i].toLowerCase()]) {
      dictionary[words[i].toLowerCase()] = count;
      count++;
    }
  }
});

dictionary['<start>'] = ++count;
dictionary['<end>'] = ++count;

for (var key in dictionary) {
  words.push(key);
}

var network = new synaptic.Architect.LSTM(count, count, count);

function vectorBuilder(sentence) {
  var result = [];
  var newSentence = sentence.split(" ");
  for (var i = 0; i < newSentence.length; i++) {
    result.push(dictionary[newSentence[i].toLowerCase()]);
  }
  // result.push(dictionary['<start>']);
  return result;
};

var allZeros = []
for (var i = 0; i < words.length; i++) {
  allZeros.push(0);
}

var train = function() {
  var trainingIndex = 0;
  while (trainingIndex < trainingData.length) {
    var unsupInput = vectorBuilder(trainingData[trainingIndex]);
    // unsupInput.shift(dictionary['<start>'])
    unsupInput.push(dictionary['<start>'])
      // for (var i = 0; i < unsupInput.length; i++) {
    for (var i = 0; i < unsupInput.length - 1; i++) {
      input = allZeros.slice();
      input[unsupInput[i]] = 1;
      network.activate(input);
    }
    var trainingSet = [];
    var supInput = vectorBuilder(trainingData[trainingIndex + 1]);
    supInput.push(dictionary['<end>'])
    input = allZeros.slice();
    input[unsupInput.length - 1] = 1;
    output = allZeros.slice();
    output[supInput[0]] = 1;
    trainingSet.push({
      'input': input,
      'output': output
    });
    // network.activate(input);
    // network.propagate(0.1, output);
    for (var i = 0; i < supInput.length - 1; i++) {
      input = output
      output = allZeros.slice();
      output[supInput[i + 1]] = 1;
      trainingSet.push({
        'input': input,
        'output': output
      });
      // network.activate(input);
      // network.propagate(0.1, output);
    }
    //console.log('original: ', trainingData[trainingIndex + 1])
    // console.log('poop:', trainingSet)


    // network.trainer.train(trainingSet, {
    //   shuffle: true
    // });
    network.trainer.train(trainingSet);
    trainingIndex += 2;
  }
};

function translate(vector) {
  // console.log('fuck : ', vector)
  var val = Math.max.apply(null, vector);
  var index = vector.indexOf(val);
  // vector[index] = -1;
  // val = Math.max.apply(null, vector);
  index = vector.indexOf(val);
  if (index !== -1) {
    return words[index];
  } else {
    return 'holy fuck what did we do?';
  }
}

var talk = function() {
    var trainingIndex = 0;
    var resArr = []
    while (trainingIndex < trainingData.length) {
      var unsupInput = vectorBuilder(trainingData[trainingIndex]);
      unsupInput.shift(dictionary['<start>']);
      for (var i = 0; i < unsupInput.length - 1; i++) {
        input = allZeros.slice();
        input[unsupInput[i]] = 1;
        network.activate(input);
      }
      var resultVectors = []

      var input = allZeros.slice();
      input[unsupInput[unsupInput.length - 1]] = 1;
      var count = 0;
      var output = allZeros.slice();
      var notend = false;
      while (!(
          output.indexOf(Math.max.apply(null, output)) === words.length - 2 ||
          output.indexOf(Math.max.apply(null, output)) === 6 ||
          output.indexOf(Math.max.apply(null, output)) === 10
        ) && count < 4) {
        output = network.activate(input);
        console.log(output)
        resultVectors.push(translate(output));
        input = output;
        count++;
      }
      trainingIndex += 2;
      resArr.push(resultVectors.join(' '));
    }
    return resArr;
  }
  // for (var j = 0; j < 10; j++) {
train();
// }
fs.write('./poop.txt', network.toJSON(), function(err, data) {
  console.log(talk());
});
