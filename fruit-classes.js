class Scene {
    constructor(config, canvas,size = { width: config.screen_w, height: config.screen_h }, options = { zIndex: 1 }) {
        this.objects = [];
        this.config = config;
        this.tickInterval = undefined;
        this.width = size.width;
        this.height = size.height;
        this.forceFinish = false;
        canvas.width = size.width;
        canvas.height = size.height;
        canvas.style.position = 'absolute';
        canvas.style.backgroundColor = 'black';
        canvas.style.zIndex = options.zIndex;
        this.context = canvas.getContext('2d');
    }

    addObject(object) {
        this.objects.push(object);
    }

    clear() {
        this.objects = [];
    }

    render() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.objects.forEach(o => {
            o.draw(this.context,this.config);});
    }

    end() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.context.fillStyle = 'white';
        this.context.font = '40px Arial';
        this.context.textAlign = 'center';
        this.context.fillText("Thank you for participating! You will be redirected shortly.", config.text_x, config.screen_h/2)
    }
}

class Fruit {
    constructor(parentFM,params) {
        //console.log("created fruit; parentFM="+JSON.stringify(parentFM));
        this.parentFM = parentFM;
        this.params = params;
    }

    findlowesty(center_y, voffset, radius){
        if(voffset < 0){
            return center_y - radius - config.stem_height}
        else{return center_y - voffset - radius - config.stem_height}
    }

    findhighesty(center_y, voffset, radius){
        if(voffset < 0){
            return center_y - voffset + radius}
        else{return center_y + radius}
    }

    adjust(center_y, voffset, radius){
        //Returns the difference of the y-coordinate values needed to adjust the fruits to the center of the plate
        let high = this.findhighesty(center_y, voffset, radius);
        let low = this.findlowesty(center_y, voffset, radius);
        let middle = (high - low)/2 + low;
        return middle - center_y
    }

    circPoints(center,radius) {
        //Returns an array of coordinate values of one circle from specified center
        let nPoints = 300;
        let angles = Array(nPoints).fill().map((_, i) => 2*Math.PI*i/nPoints);
        return angles.map(function(t) {return {x:radius*Math.cos(t)+center.x, y:radius*Math.sin(t)+center.y}});
    }

    fruitPoints(hoffset, voffset, radius, center_x, center_y){
        //Returns convexhull of all coordinates from the three circles
        let center_adjust = this.adjust(center_y, voffset, radius);
        let leftcirc = this.circPoints({x:center_x-hoffset,y:center_y-center_adjust}, radius);
        let rightcirc = this.circPoints({x:center_x+hoffset,y:center_y-center_adjust}, radius);
        let vertcirc = this.circPoints({x:center_x, y:center_y-voffset-center_adjust}, radius);
        let total = leftcirc.concat(rightcirc, vertcirc);
        //let xPoints = total.map(p => p.x); Doesn't seem to be needed
        //let yPoints = total.map(p => p.y);
        let convex = convexhull.makeHull(total);
        return convex 
    }

    max_width(){
        let max_width = (2 * config.r_max) + (2 * config.h_max);
        return max_width
    }
        
    drawplate(context, center_x, center_y){
        let width = this.max_width();
        let plate_radius = width * config.plate_max / 2;
        context.beginPath();
        context.arc(center_x, center_y, plate_radius, 0, 2 * Math.PI);
        context.fill();
    }

    drawplateline(context,center_x, center_y){
        let width = this.max_width();
        let plate_line_radius = (width * config.plate_max / 2) * config.inner_plate_max;
        context.beginPath();
        context.lineWidth = 7;
        context.arc(center_x, center_y, plate_line_radius, 0, 2 * Math.PI);
        context.stroke();
    }

    drawfruit(context, hoffset, voffset, radius, center_x, center_y){
        context.beginPath();
        let points = this.fruitPoints(hoffset, voffset, radius, center_x, center_y);
        //console.log(typeof(points))
        points.forEach(function(p) {context.lineTo(p.x, p.y);});
        context.fill()
    }
        
    drawstem(context, center_x, center_y, voffset, radius){
        let center_adjust = this.adjust(center_y, voffset, radius);
        let high_y = this.findlowesty(center_y, voffset, radius);
        context.beginPath();
        context.moveTo(center_x - config.stem_width/2, high_y - center_adjust);
        context.lineTo(center_x - config.stem_width/2,high_y + config.stem_height - center_adjust);
        context.lineTo(center_x + config.stem_width/2, high_y + config.stem_height - center_adjust);
        context.lineTo(center_x + config.stem_width/2, high_y - center_adjust);
        context.fill()
    }

    draw(context) {
        console.log("Called draw() in class fruit");
        context.fillStyle = "white";
        this.drawplate(context, this.params.center_x, this.params.center_y);
        context.fillStyle = "black";
        this.drawplateline(context, this.params.center_x, this.params.center_y);
        context.fillStyle = 'hsl('+this.params.hue+','+this.params.sat+'%,'+this.params.light+'%)';
        this.drawfruit(context, this.params.hoffset, this.params.voffset,this.params.radius, this.params.center_x, this.params.center_y);
        context.fillStyle = "#b37700";
        this.drawstem(context, this.params.center_x, this.params.center_y, this.params.voffset, this.params.radius);
        let instructions = canvas.getContext('2d'); //KO: It seems like instructions is written twice (for each fruit)
        instructions.fillStyle = 'white';
        instructions.font = "45px Arial"; 
        instructions.textAlign = "center";
        instructions.fillText("Pick the ", config.text_x, config.text_instruction_y);
        let fruit_text = canvas.getContext('2d');
        fruit_text.fillStyle = 'white';
        fruit_text.font = 'bold 70px Arial'; 
        fruit_text.textAlign = "center";
        let parentFM = this.parentFM;
        fruit_text.fillText(parentFM.fruit_labels[parentFM.chain_index].fruit, parentFM.config.text_x, parentFM.config.text_fruit_y);
        //let completion = canvas.getContext('2d');
        //let percent = (parentFM.chain_trial / parentFM.config.max_trials) * 100;
        //completion.fillStyle = 'white';
        //completion.font = '30px Arial'; 
        //completion.textAlign = "center";
        //completion.fillText(percent.toFixed(2) + "% Completed", parentFM.config.text_x, parentFM.config.screen_h - 40);
    }
}

/*class Undo {
    constructor(parentFM) {
        //console.log("created fruit; parentFM="+JSON.stringify(parentFM));
        this.parentFM = parentFM;
    }

    draw(){
        let outline = canvas.getContext('2d');
        outline.fillStyle = 'silver';
        outline.fillRect(18, 18, 59, 29);
        let button = canvas.getContext('2d');
        button.fillStyle = "WhiteSmoke";
        button.fillRect(20, 20, 55, 25);
        //let back = canvas.getContext('2d');
        //back.fillStyle = 'black';
        //back.font = '20px Arial';
        //back.textAlign = 'start';
        //back.fillText("Back", 25, 40);

    }
}*/

class FruitManager {
    constructor(config,canvas) {
        this.config = config;
        this.canvas = canvas;
        this.scene = new Scene(config,canvas);
        if (localStorage["continuedLineage"] == "Y"){
            let lastTrials = JSON.parse(localStorage["lastChunks"]); //[{chunkType: 'CHOICE', ...}, x9]
            console.log(JSON.stringify(lastTrials));
            this.fruit_labels = FruitManager.createFruitLabels(lastTrials); //returns last 9 responses in format [{h,v,r,...} x9]
            this.trial = lastTrials[lastTrials.length - 1].trial + 1;
            this.first = lastTrials[lastTrials.length - 1].trial + 1; //used to calculate sessionTrial
            if(lastTrials[0].options[0].chain == 1){ //if the first chunk is the first chain, we will start chain_trial + 1, else, continue chain_trial
                this.chain_trial = lastTrials[0].chain_trial + 1;
            } else {this.chain_trial = lastTrials[lastTrials.length - 1].chain_trial}
        } else {
            this.fruit_labels = FruitManager.fruit_shuffle(config.shuffle_state, 
                FruitManager.create_all_chains(FruitManager.fruit_random(config.random_state, FruitManager.createEmpty), config.fruit_list));
            this.trial = 0;
            this.chain_trial = 0;
            this.first = 0;
        }
        this.chain_index = 0;
        this.n_chains = this.fruit_labels.length;
        this.current = null;
        this.forceFinish = false;
        this.undo = false;
        this.keep_next = false;
        this.left_clicks = 0;
        this.right_clicks = 0;
        //this.alternating = 0;
        this.prop_accept = 0;
        this.fruit_history = {all_chains : []};

        for (var i = 0; i < this.n_chains; i++) {
            //response: 0 is left, 1 is right
            //options: index 0 is left, index 1 is right
            this.fruit_history.all_chains[i] = {chain_num: [], fruit: [], options: [], prop_rejects:[], response: [], display_time:[], response_time: []}
        }
        console.log("fruit_history: " + JSON.stringify(this.fruit_history));
    }

    static createFruitLabels(chunk){
        let start = [];

        for (var i = 0; i < chunk.length; i++){ //for each of the 9 CHOICE chunks
            for (var n = 0; n < 2; n++){ //originally, n < chunk[i].options.length, but should always be 2
                if (chunk[i].options[n].side == chunk[i].response){
                    start.push(chunk[i].options[n]);
                }
            }
        }
        return start
    };
    
    static createEmpty() {return {
        h:0,
        v:0,
        r:0,
        hue:0,
        sat:0,
        light:0
    }};

    static randomize_starts(config,chain_number, empty){
        //Return new array with randomized start points
        let n = 0;
        let new_array = new Array();
        let dist_h = d3.randomUniform(config.h_min, config.h_max);
        let dist_v = d3.randomUniform(config.v_min, config.v_max);
        let dist_r = d3.randomUniform(config.r_min, config.r_max);
        let dist_hue = d3.randomUniform(config.hue_min, config.hue_max);
        let dist_sat = d3.randomUniform(config.sat_min, config.sat_max);
        let dist_light = d3.randomUniform(config.light_min, config.light_max);
        while(n < chain_number){
            sample_h = dist_h();
            empty.h = sample_h;
            sample_v = dist_v();
            empty.v = sample_v;
            sample_r = dist_r();
            empty.r = sample_r;
            sample_hue = dist_hue();
            empty.hue = sample_hue;
            sample_sat = dist_sat();
            empty.sat = sample_sat;
            sample_light = dist_light();
            empty.light = sample_light;
            empty.t = "random_init" + n;
            new_array[n] = JSON.parse(JSON.stringify(empty));
            n = n + 1}
        return new_array
    }

    static fruit_random(state, empty){
        console.log("random_state:" + state)
        // Might need testing.
        if(state=="on"){
            console.log("randomized starts");
            return FruitManager.randomize_starts(config,config.random_chain_number, empty)
        }
        else if(state=="off"){
            return config.chain_list
        }
    }

    static create_all_chains(chain_array, fruit_array){
        //Return new array with each current state * each fruit
        let new_array = new Array();
        let i = 0;
        
        for(var n in chain_array){
            for(var k in fruit_array){
                new_array[i] = JSON.parse(JSON.stringify(chain_array[n]));
                new_array[i].fruit = fruit_array[k]
                new_array[i].chain = i + 1
                i = i + 1;
            }
        }
        return new_array
    }

    static fruit_shuffle(state, array){
        console.log("shuffle_state:" + state)
        if(state == "on"){
            let ctr = array.length;
            let temp;       
            let index;
            // While there are elements in the array
            while (ctr > 0) {
        // Pick a random index
            index = Math.floor(Math.random() * ctr);
        // Decrease ctr by 1
            ctr--;
        // And swap the last element with it
            temp = array[ctr];
            array[ctr] = array[index];
            array[index] = temp;
            }
            return array;
        }
        else if (state == "off"){
            return array
        }
    }

    static flip() {
        if(Math.random() < 0.5) {return 0;} else {return 1;} 
    }

    static emptyChunk() {
        return {
            experimentId : localStorage["experimentId"],
            sessionId: localStorage["sessionId"],
            lineageId: localStorage["lineageId"],
            parentLineageId: localStorage["parentLineageId"]
        }
    }

    sendHeader(dataRecorder) {
        let headerChunk = FruitManager.emptyChunk();
        headerChunk.chunkType = 'HEADER';
        headerChunk.lineageId = localStorage["lineageId"];
        headerChunk.parentLineageId = localStorage["parentLineageId"];
        headerChunk.birthYear = localStorage["birthyear"];
        headerChunk.ethnicity = localStorage["ethnicity"];
        headerChunk.sex = localStorage["sex"];
        headerChunk.firstlang = localStorage["firstlang"];
        headerChunk.primarylang = localStorage["primarylang"];
        headerChunk.colorModel = 'hsl';
        headerChunk.config = this.config;
        headerChunk.start_points = this.fruit_labels;
        headerChunk.start_timestamp = this.start_timestamp;
        headerChunk.start_date = this.start_date;
        headerChunk.isComplete = false;
        //headerChunk.experimentVersion = "0.0.0-pre-alpha";
        headerChunk.condition = "placeholder-condition";
        this.headerChunk = headerChunk;
        //dataRecorder.sendChunk(headerChunk);
    }

    last_i() {
        //if fruit_history.all_chains is empty, return -1 (should not happen), else returns the length of options - 1
        //if options in fruit_history.all_chains is empty like the first 9 trials, then it would return -1
        if(this.fruit_history.all_chains.length == 0) {return -1;} // CL: Added
        else{return this.fruit_history.all_chains[this.chain_index].options.length-1;}
    }

    last_ci() {
        //If options is empty, return null. Else return the last response (0 or 1)
        let li = this.last_i();
        
        if(li < 0) {console.err("li < 0; last_ci() returning null");return null;} else {
            let resp = this.fruit_history.all_chains[this.chain_index].response[li];
            console.log("***** last_ci() [choice index]="+resp);
            return resp;
        }
    }

    last_choice() {
        //if options is empty, return the first starting points, else, return a clone of the option that was chosen
        let li = this.last_i();
        if(li < 0) {
            console.error("li < 0; returning an entry from fruit_labels: " + JSON.stringify(this.fruit_labels));
            return this.fruit_labels[this.chain_index];
        } else {
            let ci = this.last_ci();
            let options = this.fruit_history.all_chains[this.chain_index].options[li]; //gets a list of the last options [{...},{...}]
            console.log("li:"+li);
            console.log("last_ci:"+ci);
            console.log("options: " + JSON.stringify(options));
            let lst = options[ci]; //gets the options that was chosen by using response (0 or 1) as index of the list
            console.log("pre-clone lst:" + JSON.stringify(lst));
            if(lst == undefined) {
                console.error("lst is undefined.");
                console.error("this.chain_index:" + this.chain_index);
                console.error("this.fruit_history.all_chains[this.chain_index]:" + JSON.stringify(this.fruit_history.all_chains[this.chain_index]));
                console.error("this.fruit_history.all_chains[this.chain_index][li]:" + JSON.stringify(this.fruit_history.all_chains[this.chain_index].options[li]));
            }
            // CL: yes, using string serialization to clone is ridiculous, but it's actually a recommended way to deep-clone an object. We need to do this or else
            // some subsequent mutation breaks things.
            //   https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript/5344074#5344074
            console.log("lst:" + JSON.stringify(lst));
            let lst_clone = JSON.parse(JSON.stringify(lst));
            lst_clone.t = "current";
            return lst_clone; 
        }
    }

    to_fruit(fs,side_asgn) {
        return new Fruit(this,{hue:fs.hue, sat:fs.sat, light:fs.light, hoffset: fs.h, voffset: fs.v, radius:fs.r, center_x:side_asgn, center_y:this.config.y_value});
    }

    side_coord(side01) {
        //if side is 0 or 1, returns coordinates of the x value for left and right of the screen, respectively
        if(side01 == 0) {return this.config.left_h;} else {return this.config.right_h;}
    }

    pick_prob(){
        //returns a probability to be used: 80% Gaussian, 10% uniform shape, 10% uniform colour
        let randomnumber = Math.random();
        if(randomnumber <= config.unishape_prob){
            return 'unishape'}
        else if(randomnumber <= config.unicolour_prob){
            return 'unicolour'}
        else{
            return 'gauss'}
    }

    sample(distribution, parameter, mean, min, max){
        //returns dictionary with sample value, and reject list given chosen probability
        let sampling = {rejects:[]};
        if(distribution == 'gauss'){
            let dist = d3.randomNormal(mean, config.sd*Math.abs(max-min));
            let n = dist();
            let attempts = 0;
            
            while((n < min || n > max) && attempts < 1000) {
                attempts = attempts+1;
                console.log(n + ", min:" + min + ", max:" + max);
                sampling['rejects'].push(n);
                n = dist();
                }
            if(attempts == 1000) {
                console.log("Warning: Too many resampling attempts");
            }
            sampling['sample'] = n;
            }
        else {
            let dist = d3.randomUniform(min, max);
            let n = dist();
            if(distribution == 'unishape' && parameter == 'shape' || distribution == 'unicolour' && parameter == 'colour'){
                sampling['sample'] = n
            }
            else{
                sampling['sample'] = mean
            }
        }
        return sampling //sampling = {rejects: [], sample:[]}
    }

    create_prop(cur) {
        let pp = this.pick_prob(); //returns gauss, unishape, or unicolour
        let config = this.config;
        let proposal_side = 1;

        let info = {
            h:this.sample(pp, 'shape', cur.h, config.h_min, config.h_max),
            v:this.sample(pp, 'shape', cur.v, config.v_min, config.v_max),
            r:this.sample(pp, 'shape', cur.r, config.r_min, config.r_max),
            hue:this.sample(pp, 'colour', cur.hue, config.hue_min, config.hue_max),
            sat:this.sample(pp, 'colour', cur.sat, config.sat_min, config.sat_max),
            light:this.sample(pp, 'colour', cur.light, config.light_min, config.light_max)};
            
        let prerejects = {
            h:info['h']['rejects'],
            v:info['v']['rejects'],
            r:info['r']['rejects'],
            hue:info['hue']['rejects'],
            sat:info['sat']['rejects'],
            light:info['light']['rejects']
        };

        let prop = {
            h:info['h']['sample'],
            v:info['v']['sample'],
            r:info['r']['sample'],
            hue:info['hue']['sample'],
            sat:info['sat']['sample'],
            light:info['light']['sample'],
            t: "proposal",
            distribution: pp,
            fruit:cur.fruit,
            chain:cur.chain,
            side: proposal_side
        };

        this.fruit_history.all_chains[this.chain_index].prop_rejects.push(prerejects);
        return prop;
    }

    fruitNext(){
        let current = this.last_choice(); //is this needed???
        let all_chains = this.fruit_history.all_chains;
        let miniChunk = FruitManager.emptyChunk();
        miniChunk.isComplete = false;
        miniChunk.chunkType = 'CHOICE';
        let left_right = [];
        if(this.current.side == 0) {
            left_right = [this.current,this.proposal];
        } else {
            left_right = [this.proposal,this.current];
        }
        if (this.proposal.side == all_chains[this.chain_index].response[all_chains[this.chain_index].response.length - 1]){
            this.prop_accept = this.prop_accept + 1;
        }
        console.log("Accepted: " + this.prop_accept);
        let curr_prop = [this.current, this.proposal];
        if(this.current == null || this.proposal == null) {
            console.error("current or proposal was null:");
            console.error("current:" + JSON.stringify(current));
            console.error("proposal:" + JSON.stringify(proposal));
        }
        console.log("current.side=" + this.current.side);

        all_chains[this.chain_index].response_time.push(Date.now());
        all_chains[this.chain_index].options.push(left_right);
        if(all_chains[this.chain_index].fruit.length == 0){
            all_chains[this.chain_index].fruit.push(this.fruit_labels[this.chain_index].fruit);
            all_chains[this.chain_index].chain_num.push(this.fruit_labels[this.chain_index].chain);
        }
        let display_time = all_chains[this.chain_index].display_time[all_chains[this.chain_index].display_time.length-1];
        miniChunk.display_time = display_time;
        miniChunk.options = curr_prop; //options is always current, proposal while response is recorded as 0 = left, 1 = right 
        miniChunk.prop_rejects = all_chains[this.chain_index]
            .prop_rejects[all_chains[this.chain_index].prop_rejects.length-1];
        miniChunk.response = all_chains[this.chain_index].response[all_chains[this.chain_index].response.length - 1];
        miniChunk.response_time = Date.now();
        if(this.undo === true){
            miniChunk.undo = 1;
            this.undo = false;
        } else {miniChunk.undo = 0}
        miniChunk.chain_index = this.chain_index;
        miniChunk.chain_trial = this.chain_trial;
        miniChunk.trial = this.trial;
        //dataRecorder.sendChunk(miniChunk);
    
        this.chain_index = (this.chain_index+1)%this.n_chains; 
        this.trial++;
        this.chain_trial = Math.floor(this.trial/this.n_chains);
        this.present();
    }

    fruitBack(){
        this.fruit_history.all_chains[this.chain_index].display_time.pop();
        if(this.chain_index > 0){
            this.chain_index = this.chain_index - 1;
        } else {this.chain_index = 8};
        if (this.chain_index ==  0){
            var last_chain = 8;
        } else {var last_chain = this.chain_index - 1;}  
        let back_trial = this.fruit_history.all_chains[this.chain_index];
        if(back_trial.response[back_trial.response.length - 1] == 0){
            if (back_trial.options[back_trial.options.length - 1][0].t == "proposal"){
                console.log(JSON.stringify(back_trial.options[back_trial.options.length - 1]));
                this.prop_accept = this.prop_accept - 1
            }
            //if(this.fruit_history.all_chains[last_chain].response[this.fruit_history.all_chains[last_chain].response.length - 1] == 1){
            //    this.alternating = this.alternating - 1;
            //}
            this.left_clicks = this.left_clicks - 1} 
        else {
            if (back_trial.options[back_trial.options.length - 1][1].t == "proposal"){
                console.log(JSON.stringify(back_trial.options[back_trial.options.length - 1]));
                this.prop_accept = this.prop_accept - 1;
            }
            //if(this.fruit_history.all_chains[last_chain].response[this.fruit_history.all_chains[last_chain].response.length - 1] == 0){
            //    this.alternating = this.alternating - 1;
            //}
            this.right_clicks = this.right_clicks - 1}
        console.log("leftclicks = " + this.left_clicks);
        console.log("rightclicks = " + this.right_clicks);
        //console.log("alternating = " + this.alternating);
        console.log("acceptance = " + this.prop_accept);
        back_trial.response_time.pop();
        back_trial.response.pop();
        back_trial.display_time.pop();
    
        this.trial = this.trial - 1;
        this.chain_trial = Math.floor(this.trial/this.n_chains);
        this.present();
    }

    fruitClick(e) {
        console.log("Called fruitClick, this.canvas="+this.canvas); // TODO: Why is this undefined?
    
        let element = this.canvas;
        let all_chains = this.fruit_history.all_chains;

        var offsetX = 0, offsetY = 0;

        if (element.offsetParent) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }
        let x = e.pageX - offsetX;
        let y = e.pageY - offsetY;

        let plateRadius = ((2*this.config.r_max) + (2*this.config.h_max)) * this.config.plate_max/2; 
        if (this.chain_index ==  0){
            var last_chain = 8;
        } else {var last_chain = this.chain_index - 1;}   
        if(Math.sqrt((x-config.left_h)*(x-config.left_h) + (y-config.y_value)*(y-config.y_value)) < plateRadius) {
            console.log("clicked left - pushing 0 to response");
            all_chains[this.chain_index].response.push(0);
            this.left_clicks = this.left_clicks + 1;
            //if(this.trial != 0 && all_chains[last_chain].response[all_chains[last_chain].response.length - 1] == 1){
            //    this.alternating = this.alternating + 1;
            //}
            console.log("leftclicks = " + this.left_clicks);
            //console.log("alternating = " + this.alternating);
            this.fruitNext();
            console.log("CLICKED (" + x + ", " + y + ")");
        } else if (Math.sqrt((x-config.right_h)*(x-config.right_h) + (y-config.y_value)*(y-config.y_value)) < plateRadius) {
            console.log("clicked right - pushing 1 to response");
            all_chains[this.chain_index].response.push(1);
            this.right_clicks = this.right_clicks + 1;
            //if(this.trial != 0 && all_chains[last_chain].response[all_chains[last_chain].response.length - 1] == 0){
            //    this.alternating = this.alternating + 1;
            //}
            console.log("rightclicks = " + this.right_clicks);
            //console.log("alternating = " + this.alternating);
            this.fruitNext();
            console.log("CLICKED (" + x + ", " + y + ")");
        }
    }

    undoClick(e) {
        let element = this.canvas;

        var offsetX = 0, offsetY = 0;

        if (element.offsetParent) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }
        let x = e.pageX - offsetX;
        let y = e.pageY - offsetY;

        if (this.undo === false && 18 <= x && x <= 77 && 18 <= y && y <= 47){
            console.log("clicked back button");
            this.undo = true;
            this.keep_next = true;
            this.next_current = JSON.parse(JSON.stringify(this.current));
            this.next_proposal = JSON.parse(JSON.stringify(this.proposal));
            this.fruitBack()
            //increase back button increment

        }
    }

    keyClick(zEvent){
        if (zEvent.ctrlKey  &&  zEvent.altKey &&  zEvent.keyCode === 13) {
            console.log("Force quit");
            this.forceFinish = true;
        }
    }

    present() {
        let scene = this.scene;
        scene.clear();
        console.log("Called run()")
        if(this.undo === true){
            let li = this.fruit_history.all_chains[this.chain_index].options.length - 1;
            let old_options = JSON.parse(JSON.stringify(this.fruit_history.all_chains[this.chain_index].options[li]));
            this.fruit_history.all_chains[this.chain_index].options.pop();
            if (old_options[0].t == 'current' || old_options[0].distribution == 'initial'){
                this.current = old_options[0];
                this.proposal = old_options[1];
            } else {
                this.current = old_options[1];
                this.proposal = old_options[0];
            }
        } else if (this.keep_next === true){
            this.current = this.next_current;
            this.proposal = this.next_proposal;
            this.keep_next = false;
        }
        else{
            this.current = this.last_choice();
            this.current.side = 0;
            this.proposal = this.create_prop(this.current);
        }
        let proposal = this.proposal; // I hate all this "this"
        if(this.current.side == proposal.side) {
            alert("ERROR: current and proposal should not be on the same side");
        }
        //let undo_button = new Undo(this);
        let current_fruit = this.to_fruit(this.current,this.side_coord(this.current.side));
        let proposal_fruit = this.to_fruit(proposal,this.side_coord(proposal.side));
        console.log("------");
        console.log("current: " + JSON.stringify(this.current));
        console.log("proposal: " + JSON.stringify(proposal));
        
        if(this.chain_trial < this.config.max_trials && this.forceFinish === false){
            let display_time = Date.now();
            let scene = this.scene;
            this.fruit_history.all_chains[this.chain_index].display_time.push(display_time);
            //if (this.undo === false && this.fruit_history.all_chains[0].chain_num.length != 0){
            //    scene.addObject(undo_button);
            //}
            scene.addObject(current_fruit);
            scene.addObject(proposal_fruit);
            scene.render();
        } else {    
            localStorage["leftClicks"] = this.left_clicks;
            localStorage["rightClicks"] = this.right_clicks;
            //localStorage["alternating"] = this.alternating; 
            localStorage["propAccepts"] = this.prop_accept;
            localStorage["sessionTrials"] = this.trial - this.first;
            localStorage["lineageTrials"] = this.trial;
            console.log("Reached max number of trials.");
            scene.end();
            setTimeout("location.href = './attention.html';",4000); // CL: Reverted to a 4-second delay -- 100 seems untenably long
        }
        console.log("Finished present()")
    }
}
    //function animateScenes() {
    //    window.requestAnimationFrame(run);
    //}
