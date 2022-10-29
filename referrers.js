
import { getReferrer } from './utils';

export const isApollo = () => {
  const referrerType = getReferrer();
  if (referrerType && (referrerType === 'apollo' || referrerType === 'askapollo'))
  return true;
  if (window.location.href.indexOf('bestopinion.net') > -1)
  return true;
  return false;
}


export const isNavya = () => {
  const referrerType = getReferrer();
  if (referrerType && (referrerType === 'navya' || referrerType === 'tmc'))
  return true;
  return false;
}

export const isMSKCC = () => {
  const referrerType = getReferrer();
  if (referrerType && referrerType === 'mskcc')
  return true;
  return false;
}

export const isPM = () => {
  const referrerType = getReferrer();
  if (referrerType && referrerType === 'pm')
  return true;
  return false;
}

export const isAccessHope = () => {
  const referrerType = getReferrer();
  console.log('referrer',referrerType)
  if (referrerType && referrerType === 'accesshope')
  return true;
  return false;
}
