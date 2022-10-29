import React from 'react';
import { Form } from '../../../common';
import { getSignupStub } from '../../../stubs/forms';
import './styles.scss';
import { isMSKCC, isPM, isAccessHope } from '../../../referrers';
import { isWeb } from '../../../utils';

class SignupComponent extends React.PureComponent {

  constructor(props) {
    super(props);
    this.formData = {};
  }

  render() {

    return (
      <React.Fragment>
        <div className="signup-container">
          <div className="header"><span>Sign Up</span></div>
          <Form
            className="signup-form"
            formname="signup"
            items={getSignupStub()}
            onSubmit={this.props.onSignupFormSubmit}
            loadingMessage={'Please wait'}
            errorMessage={isMSKCC () ? 'Please enter an MSKCC email' : isPM() ? `Please enter a UHN/PM email` : isAccessHope() ? `Please enter your registered hospital or AccessHope email` : ""}
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

export default SignupComponent;
