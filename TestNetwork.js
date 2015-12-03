var synaptic = require('./synaptic/src/synaptic.js')
var words = ["What", "dog", "cat", "not", "are", "machine", "?", "you", "am", "i", ".", "know", "<end>", "<start>"]
var dictionary = {
  "what": 0,
  "dog": 1,
  "cat": 2,
  "not": 3,
  "are": 4,
  "machine": 5,
  "?": 6,
  "you": 7,
  "am": 8,
  "i": 9,
  ".": 10,
  "know": 11,
  "<end>": 12,
  "<start>": 13
};
var puncs = ["!", ",", "?", "."];

var network = new synaptic.Architect.LSTM(14, 14, 14, 14, 14, 14);

function vectorBuilder(sentence) {
  puncs.forEach(function(puncy) {
    var idx = sentence.indexOf(puncy);
    if (idx !== -1) {
      sentence = sentence.slice(0, idx) + ' ' + sentence.slice(idx);
    }
  });
  var result = [];
  var newSentence = sentence.split(" ");
  for (var i = 0; i < newSentence.length; i++) {
    result.push(dictionary[newSentence[i].toLowerCase()]);
  }
  // result.push(dictionary['<start>']);
  return result;
};
var trainingData = ["I am cat.",
  "You are cat.",
  "I am dog.",
  "You are dog.",
  "What am I?",
  "I not know.",
  "What are you?",
  "I am machine.",
  "I am cat. What am I?",
  "You are cat.",
  "I am dog. What am I?",
  "You are dog.",
  "What am I?",
  "You are dog.",
  "I am not cat.",
  "You are dog.",
  "I am not dog.",
  "You are cat.",
  "What am I?",
  "You are cat."
];
// var trainingData = [
//   "I am cat.",
//   "You is cat.",
//   "I am dog.",
//   "You is dog.",
//   "What am I?",
//   "You not know.",
//   "What are you?",
//   "I am machine.",
//   "I am cat. What am I?",
//   "You is cat.",
//   "I am dog. What am I?",
//   "You is dog.",
//   "What am I?",
//   "You are dog.",
//   "I am not cat.",
//   "You are dog.",
//   "I am not dog.",
//   "You is machine.",
//   "What am I?",
//   "You are cat dog."
// ];
var allZeros = []
for (var i = 0; i < words.length; i++) {
  allZeros.push(0);
}

var trainCollection = function() {
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
    console.log('original: ', trainingData[trainingIndex + 1])
      // console.log('poop:', trainingSet)


    // network.trainer.train(trainingSet, {
    //   shuffle: true
    // });
    network.trainer.train(trainingSet);
    trainingIndex += 2;
  }
};

var indexToInputVector = function (sentenceVector) {
  var resArr = []
  for(var i = 0; i < sentenceVector.length; i++) {
    var inputVector = allZeros.slice();
    inputVector[sentenceVector[i]] = 1;
    resArr.push(inputVector);
  }
  return resArr;
}

var matSub = function (vec1, vec2) {
  if( vec1.length !== vec2.length) {
    return null;
  } else {
    var resVec = [];
    for(var i = 0; i < vec1.length; i++) {
      resVec.push(vec1[i] - vec2[i]);
    }
    return resVec;
  }
}

var trainCalRes = function (call, response) {
  var callVect = vectorBuilder(call);
  var callWordVects = indexToInputVector(callVect);
  var resVect = vectorBuilder(response);
  var resWordVects = indexToInputVector(resVect);

  for(var i = 0; i < resWordVects.length -1; i++) {
    for(var j = 0; j < callWordVects.length; j++) {
      network.activate(callWordVects[j]);
    }
    var outputs = [];
    for(var k = 0; k < i; k++) {
      outputs.push(network.activate(resWordVects[k]));
    }
    var output = network.activate(resWordVects[i]);
    network.propagate(0.1, resWordVects[i+1]);
    for(var x = i - 1; x >= 0; x++) {
      var guess = matSub(outputs[x], network.getErrors());
      if(guess === null) {
        console.log('I CAN"T MATH');
      }
      network.propagate(0.1, guess);
    }
  }


}

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
console.log(talk());
