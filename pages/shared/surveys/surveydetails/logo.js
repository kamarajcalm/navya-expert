
import * as Images from '../assets/images';

import { avatarStyles } from '../styles/avatars';

import { getReferrer, isWeb, isMobileApp, getQueryVariable} from '../utils';

const navyaLogoObj = {
  src: Images.navyaLogo,
  alt: 'navya-logo'
}

const tmcLogoObj = {
  src: Images.tmcLogo,
  alt: 'tmc-logo'
};

const apolloLogoObj = {
  src: Images.apolloLogo,
  alt: 'apollo-logo'
}

const mskccLogoObj = {
  src: Images.mskccLogo,
  alt: 'mskcc-logo'
}

const mskccLogoWhiteObj = {
  src:Images.mskccLogoWhite,
  alt: 'mskcc-logo'
}

const pmLogoObj = {
  src: Images.pmLogo,
  alt: 'pm-logo'
}

const pmLogoWhiteObj = {
  src:Images.pmLogoWhite,
  alt: 'uhn-logo'
}

const navyaLogos = [
  navyaLogoObj,
  tmcLogoObj,
  {
    src: Images.ncgLogo,
    alt: 'ncg-logo'
  },
  {
    src: Images.cankidsLogo,
    alt: 'cankids-logo'
  }
];

const apolloLogos = [ apolloLogoObj ];

const mskccLogos = [
  {
    src: Images.navyaLogoWhite,
    alt: 'navya-logo'
  },
  mskccLogoWhiteObj
];

const pmLogos = [
  {
    src: Images.navyaLogoWhite,
    alt: 'navya-logo'
  },
  !isWeb() && pmLogoWhiteObj
];

export const getLogos = (type=null) => {
  const referrer = getReferrer();
  let logoArr = null;
  switch(referrer) {
    case 'tmc':
    case 'navya':
    case 'cankids':
    case 'poem':
    case 'ncg':
      if (isWeb()) {
        logoArr = [...navyaLogos]
      } else {
        logoArr = [
          navyaLogoObj,
          {
            src: Images[`${localStorage.getItem('expertorg')}Logo`],
            alt: `${referrer}-logo`
          }
        ];
      }
      break;
    case 'apollo':
      logoArr = [...apolloLogos];
      break;
    case 'mskcc':
      logoArr = [...mskccLogos];
      break;
    case 'pm':
      logoArr = [...pmLogos];
      break;
  }

  return logoArr;
}

export const selectorScreenLogos = () => {
  return [
    {
      src: Images.tmcLogo,
      alt: 'tmc-logo',
      color: avatarStyles.tmc.color,
      referrer: 'tmc',
      type: 'tmc'
    },
    {
      src: Images.ncgLogo,
      alt: 'ncg-logo',
      color: '#15a91c',
      referrer: 'tmc',
      type: 'ncg'
    },
    {
      src: Images.mskccLogoSelector,
      alt: "mskcc-logo",
      color: avatarStyles.mskcc.color,
      referrer: "mskcc",
      type: 'mskcc'
    },
    {
      src: Images.uhnLogoSelector,
      alt: "pm-logo",
      color: avatarStyles.pm.color,
      referrer: "pm",
      type: 'pm'
    },
    {
      src: Images.cankidsLogo,
      alt: "cankids-logo",
      color: '#445f8f',
      referrer: "tmc",
      type: 'cankids'
    },
    {
      src: Images.poemLogo,
      bgcolor: "#fff",
      color: 'rgba(0, 0, 0, 0.75)',
      referrer: 'tmc',
      type: 'poem'
    },
  ]
}
