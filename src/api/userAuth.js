import { Alert } from "react-native";
import auth, {firebase} from "@react-native-firebase/auth"
import USER_DB from './userDB'
import QB from 'quickblox-react-native-sdk'

const EMAIL_AUTH = {

  listenForLogin: onUserLoggedIn => {
    const subscriber = auth().onAuthStateChanged(async user => {
      if (user) {
        onUserLoggedIn();
      }
    });
    return subscriber;
  },

  onCreateUser: async (email, password, firstName, lastName, token, userAction, userFail) => {
    firebase
    .auth()
    .createUserWithEmailAndPassword(email, password).then((res) => {
      const userID = res.user.uid

      QB.users
      .create({
        fullName: firstName + " " + lastName,
        email: email,
        login: email,
        password: 'quickblox'
      })
      .then((info) => {
        console.log('Registered on QuickBlox successfuly')
        console.log('QB Registered User =', info)
        const idQB = info.id      

        USER_DB.addUser(userID, email, password, firstName, lastName, token, idQB, userAction)
      })
      .catch((e) => {
        console.log('QB Register Error =', e)
        userFail()
      }); 
    })
    .catch((err) => {
      userFail()
      EMAIL_AUTH.onAuthError(err)
    })

  },

  onUserLogin: async (email, password, userAction) => {    
    await
    auth()
    .signInWithEmailAndPassword(email, password).then((res) => {
      console.log("Login on Firebase")
      userAction()  
    })
    .catch((err) => {
      EMAIL_AUTH.onAuthError(err)
    })
  },

  onPressLogin: async (email, password, token, userAction, userFake, userFail) => {
    await auth()
    .signInWithEmailAndPassword(email, password).then((res) => {6030
      const userID = res.user.uid;
      USER_DB.updateUser( userID, {'token': token})
      USER_DB.isRepProfile(userID, userAction, userFake);
    })
    .catch((err) => {
      userFail()
      EMAIL_AUTH.onAuthError(err)
    })
  },

  onPressLoginAdmin: async (email, password, token, userAction, userFake, userFail) => {
    await auth()
    .signInWithEmailAndPassword(email, password).then((res) => {
      console.log("Login on Firebase")
      const userID = res.user.uid;
      USER_DB.updateUser( userID, {'token': token})
      USER_DB.isAdminProfile(userID, userAction, userFake);
    })
    .catch((err) => {
      userFail()
      EMAIL_AUTH.onAuthError(err)
    })
  },

  onSendPasswordReset: (email, onEmailSent) => {
    auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        Alert.alert(
          "Email Sent",
          `A password reset email has been sent to ${email}`,
          [
            {
              text: "Ok",
              onPress: () => {
                onEmailSent();
              },
            },
          ],
          { cancelable: false }
        );
      })
      .catch(EMAIL_AUTH.onAuthError);
  },

  onChangePassword: async (password, userAction, userFail) => {

    var user = auth().currentUser;
    user.updatePassword(password).then( () => {
      console.log("Changed Password!")

      USER_DB.updateProfile({password: password}, userAction)
    })
    .catch((err) => {
      userFail()
      EMAIL_AUTH.onAuthError(err)
    })
    
  },

  onPressLogOut: async(onLogoutSuccess) => {
    QB.auth
    .logout()
    .then(() => {
      // signed out successfully
      console.log("Log out from QB.");
      
      auth()
      .signOut()
      .then(async () => {
        console.log("Log out from Firebase.");
        onLogoutSuccess()
      })
      .catch(EMAIL_AUTH.onAuthError);
    })
    .catch((e) => {
      console.log(e)
    });
  },

  onAuthError: err => {
    console.log('err.message', err.message);
    if (err.code) {
      if (err.code === "auth/user-not-found") {
        Alert.alert(
          "Incorrect Email",
          "Your email is incorrect. Please try again."
        );
      } else if (err.code === "auth/wrong-password") {
        Alert.alert(
          "Incorrect Password",
          "Your password is incorrect. Please try again."
        );
      } else if (err.code === "auth/user-disabled") {
        Alert.alert(
          "Account Disabled",
          `Your account has been disabled. Please contact an Administrator if you would like access to your account.`
        );
      } else if (err.code === "auth/email-already-in-use") {
        console.log('err', err);
        Alert.alert(
          "Email Already in Use",
          `There already exists an account with that email. Perhaps you wanted to login?`
        );
      } else if (err.code === "auth/invalid-credential") {
        Alert.alert("Invalid Credential", `There was an error logging you in`);
      } else {
        Alert.alert(
          "We encountered an error",
          `${err.message} Please try again.`
        );
      }
    } else {
      Alert.alert(
        "We encountered an error",
        `${err.message} Please try again.`
      );
    }
  },
  
};

export default EMAIL_AUTH;