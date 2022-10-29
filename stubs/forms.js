import { getQueryVariable, isAlphaTokenInURL, isSurveyTokenInURL, isWeb } from '../utils';
import { isMSKCC, isPM, isAccessHope } from '../referrers';

export const getLoginStub = () => ([
  isMSKCC() ? {
    name: 'email',
    type: 'input',
    placeholder: 'MSKCC Email',
    autocomplete: 'on',
    maxlength: '100',
    autocomplete: true,
    required: !isAlphaTokenInURL() && !isSurveyTokenInURL()
  } : isPM() ? {
    name: 'email',
    type: 'input',
    placeholder: isWeb() ? 'Username / Email' : 'UHN/PM Email',
    autocomplete: 'on',
    maxlength: '100',
    autocomplete: true,
    required: !isAlphaTokenInURL() && !isSurveyTokenInURL()
  } : isAccessHope() ? {
    name: 'email',
    type: 'input',
    placeholder: 'Email',
    autocomplete: 'on',
    maxlength: '100',
    autocomplete: true,
    required: !isAlphaTokenInURL() && !isSurveyTokenInURL()
  } : {
    name: 'username',
    type: 'input',
    placeholder: 'Username',
    autocomplete: 'on',
    maxlength: '100',
    autocomplete: true,
    required: !isAlphaTokenInURL() && !isSurveyTokenInURL() ,
    required: !isAlphaTokenInURL() && !isSurveyTokenInURL()
  },
  {
    name: 'password',
    type: 'password',
    autocomplete: 'on',
    placeholder: 'Password',
    maxlength: '100',
    autocomplete: true,
    required: !isAlphaTokenInURL() && !isSurveyTokenInURL()
  },
  {
    type: 'submit',
    text: 'Log in'
  },
  {
    type: 'link',
    text: 'Forgot password?'
  },
]);

export const getForgotPasswordStub = () =>  ([
  (isMSKCC() || isPM() || isAccessHope()) ? {
    type: 'text',
    maxlength: '100',
    autocomplete: true,
    text: 'Enter your email and we will send you instructions to reset your password.'
  } : {
    type: 'text',
    maxlength: '100',
    autocomplete: true,
    text: 'Enter your username and we will email you instructions to reset your password.'
  },
  isMSKCC() ? {
    name: 'email',
    maxlength: '100',
    autocomplete: 'on',
    type: 'input',
    placeholder: 'MSKCC Email',
    autocomplete: true,
    required: true
  } : isPM() ? {
    name: 'email',
    maxlength: '100',
    autocomplete: 'on',
    type: 'input',
    placeholder: 'UHN/PM Email',
    autocomplete: true,
    required: true
  } : isAccessHope() ? {
    name: 'email',
    maxlength: '100',
    autocomplete: 'on',
    type: 'input',
    placeholder: 'Email',
    autocomplete: true,
    required: true
  } : {
    name: 'username',
    maxlength: '100',
    autocomplete: 'on',
    type: 'input',
    placeholder: 'Username',
    autocomplete: true,
    required: true
  },
  {
    type: 'submit',
    text: 'Email Me Instructions'
  }
]);

export const getSignupStub = () =>  ([
  isMSKCC() && {
    name: 'email',
    maxlength: '100',
    autocomplete: 'on',
    type: 'input',
    placeholder: 'MSKCC Email',
    autocomplete: true,
    required: true
  },
  isPM() && {
    name: 'email',
    maxlength: '100',
    autocomplete: 'on',
    type: 'input',
    placeholder: isWeb() ? 'Enter Email' : 'UHN/PM Email',
    autocomplete: true,
    required: true
  },
  isAccessHope() && {
    name: 'email',
    maxlength: '100',
    autocomplete: 'on',
    type: 'input',
    placeholder: 'Email',
    autocomplete: true,
    required: true
  },
  {
    type: 'submit',
    text: 'Email Me Instructions'
  }
]);

/*
  "params" should contain
  -- key: the same name as the fieldname
  -- value: is an object with custom properties that you want to add to the form-field
*/
export const getResetPasswordStub = (params={}) => {

  return [
    {
      name: 'oldpass',
      maxlength: '100',
      type: 'password',
      autocomplete: 'on',
      placeholder: 'Current Password',
      autocomplete: true,
      required: true
    },
    {
      name: 'newpass',
      maxlength: '100',
      type: 'password',
      placeholder: 'New Password',
      required: true,
      ...params.newpass
    },
    {
      name: 'newpass_conf',
      maxlength: '100',
      type: 'password',
      placeholder: 'Confirm New Password',
      required: true
    },
    {
      type: 'submit',
      text: 'Reset Password'
    }
  ];
};

/*
  "params" should contain
  -- key: the same name as the fieldname
  -- value: is an object with custom properties that you want to add to the form-field
*/

export const getResetPasswordViaLinkStub = (params={}) => {

  return [
    {
      name: 'newpass',
      maxlength: '100',
      type: 'password',
      placeholder: 'New Password',
      required: true,
      ...params.newpass
    },
    {
      name: 'newpass_conf',
      maxlength: '100',
      type: 'password',
      placeholder: 'Confirm New Password',
      required: true
    },
    {
      type: 'submit',
      text: 'Reset Password'
    }
  ];
};

export const getSetPasswordOnRegistrationStub = (params={}) => ([
  {
    name: 'newpass',
    maxlength: '100',
    type: 'password',
    placeholder: 'New Password',
    required: true,
    ...params.newpass
  },
  {
    name: 'newpass_conf',
    maxlength: '100',
    type: 'password',
    placeholder: 'Confirm New Password',
    required: true
  },
  {
    type: 'submit',
    text: 'Complete Registration'
  }
]);
