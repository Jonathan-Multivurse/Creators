import auth, {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'

const usersCollection = firestore().collection('users');
const ratingCollection = firestore().collection('rating');

const USER_DB = {
  addUser: async (userID, email, password, firstName, lastName, token, QBId, userAction) => {         
    usersCollection
    .doc(userID)
    .set({
      userid: userID,
      email: email,
      firstname: firstName,
      lastname: lastName,
      password: password,
      type: 'company',
      online: true,
      isAccept: '',
      token: token,
      QBId: QBId,
    })
    .then(() => {
        userAction()
    })
  },

  checkProfile: async (goHome, goSetProfile, goWaiting) => {
    const userID = firebase.auth().currentUser.uid;

    usersCollection
    .doc(userID)
    .get()
    .then(documentSnapshot => {

      if (documentSnapshot.exists) {
        if (documentSnapshot.data()['image'] === '' || documentSnapshot.data()['image'] == null) {            
          goSetProfile()
        } else{
          if (documentSnapshot.data()['isAccept'] === 'accepted') {
            goHome()
          } else{
            goWaiting()
          }            
        }
      }
    });
},
  
  checkAdminProfile: async (goHome, goSetProfile) => {
    const userID = firebase.auth().currentUser.uid;

    usersCollection
    .doc(userID)
    .get()
    .then(documentSnapshot => {

      if (documentSnapshot.exists) {
        if (documentSnapshot.data()['image'] === '' || documentSnapshot.data()['image'] == null) {
          goSetProfile()
        } else{
          goHome()
        }
      }
    });
  },

  isRepProfile: async (userID, success, failed) => {
    usersCollection
    .doc(userID)
    .get()
    .then(documentSnapshot => {
      if (documentSnapshot.exists) {
        if (documentSnapshot.data()['type'] === 'company') {
          success()
        } else{
          failed()
        }
      }
    });
  },

  isAdminProfile: async (userID, success, failed) => {
    usersCollection
    .doc(userID)
    .get()
    .then(documentSnapshot => {
      if (documentSnapshot.exists) {
        if (documentSnapshot.data()['type'] === 'admin') {
          success()
        } else{
          failed(documentSnapshot.data())
        }
      }
    });
  },

  updateProfile: async (values, userAction) => {
    const userID = firebase.auth().currentUser.uid;

    usersCollection
    .doc(userID)
    .update(values)
    .then(() => {
      console.log('User updated!');
      userAction()
    });        
  },

  updateUser: async (docID, values) => {
   
    usersCollection
    .doc(docID)
    .update(values)
    .then(() => {
      console.log('User updated!');
    });        
  },

  updateAUser: async (docID, values, userAction) => {
   
    usersCollection
    .doc(docID)
    .update(values)
    .then(() => {
      console.log('User updated!');
      userAction()
    });        
  },

  updateProfile: async (values, userAction) => {
    const userID = firebase.auth().currentUser.uid;

    usersCollection
    .doc(userID)
    .update(values)
    .then(() => {
      console.log('User updated!');
      if (userAction == null) {
       } else{
        userAction()
      }        
    });        
  },

  getProfile: async (userAction) => {
    const userID = firebase.auth().currentUser.uid;

    usersCollection
      .doc(userID)
      .get()
      .then(documentSnapshot => {

        if (documentSnapshot.exists) {
          userAction(documentSnapshot.data())
        }
    });      
  },

  getRating: async (userAction) => {
    const userID = firebase.auth().currentUser.uid;

    ratingCollection
    .doc(userID)
    .get()
    .then(ratingSnapshot => {

      console.log('Rating exists: ', ratingSnapshot.exists);

      if (ratingSnapshot.exists) {
        userAction(ratingSnapshot.data())
      } else {
        userAction(null)
      }      
    }) 
  },

  getUserRating: async (userId, userAction) => {

    ratingCollection
    .doc(userId)
    .get()
    .then(ratingSnapshot => {

      console.log('Rating exists: ', ratingSnapshot.exists);

      if (ratingSnapshot.exists) {
        userAction(ratingSnapshot.data())
      } else {
        userAction(null)
      }      
    }) 
  },
  
  getUserProfile: async(userID, userAction) => {

    usersCollection
      .doc(userID)
      .get()
      .then(documentSnapshot => {

        if (documentSnapshot.exists) {
          userAction(documentSnapshot.data())
        }
    });  
  },

  getCustomers: async (userAction) => {
    usersCollection
    .where('type', '==', 'customer')
    .get()
    .then(querySnapshot => {
      userAction(querySnapshot.docs.length)
    });      
  },
};

export default USER_DB;