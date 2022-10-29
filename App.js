import React from 'react';
import NetworkDetector from './networkdetector';
import { Redirect, Route, withRouter, BrowserRouter } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonAlert } from '@ionic/react';
import { createAnimation, setupConfig } from '@ionic/core';
import { IonReactRouter } from '@ionic/react-router';
import ExpertsApp from './pages';
import LocalCache from './api/localCache';
import { login, selector, resetpassword, setpassword, error404 } from './routes/unit';
import {
  isLoggedIn, getReferrer ,isWeb, isMobileApp,
  getRedirectURLOnAppLoad, isSurveyTokenInURL,
  getQueryVariable, getRedirectURLOnAppLoadWeb,
  callUpdateInfo, setSurveySource, isSurveyDetailsPage,
  isSurveyIdInURL, deleteTrackingSurvey, deleteSurveySource,
  getSurveySource, isPrevTrackingExists, isCurntTrackingExists,
  hasOnlyDashboardAccess
} from './utils';
import { isAccessHope } from './referrers';
import globalVars from './globalVars';
import getConfig from './api/config';
import { setAvatarStyles } from './styles/avatars';
import { Plugins, AppState, AppUrlOpen } from '@capacitor/core';
import NotificationObj from './common/notifications';
import api from './api/endpoints';
import AnalyticsTracker, {
  TRACK_START, TRACK_END, SURVEY_DETAILS_TRACKER,
  SURVEY_COMMENTS_TRACKER, SURVEY_ATTACHMENT_TRACKER,
  SurveyCommentsTracker, SurveyDetailsTracker, SurveyAttachmentTracker
} from './common/analytics';
import ErrorBoundary from './common/errorboundary';

class ExpertApp extends React.PureComponent {

  constructor (props) {
    super(props);
    this.surveyPat = /(\/user\/surveys\/)\d+/i;
    this.state = {
      redirectURL: getRedirectURLOnAppLoad(),
      showAlert: false
    };
    this.oneMinuteInMilliSecs = 60 * 1000;
    this.deviceInfo = {};
    this.saveDraft = null;

    setupConfig({
      mode: 'ios',
      navAnimation: async () => {
        return createAnimation();
      }
    });

    const { App, Network } = Plugins;
    this.App = App;
    this.Network = Network;
  }

  setAppListenerFunctions = () => {

    this.App.addListener('backButton', this.appBackButtonCb);
    this.App.addListener('appUrlOpen', this.appUrlOpenCb);
    this.App.addListener('appStateChange', this.appStateChange);
    window.addEventListener('customLoad', this.windowLoadListener);

    if(isWeb()) {
      // These events are required to trigger survey analytics api call when browser window goes to bachgroun or comes to foreground.
      window.addEventListener('blur', this.windowBlur);
      window.addEventListener('focus', this.windowFocus);
      // When the browser window closes, fire analytics call if survey details page is opened.
      window.addEventListener('beforeunload', this.windowUnload);
    }
  }

  windowUnload = () => {
    // console.log('------windowUnload------');
    // this.analyticsTracker(false);
  }

  windowBlur = () => {
    // console.log('------window blur------');
    // this.analyticsTracker(false);
  }

  windowFocus = () => {
    // console.log('------window focus------');
    // this.analyticsTracker(true);
  }

  getBaseAuth = async (appURL) => {
    const access_token = localStorage.getItem('token') || null;
    const survey_expert_token = getQueryVariable('survey_token');
    const values = { survey_expert_token, access_token };
    const baseauth_data = await api.baseauth(values);
    return baseauth_data;
  }

  loginPageWithSurveyToken = () => {
    const uriLocationSearch = globalVars.getURILocationSearch();
    console.log('uriLocationSearch : ',uriLocationSearch);
    let redirectURL = `${window.location.origin}`;
    redirectURL += `?${uriLocationSearch}`;
    console.log('redirectURL : ',redirectURL);
    return redirectURL;
  }

  redirectSurveyURL = async (appURL) => {

    console.log('redirectSurveyURL - ' + appURL + " -- " + this.networkStatus);

    if (appURL && this.networkStatus) {
        globalVars.setURILocationSearch(appURL.substring(appURL.indexOf('?') + 1, appURL.length));
        let redirectURL = null ;

        if(appURL.indexOf('/resetpassword') > -1) {
          window.location = '/resetpassword?' + globalVars.getURILocationSearch();
          return;
        } else if(appURL.indexOf('/setpassword') > -1) {
          window.location = '/setpassword?' + globalVars.getURILocationSearch();
          return;
        }

        this.redirectPath = getRedirectURLOnAppLoad();
        redirectURL = `${window.location.origin}${this.redirectPath}`;
        // if (isLoggedIn()) {
        //   redirectURL = `${window.location.origin}${this.redirectPath}`;
        // } else {
        //   redirectURL = this.loginPageWithSurveyToken();
        // }
        setSurveySource('email');
        window.location = redirectURL;
    }
  }

  windowLoadListener = async () => {
    if (+sessionStorage.getItem('force_update')) {
      sessionStorage.setItem('force_update_zombied', 1);
      sessionStorage.removeItem('force_update');
      this.setShowAlert(true);
    }
  }

  setShowAlert = (param) => {
    this.setState({
      showAlert: param
    })
  }

  appUrlOpenCb = async AppUrlOpen => {

    const appURL = AppUrlOpen.url;
    // To handle survey_click from email

    await this.redirectSurveyURL(appURL);

  }

  toggleUpdateInfoPopUpInFixedTime = async state => {
    if (state.isActive) {
      const storedInactiveTimestamp = sessionStorage.getItem('inactiveTimeStamp');
      const timeLagInMinutes = (5/60);
      const d = (new Date()).getTime();
      const timeLagFlag = (d - storedInactiveTimestamp >= (timeLagInMinutes * this.oneMinuteInMilliSecs));
      if (storedInactiveTimestamp && timeLagFlag) {
        sessionStorage.removeItem('updateInfoCalled');
        sessionStorage.removeItem('inactiveTimeStamp');
        await callUpdateInfo();
      }
    } else {
      if (!sessionStorage.getItem('inactiveTimeStamp')) {
        sessionStorage.setItem('inactiveTimeStamp', (new Date()).getTime());
      }
    }
  }

  setCurrentTrackerValues = () => {
    const trackerObj = {
      detail: { trackType: SurveyDetailsTracker.trackType, params: SurveyDetailsTracker.params},
      comment: { trackType: SurveyCommentsTracker.trackType, params: SurveyCommentsTracker.params},
      attachment: { trackType: SurveyAttachmentTracker.trackType, params: SurveyAttachmentTracker.params},
    };
    return { ...trackerObj };
  }

  analyticsTracker = async (isActive) => {
    // new AnalyticsTracker(isActive ? TRACK_START : TRACK_END);
    if (isActive) {

      let prevTrackerValues = sessionStorage.getItem('surveyDetPageTracking');

      if (prevTrackerValues) {
        prevTrackerValues = JSON.parse(prevTrackerValues);
        // if app is coming to foreground and if we were tracking survey-comments earlier , we need to start survey-comments tracking
        isPrevTrackingExists(prevTrackerValues, 'comment') && SurveyCommentsTracker.init(SURVEY_COMMENTS_TRACKER.START, prevTrackerValues.comment.params);
        // if app is coming to foreground and if we were tracking survey-detail page earlier , we need to start survey-details tracking
        isPrevTrackingExists(prevTrackerValues, 'detail') && SurveyDetailsTracker.init(SURVEY_DETAILS_TRACKER.START, prevTrackerValues.detail.params);
        // if app is coming to foreground and if we were tracking survey-Attachment page earlier , we need to start survey-attachment tracking
        isPrevTrackingExists(prevTrackerValues, 'attachment') && SurveyAttachmentTracker.init(SURVEY_ATTACHMENT_TRACKER.START, prevTrackerValues.attachment.params);

        if (SurveyDetailsTracker.idleTimerSvyDetRef) {
          SurveyDetailsTracker.idleTimerSvyDetRef.reset();
          SurveyDetailsTracker.idleTimerSvyDetRef.resume();
        }

      }
    } else {
        // storing all the current tracking values in a session storage variable i.e surveyDetPageTracking
        const currentTrackerValues = this.setCurrentTrackerValues();

        // if app is going to background and if we are tracking survey-comments, we need to stop survey-comments tracking
        if (isCurntTrackingExists(SurveyCommentsTracker.trackType, 'comment')){
          SurveyCommentsTracker.init(SURVEY_COMMENTS_TRACKER.END, SurveyCommentsTracker.params);
          if (!this.saveDraft && SurveyCommentsTracker.params.saveDraft){
            this.saveDraft = SurveyCommentsTracker.params.saveDraft;
          }
          await this.saveDraft();
        }
        // if app is going to background and if we are tracking survey-detail page, we need to stop survey-details tracking
        if (isCurntTrackingExists(SurveyDetailsTracker.trackType, 'detail')){
          SurveyDetailsTracker.init(SURVEY_DETAILS_TRACKER.END, SurveyDetailsTracker.params);
          if (!this.saveDraft && SurveyDetailsTracker.params.saveDraft){
            this.saveDraft = SurveyDetailsTracker.params.saveDraft;
          }
          await this.saveDraft();
        }
        // if app is going to background and if we are tracking survey-Attachment page, we need to stop survey-attachment tracking
        if (isCurntTrackingExists(SurveyAttachmentTracker.trackType, 'attachment')){
          SurveyAttachmentTracker.init(SURVEY_ATTACHMENT_TRACKER.END, SurveyAttachmentTracker.params);
          if (!this.saveDraft && SurveyAttachmentTracker.params.saveDraft){
            this.saveDraft = SurveyAttachmentTracker.params.saveDraft;
          }
          await this.saveDraft();
        }

        sessionStorage.setItem('surveyDetPageTracking', JSON.stringify(currentTrackerValues));

        if (SurveyDetailsTracker.idleTimerSvyDetRef) {
          SurveyDetailsTracker.idleTimerSvyDetRef.pause();
        }

    }

  }

  appStateChange = async state => {
    console.log('------appStateChange------', state.isActive);
    await this.analyticsTracker(state.isActive);
    await this.toggleUpdateInfoPopUpInFixedTime(state);
  }

  appBackButtonCb = state => {
     let initPage = isLoggedIn() ? (hasOnlyDashboardAccess() ? '/user/dashboard' : '/user/home') : '/login';
     console.log('initPage : ',initPage);
     console.log('window.location.pathname : ',window.location.pathname);

     if (isMobileApp()) {
       console.log('globalVars.getHistoryCounter : ',globalVars.getHistoryCounter());
       console.log('window.history.length : ',window.history.length);
       if (globalVars.getHistoryCounter() >= window.history.length) {
         globalVars.setHistoryCounter(0);
         localStorage.removeItem('historyCounter');
       }
     }

      globalVars.setHistoryCounter(globalVars.getHistoryCounter() + 1);
      localStorage.setItem('historyCounter', globalVars.getHistoryCounter());

     console.log('globalVars.getHistoryCounter : ',globalVars.getHistoryCounter());

     console.log('is survey page - ' + isSurveyDetailsPage());
     console.log(window.location.pathname);

     if (isMobileApp() && globalVars.getHistoryCounter() === window.history.length) {
        if(window.location.pathname === initPage) {
          globalVars.setHistoryCounter(0);
          localStorage.removeItem('historyCounter');
          this.App.exitApp();
        } else {
          globalVars.setHistoryCounter(globalVars.getHistoryCounter() - 1);
          localStorage.setItem('historyCounter', globalVars.getHistoryCounter());

          const currentUrl = window.location.pathname;

          window.history.back();
          setTimeout(() => {
            // This is a hack added to handle history back if there is no history left.
            console.log('browser history timeout - ' + window.location.pathname);
            // if location was not changed in 100 ms, then there is no history back.
            if(!globalVars.isModalVisible() && window.location.pathname === currentUrl) {
              globalVars.setHistoryCounter(0);
              localStorage.removeItem('historyCounter');
              this.App.exitApp();
            }
          }, 100);
        }
     } else if (isSurveyDetailsPage()) {
        if(!globalVars.isModalVisible()) {
          console.log('modal not visible in survey page');
          localStorage.setItem('historyCounter', globalVars.getHistoryCounter());
          window.history.back();
        } else {
          globalVars.setHistoryCounter(globalVars.getHistoryCounter() - 1);
          localStorage.setItem('historyCounter', globalVars.getHistoryCounter());
        }
     } else if (window.location.pathname === '/login' && localStorage.getItem('referrer') === null) {
       localStorage.setItem("historyCounter", globalVars.getHistoryCounter());
       window.history.back();
     } else if ((window.location.pathname === '/login' || window.location.pathname === '/resetpassword'
        || window.location.pathname === '/setpassword')
        && localStorage.getItem('referrer') !== null) {
       globalVars.setHistoryCounter(0);
       localStorage.removeItem('historyCounter');
       this.App.exitApp();
     } else if ((window.location.pathname === '/selector' || window.location.pathname === '/resetpassword'
        || window.location.pathname === '/setpassword')
        && localStorage.getItem('referrer') === null) {
       globalVars.setHistoryCounter(0);
       localStorage.removeItem('historyCounter');
       this.App.exitApp();
     } else {
       const trueFalse = isSurveyDetailsPage();
       //unlikely how it may coming here for survey back button but hope it now doesn't come here
       if (trueFalse) {
         window.history.back();
       }
     }
  }

  setNetworkStatus = async() => {
    const networkStatusCap = await Plugins.Network.getStatus();
    globalVars.setNetworkStatus(networkStatusCap.connected);
    this.networkStatus = networkStatusCap.connected;
    console.log('this.networkStatus : ',this.networkStatus);
  }

  setSurveySourceInWeb = () => {
    if (isWeb() && isSurveyIdInURL()) {
      setSurveySource('email');
    }
  }

  componentDidMount = async() => {

    if (isWeb() && isAccessHope()){
      document.title = "AccessHope Physician Portal";
    } else {
      document.title = "Navya";
    }

    this.deviceInfo = await Plugins.Device.getInfo();

    this.setSurveySourceInWeb();

    const initHistoryCounter = localStorage.getItem('historyCounter') || 0;
    localStorage.removeItem('historyCounter');
    globalVars.setHistoryCounter(+initHistoryCounter);

    await this.setNetworkStatus();

    this.setAppListenerFunctions();

    window.alertShownCounter = 0;

    this.callUpdateInfoOnLaunch();
  }

  async callUpdateInfoOnLaunch() {
    await callUpdateInfo();
  }

  render() {

      globalVars.setApiHost(getConfig().urlRoot);

      // enabling notifications for mobile apps only
      if (isMobileApp()) {
        Plugins.SplashScreen.hide();
        NotificationObj.setPushNotificationListeners();
      } else {
        globalVars.setURILocationSearch(window.location.search.substring(1));
      }

      const referrer = getReferrer();

      setAvatarStyles(referrer);

      let redirectURL = getRedirectURLOnAppLoad();

      const loggedIn = isLoggedIn();

      return (
        <IonApp className={`${referrer} ${isMobileApp() ? 'mobile-app' : 'web-app'}`}>
            <ErrorBoundary>
            <IonReactRouter>
              <IonRouterOutlet animated={false}>
                <Route
                  exact
                  path={selector.path}
                  render={
                    props => (
                      (!loggedIn && !localStorage.getItem('referrer')) ? <selector.component {...props} /> : <Redirect to={redirectURL} />
                    )
                  }
                />

                  <Route
                    exact
                    path={login.path}
                    render={
                      props => (
                        !loggedIn ? <login.component {...props} /> : <Redirect to={redirectURL} />
                      )
                    }
                  />
                  <Route path="/user" component={ExpertsApp} />
                  <Route path="/resetpassword" path={resetpassword.path} render={props => (<resetpassword.component direct_url />)} />
                  <Route path="/setpassword" path={setpassword.path} render={props => (<setpassword.component direct_url />)} />
                  <Route path={error404.path} render={props => (<error404.component />)} />
                  <Redirect exact from="/" to={redirectURL} />
                  <Redirect to='/404' />
              </IonRouterOutlet>
            </IonReactRouter>
            </ErrorBoundary>
            {/* for update info api */}
            <IonAlert
              isOpen={this.state.showAlert}
              onDidDismiss={() => this.setShowAlert(false)}
              header={'New App Update Available !'}
              buttons={[
                {
                  text: 'Cancel',
                  role: 'cancel',
                  cssClass: 'secondary',
                  handler: () => {
                    console.log('cancelled : window.zombiedCaseFlag : ', !!localStorage.getItem('zombiedCaseFlag'));
                    sessionStorage.removeItem('force_update_zombied');
                    if (!!localStorage.getItem('zombiedCaseFlag')) {
                      localStorage.removeItem('zombiedCaseFlag');
                      const survey_detail_source = getSurveySource();
                      if (survey_detail_source === 'email' || survey_detail_source === 'notification')
                      window.location = window.location.origin + '/user/home';
                    }
                  }
                },
                {
                  text: 'Update',
                  handler: async (data) => {
                    const platform = this.deviceInfo.platform;
                    const androidURL = 'https://play.app.goo.gl/?link=https://play.google.com/store/apps/details?id=com.navya.navyatech';
                    const iosURL = 'https://apps.apple.com/us/app/navya/id1054763864';
                    const url = platform === 'ios' ? iosURL : androidURL ;
                    await Plugins.App.openUrl({ url });
                  }
                }
              ]}
            />
          {/* for update info api */}
        </IonApp>
      );
  }

}

export default NetworkDetector(ExpertApp);
