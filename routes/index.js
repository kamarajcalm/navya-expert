
import { isNavya, isApollo, isMSKCC, isPM, isAccessHope } from '../referrers';
import getNavyaRoutes from './navya';
import getApolloRoutes from './apollo';
import getMSKCCRoutes from './mskcc';
import getPMRoutes from './pm';
import getAccessHopeRoutes from './accesshope';
import getAdminRoutes from './admin';
import { hasOnlySurveyAccess, hasOnlyDashboardAccess, hasSurveyAndDashboardAccess } from '../utils';

const getLoggedInRoutes = () => {

  if (hasOnlyDashboardAccess()) {
    return getAdminRoutes();
  }

  if (isNavya()) {
    return getNavyaRoutes();
  } else if(isApollo()) {
    return getApolloRoutes();
  } else if(isMSKCC()) {
    return getMSKCCRoutes();
  } else if(isPM()){
    return getPMRoutes();
  } else if(isAccessHope()){
    return getAccessHopeRoutes();
  }
  return getNavyaRoutes();
};

export default getLoggedInRoutes;
