// import RNSmtpMailer from "react-native-smtp-mailer";
import { Alert } from 'react-native'

const OTPSender = {
    sendEmail: async( email, code, isVerify, userAction, userActionFailed) => {
        // RNSmtpMailer.sendMail({
        //     mailhost: "smtp.gmail.com",
        //     port: "465",
        //     ssl: true, 
        //     username: "smarteye0701@gmail.com",
        //     password: "mqfwvxmzrzgtscbl",
        //     fromName: "MeLiSA Support",
        //     replyTo: "",
        //     recipients: email,
        //     subject: "MeLiSA Authentication",
        //     htmlBody: '<h1>Verification Code</h1><p>' + code + '</p>',
        //     attachmentPaths: [
        //     //   RNFS.ExternalDirectoryPath + "/image.jpg",
        //     //   RNFS.DocumentDirectoryPath + "/test.txt",
        //     //   RNFS.DocumentDirectoryPath + "/test2.csv",
        //     //   RNFS.DocumentDirectoryPath + "/pdfFile.pdf",
        //     //   RNFS.DocumentDirectoryPath + "/zipFile.zip",
        //     //   RNFS.DocumentDirectoryPath + "/image.png"
        //     ], // optional
        //     attachmentNames: [
        //     //   "image.jpg",
        //     //   "firstFile.txt",
        //     //   "secondFile.csv",
        //     //   "pdfFile.pdf",
        //     //   "zipExample.zip",
        //     //   "pngImage.png"
        //     ], // required in android, these are renames of original files. in ios filenames will be same as specified in path. In a ios-only application, no need to define it
        // })
        // .then(success => {
        //     console.log("Sent code =", code)
        // })
        // .catch(err => {
        //     console.log(err)
        //     console.log("Sending Failed");
        // });   

        console.log("Code is", code)
        
        fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/sendEmail', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            code: code,
            isverify: isVerify
        }),
        })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.statusCode !== 200) {
                userActionFailed();
                return;
            }

            userAction();   
        })
        .catch((err) => {
            userActionFailed();
            Alert.alert('Network Error', 'Please check your network connection and try again.')
        });
    },    
};

export default OTPSender;