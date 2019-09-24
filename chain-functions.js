    function getLastNine(chunks){
        var lastTrials = [];
        //console.log(JSON.stringify(chunks));
        while (lastTrials.length < 9 && chunks.length != 0){
            var last = chunks.pop();
            if(lastTrials.length == 0 || last.undo == 1){
                lastTrials.unshift(last);
                if(last.undo == 1){
                    chunks.pop();
                }
            } else {lastTrials.unshift(last);
            }
        }
        console.log(JSON.stringify(lastTrials));
        return lastTrials
    }

    function onlyValid(chunks){
        console.log(JSON.stringify(chunks));
        var footerChunks = chunks.filter(ch => ch.chunkType == "FOOTER");
        console.log(JSON.stringify(footerChunks));
        var i = 1;
        if(footerChunks.length == 0){
            return []
        } else {
            while(i <= footerChunks.length){
                if(footerChunks[footerChunks.length - i].isValid == false){
                    i = i + 1;
                } else {break}
            }
            if (i > footerChunks.length){
                return []
            } else{
            var validSessionId = footerChunks[footerChunks.length - i].sessionId;
            //console.log(JSON.stringify(validSessionId));
            var validChunks = chunks.filter((ch) => ch.sessionId == validSessionId);
            //console.log(JSON.stringify(validChunks));
            var filtChoice = validChunks.filter((ch) => ch.chunkType == "CHOICE");
            console.log(JSON.stringify(filtChoice));
            return filtChoice
            }
        }
    }
    
    async function getRelevantChunks() {                                        
        //fetches all the information from somata with specified experimentId
        const response = await fetch('http://somata.inf.ed.ac.uk/chunks/get?experimentId=' + localStorage['experimentId']);
        const rawChunks = await response.json(); //convert information into JSON (ie. [{chunkType: 'HEADER', ...], {chunkType: 'CHOICE', ...}])
        const filtChunks = rawChunks.filter((ch) => ch.lineageId == localStorage["lineageId"]); //filter information with specified filter function (ie. specified lineageId)
        console.log(JSON.stringify(filtChunks)); //should be [{...},{...},{...}]
        //var filtChoice = filtChunks.filter((ch) => ch.chunkType == "CHOICE");
        //console.log(JSON.stringify(filtChoice));
        return filtChunks
    }

    async function continueTrial() {
        const relevant = await getLastNine(await onlyValid(await getRelevantChunks())); //last 9 CHOICE chunks of specified lineageId
        if (relevant.length == 0 || relevant === undefined){ //TODO: check if both is needed
            localStorage["continuedLineage"] = "N";
            console.log("That lineageId currently does not exist")
        } else {
            localStorage["continuedLineage"] = "Y"
        }
        localStorage["lastChunks"] = JSON.stringify(relevant);
        //console.log(localStorage["lastChunks"]);
        return relevant
    }
