console.log('Its alive aayyy');

//Holds artist arrays at the key of the user who tweeted the bot.
var userHash = new HashTable(3);

var twitterHash = new HashTable(3);

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
        doneWithAJAX(userID,artist,increment,"artist");
      //}
    }
  });
}

function apiSearchSong(userID,song,increment){
  var url = baseURL + "track/search?api_key=ac72a0fa210fdd16b336abb22a2daf49&title="+song[increment].split(' ').join('+')+"&limit=3";
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
        userHash.search(userID).addSong(json.data[0].id);
        console.log("Added "+json.data[0].id+" to "+userID);
        doneWithAJAX(userID,song,increment,"song");
      //}
    }
  });
}


function apiMakePlaylist(url,userID){
    console.log("Pulling Data from : "+url);
    request(url,function(err,res,body){
    var json = JSON.parse(body);
    if(json.status.code != "0"){
      console.log("We have an error!");
      console.log("The error is "+json.status.message);
    }else{
      for(var i =0;i<json.data.length;i++){
        if(json.data[i].track_youtube_id != undefined){
          console.log("Youtube link found, "+json.data[i].track_youtube_id);
          userHash.search(userID).addLink(json.data[i].track_youtube_id);
        }
      }
      tweetUser(userID);
    }
  });
}

function doneWithAJAX(userID,resourceArray,increment,resource){
  switch (resource) {
    case "artist":
    if (userHash.search(userID).artistLength() != resourceArray.length) {
      increment++;
      apiSearchArtist(userID,resourceArray,increment);
    }else{
      userHash.search(userID).doneWithArtistCalls = true;
      checkIfDoneWithCalls(userID);
    }
      break;
    case "song":
    if (userHash.search(userID).songLength() != resourceArray.length) {
      increment++;
      apiSearchSong(userID,resourceArray,increment);
    }else{
      userHash.search(userID).doneWithSongCalls = true;
      checkIfDoneWithCalls(userID);
    }
      break;
    default:

  }
}
//getArtistInfo();

function checkIfDoneWithCalls(userID){
  //If We are done with the calls, then make the playlist, otherwise we still need to call things.
  var person = userHash.search(userID);
  if(person.doneWithSongCalls && person.doneWithArtistCalls){
    createPlaylistURL(userID);
  }
}

var stream = T.stream('user');

stream.on('tweet', function (tweet) {
  console.log("We got a Tweet!\n");
  var json = JSON.stringify(tweet);
  fs.writeFile("Message.json",json);
  tweetEvent(tweet);
});

function tweetEvent(eventMsg){
	var from = eventMsg.user.screen_name;
  console.log("The tweet was from: "+from);
  var text = eventMsg.text+"";

  if(from !== "MusicSuggestIO"){
    userHash.add(eventMsg.id_str, new Person());

    twitterHash.add(eventMsg.id_str, eventMsg.user.screen_name);

    parseText(eventMsg.id_str,text);
  }

	// if(from !== 'MusicSuggestIO'){
  //   var newTweet = '@' + from+ ' '+knockknock();
  //   tweetIt(newTweet, eventMsg.id_str);
  // }
}

function tweetUser(userID){
  var basePlaylistURL = "http://www.youtube.com/watch_videos?video_ids=";
  var videoIDs = "";
  while(userHash.search(userID).peekLink()){
    videoIDs = videoIDs + userHash.search(userID).popLink();
    if(userHash.search(userID).peekLink()){
      videoIDs = videoIDs +",";
    }
  }
  console.log("Youtube URLS are "+videoIDs);
  TinyURL.shorten(basePlaylistURL+videoIDs, function(res) {
    var newTweet = '@' + twitterHash.search(userID) + " Your Playist is: "+res;
    tweetIt(newTweet, userID);
  });
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
  if(searchTerms[1] !="]"){
    var json = JSON.parse(searchTerms);
    if(json.artist){
      if(json.artist.length !=0){
        console.log("We have "+json.artist.length+ " artists!");
        userHash.search(userID).doneWithArtistCalls = false;
        apiSearchArtist(userID,json.artist,0);
      }
    }
    if(json.track){
      if(json.track.length != 0){
        console.log("We have"+ json.track.length + "tracks!");
        userHash.search(userID).doneWithSongCalls = false;
        apiSearchSong(userID,json.track,0);
      }
    }
    if(json.genre){
      if(json.genre.length != 0){
        console.log("We have genere!");
      }
    }
    if(json.decade){
      if(json.decade.length != 0){
        console.log("We have decade!");
      }
    }
    if(json.album){
      if(json.album.length != 0){
        console.log("We have album!");
      }
    }
  }
}

function createPlaylistURL(userID){
    var currentPerson = userHash.search(userID);
    var url = baseURL + "playlist?api_key=ac72a0fa210fdd16b336abb22a2daf49";
    if(currentPerson.artistLength() != 0){
      url = url + "&artist_ids=";
      for(var i = 0; i<currentPerson.artistLength()+1;i++){
        url = url + currentPerson.popArtist();
        if(currentPerson.peekArtist()){
          url = url + ",";
        }
      }
    }
    if(currentPerson.songLength() != 0){
      url = url + "&track_ids="
      for(var i = 0; i<currentPerson.songLength()+1;i++){
        url = url + currentPerson.popSong();
        if(currentPerson.peekSong()){
          url = url + ",";
        }
      }
    }
    apiMakePlaylist(url,userID);
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
  this.song = new Stack();
  this.youtube = new Stack();
  this.doneWithArtistCalls = true;
  this.doneWithSongCalls = true;
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

Person.prototype.addSong = function (song) {
  this.song.push(artist);
};

Person.prototype.popSong = function () {
  return this.song.pop();
};

Person.prototype.peekSong = function () {
  return this.song.peek();
};

Person.prototype.songLength = function () {
  return this.song.length();
};

Person.prototype.addLink = function (link) {
  this.youtube.push(link);
};

Person.prototype.popLink = function () {
  return this.youtube.pop();
};

Person.prototype.peekLink = function () {
  return this.youtube.peek();
};

Person.prototype.linkLength = function () {
  return this.youtube.length();
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
