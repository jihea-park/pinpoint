import { HelpPage, withInitialFetch } from '@pinpoint-fe/ui';
import {
  getLayoutWithConfiguration,
  getLayoutWithSideNavigation,
} from '@pinpoint-fe/web/components/Layout';

export default withInitialFetch(() =>
  getLayoutWithSideNavigation(getLayoutWithConfiguration(<HelpPage />)),
);
