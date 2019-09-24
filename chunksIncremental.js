/**
 * Minor change to chunks.js to support arbitrary numbers of messages.
 * TODO: Use a message queue
 * TODO: Re-open on timeout/close
 */ 
function ChunkWsIncremental (theChunkUrl,messageCallback,errorCallback) {

    this.chunkUrl = theChunkUrl;
    const self = this; // Can't use 'this' to refer to object inside functions
    self.wso = null;  //new WebSocket(this.chunkUrl);

    self.buildWs = function() {
        let newWs = new WebSocket(this.chunkUrl);
        newWs.onmessage = function(event) {
            console.log('received websocket event data: ' + event.data);
            message = JSON.parse(event.data);
            if(message.status == 'SUCCESS') {
                self.completedChunks += 1;
                console.log("Completed " + self.completedChunks + " chunks. Sent " + self.sentChunks + ".")
            }
            console.log('this: ' + JSON.stringify(self));
            // Sends the number of outstanding messages
            messageCallback(self.sentChunks-self.completedChunks,self.wsError,message);
        }

        newWs.onerror = function(error){
            console.error('websocket error detected: ' + JSON.stringify(error));
            self.wsError = 1;
            errorCallback(error);
            //console.error('called callback, trying to recreate ws connection');
            //self.wso = null;
            //setTimeout(self.buildWs(), 4000);
        }

        newWs.onclose = function(){
            console.error("ws closed; re-creating");
            // connection closed, discard old websocket and create a new one in 4s
            self.wso = null;
            setTimeout(self.buildWs(), 4000);
        }
        self.wso = newWs;

    }

    this.buildWs();

    this.wsError = 0;
    this.completedChunks = 0;
    this.sentChunks = 0;
    this.msgs = [];
    
    this.sendChunk = function(dataChunk) {
        if(dataChunk['experimentId'] == null) console.error("Requires defined experimentId")
        if(dataChunk['sessionId'] == null) console.error("Requires defined sessionId")
        let dataStr = JSON.stringify(dataChunk);
        if (self.wso.readyState !== 1) {
            self.msgs.push(dataStr);
        } else {
            self.wso.send(dataStr);
            self.sentChunks += 1;
        }
    }

    this.sendAll = function() {
        while (self.msgs.length > 0) {
            self.wso.send(self.msgs.pop());
            self.sentChunks += 1;
        }
    }

    this.wso.onopen = this.sendAll;
}
//​
ChunkWsIncremental.prototype = {
    constructor: ChunkWsIncremental
}
