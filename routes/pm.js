import * as UnitRoutes from './unit';

// PM Routes

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
  UnitRoutes.dashboard,
  UnitRoutes.accesserror
]

const getPMRoutes = () => {
  return { tabs, routes }
}

export default getPMRoutes;
