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
  UnitRoutes.dashboard,
  UnitRoutes.accesserror
]

const getMSKCCRoutes = () => {
  return { tabs, routes }
}

export default getMSKCCRoutes;
