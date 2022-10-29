import React from 'react';
import { IonAlert } from '@ionic/react';
import { Header, Modal, Form } from '../../../common';
import { getForgotPasswordStub } from '../../../stubs/forms';
import globalVars from '../../../globalVars';
import './styles.scss';
import api from '../../../api/endpoints';
import { isMSKCC, isPM, isAccessHope } from '../../../referrers';
import { validateEmail, getReferrer, isWeb } from '../../../utils';

class ForgotPassword extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      showAlert: false
    }
    this.formData = {};
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
    });
  }

  onFormSubmit = async (values, hideLoader, setShowHideAlert) => {
    const { username=null, email=null } = values;

    if(!username && email && (isMSKCC() || isPM() || isAccessHope())) {
      // we are handling username and email via the same field. For MSKCC we use email as the input and for others we use username.
      // So if email is used, set username as email and pass it in the api as username. Server handles both username and email.
      if(!validateEmail(email)) {
        hideLoader(false);
        const referrer = getReferrer();
        let message = "Please enter a vaild email.";

        if (isMSKCC()){
          message = "Please enter a vaild MSKCC email.";
        } else if (isPM()){
          message = "Please enter a vaild UHN/PM email.";
        } else if (isAccessHope()){
          message = "Please enter your registered hospital or AccessHope email.";
        }

        setShowHideAlert(true, message);
        return;
      }

      console.log('input field is email - ' + email);
    }

    this.formData = {...values};
    await api.forgotPassword(values)
    hideLoader(false);
    this.setState({ isOpen: false }, () => {
      this.setState({showAlert: true});
    });
  }

  getAlertMessage() {
    if(isMSKCC() || isPM() || isAccessHope()) {
      return `If an account matches this email, you will receive an email with instructions shortly.`
    }

    return `If the account matches the username "${this.formData.username}", you should receive an email shortly.`
  }

  render() {

    return (
      <React.Fragment>
        <div className="forgot-password-container">
          <span className="link" onClick={this.toggleModal}>{isAccessHope() ? "Reset Password" : "Forgot Password?"}</span>
          <Modal
            isOpen={this.state.isOpen}
          >
            <Header title="Reset Password"><span className="close-btn" onClick={this.toggleModal}>Cancel</span></Header>
            <Form
              className="forgot-pwd-form"
              formname="forgot-pwd"
              items={getForgotPasswordStub()}
              onSubmit={this.onFormSubmit}
              loadingMessage={'Please wait'}
              errorMessage={isAccessHope() ? "Please enter your registered hospital or AccessHope email" : `Please enter ${isMSKCC() ? 'an MSKCC email' : isPM() ? `a UHN/PM email` : 'a username'}`}
              buttons={[
                {
                  text: 'OK',
                  role: 'cancel',
                  cssClass: 'navyaPink'
                }
              ]}
            />
          </Modal>
          <IonAlert
            isOpen={this.state.showAlert && globalVars.getNetworkStatus()}
            onDidDismiss={this.hideAlert}
            message={this.getAlertMessage()}
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

export default ForgotPassword;
