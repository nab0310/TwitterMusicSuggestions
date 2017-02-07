console.log('Its alive aayyy');

//Holds artist arrays at the key of the user who tweeted the bot.
var userHash = new HashTable(3);

var numberOfTweets = 0;

var twit = require('twit');

var keys = require('./permissions.js');

var request = require('ajax-request');

var fs = require('fs');

var T = new twit(keys);

var TinyURL = require('tinyurl');

var baseURL = "http://api.musicgraph.com/api/v2/";

// TinyURL.shorten('http://google.com', function(res) {
//     console.log(res); //Returns a shorter version of http://google.com - http://tinyurl.com/2tx
// });

function apiSearchArtist(userID,artist,increment){
  var url = baseURL + "artist/search?api_key=ac72a0fa210fdd16b336abb22a2daf49&name="+artist[increment].split(' ').join('+')+"&limit=3";
  console.log("Pulling data from: "+url);
    request(url,function(err,res,body){
    var json = JSON.parse(body);
    if(json.status.code != "0"){
      console.log("We have an error!");
      console.log("The error is "+json.status.message);
    }else{
      //Lets ignore multiple results for now, thats too complicated
      // if(json.pagination.total != "1"){
      //   console.log("We have multiple results.");
      //   console.log("The results are: ");
      //   for(var i=0;i<json.data.length;i++){
      //     console.log(json.data[i].name + "\n");
      //   }
      // }else{
        userHash.search(userID).addArtist(json.data[0].id);
        console.log("Added "+json.data[0].id+" to "+userID);
        doneWithAJAX(userID,artist,increment);
      //}
    }
  });
}

function doneWithAJAX(userID,artist,increment){
  if (userHash.search(userID).artistLength() != artist.length) {
    increment++;
    apiSearchArtist(userID,artist,increment);
  }else{
    createPlaylist(userID);
  }
}
//getArtistInfo();

var stream = T.stream('user');

stream.on('tweet', function (tweet) {
  console.log("We got a Tweet!\n");
  var json = JSON.stringify(tweet);
  fs.writeFile("Message.json",json);
  tweetEvent(tweet);
});

function tweetEvent(eventMsg){
	var from = eventMsg.user.screen_name;
  var text = eventMsg.text+"";

  userHash.add(eventMsg.id_str, new Person());

  parseText(eventMsg.id_str,text);

	// if(from !== 'MusicSuggestIO'){
  //   var newTweet = '@' + from+ ' '+knockknock();
  //   tweetIt(newTweet, eventMsg.id_str);
  // }
}

function parseText(userID,text){
  //split the tweet we are given by spaces, and check for switches
  var searchTerms = "{";
  var closedTags = 0;
  var haveMoreTerms = 0;
  var previousCase = "";
  var array = text.split(" ");
  for(var i=0;i<array.length;i++){
    //Dont look at the @bot tag
    if (!array[i].includes("@")) {
      switch (array[i]) {
        case "-a":
        if(previousCase != "a" && i !=1){
          searchTerms = searchTerms + '"], artist": [';
        }else if(previousCase != "a"){
          searchTerms = searchTerms + '"artist":['
        }
        searchTerms = searchTerms + '"';
        previousCase = "a";
          closedTags = 0;
          haveMoreTerms = 0;
          var multipleWords = 0;
          while(array[i+1]){
            if(!array[i+1].includes("-")){
              if(multipleWords == 1){
                searchTerms = searchTerms + " ";
              }
              multipleWords = 1;
              console.log("Aritst is "+ array[i+1]);
              searchTerms = searchTerms + array[++i];
            }
            else{
              searchTerms = searchTerms + '"';
              closedTags = 1;
              haveMoreTerms = 1;
              break;
            }
          }
          if(closedTags == 0){
            searchTerms = searchTerms + '"';
          }
          if(haveMoreTerms == 1){
            searchTerms = searchTerms + ",";
          }
          break;
        case "-t":
          searchTerms = searchTerms + '"track": "';
          closedTags = 0;
          haveMoreTerms = 0;
          var multipleWords = 0;
          while(array[i+1]){
            if(!array[i+1].includes("-")){
              if(multipleWords == 1){
                searchTerms = searchTerms + " ";
              }
              multipleWords = 1;
              console.log("Track is "+ array[i+1]);
              searchTerms = searchTerms + array[++i];
            }
            else{
              searchTerms = searchTerms + '"';
              closedTags = 1;
              haveMoreTerms = 1;
              break;
            }
          }
          if(closedTags == 0){
            searchTerms = searchTerms + '"';
          }
          if(haveMoreTerms == 1){
            searchTerms = searchTerms + ",";
          }
          break;
        case "-g":
          searchTerms = searchTerms + '"genre": "';
          closedTags = 0;
          haveMoreTerms = 0;
          var multipleWords = 0;
          while(array[i+1]){
            if(!array[i+1].includes("-")){
              if(multipleWords == 1){
                searchTerms = searchTerms + " ";
              }
              multipleWords = 1;
              console.log("Genre is "+ array[i+1]);
              searchTerms = searchTerms + array[++i];
            }
            else{
              searchTerms = searchTerms + '"';
              closedTags = 1;
              haveMoreTerms = 1;
              break;
            }
          }
          if(closedTags == 0){
            searchTerms = searchTerms + '"';
          }
          if(haveMoreTerms == 1){
            searchTerms = searchTerms + ",";
          }
          break;
        case "-d":
          searchTerms = searchTerms + '"decade": "';
          closedTags = 0;
          haveMoreTerms = 0;
          var multipleWords = 0;
          while(array[i+1]){
            if(!array[i+1].includes("-")){
              if(multipleWords == 1){
                searchTerms = searchTerms + " ";
              }
              multipleWords = 1;
              console.log("Decade is "+ array[i+1]);
              searchTerms = searchTerms + array[++i];
            }
            else{
              searchTerms = searchTerms + '"';
              closedTags = 1;
              haveMoreTerms = 1;
              break;
            }
          }
          if(closedTags == 0){
            searchTerms = searchTerms + '"';
          }
          if(haveMoreTerms == 1){
            searchTerms = searchTerms + ",";
          }
          break;
        case "-ab":
          searchTerms = searchTerms + '"album": "';
          closedTags = 0;
          haveMoreTerms = 0;
          var multipleWords = 0;
          while(array[i+1]){
            if(!array[i+1].includes("-")){
              if(multipleWords == 1){
                searchTerms = searchTerms + " ";
              }
              multipleWords = 1;
              console.log("Aritst is "+ array[i+1]);
              searchTerms = searchTerms + array[++i];
            }
            else{
              searchTerms = searchTerms + '"';
              closedTags = 1;
              haveMoreTerms = 1;
              break;
            }
          }
          if(closedTags == 0){
            searchTerms = searchTerms + '"';
          }
          if(haveMoreTerms == 1){
            searchTerms = searchTerms + ",";
          }
          break;
        default:

      }
    }
  }
  searchTerms = searchTerms + "]}";
  console.log("The final search terms are: "+searchTerms);
  checkSearchTerms(userID,searchTerms);
}
//This function calls the api and checks to make sure if they are correct.
//If they are incorrect, the bot will tweet at the user and tell them their request was not found.
function checkSearchTerms(userID,searchTerms){
  var json = JSON.parse(searchTerms);
  if(json.artist){
    if(json.artist.length !=0){
      console.log("We have "+json.artist.length+ " artists!");
      apiSearchArtist(userID,json.artist,0);
    }
  }
  if(json.track){
    if(json.track.length != 0){
      console.log("We have artists!");
    }
  }
  if(json.genre){
    if(json.genre.length != 0){
      console.log("We have artists!");
    }
  }
  if(json.decade){
    if(json.decade.length != 0){
      console.log("We have artists!");
    }
  }
  if(json.album){
    if(json.album.length != 0){
      console.log("We have artists!");
    }
  }
}

function createPlaylist(userID){
  var currentPerson = userHash.search(userID);
  var artistIDs = "";
  for(var i = 0; i<currentPerson.artistLength()+1;i++){
    artistIDs = artistIDs + currentPerson.popArtist();
    if(currentPerson.peekArtist()){
      artistIDs = artistIDs + ",";
    }
  }
  console.log("The artist ID's we will search for will be: "+artistIDs);
}

function tweetIt(txt, statusID){
	var tweet = {
		status: txt,
		in_reply_to_1status_id: statusID
	}

	T.post('statuses/update',tweet,tweeted);

	function tweeted(err, data, response) {
		if(err){
			console.log("This went wrong! "+err);
		}else{
			console.log("It worked!");
		}
	}
}

function Person(){
  this.artist = new Stack();
};

Person.prototype.addArtist = function (artist) {
  this.artist.push(artist);
};

Person.prototype.popArtist = function () {
  return this.artist.pop();
};

Person.prototype.peekArtist = function () {
  return this.artist.peek();
};

Person.prototype.artistLength = function () {
  return this.artist.length();
};


function Stack() {
  this.stack = [];
}

Stack.prototype.push = function(value) {
  this.stack.push(value);
};
Stack.prototype.pop = function() {
  return this.stack.pop();
};
Stack.prototype.peek = function() {
  return this.stack[this.stack.length - 1];
};
Stack.prototype.length = function() {
  return this.stack.length;
};
Stack.prototype.print = function() {
  console.log(this.stack.join(' '));
};

function HashTable(size) {
  this.values = {};
  this.numberOfValues = 0;
  this.size = size;
}

HashTable.prototype.add = function(key, value) {
  var hash = this.calculateHash(key);
  if(!this.values.hasOwnProperty(hash)) {
    this.values[hash] = {};
  }
  if(!this.values[hash].hasOwnProperty(key)) {
    this.numberOfValues++;
  }
  this.values[hash][key] = value;
};
HashTable.prototype.remove = function(key) {
  var hash = this.calculateHash(key);
  if(this.values.hasOwnProperty(hash) && this.values[hash].hasOwnProperty(key)) {
    delete this.values[hash][key];
    this.numberOfValues--;
  }
};
HashTable.prototype.calculateHash = function(key) {
  return key.toString().length % this.size;
};
HashTable.prototype.search = function(key) {
  var hash = this.calculateHash(key);
  if(this.values.hasOwnProperty(hash) && this.values[hash].hasOwnProperty(key)) {
    return this.values[hash][key];
  } else {
    return null;
  }
};
HashTable.prototype.length = function() {
  return this.numberOfValues;
};
HashTable.prototype.print = function() {
  var string = '';
  for(var value in this.values) {
    for(var key in this.values[value]) {
      string += this.values[value][key] + ' ';
    }
  }
  console.log(string.trim());
};
