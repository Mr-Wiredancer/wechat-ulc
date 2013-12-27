// var Session = require('../models/session.js');
var WeixinMessage = require('../helpers/weixinmessage.js')
  , Session = require('../models/session.js')
	, Staff = require('../models/staff.js');

var subjectMapping = {
	TR:'托福阅读',
	TL:'托福听力',
	TS:'托福口语',
	TW:'托福写作',
	IR:'雅思阅读',
	IL:'雅思听力',
	IS:'雅思口语',
	IW:'雅思写作',
	SG:'SAT语法',
	SW:'SAT写作',
	SR:'SAT阅读',
	SV:'SAT词汇',
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

//working hour is from 9am to 5pm
var isWorkingHour = function(){
	var time = (new Date).getTime()
		, hr = (time/3600000+8)%24;
	console.log('isWorkingHour. current time: %s; current hr %s', new Date, hr);
	return hr>=9 && hr<17;
};

var notifyStaffs = function(subject, token){

	if (isWorkingHour()){
		var notif = new WeixinMessage({
							'msgtype': ['text'],
							'text': [{'content':"[SYS]有一个新同学在等待"+subjectMapping[subject]+"的回答"}]
						});

		Staff.find({}, function(err, staffs){

			console.log('notfyStaffs: subject:%s; staffs: %j', subject, staffs);

			for (var i = 0; i<staffs.length; i++){
				var staffId = staffs[i].openId;
				if (!(staffId in ongoing)){
					//notify

					notif.touser = staffId;
					notif.sendThroughKefuInterface(token);

				}
			}
		});
	}
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

	Session.update(ongoing[user]['session'], {$push: {logs: msg._id}}, function(err, numberAffected, rawResponse){

		msg.forwardTo(token, user, function(){forwardMessagesSync(token, user, messages)});
	});

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

		console.log('weixinsession: staffs:%j; queues:%j; ongoing:%j', staffs, queues, ongoing);

		if (msg.isResetCommand()){
			resetAll();
			res.send(msg.makeResponseMessage('text', '[SYS]所有队列已经重置').toXML());
			return;
		}else if(msg.isStatsCommand() && req.isFromStaff){
			res.send(msg.makeResponseMessage('text',
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
	            			";").toXML());
			return;
		}	

		// ### menu click, used to start a new conversation if possible
		if (msg.isStartConversationCommand()){ // menu is clicked
			console.log('weixinsession: start converstaion comamnd');

			var subject = msg.EventKey
				, queue = queues[subject];

			//*********** request is from staff ****************
			if (req.isFromStaff) { 
				console.log('weixinsession: user is staff');
				/* ignore the command if staff is in session and send a start request*/
				if (isInSession(user)){ 
					console.log('weixinsession: user is in session');
					res.send(msg.makeResponseMessage('text', '[SYS]你已经处在对话之中。').toXML());
					return;

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

						Session.create({staffOpenId:user, clientOpenId:client, logs:[]}, function(err, session){
							ongoing[client] = {'user': user, 'session': session};
							ongoing[user] = {'user': client, 'session': session};


							msg.makeResponseMessage('text', '[SYS]开始与学生对话').forwardTo(app.get('ACCESSTOKEN'), user, function(){
									forwardMessagesSync(app.get('ACCESSTOKEN'), user, messages);

							});

							var notif = new WeixinMessage({
								'touser': [client],
								'msgtype': ['text'],
								'text': [{'content':"[SYS]你可以开始跟老师交谈了"}]
							});

							notif.sendThroughKefuInterface(app.get('ACCESSTOKEN'));							

						});



						// for (var i =0; i<messages.length; i++){
						// 	messages[i].forwardTo(app.get('ACCESSTOKEN'), user);
						// }
						// forwardMessagesSync(app.get('ACCESSTOKEN'), user, messages);

					//no match, add to pool	
					}else{
						console.log('weixinsession: msg enters queue');
						staffs[subject][user] = {'info':'PLACEHOLDER'};
						msg.makeResponseMessage('text', '[SYS]没有在等待'+subjectMapping[subject]+'答疑的同学，你可以选择继续等待或选择另一个话题进行回答').forwardTo(app.get('ACCESSTOKEN'), user);
					}
				}

			//*********** start session request is from client *******************
			}else{

				console.log('weixinsession: user is client');
				if (isInSession(user)){
					console.log('weixinsession: user is in session');
					res.send(msg.makeResponseMessage('text', '[SYS]你已经处在对话之中。').toXML());
					return;

				/* either idle or in a queue already. remove from existing queue if any; match teacher if any, otherwise add to new queue */	
				} else {
					// a new start-conversation request would make the client enter the queus again
					deleteExistingClientFromQueues(user);

					//DONT need to wait
					if (hasAvailableStaff(subject)){
						var staff = Object.keys(staffs[subject]).pop();
						delete staffs[subject][staff];

						Session.create({staffOpenId: staff, clientOpenId: user, logs:[]}, function(err, session){

							ongoing[staff] = {'user':user, 'session':session};
							ongoing[user] = {'user':staff, 'session':session};

							msg.makeResponseMessage(
								'text', 
								'[SYS]你可以开始跟老师交谈了'
								).forwardTo(app.get('ACCESSTOKEN'), user);	

							msg.makeResponseMessage(
								'text', 
								'[SYS]开始答疑'
								).forwardTo(app.get('ACCESSTOKEN'), staff);	


						});
	
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

						notifyStaffs(subject, app.get('ACCESSTOKEN'));
					}
				}
			}
			res.send('');
			return;

		}else if(msg.isEndConversationCommand()){
			console.log('weixinsession: msg is end conversation command');

			if (user in ongoing) {

				var otherUser = ongoing[user]['user'];

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
			res.send('');
			return;
		// ### normal messages, forward to staff if possible; 
		}else if (msg.isNormalMessage()){
			console.log('weixinsession: normal msg');
			var pos = getPosOfClient(user);
			if (user in ongoing){
				Session.update(ongoing[user]['session'], {$push: {logs: msg._id}}, function(err, numberAffected, rawResponse){

					msg.forwardTo(app.get('ACCESSTOKEN'), ongoing[user]['user'], function(){});

					res.send('');

				});

			}else if(pos){
				pos.queue[pos.index].messages.push(msg);
				res.send('');
			}else {
				res.send(msg.makeResponseMessage('text', '[SYS]先从下面的菜单选一个科目再问问题吧~').toXML());
			}	
			return;
		}else{
			console.log('weixinsession: nothing');
			next();
		}
	};
};
