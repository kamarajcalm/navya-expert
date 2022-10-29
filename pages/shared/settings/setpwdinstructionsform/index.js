
import { useState, useEffect } from 'react';
import cx from 'classnames';
import { IonAlert, IonContent, IonRow, IonItem, IonLoading } from '@ionic/react';
import { Form } from '../../../../common';
import validatePassword from '../../../../common/form/validators/helpers';
import { getValidationRulesUtils } from '../../../../common/form/validators/messages';
import './styles.scss';

const SetPwdInstructionsForm = React.forwardRef((props, ref) => {

  const [state, setState] = useState({ isValid: null, errorMessages: {} });

  const {
    formItemsCb, formName='' ,
    className='', onSubmit
  } = props;

  const passwordValidator = getValidationRulesUtils();
  console.log('passwordValidator  :',passwordValidator);

  const newPassOnChange = (e) => {

    const str = e.target.value;
    console.log('str : ',str);

    const { isValid, errorMessages } = validatePassword(str, passwordValidator);
    console.log('isFormValid: ',isValid);

    setState((prevState) => ({
      ...prevState,
      isValid, errorMessages
    }));

  }

  const onFormSubmitCb = async (values, hideLoader, setShowHideAlert) => {
    await onSubmit({
      values, hideLoader, setShowHideAlert, isValid: state.isValid
    })
  }

  const fieldParams = {
    'newpass': {
      onKeyUp: newPassOnChange,
    }
  }

  return (
    <>
      <Form
        ref={ref}
        className={className}
        formname={formName}
        items={formItemsCb(fieldParams)}
        onSubmit={onFormSubmitCb}
        loadingMessage={'Please wait'}
        errorMessage={'Please ensure all fields are filled.'}
        buttons={[
          {
            text: 'OK',
            role: 'cancel',
            cssClass: 'navyaPink'
          }
        ]}
      />

      <IonItem>
        <dl className="password-instructions">
        {
          passwordValidator.rulesMsgList.map((msg, index) => {
              const isCondnValid = (state.isValid !== null) && !!!state.errorMessages[msg];
              return (
                <dd className={cx({'active': isCondnValid})}>
                  <i
                    className={cx('icon fa', {'fa-check': isCondnValid, 'fa-times': !isCondnValid})}
                  />
                  <span>{msg}</span>
                </dd>
              )
          })
        }
        </dl>
      </IonItem>
    </>
  )
});

export default SetPwdInstructionsForm;
