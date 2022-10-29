import * as UnitRoutes from './unit';

const tabs = [
    { ...UnitRoutes.dashboard, hideTabOptionCb: () => { return false } },
    UnitRoutes.settings
];
const routes = [
  ...tabs
];

const getAdminRoutes = () => {
  return {
    tabs, routes
  }
}

export default getAdminRoutes;
