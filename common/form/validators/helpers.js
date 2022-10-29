
import { getValidationRulesUtils } from './messages';

const passwordValidator = {};

passwordValidator.minimumLength = (params, str) => {

  const { validationRulesUtils: { rulesMsgMap, ruleCndtns={}} } = params;

  const validationMessage = rulesMsgMap.minimumLength;

  let isValid = true;

  isValid =  (!!str && str.length >= ruleCndtns.minimumLength) ? true : validationMessage;

  return isValid;
}

passwordValidator.mustContainLetter = (params, str) => {

  const { validationRulesUtils } = params;

  const validationMessage = validationRulesUtils.rulesMsgMap.mustContainLetter;

  let isValid = true;

  let numberPat = /[a-zA-Z]+/i;

  isValid =  (!!str && numberPat.test(str)) ? true : validationMessage;

  return isValid;

}

passwordValidator.invalidCharacters = (params, str) => {

  const { validationRulesUtils } = params;

  const validationMessage = validationRulesUtils.rulesMsgMap.invalidCharacters;

  let isValid = true;

  let invalidCharsPat = /(\;|\<|\>|\\|\{|\}|\[|\]|\+|\=|\?|\&|\,|\:|\'|\"|\`)+/i;

  isValid =  (!!str && !invalidCharsPat.test(str)) ? true : validationMessage;

  return isValid;

}


passwordValidator.mustContainNumber = (params, str) => {

  const { validationRulesUtils } = params;

  const validationMessage = validationRulesUtils.rulesMsgMap.mustContainNumber;

  let isValid = true;

  let numberPat = /\d+/i;

  isValid =  (!!str && numberPat.test(str)) ? true : validationMessage;

  return isValid;

}

const validatePassword = (str, validationUtils, formKey='default') => {

  // const { validationRulesUtils } = params;

  const validationRulesUtils = validationUtils;

  const params = { validationRulesUtils };

  const validationRules = {};

  let isValid = true; let errorMessages = {};

  for (let validationRule in validationRulesUtils.rulesMsgMap) {
    let status = passwordValidator[validationRule](params, str);
    if (status !== true) {
      isValid = false;
      errorMessages[status] = true;
    }
  }

  return { isValid, errorMessages };

}


export default validatePassword;
