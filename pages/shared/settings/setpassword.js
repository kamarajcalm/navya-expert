import React from 'react';
import { Plugins } from '@capacitor/core';
import { IonAlert, IonContent, IonRow, IonItem, IonLoading } from '@ionic/react';
import { Header, Modal, Form } from '../../../common';
import { getSetPasswordOnRegistrationStub } from '../../../stubs/forms';
import api from '../../../api/endpoints';
import SetPwdInstructionsForm from './setpwdinstructionsform';
import { isLoggedIn, getAlertTitle, getReferrer } from '../../../utils';
import { isMSKCC, isPM, isAccessHope } from '../../../referrers';
import './styles.scss';

const SUCCESS_MESSAGE = isAccessHope() ? "Your registration is complete! You will be redirected to your first case." : "Your registration is complete! You will be redirected to your first survey.";
const FAILURE_MESSAGE = isMSKCC() ? "There was an issue. Please contact us at mskcc@navya.care." : isPM() ? "There was an issue. Please contact us at pm@navya.care." : isAccessHope() ? "There was an issue. Please contact us at ah@navya.care." : "";

class SetPassword extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showAlert: false,
      alertMessage: '',
      surveyData: null,
      showLoading: false,
      backToLogin: false
    };
    this.formData = {};
  }

  componentDidMount = () => {
    this.setState({
      showLoading: true
    }, async () => {
      console.log('validatetoken api call');
      const response = await api.validateLinkToken();

      this.setState({
        showLoading: false
      }, () => {
        if (!!!response?.success) {
          const error = response?.error || FAILURE_MESSAGE;
          const goToLogin = response?.status == 400 ? true : false;
          this.setState({showAlert: true, backToLogin: goToLogin, alertMessage: error});
        }
      })
    })
  }

  onDidDismiss = () => {
    this.setState({
      showAlert: true
    });
  }

  hideAlert = () => {
    this.setState({
      showAlert: false
    }, () => {
      if(this.state.surveyData) {
        const surveyData = this.state.surveyData;
        const searchParams = `survey_token=${surveyData.survey_token}&survey_id=${surveyData.survey_id}&org=${surveyData.org}`
        window.location = '/user/surveys/' + this.state.surveyData.survey_id + '?' + searchParams;
      } else if(this.state.backToLogin) {
        window.location = '/login?org='+getReferrer();
      }
    });
  }

  onFormSubmit = async (params) => {

    const {
      values, hideLoader,
      setShowHideAlert, isValid: isNewPassValid
    } = params;

    if(window.localStorage.getItem('is_in_debug_mode') == 1) {
      await Plugins.Modals.alert({title: getAlertTitle(), message: "You can't set password in debug mode"});
      hideLoader(false);
      return;
    }

    this.formData = {...values};

    var patt = /^([!@#$%^&*a-zA-Z0-9_-]){5,128}$/;
    const result = patt.test(this.formData.newpass);

    if(!isNewPassValid) {

      hideLoader(false);

      setShowHideAlert(true, 'Please ensure password meets all requirements.');

      return;
    }

    if (this.formData.newpass !== this.formData.newpass_conf){
      hideLoader(false);
      setShowHideAlert(true, 'Passwords do not match. Please try again.');
      return;
    }

    let response = await api.completeRegistration(this.formData.newpass);

    hideLoader(false);

    if (response?.success) {
      const backToLogin = !response.survey_data;
      this.setState({showAlert: true, surveyData: response.survey_data, backToLogin: backToLogin, alertMessage: response.success || SUCCESS_MESSAGE});

      if(this.formRef.form) {
        this.formRef.form.reset();
      }
    } else {
      if (response.alphaPwdValidationErrors && response.alphaPwdValidationErrors.length > 0) {
        let message = '<p class="title">Please choose a new password and try again.</p>';
        response.alphaPwdValidationErrors.map((msg) => {
          message += '<p>' + msg.error + '</p>';
        });
        this.setState({showAlert: true, alertMessage: message});
      } else {
        const error = response.error || FAILURE_MESSAGE;
        this.setState({showAlert: true, alertMessage: error});
      }
    }
  }

  render() {

    return (
      <React.Fragment>
        <div className="reset-password-container">
          <Modal
            isOpen={true}
            >
            <Header title="Welcome" />

            <IonContent>

              <IonItem>
                <dl className="reset-password-validation set-password-instructions">
                  <dd>Choose a password to complete registration</dd>
                </dl>
              </IonItem>

              <SetPwdInstructionsForm
                ref={node => this.formRef = node}
                className="set-password-form"
                formname="reset-pwd"
                formItemsCb={getSetPasswordOnRegistrationStub}
                onSubmit={this.onFormSubmit}
              />

            </IonContent>
          </Modal>
          <IonLoading isOpen={this.state.showLoading} />
          <IonAlert
            isOpen={this.state.showAlert}
            onDidDismiss={this.hideAlert}
            message={this.state.alertMessage}
            cssClass={'password-alert'}
            buttons={[
              {
                text: 'OK',
                role: 'cancel',
                cssClass: 'navyaPink'
              }
            ]}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default SetPassword;
