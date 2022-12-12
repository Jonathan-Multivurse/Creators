import React from 'react'
import {
  ActionSheetIOS,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
// import DocumentPicker from 'react-native-document-picker'
// import ImagePicker from 'react-native-image-picker'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export default class AttachButton extends React.PureComponent {

  attachmentType = {
    PHOTO: 'Select Photo',
    VIDEO: 'Select Video',
    // FILE: 'Select file',
    CAMERA_PHOTO: 'Take Photo using camera',
    CAMERA_VIDEO: 'Take Video using camera',
    CANCEL: 'Cancel',
  }

  handleMenuPress = e => {
    if (this.props.onPress) {
      const proceed = this.props.onPress()
      if (!proceed) {
        return
      }
    }
    const options = Object
      .keys(this.attachmentType)
      .map(key => this.attachmentType[key])

    ActionSheetIOS.showActionSheetWithOptions({
      cancelButtonIndex: options.indexOf(this.attachmentType.CANCEL),
      options,
      title: 'Select attachment type'
    }, this.onMenuItemPress)
  }

  onMenuItemPress = index => {
    const key = Object.keys(this.attachmentType)[index]
    const type = this.attachmentType[key]
    const { onAttachment } = this.props
    const cameraOptions = {
      durationLimit: 60,
      noData: true,
      storageOptions: { skipBackup: true },
      maxWidth: 500,
      maxHeight: 500, 
      videoQuality: 'low' 
    }
    // const documentPickCancel = err => {
    //   if (onAttachment && typeof onAttachment === 'function') {
    //     if (DocumentPicker.isCancel(err)) {
    //       onAttachment({ didCancel: true })
    //     } else {
    //       onAttachment({ error: err && err.message ? err.message : err })
    //     }
    //   }
    // }
    switch (type) {
      case this.attachmentType.PHOTO:
        // ImagePicker.launchImageLibrary({
        //   ...cameraOptions,
        //   mediaType: 'photo'
        // }, onAttachment)
        launchImageLibrary({
          ...cameraOptions,
          mediaType: 'photo'
        }, onAttachment)
        break
      /* This functionality is commented and not available
       * on the other platforms at this moment.
       * Thus if you would like to uncomment for usage,
       * be aware of potential samples' malfunctioning */
      case this.attachmentType.VIDEO:
        launchImageLibrary({
          ...cameraOptions,
          mediaType: 'video'
        }, onAttachment)
        break
      // case this.attachmentType.FILE:
      //   DocumentPicker.pick()
      //     .then(onAttachment)
      //     .catch(documentPickCancel)
      //   break
      case this.attachmentType.CAMERA_PHOTO:
        launchCamera({
            ...cameraOptions,
            mediaType: 'photo'
          }, onAttachment)
        break
      case this.attachmentType.CAMERA_VIDEO:
        launchCamera({
          ...cameraOptions,
          mediaType: 'video'
        }, onAttachment)
        break
      default: return
    }
  }

  render() {
    return (
      <TouchableOpacity
        disabled={this.props.disabled}
        onPress={this.handleMenuPress}
        style={styles.attachButton}
      >
        <Image
          source={require('../../../assets/images/message/icon_Add.png')}
          style={styles.attachButtonImage}
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  attachButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 9,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8
  },
  attachButtonImage: {
    height: 45,
    width: 45,
    resizeMode: 'contain',    
  },
})