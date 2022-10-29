import { IonIcon } from '@ionic/react';
import Login from '../pages/shared/login';
import SelectorScreen from '../pages/shared/selector';
import Home from '../pages/shared/home';
import Performance from '../pages/shared/performance';
import Surveys from '../pages/shared/surveys';
import SurveyDetails from '../pages/shared/surveys/surveydetails';
import AlphaSurveyPreviewDetails from '../pages/shared/surveys/surveydetails/alphasurveypreview';
import Settings from '../pages/shared/settings';
import ResetPassword from '../pages/shared/settings/resetpassword';
import SetPassword from '../pages/shared/settings/setpassword';
import Dashboard from '../pages/shared/dashboard';
import AccessError from '../pages/shared/accesserror';
import Error404 from '../pages/shared/error404';
import {
  displayDashboardTabOption, hasDashboardAccess, hasSurveyAccess,
} from '../utils';
import { getAvatarStyles } from '../styles/avatars';
import { isAccessHope } from '../referrers';

const login =  {
  path: "/login",
  component: Login,
  exact: true
};

const selector =  {
  path: "/selector",
  component: SelectorScreen,
  exact: true
};

const home =  {
  path: "/user/home",
  exact: true,
  label: "Home",
  icon: "navya-icon-home",
  component: Home
};

const performance =   {
  path: "/user/performance",
  exact: true,
  label: "Performance",
  icon: "navya-icon-performance",
  component: Performance
}

const surveys =  {
  path: "/user/surveys",
  exact: true,
  label: isAccessHope() ? "Cases" : "Surveys",
  icon: "navya-icon-surveys",
  component: Surveys,
  hasPermission: () => { return hasSurveyAccess(); }
}

const surveydetails =  {
  path: "/user/surveys/:surveyid",
  exact: true,
  label: "Surveys",
  icon: "navya-icon-surveys",
  component: SurveyDetails,
  hasPermission: () => { return hasSurveyAccess(); }
}

const alphasurveypreviewdetails =  {
  path: "/user/alphasurveypreview/:medicalcaseid/:eosid",
  exact: true,
  label: "Surveys",
  icon: "navya-icon-surveys",
  component: AlphaSurveyPreviewDetails,
  // component: SurveyDetails,
}


const settings =   {
  path: "/user/settings",
  exact: true,
  label: "Settings",
  icon: "navya-icon-settings",
  component: Settings
}

const resetpassword =   {
  path: "/resetpassword",
  exact: true,
  component: ResetPassword
}

const setpassword =   {
  path: "/setpassword",
  exact: true,
  component: SetPassword
}

const dashboard =   {
  path: "/user/dashboard",
  exact: true,
  label: "Dashboard",
  hideTabOptionCb: () => {return displayDashboardTabOption()},
  icon: 'ion-arrow-graph-up-right',
  component: Dashboard,
  hasPermission: () => { return hasDashboardAccess(); }
}

const accesserror =   {
  path: "/user/accesserror",
  exact: true,
  component: AccessError
}

const error404 = {
  path: "/404",
  exact: true,
  component: Error404
}

export {
  home,
  performance,
  surveys,
  settings,
  login,
  selector,
  surveydetails,
  alphasurveypreviewdetails,
  resetpassword,
  setpassword,
  dashboard,
  accesserror,
  error404
};
