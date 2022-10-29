import * as UnitRoutes from './unit';

const tabs = [
  UnitRoutes.home,
  UnitRoutes.dashboard,
  UnitRoutes.performance,
  UnitRoutes.surveys,
  UnitRoutes.settings
];

const routes = [
  ...tabs,
  UnitRoutes.surveydetails,
  UnitRoutes.alphasurveypreviewdetails,
  UnitRoutes.dashboard,
  UnitRoutes.accesserror
];

const getNavyaRoutes = () => {
  return {
    tabs, routes
  }
}

export default getNavyaRoutes;
