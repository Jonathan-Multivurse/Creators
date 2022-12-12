const nodemailer = require('nodemailer');
const moment = require('moment');
const momentT = require('moment-timezone');
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

exports.postNotification = functions
  .region("us-central1")
  .firestore
  .document("notification/{documentID}")
  .onCreate(async(snap, context) => {
    console.log("Push notification event was triggered on notification.");
    const newValue = snap.data();
    const title = newValue.title;
    const type = newValue.type;
    const message = newValue.message;
    const receiverIDs = newValue.receivers;   
    const requestID = newValue.request ? newValue.request : ""

    if ( (type == 'submitted') || (type == 'cancelled') || (type == 'accepted') ) {
      return 
    } else {
      const payload = {
        "notification": {
          "title": title,
          "body": message,
          "sound": "default",
        },
        "data": {
          "type": type,
          "request" : requestID
        },
      };

      const options = {
        priority: "high",
        mutableContent: true,
        contentAvailable: true,
      };

      var promises = [];
      const tokens = [];

      receiverIDs.forEach(receiverId => {
        promises.push(db.collection('users').doc(receiverId).get());
      });
      var receivers = await Promise.all(promises);
      
      receivers.forEach((user) => {
        tmpToken = user.data().token
        if (tmpToken) {
          tokens.push(user.data().token);
        }            
      });

      if (tokens.length > 0) {
        return admin.messaging().sendToDevice(tokens, payload);
      } else {
        return
      }
    }
});

exports.pushAccountNotification = functions
  .region("us-central1")
  .firestore
  .document("users/{documentID}")
  .onUpdate( async(change, context) => {
    console.log("Updating Company Account event was triggered on users.");    
    
    const oldValue = change.before.data();
    const oldAccept = oldValue.isAccept;
    const oldOnline = oldValue.online;
    const oldFacility = oldValue.facility;

    const newValue = change.after.data();
    const senderId = newValue.userid;
    const firstname = newValue.firstname;
    const lastname = newValue.lastname;
    const time = newValue.updated;
    const newAccept = newValue.isAccept;
    const newOnline = newValue.online;
    const newUserType = newValue.type;
    const newFacility = newValue.facility;

    const adminSnapshot = await db
    .collection('users')
    .where('type', '==', 'admin')
    .get();
    const adminId = adminSnapshot.docs[0].id;

    if ((oldAccept === '' || oldAccept === 'pending') && (newAccept === 'pending') && (newUserType === 'company')) {
      const message = firstname + " " + lastname + " sent you request for a company representative account.";
      const dataAdmin = {          
        title: 'MeLiSA',
        type: 'repPending',
        message: message,
        time: time,
        sender: senderId,
        receivers: [adminId],
      }

      return db.collection('notification').add(dataAdmin)

    } else if ((oldAccept === 'pending') && (newAccept === 'accepted')){
      const messageSelf = "You accepted " + firstname + " " + lastname + "'s company representative request.";
      const dataSelf = {          
        title: 'MeLiSA',
        type: 'repAccepted',
        message: messageSelf,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [adminId],
      }

      const messageRep = "Your request for company representative was accepted.";
      const dataRep = {          
        title: 'MeLiSA',
        type: 'repAccepted',
        message: messageRep,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [senderId],
      }

      const batch = db.batch();
      var newDocSelf = db.collection('notification').doc();
      var newDocRep = db.collection('notification').doc();
      var newDocSelfRef = db.collection('notification').doc(newDocSelf.id);
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);

      batch.set(newDocSelfRef, dataSelf);
      batch.set(newDocRepRef, dataRep);
      return batch.commit();

    }  else if ((oldAccept === 'pending') && (newAccept === 'declined')){

      const messageSelf = "You removed " + firstname + " " + lastname + " as a company representative.";
      const dataSelf = {          
        title: 'MeLiSA',
        type: 'repDeclined',
        message: messageSelf,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [adminId],
      }

      const messageRep = "Your request for company representative was removed.";
      const dataRep = {          
        title: 'MeLiSA',
        type: 'repDeclined',
        message: messageRep,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [senderId],
      }

      const batch = db.batch();
      var newDocSelf = db.collection('notification').doc();
      var newDocRep = db.collection('notification').doc();
      var newDocSelfRef = db.collection('notification').doc(newDocSelf.id);
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);

      batch.set(newDocSelfRef, dataSelf);
      batch.set(newDocRepRef, dataRep);
      return batch.commit();        
    } else if ((oldAccept === 'accepted') && (oldOnline != newOnline)){    

      const messageSelf = "You updated availability status.";
      const dataSelf = {          
        title: 'MeLiSA',
        type: 'availability',
        message: messageSelf,
        time: new Date().getTime(),
        sender: senderId,
        receivers: [senderId],
      }

      const messageRep= firstname + " " + lastname + " has updated availability status.";
      const   dataRep= {          
        title: 'MeLiSA',
        type: 'availability',
        message: messageRep,
        time: new Date().getTime(),
        sender: senderId,
        receivers: [adminId],
      }

      const batch = db.batch();
      var newDocSelf = db.collection('notification').doc();
      var newDocRep = db.collection('notification').doc();
      var newDocSelfRef = db.collection('notification').doc(newDocSelf.id);
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);

      batch.set(newDocSelfRef, dataSelf);
      batch.set(newDocRepRef, dataRep);
      return batch.commit();

    } else if ((newUserType === 'customer') && (oldFacility != '') && (oldFacility != newFacility)){    

      // const messageSelf = "You updated Facility.";
      // const dataSelf = {          
      //   title: 'MeLiSA',
      //   type: 'availability',
      //   message: messageSelf,
      //   time: new Date().getTime(),
      //   sender: senderId,
      //   receivers: [senderId],
      // }

      // const messageAdmin = firstname + " " + lastname + " has updated Facility.";
      // const dataAdmin = {          
      //   title: 'MeLiSA',
      //   type: 'availability',
      //   message: messageAdmin,
      //   time: new Date().getTime(),
      //   sender: senderId,
      //   receivers: [adminId],
      // }

      // const batch = db.batch();
      // var newDocSelf = db.collection('notification').doc();
      // var newDocAdmin = db.collection('notification').doc();
      // var newDocSelfRef = db.collection('notification').doc(newDocSelf.id);
      // var newDocAdminRef = db.collection('notification').doc(newDocAdmin.id);

      // batch.set(newDocSelfRef, dataSelf);
      // batch.set(newDocAdminRef, dataAdmin);
      // return batch.commit();

    } else {
      return
    }
});

exports.pushRequestNotification = functions
  .region("us-central1")
  .firestore
  .document("request/{documentID}")
  .onWrite( async(change, context) => {
    console.log("Updating Request event was triggered on request."); 

    const oldValue = change.before.exists ? change.before.data() : null;  
    const oldStatus = change.before.exists ? oldValue.status : '';

    const newValue = change.after.exists ? change.after.data() : null;
    const type = newValue.type;
    const newStatus = newValue.status;
    const senderId = newValue.senderId;
    const sender = newValue.sender;
    const receiverId = newValue.receiverId;
    const receiver = newValue.receiver;
    const isSchedule = newValue.isSchedule;
    const scheduleTime = newValue.scheduleTime;
    const scheduleTimezone = newValue.scheduleTimeZone;
    const time = newValue.time;
    const requestID = newValue.requestid;
    
    // const offsetseconds = offset * 60 * 60 * 1000;
    // var dt = new Date(scheduleTime + offsetseconds)
    // var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug', 'Sep','Oct','Nov','Dec'];           
    // var month = dt.getUTCMonth();
    // var monthString = months[month];
    // var day = dt.getUTCDate();
    // var hour = dt.getUTCHours();
    // var minute = dt.getUTCMinutes()
    // var minuteString = minute == 0 ? "00" : minute.toString()
    // var hourString = (hour == 0) ? "12" + ":" + minuteString + " AM" : (hour < 12) ?  hour.toString() + ":" + minuteString + " AM" : (hour == 12) ? "12" + ":" + minuteString + " PM" : (hour - 12).toString() + ":" + minuteString + " PM"
    
    const senderName = sender.firstname + " " + sender.lastname;
    const receiverName = receiver.firstname + " " + receiver.lastname;

    const minOffset = momentT.tz(scheduleTimezone.tzCode).utcOffset();
    const strSchedule = moment(scheduleTime + minOffset * 60 * 1000).utc().format('h:mm A on MMM D')

    const receiversSnapshot = await db
    .collection('users')
    .where('type', '!=', 'customer')
    .get();
    const receriverIds = receiversSnapshot.docs.map(doc => doc.id);  

    const adminSnapshot = await db
    .collection('users')
    .where('type', '==', 'admin')
    .get();
    const adminId = adminSnapshot.docs[0].id;

    if (oldStatus === '' ) {
      if (newStatus === 'pending') {
        const messageCustomer = (isSchedule === true) ? "A meeting request at " + strSchedule + " is submitted." : "Your support request is submitted.";
        const dataCustomer = {          
          title: 'MeLiSA',
          type: 'submitted',
          message: messageCustomer,
          time: new Date().getTime(),
          sender: senderId,
          receivers: [senderId]
        };
          
        const messageRep = (isSchedule === true) ? senderName + " is requesting a support at " + strSchedule + "." : senderName + " is requesting " + type.toLowerCase() + " support."; 
        const dataRep = {          
          title: 'MeLiSA',
          type:  (isSchedule === true) ? 'received' : 'livereceived',
          message: messageRep,
          time: new Date().getTime(),
          sender: senderId,
          receivers: receriverIds,
        };

        const batch = db.batch();
        var newDocCustomer = db.collection('notification').doc();
        var newDocRep = db.collection('notification').doc();
        var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
        var newDocRepRef = db.collection('notification').doc(newDocRep.id);
        batch.set(newDocCustomerRef, dataCustomer);
        batch.set(newDocRepRef, dataRep);
        return batch.commit();

      } else if (newStatus === 'accepted') {
        const messageCustomer = receiverName + " has initiated support with you.";          
        const dataCustomer = {          
          title: 'MeLiSA',
          type: 'initiated',
          message: messageCustomer,
          time: new Date().getTime(),
          sender: receiverId,
          receivers: [senderId],
          request: requestID
        };
        
        const messageRep = "You initiated support with " + senderName + ".";
        const dataRep = {          
          title: 'MeLiSA',
          type: 'accepted',
          message: messageRep,
          time: new Date().getTime(),
          sender: receiverId,
          receivers: [receiverId],
          request: requestID
        };       

        const messageAdmin = receiverName + " has initiated support with " + senderName + ".";          
        const dataAdmin = {          
          title: 'MeLiSA',
          type: 'accepted',
          message: messageAdmin,
          time: new Date().getTime(),
          sender: receiverId,
          receivers: [adminId],
          request: requestID
        };

        const batch = db.batch();
        var newDocCustomer = db.collection('notification').doc();
        var newDocRep = db.collection('notification').doc();
        var newDocAdmin = db.collection('notification').doc();
        var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
        var newDocRepRef = db.collection('notification').doc(newDocRep.id);
        var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
        batch.set(newDocCustomerRef, dataCustomer);
        batch.set(newDocRepRef, dataRep);
        batch.set(newDocAdminpRef, dataAdmin);
        return batch.commit();
      }

    } else if ((oldStatus === 'pending' || oldStatus === 'assigned' ) && (newStatus === 'cancelled')) {
      const messageCustomer = (isSchedule === true) ? "A meeting request at " + strSchedule + " was cancelled." : "Your support request was cancelled.";
      const dataCustomer = {          
        title: 'MeLiSA',
        type: 'cancelled',
        message: messageCustomer,
        time: new Date().getTime(),
        sender: senderId,
        receivers: [senderId]
      };
      
      const messageRep = (isSchedule === true) ? senderName + " cancelled the support scheduled at " + strSchedule + "." : senderName + " cancelled the support.";
      const dataRep = {          
        title: 'MeLiSA',
        type: 'cancelled',
        message: messageRep,
        time: new Date().getTime(),
        sender: senderId,
        receivers: receriverIds,
      };

      const batch = db.batch();
      var newDocCustomer = db.collection('notification').doc();
      var newDocRep = db.collection('notification').doc();
      var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      batch.set(newDocCustomerRef, dataCustomer);
      batch.set(newDocRepRef, dataRep);
      return batch.commit();

    } else if ((oldStatus === 'pending' || oldStatus === 'assigned' ) && (newStatus === 'scheduled')) {

      const messageCustomer = "Your support request at "+ strSchedule + " is scheduled by " + receiverName;          
      const dataCustomer = {          
        title: 'MeLiSA',
        type: 'scheduled',
        message: messageCustomer,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [senderId],
      };
      
      const messageRep = (isSchedule === true) ? "You scheduled " + senderName + "'s support request at " + strSchedule + "." : "You accepted " + senderName + "'s support request.";
      const dataRep = {          
        title: 'MeLiSA',
        type: 'scheduled',
        message: messageRep,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [receiverId]
      };       

      const messageAdmin = senderName + "'s support request is scheduled by " + receiverName;          
      const dataAdmin = {          
        title: 'MeLiSA',
        type: 'scheduled',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [adminId],
      };

      const batch = db.batch();
      var newDocCustomer = db.collection('notification').doc();
      var newDocRep = db.collection('notification').doc();
      var newDocAdmin = db.collection('notification').doc();
      var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocCustomerRef, dataCustomer);
      batch.set(newDocRepRef, dataRep);
      batch.set(newDocAdminpRef, dataAdmin);
      return batch.commit();

    } else if ((oldStatus === 'pending' || oldStatus === 'assigned' ) && (newStatus === 'accepted')) {

      const messageCustomer = "Your support request is accepted by " + receiverName;          
      const dataCustomer = {          
        title: 'MeLiSA',
        type: 'accepted',
        message: messageCustomer,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [senderId],
      };
      
      const messageRep = "You accepted " + senderName + "'s support request.";
      const dataRep = {          
        title: 'MeLiSA',
        type: 'accepted',
        message: messageRep,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [receiverId]
      };       

      const messageAdmin = senderName + "'s support request is accepted by " + receiverName;          
      const dataAdmin = {          
        title: 'MeLiSA',
        type: 'accepted',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [adminId],
      };

      const batch = db.batch();
      var newDocCustomer = db.collection('notification').doc();
      var newDocRep = db.collection('notification').doc();
      var newDocAdmin = db.collection('notification').doc();
      var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocCustomerRef, dataCustomer);
      batch.set(newDocRepRef, dataRep);
      batch.set(newDocAdminpRef, dataAdmin);
      return batch.commit();

    }  else if ((oldStatus === 'accepted' || oldStatus === 'addedColleague') && (newStatus === 'completed')) {
      const messageCustomer = 'You ended the support session with ' + receiverName + ".";
      const dataCustomer = {          
        title: 'MeLiSA',
        type: (type === 'Chat') ? 'endedChat' : 'endedCall',
        message: messageCustomer,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [senderId]
      };
      
      const messageRep = senderName +' ended the support session.';            
      const dataRep = {          
        title: 'MeLiSA',
        type: (type === 'Chat') ? 'endedChat' : 'endedCall',
        message: messageRep,
        time: new Date().getTime(),
        sender: senderId,
        receivers: [receiverId],
      };

      const messageAdmin = senderName + " ended the support session with " + receiverName + ".";          
      const dataAdmin = {          
        title: 'MeLiSA',
        type: (type === 'Chat') ? 'endedChat' : 'endedCall',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: senderId,
        receivers: [adminId],
      };

      const batch = db.batch();
      var newDocCustomer = db.collection('notification').doc();
      var newDocRep = db.collection('notification').doc();
      var newDocAdmin = db.collection('notification').doc();
      var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocCustomerRef, dataCustomer);
      batch.set(newDocRepRef, dataRep);
      batch.set(newDocAdminpRef, dataAdmin);
      return batch.commit();

    } else {
      return
    }       
});   

exports.pushSurveyNotification = functions
  .region("us-central1")
  .firestore
  .document("survey/{documentID}")
  .onWrite( async(change, context) => {
    console.log("Updating Survey event was triggered on survey."); 

    const oldValue = change.before.exists ? change.before.data() : null;  
    const oldStatus = change.before.exists ? oldValue.status : -1;
    const oldSubmissions = change.before.exists ? oldValue.submissions : 0;

    const newValue = change.after.exists ? change.after.data() : null;
    const newStatus = change.after.exists ? newValue.status : -1;
    const newTitle = change.after.exists ? newValue.title : '';      
    const newSurveyId = change.after.exists ? newValue.surveyId : '';
    const newSubmissions = change.after.exists ? newValue.submissions : 0;

    const adminSnapshot = await db
    .collection('users')
    .where('type', '==', 'admin')
    .get();
    const adminId = adminSnapshot.docs[0].id;

    const customersSnapshot = await db
    .collection('users')
    .where('type', '==', 'customer')
    .get();
    const customerIds = customersSnapshot.docs.map(doc => doc.id);  
    
    if ((oldStatus === 0) && (newStatus === 1)) {
      const messageCustomer = "Please fill a " + newTitle + " form."; 
      const dataCustomer = {          
        title: 'MeLiSA',
        type: 'survey',
        message: messageCustomer,
        time: new Date().getTime(),
        sender: adminId,
        receivers: customerIds,
        survey: newSurveyId,
      };

      const messageAdmin = newTitle + " is posted.";
      const dataAdmin = {          
        title: 'MeLiSA',
        type: 'survey',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [adminId],
        survey: newSurveyId,
      };
      
      const batch = db.batch();
      var newDocCustomer = db.collection('notification').doc();
      var newDocAdmin = db.collection('notification').doc();
      var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocCustomerRef, dataCustomer);
      batch.set(newDocAdminpRef, dataAdmin);
      return batch.commit();

    } else if ((oldStatus === 1) && (newStatus === 1) && (oldSubmissions === newSubmissions)) {
      const messageCustomer = "Please fill a " + newTitle + " form."; 
      const dataCustomer = {          
        title: 'MeLiSA',
        type: 'survey',
        message: messageCustomer,
        time: new Date().getTime(),
        sender: adminId,
        receivers: customerIds,
        survey: newSurveyId,
      };

      const batch = db.batch();
      var newDocCustomer = db.collection('notification').doc();
      var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
      batch.set(newDocCustomerRef, dataCustomer);
      return batch.commit();

    } else {
      return
    }       
});   

exports.removeAllSessions = functions.https.onRequest( async (request, response) => {
  const senderId = request.body.userid;

  try {
    const snapshot = await db
    .collection('request')
    .where('senderId', '==', senderId)
    .orderBy('scheduleTime')
    .get();

    if (!snapshot.empty) {
      const batch = db.batch();

      snapshot.forEach(request => {
        if (request.data().isSchedule == false) {   
          if( (request.data().status === 'pending') || (request.data().status === 'assigned') ){    
            const requestfRef = db.collection('request').doc(request.data().requestid);
            batch.update(requestfRef, {status: 'cancelled'});    
          }
        }
      });

      await batch.commit();
    }

    return response.send({
      statusCode: 200,
    });
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.completeAllSessions = functions.https.onRequest( async (request, response) => {
  const receiverId = request.body.userid;

  try {
    const snapshot = await db
    .collection('request')
    .where('receiverId', '==', receiverId)
    .get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.forEach(request => {
        if (request.data().isSchedule == false) {   
          if( (request.data().status === 'cancelled') || (request.data().status === 'completed') ){        
          } else {
            const requestfRef = db.collection('request').doc(request.data().requestid);
            batch.update(requestfRef, {status: 'completed'});           
          } 
        }
      });
      await batch.commit();
    }

    return response.send({
      statusCode: 200,
    });
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getRequests = functions.https.onRequest( async (request, response) => {
  var scRequests = [];
  var unscRequests = [];

  try {
    const snapshot = await db
    .collection('request')
    // .where('status', '==', 'pending')
    .orderBy('scheduleTime')
    .get();

    if (!snapshot.empty) {
      snapshot.forEach(request => {
        if( (request.data().status === 'cancelled') || (request.data().status === 'completed') ){        
        } else {
          if (request.data().isSchedule == true) {        
            scRequests.push({...request.data()});
          } else {
            unscRequests.push({...request.data()});
          }
        }  
      });
    }

    return response.send({
      statusCode: 200,
      scheduled: scRequests,
      unscheduled: unscRequests,
    });

  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getAdminRequests = functions.https.onRequest( async (request, response) => {
  var requests = [];
  var scRequests = [];
  var unscRequests = [];

  try {
    const snapshot = await db
    .collection('request')
    .orderBy('scheduleTime')
    .get();

    if (!snapshot.empty) {
      snapshot.forEach(request => {
        if( (request.data().status === 'cancelled') || (request.data().status === 'completed') ){        
        } else {
          requests.push({...request.data()});
        }      
      });

      requests.forEach(request => {       
        if (request.isSchedule == true) {   
          scRequests.push(request)
        } else {
          unscRequests.push(request)
        }
      });
    }

    return response.send({
      statusCode: 200,
      scheduled: scRequests,
      unscheduled: unscRequests,
    });
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getNotifications = functions.https.onRequest( async (request, response) => {
  const receiverId = request.body.userid;

  var promises = [];
  var promisesRequest = [];
  var notifications = [];
  var targets = [];

  try {
    const snapshot = await db
    .collection('notification')
    .where('receivers', 'array-contains', receiverId)
    .orderBy('time', 'desc')
    .limit(100)
    .get();

    if (!snapshot.empty) {
      snapshot.forEach(notification => {
        notifications.push({...notification.data(), notificationId: notification.id });
        promises.push(db.collection('users').doc(notification.data().sender).get())
        if (notification.data().request) {
          promisesRequest.push(db.collection('request').doc(notification.data().request).get())
        }
      });
  
      var users = await Promise.all(promises);
      var requests = await Promise.all(promisesRequest);

      notifications.forEach(notification => {
        var tmpusers = users.filter(item => item.data().userid === notification.sender);
  
        if (tmpusers.length > 0){
          if (notification.request) {
            var tmprequests = []
            if (requests.length > 0 ){
              tmprequests = requests.filter(item => item.data().requestid == notification.request)
            }

            if (tmprequests.length > 0) {
              targets.push({notification: notification, sender: tmpusers[0].data(), request: tmprequests[0].data()});
            } else {
              targets.push({notification: notification, sender: tmpusers[0].data(), request: null});
            }

          } else {
            targets.push({notification: notification, sender: tmpusers[0].data(), request: null});
          }      
        }      
      });
    }

    return response.send({
      statusCode: 200,
      notifications: targets,
    });
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.deleteNotifications = functions.https.onRequest( async (request, response) => {
  const receiverId = request.body.userid;
  const notiicatinIds = request.body.notifications;

  try {
    var promises = [];
    notiicatinIds.forEach(notificationId => {
      promises.push(db.collection('notification').doc(notificationId).get())
    });

    var notifications = await Promise.all(promises);

    const batch = db.batch();
    notifications.forEach(notificationDoc => {
      var documentData = notificationDoc.data()
      var receivers = documentData.receivers
      if (receivers.includes(receiverId)) {
        const index = receivers.indexOf(receiverId)
        receivers.splice(index, 1);
      } 

      documentData.receivers = receivers
      batch.update(notificationDoc.ref, {"receivers": receivers})
    });

    batch.commit();

    return response.send({
      statusCode: 200,
    });

  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.writeRating = functions.https.onRequest( async (request, response) => {
  const senderId = request.body.userid;
  const receiverId = request.body.receiverid;
  const star = request.body.rating;
  const review = request.body.comment;
  const requestId = request.body.requestid;

  try {
    const senderDoc = await db
    .collection('users')
    .doc(senderId)    
    .get();
    const senderName = senderDoc.data().firstname + " " + senderDoc.data().lastname;

    const receiverDoc = await db
    .collection('users')
    .doc(receiverId)    
    .get();
    const receiverName = receiverDoc.data().firstname + " " + receiverDoc.data().lastname;

    const adminSnapshot = await db
    .collection('users')
    .where('type', '==', 'admin')
    .get();
    const adminId = adminSnapshot.docs[0].id;

    const ratingDoc = await db
    .collection('rating')
    .doc(receiverId)    
    .get();
    
    var receiverRatings = []
    if (ratingDoc.exists){

      if (ratingDoc.data().rating){
        receiverRatings = ratingDoc.data().rating;
      }
      receiverRatings.push({'requestId': requestId, 'review': review, 'star': star, 'writerId': senderId, 'writerName': senderName, 'time': new Date().getTime()})     

      await db
      .collection('rating')
      .doc(receiverId)
      .update({'rating': receiverRatings})
      .then(() => {
        console.log("Rating & Review was posted successfully!")
      });      
    } else {
      receiverRatings.push({'requestId': requestId,'review': review, 'star': star, 'writerId': senderId, 'writerName': senderName, 'time': new Date().getTime()})

      await db
      .collection('rating')
      .doc(receiverId)
      .set({'rating': receiverRatings})
      .then(() => {
        console.log("Rating & Review was posted successfully!")
      });      
    }
      const messageCustomer = "Thank you for submitting a ratings to " + receiverName + ".";
      const dataCustomer = {          
        title: 'MeLiSA',
        type: 'submitting',
        message: messageCustomer,
        time: new Date().getTime(),
        sender: senderId,
        receivers: [senderId]
      };
      
      const messageRep = senderName + " gave you the ratings.";          
      const dataRep = {          
        title: 'MeLiSA',
        type: 'submitting',
        message: messageRep,
        time: new Date().getTime(),
        sender: senderId,
        receivers: [receiverId],
      };

      const messageAdmin = receiverName + " received a rating & review from " + senderName + ".";          
      const dataAdmin = {          
        title: 'MeLiSA',
        type: 'submitting',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: senderId,
        receivers: [adminId],
      };

      const batch = db.batch();
      var newDocCustomer = db.collection('notification').doc();
      var newDocRep = db.collection('notification').doc();
      var newDocAdmin = db.collection('notification').doc();
      var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocCustomerRef, dataCustomer);
      batch.set(newDocRepRef, dataRep);
      batch.set(newDocAdminpRef, dataAdmin);
      batch.commit();

      return response.send({
        statusCode: 200,
      });

  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.askRating = functions.https.onRequest( async (request, response) => {
  const senderId = request.body.senderid;
  const receiverId = request.body.receiverid;
  const senderName = request.body.sendername;
  const receiverName = request.body.receivername;
  const requestId = request.body.requestid;

  try {

    const messageCustomer = receiverName + " has asked you to give the ratings.";
    const dataCustomer = {          
      title: 'MeLiSA',
      type: 'ratingAsked',
      message: messageCustomer,
      time: new Date().getTime(),
      sender: receiverId,
      receivers: [senderId],
      request: requestId
    };
      
    // const messageRep = senderName + " gave you the ratings.";          
    // const dataRep = {          
    //   title: 'MeLiSA',
    //   type: 'submitting',
    //   message: messageRep,
    //   time: new Date().getTime(),
    //   sender: senderId,
    //   receivers: [receiverId],
    // };

    const batch = db.batch();
    var newDocCustomer = db.collection('notification').doc();
    // var newDocRep = db.collection('notification').doc();
    var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
    // var newDocRepRef = db.collection('notification').doc(newDocRep.id);
    batch.set(newDocCustomerRef, dataCustomer);
    // batch.set(newDocRepRef, dataRep);

    batch.commit();

    return response.send({
      statusCode: 200,
    });
    
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.deleteRatings = functions.https.onRequest( async (request, response) => {
  const receiverId = request.body.userid;
  const ratingIndexes = request.body.requestIds;

  try {
    const ratingDoc = await db
    .collection('rating')
    .doc(receiverId)    
    .get();
    
    var receiverRatings = []
    var newRatings = []

    if (ratingDoc.exists){
      if (ratingDoc.data().rating){
        receiverRatings = ratingDoc.data().rating;
      }

      receiverRatings.forEach((rating, index) => {
        if (!ratingIndexes.includes(rating.requestId)){
          newRatings.push(rating)
        }
      })
    
      await db
      .collection('rating')
      .doc(receiverId)
      .update({'rating': newRatings})
      .then(() => {
        console.log("Successfully Upated")
      });      
    } 
    
    return response.send({
      statusCode: 200,
    });   
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getSupports = functions.https.onRequest( async (request, response) => {
  const senderId = request.body.userid;

  var requests = [];
  var scRequests = [];
  var activeSessions = [];
  var closedSessions = [];

  try {
    const snapshot = await db
    .collection('request')
    .where('senderId', '==', senderId)
    .orderBy('scheduleTime', 'desc')
    .get();

    if (!snapshot.empty) {
      snapshot.forEach(request => {
        if (request.data().status != 'cancelled') {
          requests.push({...request.data()});
        }      
      });

      let today = new Date()
      requests.forEach(request => { 
        if ( request.status == 'accepted' || request.status == 'addedColleague' ) {
          activeSessions.push(request);
        } 

        // if ((request.status == 'pending' || request.status == 'scheduled') && (request.isSchedule == true && request.scheduleTime > today.getTime())) {
        //   scRequests.push(request);
        // }
        if (request.isSchedule == true){
          scRequests.push(request);
        }
        
        if (request.status == 'completed') {
          closedSessions.push(request);
        }        
      });
    }

    return response.send({
      statusCode: 200,
      request: requests,
      scheduled: scRequests,
      active: activeSessions,
      closed: closedSessions
    });

  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getCompanySupports = functions.https.onRequest( async (request, response) => {
  const receiverId = request.body.userid;

  var requests = [];
  var scRequests = [];
  var activeSessions = [];
  var closedSessions = [];

  try {
    const snapshot = await db
    .collection('request')
    .where('receiverId', '==', receiverId)
    .orderBy('scheduleTime', 'desc')
    .get();

    if (!snapshot.empty) {
      snapshot.forEach(request => {
        if ( request.data().status != 'cancelled' )  {
          requests.push({...request.data()});
        }
      });

      let today = new Date()

      requests.forEach(request => {
        if ( request.status == 'accepted' || request.status == 'addedColleague' ) {
          activeSessions.push(request);
        } 

        // if ((request.status == 'scheduled') && (request.isSchedule == true) && (request.scheduleTime > today.getTime())) { 
        //   scRequests.push(request);
        // }
        if (request.isSchedule == true){
          scRequests.push(request);
        }

        if ( request.status == 'completed' ) {
          closedSessions.push(request);
        }          
      });
    }

    return response.send({
      statusCode: 200,
      request: requests,
      scheduled: scRequests,
      active: activeSessions,
      closed: closedSessions
    });

  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getAdminSupports = functions.https.onRequest( async (request, response) => {
  
  var requests = [];
  var comUsers = [];  
  var pendingUsers = [];
  var activeUsers = [];

  try {
    let currentMiliSeconds = new Date().getTime() - 60 * 60 * 1000;

    const snapshotRequest = await db
    .collection('request')
    .where('status', '==', 'accepted')
    .where('scheduleTime', '>', currentMiliSeconds)
    .orderBy('scheduleTime', 'desc')
    .get();

    if (!snapshotRequest.empty) {
      snapshotRequest.forEach(request => {
        requests.push({...request.data()});
      });
    } 

    const snapshotUser = await db
    .collection('users')
    .where('type', '==', 'company')
    .get();    

    if (!snapshotUser.empty) {
      snapshotUser.forEach(user => {
        if (user.data().isAccept == 'accepted') {
          comUsers.push({...user.data()});
        } else if (user.data().isAccept == 'pending') {
          pendingUsers.push({...user.data()});
        }  
      });

      comUsers.forEach(user => {
        if (requests.length > 0) {
          var tmpRequests = requests.filter(item => item.receiverId === user.userid);
  
          if (tmpRequests.length > 0 ){ 
            activeUsers.push({request: tmpRequests[0], receiver: user})
          } else {
            activeUsers.push({request: null, receiver: user})
          }
        } else {
          activeUsers.push({request: null, receiver: user})
        }      
      })
    }

    return response.send({
      statusCode: 200,
      accepted: activeUsers,
      pending: pendingUsers,
    });

  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getReps = functions.https.onRequest( async (request, response) => {
  const repId = request.body.userid;
  
  var requests = [];
  var comUsers = [];  
  var idleUsers = [];

  try {
    let currentMiliSeconds = new Date().getTime() - 60 * 60 * 1000;

    const snapshotRequest = await db
    .collection('request')
    .where('status', '==', 'accepted')
    .where('scheduleTime', '>', currentMiliSeconds)
    .orderBy('scheduleTime', 'desc')
    .get();

    if (!snapshotRequest.empty) {
      snapshotRequest.forEach(request => {
        requests.push({...request.data()});
      });
    }    

    const snapshotUser = await db
    .collection('users')
    .where('type', '==', 'company')
    .get();

    if (!snapshotUser.empty) {
      snapshotUser.forEach(user => {
        if ( user.data().isAccept == 'accepted' && user.data().userid != repId ) {
          comUsers.push({...user.data()});
        } 
      });

      comUsers.forEach(user => {
        if (requests.length > 0) {
          var tmpRequests = requests.filter(item => item.receiverId === user.userid);
  
          if (tmpRequests.length == 0 ){
            idleUsers.push(user)
          }
        } else {
          idleUsers.push(user)
        }      
      })
    }

    return response.send({
      statusCode: 200,
      reps: comUsers,
      ideals: idleUsers,
    });
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getCompanyReps = functions.https.onRequest( async (request, response) => {
  const adminId = request.body.userid;
  
  var requests = [];
  var comUsers = [];  
  var idleUsers = [];

  try {
    let currentMiliSeconds = new Date().getTime() - 60 * 60 * 1000;

    const snapshotRequest = await db
    .collection('request')
    .where('status', '==', 'accepted')
    .where('scheduleTime', '>', currentMiliSeconds)
    .orderBy('scheduleTime', 'desc')
    .get();

    if (!snapshotRequest.empty) {
      snapshotRequest.forEach(request => {
        requests.push({...request.data()});
      });
    }    

    const snapshotUser = await db
    .collection('users')
    .where('type', '==', 'company')
    .get();

    if (!snapshotUser.empty) {
      snapshotUser.forEach(user => {
        if ( user.data().isAccept == 'accepted') {
          comUsers.push({...user.data()});
        } 
      });

      comUsers.forEach(user => {
        if (requests.length > 0) {
          var tmpRequests = requests.filter(item => item.receiverId === user.userid);
  
          if (tmpRequests.length == 0 ){
            idleUsers.push(user)
          }
        } else {
          idleUsers.push(user)
        }      
      })
    }

    return response.send({
      statusCode: 200,
      reps: comUsers,
      ideals: idleUsers,
    });
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getFullReps = functions.https.onRequest( async (request, response) => {
  const adminId = request.body.userid;
  
  var ratings = [];
  var comUsers = []; 
  try {
    const snapshotRating = await db
    .collection('rating')
    .get();
    if (!snapshotRating.empty) {
      snapshotRating.forEach(rating => {
        ratings.push({...rating.data(), ratingId: rating.id });
      });
    }

    const snapshotUser = await db
    .collection('users')
    .where('type', '==', 'company')
    .get();

    if (!snapshotUser.empty) {
      snapshotUser.forEach(user => {
        if ( user.data().isAccept == 'accepted') {

          if (ratings.length > 0) {
            var tmpRatings = ratings.filter(item => item.ratingId === user.data().userid);
            if (tmpRatings.length > 0 ){
              comUsers.push({...user.data(), rating: tmpRatings[0].rating })
            } else {
              comUsers.push({...user.data()})
            }
          } else {
            comUsers.push({...user.data()})
          }
        }
      });
    }

    return response.send({
      statusCode: 200,
      reps: comUsers,
    });

  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.acceptRequest = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const receiverId = request.body.receiverid;

  try {
    const receiverDoc = await db
    .collection('users')
    .doc(receiverId)    
    .get();

    const requestDoc = await db
    .collection('request')
    .doc(requestId)    
    .get();

    if (requestDoc.data().status == 'pending'){
      await db
      .collection('request')
      .doc(requestId)
      .update({'status': 'accepted', 'receiverId': receiverId, 'receiver': receiverDoc.data()})
      .then(() => {
        return response.send({
          statusCode: 200,
        });
      })  
    } else if (requestDoc.data().status == 'cancelled') {
      return response.send({
        statusCode: 201,
        error: 'This request was cancelled.'
      });
    } else {
      return response.send({
        statusCode: 202,
        error: 'Already someone has accepted this request.'
      });
    }
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});


exports.scheduleRequest = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const receiverId = request.body.receiverid;

  try {
    const receiverDoc = await db
    .collection('users')
    .doc(receiverId)    
    .get();
    
    await db
    .collection('request')
    .doc(requestId)
    .update({'status': 'scheduled', 'receiverId': receiverId, 'receiver': receiverDoc.data()})
    .then(() => {
      return response.send({
        statusCode: 200,
      });
    })    
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.assignSupport = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const senderName = request.body.sendername;    
  const receiverId = request.body.receiverid;
  const adminId = request.body.adminid;
  const isSchedule = request.body.isschedule;
  
  try {
    const receiverDoc = await db
    .collection('users')
    .doc(receiverId)    
    .get();
    const receiverName = receiverDoc.data().firstname + " " + receiverDoc.data().lastname;

    await db
    .collection('request')
    .doc(requestId)
    .update({'status': 'assigned', 'receiverId': receiverId, 'receiver': receiverDoc.data()})
    .then(() => {      
      const messageRep = isSchedule ? "A schedule support request from " + senderName + " is assigned to you." : "A support request from " + senderName + " is assigned to you.";          
      const dataRep = {          
        title: 'Request Assigned',
        type: 'assign',
        message: messageRep,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [receiverId],
        request: requestId,
      };

      const messageAdmin = isSchedule ? "A schedule support request by " + senderName + " is assigned to " + receiverName + ".": "A support request by " + senderName + " is assigned to " + receiverName + ".";         
      const dataAdmin = {          
        title: 'Request Assigned',
        type: 'assign',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [adminId],
        request: requestId,
      };

      const batch = db.batch();
      var newDocRep = db.collection('notification').doc();
      var newDocAdmin = db.collection('notification').doc();
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocRepRef, dataRep);
      batch.set(newDocAdminpRef, dataAdmin);
      batch.commit();

      return response.send({
        statusCode: 200,
      });
    })    
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.acceptAssignedSupport = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const notificationId = request.body.notificationid;
  const isSchedule = request.body.isschedule;

  try {
    await db
    .collection('notification')
    .doc(notificationId)
    .update({'type': 'assignAccepted'})
    .then(() => {
      console.log("Upated notification type successfully!")
    }); 

    await db
    .collection('request')
    .doc(requestId)
    .update({'status': isSchedule ? 'scheduled' : 'accepted'})
    .then(() => {
      console.log("Accepted an Assgiend Support successfully!")
      return response.send({
        statusCode: 200,
      });
    });
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.declineAssignedSupport = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const notificationId = request.body.notificationid;
  const reason = request.body.reason;  
  const receiverId = request.body.receiverid;
  const adminId = request.body.adminid;  
  
  try {
    const receiverDoc = await db
    .collection('users')
    .doc(receiverId)    
    .get();
    const receiverName = receiverDoc.data().firstname + " " + receiverDoc.data().lastname;

    await db
    .collection('notification')
    .doc(notificationId)
    .update({'type': "assignDeclined"})
    .then(() => {
      console.log("Upated notification type successfully!")
    });

    await db
    .collection('request')
    .doc(requestId)
    .update({'status': 'pending', 'receiverId': '', 'receiver': ''})
    .then(() => {
      console.log("Declined an assigned Support successfully!")

      const messageAdmin = receiverName + ' declined an assigned support with "' + reason + '"'; 
      const dataAdmin = {          
        title: 'Decline Assigned Request',
        type: 'assignDeclined',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [adminId],
        request: requestId,
      };

      const batch = db.batch();
      var newDocAdmin = db.collection('notification').doc();
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocAdminpRef, dataAdmin);
      batch.commit();

      return response.send({
        statusCode: 200,
      });
    })    
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }  
});

exports.colleagueRequest = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid; 
  const receiverId = request.body.receiverid;
  const secReceiverId = request.body.secondReceiverid;
  
  try {
    const secReceiverDoc = await db
    .collection('users')
    .doc(secReceiverId)    
    .get();
    const secReceiverName = secReceiverDoc.data().firstname + " " + secReceiverDoc.data().lastname;

    const requestDoc = await db
    .collection('request')
    .doc(requestId)    
    .get();

    var receiverName = ""     
    var otherReceiverIds = []
    var otherReceivers = []
    if (!requestDoc.empty){
      if (requestDoc.data().otherReceiverIds) {
        otherReceiverIds = requestDoc.data().otherReceiverIds
      }
      if (requestDoc.data().otherReceivers) {
        otherReceivers = requestDoc.data().otherReceivers
      }
      receiverName = requestDoc.data().receiver.firstname + " " + requestDoc.data().receiver.lastname; 
    }

    if (!otherReceiverIds.includes(secReceiverId)){
      otherReceiverIds.push(secReceiverId)
      otherReceivers.push(secReceiverDoc.data())
    }    

    // .update({'status': 'requestedColleague', 'otherReceiverIds': otherReceiverIds, 'otherReceivers': otherReceivers})

    await db
    .collection('request')
    .doc(requestId)
    .update({'otherReceiverIds': otherReceiverIds, 'otherReceivers': otherReceivers})
    .then(() => {
      console.log("Requested colleague successfully!")

      const messageRep = "You has requested " + secReceiverName + " to join a chat support.";         
      const dataRep = {          
        title: 'Requested Join',
        type: 'requestedColleague',
        message: messageRep,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [receiverId],
        request: requestId,
      };

      const messageSecond = receiverName + " has requested you to join a chat support.";          
      const dataSecond = {          
        title: 'Request Join',
        type: 'colleague',
        message: messageSecond,
        time: new Date().getTime(),
        sender: receiverId,
        receivers: [secReceiverId],
        request: requestId,
      };

      const batch = db.batch();
      var newDocRep = db.collection('notification').doc();
      var newDocSecond = db.collection('notification').doc();     
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      var newDocSecondRef = db.collection('notification').doc(newDocSecond.id);
      batch.set(newDocRepRef, dataRep);
      batch.set(newDocSecondRef, dataSecond);
      batch.commit();

      return response.send({
        statusCode: 200,
      });
    });    
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.acceptColleagueRequest = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const notificationId = request.body.notificationid;
  const type = request.body.type;
  const updatedType = (type === 'colleague') ? 'colleagueAccepted' : 'acceptedAssignColleague'

  try {
    await db
    .collection('notification')
    .doc(notificationId)
    .update({'type': updatedType })
    .then(() => {
      console.log("Updated notification type successfully!")
    });
    
    await db
    .collection('request')
    .doc(requestId)
    .update({'status': 'addedColleague'})
    .then(() => {
      return response.send({
        statusCode: 200,
      });
    })    
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.declineColleagueRequest = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const notificationId = request.body.notificationid;
  const receiverId = request.body.receiverid;
  const secReceiverId = request.body.secondReceiverid;

  try {
    const secReceiverDoc = await db
    .collection('users')
    .doc(secReceiverId)    
    .get();
    const secReceiverName = secReceiverDoc.data().firstname + " " + secReceiverDoc.data().lastname;

    const requestDoc = await db
    .collection('request')
    .doc(requestId)    
    .get();
    
    var senderName = ""
    var otherReceiverIds = []
    var otherReceivers = []
    if (!requestDoc.empty){
      if (requestDoc.data().otherReceiverIds) {
        otherReceiverIds = requestDoc.data().otherReceiverIds
      }

      if (requestDoc.data().otherReceivers) {
        otherReceivers = requestDoc.data().otherReceivers
      }

      senderName =  requestDoc.data().sender.firstname + " " + requestDoc.data().sender.lastname;
    }

    if (otherReceiverIds.includes(secReceiverId)) {
      const index = otherReceiverIds.indexOf(secReceiverId)
      otherReceiverIds.splice(index, 1);
      otherReceivers.splice(index, 1);
    }
    
    await db
    .collection('notification')
    .doc(notificationId)
    .update({'type': "colleagueDeclined"})
    .then(() => {
      console.log("Declined Colleague Request successfully!")
    });

    // .update({'status': 'declinedColleague', 'otherReceiverIds': otherReceiverIds, 'otherReceivers': otherReceivers})

    await db
    .collection('request')
    .doc(requestId)
    .update({'otherReceiverIds': otherReceiverIds, 'otherReceivers': otherReceivers})
    .then(() => {
      console.log("Requested colleague successfully!")

      const messageRep = secReceiverName + ' declined a your colleague request for ' + senderName + "'s chat support."; 
      const dataRep = {          
        title: 'Declined Colleague Request',
        type: 'colleagueDeclined',
        message: messageRep,
        time: new Date().getTime(),
        sender: secReceiverId,
        receivers: [receiverId],
        request: requestId,
      };

      const batch = db.batch();
      var newDocRep = db.collection('notification').doc();
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      batch.set(newDocRepRef, dataRep);
      batch.commit();

      return response.send({
        statusCode: 200,
      });
    });
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.askingAdmin = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const receiverId = request.body.receiverid;
  const messageToAdmin = request.body.messagetoadmin;
  
  try {
    const receiverDoc = await db
    .collection('users')
    .doc(receiverId)    
    .get();
    const receiverName = receiverDoc.data().firstname + " " + receiverDoc.data().lastname;

    const adminSnapshot = await db
    .collection('users')
    .where('type', '==', 'admin')
    .get();
    const adminId = adminSnapshot.docs[0].id;

    const messageRep = "You has asked Admin to assign someone on a chat support.";         
    const dataRep = {          
      title: 'Asked Admin to Assign',
      type: 'askedAdmin',
      message: messageRep,
      time: new Date().getTime(),
      sender: receiverId,
      receivers: [receiverId],
      request: requestId,
      messageToAdmin: messageToAdmin
    };
      
    const messageAdmin = receiverName + " has asked you to assign someone on a chat support.";          
    const dataAdmin = {          
      title: 'Asked for Assign',
      type: 'askingAdmin',
      message: messageAdmin,
      time: new Date().getTime(),
      sender: receiverId,
      receivers: [adminId],
      request: requestId,
      messageToAdmin: messageToAdmin,
    };
   
    const batch = db.batch();
    var newDocRep = db.collection('notification').doc();
    var newDocAdmin = db.collection('notification').doc();    
    var newDocRepRef = db.collection('notification').doc(newDocRep.id);
    var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);    
    batch.set(newDocRepRef, dataRep);   
    batch.set(newDocAdminpRef, dataAdmin);     
    batch.commit();

    return response.send({
      statusCode: 200,
    });
  
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.declineAssignAsking = functions.https.onRequest( async (request, response) => {
  const notificationId = request.body.notificationid;
  const receiverId = request.body.repid;
  const adminId = request.body.userid;  
  
  try {
    await db
    .collection('notification')
    .doc(notificationId)
    .update({'type': "declinedAsking"})
    .then(() => {
      console.log("Upated notification type successfully!")

      const messageRep = 'Admin has declined your asking to assign someone on a chat support.'; 
      const dataRep = {          
        title: 'Decline Assigned Colleague Request',
        type: 'declinedAsking',
        message: messageRep,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [receiverId],
      };

      const batch = db.batch();
      var newDocRep = db.collection('notification').doc();
      var newDocRepRef = db.collection('notification').doc(newDocRep.id);
      batch.set(newDocRepRef, dataRep);
      batch.commit();

      return response.send({
        statusCode: 200,
      }); 
    });

  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.assignColleagueSupport = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const secReceiverId = request.body.receiverid;
  const adminId = request.body.adminid;
  const notificationId = request.body.notificationid;
  
  try {  
    await db
    .collection('notification')
    .doc(notificationId)
    .update({'type': "askedAdmin"})
    .then(() => {
      console.log("Updated type successfully!")
    });

    const secReceiverDoc = await db
    .collection('users')
    .doc(secReceiverId)    
    .get();
    const secReceiverName = secReceiverDoc.data().firstname + " " + secReceiverDoc.data().lastname;

    const requestDoc = await db
    .collection('request')
    .doc(requestId)    
    .get();

    var senderName = ""     
    var otherReceiverIds = []
    var otherReceivers = []

    if (!requestDoc.empty){
      if (requestDoc.data().otherReceiverIds) {
        otherReceiverIds = requestDoc.data().otherReceiverIds
      }
      if (requestDoc.data().otherReceivers) {
        otherReceivers = requestDoc.data().otherReceivers
      }
      senderName = requestDoc.data().sender.firstname + " " + requestDoc.data().sender.lastname; 
    }

    if (!otherReceiverIds.includes(secReceiverId)){
      otherReceiverIds.push(secReceiverId)
      otherReceivers.push(secReceiverDoc.data())
    }    

    // .update({'status': 'assignColleague', 'otherReceiverIds': otherReceiverIds, 'otherReceivers': otherReceivers})

    await db
    .collection('request')
    .doc(requestId)
    .update({'otherReceiverIds': otherReceiverIds, 'otherReceivers': otherReceivers})
    .then(() => {
      console.log("Requested colleague successfully!")

      const messageSecond = "A support request from " + senderName + " is assigned to you as a colleague.";        
      const dataSecondRep = {          
        title: 'Colleague Assigned',
        type: 'assignColleague',
        message: messageSecond,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [secReceiverId],
        request: requestId,
      };

      const messageAdmin = "You has assigned " + secReceiverName + " on a " + senderName + "'s chat support as colleague.";         
      const dataAdmin = {          
        title: 'Colleague Assigned',
        type: 'assignColleague',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: adminId,
        receivers: [adminId],
        request: requestId,
      };

      const batch = db.batch();
      var newDocSecondRep = db.collection('notification').doc();
      var newDocAdmin = db.collection('notification').doc();
      var newDocSecondRepRef = db.collection('notification').doc(newDocSecondRep.id);
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocSecondRepRef, dataSecondRep);
      batch.set(newDocAdminpRef, dataAdmin);
      batch.commit();

      return response.send({
        statusCode: 200,
      });
    });   
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.declineAssignedColleague = functions.https.onRequest( async (request, response) => {
  const requestId = request.body.requestid;
  const notificationId = request.body.notificationid;
  const reason = request.body.reason;  
  const secReceiverId = request.body.receiverid;
  const adminId = request.body.adminid;  
  
  try {
    const secReceiverDoc = await db
    .collection('users')
    .doc(secReceiverId)    
    .get();
    const secReceiverName = secReceiverDoc.data().firstname + " " + secReceiverDoc.data().lastname;

    await db
    .collection('notification')
    .doc(notificationId)
    .update({'type': "declinedAssignColleague"})
    .then(() => {
      console.log("Upated notification type successfully!")
    });

    const requestDoc = await db
    .collection('request')
    .doc(requestId)    
    .get();
    
    var senderName = ""
    var otherReceiverIds = []
    var otherReceivers = []

    if (!requestDoc.empty){
      if (requestDoc.data().otherReceiverIds) {
        otherReceiverIds = requestDoc.data().otherReceiverIds
      }
      if (requestDoc.data().otherReceivers) {
        otherReceivers = requestDoc.data().otherReceivers
      }
      senderName =  requestDoc.data().sender.firstname + " " + requestDoc.data().sender.lastname;
    }

    if (otherReceiverIds.includes(secReceiverId)) {
      const index = otherReceiverIds.indexOf(secReceiverId)
      otherReceiverIds.splice(index, 1);
      otherReceivers.splice(index, 1);
    }

    // .update({'status': 'declinedAssignColleague', 'otherReceiverIds': otherReceiverIds, 'otherReceivers': otherReceivers})

    await db
    .collection('request')
    .doc(requestId)
    .update({'otherReceiverIds': otherReceiverIds, 'otherReceivers': otherReceivers})
    .then(() => {

      const messageAdmin = secReceiverName + ' declined an assigned request as a colleague with "' + reason + '"'; 
      const dataAdmin = {          
        title: 'Decline Assigned Colleague Request',
        type: 'assignColleagueDeclined',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: secReceiverId,
        receivers: [adminId],
        request: requestId,
      };

      const batch = db.batch();
      var newDocAdmin = db.collection('notification').doc();
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      batch.set(newDocAdminpRef, dataAdmin);
      batch.commit();

      return response.send({
        statusCode: 200,
      });  
    });      
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.addSurveyAnswer = functions.https.onRequest( async (request, response) => {
  const surveyId = request.body.surveyid;
  const receiverId = request.body.userid;
  const notificationId = request.body.notificationid;
  const answers = request.body.answers;  
  
  try {
    const batch = db.batch();

    const notificationSnapshot = await db
    .collection('notification')
    .doc(notificationId)
    .get();

    var receivers = notificationSnapshot.data().receivers
    if (receivers.includes(receiverId)) {
      const index = receivers.indexOf(receiverId)
      receivers.splice(index, 1);
    }
    batch.update(notificationSnapshot.ref, {"receivers": receivers}) 


    const surveySnapshot = await db
    .collection('survey')
    .doc(surveyId)
    .get();

    const submissions = surveySnapshot.data().submissions + 1;
    batch.update(surveySnapshot.ref, {"submissions": submissions})

    const answerDoc = {
      userID: receiverId,
      answers: answers,           
      date: new Date().getTime()
    }

    batch.set(db.collection('survey').doc(surveyId).collection('answers').doc(receiverId), answerDoc)

    batch.commit();

    return response.send({
      statusCode: 200,
    });
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getRepProfile = functions.https.onRequest( async (request, response) => {
  const receiverId = request.body.userid;

  var promises = [];
  var notifications = [];
  var targets = [];
  var rating = [];

  var requests = [];
  var scRequests = [];
  var activeSessions = [];

  var unavailables = [];

  try {
    const receiverDoc = await db
    .collection('users')
    .doc(receiverId)    
    .get();
    
    await db
    .collection('rating')
    .doc(receiverId)
    .get()
    .then(ratingSnapshot => {
      if (ratingSnapshot.exists) {        
        rating = ratingSnapshot.data().rating
      }
    })

    await db
    .collection('unavailablility')
    .doc(receiverId)
    .get()
    .then(unavailableSnapshot => {
      if (unavailableSnapshot.exists) {        
        unavailables = unavailableSnapshot.data().unavailabilities
      }
    })

    const snapshot = await db
    .collection('notification')
    .where('receivers', 'array-contains', receiverId)
    .orderBy('time', 'desc')
    .limit(100)
    .get();

    if (!snapshot.empty) {
      snapshot.forEach(notification => {
        notifications.push({...notification.data(), notificationId: notification.id });
        promises.push(db.collection('users').doc(notification.data().sender).get())
      });
  
      var users = await Promise.all(promises);

      notifications.forEach(notification => {
        var tmpusers = users.filter(item => item.data().userid === notification.sender);
  
        if (tmpusers.length > 0){
          targets.push({notification: notification, sender: tmpusers[0].data(), request: null});   
        }      
      });
    }

    const requestSnapshot = await db
    .collection('request')
    .where('receiverId', '==', receiverId)
    .orderBy('scheduleTime', 'desc')
    .get();

    if (!requestSnapshot.empty) {
      requestSnapshot.forEach(request => {
        if ( request.data().status != 'cancelled' )  {
          requests.push({...request.data()});
        }
      });

      let today = new Date()

      requests.forEach(request => {   
        if ((request.status == 'scheduled') && (request.isSchedule == true) && (request.scheduleTime > today.getTime())) { 
          scRequests.push(request);
        } else if (request.status == 'completed') { 
        } else { 
          activeSessions.push(request);
        }
      });
    }

    return response.send({
      statusCode: 200,
      rep: receiverDoc.data(),
      notifications: targets,
      scheduled: scRequests,
      active: activeSessions,
      ratings: rating,
      unavailable: unavailables
    });
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.removeRep = functions.https.onRequest( async (request, response) => {
  const repId = request.body.userid;
 
  try {
    await db
    .collection('users')
    .doc(repId)
    .update({'isAccept': 'deleted'})
    .then(() => {
      console.log("Updated user's isAccept!")
    });    

    admin.auth()
    .deleteUser(repId)
    .then(() => {
      console.log('Successfully deleted user');
      return response.send({
        statusCode: 200,
      });  
    });    
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.writeUnavailability = functions.https.onRequest( async (request, response) => {
  const receiverId = request.body.userid;
  const startTime = request.body.startTime;
  const duration = request.body.duration;
  const title = request.body.title;
  const type = request.body.type;

  try {
    const unavailablilityDoc = await db
    .collection('unavailablility')
    .doc(receiverId)    
    .get();
    
    var receiverUnavailabilities = []
    if (unavailablilityDoc.exists){
      if (unavailablilityDoc.data().unavailabilities){
        receiverUnavailabilities = unavailablilityDoc.data().unavailabilities;        
      }

      if (type == 'create'){
        receiverUnavailabilities.push({'startTime': startTime, 'title': title, 'duration': duration, 'time': new Date().getTime()}) 
      } else {

        if (receiverUnavailabilities.length > 0) {
          const firstIndex = receiverUnavailabilities.findIndex( (element) => element.startTime === startTime);
          var tmpObject = receiverUnavailabilities[firstIndex]
          tmpObject.title = title

          receiverUnavailabilities.splice(firstIndex, 1);
          if (type == 'edit'){
            receiverUnavailabilities.splice(firstIndex, 0, tmpObject)
          } 
        }       
      }
          
      await db
      .collection('unavailablility')
      .doc(receiverId)
      .update({'unavailabilities': receiverUnavailabilities})
      .then(() => {
        return response.send({
          statusCode: 200,
        });
      });      
    } else {
      if (type == 'create'){
        receiverUnavailabilities.push({'startTime': startTime, 'title': title, 'duration': duration, 'time': new Date().getTime()})
      } 

      await db
      .collection('unavailablility')
      .doc(receiverId)
      .set({'unavailabilities': receiverUnavailabilities})
      .then(() => {
        return response.send({
          statusCode: 200,
        });
      });      
    }
  } catch (err) {
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.changePassword = functions.https.onRequest( async (request, response) => {
  const userEmail = request.body.useremail;
  const password = request.body.password;

  try {
    const snapshot = await db
    .collection('users')
    .where('email', '==', userEmail)
    .get();   
    
    if (snapshot.empty) {
      return response.send({
        statusCode: 404,
        error: 'Your eamil does not exist. Please try again.',
      });
    } else {
      const userId = snapshot.docs[0].id;

      admin
      .auth()
      .updateUser(userId, {
        password: password,
      })
      .then((userRecord) => {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log('Successfully updated user', userRecord.toJSON());

        db
        .collection('users')
        .doc(userId)
        .update({'password': password})
        .then(() => {
          console.log("Updated user's password!")

          return response.send({
            statusCode: 200,
          });
        });          
      })
      .catch((error) => {
        console.log('Error updating user:', error);
        return response.send({
          statusCode: 404,
          error: error,
        });
      });
    }
  } catch (err) {
    console.log("changePassword, ", err)
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.disableAccount = functions.https.onRequest( async (request, response) => {
  const userId = request.body.userID;

  try {
    admin
    .auth()
    .updateUser(userId, {
      disabled: true,
    })
    .then((userRecord) => {
      console.log('Successfully updated user');

      db
      .collection('users')
      .doc(userId)
      .update({
        'online': false
      })
      .then(() => {
        return response.send({
          statusCode: 200,
        });
      });          
    })
    .catch((error) => {
      console.log('Error updating user:', error);

      return response.send({
        statusCode: 404,
        error: error,
      });

    });
  } catch (err) {
    console.log("disableAccount, ", err)

    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.sendReminder = functions.pubsub.schedule('every 15 minutes').onRun( async(context) => {

  try {
    let currentMiliSeconds = new Date().getTime();
    let limitMiliSeconds = currentMiliSeconds + 900 * 1000

    const adminSnapshot = await db
    .collection('users')
    .where('type', '==', 'admin')
    .get();
    const adminId = adminSnapshot.docs[0].id;

    const snapshot = await db
    .collection('request')
    .where('scheduleTime', '>', currentMiliSeconds)
    .where('scheduleTime', '<=', limitMiliSeconds)
    .get();   

    if (!snapshot.empty) {
      const batch = db.batch();

      snapshot.forEach(request => {
        if ( (request.data().status === 'scheduled') && (request.data().isSchedule === true) ){    
          const tmpRequest = request.data()

          const senderName = tmpRequest.sender.firstname + ' ' + tmpRequest.sender.lastname
          const receiverName = tmpRequest.receiver.firstname + ' ' + tmpRequest.receiver.lastname

          const senderEmail = tmpRequest.sender.email
          const receiverEmail = tmpRequest.receiver.email

          const minOffset = momentT.tz(tmpRequest.scheduleTimeZone.tzCode).utcOffset();
          const strSchedule = moment(tmpRequest.scheduleTime + minOffset * 60 * 1000).utc().format('h:mm A on MMM D')
          
          const senderMessage = "A scheduled support with " + receiverName + " at " + strSchedule + " is coming up."   
          const repMessage = "A scheduled support with " + senderName + " at " + strSchedule + " is coming up."   

          let transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com",
            port: 587,
            secure: false,
            tls: {
              ciphers:'SSLv3'
            },
            auth: {
              user: "melisasupport@echosimulation.com",
              pass: "3cho2@18",
            },      
          });

          transporter.sendMail({	
            to: senderEmail,
            from: '"MeLiSA Support" <melisasupport@echosimulation.com>',
            subject: 'MeLiSA Reminder',
            text: senderMessage,
          });
          
          transporter.sendMail({	
            to: receiverEmail,
            from: '"MeLiSA Support" <melisasupport@echosimulation.com>',
            subject: 'MeLiSA Reminder',
            text: repMessage,
          });
          
          console.log("Emails sent");

          const dataSender = {          
            title: 'MeLiSA Reminder',
            type: 'reminder',
            message: senderMessage,
            time: new Date().getTime(),
            sender: adminId,
            receivers: [tmpRequest.sender.userid],
            request: tmpRequest.requestid,
          };

          const dataRep = {          
            title: 'MeLiSA Reminder',
            type: 'reminder',
            message: repMessage,
            time: new Date().getTime(),
            sender: adminId,
            receivers: [tmpRequest.receiver.userid],
            request: tmpRequest.requestid,
          };
            
          var newDocSender = db.collection('notification').doc();
          var newDocRep = db.collection('notification').doc();
          var newDocSenderRef = db.collection('notification').doc(newDocSender.id);
          var newDocRepRef = db.collection('notification').doc(newDocRep.id);

          batch.set(newDocSenderRef, dataSender);
          batch.set(newDocRepRef, dataRep);              
        } 
      });

      batch.commit();
      console.log('Committed Notifications')

      // return response.send({
      //   statusCode: 200,
      // });
      return null;
    } else {
      console.log("No Documents")
      // return response.send({
      //   statusCode: 200,
      // });
      return null;
    }
    
  } catch (err) {
    // return response.send({
    //   statusCode: 404,
    // });
    return null;
  }
});

exports.getFacilities = functions.https.onRequest( async (request, response) => {
  const userID = request.body.userid;

  try {
    const userDoc = await db
    .collection('users')
    .doc(userID)    
    .get();
    const facilityIds = userDoc.data().facility
    
    var requestFacilityIds = []
    if (userDoc.data().requestFacility) {
      requestFacilityIds= userDoc.data().requestFacility
    }

    const facilitySnapShot = await db
    .collection('facility')
    .get();
    const facilities = facilitySnapShot.docs.map(doc => doc.data());

    var currentFacilities = []
    var requestFacilities = []
    facilityIds.map(item =>  
      currentFacilities.push({'facility': facilities.filter(element => element.facilityid === item.facility)[0], 'branch': item.branch})
    )
    requestFacilityIds.map(item =>  
      requestFacilities.push({'facility': facilities.filter(element => element.facilityid === item.facility)[0], 'branch': item.branch})
    )

    currentFacilities.sort(function(first, second)  {
      const fTitle = first.facility.title.toUpperCase()
      const sTitle = second.facility.title.toUpperCase()
      if (fTitle < sTitle) {
        return -1;
      }
      if (fTitle > sTitle) {
        return 1;
      }
      return 0;
    })

    requestFacilities.sort(function(first, second)  {
      const fTitle = first.facility.title.toUpperCase()
      const sTitle = second.facility.title.toUpperCase()
      if (fTitle < sTitle) {
        return -1;
      }
      if (fTitle > sTitle) {
        return 1;
      }
      return 0;
    })

    return response.send({
      statusCode: 200,
      facilityIds: facilityIds,
      facilities: currentFacilities,
      requestFacilities: requestFacilities
    });      
  } catch (err) {
    console.log("getFacilities Error", err)
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.getFacilitiesRep = functions.https.onRequest( async (request, response) => {
  const userID = request.body.userid;

  try {
    const customersSnapshot = await db
    .collection('users')
    .where('type', '==', 'customer')
    .get();
    const customers = customersSnapshot.docs.map(doc => doc.data());  
   
    const facilitySnapShot = await db
    .collection('facility')
    .get();
    var facilities = facilitySnapShot.docs.map(doc => doc.data());

    facilities.sort(function(first, second)  {
      const fTitle = first.title.toUpperCase()
      const sTitle = second.title.toUpperCase()
      if (fTitle < sTitle) {
        return -1;
      }
      if (fTitle > sTitle) {
        return 1;
      }
      return 0;
    })

    facilities.forEach((facility, facIndex) => {
      const tmpFacilityID = facility.facilityid
      var tmpCustomers = []  

      customers.forEach((user, userIndex) => {
        if (user.facility && user.facility.length > 0 && user.facility[0].facility ){
         
          var includeFlag = false
          user.facility.forEach(item => {
            if (tmpFacilityID === item.facility){
              includeFlag = true
            }            
          })

          if (includeFlag) {
            tmpCustomers.push(user)
          }
        }
      })

      facilities.splice(facIndex, 1)
      facilities.splice(facIndex, 0, {...facility, employees: tmpCustomers})
    });

    return response.send({
      statusCode: 200,
      facilities: facilities,
    });      
  } catch (err) {
    console.log("getFacilitiesRep", err)
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.requestFacility = functions.https.onRequest( async (request, response) => {
  const userID = request.body.userid;  
  const requestFacilities = request.body.requestFacility;
  const messageToAdmin =  request.body.message

  try {
    const senderDoc = await db
    .collection('users')
    .doc(userID)    
    .get();
    const senderName = senderDoc.data().firstname + " " + senderDoc.data().lastname;

    const adminSnapshot = await db
    .collection('users')
    .where('type', '==', 'admin')
    .get();
    const adminId = adminSnapshot.docs[0].id

    const facilitySnapShot = await db
    .collection('facility')
    .get();
    const facilities = facilitySnapShot.docs.map(doc => doc.data());
    
    var faciltiesName = ''
    requestFacilities.map((facilityData, index) =>  {
      const tmpFaciltiyName = facilities.filter(element => element.facilityid === facilityData.facility)[0].title
      faciltiesName = tmpFaciltiyName + ' / ' +  facilityData.branch
    }) 

    let requestFacility = senderDoc.data().requestFacility ? senderDoc.data().requestFacility : []
    let arr = requestFacility.concat(requestFacilities)
    let uniqueArr = [];
    for(let i of arr) {
      if(uniqueArr.indexOf(i) === -1) {
        uniqueArr.push(i);
      }
    }

    db
    .collection('users')
    .doc(userID)
    .update({'requestFacility': uniqueArr})
    .then(() => {
      console.log("Updated user's requestFacilities!")

      const messageAdmin = senderName + ' has requested access for facility - '  + faciltiesName + '.';         
      const dataAdmin = {          
        title: 'Asking access to Facility',
        type: 'askedFacility',
        message: messageAdmin,
        time: new Date().getTime(),
        sender: userID,
        receivers: [adminId],
        messageToAdmin: messageToAdmin
      };

      const batch = db.batch();
      // var newDocSecondRep = db.collection('notification').doc();
      var newDocAdmin = db.collection('notification').doc();
      // var newDocSecondRepRef = db.collection('notification').doc(newDocSecondRep.id);
      var newDocAdminpRef = db.collection('notification').doc(newDocAdmin.id);
      // batch.set(newDocSecondRepRef, dataSecondRep);
      batch.set(newDocAdminpRef, dataAdmin);
      batch.commit();

      return response.send({
        statusCode: 200,
      });
    });   
  } catch (err) {
    console.log("requestFacility", err)
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.allowAskingFacility = functions.https.onRequest( async (request, response) => {
  const notificationId = request.body.notificationid;
  const customerId = request.body.customerid;
  const adminId = request.body.userid;
  const facilityName =  request.body.facilityname;
  
  try {
    const senderDoc = await db
    .collection('users')
    .doc(customerId)    
    .get();
    var facility = senderDoc.data().facility
    var requestFacility = senderDoc.data().requestFacility
    const facilityData = requestFacility[requestFacility.length - 1]
    facility.push(facilityData)
    requestFacility.splice(requestFacility.length - 1, 1)
    
    await db
    .collection('notification')
    .doc(notificationId)
    .update({'type': "allowedFacility"})    
    .then(() => {
      console.log("Upated notification type successfully!")

      db
      .collection('users')
      .doc(customerId)
      .update({'facility': facility, 'requestFacility': requestFacility})
      .then(() => {       

        const messageCustomer = 'Accesss to facility ' + facilityName + ' is allowed by the admin.'; 
        const dataCustomer = {          
          title: 'Allow access to facility',
          type: 'allowedFacility',
          message: messageCustomer,
          time: new Date().getTime(),
          sender: adminId,
          receivers: [customerId],
        };

        const batch = db.batch();
        var newDocCustomer = db.collection('notification').doc();
        var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
        batch.set(newDocCustomerRef, dataCustomer);
        batch.commit();

        return response.send({
          statusCode: 200,
        }); 
      });
    })
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.declineAskingFacility = functions.https.onRequest( async (request, response) => {
  const notificationId = request.body.notificationid;
  const customerId = request.body.customerid;
  const adminId = request.body.userid;
  const facilityName =  request.body.facilityName;
  
  try {
    await db
    .collection('users')
    .doc(customerId)
    .update({'requestFacility': []})
    .then(() => {
      db
      .collection('notification')
      .doc(notificationId)
      .update({'type': "declinedFacility"})
      .then(() => {

        console.log("Upated notification type successfully!")

        const messageCustomer = 'Accesss to facility ' + facilityName + ' is declined by the admin.'; 
        const dataCustomer = {          
          title: 'Decline access to facility',
          type: 'declinedFacility',
          message: messageCustomer,
          time: new Date().getTime(),
          sender: adminId,
          receivers: [customerId],
        };

        const batch = db.batch();
        var newDocCustomer = db.collection('notification').doc();
        var newDocCustomerRef = db.collection('notification').doc(newDocCustomer.id);
        batch.set(newDocCustomerRef, dataCustomer);
        batch.commit();

        return response.send({
          statusCode: 200,
        }); 
      });
    })
  } catch (err) {    
    return response.send({
      statusCode: 404,
      error: err,
    });
  }
});

exports.sendEmail = functions.https.onRequest( async (request, response) => {  
  const receiverEmail = request.body.email;
  const code = request.body.code;
  const isVerify = request.body.isverify;

  try {

    let transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
      tls: {
        ciphers:'SSLv3'
      },
      auth: {
        user: "melisasupport@echosimulation.com",
        pass: "3cho2@18",
      },      
    });

    if (isVerify === 'verification') {

      transporter.sendMail({	
        to: receiverEmail,
        from: '"MeLiSA Support" <melisasupport@echosimulation.com>',
        subject: 'MeLiSA Authentication',
        html: '<h1>Verification Code</h1><p>' + code + '</p>'
      }, function(error, info){
        if(error){
          return console.log(error);
        }

        console.log('Message sent: ' + info.response);
        return response.send({
          statusCode: 200,
        });        
      });

    } else if  (isVerify === 'pendingAccount') {

      transporter.sendMail({
        to: receiverEmail,
        from: '"MeLiSA Support" <melisasupport@echosimulation.com>',
        subject: 'MeLiSA Pending Verification',
        html: '<h1>Company Representative Profile Appoving Request</h1><p>' + code + '</p>'
      }, function(error, info){
        if(error){
          return console.log(error);
        }

        console.log('Message sent: ' + info.response);
        return response.send({
          statusCode: 200,
        });        
      });
      
    } else {

      transporter.sendMail({
        to: receiverEmail,
        from: '"MeLiSA Support" <melisasupport@echosimulation.com>',
        subject: 'MeLiSA Facility',
        html: '<h1>Facility Code</h1><p>' + code + '</p>'
      }, function(error, info){
        if(error){
          return console.log(error);
        }

        console.log('Message sent: ' + info.response);
        return response.send({
          statusCode: 200,
        });        
      });

    }    
  } catch (err) {
    return response.send({
      statusCode: 404,
    });
  }
});

exports.sendReconnectNotification = functions.https.onRequest( async (request, response) => {
  const reConnectrequest = request.body.request;
  const isSender = request.body.issender;

  const sender = isSender ? reConnectrequest.sender : reConnectrequest.receiver
  const receiver = isSender ? reConnectrequest.receiver : reConnectrequest.sender
  const senderName = sender.firstname + ' ' + sender.lastname

  const title = 'Recall';
  const type = 'reconnectedCall';
  const message = senderName + ' has reconnected call.';

  const payload = {
    "notification": {
      "title": title,
      "body": message,
      "sound": "default",
    },
    "data": {
      "type": type,
      "request" : reConnectrequest.requestid
    },
  };

  const options = {
    priority: "high",
    mutableContent: true,
    contentAvailable: true,
  };

  if (receiver.token) {
    console.log("notificiton sending")
    return admin.messaging().sendToDevice(receiver.token, payload);
  } else{
    return response.send({
      statusCode: 404,
    });
  }
});
