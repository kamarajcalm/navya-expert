import * as UnitRoutes from './unit';

const tabs = [
  UnitRoutes.home,
  UnitRoutes.dashboard,
  UnitRoutes.surveys,
  UnitRoutes.settings
];

const routes = [
  ...tabs,
  UnitRoutes.surveydetails,
  UnitRoutes.dashboard,
  UnitRoutes.accesserror
]

const getApolloRoutes = () => {
  return  {
    tabs, routes
  }
}

export default getApolloRoutes;
