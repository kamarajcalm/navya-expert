import React from 'react';
import { Plugins } from '@capacitor/core';
import { IonAlert, IonContent, IonRow, IonItem, IonLoading } from '@ionic/react';
import SetPwdInstructionsForm from './setpwdinstructionsform';
import { Header, Modal, Form } from '../../../common';
import { getResetPasswordStub, getResetPasswordViaLinkStub } from '../../../stubs/forms';
import api from '../../../api/endpoints';
import { isLoggedIn, getAlertTitle, getReferrer } from '../../../utils';
import cx from 'classnames';
import './styles.scss';

const RESET_SUCCESS_MESSAGE = "Your password was successfully reset!";
const RESET_FAILURE_MESSAGE = "There was an issue. Please ensure your current password is correct and try again.";

class ResetPassword extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: this.props.direct_url || false,
      showAlert: false,
      alertMessage: '',
      showLoading: false,
      backToLogin: false,
      showAlphaPwdValidtnPopup: false,
      alphaPwdValidtnErrs: []
    }
    console.log('direct_url ', this.props.direct_url);
    this.formData = {};
  }

  componentDidMount = () => {
    if(this.props.direct_url) {
      this.setState({
        showLoading: true
      }, async () => {
        console.log('validatetoken api call');
        const response = await api.validateLinkToken();

        this.setState({
          showLoading: false
        }, () => {
          if (!!!response?.success) {
            const error = response?.error;
            const alertMessageObj = error ? {alertMessage: error} : {};
            const goToLogin = response?.status == 400 ? true : false;
            this.setState({showAlert: !!error, backToLogin: goToLogin, ...alertMessageObj});
          }
        })
      })
    }
  }

  toggleModal = () => {
    this.setState({
      isOpen: !this.state.isOpen
    });
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
      if(this.state.alertMessage == RESET_SUCCESS_MESSAGE) {

        if(isLoggedIn()) {
          api.logout(window.localStorage.getItem('deviceID'));
        } else {
          window.location = '/login?org='+getReferrer();
        }
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
      await Plugins.Modals.alert({title: getAlertTitle(), message: "You can't reset password in debug mode"});
      hideLoader(false);
      return;
    }

    this.formData = {...values};

    if(!isNewPassValid) {

      hideLoader(false);

      setShowHideAlert(true, 'Please ensure password meets all requirements.');

      return;
    }

    if (this.formData.newpass !== this.formData.newpass_conf){
      hideLoader(false);
      setShowHideAlert(true, 'New passwords do not match. Please try again.');
      return;
    }

    let response;

    if(this.props.direct_url) {
      response = await api.passwordResetViaLink(this.formData.newpass);
    } else {
      response = await api.passwordReset(this.formData.oldpass, this.formData.newpass);
    }
    hideLoader(false);

    if (response?.success) {
      if(this.props.direct_url) {
        this.setState({showAlert: true, alertMessage: RESET_SUCCESS_MESSAGE});

        if(this.formRef.form) {
          this.formRef.form.reset();
        }
      } else {
        this.setState({ isOpen: false }, () => {
          this.setState({showAlert: true, alertMessage: RESET_SUCCESS_MESSAGE});
        });
      }
    } else {
      if (response.alphaPwdValidationErrors && response.alphaPwdValidationErrors.length > 0) {
        let message = '<p class="title">Please choose a new password and try again.</p>';
        response.alphaPwdValidationErrors.map((msg) => {
          message += '<p>' + msg.error + '</p>';
        });
        this.setState({showAlert: true, alertMessage: message});
      } else {
        const error = response.error || RESET_FAILURE_MESSAGE;
        this.setState({showAlert: true, alertMessage: error});
      }
    }
  }

  hideAlphaPwdValidtnPopupCb = () => {
    this.setState({
      alphaPwdValidtnErrs: [],
      showAlphaPwdValidtnPopup: false
    })
  }

  render() {

    const formItemsCb = this.props.direct_url ? getResetPasswordViaLinkStub : getResetPasswordStub;

    return (
      <React.Fragment>
        <div className="reset-password-container">
          {!this.props.direct_url && <a onClick={this.toggleModal}>Reset Password</a>}
          <Modal
            isOpen={this.state.isOpen}
            >
            <Header title="Reset Password">{!this.props.direct_url && <span className="close-btn" onClick={this.toggleModal}>Cancel</span>}</Header>

            <IonContent>
              <SetPwdInstructionsForm
                ref={node => this.formRef = node}
                className="login-form"
                formname="reset-pwd"
                formItemsCb={formItemsCb}
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

export default ResetPassword;
