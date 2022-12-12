import storage from '@react-native-firebase/storage';

const USER_STOREAGE = {

    uploadProfileImage: async (ref, url, userAction) => {
        console.log(ref);
        console.log(url);
        
        storage()
        .ref(ref)
        .putFile(url)
        .then(() => {    
            console.log(`${ref} has been successfully uploaded.`);
            userAction();
        })
        .catch((e) => console.log('uploading image error => ', e));
    },

    downloadImage: async (ref) => {
        console.log(ref)

        const reference = storage().ref(ref);
        const url = await reference.getDownloadURL();
        return url;
    },
};

export default USER_STOREAGE;