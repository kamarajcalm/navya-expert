import superagentPromise from 'superagent-promise';
import Promise from 'promise';
import TokenManager from './tokenManager';
import { errorHandler } from './errorHandler';
// import getConfig from './config';
import globalVars from '../globalVars';

// const API_HOST = `https://experts.bestopinions.us/napi2.0/`;
// const API_HOST = getConfig().urlRoot;
const tokenManager = new TokenManager();

const superagent = superagentPromise(require('superagent'), Promise);

/** Possible request options */
const requests = {
  post: async (url_extension, data, options, tokenHandler = tokenManager.emptyFormHandler) => {
      tokenHandler(data)
      const response = await superagent
        .post(`${globalVars.getApiHost()}${url_extension}`)
        .use(tokenManager.addHeaders.bind(this))
        .use(errorHandler)
        .field(data);

      if (response.header.token) {
        tokenManager.setTokenInResponse(response.header.token);
      }

      if (window.alertShownCounter === 1) window.alertShownCounter = 0;
      if(url_extension.includes('draft'))
       return response
      else
       return response.body;
  },
  post_html: async (url_extension, data, options, tokenHandler = tokenManager.emptyFormHandler) => {
      tokenHandler(data)
      console.log(data)
      const response = await superagent
        .post(`${globalVars.getApiHost()}${url_extension}`)
        .use(tokenManager.addHeaders.bind(this))
        .use(errorHandler)
        .field(data)
        .parse(({ text }) => text);

      if (response.header.token) {
        tokenManager.setTokenInResponse(response.header.token);
      }

      if (window.alertShownCounter === 1) window.alertShownCounter = 0;

      return response.body;
  },
  post_json: async (url_extension, data, options, tokenHandler = tokenManager.emptyFormHandler) => {
      tokenHandler(data)
      const response = await superagent
        .post(`${globalVars.getApiHost()}${url_extension}` , data)
        .use(tokenManager.addHeaders.bind(this))
        .use(errorHandler);

      if (response.header.token) {
        tokenManager.setTokenInResponse(response.header.token);
      }

      if (window.alertShownCounter === 1) window.alertShownCounter = 0;

      return response.body;
  }
};

export default requests;
