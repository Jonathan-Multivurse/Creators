import firestore from '@react-native-firebase/firestore'
import auth, {firebase} from "@react-native-firebase/auth"

const requestCollection = firestore().collection('request');

const REQUEST_DB = {    

    addRequest: async (type, facility, simulator, time, status, isSchedule, scheduleTime, scheduleTimeZone, description, dialogDic, sender, receiverId, receiver, userAction) => {

        const docid = requestCollection.doc().id

        const doc = {
            requestid: docid,
            facility: facility,
            senderId: sender.userid,
            sender: sender,
            type: type,
            simulator: simulator,
            time: time,
            status: status,            
            isSchedule: isSchedule,
            scheduleTime: scheduleTime,
            scheduleTimeZone: scheduleTimeZone,
            description: description,
            dialog: dialogDic,
            receiver: receiver,
            receiverId: receiverId,
        }
            
        await requestCollection
        .doc(docid)
        .set(doc)
        .then(() => {
            userAction(doc)
        })
    },

    getRequest: async (requestID, userAction) => {
        requestCollection
        .doc(requestID)
        .get()
        .then(documentSnapshot => {
            if (documentSnapshot.exists) {
                userAction(documentSnapshot.data())
            }
        })
    },

    cancelRequest: async (requestID, userAction) => {
        requestCollection
        .doc(requestID)
        .update({
            status: 'cancelled',
        })
        .then(() => {
            userAction()
        })
    },
    
    acceptRequest: async (requestID, userAction) => {
        const receiverID = auth().currentUser.uid;
        console.log(requestID);

        requestCollection
        .doc(requestID)
        .update({
            receiverId: receiverID,
            status: 'accepted'
        })
        .then(() => {
            console.log('Request updated!');
            userAction()
        });        
    },

    completeRequest: async (requestID, userAction) => {
        console.log(requestID);
            
        requestCollection
        .doc(requestID)
        .update({
            status: 'completed',
        })
        .then(() => {
            userAction()
        })
    },
    
};

export default REQUEST_DB;