
import { Plugins } from '@capacitor/core';
import api from '../api/endpoints';
import { isLoggedIn, callUpdateInfo, setSurveySource } from '../utils';

class PushNotificationUtils {

  constructor() {
    this.PushNotifications = Plugins.PushNotifications;
  }

  register = async() => {
      await this.PushNotifications.register();
  }


  requestPermission = async() => {
      const data = await this.PushNotifications.requestPermission();
      if (data && data.granted) {
        await this.register();
      }
  }

  setPushNotificationListeners() {

    // On success, we should be able to receive notifications
    this.PushNotifications.addListener('registration',
      token => {
        // alert('token received ! ' + token.value)
        if (token && token.value) {
          this.onTokenRegistrtnSuccessCb(token.value);
        }
      }
    );

    // Some issue with your setup and push will not work
    this.PushNotifications.addListener('registrationError',
      error => {
        // alert('Error on registration: ' + JSON.stringify(error));
        this.onTokenRegistrtnFailureCb(error);
      }
    );

    // Show us the notification payload if the app is open on our device
    this.PushNotifications.addListener('pushNotificationReceived',
      notification => {
        // alert('pushNotificationReceived notification : ' + notification);
        // console.log('pushNotificationReceived notification : ' + notification);
        // this.onNotiftnTapIfAppOpenCb(notification);
      }
    );

    // Method called when tapping on a notification
    this.PushNotifications.addListener('pushNotificationActionPerformed',
      notification => {
        // alert('pushNotificationActionPerformed notification : ' + notification);
        console.log('pushNotificationActionPerformed notification : ', notification);
        this.onNotiftnTapIfAppClosedCb(notification);
      }
    );
  }

  onTokenRegistrtnSuccessCb = (tokenValue) => {
      console.log('registration success !' + tokenValue);
      if (window.Ionic.platforms[0] !== 'desktop') {
        // alert('registration success !' + tokenValue);
        api.savePushNotificationToken(
          tokenValue,
          window.localStorage.getItem('deviceID'),
          window.Ionic.platforms[0]
        ).then((resp) => {
          // alert('notification saved in DB !');
          console.log('savePushNotificationToken ',resp)
        }).catch((err) => {
          // alert('notification failed in DB !');
        });
      }

  }

  onTokenRegistrtnFailureCb = () => {
    // alert('onTokenRegistrtnFailure');
  }

  onNotiftnTapIfAppOpenCb = (notification) => {
    console.log('onNotiftnTapIfAppOpenCb : ',notification);
    this.onNotificationReceived(notification.data);
  }

  onNotiftnTapIfAppClosedCb =(notification) => {
    // alert('onNotiftnTapIfAppClosedCb');
    console.log('onNotiftnTapIfAppClosedCb : ',notification);
    this.onNotificationReceived(notification.notification.data);
  }

  onNotificationReceived = async (data) => {
    console.log('onNotiftnTapIfAppClosedCb : ',data);
    const loggedIn = isLoggedIn();
    const searchParams = `survey_token=${data.survey_token}&survey_id=${data.sid}&org=${data.org}`;
    const path = loggedIn ? '/user/surveys/' + data.sid + '?' + searchParams : `/login?${searchParams}`;
    let locationHref= `${window.location.origin}${path}`;
    setSurveySource('notification');
    await callUpdateInfo();
    window.location = locationHref;
  }
}

export default new PushNotificationUtils();
