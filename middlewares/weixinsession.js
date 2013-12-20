// var Session = require('../models/session.js');
var WeixinMessage = require('../helpers/weixinmessage.js');

var subjectMapping = {
	TR:'托福阅读',
	TL:'托福听力',
	TS:'托福口语',
	TW:'托福写作',
	IR:'雅思阅读',
	IL:'雅思听力',
	IS:'雅思口语',
	IW:'雅思写作',
	SG:'SAT阅读',
	SW:'SAT听力',
	SR:'SAT口语',
	SV:'SAT写作',
	SM:'SAT数学'	
};

var staffs = {}
	, ongoing = {}
	, queues = {};

//populate queues and pools
for (var subject in subjectMapping){
	queues[subject] = [];
	staffs[subject] = {};
}

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

var getPosOfClient = function(user){
	for (var subject in queues){
		var queue = queues[subject];
		for (var i = 0; i<queue.length; i++){
			if (queue[i]['user'] === user){
				return {'queue':queue, 'index':i};
			}
		}
	}
	return null;
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

//forward messages in order
var forwardMessagesSync = function(token, user, messages){
	console.log(messages.length);
	if (messages.length === 0) return;

	var msg = messages.shift();

	msg.forwardTo(token, user, function(){forwardMessagesSync(token, user, messages)});
};

var resetAll = function(){
	for (var subject in subjectMapping){
		queues[subject] = [];
		staffs[subject] = {};
	}
	ongoing = {};
}

module.exports = function(app){
	
	return function(req, res, next){
		var msg = req.weixinMessage
			, user = msg.FromUserName;

		if (msg.isResetCommand()){
			resetAll();
			res.send(msg.makeResponseMessage('text', '[SYS]所有队列已经重置').toXML());
			return;
		}	

		// ### menu click, used to start a new conversation if possible
		if (msg.isStartConversationCommand()){ // menu is clicked
			console.log('start converstaion comamnd');
			// if (msg.EventKey === 'MORE'){ next(); return;}

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

						msg.makeResponseMessage('text', '[SYS]开始与学生对话').forwardTo(app.get('ACCESSTOKEN'), user, function(){
								forwardMessagesSync(app.get('ACCESSTOKEN'), user, messages);

						});

						var notif = new WeixinMessage({
							'touser': [client],
							'msgtype': ['text'],
							'text': [{'content':"[SYS]你可以开始跟老师交谈了"}]
						});

						notif.sendThroughKefuInterface(app.get('ACCESSTOKEN'));

						// for (var i =0; i<messages.length; i++){
						// 	messages[i].forwardTo(app.get('ACCESSTOKEN'), user);
						// }
						// forwardMessagesSync(app.get('ACCESSTOKEN'), user, messages);

					//no match, add to pool	
					}else{
						console.log('enter queue');
						staffs[subject][user] = {'info':'PLACEHOLDER'};
						msg.makeResponseMessage('text', '[SYS]没有在等待'+subjectMapping[subject]+'答疑的同学，你可以选择继续等待或选择另一个话题进行回答').forwardTo(app.get('ACCESSTOKEN'), user);
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

						msg.makeResponseMessage(
							'text', 
							'[SYS]你可以开始跟老师交谈了'
							).forwardTo(app.get('ACCESSTOKEN'), user);	

						msg.makeResponseMessage(
							'text', 
							'[SYS]开始答疑'
							).forwardTo(app.get('ACCESSTOKEN'), staff);	

					//NEED to wait
					}else{

						//add an entry to the corresponding queue(make sure a user can only be in one queue and has only one entry)

						queues[subject].push({
							'user':user,
							'messages':[]
						});

						//tell client how many waiting ahead
						msg.makeResponseMessage(
							'text',
							'[SYS]暂时没有空闲的老师来回答你的问题，你的前面还有'+(queues[subject].length-1)+'个同学在等待。在你等待的过程中你可以先把问题发上来^_^'
							).forwardTo(app.get('ACCESSTOKEN'), user);

					}
				}
			}

		}else if(msg.isEndConversationCommand()){
			console.log('end conversation command');

			if (user in ongoing) {

				var otherUser = ongoing[user];

				var client = req.isFromStaff?otherUser:user;
				var staff = req.isFromStaff?user:otherUser;

				delete ongoing[client]; delete ongoing[staff];

				var msgData = {
                  'touser': [client],
                  'msgtype': ['text'],
                  'text': [{'content':"[SYS]对话已结束"}]
                };

	            var msg1 = new WeixinMessage(msgData);
	            msg1.sendThroughKefuInterface(app.get('ACCESSTOKEN'));

	            msgData.touser = [staff];
	            var msg2 = new WeixinMessage(msgData);
	            msg2.sendThroughKefuInterface(app.get('ACCESSTOKEN'), function(){
	            		//TODO:tell staff how many students are waiting
	            		msgData['text'][0]['content'] = 
	            			"[SYS]学生等待队列情况:\n托福:阅读" + 
	            			queues['TR'].length +
	            			", 听力" + 
	            			queues['TL'].length + 
	            			", 口语" + 
	            			queues['TS'].length + 
	            			", 写作" + 
	            			queues['TW'].length + 
	            			";" + 
	            			"\n雅思:阅读" + 
	            			queues['IR'].length + 
	            			", 听力" + 
	            			queues['IL'].length + 
	            			", 口语" + 
	            			queues['IS'].length + 
	            			", 写作" + 
	            			queues['IW'].length + 
	            			";" + 
	            			"\nSAT:语法" + 
	            			queues['SG'].length + 
	            			", 写作" + 
	            			queues['SW'].length + 
	            			", 阅读" + 
	            			queues['SR'].length + 
	            			", 词汇" + 
	            			queues['SV'].length + 
	            			", 数学" + 
	            			queues['SM'].length + 
	            			";";

	            		var msg3 = new WeixinMessage(msgData);
	            		console.log(msg3);
	            		msg3.sendThroughKefuInterface(app.get('ACCESSTOKEN'));
	            });

			} else {
				msg.makeResponseMessage('text', '[SYS]你没有在任何对话中').forwardTo(app.get('ACCESSTOKEN'), user);
			}
		// ### normal messages, forward to staff if possible; 
		}else if (msg.isNormalMessage()){
			console.log('normal msg');
			var pos = getPosOfClient(user);
			if (user in ongoing){
				msg.forwardTo(app.get('ACCESSTOKEN'), ongoing[user], function(){});

			}else if(pos){
				pos.queue[pos.index].messages.push(msg);
			}else next();		

		}else{
			console.log('nothing');
			next();
		}
	};
};