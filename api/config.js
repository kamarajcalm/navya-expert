
import { getEnvironment, isWeb } from '../utils';

const mobileAPIBaseURLs = {
  "local": "https://experts.bestopinions.us/napi3/",
  "dev": "https://experts.bestopinions.us/napi3/",
  "preprod": "https://experts.preproduction.navyanetwork.com/napi3/",
  "prod": "https://experts.navya.care/napi3/"
}

function getConfig() {

  /* Inside config.js file here */
  console.log('inside configjs file-- tested ! busint cache!');

  var environment = getEnvironment();

  let ServiceURL, tSubmitServiceURL, urlRoot;

  if (isWeb()) {
    if (environment === 'local')
      urlRoot = "https://experts.bestopinions.us/napi3/";
      // urlRoot = "http://0.0.0.0:8008/napi3/";
    else urlRoot = window.location.origin + "/napi3/";
  } else {
    urlRoot = mobileAPIBaseURLs[environment];
  }

  ServiceURL = `${urlRoot}webapi/`;
  tSubmitServiceURL = `${urlRoot}eos/eosResponse`;

  return {
    ServiceURL,
    tSubmitServiceURL,
    urlRoot
  }
}

export default getConfig;
