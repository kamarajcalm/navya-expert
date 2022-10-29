
import React from 'react';
import {
  IonPage, IonImg, withIonLifeCycle,
  IonLoading, IonIcon, IonContent, IonAlert
} from '@ionic/react';
import { withRouter, Redirect } from 'react-router-dom';
import {
  isLoggedIn, getReferrer, getQueryVariable, isAlphaTokenInURL, isAlphaPreviewParamsInURL,
  isWeb, isMobileApp, isSurveyTokenInURL, showUpdateInfoPopup,
  deleteSurveySource, validateEmail, isMSKCCEmail, isPMEmail, isAccessHopeEmail, isSurveyIdInURL,
  hasNoSurveyAndNoDashboardAccess, getRedirectURLOnAppLoad,
  hasOnlyDashboardAccess
} from '../../../utils';
import globalVars from '../../../globalVars';
import { isNavya, isMSKCC, isPM, isAccessHope, isApollo} from '../../../referrers';
import { Header, Form, Modal } from '../../../common';
import { getLoginStub } from '../../../stubs/forms';
import { getLogos } from '../../../stubs/logo';
import ForgotPassword from '../forgotpassword';
import SignupComponent from '../signup';
import api from '../../../api/endpoints';
import NotificationObj from '../../../common/notifications';
import { Plugins } from '@capacitor/core';
import { setAvatarStyles } from '../../../styles/avatars';
import './styles.scss';
import TokenManager from '../../../api/tokenManager';

class LoginComponent extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      isOpen: true,
      redirect: false,
      redirectURL: null,
      showAlert: false,
      isLoading: isMobileApp()
    };

    this.deviceInfo = {};
  }

  loginModalPresented = () => {

    window.removeEventListener('ionModalDidPresent', this.loginModalPresented);

    if (this.state.isLoading) {

      this.setState({
        isLoading: false
      }, () => {
        this.autoSubmit();
      })
    } else {
      this.autoSubmit();
    }
  }

  autoSubmit = () => {
    if (isAlphaTokenInURL() || isSurveyTokenInURL()) {
      if (document.getElementById('login-form-submit'))
      document.getElementById('login-form-submit').click();
    }
  }

  onFormSubmit = async (values={}, hideLoader, setShowHideAlert) => {

    let { username=null, email=null, password=null } = values;

    let alphatoken = null; let survey_token = null; let surveyID = null; let alphaeosid = null; let alphamedicalcaseid = null;

    // taking the token from URL for expert app alpha integration
    if (isAlphaTokenInURL()) {
      alphatoken = getQueryVariable('token');
    }

    // taking the eosid from URL for expert-app-preview and alpha integration
    if (isAlphaPreviewParamsInURL()) {
      alphaeosid = getQueryVariable('eosid');
      alphamedicalcaseid = getQueryVariable('medicalcaseid');
    }

    // checking for PM avatar since this avatar accepts both username and email temporarily for demo.
    if (isPM()) {
      const isValidEmail = validateEmail(email);
      // if the entered value is not a valid email for (PM avatar), consider the entered value to be username (PM avatar).
      if (!isValidEmail) {
        username = values['email'];
        values['username'] = username;
        // delete email from values object
        delete values['email'];
      } else {
        values['username'] && delete values['username'];
      }
    }

    let loginName = username;

    // if(!loginName && email && (isMSKCC() || isPM())) {
    if(!loginName && email && (isMSKCC() || isAccessHope())) {
      // we are handling username and email via the same field. For MSKCC we use email as the input and for others we use username.
      // So if email is used, set username as email and pass it in the api as username. Server handles both username and email.
      if(email != 'dev' && email != 'preprod' && email != 'prod' && !validateEmail(email)) {
        hideLoader(false);
        this.showInvalidEmailPopup(setShowHideAlert);
        return;
      }

      console.log('input field is email - ' + email);
      loginName = email;
    }

    // taking the survey_token from URL for expert app survey_email integration
    if (isSurveyTokenInURL() && !loginName && !password) {
      survey_token = getQueryVariable('survey_token');
    }
    if(isSurveyIdInURL()) {
      surveyID = getQueryVariable('survey_id');
    }

    let inviteType = getQueryVariable('invite_type');

    if (alphatoken) {
      values = { alphatoken };
    } else if(survey_token) {
      values = { survey_expert_token: survey_token };
    }

    if ((loginName === 'dev' || loginName === 'preprod' || loginName === 'prod')
        && password === 'navya@123') {
        localStorage.setItem('env', loginName);
        hideLoader(false);
        setShowHideAlert(true, 'Api environment changed to ' + loginName + '. Restart the app.');
        return;
    }

    let uniquekey = window.localStorage.getItem('deviceID')

    if (!uniquekey){
      uniquekey = this.deviceInfo.uuid;
      window.localStorage.setItem('deviceID', uniquekey)
    }

    values['uniquekey'] = uniquekey;

    const referrer = getReferrer();
    if (referrer)
      values['org_name'] = referrer;

    console.log(values)

    window.alertShownCounter = 0;

    const baseauth_data = await api.baseauth(values)
    console.log(baseauth_data)

    hideLoader(false);

    if (!baseauth_data || !baseauth_data.userid) {
      if (window.alertShownCounter === 0) {
        deleteSurveySource();
        // see if status is inside here
        const error = baseauth_data ? baseauth_data.error : 'Invalid ' + ((isMSKCC() || isPM() || isAccessHope()) ? 'email' : 'username') + ' or password. Please try again.';
        if (baseauth_data && baseauth_data.status === 503){
          return;
        }
        setShowHideAlert(true, error);
      }
      return;
    }

    // baseauth_data.has_dashboard_access = 0; baseauth_data.has_survey_access = 0;

    if (!!!baseauth_data.has_survey_access && !!!baseauth_data.has_dashboard_access) {
      setShowHideAlert(true, "Access Permissions are needed");
      return;
    }

    const tokenManager = new TokenManager();
    const referrerName = tokenManager.updateLoginDataCache(baseauth_data);

    const {
      operatingSystem, model, osVersion, platform, appVersion: app_version
    } = this.deviceInfo;

    console.log('this.deviceInfo : ',this.deviceInfo);
    if (baseauth_data.should_register) {
      const register_device_input = {
        'devicekey': localStorage.getItem('deviceID'),
        'devicetype': platform || 'unknown',
        'device_os': operatingSystem ? operatingSystem.toUpperCase() : 'unknown',
        'device_os_version': osVersion || 'unknown',
        'device_name': model || 'unknown',
        app_version
      }
      register_device_input.device_os_version = `${register_device_input.device_os_version}(${navigator.userAgent})`;
      await api.registerDevice(register_device_input);
    }

    setAvatarStyles(referrerName);

    if (isMobileApp()) {
      await NotificationObj.requestPermission();
    }

    if (survey_token || surveyID) {
      globalVars.setURILocationSearch(null);
    }

    this.setState({
      isOpen: false,
      redirect: true,
      redirectURL: isAlphaPreviewParamsInURL() ? `/user/alphasurveypreview/${alphamedicalcaseid}/${alphaeosid}`: surveyID ? (isAccessHope() && inviteType !== "qc") ? '/user/surveys' : `/user/surveys/${surveyID}` : hasOnlyDashboardAccess() ? '/user/dashboard' : '/user/home'
      // redirectURL: getRedirectURLOnAppLoad()
    }, () => {
      if (isMobileApp())
        globalVars.setHistoryCounter(window.history.length - 1);
      // this.props.history.push(survey_token ? `/user/surveys/${surveyID}` : `/user/home`);
    });
  }

  showInvalidEmailPopup(setShowHideAlert) {
    const referrer = getReferrer();
    let message = 'Please enter a valid ' + referrer.toUpperCase() + ' email.'
    if (isMSKCC()){
      message = "Please enter a vaild MSKCC email.";
    } else if (isPM()){
      message = "Please enter a vaild UHN/PM email.";
    } else if (isAccessHope()){
      message = "Please enter your registered hospital or AccessHope email.";
    }

    setShowHideAlert(true, message);
  }

  onSignupFormSubmit = async (values={}, hideLoader, setShowHideAlert) => {

    this.formData = {...values};

    if(!validateEmail(this.formData.email) || (isMSKCC() && !isMSKCCEmail(this.formData.email)) || (isPM() && !isPMEmail(this.formData.email) || (isAccessHope() && !isAccessHopeEmail(this.formData.email)))) {
      hideLoader(false);
      this.showInvalidEmailPopup(setShowHideAlert);
      return;
    }

    let response = await api.requestSignup(this.formData.email);
    console.log(response.success);
    console.log(response.error);
    let msg = '';
    if(response.success) {
      msg = response.success;
    } else {
      msg = response.error;
    }

    hideLoader(false);
    setShowHideAlert(true, msg);
  }

  async componentDidMount() {

    window.addEventListener('ionModalDidPresent', this.loginModalPresented);
    window.alertShownCounter = 0;
    document.title = "Expert Login";
    const { Device } = Plugins;
    const info = await Device.getInfo();
    this.deviceInfo = {...info};
    console.log('this.deviceInfo : ',this.deviceInfo);
  }

  render() {

    const loggedIn = isLoggedIn();
    let referrer = getReferrer();
    const logos = getLogos();

    if (this.state.redirect) {
      return (
        <Redirect to={this.state.redirectURL} />
      )
    }

    return (
      <IonPage className="login-container-page">
        {/* <Header /> */}

        <Modal
          isOpen={this.state.isOpen}
          className={ isAccessHope() ? "login-container-page login-container-page-ah authentication-container" : "login-container-page authentication-container"}>

          {!this.state.isLoading &&
            (
              <div className="main-login-container">

                {isWeb() ? <Header /> :
                  <Header>
                    {
                      !localStorage.getItem('referrer') ? <IonIcon className="close-btn" name="arrow-back" onClick={() => window.location = '/selector'}></IonIcon> : null
                    }
                  </Header>
                }
                { !referrer && <Header customClassName="non-referrer-title" title={'Login'} /> }
                {
                  logos && !isMSKCC() && !isPM() && !isAccessHope() &&
                  <div className="ion-img">
                    <img
                      className="main-login-logo login-logo align-to-center"
                      src={logos[0].src}
                      alt={logos[0].alt}
                    />
                  </div>
                }

                {
                  logos && (isMSKCC() || isPM() || isAccessHope()) && logos.map((logo, index) => {
                    return (
                      <>
                      {
                        logo ? (
                          <div className="ion-img">
                            <img
                              className="login-logo"
                              src={logo.src}
                              alt={logo.alt}
                            />
                          </div>
                        ) : null
                      }
                      </>
                    )
                  })
                }

                {
                  isMobileApp() && isNavya() && logos && logos.slice(1, logos.length).map((logo, index) => {
                    return (
                      <div className="ion-img">
                        <img
                          className="login-logo"
                          src={logo.src}
                          alt={logo.alt}
                        />
                      </div>
                    )
                  })
                }

                <div className="login-outer-container">

                  <div className="login-container">
                      {(isMSKCC() || isPM() || isAccessHope()) && <div className="header"><span>Log In</span></div>}
                      <Form
                        className="login-form"
                        formname="login"
                        items={getLoginStub()}
                        onSubmit={this.onFormSubmit}
                        loadingMessage={'Logging In'}
                        errorMessage={(isMSKCC() ? 'MSKCC email' : isPM() ? `${isWeb() ? 'Username / Email' : 'UHN/PM email'}` : isAccessHope() ? 'Email' : 'Username') + ' and Password is required'}
                        buttons={[
                          {
                            text: 'OK',
                            role: 'cancel',
                            cssClass: 'navyaPink',
                            handler: () => {
                              showUpdateInfoPopup();
                            }
                          }
                        ]}
                      />

                      { !this.state.isLoading && <ForgotPassword /> }

                      {
                        isWeb() && logos && isNavya() &&
                        <div className="bottom-logo-container">
                        {
                          logos.slice(1, logos.length).map((logo, index) => {
                            return (
                              <div className="ion-img">
                                <img
                                  className="login-logo"
                                  src={logo.src}
                                  alt={logo.alt}
                                />
                              </div>
                            )
                          })
                        }
                        </div>
                      }

                  </div>

                    { (isMSKCC() || isPM() || isAccessHope()) && <div className="divider" />}

                    { (isMSKCC() || isPM() || isAccessHope()) && !this.state.isLoading && <SignupComponent onSignupFormSubmit={this.onSignupFormSubmit}/> }


                  </div>

                </div>

            )
          }
        </Modal>
        <IonLoading isOpen={this.state.isLoading} />
      </IonPage>
    );
  }
}

export default withRouter(withIonLifeCycle(LoginComponent));
