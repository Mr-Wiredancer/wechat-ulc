// var Session = require('../models/session.js');
var staffs = {
		"SAT":{},
		"TOEFL":{},
		"AP":{}
	}
	, ongoing = {}
	, queues = {
		"SAT":[],
		"TOEFL":[],
		"AP":[]
	};

var queueHasClient = function(arr){
	return arr.length>0;
};

var hasAvailableStaff = function(subject){
	return Object.keys(staffs[subject]).length > 0
};

var popOneStaff = function(subject){
	var pool = staffs[subject], 
		nextStaffId = Object.keys(pool)[0],
		staff = pool[nextStaffId];

	delete pool.nextStaffId;
	return nextStaffId;
};

var deleteExistingClientFromQueues = function(user){
	for (var subject in queues){
		var arr = queues[subject];
		for (var i = 0; i<arr.length; i++){
			if (arr[i].user === user){				
				arr.splice(i, 1);
				break;
			}
		}
	}
};

var hasRequestFromStudent = function(user){

};

var isInSession = function(user){
	return user in ongoing;
};

var isInPoolStaff = function(staff){
	for (var subject in staffs){
		if (staff in staffs[subject]){
			return true;
		}
	}
	return  false;
};

var deleteExistingStaffFromPools = function(staff){
	for (var subject in staffs){
		if (staff in staffs[subject]){
			delete staffs[subject][staff];
			return;
		}
	};
};

module.exports = function(app){
	
	return function(req, res, next){
		var msg = req.weixinMessage
			, user = msg.FromUserName;

		// ### menu click, used to start a new conversation if possible
		if (msg.isStartConversationCommand()){ // menu is clicked
			console.log('start converstaion comamnd');
			if (msg.EventKey === 'MORE'){ next(); return;}

			var subject = msg.EventKey
				, queue = queues[subject];

			//*********** request is from staff ****************
			if (req.isFromStaff) { 
				console.log('indeed from staff');
				/* ignore the command if staff is in session and send a start request*/
				if (isInSession(user)){ 
					console.log('in session');
					next(); return;

				/* either idle or in a pool already. remove from existing queue if any; match stduent if any, otherwise add to new pool */	
				}else {
					//remove from pool
					deleteExistingStaffFromPools(user);

					//theres a match
					if (queueHasClient(queue)){
						console.log('has client');
						var data = queue.shift()
							, client = data.user
							, messages = data.messages;

						ongoing[client] = user;
						ongoing[user] = client;

						res.send(msg.makeResponseMessage('text', '[SYS]开始与学生对话'));

						var notif = new WeixinMessage({
							'touser': [client],
							'msgtype': ['text'],
							'text': [{'content':"[SYS]你可以开始跟老师交谈了"}]
						});

						notif.sendThroughKefuInterface(app.get('ACCESSTOKEN'));

						for (var i =0; i<messages.length; i++){
							messages[i].forwardTo(app.get('ACCESSTOKEN'), user);
						}

					//no match, add to pool	
					}else{
						console.log('enter queue');
						staffs[subject][user] = {'info':'PLACEHOLDER'};
						res.send(msg.makeResponseMessage('text', '[SYS]没有在等待的同学，你可以选择继续等待或另一个话题进行回答'));
					}
				}

			//*********** start session request is from client *******************
			}else{

				console.log('from client');
				if (isInSession(user)){
					next(); return;

				/* either idle or in a queue already. remove from existing queue if any; match teacher if any, otherwise add to new queue */	
				} else {
					// a new start-conversation request would make the client enter the queus again
					deleteExistingClientFromQueues(user);

					//DONT need to wait
					if (hasAvailableStaff(subject)){
						var staff = Object.keys(staffs[subject]).pop();
						delete staffs[subject][staff];

						ongoing[staff] = user;
						ongoing[user] = staff;

						res.send(msg.makeResponseMessage(
							'text', 
							'[SYS]你可以开始跟老师交谈了'
							).toXML());	

					//NEED to wait
					}else{

						//add an entry to the corresponding queue(make sure a user can only be in one queue and has only one entry)

						queues[subject].push({
							'user':'user',
							'messages':[]
						});

						//tell client how many waiting ahead
						res.send(msg.makeResponseMessage(
							'text',
							'[SYS]暂时没有空闲的老师来回答你的问题，你的前面还有'+(queues[subject].length-1)+'个同学在等待。在你等待的过程中你可以先把问题发上来^_^'
							).toXML());

					}
				}
			}

		}else if(msg.isEndConversationCommand()){
			console.log('end conversation command');

			if (user in ongoing) {
				var otherUser = ongoing[user];

				delete ongoing[user]; delete ongoing[otherUser];

				var msgData = {
                  'touser': [user],
                  'msgtype': ['text'],
                  'text': [{'content':"[SYS]对话已结束"}]
                };

	            var msg1 = new WeixinMessage(msgData);
	            msgData.touser = [otherUser];
	            var msg2 = new WeixinMessage(msgData);
	            msg1.sendThroughKefuInterface(app.get('ACCESSTOKEN'));
	            msg2.sendThroughKefuInterface(app.get('ACCESSTOKEN'));

			} else {
				msg.makeResponseMessage('text', '[SYS]你没有在任何对话中').forwardTo(app.get('ACCESSTOKEN'), user);
			}
		// ### normal messages, forward to staff if possible; 
		}else if (msg.isNormalMessage()){
			console.log('normal msg');
			if (user in ongoing){
				msg.forwardTo(app.get('ACCESSTOKEN'), ongoing[user], function(){});

			}else next();		

		}else{
			console.log('nothing');
			next();
		}
	};
};