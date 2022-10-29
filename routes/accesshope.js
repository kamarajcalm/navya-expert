import * as UnitRoutes from './unit';

// AccessHope Routes

const tabs = [
  UnitRoutes.home,
  // UnitRoutes.dashboard,
  // UnitRoutes.performance,
  UnitRoutes.surveys,
  UnitRoutes.settings
];

const routes = [
  ...tabs,
  UnitRoutes.surveydetails,
  // UnitRoutes.dashboard,
  UnitRoutes.accesserror
]

const getAccessHopeRoutes = () => {
  return { tabs, routes }
}

export default getAccessHopeRoutes;
